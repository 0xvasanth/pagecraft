import type { CanvasConfig } from '../types'

export const CANVAS_PRESETS: Record<string, CanvasConfig> = {
  a4: {
    width: '210mm',
    height: '297mm',
    padding: { top: '25.4mm', right: '25.4mm', bottom: '25.4mm', left: '25.4mm' },
    paginate: true,
    pageGap: 40,
  },
  email: {
    width: '600px',
    height: undefined,
    padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    paginate: false,
  },
}

export interface ResolvedCanvas {
  width: string
  height: string | undefined
  padding: { top: string; right: string; bottom: string; left: string }
  paginate: boolean
  pageGap: number
  widthPx: number
  heightPx: number | undefined
  paddingPx: { top: number; right: number; bottom: number; left: number }
  contentHeightPx: number | undefined
}

export function resolveCanvas(canvas: string | CanvasConfig | undefined): ResolvedCanvas {
  const config: CanvasConfig = typeof canvas === 'string'
    ? CANVAS_PRESETS[canvas] || CANVAS_PRESETS.a4
    : canvas || CANVAS_PRESETS.a4

  const widthPx = cssToPixels(config.width)
  const heightPx = config.height ? cssToPixels(config.height) : undefined
  const padding = config.padding || { top: '0', right: '0', bottom: '0', left: '0' }
  const paddingPx = {
    top: cssToPixels(padding.top),
    right: cssToPixels(padding.right),
    bottom: cssToPixels(padding.bottom),
    left: cssToPixels(padding.left),
  }
  const contentHeightPx = heightPx ? heightPx - paddingPx.top - paddingPx.bottom : undefined

  return {
    width: config.width,
    height: config.height,
    padding,
    paginate: config.paginate ?? true,
    pageGap: config.pageGap ?? 40,
    widthPx,
    heightPx,
    paddingPx,
    contentHeightPx,
  }
}

export function cssToPixels(value: string): number {
  const num = parseFloat(value)
  if (value.endsWith('mm')) return num * (96 / 25.4)
  if (value.endsWith('in')) return num * 96
  if (value.endsWith('cm')) return num * (96 / 2.54)
  if (value.endsWith('pt')) return num * (96 / 72)
  return num
}
