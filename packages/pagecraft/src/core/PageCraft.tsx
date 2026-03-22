import type { Editor } from '@tiptap/react'
import { useEditor } from './use-editor'
import { useBlockStyles } from '../hooks/use-block-styles'
import { EditorToolbar } from '../toolbar/EditorToolbar'
import { BubbleToolbar } from '../toolbar/BubbleToolbar'
import { PageCanvas } from '../canvas/PageCanvas'
import { EditorActions, type EditorActionsConfig } from '../toolbar/EditorActions'
import { exportToPdfHtml, exportToPreviewHtml } from '../utils/export-html'
import { resolveCanvas } from '../canvas/canvas-config'
import { resolveToolbar } from '../toolbar/toolbar-config'
import { useImperativeHandle, forwardRef, useState, useCallback, useMemo, useRef, useEffect } from 'react'
import type { EditorBlockPlugin } from '../blocks/types'
import type { CanvasConfig, ToolbarConfig, TemplateVariable, ExtensionsConfig, ThemeConfig } from '../types'
import '../editor.css'

export interface PageCraftRef {
  getHTML: () => string
  getPdfHTML: (options?: { title?: string }) => string
  getPreviewHTML: (options?: { title?: string }) => string
  getJSON: () => Record<string, unknown>
  setContent: (html: string) => void
  getVariables: () => TemplateVariable[]
  getHeader: () => string
  getFooter: () => string
  setHeader: (text: string) => void
  setFooter: (text: string) => void
  setReadOnly: (readOnly: boolean) => void
  isReadOnly: () => boolean
  focus: () => void
  clear: () => void
}

export interface PageCraftProps {
  content?: string
  placeholder?: string
  onChange?: (html: string) => void
  className?: string
  variables?: TemplateVariable[] | false
  blocks?: EditorBlockPlugin[]
  header?: string
  footer?: string
  /**
   * Read-only mode. Disables content editing but keeps the document visible.
   * Toolbar remains visible (unless showToolbar={false}) so the user can
   * click the Edit/Preview toggle to switch modes.
   * Can be toggled programmatically via ref.setReadOnly().
   */
  readOnly?: boolean
  /**
   * Whether to show the toolbar. Defaults to true.
   * Set to false to completely hide the toolbar — the user cannot
   * switch between edit/preview modes (true read-only display).
   */
  showToolbar?: boolean
  actions?: boolean | EditorActionsConfig
  toolbarActions?: React.ReactNode
  canvas?: 'a4' | 'email' | CanvasConfig
  toolbar?: 'full' | 'minimal' | 'document' | ToolbarConfig
  extensions?: ExtensionsConfig
  theme?: ThemeConfig
}

