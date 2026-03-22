# @E/editor

A visual template editor for React. Build HTML templates with `{{variables}}`, loops, and conditionals in a Google Docs-like editor. Output clean HTML for Jinja, Handlebars, Mustache, or any template engine.

Built on [TipTap](https://tiptap.dev) and [ProseMirror](https://prosemirror.net).

## Install

```bash
npm install @pagecraft/editor
```

Peer dependencies: `react` and `react-dom` (v18 or v19).

## Usage

```tsx
import { useRef } from 'react'
import { PageCraft, type PageCraftRef, forBlock, ifBlock } from '@pagecraft/editor'
// Styles are auto-imported — no separate CSS import needed

function TemplateEditor() {
  const ref = useRef<PageCraftRef>(null)

  return (
    <PageCraft
      ref={ref}
      variables={['name', 'email', 'items', 'total']}
      blocks={[forBlock, ifBlock]}
      onChange={(html) => saveTemplate(html)}
    />
  )
}
```

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

See the [full documentation](../../README.md) in the project root.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `content` | `string` | Initial HTML |
| `placeholder` | `string` | Placeholder text |
| `onChange` | `(html: string) => void` | Content change callback |
| `variables` | `string[]` | Available template variables |
| `blocks` | `EditorBlockPlugin[]` | Block plugins |
| `className` | `string` | Wrapper CSS class |

### Ref Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getHTML()` | `string` | Raw HTML without styles |
| `getPdfHTML(opts?)` | `string` | Full HTML + CSS for PDF generation |
| `getPreviewHTML(opts?)` | `string` | Visual preview with A4 pages |
| `getJSON()` | `object` | TipTap document JSON |
| `setContent(html)` | `void` | Replace editor content |
| `getVariables()` | `string[]` | Current variable list |
| `focus()` | `void` | Focus the editor |
| `clear()` | `void` | Clear all content |

### Exports

```tsx
// Core
import { PageCraft, type PageCraftRef, type PageCraftProps } from '@pagecraft/editor'

// Block plugins
import { forBlock, ifBlock, readonlyBlock } from '@pagecraft/editor'
import type { EditorBlockPlugin, BlockContext } from '@pagecraft/editor'

// Import utilities
import { importDocx, importPdf } from '@pagecraft/editor'

// Export utilities
import { exportToPdfHtml, exportToPreviewHtml } from '@pagecraft/editor'

// Styles
// Styles are auto-imported — no separate CSS import needed
```

## License

MIT
