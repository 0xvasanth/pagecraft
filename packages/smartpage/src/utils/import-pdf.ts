import type { PDFDocumentProxy } from 'pdfjs-dist'

export interface ImportResult {
  html: string
  messages: string[]
}

// Lazy-load pdfjs-dist so it's code-split into its own chunk
async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  const version = pdfjs.version || '5.5.207'
  // Use unpkg — cdnjs doesn't have pdfjs v5+
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`
  return pdfjs
}

/**
 * Import a PDF file and extract text + images as styled HTML.
 *
 * Extracts:
 * - Text with font size, bold/italic detection, and position
 * - Text color from the graphics state operator list
 * - Images embedded as base64
 * - Page breaks between pages
 *
 * Infers:
 * - Headings from font size ratios
 * - Text alignment from x-position relative to page width
 * - Bold from font name
 */
export async function importPdf(file: File): Promise<ImportResult> {
  const arrayBuffer = await file.arrayBuffer()
  const messages: string[] = []

  const pdfjs = await loadPdfJs()

  let pdf: PDFDocumentProxy
  try {
    pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  } catch (err) {
    return {
      html: '<p>Failed to load PDF. The file may be corrupted or password-protected.</p>',
      messages: [`error: ${err}`],
    }
  }

  const totalPages = pdf.numPages
  messages.push(`Importing ${totalPages} page(s)`)

  const pageHtmlParts: string[] = []

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 1 })

    // Extract text content with style info
    const textContent = await page.getTextContent()

    // Extract text colors from operator list
    const textColors = await extractTextColors(page, pdfjs)

    // Convert to HTML with styles preserved
    const pageHtml = textItemsToHtml(
      textContent.items as TextItem[],
      textColors,
      viewport.width,
    )

    // Extract images
    const imageHtmlParts = await extractPageImages(page)

    let fullPageHtml = pageHtml
    if (imageHtmlParts.length > 0) {
      fullPageHtml += imageHtmlParts.join('\n')
    }

    pageHtmlParts.push(fullPageHtml)

    if (pageNum < totalPages) {
      pageHtmlParts.push('<div data-page-break class="page-break"></div>')
    }
  }

  return {
    html: pageHtmlParts.join('\n'),
    messages,
  }
}

interface TextItem {
  str: string
  dir: string
  transform: number[]
  width: number
  height: number
  fontName: string
  hasEOL: boolean
}

interface StyledLine {
  text: string
  fontSize: number
  y: number
  x: number
  isBold: boolean
  isItalic: boolean
  color: string | null  // hex color
  pageWidth: number
}

/**
 * Extract text colors from the PDF operator list.
 * Tracks graphics state color changes (rg/RG/k/K/cs/CS + sc/SC)
 * before text-drawing operations (Tj/TJ/').
 */
async function extractTextColors(
  page: import('pdfjs-dist').PDFPageProxy,
  pdfjs: typeof import('pdfjs-dist'),
): Promise<Map<number, string>> {
  const colors = new Map<number, string>()
  try {
    const ops = await page.getOperatorList()
    const { OPS } = pdfjs
    let currentColor = '#000000'
    let textItemIdx = 0

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i]
      const args = ops.argsArray[i]

      // RGB color: rg (fill) or RG (stroke)
      if (fn === OPS.setFillRGBColor && args.length >= 3) {
        const r = Math.round(args[0] * 255)
        const g = Math.round(args[1] * 255)
        const b = Math.round(args[2] * 255)
        currentColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      }

      // CMYK color: k
      if (fn === OPS.setFillCMYKColor && args.length >= 4) {
        const [c, m, y, k] = args
        const r = Math.round(255 * (1 - c) * (1 - k))
        const g = Math.round(255 * (1 - m) * (1 - k))
        const b = Math.round(255 * (1 - y) * (1 - k))
        currentColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      }

      // Gray color: g
      if (fn === OPS.setFillGray && args.length >= 1) {
        const v = Math.round(args[0] * 255)
        currentColor = `#${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}`
      }

      // Text drawing operations — associate current color
      if (fn === OPS.showText || fn === OPS.showSpacedText || fn === OPS.nextLineShowText) {
        if (currentColor !== '#000000') {
          colors.set(textItemIdx, currentColor)
        }
        textItemIdx++
      }
    }
  } catch {
    // Operator list parsing failed — skip colors
  }
  return colors
}

