import React, { useState, useEffect } from 'react'
import { Trash2, Edit2, Save, Plus, Moon, Sun, Pin } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import PinImg from '../images/pinimg.png'

// Editor Configurations
const editorConfig = {
  extensions: [StarterKit],
  editorProps: {
    attributes: {
      class: 'prose prose-sm w-full focus:outline-none dark:prose-invert min-h-[100px] px-3 py-2'
    }
  }
}

const newNoteEditorConfig = {
  ...editorConfig,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Start typing...',
      emptyEditorClass: 'is-editor-empty'
    })
  ]
}

// Database Operations
const DatabaseOperations = {
  async saveNote(note) {
    try {
      const response = await window.api.invoke('save-note', note)
      if (!response.success) {
        console.error('Failed to save note:', response.error)
      }
      return response
    } catch (error) {
      console.error('Error saving note:', error)
      throw error
    }
  },

  async deleteNote(noteId) {
    try {
      const response = await window.api.invoke('delete-note', noteId)
      if (!response.success) {
        console.error('Failed to delete note:', response.error)
      }
      return response
    } catch (error) {
      console.error('Error deleting note:', error)
      throw error
    }
  },

  async updateNote(noteId, updatedNote) {
    try {
      const response = await window.api.invoke('update-note', noteId, updatedNote)
      if (!response.success) {
        console.error('Failed to update note:', response.error)
      } else {
        await window.api.invoke('broadcast-note-update', updatedNote)
      }
      return response
    } catch (error) {
      console.error('Error updating note:', error)
      throw error
    }
  },

  async fetchNotes() {
    try {
      return await window.api.invoke('get-notes')
    } catch (error) {
      console.error('Error fetching notes:', error)
      throw error
    }
  }
}

// Component Parts

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
    <img
      src={PinImg}
      alt="Create Note"
      className="w-48 h-48 rounded-full bg-white p-3 object-contain mb-6 animate-bounce"
    />
    <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Notes Yet!</h3>
    <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
      Create your first note and start organizing your thoughts!
    </p>
    <div className="relative">
      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-purple-500 dark:text-purple-400 animate-bounce">
        ↑
      </span>
      <p className="text-sm text-purple-500 dark:text-purple-400">
        Click the + button to get started
      </p>
    </div>
  </div>
)

const Header = ({ onAddClick, darkMode, onThemeToggle }) => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">📝 Stick your Notes</h3>
      <p className="text-xs font-semibold text-purple-400 ml-9">be proactive:)</p>
    </div>

    <div className="flex gap-3">
      <button
        onClick={onAddClick}
        className="flex items-center p-2 text-sm text-gray-700 dark:text-white rounded-full hover:bg-purple-600 hover:text-white transition-colors"
      >
        <Plus size={18} className="mr-1" />
      </button>
      <button
        onClick={onThemeToggle}
        className="top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors shadow-md"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  </div>
)

const AddNoteForm = ({ isVisible, title, onTitleChange, editor, onSave, onCancel }) => {
  if (!isVisible) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-all border border-gray-200 dark:border-gray-700">
      <input
        type="text"
        className="w-full mb-3 p-3 text-gray-700 dark:text-gray-200 border-0 focus:outline-dashed outline-purple-500 rounded-md focus:ring-2 focus:ring-purple-500 bg-gray-100 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
        placeholder="Note Title..."
        value={title}
        onChange={onTitleChange}
      />
      <div className="border dark:border-gray-700 rounded-md mb-4 [&_.is-editor-empty]:before:text-gray-500 [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:pointer-events-none bg-gray-50 dark:bg-gray-900">
        <EditorContent editor={editor} />
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-6 py-2 text-sm font-medium bg-purple-500 dark:bg-purple-600 text-white rounded-md hover:bg-purple-600 dark:hover:bg-purple-700 transition-transform transform hover:scale-105"
        >
          Save
        </button>
      </div>
    </div>
  )
}

const NoteCard = ({ note, editingId, editingEditor, onPin, onEdit, onSave, onDelete }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {note.title || 'Untitled'}
          </h3>
          <span className="text-xs text-purple-500 dark:text-purple-400">
            {new Date(note.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        <button
          onClick={() => onPin(note)}
          className={`p-1.5 rounded-full ${
            note.pinned
              ? 'bg-yellow-500 text-yellow-300 dark:bg-yellow-800'
              : 'bg-gray-100 dark:bg-gray-700'
          } hover:bg-yellow-200 dark:hover:bg-yellow-700 text-gray-400`}
          title="Pin Note"
        >
          <Pin size={18} />
        </button>
      </div>

      {editingId === note.id ? (
        <div className="border dark:border-gray-700 rounded-md mt-3">
          <EditorContent editor={editingEditor} />
        </div>
      ) : (
        <div className="relative prose prose-sm dark:prose-invert mt-3 max-h-32 overflow-hidden">
          {typeof note.content === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: note.content }} />
          ) : (
            <div className="text-gray-500">No content</div>
          )}
          {note.content?.length > 150 && !note.pinned && (
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white dark:to-gray-800 pointer-events-none" />
          )}
        </div>
      )}
    </div>

    <div className="flex justify-end items-center px-4 py-3 border-t border-gray-100 dark:border-gray-700">
      {editingId === note.id ? (
        <button
          onClick={() => onSave(note.id)}
          className="p-2 rounded-full text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 transition-transform transform hover:scale-105"
          title="Save"
        >
          <Save size={18} />
        </button>
      ) : (
        <button
          onClick={() => onEdit(note)}
          className="p-2 rounded-full text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-transform transform hover:scale-105"
          title="Edit"
        >
          <Edit2 size={18} />
        </button>
      )}
      <button
        onClick={() => onDelete(note.id)}
        className="p-2 rounded-full text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-transform transform hover:scale-105"
        title="Delete"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>
)

