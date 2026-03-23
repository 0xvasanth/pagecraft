import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ForBlockView } from './view'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    forBlock: {
      insertForBlock: (options: { iterVar: string; listVar: string }) => ReturnType
    }
  }
}

export interface ForBlockOptions {
  /** Available variables the user can pick as the list source */
  variables: import('../../types').TemplateVariable[]
}

export const ForBlockExtension = Node.create<ForBlockOptions>({
  name: 'forBlock',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      variables: [],
    }
  },

  addAttributes() {
    return {
      listVar: { default: 'items' },
      iterVar: { default: 'item' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-block-for]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const { listVar, iterVar, ...rest } = HTMLAttributes
    return [
      'div',
      mergeAttributes(rest, { 'data-block-for': `${iterVar} in ${listVar}` }),
      0,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ForBlockView)
  },

  addCommands() {
    return {
      insertForBlock: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
          content: [{ type: 'paragraph' }],
        })
      },
    }
  },
})