function textItemsToHtml(
  items: TextItem[],
  textColors: Map<number, string>,
  pageWidth: number,
): string {
  if (items.length === 0) return ''

  // Build styled lines from text items
  const lines: StyledLine[] = []
  let currentLine: StyledLine | null = null
  const LINE_THRESHOLD = 3
  let textItemIdx = 0

  for (const item of items) {
    if (!item.str.trim() && !item.hasEOL) continue

    const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12
    const y = item.transform[5]
    const x = item.transform[4]
    const fontName = item.fontName?.toLowerCase() || ''
    const isBold = fontName.includes('bold') || fontName.includes('black')
    const isItalic = fontName.includes('italic') || fontName.includes('oblique')
    const color = textColors.get(textItemIdx) || null
    textItemIdx++

    if (!currentLine || Math.abs(currentLine.y - y) > LINE_THRESHOLD) {
      if (currentLine) lines.push(currentLine)
      currentLine = {
        text: item.str,
        fontSize: Math.round(fontSize),
        y,
        x: Math.round(x),
        isBold,
        isItalic,
        color,
        pageWidth,
      }
    } else {
      currentLine.text += item.str
      if (fontSize > currentLine.fontSize) {
        currentLine.fontSize = Math.round(fontSize)
      }
      if (isBold) currentLine.isBold = true
      if (isItalic) currentLine.isItalic = true
      // Keep the first non-null color
      if (!currentLine.color && color) currentLine.color = color
    }
  }
  if (currentLine) lines.push(currentLine)
  if (lines.length === 0) return ''

  // Determine body font size (most common)
  const fontSizeCounts = new Map<number, number>()
  for (const line of lines) {
    fontSizeCounts.set(line.fontSize, (fontSizeCounts.get(line.fontSize) || 0) + 1)
  }
  let bodyFontSize = 12
  let maxCount = 0
  for (const [size, count] of fontSizeCounts) {
    if (count > maxCount) { maxCount = count; bodyFontSize = size }
  }

  // Convert lines to HTML with styles
  const htmlParts: string[] = []

  for (const line of lines) {
    const trimmed = line.text.trim()
    if (!trimmed) continue

    const escaped = escapeHtml(trimmed)
    const ratio = line.fontSize / bodyFontSize

    // Build inline styles
    const styles: string[] = []
    if (line.color) styles.push(`color: ${line.color}`)
    if (line.fontSize !== bodyFontSize) styles.push(`font-size: ${line.fontSize}pt`)

    // Infer alignment from x position
    const alignment = inferAlignment(line.x, line.pageWidth)
    if (alignment !== 'left') styles.push(`text-align: ${alignment}`)

    const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : ''

    // Wrap text with formatting tags
    let content = escaped
    if (line.isBold && line.isItalic) {
      content = `<strong><em>${escaped}</em></strong>`
    } else if (line.isBold) {
      content = `<strong>${escaped}</strong>`
    } else if (line.isItalic) {
      content = `<em>${escaped}</em>`
    }

    // Determine tag based on font size ratio
    if (ratio >= 1.8) {
      htmlParts.push(`<h1${styleAttr}>${content}</h1>`)
    } else if (ratio >= 1.5) {
      htmlParts.push(`<h2${styleAttr}>${content}</h2>`)
    } else if (ratio >= 1.2) {
      htmlParts.push(`<h3${styleAttr}>${content}</h3>`)
    } else if (line.isBold && line.text.length < 100 && !line.color) {
      htmlParts.push(`<h4${styleAttr}>${content}</h4>`)
    } else {
      htmlParts.push(`<p${styleAttr}>${content}</p>`)
    }
  }

  return htmlParts.join('\n')
}

/**
 * Infer text alignment from x-position relative to page width.
 * PDF coordinates: x=0 is left edge.
 */
function inferAlignment(x: number, pageWidth: number): string {
  if (pageWidth <= 0) return 'left'
  const leftMargin = pageWidth * 0.15   // ~15% margin
  const centerZone = pageWidth * 0.35   // center starts at 35%
  const rightZone = pageWidth * 0.65    // right-aligned if starts past 65%

  if (x > rightZone) return 'right'
  if (x > centerZone) return 'center'
  return 'left'
}

async function extractPageImages(page: import('pdfjs-dist').PDFPageProxy): Promise<string[]> {
  const images: string[] = []
  try {
    const operatorList = await page.getOperatorList()
    const pdfjs = await loadPdfJs()
    const { OPS } = pdfjs

    for (let i = 0; i < operatorList.fnArray.length; i++) {
      if (
        operatorList.fnArray[i] === OPS.paintImageXObject ||
        operatorList.fnArray[i] === OPS.paintInlineImageXObject
      ) {
        const imgName = operatorList.argsArray[i][0] as string
        try {
          const imgData = await page.objs.get(imgName) as ImageBitmap | { data: Uint8ClampedArray; width: number; height: number } | null
          if (!imgData) continue

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) continue

          if (imgData instanceof ImageBitmap) {
            canvas.width = imgData.width
            canvas.height = imgData.height
            ctx.drawImage(imgData, 0, 0)
          } else if ('data' in imgData && 'width' in imgData) {
            canvas.width = imgData.width
            canvas.height = imgData.height
            const imageData = new ImageData(
              new Uint8ClampedArray(imgData.data),
              imgData.width,
              imgData.height
            )
            ctx.putImageData(imageData, 0, 0)
          } else {
            continue
          }

          if (canvas.width > 50 && canvas.height > 50) {
            const dataUrl = canvas.toDataURL('image/png')
            images.push(`<img src="${dataUrl}" alt="Imported image" />`)
          }
        } catch {
          // Skip images that fail to extract
        }
      }
    }
  } catch {
    // Operator list extraction failed
  }
  return images
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
