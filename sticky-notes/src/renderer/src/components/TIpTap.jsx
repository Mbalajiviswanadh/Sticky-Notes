import './TipTap.css'
import React, { useImperativeHandle, forwardRef, useEffect, useState } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import ListItem from '@tiptap/extension-list-item'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code2,
  Link as LinkIcon,
  MoreHorizontal,
  Check,
  X,
  List,
  ListOrdered,
  ListTodo,
  ChevronDown
} from 'lucide-react'

// Helper Components
const MenuButton = ({ onClick, active, children, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-1 rounded-md transition-colors ${
        active ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

const ButtonGroup = ({ children }) => {
  return (
    <div className="flex items-center border-r border-gray-700 pr-1 mr-2 last:border-r-0 last:pr-0 last:mr-0">
      {children}
    </div>
  )
}

const Dropdown = ({ isOpen, setIsOpen, children, trigger }) => {
  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 bg-gray-800 border border-gray-700 rounded-md shadow-xl py-1 min-w-[160px] z-50">
          {children}
        </div>
      )}
    </div>
  )
}

const DropdownItem = ({ onClick, children, active }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-500/50 text-gray-300 ${
        active ? 'bg-gray-700' : ''
      }`}
    >
      {children}
    </button>
  )
}

// eslint-disable-next-line react/display-name
const TipTap = forwardRef((props, ref) => {
  const { content, onContentChange, className } = props
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showListMenu, setShowListMenu] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      BulletList,
      OrderedList,
      TaskList,
      ListItem,
      TaskItem.configure({
        nested: true
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      })
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML())
    }
  })

  useImperativeHandle(ref, () => ({
    focus: () => {
      editor?.commands.focus()
    },
    getContent: () => {
      return editor?.getHTML() || ''
    },
    setContent: (content) => {
      editor?.commands.setContent(content)
    }
  }))

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const handleLinkSubmit = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run()
    }
    setShowLinkInput(false)
    setLinkUrl('')
  }

  if (!editor) {
    return null
  }

  return (
    <React.Fragment>
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        className="flex flex-wrap items-center gap-0 p-1  bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-xl bubble-menu-container"
      >
        <ButtonGroup>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
          >
            <Bold size={12} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
          >
            <Italic size={12} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
          >
            <UnderlineIcon size={12} />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
          >
            <Strikethrough size={12} />
          </MenuButton>
        </ButtonGroup>

        <ButtonGroup>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
          >
            <Code2 size={12} />
          </MenuButton>

          <div className="relative">
            {showLinkInput ? (
              <div className="absolute bottom-full mb-2 left-0 flex items-center gap-1 p-1 bg-gray-800 border border-gray-700 rounded-md shadow-xl">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Enter url..."
                  className="w-20 px-1 py-0 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLinkSubmit()
                    } else if (e.key === 'Escape') {
                      setShowLinkInput(false)
                      setLinkUrl('')
                    }
                  }}
                />
                <button
                  onClick={handleLinkSubmit}
                  className="p-1 hover:bg-gray-700 rounded text-green-400"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => {
                    setShowLinkInput(false)
                    setLinkUrl('')
                  }}
                  className="p-1 hover:bg-gray-700 rounded text-red-400"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <MenuButton onClick={() => setShowLinkInput(true)} active={editor.isActive('link')}>
                <LinkIcon size={12} />
              </MenuButton>
            )}
          </div>
        </ButtonGroup>

        <ButtonGroup>
          <Dropdown
            isOpen={showListMenu}
            setIsOpen={setShowListMenu}
            trigger={
              <MenuButton
                onClick={(e) => {
                  e.stopPropagation()
                  setShowListMenu(!showListMenu)
                }}
                active={
                  editor.isActive('bulletList') ||
                  editor.isActive('orderedList') ||
                  editor.isActive('taskList')
                }
              >
                <div className="flex items-center gap-1">
                  <List size={12} />
                  <ChevronDown size={12} />
                </div>
              </MenuButton>
            }
          >
            <DropdownItem
              onClick={() => {
                editor.chain().focus().toggleBulletList().run()
                setShowListMenu(false)
              }}
              active={editor.isActive('bulletList')}
            >
              <List size={12} />
              <span>Bullet List</span>
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                editor.chain().focus().toggleOrderedList().run()
                setShowListMenu(false)
              }}
              active={editor.isActive('orderedList')}
            >
              <ListOrdered size={12} />
              <span>Numbered List</span>
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                editor.chain().focus().toggleTaskList().run()
                setShowListMenu(false)
              }}
              active={editor.isActive('taskList')}
            >
              <ListTodo size={12} />
              <span>Todo List</span>
            </DropdownItem>
          </Dropdown>
        </ButtonGroup>

        {/* <MenuButton onClick={() => console.log('More options')}>
          <MoreHorizontal size={12} />
        </MenuButton> */}
      </BubbleMenu>

      <EditorContent
        className={`text-sm w-full text-text outline-none ${className}`}
        editor={editor}
        spellCheck={false}
      />
    </React.Fragment>
  )
})

export default TipTap
