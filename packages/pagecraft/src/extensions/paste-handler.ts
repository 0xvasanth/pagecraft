import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * Enhanced paste handler that preserves formatting from Google Docs,
 * Word, and other rich text editors.
 *
 * Strategy:
 * - For Google Docs: resolve class-based styles to inline/semantic HTML,
 *   then let TipTap parse the enriched HTML.
 * - For Word: Word already uses semantic HTML tags (<b>, <i>, <table>),
 *   so we let TipTap handle it natively.
 * - For plain text / unknown sources: let TipTap handle natively.
 * - For pasted images: convert to base64 and insert as resizableImage.
 */
export const PasteHandler = Extension.create({
  name: 'pasteHandler',

  addProseMirrorPlugins() {
    const editor = this.editor

    return [
      new Plugin({
        key: new PluginKey('pasteHandler'),
        props: {
          handlePaste(_view, event) {
            const clipboardData = event.clipboardData
            if (!clipboardData) return false

            // Check for pasted images first
            const items = clipboardData.items
            if (items) {
              for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                  event.preventDefault()
                  const file = item.getAsFile()
                  if (!file) continue

                  const reader = new FileReader()
                  reader.onload = () => {
                    const src = reader.result as string
                    editor.commands.setImage({ src })
                  }
                  reader.readAsDataURL(file)
                  return true
                }
              }
            }

            const html = clipboardData.getData('text/html')
            if (!html) return false

            // Only intercept if this is Google Docs content.
            // Google Docs includes a specific marker in pasted HTML.
            const isGoogleDocs = html.includes('docs-internal-guid') ||
                                 html.includes('google-sheets-html')

            if (!isGoogleDocs) {
              // Let TipTap handle Word, other editors, and generic HTML natively.
              // TipTap's ProseMirror parser already handles <b>, <i>, <em>,
              // <strong>, <table>, <ul>, <ol>, <h1>-<h6>, etc.
              return false
            }

            // Google Docs uses <style> blocks with class-based formatting
            // (e.g., .c1 { font-weight: 700 }). We need to resolve those
            // computed styles into inline styles/semantic HTML BEFORE
            // stripping the stylesheet.
            const cleaned = cleanGoogleDocsHtml(html)
            editor.commands.insertContent(cleaned, {
              parseOptions: {
                preserveWhitespace: 'full',
              },
            })
            return true
          },
        },
      }),
    ]
  },
})

