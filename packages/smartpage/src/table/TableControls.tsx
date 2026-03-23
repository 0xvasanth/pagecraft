import { useEffect, useState, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { Plus, X, Trash2 } from 'lucide-react'

interface TablePos {
  top: number
  left: number
}

interface RowInfo {
  top: number
  height: number
  right: number
}

interface ColInfo {
  left: number
  width: number
  bottom: number
}

interface TableControlsProps {
  editor: Editor
}

// How close the cursor needs to be to an edge to show controls (px)
const EDGE_THRESHOLD = 50

export function TableControls({ editor }: TableControlsProps) {
  const [rows, setRows] = useState<RowInfo[]>([])
  const [cols, setCols] = useState<ColInfo[]>([])
  const [tablePos, setTablePos] = useState<TablePos | null>(null)
  const [hoveredTable, setHoveredTable] = useState<HTMLTableElement | null>(null)
  const [activeRow, setActiveRow] = useState(-1)
  const [activeCol, setActiveCol] = useState(-1)
  const [showDeleteTable, setShowDeleteTable] = useState(false)
  const interacting = useRef(false)

  // Measure table rows and columns
  const updatePositions = useCallback(() => {
    if (!editor.isEditable || !hoveredTable) {
      setRows([])
      setCols([])
      setTablePos(null)
      return
    }

    const pagesContainer = hoveredTable.closest('.editor-pages-container')
    if (!pagesContainer) return

    const containerRect = pagesContainer.getBoundingClientRect()
    const tRect = hoveredTable.getBoundingClientRect()

    const tableRight = tRect.right - containerRect.left
    const tableBottom = tRect.bottom - containerRect.top
    const tableTop = tRect.top - containerRect.top
    const tableLeft = tRect.left - containerRect.left

    setTablePos({ top: tableTop, left: tableLeft })

    const trs = hoveredTable.querySelectorAll('tr')
    const rowInfos: RowInfo[] = []
    trs.forEach(tr => {
      const r = tr.getBoundingClientRect()
      rowInfos.push({
        top: r.top - containerRect.top,
        height: r.height,
        right: tableRight,
      })
    })
    setRows(rowInfos)

    const firstRow = trs[0]
    if (!firstRow) { setCols([]); return }
    const cells = firstRow.querySelectorAll('td, th')
    const colInfos: ColInfo[] = []
    cells.forEach(cell => {
      const r = cell.getBoundingClientRect()
      colInfos.push({
        left: r.left - containerRect.left,
        width: r.width,
        bottom: tableBottom,
      })
    })
    setCols(colInfos)
  }, [editor, hoveredTable])

  // Track mouse to find hovered table, specific row/col, and edge proximity
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // If interacting with a control button, keep current state
      if (target.closest('.table-control') || interacting.current) return

      const table = target.closest('table') as HTMLTableElement | null

      if (table !== hoveredTable) {
        setHoveredTable(table)
        setActiveRow(-1)
        setActiveCol(-1)
      }

      if (!table) {
        setActiveRow(-1)
        setActiveCol(-1)
        setShowDeleteTable(false)
        return
      }

      const tRect = table.getBoundingClientRect()

      // Top-left corner — show delete table button
      const distToLeft = Math.abs(e.clientX - tRect.left)
      const distToTop = Math.abs(e.clientY - tRect.top)
      setShowDeleteTable(distToLeft < EDGE_THRESHOLD && distToTop < EDGE_THRESHOLD)

      // Right edge — find which row the cursor is on
      const distToRight = Math.abs(e.clientX - tRect.right)
      if (distToRight < EDGE_THRESHOLD) {
        const trs = table.querySelectorAll('tr')
        let foundRow = -1
        trs.forEach((tr, i) => {
          const r = tr.getBoundingClientRect()
          if (e.clientY >= r.top && e.clientY <= r.bottom) foundRow = i
        })
        setActiveRow(foundRow)
      } else {
        setActiveRow(-1)
      }

      // Bottom edge — find which column the cursor is on
      const distToBottom = Math.abs(e.clientY - tRect.bottom)
      if (distToBottom < EDGE_THRESHOLD) {
        const firstRow = table.querySelector('tr')
        if (firstRow) {
          const cells = firstRow.querySelectorAll('td, th')
          let foundCol = -1
          cells.forEach((cell, i) => {
            const r = cell.getBoundingClientRect()
            if (e.clientX >= r.left && e.clientX <= r.right) foundCol = i
          })
          setActiveCol(foundCol)
        }
      } else {
        setActiveCol(-1)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [hoveredTable])

  // Recalculate positions on changes
  useEffect(() => {
    let canvas: Element | null = null
    const onScroll = () => updatePositions()

    try {
      updatePositions()
      canvas = editor.view.dom.closest('.editor-canvas')
      canvas?.addEventListener('scroll', onScroll, { passive: true })
    } catch {
      // Editor view not available yet — will be picked up on next update
    }

    editor.on('update', updatePositions)

    return () => {
      canvas?.removeEventListener('scroll', onScroll)
      editor.off('update', updatePositions)
    }
  }, [editor, updatePositions])

  // Focus a cell before running a command
  const focusCellAt = useCallback((rowIdx: number, colIdx: number) => {
    if (!hoveredTable) return
    const tr = hoveredTable.querySelectorAll('tr')[rowIdx]
    if (!tr) return
    const cell = tr.querySelectorAll('td, th')[colIdx] as HTMLElement
    if (!cell) return
    try {
      const pos = editor.view.posAtDOM(cell, 0)
      editor.chain().focus(pos).run()
    } catch {
      // View not available
    }
  }, [editor, hoveredTable])

  const handleRowAction = useCallback((rowIdx: number, action: 'add' | 'delete') => {
    interacting.current = true
    focusCellAt(rowIdx, 0)
    setTimeout(() => {
      if (action === 'add') editor.chain().addRowAfter().run()
      else editor.chain().deleteRow().run()
      interacting.current = false
    }, 0)
  }, [editor, focusCellAt])

  const handleDeleteTable = useCallback(() => {
    interacting.current = true
    focusCellAt(0, 0)
    setTimeout(() => {
      editor.chain().deleteTable().run()
      setHoveredTable(null)
      interacting.current = false
    }, 0)
  }, [editor, focusCellAt])

  const handleColAction = useCallback((colIdx: number, action: 'add' | 'delete') => {
    interacting.current = true
    focusCellAt(0, colIdx)
    setTimeout(() => {
      if (action === 'add') editor.chain().addColumnAfter().run()
      else editor.chain().deleteColumn().run()
      interacting.current = false
    }, 0)
  }, [editor, focusCellAt])

  if (rows.length === 0 && cols.length === 0) return null

  return (
    <div className="table-controls">
      {/* Delete table button — top-left corner */}
      {showDeleteTable && tablePos && (
        <div
          className="table-control table-control--delete-table table-control--visible"
          style={{
            position: 'absolute',
            top: tablePos.top - 10,
            left: tablePos.left - 10,
            zIndex: 20,
          }}
        >
          <button
            className="table-control__btn table-control__btn--delete-table"
            onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); handleDeleteTable() }}
            title="Delete table"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}

      {/* Single row control — only for the hovered row */}
      {activeRow >= 0 && activeRow < rows.length && (() => {
        const row = rows[activeRow]
        return (
          <div
            className="table-control table-control--row table-control--visible"
            style={{
              position: 'absolute',
              top: row.top + (row.height / 2) - 10,
              left: row.right - 10,
              zIndex: 20,
            }}
          >
            <button
              className="table-control__btn table-control__btn--add"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
              onClick={e => { e.preventDefault(); e.stopPropagation(); handleRowAction(activeRow, 'add') }}
              title="Add row below"
            >
              <Plus className="size-3" strokeWidth={1.5} style={{ width: 12, height: 12 }} />
            </button>
            <button
              className="table-control__btn table-control__btn--delete"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
              onClick={e => { e.preventDefault(); e.stopPropagation(); handleRowAction(activeRow, 'delete') }}
              title="Delete row"
            >
              <X className="size-3" strokeWidth={1.5} style={{ width: 12, height: 12 }} />
            </button>
          </div>
        )
      })()}

      {/* Single column control — only for the hovered column */}
      {activeCol >= 0 && activeCol < cols.length && (() => {
        const col = cols[activeCol]
        return (
          <div
            className="table-control table-control--col table-control--visible"
            style={{
              position: 'absolute',
              top: col.bottom - 10,
              left: col.left + (col.width / 2) - 21,
              zIndex: 20,
            }}
          >
            <button
              className="table-control__btn table-control__btn--add"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
              onClick={e => { e.preventDefault(); e.stopPropagation(); handleColAction(activeCol, 'add') }}
              title="Add column right"
            >
              <Plus className="size-3" strokeWidth={1.5} style={{ width: 12, height: 12 }} />
            </button>
            <button
              className="table-control__btn table-control__btn--delete"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
              onClick={e => { e.preventDefault(); e.stopPropagation(); handleColAction(activeCol, 'delete') }}
              title="Delete column"
            >
              <X className="size-3" strokeWidth={1.5} style={{ width: 12, height: 12 }} />
            </button>
          </div>
        )
      })()}
    </div>
  )
}
