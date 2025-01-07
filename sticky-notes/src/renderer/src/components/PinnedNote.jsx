import { useEffect, useState, useRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import TipTap from './TipTap'

const PinnedNote = () => {
  const [note, setNote] = useState(null)
  const [opacity, setOpacity] = useState(0.5)
  const editorRef = useRef(null)
  const debounceTimeout = useRef(null)

  useEffect(() => {
    window.api.invoke('get-pinned-note').then((noteData) => {
      setNote(noteData)
    })

    // Listen for updates from main window
    window.api.receive('note-updated', (updatedNote) => {
      if (updatedNote.id === note?.id) {
        setNote(updatedNote)
      }
    })
  }, [])

  const changeOpacity = (newOpacity) => {
    if (newOpacity >= 0.1 && newOpacity <= 1) {
      setOpacity(newOpacity)
      window.api.invoke('set-pinned-window-opacity', newOpacity)
    }
  }

  // Debounced auto-save function
  const handleContentChange = async (newContent) => {
    if (!note || typeof newContent !== 'string') return

    const updatedNote = {
      ...note,
      content: newContent,
      pinned: true
    }
    setNote(updatedNote)

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        await window.api.invoke('update-pinned-note', note.id, {
          title: updatedNote.title,
          content: updatedNote.content,
          pinned: true
        })
        await window.api.invoke('broadcast-note-update', updatedNote)
      } catch (error) {
        console.error('Error saving note:', error)
      }
    }, 500)
  }

  const handleTitleChange = async (e) => {
    if (!note) return

    const updatedNote = {
      ...note,
      title: e.target.value,
      pinned: true // Ensure pinned status is maintained
    }
    setNote(updatedNote)

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        await window.api.invoke('update-pinned-note', note.id, {
          title: updatedNote.title,
          content: updatedNote.content,
          pinned: true // Ensure pinned status is maintained
        })
        await window.api.invoke('broadcast-note-update', updatedNote)
      } catch (error) {
        console.error('Error saving note:', error)
      }
    }, 500)
  }

  if (!note) return null

  return (
    <div className=" min-h-screen bg-gray-900 dark:bg-gray-900 transition-colors duration-200">
      <div className="p-4 flex justify-between items-center">
        <div className="flex gap-4">
          <p className="text-gray-400 text-sm">Opacity:</p>
          <button
            onClick={() => changeOpacity(opacity - 0.1)}
            className="text-white hover:text-purple-400 "
          >
            <Minus size={18} />
          </button>
          <button
            onClick={() => changeOpacity(opacity + 0.1)}
            className="text-white hover:text-purple-400"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
      <div className="p-2">
        <div className="bg-gray-900 dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-2">
            <input
              type="text"
              value={note.title}
              onChange={handleTitleChange}
              className="w-full bg-transparent text-lg font-semibold text-purple-300 dark:text-gray-200 mb-2 border-b-2 border-dotted focus:outline-none focus:ring-0"
            />
            <div className="prose prose-invert max-w-none">
              <TipTap
                ref={editorRef}
                content={note.content}
                onContentChange={handleContentChange}
                className="min-h-[200px] text-white whitespace-pre-wrap focus:ring-0 dark:text-gray-200 prose-headings:text-white prose-p:text-gray-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PinnedNote
