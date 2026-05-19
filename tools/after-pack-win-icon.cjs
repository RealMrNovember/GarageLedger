/**
 * Force GarageLedger icon into the packaged .exe (Windows).
 * electron-builder often skips icon embedding when code signing is disabled.
 */
const fs = require('node:fs')
const path = require('node:path')

/** @param {import('app-builder-lib').AfterPackContext} context */
exports.default = async function afterPack(context) {
  const { electronPlatformName, appOutDir, packager } = context
  if (electronPlatformName !== 'win32') return

  const exeName = `${packager.appInfo.productFilename}.exe`
  const exePath = path.join(appOutDir, exeName)
  const iconPath = path.join(packager.projectDir, 'build', 'icon.ico')

  if (!fs.existsSync(exePath)) {
    console.warn(`[afterPack] exe not found: ${exePath}`)
    return
  }
  if (!fs.existsSync(iconPath)) {
    console.warn(`[afterPack] icon not found: ${iconPath}`)
    return
  }

  const { rcedit } = await import('rcedit')
  await rcedit(exePath, {
    icon: iconPath,
    'product-name': 'GarageLedger',
    'file-description': 'GarageLedger',
    'original-filename': exeName,
    'internal-name': 'GarageLedger',
    'version-string': {
      CompanyName: 'Cicibyte Corp',
      FileDescription: 'GarageLedger',
      ProductName: 'GarageLedger',
      LegalCopyright: 'Cicibyte Corp',
    },
  })

  console.log(`[afterPack] embedded icon → ${exePath}`)
}
