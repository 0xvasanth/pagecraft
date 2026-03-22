# PageCraft

A visual template editor for building HTML templates that work with **Jinja**, **Handlebars**, **Mustache**, or any template engine. Write your template in a familiar document editor, get clean HTML output ready for your rendering pipeline.

## The Problem

Building HTML templates for emails, invoices, reports, or documents usually means writing raw HTML by hand or using clunky drag-and-drop builders. Developers need template syntax (`{{variables}}`, `{% for %}` loops, `{% if %}` conditionals) but non-technical users need a visual editor.

PageCraft bridges both worlds: a Google Docs-like editing experience that outputs template-engine-compatible HTML.

## What You Get

**For template authors** - a rich text editor with A4 page layout, toolbar formatting, tables, images, and visual blocks for loops and conditionals. No HTML knowledge needed.

**For developers** - clean HTML output with `{{variable}}` syntax, `@page` CSS rules, and semantic markup. Drop it into Jinja, Handlebars, or any template engine. Generate PDFs with Puppeteer, wkhtmltopdf, or WeasyPrint.

## Quick Start

```bash
npm install @pagecraft/editor
```

```tsx
import { useRef } from 'react'
import { PageCraft, type PageCraftRef, forBlock, ifBlock } from '@pagecraft/editor'

function App() {
  const editorRef = useRef<PageCraftRef>(null)

  const handleSave = () => {
    // Get clean HTML — ready for Jinja/Handlebars/Mustache
    const html = editorRef.current.getPdfHTML({ title: 'Invoice' })
    console.log(html)
  }

  return (
    <PageCraft
      ref={editorRef}
      variables={['customer_name', 'invoice_number', 'items', 'total']}
      blocks={[forBlock, ifBlock]}
      placeholder="Start building your template..."
    />
  )
}
```

## Output Example

What the user designs visually in the editor becomes:

```html
<h1>Invoice {{invoice_number}}</h1>
<p>Bill to: {{customer_name}}</p>

<table>
  <tr><th>Item</th><th>Price</th></tr>
  <div data-block-for="item in items">
    <tr>
      <td>{{item.name}}</td>
      <td>{{item.price}}</td>
    </tr>
  </div>
</table>

<div data-block-if="discount_applied">
  <p>Discount applied!</p>
</div>

<p><strong>Total: {{total}}</strong></p>
```

Pass this to your template engine:

```python
# Jinja2
template = Template(html_from_editor)
rendered = template.render(
    customer_name="Acme Corp",
    invoice_number="INV-001",
    items=[{"name": "Widget", "price": "$10"}],
    total="$10"
)

# Generate PDF
pdfkit.from_string(rendered, "invoice.pdf")
```

```javascript
// Handlebars
const template = Handlebars.compile(htmlFromEditor)
const rendered = template({
  customer_name: "Acme Corp",
  invoice_number: "INV-001",
  items: [{ name: "Widget", price: "$10" }],
  total: "$10"
})
```

## Features

| Feature | Description |
|---------|-------------|
| **Rich text** | Headings, bold, italic, underline, strikethrough, text color, highlights, alignment |
| **Tables** | Resizable columns, merge/split cells, header rows |
| **Images** | Upload, drag-and-drop, resize, inline crop |
| **Template variables** | `{{name}}` chips — pick from predefined list or add custom |
| **For loops** | Visual block that repeats content for each item in a list |
| **If conditionals** | Visual block that shows/hides content based on a condition |
| **Read-only blocks** | Locked content blocks (terms, disclaimers) that users can't edit |
| **Page layout** | A4 page view with margins, page breaks, multi-page support |
| **Paste from Docs** | Copy from Google Docs or Word and keep formatting |
| **Import** | Open `.docx` and `.pdf` files directly |
| **HTML export** | Clean HTML + CSS with `@page` rules for PDF generation |
| **Preview** | Visual A4 page preview of the final output |

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | `''` | Initial HTML content |
| `placeholder` | `string` | `'Start typing...'` | Placeholder text |
| `onChange` | `(html: string) => void` | - | Called on every content change |
| `variables` | `string[]` | `['first_name', 'last_name', 'email', 'company', 'date']` | Template variables available in the editor |
| `blocks` | `EditorBlockPlugin[]` | `[]` | Block plugins to register |
| `className` | `string` | - | CSS class for the wrapper |

