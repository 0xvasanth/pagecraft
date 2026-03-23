# Theming

## ThemeConfig

Customize the editor's visual appearance with the `theme` prop:

```tsx
<SmartPage
  ref={ref}
  theme={{
    fontFamily: 'Georgia, serif',
    fontSize: '12pt',
    lineHeight: '1.6',
    textColor: '#333333',
    canvasBackground: '#e8e8e8',
    pageBackground: '#ffffff',
  }}
/>
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fontFamily` | `string` | System default | Font stack for editor content |
| `fontSize` | `string` | `11pt` | Base font size |
| `lineHeight` | `string` | `1.5` | Base line height |
| `textColor` | `string` | `#1a1a1a` | Default text color |
| `canvasBackground` | `string` | Gray | Background color behind the page cards |
| `pageBackground` | `string` | `#ffffff` | Background color of the page itself |

### ThemeConfig Type

```ts
interface ThemeConfig {
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  textColor?: string;
  canvasBackground?: string;
  pageBackground?: string;
}
```

## CSS Class Contract

SmartPage scopes all styles under the `.smartpage` wrapper class. The following public CSS classes are stable and safe to target in your own stylesheets:

### Wrapper Classes

| Class | Description |
|-------|-------------|
| `.smartpage` | Root wrapper for the entire editor |
| `.smartpage--readonly` | Added to the root when the editor is in read-only mode |

### Content Classes

| Class | Description |
|-------|-------------|
| `.ProseMirror` | The TipTap/ProseMirror content editable area |
| `.template-variable` | Template variable chip elements |
| `span[data-variable]` | Template variable spans (in both editor and export) |

## Overriding Styles Safely

Scope your overrides under `.smartpage` to avoid leaking styles to other parts of your app:

```css
/* Custom font for editor content */
.smartpage .ProseMirror {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

/* Custom heading styles */
.smartpage .ProseMirror h1 {
  color: #1e40af;
  border-bottom: 2px solid #dbeafe;
  padding-bottom: 0.25em;
}

/* Custom table styling */
.smartpage .ProseMirror table {
  border: 2px solid #e5e7eb;
}

.smartpage .ProseMirror th {
  background: #f0f9ff;
}

/* Custom blockquote */
.smartpage .ProseMirror blockquote {
  border-left: 4px solid #3b82f6;
  background: #eff6ff;
  padding: 0.5em 1em;
}

/* Custom template variable chips */
.smartpage .template-variable {
  background: #dbeafe;
  color: #1e40af;
  border-color: #93c5fd;
}
```

## Icon Styling

SmartPage uses Lucide React icons throughout the toolbar. Icons are styled with:

- `strokeWidth={1.5}` prop set on every icon instance (not CSS)
- `.smartpage .lucide { color: #5f6368 }` scoped to the editor wrapper

To change icon color:

```css
.smartpage .lucide {
  color: #374151;
}
```

Do not override `stroke-width` via CSS -- it is set as an SVG attribute via props.

## Dark Mode Example

```css
.smartpage-dark .smartpage {
  /* Toolbar and chrome */
  --background: #1f2937;
  --foreground: #f9fafb;
}

.smartpage-dark .smartpage .ProseMirror {
  color: #e5e7eb;
}

.smartpage-dark .smartpage .lucide {
  color: #9ca3af;
}
```

Combined with the theme prop:

```tsx
<div className="smartpage-dark">
  <SmartPage
    ref={ref}
    theme={{
      textColor: '#e5e7eb',
      canvasBackground: '#111827',
      pageBackground: '#1f2937',
    }}
  />
</div>
```

## Complete Theming Example

```tsx
import { useRef } from 'react';
import { SmartPage, type SmartPageRef } from 'smartpage';

function ThemedEditor() {
  const ref = useRef<SmartPageRef>(null);

  return (
    <SmartPage
      ref={ref}
      theme={{
        fontFamily: '"Merriweather", Georgia, serif',
        fontSize: '11.5pt',
        lineHeight: '1.7',
        textColor: '#2d3748',
        canvasBackground: '#f7fafc',
        pageBackground: '#ffffff',
      }}
      canvas="a4"
      toolbar="document"
    />
  );
}
```
