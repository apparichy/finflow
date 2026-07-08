import React, { useRef } from 'react';
import { Download, Upload, TrendingUp, PiggyBank, CreditCard, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { downloadJSON, monthKey } from '../utils';

const CURRENCIES = ['$', '£', '€', '¥', '₱', '฿', '₩', '₹', '₫', '₺'];

export default function Settings({ setPage }) {
  const { data, setSettings, replaceAll } = useStore();
  const fileRef = useRef();

  const backup = () => downloadJSON(data, `finflow-backup-${monthKey()}.json`);

  const restore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.settings) throw new Error('bad file');
        if (confirm('Replace all current data with this backup?')) replaceAll(parsed);
      } catch {
        alert('That does not look like a FinFlow backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const wipe = () => {
    if (confirm('Delete ALL data? Export a backup first if you want to keep anything.')) {
      replaceAll({ settings: data.settings });
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings &amp; more</h1>
          <p className="page-sub">Preferences, backups, and extra sections</p>
        </div>
      </div>

      {/* Quick links (main path to these sections on mobile) */}
      <div className="card">
        <h3 className="card-title">More sections</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setPage('income')}><TrendingUp size={16} /> Income</button>
          <button className="btn" onClick={() => setPage('savings')}><PiggyBank size={16} /> Savings goals</button>
          <button className="btn" onClick={() => setPage('debt')}><CreditCard size={16} /> Debt</button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Preferences</h3>
        <div className="form-grid">
          <div className="field">
            <label>Currency symbol</label>
            <select value={data.settings.currency} onChange={(e) => setSettings({ currency: e.target.value })}>
              {CURRENCIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Theme</label>
            <select value={data.settings.theme} onChange={(e) => setSettings({ theme: e.target.value })}>
              <option value="dark">Dark (default)</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="field">
            <label>Budget alert threshold (%)</label>
            <input type="number" min="50" max="100" value={data.settings.budgetAlertPct}
              onChange={(e) => setSettings({ budgetAlertPct: Number(e.target.value) || 80 })} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Backup &amp; data</h3>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 0 }}>
          Your data lives only in this browser. Export a backup regularly, and restore it on any device to move your data.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={backup}><Download size={16} /> Export backup (JSON)</button>
          <button className="btn" onClick={() => fileRef.current.click()}><Upload size={16} /> Restore backup</button>
          <button className="btn btn-danger" onClick={wipe}><Trash2 size={16} /> Delete all data</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={restore} />
        </div>
      </div>
    </>
  );
}
