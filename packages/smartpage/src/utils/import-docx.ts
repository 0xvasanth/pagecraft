import mammoth from 'mammoth'

export interface ImportResult {
  html: string
  messages: string[]
}

/**
 * Import a .docx file and convert it to HTML that TipTap can parse.
 *
 * Two-pass approach:
 * 1. Mammoth converts DOCX to semantic HTML (headings, lists, tables, bold, italic)
 * 2. We parse the DOCX XML directly to extract styles mammoth drops
 *    (alignment, text color, font size) and inject them into the HTML
 */
export async function importDocx(file: File): Promise<ImportResult> {
  const arrayBuffer = await file.arrayBuffer()

  // Extract styles from DOCX XML that mammoth doesn't preserve
  const paraStyles = await extractDocxStyles(arrayBuffer)

  // Convert to HTML with mammoth
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "r[style-name='Underline'] => u",
        "p[style-name='Quote'] => blockquote > p:fresh",
        "p[style-name='Block Text'] => blockquote > p:fresh",
        "p[style-name='Intense Quote'] => blockquote > p:fresh",
      ],
      convertImage: mammoth.images.imgElement(async (image) => {
        const buffer = await image.read() as unknown as ArrayBuffer
        const base64 = arrayBufferToBase64(buffer)
        const contentType = image.contentType || 'image/png'
        return { src: `data:${contentType};base64,${base64}` }
      }),
    }
  )

  // Inject extracted styles into mammoth's HTML
  let html = injectStyles(result.value, paraStyles)

  // Clean up
  html = postProcessHtml(html)

  return {
    html,
    messages: result.messages.map(m => `${m.type}: ${m.message}`),
  }
}

// ---- Style extraction from DOCX XML ----

interface ParagraphStyle {
  alignment?: string    // left, center, right, justify
  color?: string        // hex color from first run
  fontSize?: number     // half-points from first run
}

/**
 * Parse the DOCX ZIP to extract word/document.xml and read paragraph styles.
 */
async function extractDocxStyles(arrayBuffer: ArrayBuffer): Promise<ParagraphStyle[]> {
  const styles: ParagraphStyle[] = []

  try {
    const xml = await extractFileFromZip(new Uint8Array(arrayBuffer), 'word/document.xml')
    if (!xml) return styles

    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const paragraphs = doc.getElementsByTagName('w:p')

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i]
      const style: ParagraphStyle = {}

      // Paragraph alignment: <w:pPr><w:jc w:val="center"/></w:pPr>
      const pPr = para.getElementsByTagName('w:pPr')[0]
      const jc = pPr?.getElementsByTagName('w:jc')[0]
      if (jc) {
        const val = jc.getAttribute('w:val')
        if (val) style.alignment = val === 'both' ? 'justify' : val
      }

      // Run-level styles from first text run
      const firstRun = para.getElementsByTagName('w:r')[0]
      const rPr = firstRun?.getElementsByTagName('w:rPr')[0]
      if (rPr) {
        // Text color: <w:color w:val="FF0000"/>
        const color = rPr.getElementsByTagName('w:color')[0]
        const colorVal = color?.getAttribute('w:val')
        if (colorVal && colorVal !== '000000' && colorVal !== 'auto') {
          style.color = '#' + colorVal
        }

        // Font size: <w:sz w:val="24"/> (value is in half-points, so 24 = 12pt)
        const sz = rPr.getElementsByTagName('w:sz')[0]
        const szVal = sz?.getAttribute('w:val')
        if (szVal) {
          style.fontSize = parseInt(szVal, 10) / 2
        }
      }

      styles.push(style)
    }
  } catch {
    // XML parsing failed — return empty styles
  }

  return styles
}

/**
 * Extract a file from a ZIP archive (DOCX is a ZIP).
 * Uses DecompressionStream for deflate-compressed entries.
 */
async function extractFileFromZip(bytes: Uint8Array, targetPath: string): Promise<string | null> {
  try {
    for (let i = 0; i < bytes.length - 4; i++) {
      // Local file header signature: PK\x03\x04
      if (bytes[i] !== 0x50 || bytes[i + 1] !== 0x4B || bytes[i + 2] !== 0x03 || bytes[i + 3] !== 0x04) continue

      const nameLen = bytes[i + 26] | (bytes[i + 27] << 8)
      const extraLen = bytes[i + 28] | (bytes[i + 29] << 8)
      const nameStart = i + 30
      const name = new TextDecoder().decode(bytes.slice(nameStart, nameStart + nameLen))

      if (name !== targetPath) continue

      const compressionMethod = bytes[i + 8] | (bytes[i + 9] << 8)
      const compressedSize = bytes[i + 18] | (bytes[i + 19] << 8) | (bytes[i + 20] << 16) | (bytes[i + 21] << 24)
      const dataStart = nameStart + nameLen + extraLen

      if (compressionMethod === 0) {
        return new TextDecoder().decode(bytes.slice(dataStart, dataStart + compressedSize))
      }

      if (compressionMethod === 8) {
        const compressed = bytes.slice(dataStart, dataStart + compressedSize)
        const ds = new DecompressionStream('deflate-raw')
        const writer = ds.writable.getWriter()
        writer.write(compressed)
        writer.close()
        const reader = ds.readable.getReader()
        const chunks: Uint8Array[] = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }
        const totalLen = chunks.reduce((sum, c) => sum + c.length, 0)
        const result = new Uint8Array(totalLen)
        let offset = 0
        for (const chunk of chunks) {
          result.set(chunk, offset)
          offset += chunk.length
        }
        return new TextDecoder().decode(result)
      }
    }
  } catch {
    // ZIP parsing failed
  }
  return null
}

/**
 * Inject extracted styles into mammoth's HTML output.
 * Mammoth outputs block elements (p, h1-h6, li) in document order.
 * We match them with the paragraph styles from the DOCX XML.
 */
function injectStyles(html: string, paraStyles: ParagraphStyle[]): string {
  if (paraStyles.length === 0) return html

  let styleIdx = 0
  return html.replace(/<(p|h[1-6]|li)(\s[^>]*)?\s*>/g, (match, tag, attrs) => {
    const style = paraStyles[styleIdx++]
    if (!style) return match

    const cssProps: string[] = []
    if (style.alignment && style.alignment !== 'left') {
      cssProps.push(`text-align: ${style.alignment}`)
    }
    if (style.color) {
      cssProps.push(`color: ${style.color}`)
    }
    if (style.fontSize && style.fontSize !== 11) {
      // Only inject if different from default 11pt
      cssProps.push(`font-size: ${style.fontSize}pt`)
    }

    if (cssProps.length === 0) return match

    const styleStr = cssProps.join('; ')
    if ((attrs || '').includes('style=')) {
      return match.replace(/style="/, `style="${styleStr}; `)
    }
    return `<${tag}${attrs || ''} style="${styleStr}">`
  })
}

/**
 * Post-process mammoth HTML for TipTap compatibility.
 */
function postProcessHtml(html: string): string {
  html = html.replace(/<p><br\s*\/?><\/p>/g, '<p></p>')
  html = html.replace(/(<p><\/p>\s*){2,}/g, '<p></p>')
  html = html.replace(/\t/g, '    ')
  html = html.replace(/<strong>\s*<\/strong>/g, '')
  html = html.replace(/<em>\s*<\/em>/g, '')
  return html
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