function cleanGoogleDocsHtml(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // Step 1: Build a map of class -> styles from the <style> blocks
  // BEFORE removing them, so we can resolve class-based formatting.
  const styleMap = new Map<string, Record<string, string>>()

  doc.querySelectorAll('style').forEach(styleEl => {
    const text = styleEl.textContent || ''
    // Parse CSS rules like: .c1{font-weight:700;font-style:italic}
    const ruleRegex = /\.([a-zA-Z][\w-]*)\s*\{([^}]*)\}/g
    let match
    while ((match = ruleRegex.exec(text)) !== null) {
      const className = match[1]
      const declarations = match[2]
      const styles: Record<string, string> = {}
      declarations.split(';').forEach(decl => {
        const parts = decl.split(':')
        const prop = parts[0]?.trim()
        const val = parts.slice(1).join(':').trim()
        if (prop && val) {
          styles[prop] = val
        }
      })
      styleMap.set(className, styles)
    }
  })

  // Step 2: Remove meta/style/script tags now that we extracted styles
  doc.querySelectorAll('meta, style, script').forEach(el => el.remove())

  // Step 3: For each element, resolve class-based + inline styles
  // into semantic HTML and preserved inline styles
  const allElements = doc.querySelectorAll('*')
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i] as HTMLElement

    // Merge class-based styles with inline styles (inline takes precedence)
    const resolvedStyles: Record<string, string> = {}

    // First apply class-based styles
    el.classList.forEach(cls => {
      const classStyles = styleMap.get(cls)
      if (classStyles) {
        Object.assign(resolvedStyles, classStyles)
      }
    })

    // Then apply inline styles (override class-based)
    for (let j = 0; j < el.style.length; j++) {
      const prop = el.style[j]
      resolvedStyles[prop] = el.style.getPropertyValue(prop)
    }

    // Determine which semantic wrappers are needed
    const wrappers: string[] = []

    // Bold
    const fw = resolvedStyles['font-weight']
    if (fw === 'bold' || fw === '700' || fw === '800' || fw === '900') {
      if (el.tagName !== 'STRONG' && el.tagName !== 'B') {
        wrappers.push('strong')
      }
    }

    // Italic
    if (resolvedStyles['font-style'] === 'italic') {
      if (el.tagName !== 'EM' && el.tagName !== 'I') {
        wrappers.push('em')
      }
    }

    // Underline
    const td = resolvedStyles['text-decoration'] || resolvedStyles['text-decoration-line'] || ''
    if (td.includes('underline') && el.tagName !== 'U') {
      wrappers.push('u')
    }

    // Strikethrough
    if (td.includes('line-through') && el.tagName !== 'S' && el.tagName !== 'DEL') {
      wrappers.push('s')
    }

    // Apply semantic wrappers to inline content only
    if (wrappers.length > 0 && el.childNodes.length > 0) {
      const blockTags = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE', 'LI']
      const hasBlockChildren = Array.from(el.children).some(child =>
        blockTags.includes(child.tagName)
      )

      if (!hasBlockChildren) {
        // Move all children into nested wrappers
        const children = Array.from(el.childNodes)
        // Build outermost-first: <strong><em><u>content</u></em></strong>
        let current: HTMLElement | DocumentFragment = doc.createDocumentFragment()
        children.forEach(child => current.appendChild(child))

        for (let w = wrappers.length - 1; w >= 0; w--) {
          const tag = doc.createElement(wrappers[w])
          tag.appendChild(current)
          current = tag
        }

        el.appendChild(current)
      }
    }

    // Preserve text color
    const color = resolvedStyles['color']
    if (color && !isBlackColor(color)) {
      el.style.color = color
    }

    // Preserve background color (highlight)
    const bgColor = resolvedStyles['background-color']
    if (bgColor && !isTransparentColor(bgColor)) {
      el.style.backgroundColor = bgColor
    }

    // Preserve text alignment
    const textAlign = resolvedStyles['text-align']
    if (textAlign && textAlign !== 'start' && textAlign !== 'left') {
      el.style.textAlign = textAlign
    }

    // Preserve font size if specified
    const fontSize = resolvedStyles['font-size']
    if (fontSize) {
      el.style.fontSize = fontSize
    }

    // Preserve margin-left for indentation
    const marginLeft = resolvedStyles['margin-left']
    if (marginLeft && marginLeft !== '0px' && marginLeft !== '0') {
      el.style.marginLeft = marginLeft
    }

    // Preserve padding-left for indentation
    const paddingLeft = resolvedStyles['padding-left']
    if (paddingLeft && paddingLeft !== '0px' && paddingLeft !== '0') {
      el.style.paddingLeft = paddingLeft
    }

    // Clean up Google-specific classes
    const classesToRemove = Array.from(el.classList).filter(c =>
      /^c\d+$/.test(c) || c.startsWith('docs-internal')
    )
    classesToRemove.forEach(c => el.classList.remove(c))

    if (el.classList.length === 0) {
      el.removeAttribute('class')
    }
  }

  // Step 4: Unwrap empty/decoration-only spans
  doc.querySelectorAll('span').forEach(span => {
    const hasStyle = span.hasAttribute('style') && span.style.cssText.trim().length > 0
    const hasClass = span.hasAttribute('class')
    const hasId = span.hasAttribute('id')

    if (!hasStyle && !hasClass && !hasId) {
      const parent = span.parentNode
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span)
        }
        parent.removeChild(span)
      }
    }
  })

  return doc.body.innerHTML
}

function isBlackColor(color: string): boolean {
  return color === 'rgb(0, 0, 0)' ||
         color === '#000000' ||
         color === '#000' ||
         color === 'black'
}

function isTransparentColor(color: string): boolean {
  return color === 'transparent' ||
         color === 'rgba(0, 0, 0, 0)' ||
         color === 'initial' ||
         color === 'inherit'
}
