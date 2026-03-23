# Export and PDF Generation

SmartPage provides three export methods through the ref, each suited for a different use case.

## Export Methods

### getHTML() -- Raw HTML

Returns the raw TipTap editor HTML with no styles or document wrapper. Use this when you want to process the content yourself or store it in a database.

```tsx
const html = ref.current.getHTML();
// Returns: <p>Hello <strong>world</strong></p>
```

### getPdfHTML() -- PDF-Ready HTML

Returns a self-contained HTML document with `@page` rules, content formatting styles, and header/footer support. Pass this directly to any PDF generation library.

```tsx
const html = ref.current.getPdfHTML({ title: 'Invoice #1234' });
```

Features:
- `@page` rules for A4 sizing and margins
- Full content styles (typography, tables, lists, code blocks, images, etc.)
- Page break markers converted to CSS `page-break-after: always`
- Block plugin export styles included
- Header/footer using `<thead>`/`<tfoot>` for cross-page repetition
- Template variable styling preserved
- XSS-safe HTML sanitization for header/footer content

### getPreviewHTML() -- Visual A4 Preview

Returns HTML that mimics the editor's visual layout: gray background with white A4 page cards, shadows, and auto-pagination via JavaScript.

```tsx
const html = ref.current.getPreviewHTML({ title: 'Preview' });
```

This is used for the built-in preview iframe. Not suitable for PDF generation.

## Generating PDFs

### Puppeteer (Node.js)

```ts
import puppeteer from 'puppeteer';

async function generatePdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    // Margins are already set in the HTML's @page rules,
    // so use 0 here to avoid double margins
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await browser.close();
  return pdf;
}

// Usage
const html = ref.current.getPdfHTML({ title: 'Invoice' });
const pdfBuffer = await generatePdf(html);
```

### WeasyPrint (Python)

```python
import weasyprint

def generate_pdf(html: str, output_path: str):
    weasyprint.HTML(string=html).write_pdf(output_path)

# Usage
html = get_pdf_html_from_frontend()  # getPdfHTML() result sent from client
generate_pdf(html, "invoice.pdf")
```

### wkhtmltopdf

```bash
# Save getPdfHTML() output to a file, then:
wkhtmltopdf --enable-local-file-access document.html output.pdf
```

Or programmatically in Node.js using `execFile` (safer than shell execution):

```ts
import { execFile } from 'child_process';
import { writeFileSync } from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function generatePdf(html: string, outputPath: string) {
  const tmpPath = '/tmp/doc.html';
  writeFileSync(tmpPath, html);
  await execFileAsync('wkhtmltopdf', ['--enable-local-file-access', tmpPath, outputPath]);
}
```

### Server-Side Workflow

A typical workflow:

1. User edits document in SmartPage
2. Client calls `ref.current.getPdfHTML()` to get self-contained HTML
3. Client sends the HTML string to your API
4. Server passes the HTML to Puppeteer/WeasyPrint/wkhtmltopdf
5. Server returns the generated PDF

```tsx
// Client
const handleExport = async () => {
  const html = ref.current?.getPdfHTML({ title: 'Document' });
  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html }),
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url);
};
```

## Export as Markdown

The built-in export dropdown includes a "Export as Markdown" option that converts editor HTML to Markdown. You can also trigger this programmatically:

```tsx
// The built-in action handles this via the export dropdown.
// For programmatic access, get the HTML and convert:
const html = ref.current.getHTML();
// Use your preferred HTML-to-Markdown library
```

## Copy HTML to Clipboard

The export dropdown includes a "Copy HTML" option that copies `getPdfHTML()` output to the clipboard in both `text/html` and `text/plain` formats.

## Header/Footer in Exports

Headers and footers set via props or the ref are included in both `getPdfHTML()` and `getPreviewHTML()`:

```tsx
<SmartPage
  ref={ref}
  header="<p><strong>ACME Corp</strong> -- Confidential</p>"
  footer="<p>123 Business Ave, Suite 100</p>"
/>
```

In PDF export (`getPdfHTML()`):
- Headers use `<thead>` and footers use `<tfoot>` inside a table layout
- This causes them to repeat on every printed page in most PDF renderers
- When headers/footers are present, page margins are reduced to `10mm` top/bottom to accommodate the repeated content

In preview export (`getPreviewHTML()`):
- Headers and footers are rendered inside each visual page div
- Auto-pagination script accounts for header/footer height when calculating page breaks

## Printing

The built-in print action opens the browser's native print dialog:

1. Generates `getPdfHTML()` output
2. Renders it in a hidden iframe
3. Calls `window.print()` on the iframe
4. Cleans up the iframe after printing

This gives you accurate print output with proper page breaks, headers/footers, and A4 sizing.

## Export Options

Both `getPdfHTML()` and `getPreviewHTML()` accept an options object:

```ts
ref.current.getPdfHTML({
  title: 'Document Title',  // Sets the <title> tag
});
```

The page size defaults to A4 and margins default to 25.4mm. These are set in the HTML's `@page` CSS rules, so PDF libraries that respect `@page` will use them automatically.
