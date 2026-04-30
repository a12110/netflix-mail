export const MAIL_STYLES = String.raw`
.mail-viewer-shell {
  padding: 10px 12px 16px;
  background: var(--surface);
  border-color: var(--line);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}
.mail-viewer-shell .muted { color: var(--muted); }
.mail-viewer-topbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}
.mail-viewer-topbar input {
  min-height: 34px;
  border-color: var(--line-strong);
  border-radius: var(--radius-sm);
  background: rgba(255,255,255,0.86);
  color: var(--text);
}
.mail-viewer-topbar input:focus {
  border-color: rgba(11, 116, 222, 0.72);
  box-shadow: 0 0 0 4px rgba(11, 116, 222, 0.12);
  background: #fff;
}
.mail-viewer-topbar button,
.mail-viewer-controls button,
.mail-refresh-actions button,
.mail-action-row button,
.mail-detail-nav button {
  min-height: 36px;
  border-color: var(--line-strong);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--primary);
  padding: 6px 12px;
  box-shadow: var(--shadow-sm);
}
.mail-viewer-topbar button:not(.secondary) {
  background: linear-gradient(135deg, var(--primary), #0869c9);
  border-color: var(--primary);
  color: #fff;
}
.mail-viewer-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin: 0 0 10px;
}
.mail-refresh-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  line-height: 1;
}
.toolbar > .mail-refresh-actions { min-width: fit-content; }
.mail-auto-refresh-control {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  margin: 0;
  padding: 6px 8px 6px 12px;
  border: 1px solid #cfe3ff;
  border-radius: var(--radius-sm);
  background: var(--primary-soft);
  color: var(--primary-dark);
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}
.mail-auto-refresh-control input {
  position: absolute;
  width: 1px;
  height: 1px;
  min-height: 1px;
  opacity: 0;
  pointer-events: none;
}
.mail-auto-refresh-control:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(11, 116, 222, 0.12);
}
.mail-auto-refresh-switch {
  position: relative;
  width: 32px;
  height: 20px;
  border-radius: 999px;
  background: var(--line-strong);
  transition: background 180ms ease;
}
.mail-auto-refresh-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.18);
  transition: transform 180ms ease;
}
.mail-auto-refresh-control input:checked + .mail-auto-refresh-switch {
  background: var(--primary);
}
.mail-auto-refresh-control input:checked + .mail-auto-refresh-switch::after {
  transform: translateX(12px);
}
.mail-control-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: var(--primary-soft);
  color: var(--muted-strong);
  border: 1px solid #cfe3ff;
  font-weight: 700;
}
.mail-control-chip strong { color: var(--primary); }
.mail-control-chip .visitor-count {
  font-size: inherit;
  line-height: 1;
}
.mail-pagination-controls {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.mail-pagination-controls label,
.mail-page-indicator,
.mail-page-numbers {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  margin: 0;
  color: var(--muted-strong);
  font-weight: 750;
  line-height: 1;
  white-space: nowrap;
}
.mail-page-numbers { gap: 4px; }
.mail-page-number {
  min-width: 36px;
  padding-inline: 10px;
}
.mail-page-number.active {
  background: var(--primary-soft);
  border-color: #bfdbfe;
  color: var(--primary-dark);
  box-shadow: none;
}
.mail-page-ellipsis {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  color: var(--muted);
  font-weight: 800;
  padding: 0 2px;
}
.mail-pagination-controls select {
  min-height: 36px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  padding: 6px 12px;
  background: #fff;
  color: var(--text);
}
.mail-viewer-controls button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.mail-viewer-grid {
  display: grid;
  grid-template-columns: minmax(290px, 380px) minmax(0, 1fr);
  min-height: min(780px, calc(100vh - 220px));
  border-top: 1px solid var(--line);
  align-items: stretch;
}
.mail-list-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--line);
  background: var(--surface-solid);
}
.mail-list-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  color: var(--text);
}
.mail-list-title span { color: var(--muted); font-size: 12px; }
.mail-list {
  display: grid;
  align-content: start;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  overflow: auto;
}
button.mail-list-item {
  display: grid;
  width: 100%;
  min-height: unset;
  justify-content: stretch;
  align-items: start;
  gap: 9px;
  padding: 15px 18px;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-left: 3px solid transparent;
  border-radius: 0;
  background: var(--surface-solid);
  color: var(--text);
  text-align: left;
  box-shadow: none;
}
button.mail-list-item:hover,
button.mail-list-item.selected {
  background: #eef6ff;
  color: var(--text);
  border-left-color: var(--primary);
  box-shadow: none;
}
.mail-list-tags,
.mail-meta-row,
.mail-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.mail-meta-pill {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 27px;
  padding: 2px 7px;
  border: 1px solid rgba(96, 165, 250, 0.48);
  color: var(--primary);
  background: #f7fbff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mail-meta-pill strong { color: var(--primary-dark); margin-right: 4px; }
.mail-detail-panel {
  min-width: 0;
  background: var(--surface-solid);
  color: var(--text);
}
.mail-detail-view { display: grid; gap: 16px; padding: 14px 24px 24px; }
.mail-detail-nav { display: flex; justify-content: space-between; gap: 12px; }
.mail-detail-header { display: grid; gap: 14px; padding-top: 4px; }
.mail-detail-header h2 { font-size: 20px; }
.mail-preview-stage {
  min-height: 520px;
  padding: 0;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  overflow: auto;
}
.mail-preview-stage .mail-body { max-height: none; min-height: 520px; border: 0; border-radius: 0; background: #fff; color: var(--text); }
.mail-preview-stage .mail-frame {
  min-height: min(760px, calc(100vh - 320px));
  border: 0;
  border-radius: 0;
}
.mail-list .empty-state, .mail-empty-detail { color: var(--muted); background: var(--surface); border-color: var(--line-strong); }
.mail-plain-panel {
  max-height: 420px;
  background: #fbfdff;
  border-color: var(--line);
  color: #334155;
}
.mail-empty-detail { margin: 24px; }
.email-card { display: grid; grid-template-columns: 64px minmax(0, 1.2fr) minmax(240px, 1fr) 170px; gap: 18px; align-items: center; padding: 20px 24px; margin-bottom: 14px; }
.email-body-preview { color: var(--muted-strong); }
.empty-state { padding: 32px; text-align: center; color: var(--muted); background: var(--surface); border: 1px dashed var(--line-strong); border-radius: var(--radius-md); }
.mail-body { max-height: 560px; line-height: 1.75; background: #fbfdff; }
.mail-frame { width: 100%; min-height: 680px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: #fff; }
.mail-risk { display: grid; gap: 10px; margin-bottom: 12px; padding: 14px; border: 1px solid #fed7aa; border-radius: var(--radius-sm); background: #fff7ed; color: #9a3412; }
.mail-risk button { width: fit-content; }
.advanced-info { border: 1px solid var(--line); border-radius: var(--radius-md); padding: 14px 16px; background: var(--surface-muted); }
.advanced-info summary { cursor: pointer; font-weight: 800; color: var(--primary); }
.advanced-info h3 { margin-top: 14px; }
`;
