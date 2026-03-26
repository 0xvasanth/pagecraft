import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { PaginationOptions, PaginationState } from './types'
import { injectPaginationStyles } from './pagination-styles'

const paginationPluginKey = new PluginKey('pagination')
const paginationStateKey = new PluginKey<PaginationState>('paginationState')

export { paginationPluginKey, paginationStateKey }

/**
 * Pagination Extension — visual page gaps via margin-top on block elements
 *
 * Approach: Walk all direct children of the ProseMirror DOM. For each
 * block that crosses a page boundary, add margin-top to push it to
 * the next page. For nested containers (lists, blockquotes), recurse
 * into children.
 *
 * This is the same battle-tested approach used by Google Docs (pre-canvas)
 * and CKEditor, but implemented cleanly:
 * - Direct inline margin-top on affected elements
 * - Single clear → measure → apply pass per recalc
 * - Debounced at 100ms, only on doc changes
 * - Page count emitted via plugin state for PageCanvas
 */
export const PaginationExtension = Extension.create<PaginationOptions>({
  name: 'pagination',

  addOptions() {
    return {
      pageHeight: 1122.5,
      pageWidth: '210mm',
      pageGap: 40,
      marginTop: 96,
      marginBottom: 96,
      marginLeft: 96,
      marginRight: 96,
      pageGapBackground: '#f0f0f0',
      enabled: true,
    }
  },

  onCreate() {
    if (!this.options.enabled) return
    injectPaginationStyles(this.options)
  },

  onDestroy() {
    document.querySelector('style[data-sp-pagination]')?.remove()
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled) return []

    const opts = this.options
    const contentH = opts.pageHeight - opts.marginTop - opts.marginBottom
    const gap = opts.marginTop + opts.pageGap + opts.marginBottom
    const pageSpan = contentH + gap

    const CONTAINER_TAGS = new Set(['OL', 'UL', 'LI', 'BLOCKQUOTE', 'DIV', 'SECTION', 'DETAILS', 'TABLE', 'TBODY', 'TR'])
    // Safety buffer to account for offsetTop measurement drift in nested elements.
    // Ensures pushed content fully clears the page margin overlay.
    const PUSH_BUFFER = 20

    const initialState: PaginationState = {
      pageCount: 1,
      pageHeight: opts.pageHeight,
      pageGap: opts.pageGap,
      contentHeight: contentH,
      marginTop: opts.marginTop,
      marginBottom: opts.marginBottom,
    }

    // Style tag for pagination rules (nth-child selectors)
    let styleTag: HTMLStyleElement | null = null

    function ensureStyleTag() {
      if (!styleTag) {
        styleTag = document.createElement('style')
        styleTag.setAttribute('data-sp-page-flow', '')
        document.head.appendChild(styleTag)
      }
      return styleTag
    }

    function clearSpacers() {
      if (styleTag) {
        styleTag.textContent = ''
      }
    }

    /**
     * Recursively walk block elements. When an element crosses a page
     * boundary, either push it (if it's a leaf block) or recurse into
     * it (if it's a container like OL/UL).
     */
    /**
     * Full reflow pass using nth-child CSS rules.
     *
     * Uses the same approach as the original SmartPage v1 page-flow plugin:
     * clear rules → force reflow → measure → generate nth-child rules → apply.
     *
     * The key difference: we recurse into containers (OL, UL, BLOCKQUOTE)
     * to find the specific child that crosses the boundary.
     */
    function reflow(dom: HTMLElement): number {
      const style = ensureStyleTag()

      // Run multiple passes — each pass applies rules, then re-measures
      // to catch cascading pushes (pushing content to page N may cause
      // page N to overflow into page N+1).
      for (let pass = 0; pass < 5; pass++) {
        // Disable the style tag to measure clean positions WITHOUT
        // clearing its content. This prevents the flash of un-pushed
        // content that causes jumpiness. The browser won't paint because
        // we re-enable it within the same synchronous JS execution.
        style.disabled = true
        void dom.offsetHeight

        const rules: string[] = []
        let cumulativeSpacer = 0

        // Walk direct children of ProseMirror
        for (let i = 0; i < dom.children.length; i++) {
          const el = dom.children[i] as HTMLElement
          if (!el || el.nodeType !== 1) continue

          // Page break: fill to next page boundary
          if (el.classList.contains('page-break') || el.hasAttribute('data-page-break')) {
            const breakTop = el.offsetTop + cumulativeSpacer
            const pageIndex = Math.floor(breakTop / pageSpan)
            const nextPageStart = (pageIndex + 1) * pageSpan
            const remaining = nextPageStart - breakTop
            if (remaining > 0) {
              rules.push(`.ProseMirror > :nth-child(${i + 1}) { height: ${remaining}px !important; overflow: hidden; }`)
              cumulativeSpacer += remaining
            }
            continue
          }

          const top = el.offsetTop
          const height = el.offsetHeight
          const actualTop = top + cumulativeSpacer
          const actualBottom = actualTop + height

          const pageIndex = Math.floor(actualTop / pageSpan)
          const pageContentEnd = pageIndex * pageSpan + contentH
          const nextPageStart = (pageIndex + 1) * pageSpan

          if (actualBottom > pageContentEnd + 1 && actualTop < nextPageStart) {
            // Container: check children
            if (CONTAINER_TAGS.has(el.tagName) && el.children.length > 0) {
              const containerRules = reflowContainer(el, `.ProseMirror > :nth-child(${i + 1})`, cumulativeSpacer, dom)
              rules.push(...containerRules.rules)
              cumulativeSpacer += containerRules.addedSpace
              continue
            }

            // Leaf: push to next page (with buffer for measurement drift)
            const margin = nextPageStart - actualTop + PUSH_BUFFER
            if (margin > 0 && margin < pageSpan) {
              rules.push(`.ProseMirror > :nth-child(${i + 1}) { margin-top: ${margin}px !important; }`)
              cumulativeSpacer += margin
            }
          }
        }

        // Apply new rules atomically — swap content and re-enable in one go
        style.textContent = rules.join('\n')
        style.disabled = false
        void dom.offsetHeight

        // Check if any elements still cross boundaries after rules applied
        let needsAnotherPass = false
        const domRect = dom.getBoundingClientRect()
        dom.querySelectorAll('li, p, h1, h2, h3, h4, h5, h6').forEach(el => {
          const rect = (el as HTMLElement).getBoundingClientRect()
          if (rect.height === 0) return
          const top = rect.top - domRect.top
          const bottom = top + rect.height
          const pageIdx = Math.floor(top / pageSpan)
          const pce = pageIdx * pageSpan + contentH
          const nps = (pageIdx + 1) * pageSpan
          // Same condition as push logic: extends past content end, starts before next page
          if (bottom > pce + 1 && top < nps) {
            needsAnotherPass = true
          }
        })

        if (!needsAnotherPass) break
      }

      // Compute page count from final scroll height
      const scrollH = dom.scrollHeight
      const totalH = scrollH + opts.marginTop + opts.marginBottom
      return Math.max(1, Math.ceil(totalH / opts.pageHeight))
    }

    /**
     * Recurse into a container element to find and push the specific
     * child that crosses the page boundary.
     */
    /**
     * Get the absolute offsetTop of an element relative to the ProseMirror
     * container by walking the offsetParent chain. This is consistent with
     * how the main loop uses el.offsetTop for direct children.
     */
    function getAbsoluteOffsetTop(el: HTMLElement, pmDom: HTMLElement): number {
      let top = 0
      let current: HTMLElement | null = el
      while (current && current !== pmDom) {
        top += current.offsetTop
        current = current.offsetParent as HTMLElement | null
      }
      return top
    }

    function reflowContainer(
      container: HTMLElement,
      parentSelector: string,
      parentCumulativeSpacer: number,
      pmDom: HTMLElement,
    ): { rules: string[]; addedSpace: number } {
      const rules: string[] = []
      let addedSpace = 0

      for (let i = 0; i < container.children.length; i++) {
        const el = container.children[i] as HTMLElement
        if (!el || el.nodeType !== 1) continue

        // Use absolute offsetTop for consistency with main loop
        const absTop = getAbsoluteOffsetTop(el, pmDom) + parentCumulativeSpacer + addedSpace
        const absBottom = absTop + el.offsetHeight

        const pageIndex = Math.floor(absTop / pageSpan)
        const pageContentEnd = pageIndex * pageSpan + contentH
        const nextPageStart = (pageIndex + 1) * pageSpan

        if (absBottom > pageContentEnd + 1 && absTop < nextPageStart) {
          if (CONTAINER_TAGS.has(el.tagName) && el.children.length > 0) {
            const childResult = reflowContainer(el, `${parentSelector} > :nth-child(${i + 1})`, parentCumulativeSpacer + addedSpace, pmDom)
            rules.push(...childResult.rules)
            addedSpace += childResult.addedSpace
            continue
          }

          const margin = nextPageStart - absTop + PUSH_BUFFER
          if (margin > 0 && margin < pageSpan) {
            rules.push(`${parentSelector} > :nth-child(${i + 1}) { margin-top: ${margin}px !important; }`)
            addedSpace += margin
          }
        }
      }

      return { rules, addedSpace }
    }

    // State tracking
    let currentPageCount = 1
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const statePlugin = new Plugin<PaginationState>({
      key: paginationStateKey,
      state: {
        init() { return initialState },
        apply(tr, value) {
          const meta = tr.getMeta(paginationStateKey)
          if (meta?.pageCount !== undefined) {
            return { ...value, pageCount: meta.pageCount }
          }
          return value
        },
      },
      view(view) {
        function doReflow() {
          if (view.isDestroyed) return
          const dom = view.dom as HTMLElement
          const newPageCount = reflow(dom)

          if (newPageCount !== currentPageCount) {
            currentPageCount = newPageCount
            const tr = view.state.tr.setMeta(paginationStateKey, { pageCount: newPageCount })
            tr.setMeta('addToHistory', false)
            view.dispatch(tr)
          }
        }

        let lastScrollHeight = -1
        let reflowInFlight = false

        function scheduleReflow() {
          if (reflowInFlight) return
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            reflowInFlight = true
            requestAnimationFrame(() => {
              doReflow()
              reflowInFlight = false
            })
          }, 80)
        }

        // Initial reflow after mount
        scheduleReflow()

        return {
          update(view, prevState) {
            // Reflow when document content changes
            if (!prevState.doc.eq(view.state.doc)) {
              scheduleReflow()
              return
            }
            // Also reflow if scrollHeight changed (catches setContent,
            // async content loads, and initial content render)
            const dom = view.dom as HTMLElement
            const sh = dom.scrollHeight
            if (sh !== lastScrollHeight && sh > 0) {
              lastScrollHeight = sh
              scheduleReflow()
            }
          },
          destroy() {
            if (debounceTimer) clearTimeout(debounceTimer)
            clearSpacers()
            styleTag?.remove()
            styleTag = null
          },
        }
      },
    })

    return [statePlugin]
  },
})
