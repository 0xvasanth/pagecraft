# SmartPage Editor — Use Cases

This document is the canonical list of all use cases supported by the SmartPage editor. Every feature, interaction, and edge case is listed here. Use this as:

- **Manual QA checklist** — walk through each case before a release
- **E2E test backlog** — every case should eventually have an automated test
- **Feature inventory** — if it's not here, we don't support it

The `[e2e]` tag marks cases covered by automated tests in `e2e/editor.spec.ts`. The test number (e.g., `[e2e:1]`) maps to the test in the spec file.

---

## 1. Editor Modes

### 1.1 Read-Only Mode
- [ ] `[e2e:1]` Editor starts in read-only mode when `readOnly={true}`
- [ ] `[e2e:1]` Formatting toolbar is collapsed (Paragraph, Variables, Blocks not visible)
- [ ] `[e2e:1]` `.smartpage--readonly` class is applied to root element
- [ ] `[e2e:14]` No formatting controls visible in read-only mode
- [ ] `[e2e:30]` File inputs are hidden (`display: none`) and not visible
- [ ] Content is not editable (cursor is `default`, no text input accepted)
- [ ] Template variable chips are not selectable/editable
- [ ] Block delete buttons are hidden
- [ ] Image resize handles are hidden
- [ ] Table inline controls are hidden

### 1.2 Edit Mode
- [ ] `[e2e:2]` Clicking edit button switches to edit mode
- [ ] `[e2e:2]` Full toolbar is visible (Paragraph, Variables, Blocks, Insert)
- [ ] `[e2e:2]` `.smartpage--readonly` class is removed
- [ ] Content is editable (cursor changes, text input accepted)
- [ ] Clicking in the editor area places cursor and allows typing
- [ ] All toolbar buttons are functional

### 1.3 Mode Toggle
- [ ] Edit button shows pencil icon in read-only, eye icon in edit mode
- [ ] `[e2e:15]` Switching back to read-only hides inline controls
- [ ] Mode toggle preserves content (no data loss)
- [ ] `onBeforePreview` hook can prevent mode toggle (return `false`)
- [ ] `onAfterPreview` hook fires after mode change

---

## 2. Rich Text Formatting

### 2.1 Block-Level Formatting
- [ ] `[e2e:3]` Heading 1 renders as `<h1>`
- [ ] Heading 2 renders as `<h2>`
- [ ] Heading 3 renders as `<h3>`
- [ ] Heading 4 renders as `<h4>`
- [ ] Paragraph renders as `<p>`
- [ ] `[e2e:3]` Blockquote renders as `<blockquote>`
- [ ] `[e2e:3]` Code block renders as `<pre><code>`
- [ ] Heading dropdown shows current block type name

### 2.2 Inline Formatting
- [ ] `[e2e:3]` Bold text renders as `<strong>`
- [ ] `[e2e:3]` Italic text renders as `<em>`
- [ ] `[e2e:3]` Underline text renders as `<u>`
- [ ] Strikethrough text renders as `<s>`
- [ ] Subscript text renders as `<sub>`
- [ ] Superscript text renders as `<sup>`
- [ ] Inline code renders as `<code>`
- [ ] Keyboard shortcuts work: Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline)

### 2.3 Text Color & Highlight
- [ ] Text color picker shows 30 color options
- [ ] Clicking a color applies it to selected text
- [ ] "Reset color" button removes text color
- [ ] Highlight picker shows 12 color options
- [ ] Clicking highlight color applies background highlight
- [ ] "Reset highlight" button removes highlight
- [ ] Multiple highlight colors can coexist in same document

### 2.4 Text Alignment
- [ ] Align left applies `text-align: left`
- [ ] Align center applies `text-align: center`
- [ ] Align right applies `text-align: right`
- [ ] Justify applies `text-align: justify`
- [ ] Active alignment button shows highlighted state

### 2.5 Lists
- [ ] `[e2e:3]` Bullet list renders as `<ul><li>`
- [ ] `[e2e:3]` Ordered list renders as `<ol><li>`
- [ ] Task list renders with checkboxes
- [ ] Indent increases list nesting level
- [ ] Outdent decreases list nesting level
- [ ] Indent/outdent disabled when not applicable

