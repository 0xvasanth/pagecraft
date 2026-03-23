# Block Plugins

Blocks are self-contained plugins that add structured content types to the editor. They render as distinct visual regions in the editor and produce template syntax in HTML output.

## Built-in Blocks

SmartPage ships with three blocks:

```tsx
import { SmartPage, forBlock, ifBlock, readonlyBlock } from 'smartpage';

<SmartPage
  ref={ref}
  blocks={[forBlock, ifBlock, readonlyBlock]}
  variables={[
    { key: 'items', label: 'Items' },
    { key: 'show_discount', label: 'Show Discount' },
  ]}
/>
```

### forBlock

Repeats its content for each item in a list. Renders as a labeled container in the editor. In HTML output, wraps content with template loop syntax.

- **Default insert:** iterates as `item` over `items`
- **Editor display:** bordered region labeled "For Loop" with variable selectors
- **HTML output:** `{{#each items}}...{{/each}}` style markers

### ifBlock

Conditionally shows content based on a variable. Renders as a labeled container with a condition field.

- **Default insert:** condition is `condition`
- **Editor display:** bordered region labeled "If Condition"
- **HTML output:** `{{#if condition}}...{{/if}}` style markers

### readonlyBlock

A non-editable content region. Users can delete the entire block but cannot modify its content. Useful for legal text, terms, or boilerplate.

- **Editor display:** locked content with a "Read Only" label
- **HTML output:** renders content as-is, no template syntax

## Registering Blocks

Pass blocks through the `blocks` prop. They appear in the toolbar's block dropdown menu:

```tsx
const blocks = [forBlock, ifBlock, readonlyBlock];

<SmartPage ref={ref} blocks={blocks} />
```

When no blocks are registered, the blocks dropdown is automatically hidden from the toolbar.

## Editor vs HTML Output

Each block has two CSS style sets:

- **`styles`** -- Injected into the page `<head>` while the editor is mounted. Controls the visual appearance in the editor (borders, labels, backgrounds).
- **`exportStyles`** -- Included in `getPdfHTML()` and `getPreviewHTML()` output. Controls appearance in exported documents.

Styles are automatically managed. They are injected when the component mounts and cleaned up on unmount.

## Creating a Custom Block Plugin

Implement the `EditorBlockPlugin` interface:

```tsx
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { AlertTriangle } from 'lucide-react';
import type { EditorBlockPlugin } from 'smartpage';

// 1. React NodeView component
function WarningBlockView({ node }: { node: any }) {
  return (
    <NodeViewWrapper className="warning-block">
      <div className="warning-block__label">Warning</div>
      <div className="warning-block__content">{node.attrs.message}</div>
    </NodeViewWrapper>
  );
}

// 2. TipTap Node extension
const WarningBlockExtension = Node.create({
  name: 'warningBlock',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      message: { default: 'Warning message' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-warning-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-warning-block': '' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WarningBlockView);
  },

  addCommands() {
    return {
      insertWarningBlock:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: 'warningBlock',
            attrs,
            content: [{ type: 'paragraph' }],
          }),
    };
  },
});

// 3. Block plugin definition
export const warningBlock: EditorBlockPlugin = {
  name: 'warningBlock',
  label: 'Warning',
  icon: AlertTriangle,
  description: 'A highlighted warning block',
  extension: WarningBlockExtension,
  styles: `
    .warning-block {
      border: 2px solid #f59e0b;
      border-radius: 6px;
      padding: 12px;
      margin: 8px 0;
      background: #fffbeb;
    }
    .warning-block__label {
      font-size: 11px;
      font-weight: 600;
      color: #d97706;
      margin-bottom: 4px;
    }
  `,
  exportStyles: `
    div[data-warning-block] {
      border: 2px solid #f59e0b;
      border-radius: 6px;
      padding: 12px;
      margin: 8px 0;
      background: #fffbeb;
    }
  `,
  insert: (editor) => {
    (editor.commands as any).insertWarningBlock({ message: 'Important notice' });
  },
};
```

Register it alongside the built-in blocks:

```tsx
<SmartPage ref={ref} blocks={[forBlock, ifBlock, warningBlock]} />
```

## EditorBlockPlugin Interface

```ts
interface EditorBlockPlugin {
  /** Unique name -- must match the TipTap extension name */
  name: string;

  /** Display label for the toolbar dropdown */
  label: string;

  /** Lucide icon component for the toolbar */
  icon: ComponentType<{ className?: string }>;

  /** Tooltip description */
  description?: string;

  /**
   * TipTap Node extension.
   * Can be a static extension or a factory receiving BlockContext.
   */
  extension: Node | ((ctx: BlockContext) => Node);

  /** CSS injected into <head> while the editor is mounted */
  styles: string;

  /** CSS included in getPdfHTML() and getPreviewHTML() output */
  exportStyles?: string;

  /** Called when the user clicks the block in the toolbar */
  insert: (editor: Editor) => void;
}
```

## Factory Extensions with Context

When a block needs access to runtime state (like the current template variables), use a factory function for the extension:

```ts
const myBlock: EditorBlockPlugin = {
  name: 'myBlock',
  label: 'My Block',
  icon: Box,
  // Factory receives BlockContext with current variables
  extension: (ctx) => MyBlockExtension.configure({
    variables: ctx.variables,
  }),
  styles: MY_BLOCK_STYLES,
  insert: (editor) => {
    (editor.commands as any).insertMyBlock();
  },
};
```

The `BlockContext` interface:

```ts
interface BlockContext {
  variables: TemplateVariable[];
}
```

The `forBlock` built-in uses this pattern to pass the current variable list to its extension, enabling the variable selector dropdown inside the for-loop configuration.
