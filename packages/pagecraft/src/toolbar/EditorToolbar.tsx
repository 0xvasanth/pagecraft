import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, ListChecks,
  Undo2, Redo2,
  Table as TableIcon, Image as ImageIcon,
  Link as LinkIcon, Quote, Code2, Minus,
  SeparatorHorizontal, Palette, Highlighter,
  Subscript, Superscript, ChevronDown,
  Indent, Outdent, Type, Trash2, Plus,
  Columns2, Rows2, Merge, Split, Braces,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'
import { Input } from '../ui/input'
import { useCallback, useEffect, useRef, useState, useReducer } from 'react'
import { fileToBase64 } from '../utils/image-utils'

import type { EditorBlockPlugin } from '../blocks/types'
import type { ToolbarFeature, TemplateVariable } from '../types'
import { Blocks } from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
  variables?: TemplateVariable[]
  onAddVariable?: (name: string) => void
  blocks?: EditorBlockPlugin[]
  /** Extra actions rendered at the right side of the toolbar */
  actions?: React.ReactNode
  /** When true, all formatting controls are disabled */
  readOnly?: boolean
  /** Set of toolbar features to display. When undefined, all features are shown. */
  features?: Set<ToolbarFeature>
}

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
]

const HIGHLIGHT_COLORS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff0000', '#0000ff',
  '#fce5cd', '#d9ead3', '#cfe2f3', '#d9d2e9', '#ead1dc', '#fff2cc',
]

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  tooltip,
  children
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  tooltip: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClick}
            disabled={disabled}
            className={isActive ? 'bg-muted text-foreground' : ''}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Safely check if an editor command can be executed.
 * Returns false if the command doesn't exist (e.g., when toolbar
 * targets a header/footer mini-editor without table extensions).
 */
function canRun(editor: Editor, command: string): boolean {
  const can = editor.can() as Record<string, unknown>
  return typeof can[command] === 'function' ? !!(can[command] as () => boolean)() : false
}

