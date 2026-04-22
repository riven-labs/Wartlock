import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    dbAPI: {
      getWallets: () => Promise
      getWalletByAddress: (address: string) => Promise
      getWalletById: (id: number) => Promise
      insertWallet: (
        name: string,
        address: string,
        encrypted: string,
        salt: string,
        lastBalance?: string,
      ) => Promise<void>
      updateBalance: (address: string, balance: string) => Promise<void>
      deleteWallet: (address: string) => Promise<void>
      updatePeer: (peer: string) => Promise<void>
      getPeer: () => Promise<string>
      getPublicNodes: () => Promise<Array<{ label: string; url: string }>>
      pickWalletDbFile: () => Promise<string | null>
      importWalletsFromDb: (
        dbPath: string,
        password: string,
      ) => Promise<{
        total: number
        decrypted: Array<{
          name: string
          address: string
          pk: string
          salt: string
          last_balance: string | null
          plaintextPk: string
        }>
      }>
    }
    cryptoAPI: {
      encryptPrivateKey: (
        pk: string,
        password: string,
      ) => Promise<{ encrypted: string; salt: string }>
      decryptPrivateKey: (
        encrypted: string,
        password: string,
        salt: string,
      ) => Promise<string | null>
    }
    storageAPI: {
      storePrivateKey: (address: string, privateKey: string) => Promise<void>
      getPrivateKey: (address: string) => Promise<string | null>
      deletePrivateKey: (address: string) => Promise<void>
    }
    mnemoAPI: {
      generateMnemonic: (
        strength: 256 | 128 | 160 | 192 | 224 = 256,
      ) => Promise<string>
      mnemonicToSeed: (mnemonic: string, passphrase: string = '') => Promise
    }
    hardwareAPI: {
      get: () => Promise<{
        os: {
          platform: string
          distro: string
          release: string
          arch: string
          hostname: string
          kernel: string
        }
        cpu: {
          manufacturer: string
          brand: string
          speedGHz: number
          physicalCores: number
          cores: number
          cacheL3KB: number | null
          temperatureC: number | null
          family: string | null
        }
        memory: {
          totalBytes: number
          availableBytes: number
          swapTotalBytes: number
          sticks: Array<{
            sizeBytes: number
            type: string | null
            speedMHz: number | null
            manufacturer: string | null
          }>
        }
        gpus: Array<{
          vendor: string | null
          model: string
          vramBytes: number | null
          driverVersion: string | null
          temperatureC: number | null
          utilizationGpu: number | null
          memoryUsedBytes: number | null
        }>
        disks: Array<{
          name: string | null
          type: string | null
          sizeBytes: number | null
          vendor: string | null
        }>
      }>
    }
    minerAPI: {
      pickBinary: () => Promise<string | null>
      getStoredBinary: () => Promise<string | null>
      defaultVersion: () => Promise<string>
      download: (
        version?: string | null,
      ) => Promise<{ binaryPath: string; version: string }>
      getState: () => Promise<{
        running: boolean
        startedAt: number | null
        pid: number | null
        config: {
          binaryPath: string
          algo: string
          pool: string
          walletAddress: string
          worker: string
          extraArgs: string
        } | null
        options: {
          sessionMinutes?: number | null
          donation?: boolean
          intensity?: 'eco' | 'balanced' | 'performance' | 'custom'
        }
        mode: 'user' | 'donation'
        nextSwapAt: number | null
        autoStopAt: number | null
        stats: {
          hashrateHps: number | null
          unit: string | null
          accepted: number | null
          rejected: number | null
          gpus: number | null
          lastUpdate: number
        }
        logs: Array<{
          ts: number
          stream: 'stdout' | 'stderr' | 'system'
          text: string
        }>
        lastExitCode: number | null
      }>
      start: (
        config: {
          binaryPath: string
          algo: string
          pool: string
          walletAddress: string
          worker: string
          extraArgs: string
        },
        options: {
          sessionMinutes?: number | null
          donation?: boolean
          intensity?: 'eco' | 'balanced' | 'performance' | 'custom'
        },
      ) => Promise<unknown>
      stop: () => Promise<unknown>
      setDonation: (enabled: boolean) => Promise<unknown>
      onLog: (
        cb: (line: {
          ts: number
          stream: 'stdout' | 'stderr' | 'system'
          text: string
        }) => void,
      ) => () => void
      onStats: (
        cb: (stats: {
          hashrateHps: number | null
          unit: string | null
          accepted: number | null
          rejected: number | null
          gpus: number | null
          lastUpdate: number
        }) => void,
      ) => () => void
      onExit: (cb: (payload: { code: number | null }) => void) => () => void
      onStarted: (
        cb: (payload: { pid: number; startedAt: number }) => void,
      ) => () => void
      onDownloadProgress: (
        cb: (p: {
          phase: 'resolving' | 'downloading' | 'extracting' | 'done' | 'failed'
          percent: number
          note?: string
        }) => void,
      ) => () => void
      onState: (cb: (state: unknown) => void) => () => void
    }
    walletAPI: {
      walletFromSeed: (
        seed: string,
      ) => Promise<{ address: string; privateKey: string }>
      walletFromPkHex: (
        pkHex: string,
      ) => Promise<{ address: string; privateKey: string }>
      getWalletTransactions: (address: string) => Promise
      getBalance: (peerUrl: string, address: string) => Promise<string | null>
      fetchWarthogPrice: () => Promise<number>
      fetchWarthogMarket: () => Promise<{
        priceUsd: number
        change24hPct: number | null
        change7dPct: number | null
        volume24h: number | null
        marketCap: number | null
        high24h: number | null
        low24h: number | null
        ath: number | null
        athChangePct: number | null
      } | null>
      fetchWarthogPriceHistory: (
        days: number,
      ) => Promise<Array<{ t: number; p: number }>>
      sendTransaction: (
        recipient: string,
        amount: number,
        fee: number,
        privateKey: string,
        peerUrl: string,
      ) => Promise
      // walletFromPrivateKey: (pkHex: string) => Promise<any>
      // addressFromPublicKey: (pubKey: string) => Promise<any>
    }
  }
}
