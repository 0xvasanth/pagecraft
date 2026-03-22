import type { Node } from '@tiptap/core'
import type { ComponentType } from 'react'

/**
 * Runtime context passed to block plugins during registration.
 * Contains editor-level state the block may need.
 */
export interface BlockContext {
  /** Available template variables in the editor */
  variables: import('../types').TemplateVariable[]
}

/**
 * Interface every editor block plugin must implement.
 *
 * A block is a self-contained plugin that provides:
 * - A TipTap Node extension (schema, commands, parsing)
 * - Its own CSS styles (injected at mount, cleaned up on unmount)
 * - Metadata for the toolbar (name, icon, description)
 * - An insert handler for the toolbar to call
 *
 * Blocks own their entire lifecycle — the editor core knows nothing
 * about block internals. It just registers the extension and shows
 * the block in the toolbar.
 */
export interface EditorBlockPlugin {
  /** Unique block name — must match the TipTap extension name */
  name: string
  /** Display label for the toolbar */
  label: string
  /** Lucide icon component for the toolbar */
  icon: ComponentType<{ className?: string }>
  /** Short description shown in toolbar tooltip */
  description?: string
  /**
   * The TipTap Node extension.
   * Can be a static extension or a factory that receives runtime context
   * (e.g., current variables list) and returns a configured extension.
   */
  extension: Node | ((ctx: BlockContext) => Node)
  /** CSS styles for this block — injected into <head> when the block is registered */
  styles: string
  /** CSS styles for PDF/preview export — included in exported HTML */
  exportStyles?: string
  /** Called when the user clicks the block in the toolbar. Should call editor commands to insert. */
  insert: (editor: import('@tiptap/react').Editor) => void
}
