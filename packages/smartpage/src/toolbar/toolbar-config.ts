import type { ToolbarFeature, ToolbarConfig } from '../types'

const ALL_FEATURES: ToolbarFeature[] = [
  'undo', 'redo', 'heading', 'bold', 'italic', 'underline', 'strikethrough',
  'subscript', 'superscript', 'color', 'highlight',
  'alignLeft', 'alignCenter', 'alignRight', 'alignJustify',
  'bulletList', 'orderedList', 'taskList', 'indent', 'outdent',
  'link', 'table', 'image', 'horizontalRule', 'pageBreak',
  'blockquote', 'codeBlock', 'variables', 'blocks',
]

export const TOOLBAR_PRESETS: Record<string, ToolbarFeature[]> = {
  full: [...ALL_FEATURES],
  minimal: ['undo', 'redo', 'heading', 'bold', 'italic', 'underline', 'link'],
  document: [
    'undo', 'redo', 'heading', 'bold', 'italic', 'underline', 'strikethrough',
    'color', 'highlight', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify',
    'bulletList', 'orderedList', 'indent', 'outdent', 'link',
    'table', 'image', 'horizontalRule', 'pageBreak', 'blockquote',
    'variables', 'blocks',
  ],
}

export function resolveToolbar(toolbar: string | ToolbarConfig | undefined): Set<ToolbarFeature> {
  if (toolbar === undefined) return new Set(TOOLBAR_PRESETS.full)
  if (typeof toolbar === 'string') return new Set(TOOLBAR_PRESETS[toolbar] || TOOLBAR_PRESETS.full)

  const base = new Set(TOOLBAR_PRESETS[toolbar.preset || 'full'])
  toolbar.enable?.forEach(f => base.add(f))
  toolbar.disable?.forEach(f => base.delete(f))
  return base
}
