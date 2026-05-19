const path = require('node:path')
const { app, BrowserWindow, Tray, Menu } = require('electron')
const { registerIpc } = require('./ipc.cjs')
const { startBackgroundService, stopBackgroundService } = require('./background.cjs')
const {
  applyWindowsAppIdentity,
  windowIconOptions,
  applyWindowIcon,
  trayIcon,
  notificationIconPath,
} = require('./icon.cjs')

applyWindowsAppIdentity()

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

let tray = null
let mainWindow = null
let isQuitting = false

app.setName('GarageLedger')
try {
  app.name = 'GarageLedger'
} catch {}
process.title = 'GarageLedger'
try {
  app.setPath('userData', path.join(app.getPath('appData'), 'GarageLedger'))
} catch {}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createTray() {
  if (tray) return tray
  const icon = trayIcon()
  tray = new Tray(icon)
  tray.setToolTip('GarageLedger')
  const menu = Menu.buildFromTemplate([
    { label: 'GarageLedger', enabled: false },
    { type: 'separator' },
    { label: 'Show', click: () => showMainWindow() },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])
  tray.setContextMenu(menu)
  tray.on('double-click', () => showMainWindow())
  return tray
}

function createSplashWindow() {
  const win = new BrowserWindow({
    width: 440,
    height: 220,
    resizable: false,
    movable: true,
    frame: false,
    transparent: false,
    backgroundColor: '#FAFAFA',
    show: true,
    alwaysOnTop: true,
    ...windowIconOptions(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.loadFile(path.join(__dirname, 'splash.html'))
  applyWindowIcon(win)
  return win
}

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1240,
    height: 780,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#FAFAFA',
    title: 'GarageLedger',
    autoHideMenuBar: true,
    ...windowIconOptions(),
    titleBarOverlay: {
      color: '#FAFAFA',
      symbolColor: '#111827',
      height: 42,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  applyWindowIcon(win)

  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    await win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  }

  win.once('ready-to-show', () => {
    applyWindowIcon(win)
    win.show()
  })

  win.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    win.hide()
    if (tray && !tray.isDestroyed()) {
      tray.displayBalloon({
        title: 'GarageLedger',
        content: 'Running in the background. Double-click the tray icon to reopen.',
        iconType: 'info',
      })
    }
  })

  return win
}

app.whenReady().then(async () => {
  registerIpc({ isDev })

  const startedAt = Date.now()
  const splash = createSplashWindow()

  mainWindow = await createMainWindow()
  createTray()
  startBackgroundService({ icon: notificationIconPath() })

  mainWindow.once('ready-to-show', () => {
    const elapsed = Date.now() - startedAt
    const remaining = Math.max(0, 3000 - elapsed)
    setTimeout(() => {
      if (!splash.isDestroyed()) splash.close()
    }, remaining)
  })

  app.on('activate', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      mainWindow = await createMainWindow()
    } else {
      showMainWindow()
    }
  })
})

app.on('before-quit', () => {
  isQuitting = true
  stopBackgroundService()
})

app.on('window-all-closed', () => {
  // Keep running in tray on Windows/Linux when the window is hidden.
})