const Notes = () => {
  // State
  const [notes, setNotes] = useState([])
  const [noteTitle, setNoteTitle] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [pinnedNoteId, setPinnedNoteId] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark'
    }
    return false
  })

  // Editors
  const newNoteEditor = useEditor(newNoteEditorConfig)
  const editingEditor = useEditor(editorConfig)

  // Effects
  useEffect(() => {
    window.api.receive('note-updated', (updatedNote) => {
      setNotes(
        notes.map((note) => ({
          ...note,
          ...(note.id === updatedNote.id
            ? {
                title: updatedNote.title,
                content: updatedNote.content,
                pinned: note.pinned
              }
            : {})
        }))
      )
    })
  }, [notes])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await DatabaseOperations.fetchNotes()
        // Sort notes by creation date, newest first
        const sortedNotes = (response || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
        setNotes(sortedNotes)
      } catch (error) {
        console.error('Error fetching notes:', error)
      }
    }
    fetchNotes()
  }, [])

  useEffect(() => {
    // Cleanup function
    return () => {
      if (pinnedNoteId) {
        window.api.invoke('close-pinned-window')
      }
    }
  }, [])

  // Handlers
  const handleAddNote = async () => {
    if (newNoteEditor && noteTitle.trim() !== '') {
      const content = newNoteEditor.getHTML()
      const newNote = {
        title: noteTitle.trim(),
        content: content || '',
        pinned: false
      }

      try {
        const response = await DatabaseOperations.saveNote(newNote)
        if (response.success) {
          setNotes([response.note, ...notes]) // Add new note at the beginning
          setNoteTitle('')
          newNoteEditor.commands.setContent('')
          setIsAddingNote(false)
        }
      } catch (error) {
        console.error('Error saving note:', error)
      }
    }
  }

  const handlePinClick = async (note) => {
    try {
      if (pinnedNoteId === note.id) {
        await window.api.invoke('close-pinned-window')
        setPinnedNoteId(null)
        // Update the local state to reflect the unpinned status
        setNotes(notes.map((n) => (n.id === note.id ? { ...n, pinned: false } : n)))
      } else {
        // First close any existing pinned window
        if (pinnedNoteId) {
          await window.api.invoke('close-pinned-window')
        }
        await window.api.invoke('open-pinned-window', note)
        setPinnedNoteId(note.id)
        // Update only the newly pinned note
        setNotes(
          notes.map((n) => ({
            ...n,
            pinned: n.id === note.id
          }))
        )
      }
    } catch (error) {
      console.error('Error handling pin:', error)
    }
  }

  const handleDelete = async (noteId) => {
    try {
      await DatabaseOperations.deleteNote(noteId)
      setNotes(notes.filter((note) => note.id !== noteId))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleEdit = (note) => {
    setEditingId(note.id)
    if (editingEditor) {
      editingEditor.commands.setContent(note.content)
    }
  }

  const handleSaveEdit = async (noteId) => {
    if (editingEditor) {
      const newContent = editingEditor.getHTML()
      const note = notes.find((n) => n.id === noteId)
      if (!note) return

      const updatedNote = {
        ...note,
        content: typeof newContent === 'string' ? newContent : ''
      }

      try {
        await DatabaseOperations.updateNote(noteId, updatedNote)
        setNotes(notes.map((note) => (note.id === noteId ? updatedNote : note)))
        setEditingId(null)
      } catch (error) {
        console.error('Error saving edit:', error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto mb-8">
          <Header
            onAddClick={() => setIsAddingNote(true)}
            darkMode={darkMode}
            onThemeToggle={() => setDarkMode(!darkMode)}
          />

          <AddNoteForm
            isVisible={isAddingNote}
            title={noteTitle}
            onTitleChange={(e) => setNoteTitle(e.target.value)}
            editor={newNoteEditor}
            onSave={handleAddNote}
            onCancel={() => {
              setIsAddingNote(false)
              newNoteEditor?.commands.setContent('')
            }}
          />
        </div>

        {notes.length === 0 && !isAddingNote ? (
          <EmptyState />
        ) : (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                editingId={editingId}
                editingEditor={editingEditor}
                onPin={handlePinClick}
                onEdit={handleEdit}
                onSave={handleSaveEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notes
