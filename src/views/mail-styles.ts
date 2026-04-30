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
.mail-action-row button,
.mail-detail-nav button {
  min-height: 32px;
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
.mail-control-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: var(--primary-soft);
  color: var(--muted-strong);
  border: 1px solid #cfe3ff;
  font-weight: 700;
}
.mail-control-chip strong { color: var(--primary); }
.mail-viewer-grid {
  display: grid;
  grid-template-columns: minmax(290px, 380px) minmax(0, 1fr);
  min-height: min(780px, calc(100vh - 220px));
  border-top: 1px solid var(--line);
}
.mail-list-panel {
  min-width: 0;
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
  max-height: min(730px, calc(100vh - 260px));
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