### Ref Methods

```tsx
const ref = useRef<PageCraftRef>(null)

ref.current.getHTML()                        // Raw HTML (no styles)
ref.current.getPdfHTML({ title: 'Doc' })     // Full HTML + CSS for PDF generation
ref.current.getPreviewHTML({ title: 'Doc' }) // Visual preview with A4 page layout
ref.current.getJSON()                        // TipTap JSON structure
ref.current.setContent('<p>Hello</p>')       // Set content programmatically
ref.current.getVariables()                   // List of available variables
ref.current.focus()
ref.current.clear()
```

### Template Variables

Variables render as styled chips in the editor and output as `{{variable_name}}` in HTML:

```tsx
<PageCraft variables={['name', 'email', 'order_id', 'total']} />
```

Users insert variables from the toolbar **Variables** dropdown. Custom variables can be added at runtime.

### Block Plugins

Blocks are self-contained plugins. Three ship built-in:

```tsx
import { forBlock, ifBlock, readonlyBlock } from '@pagecraft/editor'

<PageCraft blocks={[forBlock, ifBlock, readonlyBlock]} />
```

| Block | Purpose | Editable |
|-------|---------|----------|
| `forBlock` | Repeat content for each item in a list | Yes |
| `ifBlock` | Conditionally show/hide content | Yes |
| `readonlyBlock` | Locked content (only deletable) | No |

#### Custom Blocks

```tsx
import type { EditorBlockPlugin } from '@pagecraft/editor'

const myBlock: EditorBlockPlugin = {
  name: 'myBlock',
  label: 'My Block',
  icon: MyIcon,
  extension: myTipTapExtension,          // TipTap Node
  styles: `.my-block { ... }`,           // Editor CSS
  exportStyles: `div[data-my] { ... }`,  // PDF/export CSS
  insert: (editor) => editor.commands.insertMyBlock(),
}
```

### Import Files

```tsx
import { importDocx, importPdf } from '@pagecraft/editor'

const result = await importDocx(file)  // .docx via mammoth.js
const result = await importPdf(file)   // .pdf via pdfjs-dist (lazy-loaded)
editorRef.current.setContent(result.html)
```

### PDF Generation

The output from `getPdfHTML()` includes `@page` CSS rules and all content styles. Pass it to any PDF library:

```tsx
const html = editorRef.current.getPdfHTML({ title: 'Invoice' })

// Puppeteer
await page.setContent(html, { waitUntil: 'networkidle0' })
await page.pdf({ path: 'invoice.pdf' })

// WeasyPrint (Python)
// HTML(string=html).write_pdf('invoice.pdf')
```

No editor chrome, page shadows, or visual UI is included in the export.

## Development

```bash
git clone https://github.com/itsparser/pagecraft
cd pagecraft
bun install
bun run build    # Build the library
bun run dev      # Run the example app
```

```
pagecraft/
  packages/pagecraft/  <- @pagecraft/editor library
    src/
      core/            <- Main component, editor hook, pagination
      toolbar/         <- Formatting toolbar, bubble toolbar, actions
      canvas/          <- A4 page layout, header/footer
      table/           <- Table inline controls
      image/           <- Image resize, crop, alignment
      extensions/      <- TipTap extensions (variables, page break, etc.)
      blocks/          <- Block plugin system (for, if, readonly)
  examples/basic/      <- Example application
  e2e/                 <- Playwright end-to-end tests
  docs/                <- Use cases and documentation
```

## License

MIT
# pagecraft
# pagecraft
