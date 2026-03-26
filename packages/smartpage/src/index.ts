import './editor.css'

export { SmartPage } from './core/SmartPage'
export type { SmartPageRef, SmartPageProps } from './core/SmartPage'
export type { EditorActionsConfig } from './toolbar/EditorActions'
export { exportToPdfHtml, exportToPreviewHtml, exportToHtml, hasSmartPageFingerprint, getSmartPageVersion } from './utils/export-html'
export { SMARTPAGE_VERSION } from './version'
export { importDocx } from './utils/import-docx'

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

// Plugins
export { PaginationExtension, paginationPluginKey, paginationStateKey } from './plugins'
export type { PaginationOptions, PaginationState } from './plugins'
