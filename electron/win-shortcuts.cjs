const fs = require('node:fs')
const path = require('node:path')
const { app, shell } = require('electron')
const { APP_USER_MODEL_ID } = require('./icon.cjs')

const SHORTCUT_FILE = 'GarageLedger.lnk'
const START_MENU_FOLDER = 'Cicibyte Corp'
/** Bump when shortcut repair logic changes (forces re-run on customer machines). */
const BRANDING_REPAIR_GENERATION = 2

function shortcutPaths() {
  const paths = []
  const publicRoot = process.env.PUBLIC || path.join('C:', 'Users', 'Public')
  const programData = process.env.ProgramData || path.join('C:', 'ProgramData')

  paths.push(path.join(publicRoot, 'Desktop', SHORTCUT_FILE))

  try {
    paths.push(path.join(app.getPath('desktop'), SHORTCUT_FILE))
  } catch {}

  const menuRoots = [
    path.join(programData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
  ]
  try {
    menuRoots.push(
      path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs'),
    )
  } catch {}

  for (const root of menuRoots) {
    paths.push(path.join(root, START_MENU_FOLDER, SHORTCUT_FILE))
    paths.push(path.join(root, SHORTCUT_FILE))
  }

  return [...new Set(paths)]
}

function shortcutOptions() {
  const execPath = process.execPath
  return {
    target: execPath,
    cwd: path.dirname(execPath),
    icon: execPath,
    iconIndex: 0,
    description: 'GarageLedger',
    appUserModelId: APP_USER_MODEL_ID,
  }
}

function repairWindowsShortcuts() {
  if (process.platform !== 'win32' || !app.isPackaged) return 0

  const opts = shortcutOptions()
  let repaired = 0

  for (const shortcutPath of shortcutPaths()) {
    if (!fs.existsSync(path.dirname(shortcutPath))) continue
    try {
      shell.writeShortcutLink(shortcutPath, 'create', opts)
      repaired += 1
    } catch (err) {
      console.warn('[GarageLedger] shortcut repair failed:', shortcutPath, err?.message || err)
    }
  }

  return repaired
}

function shouldRepairBranding() {
  const flagPath = path.join(app.getPath('userData'), 'branding-repair.json')
  try {
    const raw = JSON.parse(fs.readFileSync(flagPath, 'utf8'))
    return raw.generation !== BRANDING_REPAIR_GENERATION
  } catch {
    return true
  }
}

function markBrandingRepaired() {
  const flagPath = path.join(app.getPath('userData'), 'branding-repair.json')
  fs.mkdirSync(path.dirname(flagPath), { recursive: true })
  fs.writeFileSync(
    flagPath,
    JSON.stringify(
      {
        generation: BRANDING_REPAIR_GENERATION,
        version: app.getVersion(),
        repairedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  )
}

function repairWindowsBrandingIfNeeded() {
  if (process.platform !== 'win32' || !app.isPackaged) return
  if (!shouldRepairBranding()) return
  const count = repairWindowsShortcuts()
  markBrandingRepaired()
  if (count > 0) {
    console.log(`[GarageLedger] repaired ${count} Windows shortcut(s)`)
  }
}

module.exports = {
  repairWindowsBrandingIfNeeded,
  repairWindowsShortcuts,
  BRANDING_REPAIR_GENERATION,
}
