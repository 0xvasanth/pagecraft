import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { IfBlockView } from './view'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ifBlock: {
      insertIfBlock: (options: { condition: string }) => ReturnType
    }
  }
}

export const IfBlockExtension = Node.create({
  name: 'ifBlock',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      condition: { default: 'condition' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-block-if]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const { condition, ...rest } = HTMLAttributes
    return [
      'div',
      mergeAttributes(rest, { 'data-block-if': condition }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(IfBlockView)
  },

  addCommands() {
    return {
      insertIfBlock: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
          content: [{ type: 'paragraph' }],
        })
      },
    }
  },
})
