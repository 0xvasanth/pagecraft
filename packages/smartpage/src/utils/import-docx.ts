import mammoth from 'mammoth'

export interface ImportResult {
  html: string
  messages: string[]
}

/**
 * Import a .docx file and convert it to HTML that TipTap can parse.
 *
 * Mammoth converts .docx semantic structure to clean HTML:
 * - Headings (Heading 1-6 → <h1>-<h6>)
 * - Bold, italic, underline, strikethrough
 * - Bullet and numbered lists (nested)
 * - Tables with headers
 * - Images (embedded as base64 data URIs)
 * - Links
 * - Blockquotes
 *
 * The `styleMap` option maps Word styles to HTML elements so that
 * custom heading styles and list styles are preserved.
 */
export async function importDocx(file: File): Promise<ImportResult> {
  const arrayBuffer = await file.arrayBuffer()

  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        // Map Word heading styles to HTML headings
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        // Preserve underline
        "r[style-name='Underline'] => u",
        // Map Word styles for blockquotes
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

  // Post-process: clean up mammoth output for TipTap compatibility
  let html = result.value

  // Mammoth wraps images in <p> tags — keep them as-is since TipTap
  // handles <img> inside <p> during parsing.

  // Convert any <br> in empty paragraphs to proper empty paragraphs
  html = html.replace(/<p><br\s*\/?><\/p>/g, '<p></p>')

  return {
    html,
    messages: result.messages.map(m => `${m.type}: ${m.message}`),
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
