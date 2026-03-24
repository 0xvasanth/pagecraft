import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Plugin, PluginKey } from '@tiptap/pm/state'

const tableBorderPluginKey = new PluginKey('tableBorderSync')

/**
 * Extended Table extension with border style support.
 * Adds a `borderStyle` attribute: 'solid' (default) or 'none'.
 * Uses a ProseMirror plugin to sync the attribute to the DOM because
 * TipTap's table NodeView bypasses renderHTML for DOM rendering.
 */
export const TableWithStyles = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderStyle: {
        default: 'solid',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-border-style') || 'solid',
        renderHTML: (attributes: Record<string, string>) => {
          return { 'data-border-style': attributes.borderStyle || 'solid' }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    const parentPlugins = this.parent?.() || []
    return [
      ...parentPlugins,
      new Plugin({
        key: tableBorderPluginKey,
        view() {
          return {
            update(view) {
              // Sync borderStyle attribute from doc nodes to DOM table elements
              const { doc } = view.state
              doc.descendants((node, pos) => {
                if (node.type.name === 'table') {
                  const dom = view.nodeDOM(pos)
                  if (dom) {
                    // nodeDOM returns the wrapper div for table; find the actual table
                    const tableEl = dom instanceof HTMLTableElement
                      ? dom
                      : (dom as HTMLElement).querySelector?.('table') || dom
                    if (tableEl instanceof HTMLElement) {
                      const current = tableEl.getAttribute('data-border-style')
                      const desired = node.attrs.borderStyle || 'solid'
                      if (current !== desired) {
                        tableEl.setAttribute('data-border-style', desired)
                      }
                    }
                  }
                }
              })
            },
          }
        },
      }),
    ]
  },
})

/**
 * Extended TableCell with backgroundColor support.
 */
export const TableCellWithStyles = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
        renderHTML: (attributes: Record<string, string | null>) => {
          if (!attributes.backgroundColor) return {}
          return { style: `background-color: ${attributes.backgroundColor}` }
        },
      },
    }
  },
})

/**
 * Extended TableHeader with backgroundColor support.
 */
export const TableHeaderWithStyles = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
        renderHTML: (attributes: Record<string, string | null>) => {
          if (!attributes.backgroundColor) return {}
          return { style: `background-color: ${attributes.backgroundColor}` }
        },
      },
    }
  },
})
