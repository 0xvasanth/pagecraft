import { useState, useRef, useCallback } from 'react'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import { Eye, Pencil, FileUp, Loader2, Printer, Download, Copy, Check, FileDown, FileText } from 'lucide-react'
import { importDocx } from '../utils/import-docx'
import { importPdf } from '../utils/import-pdf'
import type { SmartPageRef } from '../core/SmartPage'

export interface EditorActionsConfig {
  /** Enable/disable individual actions. All enabled by default. */
  import?: boolean
  preview?: boolean
  print?: boolean
  export?: boolean

  /**
   * Custom file extractor. When provided, SmartPage calls this function
   * for any file type it doesn't handle natively (e.g., PDF).
   * The consumer sends the file to their backend (Adobe, Textract, Tika, etc.)
   * and returns the extracted HTML.
   *
   * Return null to fall back to the default handler.
   */
  customExtractor?: (file: File) => Promise<string | null>

  /** Lifecycle hooks */
  onBeforeImport?: (file: File) => boolean | Promise<boolean>
  onAfterImport?: (html: string, file: File) => void
  onBeforePreview?: () => boolean
  onAfterPreview?: (html: string) => void
  onBeforePrint?: () => boolean
  onAfterPrint?: () => void
  onBeforeExport?: (format: 'html' | 'markdown' | 'clipboard') => boolean
  onAfterExport?: (content: string, format: 'html' | 'markdown' | 'clipboard') => void
}

interface EditorActionsProps {
  config: EditorActionsConfig
  editorRef: React.RefObject<SmartPageRef | null>
  readOnly: boolean
  onToggleReadOnly: () => void
}

export function EditorActions({ config, editorRef, readOnly, onToggleReadOnly }: EditorActionsProps) {
  const [importing, setImporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showImport = config.import !== false
  const showPreview = config.preview !== false
  const showPrint = config.print !== false
  const showExport = config.export !== false

  // --- Import ---
  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editorRef.current) return

    if (config.onBeforeImport) {
      const proceed = await config.onBeforeImport(file)
      if (!proceed) return
    }

    setImporting(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase()
      let html = ''

      // Try custom extractor first (for PDF, or any custom backend)
      if (config.customExtractor) {
        const extracted = await config.customExtractor(file)
        if (extracted) {
          html = extracted
        }
      }

      // Fall back to built-in handlers if custom extractor didn't handle it
      if (!html) {
        if (ext === 'docx' || ext === 'doc') {
          const result = await importDocx(file)
          html = result.html
        } else {
          const text = await file.text()
          html = text.includes('<') && text.includes('>') ? text : `<p>${text}</p>`
        }
      }

      editorRef.current.setContent(html)
      config.onAfterImport?.(html, file)
    } catch (err) {
      console.error('[SmartPage Import] Failed:', err)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [editorRef, config])

  // --- Preview (toggle readOnly mode) ---
  const handlePreview = useCallback(() => {
    if (!readOnly && config.onBeforePreview && !config.onBeforePreview()) return
    onToggleReadOnly()
    if (!readOnly) {
      const html = editorRef.current?.getPreviewHTML({ title: 'Preview' })
      if (html) config.onAfterPreview?.(html)
    }
  }, [editorRef, config, readOnly, onToggleReadOnly])

  // --- Print ---
  const handlePrint = useCallback(() => {
    if (config.onBeforePrint && !config.onBeforePrint()) return
    const html = editorRef.current?.getPdfHTML({ title: 'Document' })
    if (!html) return

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0'
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument
    if (!doc) {
      document.body.removeChild(iframe)
      return
    }
    doc.open()
    doc.write(html)
    doc.close()

    let cleaned = false
    const cleanup = () => {
      if (cleaned) return
      cleaned = true
      if (iframe.parentNode) document.body.removeChild(iframe)
      config.onAfterPrint?.()
    }

    // Fallback cleanup if onload never fires
    const fallbackTimer = setTimeout(cleanup, 10000)

    iframe.onload = () => {
      clearTimeout(fallbackTimer)
      if (cleaned) return // 10s fallback already fired
      iframe.contentWindow?.print()
      if (iframe.contentWindow) {
        iframe.contentWindow.onafterprint = cleanup
      }
      // Fallback for browsers that don't fire afterprint
      setTimeout(cleanup, 2000)
    }
  }, [editorRef, config])

  // --- Export: Copy HTML ---
  const handleCopyHtml = useCallback(async () => {
    if (config.onBeforeExport && !config.onBeforeExport('clipboard')) return
    const html = editorRef.current?.getPdfHTML({ title: 'Document' })
    if (!html) return

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([html], { type: 'text/plain' }),
        }),
      ])
    } catch {
      await navigator.clipboard.writeText(html)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    config.onAfterExport?.(html, 'clipboard')
  }, [editorRef, config])

  // --- Export: HTML file ---
  const handleExportHtml = useCallback(() => {
    if (config.onBeforeExport && !config.onBeforeExport('html')) return
    const html = editorRef.current?.getPdfHTML({ title: 'Document' })
    if (!html) return

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.html'
    a.click()
    URL.revokeObjectURL(url)
    config.onAfterExport?.(html, 'html')
  }, [editorRef, config])

  // --- Export: Markdown file ---
  const handleExportMarkdown = useCallback(() => {
    if (config.onBeforeExport && !config.onBeforeExport('markdown')) return
    const html = editorRef.current?.getHTML()
    if (!html) return

    const md = htmlToMarkdown(html)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.click()
    URL.revokeObjectURL(url)
    config.onAfterExport?.(md, 'markdown')
  }, [editorRef, config])

  if (!showImport && !showPreview && !showPrint && !showExport) return null

  return (
    <>
      {showImport && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              />
            }
          >
            {importing ? <Loader2 className="size-3.5 animate-spin" strokeWidth={1.5} /> : <FileUp className="size-3.5" strokeWidth={1.5} />}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Import</TooltipContent>
        </Tooltip>
      )}

      {showPreview && (
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePreview}
              className={readOnly ? 'bg-muted text-foreground' : ''}
            />
          }>
            {readOnly ? <Pencil className="size-3.5" strokeWidth={1.5} /> : <Eye className="size-3.5" strokeWidth={1.5} />}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {readOnly ? 'Edit' : 'Preview'}
          </TooltipContent>
        </Tooltip>
      )}

      {showPrint && (
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon-xs" onClick={handlePrint} />}>
            <Printer className="size-3.5" strokeWidth={1.5} />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Print</TooltipContent>
        </Tooltip>
      )}

      {showExport && (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger render={
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
                <Download className="size-3.5" strokeWidth={1.5} />
              </DropdownMenuTrigger>
            }>
              <Download className="size-3.5" strokeWidth={1.5} />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Export</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopyHtml}>
              {copied ? <Check className="size-3.5 mr-1.5" strokeWidth={1.5} /> : <Copy className="size-3.5 mr-1.5" strokeWidth={1.5} />}
              {copied ? 'Copied!' : 'Copy HTML'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportHtml}>
              <FileDown className="size-3.5 mr-1.5" strokeWidth={1.5} />
              Export as HTML
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportMarkdown}>
              <FileText className="size-3.5 mr-1.5" strokeWidth={1.5} />
              Export as Markdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Hidden file input */}
      {showImport && (
        <input
          ref={fileInputRef}
          type="file"
          accept={config.customExtractor ? undefined : ".docx,.doc,.html,.htm,.txt"}
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      )}

    </>
  )
}