export const PageCraft = forwardRef<PageCraftRef, PageCraftProps>(
  ({ content, placeholder, onChange, className, variables: initialVariables = false, blocks = [], header: initialHeader = '', footer: initialFooter = '', readOnly: initialReadOnly = false, showToolbar: showToolbarProp, actions = true, toolbarActions, canvas, toolbar, extensions: extensionsProp, theme }, ref) => {
    const variablesEnabled = initialVariables !== false
    const [variables, setVariables] = useState<TemplateVariable[]>(variablesEnabled ? initialVariables : [])
    const [header, setHeader] = useState(initialHeader)
    const [footer, setFooter] = useState(initialFooter)
    const [activeHfEditor, setActiveHfEditor] = useState<Editor | null>(null)
    const [readOnly, setReadOnly] = useState(initialReadOnly)
    const selfRef = useRef<PageCraftRef | null>(null)

    // Sync prop changes
    useEffect(() => {
      if (initialVariables !== false) setVariables(initialVariables)
    }, [initialVariables])

    useEffect(() => {
      setReadOnly(initialReadOnly)
    }, [initialReadOnly])

    const resolvedCanvas = useMemo(() => resolveCanvas(canvas), [canvas])

    const toolbarFeatures = useMemo(() => {
      const features = resolveToolbar(toolbar)
      if (resolvedCanvas.paginate === false) features.delete('pageBreak')
      if (blocks.length === 0) features.delete('blocks')
      return features
    }, [toolbar, resolvedCanvas.paginate, blocks.length])

    useBlockStyles(blocks)

    const blockExportStyles = useMemo(
      () => blocks.map(b => b.exportStyles || '').filter(Boolean).join('\n'),
      [blocks]
    )

    const editor = useEditor({
      content,
      placeholder,
      variables: variablesEnabled ? variables : false,
      blocks,
      canvas: resolvedCanvas,
      extensions: extensionsProp,
      onUpdate: onChange,
    })

    // Sync editor editable state with readOnly
    useEffect(() => {
      if (editor) {
        editor.setEditable(!readOnly)
      }
    }, [editor, readOnly])

    const handleAddVariable = useCallback((name: string) => {
      setVariables(prev => prev.some(v => v.key === name) ? prev : [...prev, { key: name }])
    }, [])

    const toolbarEditor = activeHfEditor ?? editor

    const refValue: PageCraftRef = {
      getHTML: () => editor?.getHTML() ?? '',
      getPdfHTML: (options) => exportToPdfHtml(editor?.getHTML() ?? '', {
        ...options,
        extraStyles: blockExportStyles,
        header,
        footer,
      }),
      getPreviewHTML: (options) => exportToPreviewHtml(editor?.getHTML() ?? '', {
        ...options,
        extraStyles: blockExportStyles,
        header,
        footer,
      }),
      getJSON: () => editor?.getJSON() as Record<string, unknown> ?? {},
      setContent: (html: string) => editor?.commands.setContent(html),
      getVariables: () => variables,
      getHeader: () => header,
      getFooter: () => footer,
      setHeader,
      setFooter,
      setReadOnly,
      isReadOnly: () => readOnly,
      focus: () => editor?.commands.focus(),
      clear: () => editor?.commands.clearContent(),
    }

    selfRef.current = refValue
    useImperativeHandle(ref, () => refValue, [editor, variables, blockExportStyles, header, footer, readOnly])

    // Resolve actions config — pass setReadOnly for preview toggle
    const actionsConfig: EditorActionsConfig | null = actions === false
      ? null
      : actions === true
        ? {}
        : actions

    // Build the combined right-side toolbar content
    const rightActions = (
      <>
        {actionsConfig && (
          <EditorActions
            config={actionsConfig}
            editorRef={selfRef}
            readOnly={readOnly}
            onToggleReadOnly={() => setReadOnly(prev => !prev)}
          />
        )}
        {toolbarActions}
      </>
    )

    // Toolbar visible by default — hide only when explicitly set to false
    const showToolbar = showToolbarProp !== false

    if (!editor) return null

    return (
      <div className={`pagecraft flex flex-col h-full ${readOnly ? 'pagecraft--readonly' : ''} ${className ?? ''}`}>
        {showToolbar && (
          <EditorToolbar
            editor={toolbarEditor}
            variables={variablesEnabled ? variables : undefined}
            onAddVariable={variablesEnabled ? handleAddVariable : undefined}
            blocks={blocks}
            actions={rightActions}
            readOnly={readOnly}
            features={toolbarFeatures}
          />
        )}
        {showToolbar && !readOnly && resolvedCanvas.paginate && <BubbleToolbar editor={editor} />}
        <PageCanvas
          editor={editor}
          canvas={resolvedCanvas}
          header={header}
          footer={footer}
          onHeaderChange={readOnly ? undefined : setHeader}
          onFooterChange={readOnly ? undefined : setFooter}
          onActiveHfEditor={readOnly ? undefined : setActiveHfEditor}
          readOnly={readOnly}
          theme={theme}
        />
      </div>
    )
  }
)

PageCraft.displayName = 'PageCraft'
