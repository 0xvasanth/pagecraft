/**
 * Shared structural styles for all editor blocks.
 * Injected once when any block is registered.
 * Individual block colors/themes come from each block's own styles.
 */
export const BLOCK_BASE_STYLES = `
.s-block {
  position: relative;
  margin: 0.75em 0;
  border-radius: 6px;
  border: 1.5px solid transparent;
  transition: border-color 0.15s;
}
.s-block--selected {
  border-color: currentColor;
}
.s-block__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  border-radius: 5px 5px 0 0;
  font-size: 11px;
  font-weight: 500;
  user-select: none;
  gap: 6px;
}
.s-block__header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.s-block__footer {
  padding: 3px 10px;
  border-radius: 0 0 5px 5px;
  font-size: 10px;
  font-weight: 500;
  user-select: none;
  opacity: 0.7;
}
.s-block__body {
  padding: 8px 12px;
  min-height: 2em;
}
.s-block__expr {
  cursor: default;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.s-block__expr strong {
  font-weight: 700;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
}
.s-block__expr-edit {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.s-block__expr-kw {
  opacity: 0.7;
}
.s-block__expr-input {
  background: rgba(255,255,255,0.3);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 3px;
  padding: 0 4px;
  font-size: 11px;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
  font-weight: 700;
  color: inherit;
  outline: none;
  min-width: 3ch;
}
.s-block__expr-input:focus {
  border-color: rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.4);
}
.s-block__delete {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  display: flex;
  align-items: center;
}
.s-block__delete:hover {
  background: rgba(0,0,0,0.1);
}
.s-block:hover .s-block__delete,
.s-block--selected .s-block__delete {
  opacity: 1;
}
`
