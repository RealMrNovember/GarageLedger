const path = require('node:path')
const fs = require('node:fs')
const { app, BrowserWindow } = require('electron')
const { registerIpc } = require('./ipc.cjs')

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

app.setName('GarageLedger')
try {
  app.name = 'GarageLedger'
} catch {}
process.title = 'GarageLedger'
try {
  app.setAppUserModelId('com.cicibyte.garageledger')
} catch {}
try {
  app.setPath('userData', path.join(app.getPath('appData'), 'GarageLedger'))
} catch {}

function resolveWindowIcon() {
  const candidates = [
    path.join(__dirname, '..', 'build', 'icon.ico'),
    path.join(app.getAppPath(), 'build', 'icon.ico'),
    path.join(process.resourcesPath, 'build', 'icon.ico'),
  ]
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p
    } catch {
      continue
    }
  }
  return undefined
}

function createSplashWindow() {
  const icon = resolveWindowIcon()
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
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.loadFile(path.join(__dirname, 'splash.html'))
  return win
}

async function createMainWindow() {
  const icon = resolveWindowIcon()
  const win = new BrowserWindow({
    width: 1240,
    height: 780,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#FAFAFA',
    title: 'GarageLedger',
    autoHideMenuBar: true,
    ...(icon ? { icon } : {}),
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

  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    await win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'))
  }

  win.once('ready-to-show', () => {
    win.show()
  })

  return win
}

app.whenReady().then(async () => {
  registerIpc({ isDev })

  const startedAt = Date.now()
  const splash = createSplashWindow()

  const main = await createMainWindow()

  main.once('ready-to-show', () => {
    const elapsed = Date.now() - startedAt
    const remaining = Math.max(0, 3000 - elapsed)
    setTimeout(() => {
      if (!splash.isDestroyed()) splash.close()
    }, remaining)
  })

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
