import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { removeConsoleLogs } from './utils/remove-console-logs'

import { decryptPrivateKey, encryptPrivateKey } from './backend/crypto'
import { WalletDB } from './backend/db'
import {
  DEFAULT_BZMINER_VERSION,
  downloadBzminer,
  getStoredBzminerPath,
} from './backend/downloader'
import { getHardwareSnapshot } from './backend/hardware'
import { decryptExternalWallets, readExternalWallets } from './backend/importDb'
import {
  getState as getMinerState,
  setDonation,
  startMiner,
  stopMiner,
  type MinerConfig,
  type MinerOptions,
} from './backend/miner'
import { generateMnemonic, mnemonicToSeed } from './backend/mnemo'
import {
  fetchWarthogMarket,
  fetchWarthogPrice,
  fetchWarthogPriceHistory,
  getBalance,
  getWalletTransactions,
  sendTransaction,
} from './backend/network'
import { PUBLIC_NODES } from './backend/nodes'
import {
  deletePrivateKey,
  getPrivateKey,
  storePrivateKey,
} from './backend/storage'
import { walletFromPkHex, walletFromSeed } from './backend/wallet'

removeConsoleLogs()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const win = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 768,
    minHeight: 600,
    darkTheme: true,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  })
  mainWindow = win
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Database related
  ipcMain.handle('getWallets', () => WalletDB.getWallets())
  ipcMain.handle('getWalletByAddress', (_, address) =>
    WalletDB.getWalletByAddress(address),
  )
  ipcMain.handle('getWalletById', (_, id) => WalletDB.getWalletById(id))
  ipcMain.handle('insertWallet', (_, name, address, pk, salt, lastBalance) =>
    WalletDB.insertWallet(name, address, pk, salt, lastBalance),
  )
  ipcMain.handle('updateBalance', (_, address, balance) =>
    WalletDB.updateBalance(address, balance),
  )
  ipcMain.handle('deleteWallet', (_, address) => WalletDB.deleteWallet(address))
  ipcMain.handle('updatePeer', (_, peer) => WalletDB.updatePeer(peer))
  ipcMain.handle('getPeer', () => WalletDB.getPeer())

  // Crypto related
  ipcMain.handle('encryptPrivateKey', (_, pk, password) =>
    encryptPrivateKey(pk, password),
  )
  ipcMain.handle('decryptPrivateKey', (_, encrypted, password, salt) =>
    decryptPrivateKey(encrypted, password, salt),
  )

  // Storage related
  ipcMain.handle('storePrivateKey', (_, address, privateKey) =>
    storePrivateKey(address, privateKey),
  )
  ipcMain.handle('getPrivateKey', (_, address) => getPrivateKey(address))
  ipcMain.handle('deletePrivateKey', (_, address) => deletePrivateKey(address))

  // Mnemo related
  ipcMain.handle('generateMnemonic', (_, strength) =>
    generateMnemonic(strength),
  )
  ipcMain.handle('mnemonicToSeed', (_, mnemonic, passphrase) =>
    mnemonicToSeed(mnemonic, passphrase),
  )

  // Wallet related
  ipcMain.handle('walletFromSeed', (_, seed) => walletFromSeed(seed))
  ipcMain.handle('walletFromPkHex', (_, pkHex) => walletFromPkHex(pkHex))
  ipcMain.handle('getWalletTransactions', (_, address) =>
    getWalletTransactions(address),
  )
  ipcMain.handle('getBalance', (_, peerUrl, address) =>
    getBalance(peerUrl, address),
  )
  ipcMain.handle('fetchWarthogPrice', () => fetchWarthogPrice())
  ipcMain.handle('fetchWarthogMarket', () => fetchWarthogMarket())
  ipcMain.handle('fetchWarthogPriceHistory', (_, days) =>
    fetchWarthogPriceHistory(days),
  )
  ipcMain.handle(
    'sendTransaction',
    (_, recipient, amount, fee, privateKey, peerUrl) =>
      sendTransaction(recipient, amount, fee, privateKey, peerUrl),
  )

  // Public nodes list (for settings picker)
  ipcMain.handle('getPublicNodes', () => PUBLIC_NODES)

  // External DB import
  ipcMain.handle('pickWalletDbFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Wartlock wallet database',
      filters: [
        {
          name: 'SQLite / Wartlock DB',
          extensions: ['db', 'sqlite', 'sqlite3'],
        },
        { name: 'All files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })
  ipcMain.handle(
    'importWalletsFromDb',
    (_, dbPath: string, password: string) => {
      const rows = readExternalWallets(dbPath)
      const decrypted = decryptExternalWallets(rows, password)
      return { total: rows.length, decrypted }
    },
  )

  // --- Miner ---------------------------------------------------------------
  ipcMain.handle('miner:pickBinary', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select bzminer binary',
      filters:
        process.platform === 'win32'
          ? [
              { name: 'Executable', extensions: ['exe'] },
              { name: 'All files', extensions: ['*'] },
            ]
          : [{ name: 'All files', extensions: ['*'] }],
      properties: ['openFile'],
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })
  ipcMain.handle('miner:state', () => getMinerState())
  ipcMain.handle(
    'miner:start',
    (_, config: MinerConfig, options: MinerOptions = {}) =>
      startMiner(mainWindow, config, options),
  )
  ipcMain.handle('miner:stop', async () => {
    await stopMiner()
    return getMinerState()
  })
  ipcMain.handle('miner:setDonation', (_, enabled: boolean) => {
    setDonation(mainWindow, enabled)
    return getMinerState()
  })
  ipcMain.handle('miner:getStoredBinary', () => getStoredBzminerPath())

  // Hardware introspection for the Hardware page
  ipcMain.handle('hardware:get', () => getHardwareSnapshot())
  ipcMain.handle('miner:defaultVersion', () => DEFAULT_BZMINER_VERSION)
  ipcMain.handle('miner:download', async (_, version?: string | null) => {
    // If the miner is running, the existing .exe would be locked on Windows
    // and the archive extraction would fail mid-way. Stop it first and give
    // the OS a beat to release the handle.
    if (getMinerState().running) {
      // Now awaits real exit (taskkill /F /T + wait for exit event), so by
      // the time we start extracting, Windows has released the .exe handle.
      await stopMiner()
    }
    return downloadBzminer(mainWindow, version ?? null)
  })
  // ipcMain.handle("walletFromPrivateKey", (_, pkHex) => walletFromPrivateKey(pkHex));
  // ipcMain.handle("addressFromPublicKey", (_, pubKey) => addressFromPublicKey(pubKey));

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
// IPC Handlers
