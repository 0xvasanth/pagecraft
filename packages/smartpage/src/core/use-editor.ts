import { useEditor as useTipTapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TableWithStyles as Table, TableCellWithStyles as TableCell, TableHeaderWithStyles as TableHeader } from '../extensions/table-styles'
import { TableRow } from '@tiptap/extension-table-row'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Typography } from '@tiptap/extension-typography'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Link } from '@tiptap/extension-link'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { PageBreak } from '../extensions/page-break'
import { ResizableImage } from '../extensions/resizable-image'
import { PasteHandler } from '../extensions/paste-handler'
import { TemplateVariable } from '../extensions/template-variable'
import { FontSize } from '../extensions/font-size'
import { PaginationExtension } from '../plugins/pagination'
import type { EditorBlockPlugin, BlockContext } from '../blocks/types'
import type { ResolvedCanvas } from '../canvas/canvas-config'
import type { TemplateVariable as TemplateVariableType, ExtensionsConfig } from '../types'

interface UseEditorOptions {
  content?: string
  placeholder?: string
  variables?: TemplateVariableType[] | false
  blocks?: EditorBlockPlugin[]
  canvas?: ResolvedCanvas
  extensions?: ExtensionsConfig
  onUpdate?: (html: string) => void
}

function buildExtensions(
  extConfig: ExtensionsConfig | undefined,
  canvas: ResolvedCanvas | undefined,
  variables: TemplateVariableType[] | false,
  blocks: EditorBlockPlugin[],
  placeholder: string,
) {
  // 1. Build default extensions as a Map: name -> configured extension
  const defaults = new Map<string, any>()

  defaults.set('starterKit', StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, link: false, underline: false }))
  defaults.set('table', Table.configure({ resizable: true, handleWidth: 5, cellMinWidth: 80, lastColumnResizable: true }))
  defaults.set('tableRow', TableRow)
  defaults.set('tableCell', TableCell)
  defaults.set('tableHeader', TableHeader)
  defaults.set('textAlign', TextAlign.configure({ types: ['heading', 'paragraph'] }))
  defaults.set('underline', Underline)
  defaults.set('textStyle', TextStyle)
  defaults.set('color', Color)
  defaults.set('fontSize', FontSize)
  defaults.set('highlight', Highlight.configure({ multicolor: true }))
  defaults.set('placeholder', Placeholder.configure({ placeholder }))
  defaults.set('typography', Typography)
  defaults.set('taskList', TaskList)
  defaults.set('taskItem', TaskItem.configure({ nested: true }))
  defaults.set('link', Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }))
  defaults.set('subscript', Subscript)
  defaults.set('superscript', Superscript)
  defaults.set('pageBreak', PageBreak)
  defaults.set('resizableImage', ResizableImage)
  defaults.set('pasteHandler', PasteHandler)
  defaults.set('pagination', PaginationExtension.configure({
    pageHeight: canvas?.heightPx || 1122.5,
    pageWidth: canvas?.width || '210mm',
    pageGap: canvas?.pageGap || 40,
    marginTop: canvas?.paddingPx.top || 96,
    marginBottom: canvas?.paddingPx.bottom || 96,
    marginLeft: canvas?.paddingPx.left || 96,
    marginRight: canvas?.paddingPx.right || 96,
    pageGapBackground: '#f0f0f0',
    enabled: canvas?.paginate ?? true,
  }))

  // Template variable — only if variables is not false
  if (variables !== false) {
    defaults.set('templateVariable', TemplateVariable.configure({ variables: variables || [] }))
  }

  // 2. Apply configure overrides from user config
  if (extConfig?.configure) {
    for (const [name, options] of Object.entries(extConfig.configure)) {
      const existing = defaults.get(name)
      if (existing && typeof existing.configure === 'function') {
        defaults.set(name, existing.configure(options))
      }
    }
  }

  // 3. Remove requested extensions
  if (extConfig?.remove) {
    for (const name of extConfig.remove) {
      defaults.delete(name)
    }
  }

  // 4. Skip pagination when not paginated
  if (canvas && !canvas.paginate) {
    defaults.delete('pageBreak')
    defaults.delete('pagination')
  }

  // 5. Collect all + add custom + add block extensions
  const variablesEnabled = variables !== false
  const ctx: BlockContext = { variables: variablesEnabled ? variables : [] }
  const blockExts = blocks.map(b => typeof b.extension === 'function' ? b.extension(ctx) : b.extension)

  return [
    ...defaults.values(),
    ...(extConfig?.add || []),
    ...blockExts,
  ]
}

export function useEditor(options: UseEditorOptions = {}) {
  const { content = '', placeholder = 'Start typing...', variables = false, blocks = [], canvas, extensions: extConfig, onUpdate } = options

  const editor = useTipTapEditor({
    extensions: buildExtensions(extConfig, canvas, variables, blocks, placeholder),
    content,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'ProseMirror',
        spellcheck: 'true',
      },
      // Clean up Word/Office HTML while preserving formatting tags
      transformPastedHTML(html) {
        // Remove Word-specific XML namespaces and conditional comments
        let cleaned = html
          .replace(/<!--\[if[\s\S]*?endif\]-->/gi, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<o:p[\s\S]*?<\/o:p>/gi, '')
          .replace(/<w:[\s\S]*?<\/w:[\s\S]*?>/gi, '')
          .replace(/\s*mso-[^:]+:[^;"]+;?/gi, '')
          .replace(/\s*class="Mso[^"]*"/gi, '')

        return cleaned
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        const images = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (images.length === 0) return false

        event.preventDefault()

        images.forEach(file => {
          const reader = new FileReader()
          reader.onload = () => {
            const src = reader.result as string
            const { schema } = view.state
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
            if (coordinates) {
              const node = schema.nodes.resizableImage?.create({ src })
              if (node) {
                const tr = view.state.tr.insert(coordinates.pos, node)
                view.dispatch(tr)
              }
            }
          }
          reader.readAsDataURL(file)
        })
        return true
      },
    },
  })

  return editor
}
