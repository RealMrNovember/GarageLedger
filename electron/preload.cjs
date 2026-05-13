const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('GarageLedger', {
  items: {
    list: () => ipcRenderer.invoke('garageledger:items:list'),
    upsert: (item) => ipcRenderer.invoke('garageledger:items:upsert', item),
    remove: (id) => ipcRenderer.invoke('garageledger:items:remove', id),
  },
  contacts: {
    list: () => ipcRenderer.invoke('garageledger:contacts:list'),
    upsert: (contact) => ipcRenderer.invoke('garageledger:contacts:upsert', contact),
    remove: (id) => ipcRenderer.invoke('garageledger:contacts:remove', id),
  },
  settings: {
    get: () => ipcRenderer.invoke('garageledger:settings:get'),
    setCurrency: (currency) => ipcRenderer.invoke('garageledger:settings:setCurrency', currency),
  },
  app: {
    getInfo: () => ipcRenderer.invoke('garageledger:app:getInfo'),
  },
  updates: {
    getStatus: () => ipcRenderer.invoke('garageledger:update:getStatus'),
    check: () => ipcRenderer.invoke('garageledger:update:check'),
    install: () => ipcRenderer.invoke('garageledger:update:install'),
    onStatus: (handler) => {
      const wrapped = (_evt, payload) => handler(payload)
      ipcRenderer.on('garageledger:update:status', wrapped)
      return () => ipcRenderer.removeListener('garageledger:update:status', wrapped)
    },
  },
  backups: {
    ensureDaily: () => ipcRenderer.invoke('garageledger:backup:ensureDaily'),
    create: () => ipcRenderer.invoke('garageledger:backup:create'),
    list: () => ipcRenderer.invoke('garageledger:backup:list'),
    openFolder: () => ipcRenderer.invoke('garageledger:backup:openFolder'),
    restore: (fileName) => ipcRenderer.invoke('garageledger:backup:restore', fileName),
  },
})
