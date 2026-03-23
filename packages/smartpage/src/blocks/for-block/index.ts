import { Repeat } from 'lucide-react'
import type { EditorBlockPlugin } from '../types'
import { ForBlockExtension } from './extension'
import { FOR_BLOCK_STYLES, FOR_BLOCK_EXPORT_STYLES } from './styles'

export const forBlock: EditorBlockPlugin = {
  name: 'forBlock',
  label: 'For Loop',
  icon: Repeat,
  description: 'Repeat content for each item in a list',
  // Factory — receives runtime context with current variables
  extension: (ctx) => ForBlockExtension.configure({
    variables: ctx.variables,
  }),
  styles: FOR_BLOCK_STYLES,
  exportStyles: FOR_BLOCK_EXPORT_STYLES,
  insert: (editor) => {
    editor.chain().focus().insertForBlock({ iterVar: 'item', listVar: 'items' }).run()
  },
}
