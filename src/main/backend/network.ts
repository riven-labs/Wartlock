import axios from 'axios'
import { createHash } from 'crypto'
import ecPkg from 'elliptic'

const { ec: EC } = ecPkg
const ec = new EC('secp256k1')

type BalanceResponse = {
  code: number
  data: {
    accountId: number
    address: string
    balance: string
    balanceE8: number
  }
}

export async function sendTransaction(
  recipient: string,
  amount: number,
  fee: number,
  privateKey: string,
  peerUrl: string,
): Promise<unknown | null> {
  try {
    const normalizedUrl = peerUrl.replace(/\/+$/, '')

    // Validate private key (must be 64 hex characters)
    if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error(
        'Invalid private key format. Must be a 64-character hex string.',
      )
    }

    // Fetch pinHash and pinHeight
    const { data: headData } = await axios.get(`${normalizedUrl}/chain/head`)
    if (!headData.data || !headData.data.pinHash || !headData.data.pinHeight) {
      throw new Error('Invalid response from chain head.')
    }
    const pinHash = headData.data.pinHash
    const pinHeight = headData.data.pinHeight

    // Generate unique nonceId
    const nonceId = Math.floor(Math.random() * 4294967295)

    // Ensure amountE8 and feeE8 are integers
    const amountE8 = Math.round(amount * 10 ** 8)
    const roundedFeeE8 = Math.round(fee * 10 ** 8)
    const { data: feeResponse } = await axios.get(
      `${normalizedUrl}/tools/encode16bit/from_e8/${String(roundedFeeE8)}`,
    )
    if (!feeResponse.data || feeResponse.data.roundedE8 === undefined) {
      throw new Error('Invalid fee rounding response.')
    }
    const feeE8 = Math.round(feeResponse.data.roundedE8)

    // Generate bytes to sign
    const buf1 = Buffer.from(pinHash, 'hex')
    const buf2 = Buffer.alloc(19)
    buf2.writeUInt32BE(pinHeight, 0)
    buf2.writeUInt32BE(nonceId, 4)
    buf2.writeUInt8(0, 8)
    buf2.writeUInt8(0, 9)
    buf2.writeUInt8(0, 10)
    buf2.writeBigUInt64BE(BigInt(feeE8), 11)
    const buf3 = Buffer.from(recipient, 'hex').subarray(0, 20)
    const buf4 = Buffer.alloc(8)
    buf4.writeBigUInt64BE(BigInt(amountE8), 0)
    const toSign = Buffer.concat([buf1, buf2, buf3, buf4])

    // Hash transaction data
    const digest = createHash('sha256').update(toSign).digest()

    // Sign transaction
    const keyPair = ec.keyFromPrivate(privateKey, 'hex')
    const signed = keyPair.sign(digest, { canonical: true })

    if (!signed) {
      throw new Error('Failed to sign transaction. Check private key.')
    }

    let recid = signed.recoveryParam ?? 0
    const r = signed.r.toArrayLike(Buffer, 'be', 32)
    const s = signed.s.toArrayLike(Buffer, 'be', 32)
    if (signed.s.cmp(ec.curve.n.shrn(1)) > 0) {
      recid ^= 1
    }
    const recidBuffer = Buffer.alloc(1)
    recidBuffer.writeUInt8(recid)
    const signature65 = Buffer.concat([r, s, recidBuffer])

    // Submit transaction
    const transaction = {
      pinHeight,
      nonceId,
      toAddr: recipient,
      amountE8,
      feeE8,
      signature65: signature65.toString('hex'),
    }

    const { data: response } = await axios.post(
      `${normalizedUrl}/transaction/add`,
      transaction,
    )
    console.log('Transaction sent:', response)
    return response
  } catch (error) {
    console.error('Transaction failed:', error)
    return null
  }
}

export async function getBalance(
  peerUrl: string,
  address: string,
): Promise<string | null> {
  try {
    // Normalize URL: Remove trailing slash (but keep 'https://')
    const normalizedUrl = peerUrl.replace(/\/+$/, '')
    const response = await axios.get<BalanceResponse>(
      `${normalizedUrl}/account/${address}/balance`,
    )

    if (response.data.code === 0) {
      return response.data.data.balance
    }
    return null
  } catch (error) {
    console.error('Error fetching balance:', error)
    return null
  }
}

/**
 * Tiny TTL cache for CoinGecko responses. The free-tier rate limit bites fast
 * if every wallet detail + dashboard mount refetches, so we share one cached
 * payload across all renderers and only hit the network once per window.
 */
type CacheEntry<T> = { value: T; ts: number }
const cache = new Map<string, CacheEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

async function memo<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const hit = cache.get(key) as CacheEntry<T> | undefined
  if (hit && now - hit.ts < ttlMs) return hit.value

  const running = inflight.get(key) as Promise<T> | undefined
  if (running) return running

  const p = (async () => {
    try {
      const value = await fn()
      cache.set(key, { value, ts: Date.now() })
      return value
    } finally {
      inflight.delete(key)
    }
  })()
  inflight.set(key, p)
  return p
}

export async function fetchWarthogPrice(): Promise<number> {
  return memo('wart-price', 5 * 60_000, async () => {
    try {
      const { data } = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=warthog&vs_currencies=usd',
        { timeout: 10_000 },
      )
      return (data?.warthog?.usd as number) || 0
    } catch {
      return 0
    }
  })
}

export type WarthogMarket = {
  priceUsd: number
  change24hPct: number | null
  change7dPct: number | null
  volume24h: number | null
  marketCap: number | null
  high24h: number | null
  low24h: number | null
  ath: number | null
  athChangePct: number | null
}

export async function fetchWarthogMarket(): Promise<WarthogMarket | null> {
  return memo('wart-market', 5 * 60_000, async () => {
    try {
      const { data } = await axios.get(
        'https://api.coingecko.com/api/v3/coins/warthog?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false',
        { timeout: 10_000 },
      )
      const m = data?.market_data || {}
      return {
        priceUsd: m.current_price?.usd ?? 0,
        change24hPct: m.price_change_percentage_24h ?? null,
        change7dPct: m.price_change_percentage_7d ?? null,
        volume24h: m.total_volume?.usd ?? null,
        marketCap: m.market_cap?.usd ?? null,
        high24h: m.high_24h?.usd ?? null,
        low24h: m.low_24h?.usd ?? null,
        ath: m.ath?.usd ?? null,
        athChangePct: m.ath_change_percentage?.usd ?? null,
      } satisfies WarthogMarket
    } catch {
      return null
    }
  })
}

export async function fetchWarthogPriceHistory(
  days = 7,
): Promise<Array<{ t: number; p: number }>> {
  return memo(`wart-history-${days}`, 15 * 60_000, async () => {
    try {
      const { data } = await axios.get(
        `https://api.coingecko.com/api/v3/coins/warthog/market_chart?vs_currency=usd&days=${days}`,
        { timeout: 10_000 },
      )
      const prices: Array<[number, number]> = data?.prices || []
      return prices.map(([t, p]) => ({ t, p }))
    } catch {
      return []
    }
  })
}

// https://wartscan.io/api/v1/accounts/transactions?address=aca4916c89b8fb47784d37ad592d378897f616569d3ee0d4
export async function getWalletTransactions(
  address: string,
): Promise<unknown[]> {
  try {
    const url = `https://wartscan.io/api/v1/accounts/transactions?address=${address}`
    try {
      const response = await axios.get(url)

      if (response.status === 400) {
        return []
      }

      return response.data
    } catch (requestError) {
      console.error('Request error fetching wallet transactions:', requestError)
      return []
    }
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    return []
  }
}
