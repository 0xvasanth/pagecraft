import type { PaginationOptions } from './types'

export function injectPaginationStyles(_options: PaginationOptions) {
  document.querySelector('style[data-sp-pagination]')?.remove()

  const style = document.createElement('style')
  style.dataset.spPagination = ''

  style.textContent = `
    /* Page break — height set dynamically by pagination plugin */
    .ProseMirror .page-break {
      position: relative;
      user-select: none;
      cursor: default;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      border-top: 1px dashed #d1d5db;
    }

    .smartpage--readonly .page-break {
      border-top-color: transparent;
    }

    .ProseMirror .page-break.ProseMirror-selectednode {
      outline: none;
      border-top-color: #3b82f6;
    }

    /* Smooth margin-top transitions for pushed elements */
    .ProseMirror > * {
      transition: margin-top 0.15s ease-out;
    }
  `

  document.head.appendChild(style)
}
