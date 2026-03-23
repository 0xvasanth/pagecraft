import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

export function TemplateVariableView({ node, selected }: NodeViewProps) {
  const name = node.attrs.name || 'variable'

  return (
    <NodeViewWrapper as="span" className="template-variable-wrapper">
      <span
        className={`template-variable-chip ${selected ? 'selected' : ''}`}
        contentEditable={false}
      >
        <span className="template-variable-braces">{'{'+'{'}</span>
        <span className="template-variable-name">{name}</span>
        <span className="template-variable-braces">{'}'+'}'}</span>
      </span>
    </NodeViewWrapper>
  )
}
