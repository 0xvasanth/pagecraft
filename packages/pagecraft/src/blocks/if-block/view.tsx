import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { GitBranch, X } from 'lucide-react'
import { useState } from 'react'

export function IfBlockView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const { condition } = node.attrs
  const editable = editor.isEditable
  const [isEditing, setIsEditing] = useState(false)

  return (
    <NodeViewWrapper className={`s-block s-block--if ${selected ? 's-block--selected' : ''}`}>
      <div className="s-block__header s-block--if__header" contentEditable={false}>
        <div className="s-block__header-left">
          <GitBranch className="size-3.5" strokeWidth={1.5} />
          {isEditing && editable ? (
            <span className="s-block__expr-edit">
              <span className="s-block__expr-kw">if</span>
              <input
                className="s-block__expr-input"
                value={condition}
                onChange={e => updateAttributes({ condition: e.target.value })}
                onBlur={() => setIsEditing(false)}
                onKeyDown={e => e.key === 'Enter' && setIsEditing(false)}
                autoFocus
                style={{ width: `${Math.max(8, condition.length + 1)}ch` }}
              />
            </span>
          ) : (
            <span
              className="s-block__expr"
              onDoubleClick={editable ? () => setIsEditing(true) : undefined}
              title={editable ? 'Double-click to edit condition' : undefined}
            >
              If <strong>{condition}</strong>
            </span>
          )}
        </div>
        {editable && (
          <button className="s-block__delete" onClick={deleteNode} type="button">
            <X className="size-3" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="s-block__body">
        <NodeViewContent />
      </div>

      <div className="s-block__footer s-block--if__footer" contentEditable={false}>
        End if
      </div>
    </NodeViewWrapper>
  )
}
