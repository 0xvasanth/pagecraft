import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ImageCropOverlay } from './ImageCropOverlay'
import { cropImage } from '../utils/image-utils'
import { Crop, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { Button } from '../ui/button'

export function ImageNodeView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const { src, width, alignment } = node.attrs
  const editable = editor.isEditable
  const [isResizing, setIsResizing] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [currentWidth, setCurrentWidth] = useState<number | null>(width)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const startRef = useRef({ x: 0, width: 0 })

  const onLoad = useCallback(() => {
    if (imgRef.current) {
      setNaturalSize({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      })
      if (!currentWidth) {
        setCurrentWidth(Math.min(imgRef.current.naturalWidth, 600))
      }
    }
  }, [currentWidth])

  const startResize = useCallback((e: React.MouseEvent, _corner: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    startRef.current = { x: e.clientX, width: currentWidth || 300 }
  }, [currentWidth])

  useEffect(() => {
    if (!isResizing) return

    let latestWidth = currentWidth || 300

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startRef.current.x
      latestWidth = Math.max(100, startRef.current.width + dx)
      setCurrentWidth(latestWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      updateAttributes({ width: latestWidth })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, updateAttributes])

  const handleCrop = useCallback(async (cropArea: { x: number; y: number; width: number; height: number }) => {
    if (!imgRef.current) return
    const displayedWidth = currentWidth || imgRef.current.clientWidth
    const displayedHeight = imgRef.current.clientHeight

    const scaleX = naturalSize.width / displayedWidth
    const scaleY = naturalSize.height / displayedHeight

    const croppedSrc = await cropImage(src, {
      x: cropArea.x * scaleX,
      y: cropArea.y * scaleY,
      width: cropArea.width * scaleX,
      height: cropArea.height * scaleY,
    })
    updateAttributes({ src: croppedSrc, width: cropArea.width })
    setIsCropping(false)
  }, [src, currentWidth, naturalSize, updateAttributes])

  const justifyClass = alignment === 'left' ? 'justify-start' : alignment === 'right' ? 'justify-end' : 'justify-center'

  return (
    <NodeViewWrapper className={`flex ${justifyClass} my-2`} data-drag-handle>
      <div className="relative inline-block group">
        <img
          ref={imgRef}
          src={src}
          alt={node.attrs.alt || ''}
          style={{ width: currentWidth ? `${currentWidth}px` : 'auto' }}
          className="block max-w-full"
          draggable={false}
          onLoad={onLoad}
        />

        {selected && editable && !isCropping && (
          <>
            <div className="absolute inset-0 ring-2 ring-blue-500 ring-offset-2 rounded pointer-events-none" />

            {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(corner => (
              <div
                key={corner}
                className="absolute w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full z-10"
                style={{
                  top: corner.includes('top') ? -5 : undefined,
                  bottom: corner.includes('bottom') ? -5 : undefined,
                  left: corner.includes('left') ? -5 : undefined,
                  right: corner.includes('right') ? -5 : undefined,
                  cursor: `${corner.includes('top') ? 'n' : 's'}${corner.includes('left') ? 'w' : 'e'}-resize`,
                }}
                onMouseDown={e => startResize(e, corner)}
              />
            ))}

            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-background border border-border rounded-lg shadow-lg p-0.5 z-20">
              <Button size="icon-xs" variant="ghost" onClick={() => updateAttributes({ alignment: 'left' })} className={alignment === 'left' ? 'bg-muted' : ''}>
                <AlignLeft className="size-3" strokeWidth={1.5} />
              </Button>
              <Button size="icon-xs" variant="ghost" onClick={() => updateAttributes({ alignment: 'center' })} className={alignment === 'center' ? 'bg-muted' : ''}>
                <AlignCenter className="size-3" strokeWidth={1.5} />
              </Button>
              <Button size="icon-xs" variant="ghost" onClick={() => updateAttributes({ alignment: 'right' })} className={alignment === 'right' ? 'bg-muted' : ''}>
                <AlignRight className="size-3" strokeWidth={1.5} />
              </Button>
              <div className="w-px h-4 bg-border mx-0.5" />
              <Button size="icon-xs" variant="ghost" onClick={() => setIsCropping(true)}>
                <Crop className="size-3" strokeWidth={1.5} />
              </Button>
              <Button size="icon-xs" variant="ghost" onClick={deleteNode} className="text-destructive hover:text-destructive">
                <Trash2 className="size-3" strokeWidth={1.5} />
              </Button>
            </div>
          </>
        )}

        {isCropping && editable && imgRef.current && (
          <ImageCropOverlay
            imageWidth={imgRef.current.clientWidth}
            imageHeight={imgRef.current.clientHeight}
            onCrop={handleCrop}
            onCancel={() => setIsCropping(false)}
          />
        )}
      </div>
    </NodeViewWrapper>
  )
}
