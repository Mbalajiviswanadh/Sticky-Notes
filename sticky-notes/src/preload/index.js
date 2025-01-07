import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Validated channels for security
const validChannels = [
  'get-notes',
  'save-note',
  'delete-note',
  'update-note',
  'toggle-pin',
  'open-pinned-window',
  'close-pinned-window',
  'get-pinned-note',
  'set-pinned-window-opacity',
  'update-pinned-note',
  'broadcast-note-update',
  'note-updated'
]

// Keep track of listeners
const listeners = new Map()

const api = {
  // Invoke method with channel validation
  invoke: (channel, ...args) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    throw new Error(`Invalid channel: ${channel}`)
  },

  // Enhanced receive method with automatic cleanup
  receive: (channel, func) => {
    if (validChannels.includes(channel)) {
      // Remove existing listener for this channel if it exists
      if (listeners.has(channel)) {
        const oldSubscription = listeners.get(channel)
        ipcRenderer.removeListener(channel, oldSubscription)
        listeners.delete(channel)
      }

      // Create and store new subscription
      const subscription = (_event, ...args) => func(...args)
      listeners.set(channel, subscription)
      ipcRenderer.on(channel, subscription)

      // Return cleanup function
      return () => {
        if (listeners.has(channel)) {
          ipcRenderer.removeListener(channel, listeners.get(channel))
          listeners.delete(channel)
        }
      }
    }
    throw new Error(`Invalid channel: ${channel}`)
  },

  // Remove specific listener
  removeListener: (channel, func) => {
    if (validChannels.includes(channel)) {
      if (listeners.has(channel)) {
        const subscription = listeners.get(channel)
        ipcRenderer.removeListener(channel, subscription)
        listeners.delete(channel)
      }
    }
  },

  // Remove all listeners for a channel
  removeAllListeners: (channel) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel)
      listeners.delete(channel)
    }
  },

  // Get listener count for a channel
  getListenerCount: (channel) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.listenerCount(channel)
    }
    return 0
  },

  // Set max listeners for a channel
  setMaxListeners: (n) => {
    ipcRenderer.setMaxListeners(n)
  }
}

// Cleanup function to remove all listeners when window is closed
window.addEventListener('beforeunload', () => {
  for (const [channel, subscription] of listeners.entries()) {
    ipcRenderer.removeListener(channel, subscription)
  }
  listeners.clear()
})

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
