# Getting Started

## Installation

```bash
# npm
npm install smartpage

# yarn
yarn add smartpage

# bun
bun add smartpage
```

### Peer Dependencies

SmartPage requires React 18 or 19:

```bash
npm install react react-dom
```

## Minimal Setup

```tsx
import { useRef } from 'react';
import { SmartPage, type SmartPageRef } from 'smartpage';

function Editor() {
  const ref = useRef<SmartPageRef>(null);

  return (
    <div style={{ height: '100vh' }}>
      <SmartPage ref={ref} placeholder="Start typing..." />
    </div>
  );
}
```

That is all you need. SmartPage renders an A4 paginated editor with a full toolbar, ready to use.

## Styles

CSS is auto-imported when you import from `smartpage`. No separate stylesheet import is required.

If your bundler does not handle CSS side effects, you can import the stylesheet explicitly:

```tsx
import 'smartpage/styles';
```

## Adding to a Next.js App

SmartPage uses browser-only APIs (DOM, TipTap/ProseMirror). Disable SSR with a dynamic import:

```tsx
// components/editor.tsx
'use client';

import { useRef } from 'react';
import { SmartPage, type SmartPageRef } from 'smartpage';

export default function Editor() {
  const ref = useRef<SmartPageRef>(null);

  return (
    <div style={{ height: '100vh' }}>
      <SmartPage
        ref={ref}
        canvas="a4"
        toolbar="full"
        placeholder="Start typing..."
        onChange={(html) => console.log(html)}
      />
    </div>
  );
}
```

```tsx
// app/page.tsx
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/editor'), { ssr: false });

export default function Page() {
  return <Editor />;
}
```

## Adding to a Vite or CRA App

No special configuration needed. Import and use directly:

```tsx
// src/App.tsx
import { useRef } from 'react';
import { SmartPage, type SmartPageRef } from 'smartpage';

function App() {
  const ref = useRef<SmartPageRef>(null);

  return (
    <div style={{ height: '100vh' }}>
      <SmartPage
        ref={ref}
        canvas="a4"
        placeholder="Start typing..."
        onChange={(html) => console.log(html)}
      />
    </div>
  );
}

export default App;
```

## TypeScript Support

SmartPage is fully typed. Import the types you need:

```tsx
import type {
  SmartPageRef,
  SmartPageProps,
  CanvasConfig,
  ToolbarConfig,
  ToolbarFeature,
  TemplateVariable,
  ThemeConfig,
  ExtensionsConfig,
  EditorBlockPlugin,
  EditorActionsConfig,
  ResolvedCanvas,
} from 'smartpage';
```

## Ref API

Access the editor programmatically through the ref:

```tsx
const ref = useRef<SmartPageRef>(null);

// Content
ref.current.getHTML();                        // Raw TipTap HTML
ref.current.getPdfHTML({ title: 'Invoice' }); // Self-contained HTML for PDF generation
ref.current.getPreviewHTML();                 // Visual A4 preview HTML
ref.current.getJSON();                        // ProseMirror JSON
ref.current.setContent('<p>Hello</p>');       // Replace content
ref.current.clear();                          // Clear all content
ref.current.focus();                          // Focus the editor

// Header / Footer
ref.current.getHeader();
ref.current.getFooter();
ref.current.setHeader('<p>Company Inc.</p>');
ref.current.setFooter('<p>Page footer</p>');

// Read-only mode
ref.current.setReadOnly(true);
ref.current.isReadOnly();

// Variables
ref.current.getVariables();
```

## Next Steps

- [Template Variables](./guides/template-variables.md) -- dynamic placeholders for merge fields
- [Block Plugins](./guides/block-plugins.md) -- for-loops, conditionals, and custom blocks
- [Canvas and Layout](./guides/canvas-and-layout.md) -- page sizing, pagination, headers/footers
- [Toolbar Customization](./guides/toolbar-customization.md) -- presets and feature toggles
- [Export and PDF](./guides/export-and-pdf.md) -- generating PDFs from editor content
- [Theming](./guides/theming.md) -- fonts, colors, and visual customization
- [Extending TipTap](./guides/extending-tiptap.md) -- adding custom extensions