// --- HTML to Markdown converter ---

function htmlToMarkdown(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return nodeToMd(doc.body).trim()
}

function nodeToMd(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const children = Array.from(el.childNodes).map(nodeToMd).join('')

  switch (tag) {
    case 'h1': return `# ${children}\n\n`
    case 'h2': return `## ${children}\n\n`
    case 'h3': return `### ${children}\n\n`
    case 'h4': return `#### ${children}\n\n`
    case 'p': return `${children}\n\n`
    case 'br': return '\n'
    case 'strong': case 'b': return `**${children}**`
    case 'em': case 'i': return `*${children}*`
    case 'u': return `<u>${children}</u>`
    case 's': case 'del': return `~~${children}~~`
    case 'code': return `\`${children}\``
    case 'pre': return `\`\`\`\n${el.textContent}\n\`\`\`\n\n`
    case 'a': return `[${children}](${el.getAttribute('href') || ''})`
    case 'img': return `![${el.getAttribute('alt') || ''}](${el.getAttribute('src') || ''})`
    case 'ul': case 'ol': return `${children}\n`
    case 'li': {
      const parent = el.parentElement
      if (parent?.tagName === 'OL') {
        const idx = Array.from(parent.children).indexOf(el) + 1
        return `${idx}. ${children.trim()}\n`
      }
      return `- ${children.trim()}\n`
    }
    case 'blockquote': return children.split('\n').filter(Boolean).map(l => `> ${l}`).join('\n') + '\n\n'
    case 'hr': return '---\n\n'
    case 'table': return tableToMd(el) + '\n\n'
    default: return children
  }
}

function tableToMd(table: HTMLElement): string {
  const rows = Array.from(table.querySelectorAll('tr'))
  if (rows.length === 0) return ''
  const result: string[] = []
  rows.forEach((row, i) => {
    const cells = Array.from(row.querySelectorAll('td, th'))
    result.push('| ' + cells.map(c => (c.textContent || '').trim()).join(' | ') + ' |')
    if (i === 0) result.push('| ' + cells.map(() => '---').join(' | ') + ' |')
  })
  return result.join('\n')
}
