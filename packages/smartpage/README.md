# smartpage

A visual template editor for React. Build HTML templates with `{{variables}}`, loops, and conditionals in a Google Docs-like editor. Output clean HTML for Jinja, Handlebars, Mustache, or any template engine.

Built on [TipTap](https://tiptap.dev) and [ProseMirror](https://prosemirror.net).

## Install

```bash
npm install smartpage
```

Peer dependencies: `react` and `react-dom` (v18 or v19).

## Usage

```tsx
import { useRef } from 'react'
import { SmartPage, type SmartPageRef, forBlock, ifBlock } from 'smartpage'

function TemplateEditor() {
  const ref = useRef<SmartPageRef>(null)

  return (
    <SmartPage
      ref={ref}
      variables={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
      ]}
      blocks={[forBlock, ifBlock]}
      onChange={(html) => saveTemplate(html)}
    />
  )
}
```

> Styles are auto-imported. No separate CSS import needed.

## What It Does

Users design documents visually. The editor outputs HTML with template syntax:

```
Visual editor          ->    HTML output
-----------------            ---------------------
[name chip]            ->    {{name}}
[For: item in items]   ->    <div data-block-for="item in items">
  [item.name chip]     ->      {{item.name}}
[End for]              ->    </div>
```

Feed the HTML to Jinja, Handlebars, or any template engine, then generate PDFs.

## API Reference

See the [full documentation](../../README.md) for complete API reference including:

- All props (canvas, toolbar, theme, extensions, actions, header/footer)
- Ref methods (getHTML, getPdfHTML, getPreviewHTML, setContent, etc.)
- Canvas presets (A4, email, custom)
- Toolbar presets (full, minimal, document)
- Custom block plugins
- Import/export utilities
- PDF generation examples

### Quick Reference

| Export | Description |
|--------|-------------|
| `SmartPage` | Main editor component |
| `SmartPageRef` | Ref type for programmatic control |
| `SmartPageProps` | Props type |
| `forBlock` | For-loop block plugin |
| `ifBlock` | If-condition block plugin |
| `readonlyBlock` | Read-only block plugin |
| `importDocx(file)` | Import .docx files |
| `importPdf(file)` | Import .pdf files |
| `exportToPdfHtml(html, opts)` | Generate PDF-ready HTML |
| `exportToPreviewHtml(html, opts)` | Generate visual preview HTML |

## License

MIT
