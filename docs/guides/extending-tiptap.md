# Extending TipTap

SmartPage is built on TipTap. You can add custom extensions, remove defaults, or reconfigure existing ones through the `extensions` prop.

## ExtensionsConfig

```tsx
<SmartPage
  ref={ref}
  extensions={{
    add: [...],         // Custom TipTap extensions to include
    remove: [...],      // Names of default extensions to remove
    configure: {...},   // Override options on default extensions
  }}
/>
```

### Type Definition

```ts
interface ExtensionsConfig {
  add?: any[];                      // TipTap extensions to add
  remove?: string[];                // Extension names to remove
  configure?: Record<string, any>;  // Extension name -> options map
}
```

## Adding Custom Extensions

Pass additional TipTap extensions through `extensions.add`:

```tsx
import { SmartPage } from 'smartpage';
import { Mathematics } from '@tiptap-pro/extension-mathematics';
import { CharacterCount } from '@tiptap/extension-character-count';

<SmartPage
  ref={ref}
  extensions={{
    add: [
      Mathematics,
      CharacterCount.configure({ limit: 10000 }),
    ],
  }}
/>
```

Custom extensions are appended after all default extensions and block plugin extensions.

## Removing Default Extensions

Remove built-in extensions by name:

```tsx
<SmartPage
  ref={ref}
  extensions={{
    remove: ['typography', 'taskList', 'taskItem'],
  }}
/>
```

### Default Extension Names

These are the internal names used in the extension map. Use these exact strings in `remove`:

| Name | Extension | Description |
|------|-----------|-------------|
| `starterKit` | StarterKit | Bold, italic, headings, lists, code, etc. |
| `table` | Table | Table support with resizable columns |
| `tableRow` | TableRow | Table row node |
| `tableCell` | TableCell | Table cell node |
| `tableHeader` | TableHeader | Table header cell node |
| `textAlign` | TextAlign | Text alignment (left, center, right, justify) |
| `underline` | Underline | Underline mark |
| `textStyle` | TextStyle | Inline text styling (used by Color) |
| `color` | Color | Text color |
| `highlight` | Highlight | Background highlight (multicolor) |
| `placeholder` | Placeholder | Placeholder text |
| `typography` | Typography | Smart quotes, em dashes, etc. |
| `taskList` | TaskList | Task/checkbox lists |
| `taskItem` | TaskItem | Individual task items |
| `link` | Link | Hyperlinks |
| `subscript` | Subscript | Subscript text |
| `superscript` | Superscript | Superscript text |
| `pageBreak` | PageBreak | Manual page break insertion |
| `resizableImage` | ResizableImage | Images with resize/crop handles |
| `pasteHandler` | PasteHandler | Image paste handling |
| `pageFlow` | PageFlowExtension | CSS-based pagination |
| `templateVariable` | TemplateVariable | Template variable chips |

Note: `templateVariable` is only registered when `variables` is not `false`. `pageBreak` is auto-removed when `canvas.paginate` is `false`.

## Configuring Existing Extensions

Override options on default extensions without replacing them:

```tsx
<SmartPage
  ref={ref}
  extensions={{
    configure: {
      // Allow h5 and h6 headings
      starterKit: {
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      },
      // Change placeholder text
      placeholder: {
        placeholder: 'Write your story...',
      },
      // Disable smart quotes
      typography: false,
      // Configure link behavior
      link: {
        openOnClick: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
        },
      },
      // Adjust table settings
      table: {
        resizable: true,
        cellMinWidth: 100,
      },
    },
  }}
/>
```

The `configure` option calls `.configure(options)` on the existing extension instance. The extension must already exist in the defaults map.

## Accessing the TipTap Editor Instance

The `SmartPageRef` does not directly expose the TipTap `Editor` instance, but you can interact with editor state through the ref methods:

```tsx
const ref = useRef<SmartPageRef>(null);

// Read content
ref.current.getHTML();
ref.current.getJSON();

// Modify content
ref.current.setContent('<p>New content</p>');
ref.current.clear();
ref.current.focus();
```

For advanced use cases requiring direct TipTap editor access, consider creating a custom block plugin or extension that receives the editor instance through TipTap's extension API.

## Example: Adding Collaboration

```tsx
import { SmartPage } from 'smartpage';
import { Collaboration } from '@tiptap/extension-collaboration';
import { CollaborationCursor } from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();
const provider = new WebsocketProvider('ws://localhost:1234', 'doc-room', ydoc);

<SmartPage
  ref={ref}
  extensions={{
    // Remove the default history (StarterKit includes it) since
    // collaboration has its own undo/redo
    configure: {
      starterKit: { history: false },
    },
    add: [
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider,
        user: { name: 'User', color: '#f783ac' },
      }),
    ],
  }}
/>
```

## Extension Resolution Order

Extensions are resolved in this order:

1. Default extensions (built-in map)
2. `configure` overrides are applied to matching defaults
3. `remove` entries are deleted from the map
4. Pagination-related cleanup (pageBreak removed if not paginated)
5. Remaining defaults are collected
6. `add` extensions are appended
7. Block plugin extensions are appended

This means `add` extensions can depend on default extensions, and `configure` runs before `remove`, so you can configure an extension and then still remove it if needed.
