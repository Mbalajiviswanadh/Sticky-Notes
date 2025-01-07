// Import statements
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import icon from '../../resources/icon.png?asset'
import { mkdir } from 'fs/promises'
import { dirname } from 'path'

// Global Variables
let pinnedNoteData = null
let pinnedWindow = null
let db = null

// Database initialization
async function initializeDatabase() {
  try {
    // Ensure the data directory exists
    const userDataPath = app.getPath('userData')
    const dbPath = join(userDataPath, 'notes.sqlite')
    await mkdir(dirname(dbPath), { recursive: true })

    // Open database connection
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    })

    // Create tables if they don't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.run('UPDATE notes SET pinned = FALSE')

    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Database initialization error:', err)
  }
}

// Database Operations
const DatabaseOperations = {
  async deleteNote(noteId) {
    await db.run('DELETE FROM notes WHERE id = ?', noteId)
  },

  async updateNote(noteId, updatedNote) {
    try {
      // Ensure content is a string
      const content = typeof updatedNote.content === 'string' ? updatedNote.content : ''
      await db.run('UPDATE notes SET content = ? WHERE id = ?', [content, noteId])
    } catch (error) {
      console.error('Error updating note:', error)
      throw error
    }
  },

  async loadNotes() {
    return await db.all(
      'SELECT id, title, content, pinned, created_at FROM notes ORDER BY pinned DESC, created_at DESC'
    )
  },

  async saveNote(note) {
    try {
      // Ensure content is a string
      const content = typeof note.content === 'string' ? note.content : ''
      const title = typeof note.title === 'string' ? note.title : ''

      const result = await db.run(
        'INSERT INTO notes (title, content, pinned, created_at) VALUES (?, ?, ?, datetime("now"))',
        [title, content, note.pinned || false]
      )

      const newNote = await db.get('SELECT * FROM notes WHERE id = ?', result.lastID)
      return newNote
    } catch (error) {
      console.error('Error saving note:', error)
      throw error
    }
  },

  async updatePinnedNote(noteId, updatedFields) {
    try {
      const { title, content } = updatedFields

      if (!noteId) {
        throw new Error('Note ID is required')
      }

      const existingNote = await db.get('SELECT * FROM notes WHERE id = ?', noteId)
      if (!existingNote) {
        throw new Error(`Note with ID ${noteId} not found`)
      }

      await db.run(
        'UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content), pinned = true WHERE id = ?',
        [title, content, noteId]
      )

      const updatedNote = await db.get('SELECT * FROM notes WHERE id = ?', noteId)
      return updatedNote
    } catch (error) {
      console.error('Error updating note:', error)
      throw error
    }
  }
}

// Window Management [No changes needed - keeping the same code]
const WindowManager = {
  // ... [Previous WindowManager code remains exactly the same]
  createPinnedWindow(note) {
    if (!note || typeof note.id === 'undefined') {
      console.error('Invalid note data:', note)
      throw new Error('Invalid note data provided to createPinnedWindow')
    }

    if (pinnedWindow && !pinnedWindow.isDestroyed()) {
      pinnedWindow.close()
    }

    pinnedWindow = new BrowserWindow({
      title: 'Selected Note: ' + (note.title || 'Untitled'),
      width: 300,
      height: 400,
      show: false,
      alwaysOnTop: true,
      autoHideMenuBar: true,
      resizable: true,
      minWidth: 100,
      minHeight: 100,
      maximizable: false,
      minimizable: false,
      opacity: 0.8,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    pinnedNoteData = { ...note }

    pinnedWindow.once('ready-to-show', () => {
      if (pinnedWindow && !pinnedWindow.isDestroyed()) {
        pinnedWindow.show()
      }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      pinnedWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#pinned')
    } else {
      pinnedWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'pinned'
      })
    }

    pinnedWindow.on('closed', () => {
      pinnedNoteData = null
      pinnedWindow = null
    })

    return pinnedWindow
  },

  createMainWindow() {
    const mainWindow = new BrowserWindow({
      title: 'Sticky Notes📝',
      width: 400,
      height: 600,
      show: false,
      alwaysOnTop: true,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    mainWindow.on('ready-to-show', () => {
      mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    return mainWindow
  }
}

// IPC Handlers Setup
function setupIpcHandlers() {
  ipcMain.handle('get-notes', async () => await DatabaseOperations.loadNotes())

  ipcMain.handle('save-note', async (_, note) => {
    try {
      const savedNote = await DatabaseOperations.saveNote(note)
      return { success: true, note: savedNote }
    } catch (error) {
      console.error('Error saving note:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('delete-note', async (_, noteId) => {
    try {
      await DatabaseOperations.deleteNote(noteId)
      return { success: true }
    } catch (error) {
      console.error('Error deleting note:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('update-note', async (_, noteId, newContent) => {
    try {
      await DatabaseOperations.updateNote(noteId, newContent)
      return { success: true }
    } catch (error) {
      console.error('Error updating note:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('toggle-pin', async (_, noteId) => {
    try {
      const note = await db.get('SELECT pinned FROM notes WHERE id = ?', noteId)
      if (!note) {
        throw new Error('Note not found')
      }
      await db.run('UPDATE notes SET pinned = ? WHERE id = ?', [!note.pinned, noteId])
      return { success: true, pinned: !note.pinned }
    } catch (error) {
      console.error('Error toggling pin:', error)
      return { success: false, error: error.message }
    }
  })

  // [Previous IPC handlers for pinned window remain the same]
  ipcMain.handle('open-pinned-window', async (_, note) => {
    try {
      if (!note) throw new Error('No note data provided to open-pinned-window')
      WindowManager.createPinnedWindow(note)
      return { success: true }
    } catch (error) {
      console.error('Error opening pinned window:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('close-pinned-window', async () => {
    try {
      if (pinnedWindow) {
        // Unpin the note in the database when closing the window
        if (pinnedNoteData) {
          await db.run('UPDATE notes SET pinned = FALSE WHERE id = ?', pinnedNoteData.id)
        }
        pinnedWindow.close()
        pinnedWindow = null
        pinnedNoteData = null
      }
      return { success: true }
    } catch (error) {
      console.error('Error closing pinned window:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-pinned-note', () => pinnedNoteData)

  ipcMain.handle('set-pinned-window-opacity', (_, opacity) => {
    try {
      if (pinnedWindow && !pinnedWindow.isDestroyed()) {
        pinnedWindow.setOpacity(opacity)
        return { success: true }
      }
      throw new Error('Pinned window is not available or destroyed.')
    } catch (error) {
      console.error('Error setting pinned window opacity:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('update-pinned-note', async (_, noteId, updatedFields) => {
    try {
      if (!noteId || !updatedFields) throw new Error('Invalid update parameters')

      const updatedNote = await DatabaseOperations.updatePinnedNote(noteId, updatedFields)

      if (pinnedNoteData && pinnedNoteData.id === noteId) {
        pinnedNoteData = updatedNote
      }

      BrowserWindow.getAllWindows().forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.send('note-updated', updatedNote)
        }
      })

      return { success: true, note: updatedNote }
    } catch (error) {
      console.error('Error in update-pinned-note:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('broadcast-note-update', async (_, updatedNote) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('note-updated', updatedNote)
    })
    return { success: true }
  })
}

// App Initialization
app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  // Initialize database before creating windows
  await initializeDatabase()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = WindowManager.createMainWindow()
  setupIpcHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      WindowManager.createMainWindow()
    }
  })
})

app.on('before-quit', async () => {
  try {
    if (db) {
      await db.close()
      console.log('Database connection closed successfully')
    }
  } catch (err) {
    console.error('Error closing database:', err)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
