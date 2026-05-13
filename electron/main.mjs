import path from 'node:path'
import { app, BrowserWindow } from 'electron'
import { registerIpc } from './ipc.mjs'

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

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
  })

  win.loadFile(path.join(app.getAppPath(), 'electron', 'splash.html'))
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
    titleBarOverlay: {
      color: '#FAFAFA',
      symbolColor: '#111827',
      height: 42,
    },
    webPreferences: {
      preload: path.join(app.getAppPath(), 'electron', 'preload.mjs'),
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

  const splash = createSplashWindow()
  const main = await createMainWindow()

  main.once('ready-to-show', () => {
    if (!splash.isDestroyed()) splash.close()
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
