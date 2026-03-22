export const FOR_BLOCK_STYLES = `
.s-block--for { color: #1d4ed8; }
.s-block--for__header { background: #dbeafe; color: #1e40af; }
.s-block--for__footer { background: #dbeafe; color: #1e40af; }
.s-block--for .s-block__body {
  background: #f0f7ff;
  border-left: 2px solid #93c5fd;
  border-right: 2px solid #93c5fd;
}

/* Variable picker */
.s-block__var-picker-wrap {
  position: relative;
  display: inline-flex;
}
.s-block__var-picker-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: rgba(255,255,255,0.3);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 3px;
  padding: 0 6px 0 4px;
  font-size: 11px;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
  font-weight: 700;
  color: inherit;
  cursor: pointer;
  min-width: 3ch;
  line-height: 1.6;
}
.s-block__var-picker-btn:hover {
  background: rgba(255,255,255,0.5);
}
.s-block__var-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 160px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
  padding: 4px;
}
.s-block__var-picker-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 4px 8px;
  font-size: 12px;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
  color: #374151;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.s-block__var-picker-item:hover {
  background: #dbeafe;
  color: #1e40af;
}
.s-block__var-picker-item.active {
  background: #bfdbfe;
  color: #1e40af;
  font-weight: 600;
}
.s-block__var-picker-empty {
  padding: 8px;
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
}
.s-block__var-picker-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}
.s-block__var-picker-custom {
  padding: 4px;
}
.s-block__var-picker-custom .s-block__expr-input {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
  width: 100%;
  padding: 2px 6px;
}

/* Done button */
.s-block__expr-done {
  background: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.6);
  border-radius: 3px;
  padding: 0 8px;
  font-size: 10px;
  color: inherit;
  cursor: pointer;
  margin-left: 4px;
  line-height: 1.6;
}
.s-block__expr-done:hover {
  background: rgba(255,255,255,0.6);
}
`

export const FOR_BLOCK_EXPORT_STYLES = `
div[data-block-for] {
  border-left: 3px solid #93c5fd;
  padding-left: 12px;
  margin: 0.5em 0;
}
`
