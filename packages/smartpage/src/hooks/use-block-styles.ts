import { useEffect, useRef } from 'react'
import type { EditorBlockPlugin } from '../blocks/types'
import { BLOCK_BASE_STYLES } from '../blocks/base-styles'

/**
 * Injects block CSS styles into the document <head>.
 * Each block owns its own styles. This hook collects them all,
 * creates a single <style> element, and cleans up on unmount.
 */
export function useBlockStyles(blocks: EditorBlockPlugin[]) {
  const styleRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    if (blocks.length === 0) return

    // Combine base styles + each block's styles
    const allStyles = [
      BLOCK_BASE_STYLES,
      ...blocks.map(b => b.styles),
    ].join('\n')

    // Create or update the style element
    if (!styleRef.current) {
      styleRef.current = document.createElement('style')
      styleRef.current.setAttribute('data-smartpage-blocks', 'true')
      document.head.appendChild(styleRef.current)
    }
    styleRef.current.textContent = allStyles

    return () => {
      if (styleRef.current) {
        styleRef.current.remove()
        styleRef.current = null
      }
    }
  }, [blocks])
}
