import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

/**
 * Extended Table extension with border style support.
 * Adds a `borderStyle` attribute to the table node: 'solid' (default) or 'none'.
 */
export const TableWithStyles = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderStyle: {
        default: 'solid',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-border-style') || 'solid',
        renderHTML: (attributes: Record<string, string>) => {
          if (attributes.borderStyle === 'none') {
            return {
              'data-border-style': 'none',
              class: 'table-borderless',
            }
          }
          return { 'data-border-style': attributes.borderStyle || 'solid' }
        },
      },
    }
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
