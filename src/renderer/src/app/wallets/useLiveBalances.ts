import { useRequest } from 'ahooks'
import { useEffect, useRef, useState } from 'react'
import type { Wallet } from './types'

export type BalanceEntry = {
  /** WART balance from most recent poll. null until first fetch finishes. */
  current: number | null
  /** Previous value, used to compute the delta ring/indicator. */
  previous: number | null
}

export type LiveBalances = {
  balances: Record<string, BalanceEntry>
  priceUsd: number
  refreshing: boolean
  lastUpdated: number | null
  peerReachable: boolean | null
  peer: string
}

const POLL_INTERVAL = 30_000

/**
 * Polls the on-chain balance of every wallet on a single shared interval and
 * tracks the previous value so callers can render a delta indicator. The
 * polling is silent — callers see the values flip, not a spinner.
 */
export function useLiveBalances(wallets: Wallet[]): LiveBalances {
  const [balances, setBalances] = useState<Record<string, BalanceEntry>>({})
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [peerReachable, setPeerReachable] = useState<boolean | null>(null)
  const [peer, setPeer] = useState<string>('')
  const addressesKey = wallets.map((w) => w.address).join(',')
  const prevRef = useRef<Record<string, number>>({})

  const { data: priceUsd = 0, loading: priceLoading } = useRequest(
    () => window.walletAPI.fetchWarthogPrice(),
    {
      cacheKey: 'wart-price-simple',
      pollingInterval: 5 * 60_000,
      staleTime: 5 * 60_000,
    },
  )

  const { loading } = useRequest(
    async () => {
      if (wallets.length === 0) return
      const peerUrl = await window.dbAPI.getPeer()
      setPeer(peerUrl)

      const results = await Promise.all(
        wallets.map(async (w) => {
          const raw = await window.walletAPI.getBalance(peerUrl, w.address)
          return { address: w.address, raw }
        }),
      )

      // If every call returned null we can assume the peer is unreachable.
      // If at least one came back with data the peer is fine — an address
      // with no on-chain activity legitimately returns null.
      const anySucceeded = results.some((r) => r.raw != null)
      setPeerReachable(anySucceeded)

      for (const { address, raw } of results) {
        const n = raw != null ? parseFloat(raw) : NaN
        if (Number.isNaN(n)) continue
        const prev = prevRef.current[address] ?? n
        prevRef.current[address] = n
        setBalances((map) => ({
          ...map,
          [address]: { current: n, previous: prev },
        }))
        await window.dbAPI.updateBalance(address, String(n))
      }

      setLastUpdated(Date.now())
    },
    {
      ready: wallets.length > 0,
      refreshDeps: [addressesKey],
      pollingInterval: POLL_INTERVAL,
    },
  )

  // Seed prev state from DB last_balance so the first render shows something,
  // then the first fetch populates current. Avoids a flash of "—".
  useEffect(() => {
    setBalances((map) => {
      const next = { ...map }
      for (const w of wallets) {
        if (next[w.address]) continue
        const fromDb = parseFloat(String(w.last_balance))
        if (!Number.isNaN(fromDb)) {
          next[w.address] = { current: fromDb, previous: fromDb }
        }
      }
      return next
    })
  }, [addressesKey])

  return {
    balances,
    priceUsd,
    refreshing: loading || priceLoading,
    lastUpdated,
    peerReachable,
    peer,
  }
}