### 2.6 Links
- [ ] Link popover opens from toolbar button
- [ ] Entering URL and pressing Enter sets link
- [ ] URLs without protocol get `https://` prefix added
- [ ] Empty URL removes existing link
- [ ] Active link shows highlighted button state
- [ ] Links open in new tab with `rel="noopener noreferrer"`

---

## 3. Bubble Toolbar (Inline Selection Toolbar)

### 3.1 Visibility
- [ ] `[e2e:27]` Bubble toolbar appears when text is selected
- [ ] Bubble toolbar hides when selection is empty
- [ ] Bubble toolbar hides when image is selected
- [ ] Bubble toolbar hides when cursor is in code block
- [ ] Bubble toolbar positions above selection with offset

### 3.2 Formatting Actions
- [ ] Bold button toggles bold on selected text
- [ ] Italic button toggles italic on selected text
- [ ] Underline button toggles underline on selected text
- [ ] Strikethrough button toggles strikethrough
- [ ] Code button toggles inline code
- [ ] Highlight button toggles highlight
- [ ] Active format shows highlighted button state

### 3.3 Link in Bubble
- [ ] Link button opens URL input popover
- [ ] Entering URL and pressing Enter sets link on selection
- [ ] Empty URL removes link from selection

### 3.4 Clear Formatting
- [ ] `[e2e:28]` Clear formatting button removes all inline marks (bold, italic, underline, etc.)
- [ ] `[e2e:29]` Clear formatting preserves block-level nodes (headings stay as headings)
- [ ] Clear formatting removes links from selected text
- [ ] Clear formatting removes highlight and text color

---

## 4. Tables

### 4.1 Table Creation
- [ ] `[e2e:4]` Table with header row renders correctly
- [ ] Insert 3x3 table from Insert menu
- [ ] Insert 4x4 table from Insert menu
- [ ] Header row renders as `<th>` elements

### 4.2 Table Editing
- [ ] Clicking in a cell places cursor for editing
- [ ] Tab key moves to next cell
- [ ] Shift+Tab moves to previous cell
- [ ] Text can be typed and formatted within cells
- [ ] Column resize handles work (drag to resize)

### 4.3 Table Inline Controls
- [ ] `[e2e:16]` Row controls appear on right edge hover (within 50px)
- [ ] `[e2e:17]` Column controls appear on bottom edge hover (within 50px)
- [ ] `[e2e:18]` Delete table button appears on top-left corner hover
- [ ] Plus button adds row below hovered row
- [ ] X button deletes the hovered row
- [ ] Plus button adds column to right of hovered column
- [ ] X button deletes the hovered column
- [ ] Trash button deletes the entire table
- [ ] Controls disappear when mouse leaves table area
- [ ] Controls hidden in read-only mode
- [ ] Only one row/column control visible at a time

### 4.4 Table Structure Commands (from Insert > Table submenu)
- [ ] Add Column After inserts column to the right
- [ ] Add Column Before inserts column to the left
- [ ] Delete Column removes current column
- [ ] Add Row After inserts row below
- [ ] Add Row Before inserts row above
- [ ] Delete Row removes current row
- [ ] Merge Cells combines selected cells
- [ ] Split Cell divides merged cell
- [ ] Delete Table removes entire table
- [ ] Commands disabled when not applicable (e.g., no table selected)
- [ ] Selected row highlights with blue background

---

## 5. Images

### 5.1 Image Insertion
- [ ] Upload image via Insert > Image in toolbar
- [ ] Drag and drop image file onto editor canvas
- [ ] Paste image from clipboard
- [ ] Images stored as base64 data URIs (no server required)
- [ ] Multiple images can be uploaded at once

### 5.2 Image Resize & Alignment
- [ ] Click image to select and show resize handles
- [ ] Drag corner handles to resize proportionally
- [ ] Alignment buttons appear on selected image (left, center, right)
- [ ] Clicking alignment changes image position
- [ ] Crop button opens crop overlay
- [ ] Delete button removes image
- [ ] Resize handles hidden in read-only mode

