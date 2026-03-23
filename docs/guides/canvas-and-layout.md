# Canvas and Layout

The canvas controls the page dimensions, margins, pagination behavior, and header/footer display.

## Canvas Presets

SmartPage ships with two presets:

```tsx
// A4 paginated document (default)
<SmartPage ref={ref} canvas="a4" />

// Email template -- fixed width, no pagination
<SmartPage ref={ref} canvas="email" />
```

### Preset Details

| Preset | Width | Height | Padding | Paginate |
|--------|-------|--------|---------|----------|
| `a4` | 210mm | 297mm | 25.4mm all sides | Yes |
| `email` | 600px | none | 20px all sides | No |

## Custom Canvas Dimensions

Pass a `CanvasConfig` object for full control:

```tsx
<SmartPage
  ref={ref}
  canvas={{
    width: '8.5in',
    height: '11in',
    padding: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
    paginate: true,
    pageGap: 40,
  }}
/>
```

### CanvasConfig

```ts
interface CanvasConfig {
  width: string;         // CSS length: 'mm', 'in', 'cm', 'pt', 'px'
  height?: string;       // Omit for infinite scroll (no pagination)
  padding?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  paginate?: boolean;    // Default: true
  pageGap?: number;      // Gap between pages in pixels. Default: 40
}
```

Supported CSS units: `mm`, `in`, `cm`, `pt`, `px`.

## Pagination

When `paginate` is `true` (the default for A4), SmartPage renders content inside visual page boundaries:

- Content flows across multiple pages automatically
- Each page is rendered as a white card with a shadow on a gray background
- Page gaps appear between pages
- The `PageFlowExtension` injects CSS-based spacers at page boundaries to push content to the next page

### How Page Breaks Work

SmartPage uses a CSS injection strategy for pagination. The `PageFlowExtension` calculates where content overflows the page boundary and injects `nth-child` margin rules via a `<style>` tag. This approach works with ProseMirror because it does not directly modify managed DOM elements.

### Manual Page Breaks

Users can insert manual page breaks via:

- **Toolbar:** Click the page break button (available in `full` and `document` toolbar presets)
- **Keyboard:** There is no default keyboard shortcut, but page breaks can be inserted via the toolbar

Page breaks are rendered as horizontal rules in the editor and converted to `page-break-after: always` in PDF export.

## Non-Paginated Mode

For email templates or single-page content, disable pagination:

```tsx
<SmartPage
  ref={ref}
  canvas="email"
/>

// Or with custom config:
<SmartPage
  ref={ref}
  canvas={{
    width: '600px',
    paginate: false,
  }}
/>
```

In non-paginated mode:
- No page boundaries are rendered
- Content scrolls infinitely
- The page break toolbar button is automatically hidden
- `PageFlowExtension` is disabled

## Page Header and Footer

Headers and footers are mini TipTap editors that appear at the top and bottom of each page. They support rich text and images.

### Setting Initial Content

```tsx
<SmartPage
  ref={ref}
  canvas="a4"
  header="<p>Company Name</p>"
  footer="<p>Confidential</p>"
/>
```

### Programmatic Access

```tsx
// Read
const headerHtml = ref.current.getHeader();
const footerHtml = ref.current.getFooter();

// Write
ref.current.setHeader('<p><strong>ACME Corp</strong></p>');
ref.current.setFooter('<p>Page footer text</p>');
```

### Header/Footer in Editing

When the user clicks a header or footer region, a mini TipTap editor activates. The main toolbar context switches to target the active header/footer editor, allowing formatting of header/footer content.

The mini editor supports a subset of features (text formatting, alignment, images) but not tables or lists.

### Header/Footer in Exports

- **`getPdfHTML()`** -- Uses a `<thead>`/`<tfoot>` table layout that repeats headers and footers on every printed page.
- **`getPreviewHTML()`** -- Headers and footers are rendered inside each visual page div.

### Read-Only Mode

In read-only mode, headers and footers are displayed but not editable. The `onHeaderChange` and `onFooterChange` callbacks are not wired up.

## Custom Letter Size Example

```tsx
<SmartPage
  ref={ref}
  canvas={{
    width: '8.5in',
    height: '11in',
    padding: {
      top: '0.75in',
      right: '1in',
      bottom: '0.75in',
      left: '1in',
    },
    paginate: true,
    pageGap: 32,
  }}
  header="<p>Letterhead</p>"
  footer="<p>123 Main St, City, State 12345</p>"
/>
```
