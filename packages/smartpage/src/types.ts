export interface TemplateVariable {
  key: string
  label?: string
}

export interface ThemeConfig {
  fontFamily?: string
  fontSize?: string
  lineHeight?: string
  textColor?: string
  canvasBackground?: string
  pageBackground?: string
}

export interface ExtensionsConfig {
  add?: any[]
  remove?: string[]
  configure?: Record<string, any>
}

export type ToolbarFeature =
  | 'undo' | 'redo'
  | 'heading' | 'bold' | 'italic' | 'underline' | 'strikethrough'
  | 'subscript' | 'superscript'
  | 'color' | 'highlight'
  | 'alignLeft' | 'alignCenter' | 'alignRight' | 'alignJustify'
  | 'bulletList' | 'orderedList' | 'taskList' | 'indent' | 'outdent'
  | 'link'
  | 'table' | 'image' | 'horizontalRule' | 'pageBreak'
  | 'blockquote' | 'codeBlock'
  | 'variables' | 'blocks'

export interface ToolbarConfig {
  preset?: 'full' | 'minimal' | 'document'
  enable?: ToolbarFeature[]
  disable?: ToolbarFeature[]
}

export interface CanvasConfig {
  width: string
  height?: string
  padding?: { top: string; right: string; bottom: string; left: string }
  paginate?: boolean
  pageGap?: number
}