### 5.3 Image in Header/Footer
- [ ] Images can be inserted in header via drag-drop
- [ ] Header images respect max-height constraint (60px)
- [ ] Footer images respect max-height constraint

---

## 6. Template Variables

### 6.1 Variable Insertion
- [ ] `[e2e:7]` Inserting variable creates a styled chip in editor
- [ ] `[e2e:8]` Variables output as `{{variable_name}}` in HTML
- [ ] `[e2e:8]` Variables include `data-variable` attribute in HTML

### 6.2 Variable Dropdown
- [ ] `[e2e:9]` Dropdown shows predefined variables with labels
- [ ] `[e2e:24]` Labels displayed (not raw keys) in dropdown
- [ ] Clicking a variable inserts it at cursor position
- [ ] Custom variable input field available at bottom of dropdown
- [ ] Creating custom variable inserts it and adds to list

### 6.3 Variable Rendering
- [ ] Variable chips show key name (e.g., `first_name`)
- [ ] Chips are styled with purple background and monospace font
- [ ] Chips are inline (flow with text)
- [ ] Variables are not editable inline (atom node)
- [ ] Variables can be deleted with backspace/delete

### 6.4 Variable Configuration
- [ ] `variables={false}` disables variable system entirely
- [ ] `variables={[]}` shows empty dropdown
- [ ] Variables with `label` show label in dropdown, key in chip

---

## 7. Block Plugins

### 7.1 Block Dropdown
- [ ] `[e2e:10]` Blocks dropdown shows all 3 built-in block types
- [ ] Each block shows icon, label, and description

### 7.2 For Loop Block
- [ ] `[e2e:11]` For block renders with header "For each ... in ..."
- [ ] `[e2e:11]` For block renders with footer "End for each"
- [ ] `[e2e:13]` For block appears in HTML output with `data-block-for`
- [ ] Double-click expression to edit iterator and list variables
- [ ] Variable picker dropdown shows available variables for list
- [ ] Custom list variable can be typed manually
- [ ] "Done" button closes edit mode
- [ ] Delete button (X) removes the block
- [ ] Content inside for block is editable (paragraphs, tables, etc.)

### 7.3 If Condition Block
- [ ] `[e2e:12]` If block renders with condition expression
- [ ] `[e2e:12]` If block renders with footer "End if"
- [ ] Double-click to edit condition expression
- [ ] Delete button removes the block
- [ ] Content inside if block is editable

### 7.4 Read-Only Block
- [ ] Read-only block renders with lock icon and label
- [ ] Content inside read-only block is not editable
- [ ] Block can only be deleted (not edited)
- [ ] Delete button removes the block

### 7.5 Block Behavior
- [ ] Blocks are draggable (can be reordered)
- [ ] Blocks are selectable (can be deleted with keyboard)
- [ ] Block edit controls hidden in read-only mode
- [ ] Block expression not clickable in read-only mode
- [ ] Blocks can be nested (for inside for, if inside for, etc.)

---

## 8. Page Layout & Pagination

### 8.1 A4 Canvas
- [ ] `[e2e:25]` Editor canvas has a background color
- [ ] Page dimensions match A4 (210mm x 297mm at 96 DPI)
- [ ] Content area has 25.4mm padding on all sides
- [ ] White page background on gray canvas background

### 8.2 Pagination
- [ ] `[e2e:5]` Content spanning multiple pages shows page gap indicators
- [ ] `[e2e:5]` Page flow style tag contains pagination rules
- [ ] `[e2e:6]` Editing content updates pagination in real-time
- [ ] `[e2e:23]` A4 canvas defaults to paginated layout
- [ ] Page gap shows page number (e.g., "1 / 4")
- [ ] Content pushed to next page when crossing page boundary
- [ ] Page break insertion creates new page (Ctrl+Enter or Insert menu)

