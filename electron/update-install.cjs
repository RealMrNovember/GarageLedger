let isUpdating = false
let prepareHook = null

function registerUpdateInstallHandlers(hooks = {}) {
  prepareHook = hooks.onPrepare ?? null
}

function getIsUpdating() {
  return isUpdating
}

function prepareQuitForUpdate() {
  if (isUpdating) return
  isUpdating = true
  if (typeof prepareHook === 'function') {
    prepareHook()
  }
}

module.exports = {
  registerUpdateInstallHandlers,
  prepareQuitForUpdate,
  getIsUpdating,
}
