import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Check, X } from 'lucide-react'
import { clamp } from '../utils/image-utils'

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImageCropOverlayProps {
  imageWidth: number
  imageHeight: number
  onCrop: (crop: CropArea) => void
  onCancel: () => void
}

export function ImageCropOverlay({ imageWidth, imageHeight, onCrop, onCancel }: ImageCropOverlayProps) {
  const [crop, setCrop] = useState<CropArea>({
    x: imageWidth * 0.1,
    y: imageHeight * 0.1,
    width: imageWidth * 0.8,
    height: imageHeight * 0.8,
  })
  const [dragging, setDragging] = useState<string | null>(null)
  const startRef = useRef({ x: 0, y: 0, crop: { ...crop } })

  const handleMouseDown = useCallback((type: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(type)
    startRef.current = { x: e.clientX, y: e.clientY, crop: { ...crop } }
  }, [crop])

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startRef.current.x
      const dy = e.clientY - startRef.current.y
      const prev = startRef.current.crop

      if (dragging === 'move') {
        setCrop({
          x: clamp(prev.x + dx, 0, imageWidth - prev.width),
          y: clamp(prev.y + dy, 0, imageHeight - prev.height),
          width: prev.width,
          height: prev.height,
        })
      } else {
        let newX = prev.x
        let newY = prev.y
        let newW = prev.width
        let newH = prev.height

        if (dragging.includes('right')) newW = clamp(prev.width + dx, 20, imageWidth - prev.x)
        if (dragging.includes('left')) {
          newX = clamp(prev.x + dx, 0, prev.x + prev.width - 20)
          newW = prev.width - (newX - prev.x)
        }
        if (dragging.includes('bottom')) newH = clamp(prev.height + dy, 20, imageHeight - prev.y)
        if (dragging.includes('top')) {
          newY = clamp(prev.y + dy, 0, prev.y + prev.height - 20)
          newH = prev.height - (newY - prev.y)
        }

        setCrop({ x: newX, y: newY, width: newW, height: newH })
      }
    }

    const handleMouseUp = () => setDragging(null)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, imageWidth, imageHeight])

  return (
    <div className="absolute inset-0 z-20" style={{ width: imageWidth, height: imageHeight }}>
      {/* Dark overlay masks */}
      <div className="absolute bg-black/50" style={{ top: 0, left: 0, right: 0, height: crop.y }} />
      <div className="absolute bg-black/50" style={{ top: crop.y + crop.height, left: 0, right: 0, bottom: 0 }} />
      <div className="absolute bg-black/50" style={{ top: crop.y, left: 0, width: crop.x, height: crop.height }} />
      <div className="absolute bg-black/50" style={{ top: crop.y, left: crop.x + crop.width, right: 0, height: crop.height }} />

      {/* Crop area */}
      <div
        className="absolute border-2 border-white cursor-move"
        style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height }}
        onMouseDown={e => handleMouseDown('move', e)}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
        </div>
      </div>

      {/* Resize handles */}
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(pos => {
        const [v, h] = pos.split('-')
        return (
          <div
            key={pos}
            className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm z-30"
            style={{
              top: v === 'top' ? crop.y - 6 : crop.y + crop.height - 6,
              left: h === 'left' ? crop.x - 6 : crop.x + crop.width - 6,
              cursor: `${v === 'top' ? 'n' : 's'}${h === 'left' ? 'w' : 'e'}-resize`,
            }}
            onMouseDown={e => handleMouseDown(pos, e)}
          />
        )
      })}

      {/* Action buttons */}
      <div className="absolute flex gap-1" style={{ top: crop.y + crop.height + 8, left: crop.x + crop.width - 64 }}>
        <Button size="icon-xs" variant="secondary" onClick={onCancel}>
          <X className="size-3" strokeWidth={1.5} />
        </Button>
        <Button size="icon-xs" onClick={() => onCrop(crop)}>
          <Check className="size-3" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  )
}
