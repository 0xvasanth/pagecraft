import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useState, useRef, useEffect, useCallback } from 'react'

/**
 * Lightweight resizable image for header/footer.
 * Inline, drag corners to resize, no crop overlay.
 */
function HfImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const { src, width } = node.attrs
  const editable = editor.isEditable
  const [currentWidth, setCurrentWidth] = useState<number | null>(width)
  const [resizing, setResizing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const startRef = useRef({ x: 0, w: 0 })

  const onLoad = useCallback(() => {
    if (imgRef.current && !currentWidth) {
      setCurrentWidth(Math.min(imgRef.current.naturalWidth, 200))
    }
  }, [currentWidth])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizing(true)
    startRef.current = { x: e.clientX, w: currentWidth || 100 }
  }, [currentWidth])

  useEffect(() => {
    if (!resizing) return

    let latestWidth = currentWidth || 100

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startRef.current.x
      latestWidth = Math.max(20, startRef.current.w + dx)
      setCurrentWidth(latestWidth)
    }

    const onUp = () => {
      setResizing(false)
      updateAttributes({ width: latestWidth })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [resizing, updateAttributes])

  return (
    <NodeViewWrapper as="span" style={{ display: 'inline-block', position: 'relative', lineHeight: 0 }}>
      <img
        ref={imgRef}
        src={src}
        alt={node.attrs.alt || ''}
        draggable={false}
        onLoad={onLoad}
        style={{
          width: currentWidth ? `${currentWidth}px` : 'auto',
          maxHeight: '100%',
          verticalAlign: 'top',
          borderRadius: '2px',
          outline: selected && editable ? '2px solid #3b82f6' : 'none',
          outlineOffset: '1px',
          cursor: 'default',
        }}
      />
      {/* Resize handle — bottom-right corner */}
      {selected && editable && (
        <span
          onMouseDown={startResize}
          style={{
            position: 'absolute',
            bottom: -3,
            right: -3,
            width: 8,
            height: 8,
            background: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '50%',
            cursor: 'se-resize',
            zIndex: 1,
          }}
        />
      )}
    </NodeViewWrapper>
  )
}

export const HfResizableImage = Node.create({
  name: 'image',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addCommands() {
    return {
      setImage: (options: { src: string; alt?: string; title?: string; width?: number }) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'img[src]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const { width, ...rest } = HTMLAttributes
    return ['img', mergeAttributes(rest, {
      style: width ? `width: ${width}px` : undefined,
    })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(HfImageView)
  },
})
