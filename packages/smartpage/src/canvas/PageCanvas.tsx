import { EditorContent, type Editor } from '@tiptap/react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { TableControls } from '../table/TableControls'
import type { ResolvedCanvas } from './canvas-config'
import type { ThemeConfig } from '../types'
import { paginationStateKey, type PaginationState } from '../plugins/pagination'

interface PageCanvasProps {
  editor: Editor
  canvas: ResolvedCanvas
  header?: string
  footer?: string
  onHeaderChange?: (value: string) => void
  onFooterChange?: (value: string) => void
  onActiveHfEditor?: (editor: Editor | null) => void
  readOnly?: boolean
  theme?: ThemeConfig
}

function usePageState(editor: Editor, canvas: ResolvedCanvas): PaginationState {
  const fallback: PaginationState = {
    pageCount: 1,
    pageHeight: canvas.heightPx || 1122.5,
    pageGap: canvas.pageGap,
    contentHeight: (canvas.heightPx || 1122.5) - (canvas.paddingPx.top || 96) - (canvas.paddingPx.bottom || 96),
    marginTop: canvas.paddingPx.top || 96,
    marginBottom: canvas.paddingPx.bottom || 96,
  }

  const [state, setState] = useState<PaginationState>(() => {
    return paginationStateKey.getState(editor.state) ?? fallback
  })

  useEffect(() => {
    const onTransaction = () => {
      const next = paginationStateKey.getState(editor.state)
      if (next) {
        setState(prev => prev.pageCount !== next.pageCount ? next : prev)
      }
    }
    editor.on('transaction', onTransaction)
    return () => { editor.off('transaction', onTransaction) }
  }, [editor])

  return state
}

export function PageCanvas({ editor, canvas, readOnly = false, theme }: PageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pageState = usePageState(editor, canvas)

  // Non-paginated mode
  if (!canvas.paginate) {
    return (
      <div className="editor-canvas flex-1" ref={containerRef}
        style={{ ...(theme?.canvasBackground && { background: theme.canvasBackground }) }}
      >
        <div style={{
          width: canvas.width,
          margin: '0 auto',
          padding: `${canvas.padding.top} ${canvas.padding.right} ${canvas.padding.bottom} ${canvas.padding.left}`,
          background: theme?.pageBackground || 'white',
          minHeight: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          ...(theme?.fontFamily && { fontFamily: theme.fontFamily }),
          ...(theme?.fontSize && { fontSize: theme.fontSize }),
          ...(theme?.lineHeight && { lineHeight: theme.lineHeight }),
          ...(theme?.textColor && { color: theme.textColor }),
        }}>
          <EditorContent editor={editor} />
        </div>
        {!readOnly && <TableControls editor={editor} />}
      </div>
    )
  }

  // Paginated mode
  const { pageCount, pageHeight, pageGap, marginTop, marginBottom } = pageState
  const effectivePageHeight = pageHeight || (canvas.heightPx || 1122.5)
  const effectiveGap = pageGap || canvas.pageGap
  const effectiveMarginTop = marginTop || canvas.paddingPx.top
  const effectiveMarginBottom = marginBottom || canvas.paddingPx.bottom
  const totalHeight = pageCount * effectivePageHeight + Math.max(0, pageCount - 1) * effectiveGap

  const pages = Array.from({ length: pageCount }, (_, i) => ({
    top: i * (effectivePageHeight + effectiveGap),
    height: effectivePageHeight,
  }))

  return (
    <div className="editor-canvas flex-1" ref={containerRef}
      style={{ ...(theme?.canvasBackground && { background: theme.canvasBackground }) }}
    >
      <div className="editor-pages-container" style={{ position: 'relative', minHeight: totalHeight }}>
        {/* Page backgrounds */}
        {pages.map((page, i) => (
          <div
            key={`bg-${i}`}
            style={{
              position: 'absolute',
              top: page.top,
              left: '50%',
              transform: 'translateX(-50%)',
              width: canvas.width,
              height: page.height,
              background: theme?.pageBackground || 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ))}

        {/* Content layer */}
        <div
          className="editor-content-layer"
          style={{
            position: 'relative',
            zIndex: 1,
            width: canvas.width,
            margin: '0 auto',
            padding: `${canvas.padding.top} ${canvas.padding.right} ${canvas.padding.bottom} ${canvas.padding.left}`,
            minHeight: totalHeight,
            ...(theme?.fontFamily && { fontFamily: theme.fontFamily }),
            ...(theme?.fontSize && { fontSize: theme.fontSize }),
            ...(theme?.lineHeight && { lineHeight: theme.lineHeight }),
            ...(theme?.textColor && { color: theme.textColor }),
          }}
        >
          <EditorContent editor={editor} />
        </div>

        {!readOnly && <TableControls editor={editor} />}

        {/* Page margin overlays — white covers over margin areas to hide
            content that flows through page boundaries. Sits above content (z-3). */}
        {pages.map((page, i) => (
          <div key={`margins-${i}`}>
            {/* Top margin overlay */}
            <div
              style={{
                position: 'absolute',
                top: page.top,
                left: '50%',
                transform: 'translateX(-50%)',
                width: canvas.width,
                height: effectiveMarginTop,
                background: theme?.pageBackground || 'white',
                zIndex: 3,
                pointerEvents: 'none',
              }}
            />
            {/* Bottom margin overlay */}
            <div
              style={{
                position: 'absolute',
                top: page.top + page.height - effectiveMarginBottom,
                left: '50%',
                transform: 'translateX(-50%)',
                width: canvas.width,
                height: effectiveMarginBottom,
                background: theme?.pageBackground || 'white',
                zIndex: 3,
                pointerEvents: 'none',
              }}
            />
          </div>
        ))}

        {/* Page gap overlays — visible separator between pages */}
        {pages.slice(0, -1).map((page, i) => (
          <div
            key={`gap-${i}`}
            style={{
              position: 'absolute',
              top: page.top + page.height,
              left: 0,
              right: 0,
              height: effectiveGap,
              background: theme?.canvasBackground || '#f0f0f0',
              zIndex: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: '10px', color: '#9ca3af', letterSpacing: '0.05em' }}>
              {i + 1} / {pageCount}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