### 8.3 Non-Paginated Canvas
- [ ] Email canvas (`canvas="email"`) renders without pagination
- [ ] No page gaps, no page indicators in email mode
- [ ] Page break feature auto-hidden when pagination disabled
- [ ] Content flows continuously without page boundaries

### 8.4 Header & Footer
- [ ] Double-click header zone on first page opens mini-editor
- [ ] Double-click footer zone on first page opens mini-editor
- [ ] Header/footer content appears on all pages
- [ ] Subsequent pages show header/footer as display-only (not editable)
- [ ] Images can be drag-dropped into header/footer
- [ ] Header/footer placeholder text shown when empty
- [ ] Header/footer hidden in read-only mode when empty
- [ ] Toolbar context switches to active header/footer mini-editor

---

## 9. Import

### 9.1 File Import
- [ ] Import button opens file picker
- [ ] Spinner shows during import
- [ ] File input accepts: `.docx`, `.doc`, `.pdf`, `.html`, `.htm`, `.txt`
- [ ] `onBeforeImport` hook can cancel import (return `false`)
- [ ] `onAfterImport` hook fires after content is set

### 9.2 DOCX Import
- [ ] Word headings (Heading 1-6) convert to HTML headings
- [ ] Bold, italic, underline, strikethrough preserved
- [ ] Bullet and numbered lists preserved (including nested)
- [ ] Tables with headers preserved
- [ ] Images embedded as base64 data URIs
- [ ] Links preserved
- [ ] Blockquotes preserved

### 9.3 PDF Import
- [ ] PDF text extracted with font size detection
- [ ] Larger fonts inferred as headings (H1-H4 based on ratio)
- [ ] Bold text detected from font name
- [ ] Images extracted from PDF pages (above 50x50px threshold)
- [ ] Page breaks inserted between PDF pages
- [ ] Corrupted/password-protected PDFs show error message
- [ ] PDF.js worker loaded lazily from CDN

### 9.4 Other Formats
- [ ] HTML files imported as raw HTML content
- [ ] Plain text files imported as paragraph content
- [ ] Same file can be re-imported (file input value cleared after import)

---

## 10. Export

### 10.1 Export Dropdown
- [ ] `[e2e:19]` Export dropdown shows: Copy HTML, Export as HTML, Export as Markdown

### 10.2 Copy HTML
- [ ] Copies rich HTML to clipboard (both text/html and text/plain MIME types)
- [ ] Shows "Copied!" confirmation for 2 seconds
- [ ] Falls back to plain text clipboard if rich clipboard fails

### 10.3 Export as HTML
- [ ] Downloads `document.html` file
- [ ] File contains complete HTML5 document with styles
- [ ] `onBeforeExport` hook can cancel export
- [ ] `onAfterExport` hook fires with exported HTML

### 10.4 Export as Markdown
- [ ] Downloads `document.md` file
- [ ] Headings convert to `#` syntax
- [ ] Bold converts to `**text**`
- [ ] Italic converts to `*text*`
- [ ] Links convert to `[text](url)`
- [ ] Images convert to `![alt](src)`
- [ ] Tables convert to pipe-delimited format with header separator
- [ ] Lists convert to `- ` (bullet) or `1. ` (numbered)
- [ ] Blockquotes convert to `> ` prefix
- [ ] Code blocks convert to triple backticks

### 10.5 HTML Output Quality
- [ ] `[e2e:20]` getHTML preserves all content types (headings, bold, tables, blockquotes)
- [ ] `[e2e:26]` HTML output is clean and template-engine compatible
- [ ] `[e2e:26]` HTML contains `{{variable_name}}` for template variables
- [ ] `[e2e:26]` HTML does not contain editor-internal classes (editor-canvas, page-flow)
- [ ] getPdfHTML includes full CSS styles and @page rules
- [ ] getPdfHTML includes sanitized header/footer in table-based layout
- [ ] getPreviewHTML generates visual A4 page layout with pagination

---

## 11. Print

