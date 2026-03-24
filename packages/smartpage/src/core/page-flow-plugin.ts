import { Extension } from '@tiptap/core'

interface PageFlowOptions {
  contentHeight: number
  paddingTop: number
  paddingBottom: number
  pageGap: number
  enabled: boolean
}

/**
 * Page Flow Extension
 *
 * Injects CSS margin-top rules via a <style> tag to push content that
 * crosses page boundaries to the next page's content area.
 *
 * Uses nth-child selectors. To avoid layout thrashing:
 * - Debounces at 100ms (not every keystroke)
 * - Only recomputes when content structure changes
 * - Clears rules, reads clean positions, re-applies in one rAF
 *   (single reflow instead of clear-measure-apply cycle)
 */
export const PageFlowExtension = Extension.create<PageFlowOptions>({
  name: 'pageFlow',

  addOptions() {
    return {
      contentHeight: 930.5,   // default A4
      paddingTop: 96,
      paddingBottom: 96,
      pageGap: 40,
      enabled: true,
    }
  },

  onCreate() {
    if (!this.options.enabled) return

    const style = document.createElement('style')
    style.setAttribute('data-page-flow', 'true')
    document.head.appendChild(style)

    const editor = this.editor
    const options = this.options
    let timeout: ReturnType<typeof setTimeout> | null = null
    let lastChildCount = -1
    let lastScrollHeight = -1

    function schedule() {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        requestAnimationFrame(() => {
          // Guard against editor not being mounted yet
          let dom: HTMLElement
          try {
            dom = editor.view.dom as HTMLElement
          } catch {
            return // Editor view not available yet — retry on next update
          }
          if (!dom) return

          // Only recompute when content actually changed
          const childCount = dom.children.length
          const scrollH = dom.scrollHeight
          if (childCount === lastChildCount && Math.abs(scrollH - lastScrollHeight) < 5) return
          lastChildCount = childCount
          lastScrollHeight = scrollH

          computeAndApply(dom, style, options)
        })
      }, 100)
    }

    editor.on('update', schedule)
    editor.on('create', schedule)
    schedule()

    ;(this as any)._pageFlowCleanup = () => {
      if (timeout) clearTimeout(timeout)
      editor.off('update', schedule)
      style.remove()
    }
  },

  onDestroy() {
    ;(this as any)._pageFlowCleanup?.()
  },
})

function computeAndApply(dom: HTMLElement, style: HTMLStyleElement, options: PageFlowOptions) {
  if (!dom) return

  const contentH = options.contentHeight
  const gap = options.paddingTop + options.pageGap + options.paddingBottom
  const pageSpan = contentH + gap

  // Clear existing rules and read clean positions in one go
  style.textContent = ''
  // Force synchronous reflow — positions are now clean (no spacer margins)
  void dom.offsetHeight

  const rules: string[] = []
  let cumulativeSpacer = 0

  for (let i = 0; i < dom.children.length; i++) {
    const el = dom.children[i] as HTMLElement
    if (!el || el.nodeType !== 1) continue

    // Page break: push next content to the start of the next page
    if (el.classList.contains('page-break') || el.hasAttribute('data-page-break')) {
      const breakTop = el.offsetTop + cumulativeSpacer
      const pageIndex = Math.floor(breakTop / pageSpan)
      const nextPageStart = (pageIndex + 1) * pageSpan
      const remaining = nextPageStart - breakTop
      if (remaining > 0) {
        // Hide the page-break element and use its margin to create the gap
        rules.push(`.ProseMirror > :nth-child(${i + 1}) { height: 0; overflow: hidden; margin-top: ${remaining}px !important; }`)
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

    if (actualBottom > pageContentEnd + 1 && actualTop < pageContentEnd - 1) {
      const margin = pageContentEnd + gap - actualTop
      if (margin > 0) {
        rules.push(`.ProseMirror > :nth-child(${i + 1}) { margin-top: ${margin}px !important; }`)
        cumulativeSpacer += margin
      }
    }
  }

  // Apply all rules at once — single reflow
  style.textContent = rules.join('\n')
}
