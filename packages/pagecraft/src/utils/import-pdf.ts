import type { PDFDocumentProxy } from 'pdfjs-dist'

export interface ImportResult {
  html: string
  messages: string[]
}

// Lazy-load pdfjs-dist so it's code-split into its own chunk
// and only downloaded when the user actually imports a PDF.
async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  // Derive worker version from the installed package to avoid mismatches
  const version = pdfjs.version || '5.5.207'
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`
  return pdfjs
}

/**
 * Import a PDF file and extract text + images as HTML.
 *
 * PDFs are a display format, not a document format — they don't store
 * semantic structure (headings, lists, tables). This extractor:
 *
 * 1. Extracts text items with their font size and position
 * 2. Groups text into paragraphs based on vertical gaps
 * 3. Infers headings from larger font sizes
 * 4. Extracts embedded images via the operator list
 * 5. Inserts page breaks between pages
 *
 * The result is a best-effort reconstruction suitable for editing.
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

    // Extract text content
    const textContent = await page.getTextContent()
    const pageHtml = textItemsToHtml(textContent.items as TextItem[])

    // Extract images from this page
    const imageHtmlParts = await extractPageImages(page)

    // Combine text and images for this page
    let fullPageHtml = pageHtml
    if (imageHtmlParts.length > 0) {
      fullPageHtml += imageHtmlParts.join('\n')
    }

    pageHtmlParts.push(fullPageHtml)

    // Add page break between pages (not after the last one)
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

interface TextLine {
  text: string
  fontSize: number
  y: number
  isBold: boolean
}

function textItemsToHtml(items: TextItem[]): string {
  if (items.length === 0) return ''

  // Group text items into lines based on Y position
  const lines: TextLine[] = []
  let currentLine: TextLine | null = null
  const LINE_THRESHOLD = 3 // pixels — items within this Y range are same line

  for (const item of items) {
    if (!item.str.trim() && !item.hasEOL) continue

    const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12
    const y = item.transform[5]
    const isBold = item.fontName?.toLowerCase().includes('bold') ?? false

    if (!currentLine || Math.abs(currentLine.y - y) > LINE_THRESHOLD) {
      // New line
      if (currentLine) lines.push(currentLine)
      currentLine = {
        text: item.str,
        fontSize: Math.round(fontSize),
        y,
        isBold,
      }
    } else {
      // Same line — append text
      currentLine.text += item.str
      // Use the larger font size if mixed
      if (fontSize > currentLine.fontSize) {
        currentLine.fontSize = Math.round(fontSize)
      }
      if (isBold) currentLine.isBold = true
    }
  }
  if (currentLine) lines.push(currentLine)

  if (lines.length === 0) return ''

  // Determine the most common (body) font size
  const fontSizeCounts = new Map<number, number>()
  for (const line of lines) {
    fontSizeCounts.set(line.fontSize, (fontSizeCounts.get(line.fontSize) || 0) + 1)
  }
  let bodyFontSize = 12
  let maxCount = 0
  for (const [size, count] of fontSizeCounts) {
    if (count > maxCount) {
      maxCount = count
      bodyFontSize = size
    }
  }

  // Convert lines to HTML with heading inference
  const htmlParts: string[] = []

  for (const line of lines) {
    const trimmed = line.text.trim()
    if (!trimmed) continue

    const escaped = escapeHtml(trimmed)
    const ratio = line.fontSize / bodyFontSize

    if (ratio >= 1.8) {
      htmlParts.push(`<h1>${escaped}</h1>`)
    } else if (ratio >= 1.5) {
      htmlParts.push(`<h2>${escaped}</h2>`)
    } else if (ratio >= 1.2) {
      htmlParts.push(`<h3>${escaped}</h3>`)
    } else if (line.isBold && line.text.length < 100) {
      // Short bold lines are likely sub-headings
      htmlParts.push(`<h4>${escaped}</h4>`)
    } else if (line.isBold) {
      htmlParts.push(`<p><strong>${escaped}</strong></p>`)
    } else {
      htmlParts.push(`<p>${escaped}</p>`)
    }
  }

  return htmlParts.join('\n')
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

          // Only include images above a minimum size (skip tiny decorative images)
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
    // If operator list extraction fails, skip images for this page
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
