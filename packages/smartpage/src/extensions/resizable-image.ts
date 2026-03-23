import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ImageNodeView } from '../image/ImageNodeView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setImage: (options: { src: string; alt?: string; title?: string; width?: number; alignment?: string }) => ReturnType
    }
  }
}

export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
      alignment: { default: 'center' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (dom) => {
          const el = dom as HTMLElement
          return {
            src: el.getAttribute('src'),
            alt: el.getAttribute('alt'),
            title: el.getAttribute('title'),
            width: el.getAttribute('width') ? parseInt(el.getAttribute('width')!) : null,
            alignment: el.getAttribute('data-alignment') || 'center',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { alignment, ...attrs } = HTMLAttributes
    return ['div', { style: `text-align: ${alignment || 'center'}`, class: 'image-container' },
      ['img', mergeAttributes(attrs, {
        'data-alignment': alignment,
        style: attrs.width ? `width: ${attrs.width}px` : undefined,
      })]]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },

  addCommands() {
    return {
      setImage: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
