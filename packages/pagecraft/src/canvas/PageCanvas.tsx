import { EditorContent, type Editor } from '@tiptap/react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { HeaderFooterField } from './HeaderFooterField'
import { TableControls } from '../table/TableControls'
import type { ResolvedCanvas } from './canvas-config'
import type { ThemeConfig } from '../types'

interface PageRegion {
  top: number
  height: number
}

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

/**
 * Safely render HTML preview using DOMParser.
 */
function SafeHtmlPreview({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.textContent = ''
    if (!html || html === '<p></p>') return

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    doc.querySelectorAll('script, [onload], [onerror], [onclick]').forEach(el => el.remove())
    Array.from(doc.body.childNodes).forEach(child => {
      ref.current!.appendChild(document.importNode(child, true))
    })
  }, [html])

  return <div ref={ref} className={className} />
}

export function PageCanvas({ editor, canvas, header = '', footer = '', onHeaderChange, onFooterChange, onActiveHfEditor, readOnly = false, theme }: PageCanvasProps) {
  const PAGE_HEIGHT_PX = canvas.heightPx || 0
  const PAGE_PADDING_PX = canvas.paddingPx.top
  const CONTENT_HEIGHT_PX = canvas.contentHeightPx || 0
  const PAGE_GAP_PX = canvas.pageGap

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const headerEditorRef = useRef<Editor | null>(null)
  const footerEditorRef = useRef<Editor | null>(null)
  const [pages, setPages] = useState<PageRegion[]>([{ top: 0, height: PAGE_HEIGHT_PX }])
  const pagesRef = useRef(pages)
  pagesRef.current = pages
  const [editingHeader, setEditingHeader] = useState(false)
  const [editingFooter, setEditingFooter] = useState(false)

  // Exit edit mode when switching to readOnly
  useEffect(() => {
    if (readOnly) {
      setEditingHeader(false)
      setEditingFooter(false)
    }
  }, [readOnly])

  const handleStartEditHeader = useCallback(() => {
    if (readOnly) return
    setEditingFooter(false)
    setEditingHeader(true)
    setTimeout(() => onActiveHfEditor?.(headerEditorRef.current), 0)
  }, [onActiveHfEditor, readOnly])

  const handleStartEditFooter = useCallback((): void => {
    if (readOnly) return
    setEditingHeader(false)
    setEditingFooter(true)
    setTimeout(() => onActiveHfEditor?.(footerEditorRef.current), 0)
  }, [onActiveHfEditor, readOnly])

  const handleContentClick = useCallback(() => {
    if (editingHeader || editingFooter) {
      setEditingHeader(false)
      setEditingFooter(false)
      onActiveHfEditor?.(null)
    }
  }, [editingHeader, editingFooter, onActiveHfEditor])

  const recalculate = useCallback(() => {
    if (!contentRef.current || !containerRef.current) return

    const prosemirror = contentRef.current.querySelector('.ProseMirror') as HTMLElement
    if (!prosemirror) return

    const containerRect = contentRef.current.getBoundingClientRect()

    const breakEls = prosemirror.querySelectorAll('[data-page-break], .page-break')
    const breakPositions: number[] = []

    breakEls.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const relY = rect.top - containerRect.top
      breakPositions.push(relY)
    })

    breakPositions.sort((a, b) => a - b)

    const newPages: PageRegion[] = []
    let currentTop = 0

    // Calculate clean height by parsing spacer margins from the style tag
    // (avoids clearing/restoring the tag which causes layout thrashing)
    let totalSpacerMargin = 0
    const pageFlowStyle = document.querySelector('style[data-page-flow]')
    if (pageFlowStyle) {
      const matches = pageFlowStyle.textContent?.match(/margin-top:\s*([\d.]+)px/g)
      if (matches) {
        matches.forEach(m => {
          const val = parseFloat(m.replace('margin-top:', ''))
          if (!isNaN(val)) totalSpacerMargin += val
        })
      }
    }
    const cleanScrollHeight = prosemirror.scrollHeight - totalSpacerMargin
    const totalContentHeight = cleanScrollHeight + PAGE_PADDING_PX * 2

    const sectionBounds = [0, ...breakPositions, totalContentHeight]

    for (let i = 0; i < sectionBounds.length - 1; i++) {
      const sectionStart = sectionBounds[i]
      const sectionEnd = sectionBounds[i + 1]
      const sectionContentHeight = sectionEnd - sectionStart - (i > 0 ? PAGE_GAP_PX : 0)

      if (i > 0) {
        currentTop += PAGE_GAP_PX
      }

      const contentInSection = Math.max(0, sectionContentHeight - PAGE_PADDING_PX * 2)
      const pagesNeeded = Math.max(1, Math.ceil(contentInSection / CONTENT_HEIGHT_PX))

      for (let p = 0; p < pagesNeeded; p++) {
        newPages.push({
          top: currentTop,
          height: PAGE_HEIGHT_PX,
        })

        if (p < pagesNeeded - 1) {
          currentTop += PAGE_HEIGHT_PX + PAGE_GAP_PX
        } else {
          currentTop += PAGE_HEIGHT_PX
        }
      }
    }

    const prev = pagesRef.current
    if (
      newPages.length !== prev.length ||
      newPages.some((p, i) => p.top !== prev[i]?.top || p.height !== prev[i]?.height)
    ) {
      setPages(newPages)
    }
  }, [])

  useEffect(() => {
    const prosemirror = contentRef.current?.querySelector('.ProseMirror')
    if (!prosemirror) return

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(recalculate)
    })
    observer.observe(prosemirror)

    let debounce: ReturnType<typeof setTimeout> | null = null
    const onUpdate = () => {
      // Debounced recalculate — waits for page flow plugin to settle
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(() => requestAnimationFrame(recalculate), 150)
    }
    editor.on('update', onUpdate)

    requestAnimationFrame(recalculate)
    // Delayed run on mount for initial content + page flow
    setTimeout(() => requestAnimationFrame(recalculate), 200)

    return () => {
      observer.disconnect()
      editor.off('update', onUpdate)
      if (debounce) clearTimeout(debounce)
    }
  }, [editor, recalculate])

  const lastPage = pages[pages.length - 1]
  const totalHeight = lastPage ? lastPage.top + lastPage.height + PAGE_GAP_PX : PAGE_HEIGHT_PX

  const hasHeaderContent = header && header !== '<p></p>'
  const hasFooterContent = footer && footer !== '<p></p>'

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
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        ))}

        {/* Editor content layer */}
        <div
          ref={contentRef}
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
          onClick={handleContentClick}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Inline table controls */}
        {!readOnly && <TableControls editor={editor} />}

        {/* Page gap overlays */}
        {pages.slice(0, -1).map((page, i) => {
          const gapTop = page.top + page.height
          const nextPage = pages[i + 1]
          const gapHeight = nextPage ? nextPage.top - gapTop : PAGE_GAP_PX
          if (gapHeight <= 0) return null

          return (
            <div
              key={`gap-${i}`}
              style={{
                position: 'absolute',
                top: gapTop,
                left: 0,
                right: 0,
                height: gapHeight,
                background: '#f0f0f0',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{
                fontSize: '10px',
                color: '#9ca3af',
                letterSpacing: '0.05em',
                padding: '0 12px',
              }}>
                {i + 1} / {pages.length}
              </div>
            </div>
          )
        })}

        {/* Header/footer zones */}
        {pages.map((page, i) => (
          <div key={`hf-${i}`}>
            {/* Header */}
            <div
              className="pagecraft-hf pagecraft-hf--header"
              style={{
                position: 'absolute',
                top: page.top,
                left: '50%',
                transform: 'translateX(-50%)',
                width: canvas.width,
                height: PAGE_PADDING_PX,
                zIndex: 10,
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              {i === 0 ? (
                <HeaderFooterField
                  content={header}
                  onChange={html => onHeaderChange?.(html)}
                  placeholder="Double-click to add header"
                  isEditing={editingHeader}
                  onStartEdit={handleStartEditHeader}
                  editorRef={headerEditorRef}
                />
              ) : (
                <div className="pagecraft-hf-display" onDoubleClick={handleStartEditHeader}>
                  {hasHeaderContent ? (
                    <SafeHtmlPreview html={header} className="pagecraft-hf-display__content" />
                  ) : (
                    <span className="pagecraft-hf-display__placeholder">Double-click to add header</span>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="pagecraft-hf pagecraft-hf--footer"
              style={{
                position: 'absolute',
                top: page.top + page.height - PAGE_PADDING_PX,
                left: '50%',
                transform: 'translateX(-50%)',
                width: canvas.width,
                height: PAGE_PADDING_PX,
                zIndex: 10,
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              {i === 0 ? (
                <HeaderFooterField
                  content={footer}
                  onChange={html => onFooterChange?.(html)}
                  placeholder="Double-click to add footer"
                  isEditing={editingFooter}
                  onStartEdit={handleStartEditFooter}
                  editorRef={footerEditorRef}
                />
              ) : (
                <div className="pagecraft-hf-display" onDoubleClick={handleStartEditFooter}>
                  {hasFooterContent ? (
                    <SafeHtmlPreview html={footer} className="pagecraft-hf-display__content" />
                  ) : (
                    <span className="pagecraft-hf-display__placeholder">Double-click to add footer</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
