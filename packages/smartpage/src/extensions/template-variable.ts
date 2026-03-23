import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { TemplateVariableView } from './TemplateVariableView'
import type { TemplateVariable as TemplateVariableType } from '../types'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    templateVariable: {
      insertVariable: (name: string) => ReturnType
    }
  }
}

export interface TemplateVariableOptions {
  /** Predefined variables available in the editor */
  variables: TemplateVariableType[]
  /** Whether users can add custom variables beyond the predefined list */
  allowCustom: boolean
  /** The syntax wrapper — default is handlebars {{ }} */
  syntax: { open: string; close: string }
}

export const TemplateVariable = Node.create<TemplateVariableOptions>({
  name: 'templateVariable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      variables: [] as TemplateVariableType[],
      allowCustom: true,
      syntax: { open: '{{', close: '}}' },
    }
  },

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-variable'),
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'span[data-variable]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const name = HTMLAttributes.name || ''
    const { open, close } = this.options.syntax
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-variable': name,
        class: 'template-variable',
      }),
      `${open}${name}${close}`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TemplateVariableView)
  },

  addCommands() {
    return {
      insertVariable: (name: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { name },
        })
      },
    }
  },
})
