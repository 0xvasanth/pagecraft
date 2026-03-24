<p align="center">
  <h1 align="center">SmartPage</h1>
  <p align="center">
    A visual template editor for React — design documents, output template-engine-ready HTML.
  </p>
  <p align="center">
    <a href="#quick-start">Quick Start</a> &bull;
    <a href="#features">Features</a> &bull;
    <a href="#api">API</a> &bull;
    <a href="#documentation">Docs</a> &bull;
    <a href="#pdf-generation">PDF Generation</a> &bull;
    <a href="#contributing">Contributing</a>
  </p>
</p>

---

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/smartpage.svg)](https://www.npmjs.com/package/smartpage)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-61dafb.svg)](https://react.dev/)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://0xvasanth.github.io/smartpage/)

## The Problem

Building HTML templates for emails, invoices, reports, or documents usually means writing raw HTML by hand or using clunky drag-and-drop builders. Developers need template syntax (`{{variables}}`, `{% for %}` loops, `{% if %}` conditionals) but non-technical users need a visual editor.

**SmartPage bridges both worlds:** a Google Docs-like editing experience that outputs template-engine-compatible HTML.

## Quick Start

```bash
npm install smartpage
# or
yarn add smartpage
# or
bun add smartpage
```

```tsx
import { useRef } from "react";
import { SmartPage, type SmartPageRef, forBlock, ifBlock } from "smartpage";

function App() {
  const editorRef = useRef<SmartPageRef>(null);

  const handleExport = () => {
    const html = editorRef.current.getPdfHTML({ title: "Invoice" });
    // html is ready for Jinja, Handlebars, Mustache, or any template engine
  };

  return (
    <SmartPage
      ref={editorRef}
      variables={[
        { key: "customer_name", label: "Customer Name" },
        { key: "invoice_number", label: "Invoice #" },
        { key: "items", label: "Line Items" },
        { key: "total", label: "Total" },
      ]}
      blocks={[forBlock, ifBlock]}
      placeholder="Start building your template..."
    />
  );
}
```

> Styles are auto-imported. No separate CSS import needed.

## How It Works

Users design documents visually. SmartPage outputs clean HTML with template syntax:

```
Visual Editor                          HTML Output
----------------------------------------------
[customer_name chip]             -->   {{customer_name}}
[For: item in items]             -->   <div data-block-for="item in items">
  [item.name chip]               -->     {{item.name}}
[End for]                        -->   </div>
[If: discount_applied]           -->   <div data-block-if="discount_applied">
  Discount applied!              -->     <p>Discount applied!</p>
[End if]                         -->   </div>
```

Feed the HTML to **Jinja**, **Handlebars**, **Mustache**, or any template engine, then generate PDFs.

## Features

| Feature                | Description                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Rich text editing**  | Headings (H1-H4), bold, italic, underline, strikethrough, subscript, superscript, text color, highlights, alignment |
| **Tables**             | Resizable columns, merge/split cells, header rows, inline add/delete row/column controls                            |
| **Images**             | Upload, drag-and-drop, paste from clipboard, resize handles, crop overlay, alignment                                |
| **Template variables** | `{{variable}}` chips with labels — pick from predefined list or create custom                                       |
| **For loops**          | Visual block that repeats content for each item in a list                                                           |
| **If conditionals**    | Visual block that shows/hides content based on a condition                                                          |
| **Read-only blocks**   | Locked content blocks (terms, disclaimers) that users can't edit                                                    |
| **A4 page layout**     | Visual page boundaries with margins, automatic page breaks, multi-page support                                      |
| **Page header/footer** | Editable header and footer zones with image support, repeat on every page                                           |
| **Paste from Docs**    | Copy from Google Docs or Microsoft Word and keep formatting                                                         |
| **Import files**       | Open `.docx` and `.pdf` files directly in the editor                                                                |
| **Export**             | Copy HTML, download as HTML file, or export as Markdown                                                             |
| **Print**              | Browser print with proper A4 layout and repeating header/footer                                                     |
| **Preview mode**       | Toggle between editing and read-only preview                                                                        |
| **Bubble toolbar**     | Floating toolbar on text selection with formatting + clear formatting                                               |
| **Keyboard shortcuts** | Ctrl/Cmd+B, I, U, Z, Enter for page break                                                                           |
| **Extensible**         | Custom canvas sizes, toolbar presets, TipTap extensions, block plugins, theming                                     |

## API

### Props

| Prop          | Type                                                 | Default             | Description                                   |
| ------------- | ---------------------------------------------------- | ------------------- | --------------------------------------------- |
| `content`     | `string`                                             | `''`                | Initial HTML content                          |
| `placeholder` | `string`                                             | `'Start typing...'` | Placeholder text                              |
| `onChange`    | `(html: string) => void`                             | —                   | Called on every content change                |
| `variables`   | `TemplateVariable[] \| false`                        | `false`             | Template variables (`{ key, label? }`)        |
| `blocks`      | `EditorBlockPlugin[]`                                | `[]`                | Block plugins to register                     |
| `canvas`      | `'a4' \| 'email' \| CanvasConfig`                    | `'a4'`              | Page layout preset or custom config           |
| `toolbar`     | `'full' \| 'minimal' \| 'document' \| ToolbarConfig` | `'full'`            | Toolbar preset or custom config               |
| `readOnly`    | `boolean`                                            | `false`             | Disable editing                               |
| `showToolbar` | `boolean`                                            | `true`              | Show/hide toolbar (independent of readOnly)   |
| `theme`       | `ThemeConfig`                                        | —                   | Custom font, colors, backgrounds              |
| `extensions`  | `ExtensionsConfig`                                   | —                   | Add, remove, or configure TipTap extensions   |
| `actions`     | `EditorActionsConfig`                                | —                   | Enable/disable import, preview, print, export |
| `header`      | `string`                                             | —                   | Initial header HTML                           |
| `footer`      | `string`                                             | —                   | Initial footer HTML                           |
| `className`   | `string`                                             | —                   | CSS class for the wrapper                     |

### Template Variables

Variables render as styled chips in the editor and output as `{{variable_name}}` in HTML:

```tsx
<SmartPage
  variables={[
    { key: "first_name", label: "First Name" },
    { key: "email", label: "Email Address" },
    { key: "company", label: "Company" },
  ]}
/>
```

Users insert variables from the toolbar **Variables** dropdown. Custom variables can be added at runtime via the input field in the dropdown.

### Block Plugins

Three block plugins ship built-in:

```tsx
import { forBlock, ifBlock, readonlyBlock } from "smartpage";

<SmartPage blocks={[forBlock, ifBlock, readonlyBlock]} />;
```

| Block           | Purpose                                | Output                                          |
| --------------- | -------------------------------------- | ----------------------------------------------- |
| `forBlock`      | Repeat content for each item in a list | `<div data-block-for="item in items">...</div>` |
| `ifBlock`       | Conditionally show/hide content        | `<div data-block-if="is_active">...</div>`      |
| `readonlyBlock` | Locked content (only deletable)        | `<div data-block-readonly>...</div>`            |

#### Custom Blocks

```tsx
import type { EditorBlockPlugin } from "smartpage";

const disclaimerBlock: EditorBlockPlugin = {
  name: "disclaimer",
  label: "Disclaimer",
  icon: ShieldIcon, // Any Lucide icon
  description: "Legal disclaimer text",
  extension: myTipTapExtension, // TipTap Node extension
  styles: `.disclaimer { ... }`, // Editor CSS
  exportStyles: `...`, // PDF/export CSS
  insert: (editor) => editor.commands.insertDisclaimer(),
};
```

### Canvas Presets

```tsx
// A4 document (default) — 210mm x 297mm, paginated
<SmartPage canvas="a4" />

// Email template — 600px wide, no pagination
<SmartPage canvas="email" />

// Custom dimensions
<SmartPage canvas={{ width: '8.5in', height: '11in', padding: { top: '1in', bottom: '1in', left: '0.75in', right: '0.75in' } }} />
```

### Toolbar Presets

```tsx
// Full toolbar (default) — all features
<SmartPage toolbar="full" />

// Minimal — undo, redo, heading, bold, italic, underline, link
<SmartPage toolbar="minimal" />

// Document — most features except subscript, superscript, task list, code block
<SmartPage toolbar="document" />

// Custom — start from a preset, then enable/disable
<SmartPage toolbar={{ preset: 'full', disable: ['codeBlock', 'subscript'] }} />
```

### Import Files

```tsx
import { importDocx, importPdf } from "smartpage";

// Import .docx (via mammoth.js)
const result = await importDocx(file);
editorRef.current.setContent(result.html);

// Import .pdf (via pdfjs-dist, lazy-loaded)
const result = await importPdf(file);
editorRef.current.setContent(result.html);
```

## Documentation

| Guide                                                         | Description                                    |
| ------------------------------------------------------------- | ---------------------------------------------- |
| [Getting Started](docs/getting-started.md)                    | Installation, setup, Next.js/Vite integration  |
| [Template Variables](docs/guides/template-variables.md)       | Variable chips, labels, Jinja/Handlebars usage |
| [Block Plugins](docs/guides/block-plugins.md)                 | For-loops, conditionals, custom blocks         |
| [Canvas & Layout](docs/guides/canvas-and-layout.md)           | A4/email presets, pagination, header/footer    |
| [Toolbar Customization](docs/guides/toolbar-customization.md) | Presets, feature toggles, action hooks         |
| [Export & PDF](docs/guides/export-and-pdf.md)                 | HTML/PDF/Markdown export, Puppeteer/WeasyPrint |
| [Theming](docs/guides/theming.md)                             | Fonts, colors, CSS overrides                   |
| [Extending TipTap](docs/guides/extending-tiptap.md)           | Custom extensions, configuration               |
| [Invoice Template Example](docs/examples/invoice-template.md) | Complete invoice editor with PDF export        |
| [Email Template Example](docs/examples/email-template.md)     | Email editor with no-pagination mode           |

## PDF Generation

The output from `getPdfHTML()` includes `@page` CSS rules, all content styles, and repeating header/footer via table-based layout. Pass it to any PDF library:

```tsx
const html = editorRef.current.getPdfHTML({ title: "Invoice" });
```

**Node.js (Puppeteer):**

```javascript
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle0" });
await page.pdf({ path: "invoice.pdf", format: "A4" });
```

**Python (WeasyPrint):**

```python
from weasyprint import HTML
HTML(string=html).write_pdf('invoice.pdf')
```

**Python (Jinja2 + pdfkit):**

```python
from jinja2 import Template
template = Template(html)
rendered = template.render(customer_name="Acme Corp", items=[...])
pdfkit.from_string(rendered, 'invoice.pdf')
```

No editor chrome, page shadows, or visual UI is included in the export — just clean, production-ready HTML.

## Development

```bash
git clone https://github.com/0xvasanth/smartpage
cd smartpage
bun install

bun run dev          # Start example app with HMR
bun run build        # Build the library
bun run test         # Run 30 e2e tests
bun run test:headed  # Run tests in browser (visible)
```

The example app resolves the library source directly via Vite aliases — no build step needed during development. Changes to library code are reflected immediately via HMR.

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Clone** your fork and install dependencies (`bun install`)
3. **Create a branch** for your feature or fix
4. **Make your changes** — the library source is in `packages/smartpage/src/`
5. **Run tests** — `bun run test` (all 30 must pass)
6. **Submit a PR** with a clear description

Check `docs/use-cases.md` for the full list of supported features and test cases. If you're adding a new feature, add a use case entry and corresponding e2e test.

### Architecture

The editor is built on TipTap (ProseMirror) with a domain-organized source structure:

- **`core/`** — `SmartPage.tsx` is the main component. `use-editor.ts` configures 20+ TipTap extensions. `page-flow-plugin.ts` handles CSS-based pagination.
- **`toolbar/`** — The main toolbar, floating bubble toolbar, and editor actions (import/export/print).
- **`canvas/`** — A4 page rendering with visual page boundaries, header/footer mini-editors.
- **`blocks/`** — Self-contained block plugins. Each block owns its TipTap extension, React view, and styles.
- **`extensions/`** — Custom TipTap nodes for template variables, page breaks, resizable images, and paste handling.

See `CLAUDE.md` for detailed architecture notes and non-obvious patterns.

## License

MIT
