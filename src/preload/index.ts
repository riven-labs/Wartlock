import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    // Electron related
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)

    // Database related
    contextBridge.exposeInMainWorld('dbAPI', {
      getWallets: () => ipcRenderer.invoke('getWallets'),
      getWalletByAddress: (address: string) =>
        ipcRenderer.invoke('getWalletByAddress', address),
      getWalletById: (id: number) => ipcRenderer.invoke('getWalletById', id),
      insertWallet: (
        name: string,
        address: string,
        pk: string,
        salt: string,
        lastBalance?: string,
      ) =>
        ipcRenderer.invoke(
          'insertWallet',
          name,
          address,
          pk,
          salt,
          lastBalance,
        ),
      updateBalance: (address: string, balance: string) =>
        ipcRenderer.invoke('updateBalance', address, balance),
      deleteWallet: (address: string) =>
        ipcRenderer.invoke('deleteWallet', address),
      updatePeer: (peer: string) => ipcRenderer.invoke('updatePeer', peer),
      getPeer: () => ipcRenderer.invoke('getPeer'),
      getPublicNodes: () => ipcRenderer.invoke('getPublicNodes'),
      pickWalletDbFile: () => ipcRenderer.invoke('pickWalletDbFile'),
      importWalletsFromDb: (dbPath: string, password: string) =>
        ipcRenderer.invoke('importWalletsFromDb', dbPath, password),
    })

    // Crypto related
    contextBridge.exposeInMainWorld('cryptoAPI', {
      encryptPrivateKey: (pk: string, password: string) =>
        ipcRenderer.invoke('encryptPrivateKey', pk, password),
      decryptPrivateKey: (encrypted: string, password: string, salt: string) =>
        ipcRenderer.invoke('decryptPrivateKey', encrypted, password, salt),
    })

    // Storage related
    contextBridge.exposeInMainWorld('storageAPI', {
      storePrivateKey: (address: string, privateKey: string) =>
        ipcRenderer.invoke('storePrivateKey', address, privateKey),
      getPrivateKey: (address: string) =>
        ipcRenderer.invoke('getPrivateKey', address),
      deletePrivateKey: (address: string) =>
        ipcRenderer.invoke('deletePrivateKey', address),
    })

    // Mnemo related
    contextBridge.exposeInMainWorld('mnemoAPI', {
      generateMnemonic: (strength: 256 | 128 | 160 | 192 | 224 = 256) =>
        ipcRenderer.invoke('generateMnemonic', strength),
      mnemonicToSeed: (mnemonic: string, passphrase: string = '') =>
        ipcRenderer.invoke('mnemonicToSeed', mnemonic, passphrase),
    })

    // Hardware info
    contextBridge.exposeInMainWorld('hardwareAPI', {
      get: () => ipcRenderer.invoke('hardware:get'),
    })

    // Miner related
    contextBridge.exposeInMainWorld('minerAPI', {
      pickBinary: () => ipcRenderer.invoke('miner:pickBinary'),
      getStoredBinary: () => ipcRenderer.invoke('miner:getStoredBinary'),
      defaultVersion: () => ipcRenderer.invoke('miner:defaultVersion'),
      download: (version?: string | null) =>
        ipcRenderer.invoke('miner:download', version),
      getState: () => ipcRenderer.invoke('miner:state'),
      start: (config: unknown, options: unknown) =>
        ipcRenderer.invoke('miner:start', config, options),
      stop: () => ipcRenderer.invoke('miner:stop'),
      setDonation: (enabled: boolean) =>
        ipcRenderer.invoke('miner:setDonation', enabled),
      onDownloadProgress: (cb: (p: unknown) => void) => {
        const listener = (_: unknown, data: unknown): void => cb(data)
        ipcRenderer.on('miner:download-progress', listener)
        return () =>
          ipcRenderer.removeListener('miner:download-progress', listener)
      },
      onState: (cb: (s: unknown) => void) => {
        const listener = (_: unknown, data: unknown): void => cb(data)
        ipcRenderer.on('miner:state', listener)
        return () => ipcRenderer.removeListener('miner:state', listener)
      },
      onLog: (cb: (line: unknown) => void) => {
        const listener = (_: unknown, data: unknown): void => cb(data)
        ipcRenderer.on('miner:log', listener)
        return () => ipcRenderer.removeListener('miner:log', listener)
      },
      onStats: (cb: (stats: unknown) => void) => {
        const listener = (_: unknown, data: unknown): void => cb(data)
        ipcRenderer.on('miner:stats', listener)
        return () => ipcRenderer.removeListener('miner:stats', listener)
      },
      onExit: (cb: (payload: { code: number | null }) => void) => {
        const listener = (_: unknown, data: { code: number | null }): void =>
          cb(data)
        ipcRenderer.on('miner:exit', listener)
        return () => ipcRenderer.removeListener('miner:exit', listener)
      },
      onStarted: (
        cb: (payload: { pid: number; startedAt: number }) => void,
      ) => {
        const listener = (
          _: unknown,
          data: { pid: number; startedAt: number },
        ): void => cb(data)
        ipcRenderer.on('miner:started', listener)
        return () => ipcRenderer.removeListener('miner:started', listener)
      },
    })

    // Wallet related
    contextBridge.exposeInMainWorld('walletAPI', {
      walletFromSeed: (seed: string) =>
        ipcRenderer.invoke('walletFromSeed', seed),
      walletFromPkHex: (pkHex: string) =>
        ipcRenderer.invoke('walletFromPkHex', pkHex),
      getWalletTransactions: (address: string) =>
        ipcRenderer.invoke('getWalletTransactions', address),
      getBalance: (peerUrl: string, address: string) =>
        ipcRenderer.invoke('getBalance', peerUrl, address),
      fetchWarthogPrice: () => ipcRenderer.invoke('fetchWarthogPrice'),
      fetchWarthogMarket: () => ipcRenderer.invoke('fetchWarthogMarket'),
      fetchWarthogPriceHistory: (days: number) =>
        ipcRenderer.invoke('fetchWarthogPriceHistory', days),
      sendTransaction: (
        recipient: string,
        amount: number,
        fee: number,
        privateKey: string,
        peerUrl: string,
      ) =>
        ipcRenderer.invoke(
          'sendTransaction',
          recipient,
          amount,
          fee,
          privateKey,
          peerUrl,
        ),
      // walletFromPrivateKey: (pkHex: string) => ipcRenderer.invoke("walletFromPrivateKey", pkHex),
      // addressFromPublicKey: (pubKey: string) => ipcRenderer.invoke("addressFromPublicKey", pubKey),
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
