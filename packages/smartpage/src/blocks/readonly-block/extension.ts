import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ReadOnlyBlockView } from './view'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    readonlyBlock: {
      insertReadOnlyBlock: (options: { content: string; label?: string }) => ReturnType
    }
  }
}

export const ReadOnlyBlockExtension = Node.create({
  name: 'readonlyBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      content: { default: '' },
      label: { default: 'Read Only' },
    }
  },

  parseHTML() {
    return [{
      tag: 'div[data-block-readonly]',
      getAttrs: (dom) => {
        const el = dom as HTMLElement
        return {
          content: el.getAttribute('data-block-content') || el.textContent || '',
          label: el.getAttribute('data-block-label') || 'Read Only',
        }
      },
    }]
  },

  renderHTML({ HTMLAttributes }) {
    const { content, label, ...rest } = HTMLAttributes
    return [
      'div',
      mergeAttributes(rest, {
        'data-block-readonly': 'true',
        'data-block-label': label,
        'data-block-content': content,
      }),
      content,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyBlockView)
  },

  addCommands() {
    return {
      insertReadOnlyBlock: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