- [ ] Print button opens browser print dialog
- [ ] Print content formatted as A4 with @page rules
- [ ] Header repeats on every printed page (via table thead)
- [ ] Footer repeats on every printed page (via table tfoot)
- [ ] Print iframe cleaned up after printing (or after 10s timeout)
- [ ] `onBeforePrint` hook can cancel print
- [ ] `onAfterPrint` hook fires after print dialog closes

---

## 12. Paste Handling

### 12.1 Google Docs Paste
- [ ] Google Docs HTML detected by `docs-internal-guid` marker
- [ ] Bold, italic, underline preserved from Google Docs
- [ ] Text color preserved (non-black colors)
- [ ] Background/highlight color preserved
- [ ] Text alignment preserved
- [ ] Headings inferred from font size
- [ ] Google-specific CSS classes cleaned up

### 12.2 Microsoft Word Paste
- [ ] MSO attributes and conditional comments stripped
- [ ] Semantic tags (strong, em) preserved
- [ ] Lists and tables preserved

### 12.3 Image Paste
- [ ] Pasting image from clipboard inserts as resizable image
- [ ] Image converted to base64 data URI

### 12.4 Plain Text Paste
- [ ] Plain text pasted as paragraph content
- [ ] Line breaks create new paragraphs

---

## 13. Toolbar Configuration

### 13.1 Presets
- [ ] `[e2e:22]` Full toolbar shows all sections (Variables, Blocks, Insert)
- [ ] Minimal toolbar shows only: undo, redo, heading, bold, italic, underline, link
- [ ] Document toolbar shows most features except subscript, superscript, taskList, codeBlock

### 13.2 Custom Configuration
- [ ] `toolbar={{ preset: 'full', disable: ['blockquote'] }}` hides blockquote
- [ ] `toolbar={{ preset: 'minimal', enable: ['table'] }}` adds table to minimal
- [ ] Disabled features hide their toolbar buttons
- [ ] Separators adjust dynamically (no double separators)

---

## 14. Canvas Configuration

### 14.1 Presets
- [ ] `canvas="a4"` renders 210mm x 297mm paginated layout
- [ ] `canvas="email"` renders 600px wide non-paginated layout

### 14.2 Custom Canvas
- [ ] Custom width/height with CSS units (mm, in, cm, pt, px)
- [ ] Custom padding (top, right, bottom, left)
- [ ] `paginate: false` disables page flow
- [ ] Custom page gap between pages

---

## 15. Theme

- [ ] `theme.fontFamily` applies custom font to editor content
- [ ] `theme.fontSize` changes default text size
- [ ] `theme.lineHeight` changes line spacing
- [ ] `theme.textColor` changes default text color
- [ ] `theme.canvasBackground` changes the outer canvas background
- [ ] `theme.pageBackground` changes the page (white area) background

---

## 16. Ref API (Programmatic Control)

- [ ] `getHTML()` returns raw TipTap HTML without styles
- [ ] `getPdfHTML({ title })` returns self-contained HTML with CSS for PDF generation
- [ ] `getPreviewHTML({ title })` returns visual A4 page layout HTML
- [ ] `getJSON()` returns TipTap JSON document structure
- [ ] `setContent(html)` replaces editor content
- [ ] `getVariables()` returns list of available template variables
- [ ] `getHeader()` / `getFooter()` return header/footer HTML
- [ ] `setHeader(html)` / `setFooter(html)` update header/footer content
- [ ] `setReadOnly(boolean)` toggles read-only mode programmatically
- [ ] `isReadOnly()` returns current read-only state
- [ ] `focus()` focuses the editor
- [ ] `clear()` clears all content

---

## 17. Keyboard Shortcuts

- [ ] `Ctrl+B` / `Cmd+B` — Toggle bold
- [ ] `Ctrl+I` / `Cmd+I` — Toggle italic
- [ ] `Ctrl+U` / `Cmd+U` — Toggle underline
- [ ] `Ctrl+Z` / `Cmd+Z` — Undo
- [ ] `Ctrl+Y` / `Cmd+Shift+Z` — Redo
- [ ] `Ctrl+Enter` / `Cmd+Enter` — Insert page break
- [ ] `Tab` — Indent list item or move to next table cell
- [ ] `Shift+Tab` — Outdent list item or move to previous table cell
- [ ] `Enter` — New paragraph or new list item
- [ ] `Backspace` on empty block — Remove block/join with previous

