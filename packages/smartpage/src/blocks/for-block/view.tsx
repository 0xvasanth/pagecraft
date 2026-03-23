import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { Repeat, X, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { ForBlockOptions } from './extension'
import type { TemplateVariable } from '../../types'

export function ForBlockView({ node, updateAttributes, deleteNode, selected, extension, editor }: NodeViewProps) {
  const { listVar, iterVar } = node.attrs
  const editable = editor.isEditable
  const [isEditing, setIsEditing] = useState(false)
  const [showVarPicker, setShowVarPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Get variables from extension options
  const variables: TemplateVariable[] = (extension.options as ForBlockOptions).variables || []

  // Close picker when clicking outside
  useEffect(() => {
    if (!showVarPicker) return
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowVarPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showVarPicker])

  return (
    <NodeViewWrapper className={`s-block s-block--for ${selected ? 's-block--selected' : ''}`}>
      <div className="s-block__header s-block--for__header" contentEditable={false}>
        <div className="s-block__header-left">
          <Repeat className="size-3.5" strokeWidth={1.5} />
          {isEditing && editable ? (
            <span className="s-block__expr-edit">
              <span className="s-block__expr-kw">for each</span>
              <input
                className="s-block__expr-input"
                value={iterVar}
                onChange={e => updateAttributes({ iterVar: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                onKeyDown={e => e.key === 'Enter' && setIsEditing(false)}
                placeholder="item"
                autoFocus
                style={{ width: `${Math.max(3, iterVar.length + 1)}ch` }}
              />
              <span className="s-block__expr-kw">in</span>

              {/* Variable picker for listVar */}
              <div className="s-block__var-picker-wrap" ref={pickerRef}>
                <button
                  type="button"
                  className="s-block__var-picker-btn"
                  onClick={() => setShowVarPicker(!showVarPicker)}
                >
                  <span>{listVar}</span>
                  <ChevronDown className="size-3" strokeWidth={1.5} />
                </button>

                {showVarPicker && (
                  <div className="s-block__var-picker-dropdown">
                    {variables.length > 0 ? (
                      variables.map(v => (
                        <button
                          key={v.key}
                          type="button"
                          className={`s-block__var-picker-item ${v.key === listVar ? 'active' : ''}`}
                          onClick={() => {
                            updateAttributes({ listVar: v.key })
                            setShowVarPicker(false)
                          }}
                        >
                          {v.label || v.key}
                        </button>
                      ))
                    ) : (
                      <div className="s-block__var-picker-empty">No variables defined</div>
                    )}
                    {/* Manual input option */}
                    <div className="s-block__var-picker-divider" />
                    <div className="s-block__var-picker-custom">
                      <input
                        className="s-block__expr-input"
                        value={listVar}
                        onChange={e => updateAttributes({ listVar: e.target.value.replace(/[^a-zA-Z0-9_.]/g, '') })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') setShowVarPicker(false)
                        }}
                        placeholder="custom_list"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="s-block__expr-done"
                onClick={() => { setIsEditing(false); setShowVarPicker(false) }}
              >
                Done
              </button>
            </span>
          ) : (
            <span
              className="s-block__expr"
              onDoubleClick={editable ? () => setIsEditing(true) : undefined}
              title={editable ? 'Double-click to edit' : undefined}
            >
              For each <strong>{iterVar}</strong> in <strong>{listVar}</strong>
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

      <div className="s-block__footer s-block--for__footer" contentEditable={false}>
        End for each
      </div>
    </NodeViewWrapper>
  )
}
