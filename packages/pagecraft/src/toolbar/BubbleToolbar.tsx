import { BubbleMenu } from '@tiptap/react/menus'
import type { Editor } from '@tiptap/react'
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Link as LinkIcon, Highlighter, RemoveFormatting } from 'lucide-react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Input } from '../ui/input'
import { useState, useCallback } from 'react'

interface BubbleToolbarProps {
  editor: Editor
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('')

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run()
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setLinkUrl('')
  }, [editor, linkUrl])

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: 'top',
        offset: 8,
      }}
      shouldShow={({ editor: e, state }) => {
        const { empty } = state.selection
        if (empty || e.isActive('resizableImage') || e.isActive('codeBlock')) return false
        return true
      }}
      className="flex items-center gap-0.5 bg-background border border-border rounded-lg shadow-xl p-1"
    >
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-muted' : ''}
      >
        <Bold className="size-3" strokeWidth={1.5} />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-muted' : ''}
      >
        <Italic className="size-3" strokeWidth={1.5} />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? 'bg-muted' : ''}
      >
        <UnderlineIcon className="size-3" strokeWidth={1.5} />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'bg-muted' : ''}
      >
        <Strikethrough className="size-3" strokeWidth={1.5} />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={editor.isActive('code') ? 'bg-muted' : ''}
      >
        <Code className="size-3" strokeWidth={1.5} />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={editor.isActive('highlight') ? 'bg-muted' : ''}
      >
        <Highlighter className="size-3" strokeWidth={1.5} />
      </Button>

      <div className="w-px h-4 bg-border mx-0.5" />

      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              className={editor.isActive('link') ? 'bg-muted' : ''}
            />
          }
        >
          <LinkIcon className="size-3" strokeWidth={1.5} />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" side="top">
          <div className="flex gap-1.5">
            <Input
              placeholder="https://..."
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setLink()}
              className="h-7 text-xs"
            />
            <Button size="xs" onClick={setLink}>Set</Button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="w-px h-4 bg-border mx-0.5" />

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        title="Clear formatting"
      >
        <RemoveFormatting className="size-3" strokeWidth={1.5} />
      </Button>
    </BubbleMenu>
  )
}