export function EditorToolbar({ editor, variables = [], onAddVariable, blocks = [], actions, readOnly = false, features }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [customVarName, setCustomVarName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  // Force re-render on editor selection/transaction changes so active states stay in sync
  const [, forceUpdate] = useReducer(c => c + 1, 0)
  useEffect(() => {
    if (!editor) return
    editor.on('selectionUpdate', forceUpdate)
    editor.on('transaction', forceUpdate)
    return () => {
      editor.off('selectionUpdate', forceUpdate)
      editor.off('transaction', forceUpdate)
    }
  }, [editor])

  /** Returns true if the feature should be shown. When features is undefined, everything is shown. */
  const has = (f: ToolbarFeature) => !features || features.has(f)

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !editor) return

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const src = await fileToBase64(file)
        editor.chain().focus().setImage({ src }).run()
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setLinkUrl('')
  }, [editor, linkUrl])

  if (!editor) return null

  const showHistory = has('undo') || has('redo')
  const showHeading = has('heading')
  const showTextStyle = has('bold') || has('italic') || has('underline') || has('strikethrough') || has('subscript') || has('superscript')
  const showColor = has('color') || has('highlight')
  const showAlignment = has('alignLeft') || has('alignCenter') || has('alignRight') || has('alignJustify')
  const showLists = has('bulletList') || has('orderedList') || has('taskList') || has('indent') || has('outdent')
  const showLink = has('link')
  const showInsert = has('table') || has('image') || has('horizontalRule') || has('pageBreak') || has('blockquote') || has('codeBlock')
  const showVariables = has('variables') && variables.length > 0
  const showBlocks = has('blocks') && blocks.length > 0

  // Track which sections are visible to place separators between them
  const sections = [showHistory, showHeading, showTextStyle, showColor, showAlignment, showLists, showLink, showInsert, showVariables, showBlocks]
  // Helper: should we render a separator before section at index i?
  const sepBefore = (i: number) => {
    if (!sections[i]) return false
    for (let j = 0; j < i; j++) { if (sections[j]) return true }
    return false
  }

  return (
    <TooltipProvider delay={300}>
      <div className="flex items-center border-b border-border bg-background px-1.5 py-0.5 sticky top-0 z-50" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #e5e7eb' }}>
        {/* Formatting controls — hidden in readOnly mode */}
        {!readOnly && <div className="flex flex-wrap items-center gap-0.5">

        {/* History */}
        {showHistory && <>
          {has('undo') && <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Undo (Ctrl+Z)">
            <Undo2 className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('redo') && <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="Redo (Ctrl+Y)">
            <Redo2 className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
        </>}

        {/* Heading Dropdown */}
        {sepBefore(1) && <Separator orientation="vertical" className="mx-1 h-6" />}
        {showHeading && <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="xs" className="gap-1 min-w-[100px] justify-between" />}
          >
            <Type className="size-3.5" strokeWidth={1.5} />
            <span className="text-xs">
              {editor.isActive('heading', { level: 1 }) ? 'Heading 1' :
               editor.isActive('heading', { level: 2 }) ? 'Heading 2' :
               editor.isActive('heading', { level: 3 }) ? 'Heading 3' :
               editor.isActive('heading', { level: 4 }) ? 'Heading 4' :
               'Paragraph'}
            </span>
            <ChevronDown className="size-3" strokeWidth={1.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
              <span className="text-sm">Paragraph</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <span className="text-xl font-bold">Heading 1</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <span className="text-lg font-semibold">Heading 2</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <span className="text-base font-semibold">Heading 3</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
              <span className="text-sm font-semibold">Heading 4</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>}

        {/* Text Style */}
        {sepBefore(2) && <Separator orientation="vertical" className="mx-1 h-6" />}
        {showTextStyle && <>
          {has('bold') && <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} tooltip="Bold (Ctrl+B)">
            <Bold className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('italic') && <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} tooltip="Italic (Ctrl+I)">
            <Italic className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('underline') && <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} tooltip="Underline (Ctrl+U)">
            <UnderlineIcon className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('strikethrough') && <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} tooltip="Strikethrough">
            <Strikethrough className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('subscript') && <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} tooltip="Subscript">
            <Subscript className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('superscript') && <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} tooltip="Superscript">
            <Superscript className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
        </>}

        {/* Color */}
        {sepBefore(3) && <Separator orientation="vertical" className="mx-1 h-6" />}
        {showColor && <>
          {has('color') && <Popover>
            <PopoverTrigger render={<Button variant="ghost" size="icon-xs" />}>
              <Palette className="size-3.5" strokeWidth={1.5} />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-10 gap-1">
                {TEXT_COLORS.map(color => (
                  <button
                    key={color}
                    className="size-5 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
              <button
                className="mt-2 text-xs text-muted-foreground hover:text-foreground w-full text-left"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Reset color
              </button>
            </PopoverContent>
          </Popover>}

          {has('highlight') && <Popover>
            <PopoverTrigger render={<Button variant="ghost" size="icon-xs" />}>
              <Highlighter className="size-3.5" strokeWidth={1.5} />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid grid-cols-6 gap-1">
                {HIGHLIGHT_COLORS.map(color => (
                  <button
                    key={color}
                    className="size-5 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                  />
                ))}
              </div>
              <button
                className="mt-2 text-xs text-muted-foreground hover:text-foreground w-full text-left"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                Remove highlight
              </button>
            </PopoverContent>
          </Popover>}
        </>}

        {/* Alignment */}
        {sepBefore(4) && <Separator orientation="vertical" className="mx-1 h-6" />}
        {showAlignment && <>
          {has('alignLeft') && <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} tooltip="Align left">
            <AlignLeft className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('alignCenter') && <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} tooltip="Align center">
            <AlignCenter className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('alignRight') && <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} tooltip="Align right">
            <AlignRight className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('alignJustify') && <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} tooltip="Justify">
            <AlignJustify className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
        </>}

        {/* Lists */}
        {sepBefore(5) && <Separator orientation="vertical" className="mx-1 h-6" />}
        {showLists && <>
          {has('bulletList') && <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} tooltip="Bullet list">
            <List className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('orderedList') && <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} tooltip="Numbered list">
            <ListOrdered className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('taskList') && <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} tooltip="Task list">
            <ListChecks className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('indent') && <ToolbarButton onClick={() => editor.chain().focus().sinkListItem('listItem').run()} disabled={!canRun(editor, 'sinkListItem')} tooltip="Increase indent">
            <Indent className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
          {has('outdent') && <ToolbarButton onClick={() => editor.chain().focus().liftListItem('listItem').run()} disabled={!canRun(editor, 'liftListItem')} tooltip="Decrease indent">
            <Outdent className="size-3.5" strokeWidth={1.5} />
          </ToolbarButton>}
        </>}

        {/* Link */}
        {sepBefore(6) && <Separator orientation="vertical" className="mx-1 h-6" />}
        {showLink && <Popover>
          <PopoverTrigger render={<Button variant="ghost" size="icon-xs" className={editor.isActive('link') ? 'bg-muted text-foreground' : ''} />}>
            <LinkIcon className="size-3.5" strokeWidth={1.5} />
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setLink()}
                className="h-8 text-sm"
              />
              <Button size="xs" onClick={setLink}>
                {editor.isActive('link') ? 'Update' : 'Add'}
              </Button>
            </div>
            {editor.isActive('link') && (
              <button
                className="mt-2 text-xs text-destructive hover:underline"
                onClick={() => editor.chain().focus().unsetLink().run()}
              >
                Remove link
              </button>
            )}
          </PopoverContent>
        </Popover>}

        {/* Insert Menu */}
        {sepBefore(7) && <Separator orientation="vertical" className="mx-1 h-6" />}
        {showInsert && <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="xs" className="gap-1" />}>
            <Plus className="size-3.5" strokeWidth={1.5} />
            <span className="text-xs">Insert</span>
            <ChevronDown className="size-3" strokeWidth={1.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {has('table') && <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <TableIcon className="size-3.5 mr-1.5" strokeWidth={1.5} />
                Table
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                  <TableIcon className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Insert 3x3 Table
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 4, cols: 4, withHeaderRow: true }).run()}>
                  <TableIcon className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Insert 4x4 Table
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!canRun(editor, 'addColumnAfter')}>
                  <Columns2 className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Add Column After
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()} disabled={!canRun(editor, 'addColumnBefore')}>
                  <Columns2 className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Add Column Before
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!canRun(editor, 'deleteColumn')}>
                  <Trash2 className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Delete Column
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!canRun(editor, 'addRowAfter')}>
                  <Rows2 className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Add Row After
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()} disabled={!canRun(editor, 'addRowBefore')}>
                  <Rows2 className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Add Row Before
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} disabled={!canRun(editor, 'deleteRow')}>
                  <Trash2 className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Delete Row
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()} disabled={!canRun(editor, 'mergeCells')}>
                  <Merge className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Merge Cells
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()} disabled={!canRun(editor, 'splitCell')}>
                  <Split className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Split Cell
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} disabled={!canRun(editor, 'deleteTable')}>
                  <Trash2 className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  Delete Table
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>}

            {has('image') && <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="size-3.5 mr-1.5" strokeWidth={1.5} />
              Image
            </DropdownMenuItem>}
            {has('horizontalRule') && <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
              <Minus className="size-3.5 mr-1.5" strokeWidth={1.5} />
              Horizontal Rule
            </DropdownMenuItem>}
            {has('pageBreak') && <DropdownMenuItem onClick={() => editor.chain().focus().insertPageBreak().run()}>
              <SeparatorHorizontal className="size-3.5 mr-1.5" strokeWidth={1.5} />
              Page Break
            </DropdownMenuItem>}
            {(has('blockquote') || has('codeBlock')) && <DropdownMenuSeparator />}
            {has('blockquote') && <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote className="size-3.5 mr-1.5" strokeWidth={1.5} />
              Blockquote
            </DropdownMenuItem>}
            {has('codeBlock') && <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
              <Code2 className="size-3.5 mr-1.5" strokeWidth={1.5} />
              Code Block
            </DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>}

        {/* Variables */}
        {showVariables && <>
          {sepBefore(8) && <Separator orientation="vertical" className="mx-1 h-6" />}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="xs" className="gap-1" />}>
              <Braces className="size-3.5" strokeWidth={1.5} />
              <span className="text-xs">Variables</span>
              <ChevronDown className="size-3" strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {variables.map(v => (
                <DropdownMenuItem key={v.key} onClick={() => editor.chain().focus().insertVariable(v.key).run()}>
                  <Braces className="size-3.5 mr-1.5" strokeWidth={1.5} />
                  <span className="text-xs">{v.label || v.key}</span>
                </DropdownMenuItem>
              ))}
              {variables.length > 0 && onAddVariable && <DropdownMenuSeparator />}
              {onAddVariable && (
                <div className="px-1.5 py-1">
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="custom_variable"
                      value={customVarName}
                      onChange={e => setCustomVarName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase())}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && customVarName.trim()) {
                          onAddVariable(customVarName.trim())
                          editor.chain().focus().insertVariable(customVarName.trim()).run()
                          setCustomVarName('')
                        }
                      }}
                      className="h-7 text-xs font-mono"
                    />
                    <Button
                      size="xs"
                      disabled={!customVarName.trim()}
                      onClick={() => {
                        if (customVarName.trim()) {
                          onAddVariable(customVarName.trim())
                          editor.chain().focus().insertVariable(customVarName.trim()).run()
                          setCustomVarName('')
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>}

        {/* Blocks */}
        {showBlocks && <>
          {sepBefore(9) && <Separator orientation="vertical" className="mx-1 h-6" />}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="xs" className="gap-1" />}>
              <Blocks className="size-3.5" strokeWidth={1.5} />
              <span className="text-xs">Blocks</span>
              <ChevronDown className="size-3" strokeWidth={1.5} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {blocks.map(block => {
                const Icon = block.icon
                return (
                  <DropdownMenuItem key={block.name} onClick={() => block.insert(editor)}>
                    <Icon className="size-4 mr-2" />
                    <div>
                      <div className="text-sm">{block.label}</div>
                      {block.description && (
                        <div className="text-xs text-muted-foreground">{block.description}</div>
                      )}
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </>}

        {/* Hidden file input for image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />

        </div>}{/* end formatting controls */}

        {/* Actions slot — always active, pushed to the right */}
        {actions && (
          <>
            <div className="flex-1" />
            <Separator orientation="vertical" className="mx-1 h-6" />
            <div className="flex items-center gap-1">
              {actions}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