---

## 18. Visual & Styling

### 18.1 Icon Styling
- [ ] All toolbar icons use `strokeWidth={1.5}` (not default 2)
- [ ] All icons use `#5f6368` color (Google Docs gray), scoped to `.smartpage`
- [ ] Toolbar icons are `size-3.5` (14px)
- [ ] Bubble toolbar icons are `size-3` (12px)
- [ ] Action bar icons are `size-3.5` (14px)

### 18.2 Toolbar Layout
- [ ] Toolbar is sticky at top (`sticky top-0 z-50`)
- [ ] Toolbar has bottom border
- [ ] Buttons use `icon-xs` size (24px)
- [ ] Dropdown triggers use `xs` size
- [ ] Separators appear between toolbar sections
- [ ] No double separators when sections are hidden

---

## 19. Error Resilience

- [ ] `[e2e:21]` No console errors on load and basic editing
- [ ] ResizeObserver errors are filtered (known browser noise)
- [ ] `canRun()` guard prevents crashes when toolbar targets mini-editor
- [ ] Page flow plugin handles editor view not available (try-catch)
- [ ] Import handles corrupted files gracefully
- [ ] Print handles blocked iframe access gracefully

---

## 20. Content Fingerprint & External Content Warning

### 20.1 Fingerprint
- [ ] `getHTML()` output contains `data-smartpage-origin="true"` on the first element
- [ ] `getPdfHTML()` output contains the fingerprint
- [ ] `getPreviewHTML()` output contains the fingerprint
- [ ] `hasSmartPageFingerprint(html)` returns `true` for SmartPage-generated HTML
- [ ] `hasSmartPageFingerprint(html)` returns `false` for externally-created HTML
- [ ] `hasSmartPageFingerprint('')` returns `true` (empty content is fine)

### 20.2 External Content Warning
- [ ] Warning banner appears when `content` prop has no fingerprint
- [ ] Warning banner appears when `setContent()` is called with non-SmartPage HTML
- [ ] Warning banner is dismissible (click "Dismiss")
- [ ] Warning does not appear for SmartPage-generated HTML
- [ ] Warning does not appear for empty content
- [ ] `warnOnExternalContent={false}` disables the warning entirely
- [ ] `warnOnExternalContent` defaults to `true` when not specified
- [ ] Warning has `.smartpage-external-warning` CSS class

---

## 21. CSS Class Contract

These CSS classes are part of the public API and must remain stable:

| Class | Purpose |
|-------|---------|
| `.smartpage` | Root wrapper element |
| `.smartpage--readonly` | Applied when editor is in read-only mode |
| `.smartpage-hf` | Header/footer zone |
| `.smartpage-hf--header` | Header zone specifically |
| `.smartpage-hf--footer` | Footer zone specifically |
| `.smartpage-hf-field` | Header/footer editable field |
| `.smartpage-hf-field--editing` | Header/footer field in edit mode |
| `.smartpage-hf-editor` | Header/footer mini-editor |
| `.editor-canvas` | Outer canvas container |
| `.editor-pages-container` | Page backgrounds container |
| `.template-variable-chip` | Variable chip element |
| `.template-variable-name` | Variable name text |
| `.s-block` | Block plugin wrapper |
| `.s-block--for` | For loop block |
| `.s-block--if` | If condition block |
| `.s-block--readonly` | Read-only block |
| `.table-control--visible` | Visible table inline control |
| `.table-control--row` | Row control |
| `.table-control--col` | Column control |
| `.table-control--delete-table` | Delete table control |
| `[data-page-flow]` | Page flow style tag |
| `[data-page-break]` | Page break element |
| `[data-variable]` | Template variable in HTML output |
| `[data-block-for]` | For block in HTML output |
| `[data-block-if]` | If block in HTML output |
| `[data-block-readonly]` | Read-only block in HTML output |
