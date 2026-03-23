import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { HfResizableImage } from '../image/HfResizableImage'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import { Link } from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect, useRef } from 'react'

interface HeaderFooterFieldProps {
  content: string
  onChange: (html: string) => void
  placeholder: string
  isEditing: boolean
  onStartEdit: () => void
  editorRef?: React.MutableRefObject<Editor | null>
}

export function HeaderFooterField({
  content,
  onChange,
  placeholder,
  isEditing,
  onStartEdit,
  editorRef,
}: HeaderFooterFieldProps) {
  // Use ref to avoid stale closure in onUpdate callback
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      HfResizableImage,
      TextAlign.configure({
        types: ['paragraph'],
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
    ],
    content: content || '',
    editable: isEditing,
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(ed.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'smartpage-hf-editor',
        spellcheck: 'true',
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        const images = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (images.length === 0) return false

        event.preventDefault()
        images.forEach(file => {
          const reader = new FileReader()
          reader.onload = () => {
            const src = reader.result as string
            view.dispatch(
              view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src })
              )
            )
          }
          reader.readAsDataURL(file)
        })
        return true
      },
    },
  })

  // Expose editor to parent via ref
  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor
    }
  }, [editor, editorRef])

  // Sync editable state
  useEffect(() => {
    if (!editor) return
    editor.setEditable(isEditing)
    if (isEditing) {
      setTimeout(() => editor.commands.focus('end'), 0)
    }
  }, [editor, isEditing])

  // Sync content from parent when not focused
  const lastContent = useRef(content)
  useEffect(() => {
    if (!editor) return
    if (editor.isFocused) return
    if (content === lastContent.current) return
    lastContent.current = content
    editor.commands.setContent(content || '')
  }, [editor, content])

  const hasContent = content && content !== '<p></p>'

  return (
    <div
      className={`smartpage-hf-field ${isEditing ? 'smartpage-hf-field--editing' : ''}`}
      onDoubleClick={!isEditing ? onStartEdit : undefined}
    >
      {/* Placeholder — shown when not editing and no content */}
      {!isEditing && !hasContent && (
        <span className="smartpage-hf-display__placeholder">{placeholder}</span>
      )}

      {/* EditorContent always rendered in the same DOM position.
          In display mode it acts as a read-only preview.
          In editing mode it becomes the active editor. */}
      <div className={`smartpage-hf-field__editor ${!isEditing && !hasContent ? 'smartpage-hf-field__editor--hidden' : ''}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
