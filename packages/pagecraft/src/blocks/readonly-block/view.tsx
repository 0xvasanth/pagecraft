import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Lock, X } from 'lucide-react'
import { useRef, useEffect } from 'react'

export function ReadOnlyBlockView({ node, deleteNode, selected, editor }: NodeViewProps) {
  const { content, label } = node.attrs
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return
    contentRef.current.textContent = ''

    if (content.includes('<') && content.includes('>')) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(content, 'text/html')
      doc.querySelectorAll('script, [onload], [onerror], [onclick], [onmouseover]').forEach(el => el.remove())
      Array.from(doc.body.childNodes).forEach(child => {
        contentRef.current!.appendChild(document.importNode(child, true))
      })
    } else {
      contentRef.current.textContent = content
    }
  }, [content])

  return (
    <NodeViewWrapper className={`s-block s-block--readonly ${selected ? 's-block--selected' : ''}`}>
      <div className="s-block__header s-block--readonly__header" contentEditable={false}>
        <div className="s-block__header-left">
          <Lock className="size-3.5" strokeWidth={1.5} />
          <span className="s-block__expr">{label}</span>
        </div>
        {editor.isEditable && (
          <button className="s-block__delete" onClick={deleteNode} type="button">
            <X className="size-3" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div
        ref={contentRef}
        className="s-block__body s-block--readonly__body"
        contentEditable={false}
      />
    </NodeViewWrapper>
  )
}
