import './editor.css'

export { PageCraft } from './core/PageCraft'
export type { PageCraftRef, PageCraftProps } from './core/PageCraft'
export type { EditorActionsConfig } from './toolbar/EditorActions'
export { exportToPdfHtml, exportToPreviewHtml, exportToHtml } from './utils/export-html'
export { importDocx } from './utils/import-docx'
export { importPdf } from './utils/import-pdf'

// Block plugin system
export type { EditorBlockPlugin } from './blocks/types'
export { forBlock, ifBlock, readonlyBlock } from './blocks'

// Types
export type { CanvasConfig, ToolbarConfig, ToolbarFeature, TemplateVariable, ThemeConfig, ExtensionsConfig } from './types'

// Canvas presets
export { CANVAS_PRESETS, resolveCanvas } from './canvas/canvas-config'
export type { ResolvedCanvas } from './canvas/canvas-config'

// Toolbar presets
export { TOOLBAR_PRESETS, resolveToolbar } from './toolbar/toolbar-config'
