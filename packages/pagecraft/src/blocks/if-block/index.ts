import { GitBranch } from 'lucide-react'
import type { EditorBlockPlugin } from '../types'
import { IfBlockExtension } from './extension'
import { IF_BLOCK_STYLES, IF_BLOCK_EXPORT_STYLES } from './styles'

export const ifBlock: EditorBlockPlugin = {
  name: 'ifBlock',
  label: 'If Condition',
  icon: GitBranch,
  description: 'Show content only when a condition is true',
  extension: IfBlockExtension,
  styles: IF_BLOCK_STYLES,
  exportStyles: IF_BLOCK_EXPORT_STYLES,
  insert: (editor) => {
    editor.chain().focus().insertIfBlock({ condition: 'condition' }).run()
  },
}
