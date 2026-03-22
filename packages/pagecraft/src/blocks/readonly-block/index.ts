import { Lock } from 'lucide-react'
import type { EditorBlockPlugin } from '../types'
import { ReadOnlyBlockExtension } from './extension'
import { READONLY_BLOCK_STYLES, READONLY_BLOCK_EXPORT_STYLES } from './styles'

export const readonlyBlock: EditorBlockPlugin = {
  name: 'readonlyBlock',
  label: 'Read Only',
  icon: Lock,
  description: 'Non-editable content block (deletable only)',
  extension: ReadOnlyBlockExtension,
  styles: READONLY_BLOCK_STYLES,
  exportStyles: READONLY_BLOCK_EXPORT_STYLES,
  insert: (editor) => {
    editor.chain().focus().insertReadOnlyBlock({
      content: 'Read-only content goes here',
      label: 'Read Only',
    }).run()
  },
}
