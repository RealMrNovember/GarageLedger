const path = require('node:path')
const fs = require('node:fs')
const { app, nativeImage } = require('electron')

/** Must match package.json build.appId — required for correct Windows taskbar grouping/icon. */
const APP_USER_MODEL_ID = 'com.cicibyte.garageledger'

let cachedIcon = null
let cachedPath = null

function iconCandidates() {
  const devRoot = path.join(__dirname, '..', 'build', 'icon.ico')
  const devPng = path.join(__dirname, '..', 'build', 'icon.png')
  if (!app.isPackaged) return [devRoot, devPng]

  return [
    path.join(process.resourcesPath, 'icon.ico'),
    path.join(process.resourcesPath, 'icon.png'),
    path.join(process.resourcesPath, 'build', 'icon.ico'),
    path.join(app.getAppPath(), 'build', 'icon.ico'),
    path.join(__dirname, '..', 'build', 'icon.ico'),
  ]
}

function resolveIconPath() {
  if (cachedPath && fs.existsSync(cachedPath)) return cachedPath
  for (const candidate of iconCandidates()) {
    try {
      if (candidate && fs.existsSync(candidate)) {
        cachedPath = candidate
        return candidate
      }
    } catch {
      continue
    }
  }
  return undefined
}

function loadAppIcon() {
  if (cachedIcon && !cachedIcon.isEmpty()) return cachedIcon
  const iconPath = resolveIconPath()
  if (!iconPath) return nativeImage.createEmpty()
  try {
    const img = nativeImage.createFromPath(iconPath)
    if (!img.isEmpty()) {
      cachedIcon = img
      return img
    }
  } catch {
    return nativeImage.createEmpty()
  }
  return nativeImage.createEmpty()
}

/** Call as early as possible on Windows (before BrowserWindow). */
function applyWindowsAppIdentity() {
  if (process.platform !== 'win32') return
  try {
    app.setAppUserModelId(APP_USER_MODEL_ID)
  } catch {}
}

function windowIconOptions() {
  const iconPath = resolveIconPath()
  if (iconPath) return { icon: iconPath }
  const icon = loadAppIcon()
  if (!icon || icon.isEmpty()) return {}
  return { icon }
}

function applyWindowIcon(win) {
  if (!win || win.isDestroyed()) return
  const iconPath = resolveIconPath()
  if (iconPath) {
    try {
      win.setIcon(nativeImage.createFromPath(iconPath))
      return
    } catch {}
  }
  const icon = loadAppIcon()
  if (icon && !icon.isEmpty()) {
    try {
      win.setIcon(icon)
    } catch {}
  }
}

function trayIcon() {
  const icon = loadAppIcon()
  if (!icon || icon.isEmpty()) return icon
  return icon.resize({ width: 16, height: 16 })
}

function notificationIconPath() {
  return resolveIconPath()
}

module.exports = {
  APP_USER_MODEL_ID,
  applyWindowsAppIdentity,
  resolveIconPath,
  loadAppIcon,
  windowIconOptions,
  applyWindowIcon,
  trayIcon,
  notificationIconPath,
}
