# Toolbar Customization

## Toolbar Presets

SmartPage ships with three toolbar presets:

```tsx
<SmartPage ref={ref} toolbar="full" />     // All features (default)
<SmartPage ref={ref} toolbar="minimal" />  // Basic formatting only
<SmartPage ref={ref} toolbar="document" /> // Document-focused features
```

### Preset Contents

| Feature | full | minimal | document |
|---------|------|---------|----------|
| undo, redo | x | x | x |
| heading | x | x | x |
| bold, italic, underline | x | x | x |
| strikethrough | x | | x |
| subscript, superscript | x | | |
| color, highlight | x | | x |
| alignLeft/Center/Right/Justify | x | | x |
| bulletList, orderedList | x | | x |
| taskList | x | | |
| indent, outdent | x | | x |
| link | x | x | x |
| table | x | | x |
| image | x | | x |
| horizontalRule | x | | x |
| pageBreak | x | | x |
| blockquote | x | | x |
| codeBlock | x | | |
| variables | x | | x |
| blocks | x | | x |

## Custom Toolbar Config

Use the `ToolbarConfig` object to fine-tune which features are available:

```tsx
// Start from a preset and disable specific features
<SmartPage
  ref={ref}
  toolbar={{
    preset: 'full',
    disable: ['codeBlock', 'taskList', 'subscript', 'superscript'],
  }}
/>

// Start from minimal and add features
<SmartPage
  ref={ref}
  toolbar={{
    preset: 'minimal',
    enable: ['image', 'table', 'bulletList', 'orderedList'],
  }}
/>
```

### ToolbarConfig

```ts
interface ToolbarConfig {
  preset?: 'full' | 'minimal' | 'document';  // Base preset. Default: 'full'
  enable?: ToolbarFeature[];                   // Features to add to the preset
  disable?: ToolbarFeature[];                  // Features to remove from the preset
}
```

## All Available Features

```ts
type ToolbarFeature =
  | 'undo' | 'redo'
  | 'heading'
  | 'bold' | 'italic' | 'underline' | 'strikethrough'
  | 'subscript' | 'superscript'
  | 'color' | 'highlight'
  | 'alignLeft' | 'alignCenter' | 'alignRight' | 'alignJustify'
  | 'bulletList' | 'orderedList' | 'taskList'
  | 'indent' | 'outdent'
  | 'link'
  | 'table' | 'image' | 'horizontalRule' | 'pageBreak'
  | 'blockquote' | 'codeBlock'
  | 'variables' | 'blocks';
```

## Automatic Feature Removal

Some toolbar features are automatically removed based on configuration:

- **`pageBreak`** is removed when `canvas.paginate` is `false` (e.g., email preset)
- **`blocks`** is removed when no blocks are registered (empty `blocks` prop)

## Read-Only Mode Toolbar Behavior

When `readOnly` is `true`, the toolbar remains visible (unless `showToolbar={false}`) but formatting controls are disabled. Action buttons (import, preview, print, export) remain active, and the preview/edit toggle button lets users switch back to edit mode.

To completely hide the toolbar:

```tsx
<SmartPage ref={ref} readOnly={true} showToolbar={false} />
```

## Action Buttons

The right side of the toolbar shows action buttons controlled by the `actions` prop:

```tsx
// All actions enabled (default)
<SmartPage ref={ref} actions={true} />

// All actions disabled
<SmartPage ref={ref} actions={false} />

// Fine-grained control
<SmartPage
  ref={ref}
  actions={{
    import: true,    // Import from DOCX, PDF, HTML, TXT
    preview: true,   // Toggle read-only preview mode
    print: true,     // Print document
    export: true,    // Export as HTML, Markdown, or copy to clipboard
  }}
/>
```

### Available Actions

| Action | Description |
|--------|-------------|
| `import` | Upload and import `.docx`, `.doc`, `.pdf`, `.html`, `.htm`, `.txt` files |
| `preview` | Toggle between edit and read-only preview mode |
| `print` | Open the browser print dialog with PDF-ready HTML |
| `export` | Dropdown: Copy HTML to clipboard, Export as HTML file, Export as Markdown |

## Lifecycle Hooks

Intercept action events with lifecycle hooks:

```tsx
<SmartPage
  ref={ref}
  actions={{
    import: true,
    preview: true,
    print: true,
    export: true,

    // Before hooks -- return false to cancel the action
    onBeforeImport: async (file: File) => {
      if (file.size > 10_000_000) {
        alert('File too large');
        return false;
      }
      return true;
    },
    onBeforePreview: () => true,
    onBeforePrint: () => true,
    onBeforeExport: (format: 'html' | 'markdown' | 'clipboard') => true,

    // After hooks -- called when the action completes
    onAfterImport: (html: string, file: File) => {
      console.log(`Imported ${file.name}`);
    },
    onAfterPreview: (html: string) => {
      console.log('Entered preview mode');
    },
    onAfterPrint: () => {
      console.log('Print dialog closed');
    },
    onAfterExport: (content: string, format: 'html' | 'markdown' | 'clipboard') => {
      console.log(`Exported as ${format}`);
    },
  }}
/>
```

### EditorActionsConfig

```ts
interface EditorActionsConfig {
  import?: boolean;
  preview?: boolean;
  print?: boolean;
  export?: boolean;

  onBeforeImport?: (file: File) => boolean | Promise<boolean>;
  onAfterImport?: (html: string, file: File) => void;
  onBeforePreview?: () => boolean;
  onAfterPreview?: (html: string) => void;
  onBeforePrint?: () => boolean;
  onAfterPrint?: () => void;
  onBeforeExport?: (format: 'html' | 'markdown' | 'clipboard') => boolean;
  onAfterExport?: (content: string, format: 'html' | 'markdown' | 'clipboard') => void;
}
```

## Custom Toolbar Actions

Add custom buttons to the right side of the toolbar using `toolbarActions`:

```tsx
<SmartPage
  ref={ref}
  toolbarActions={
    <button onClick={() => console.log('Custom action')}>
      Save Draft
    </button>
  }
/>
```

The `toolbarActions` node renders after the built-in action buttons.
