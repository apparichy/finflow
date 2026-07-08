import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStore, INCOME_SOURCES } from '../store';
import { fmtMoney, fmtDate, todayISO } from '../utils';
import { Modal, IconBadge, IconPicker, Empty } from '../components/ui';

const blank = () => ({
  source: 'Salary', amount: '', date: todayISO(), recurring: false, notes: '', icon: 'Briefcase',
});

export default function Income() {
  const { data, add, update, remove } = useStore();
  const c = data.settings.currency;
  const [editing, setEditing] = useState(null); // null | {form, id?}

  const save = () => {
    const f = editing.form;
    if (!f.source || !f.amount) return;
    const item = { ...f, amount: Number(f.amount) };
    editing.id ? update('incomes', editing.id, item) : add('incomes', item);
    setEditing(null);
  };

  const set = (patch) => setEditing((e) => ({ ...e, form: { ...e.form, ...patch } }));
  const items = [...data.incomes].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const total = items.reduce((s, t) => s + Number(t.amount || 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Income</h1>
          <p className="page-sub">{fmtMoney(total, c)} recorded all-time</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ form: blank() })}>
          <Plus size={16} /> Add income
        </button>
      </div>

      <div className="card">
        {items.length === 0 && <Empty>No income logged yet.</Empty>}
        {items.map((t) => (
          <div className="row" key={t.id}>
            <IconBadge name={t.icon} color="green" />
            <div className="row-main">
              <div className="row-title">{t.source}</div>
              <div className="row-sub">
                {fmtDate(t.date)}{t.recurring ? ' · recurring' : ''}{t.notes ? ` · ${t.notes}` : ''}
              </div>
            </div>
            <div className="row-amount" style={{ color: 'var(--green)' }}>+{fmtMoney(t.amount, c)}</div>
            <button className="btn btn-icon btn-sm" onClick={() => setEditing({ id: t.id, form: { ...t } })}><Pencil size={15} /></button>
            <button className="btn btn-icon btn-sm btn-danger" onClick={() => remove('incomes', t.id)}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit income' : 'Add income'} onClose={() => setEditing(null)}>
          <div className="form-grid">
            <div className="field">
              <label>Source</label>
              <select value={editing.form.source} onChange={(e) => set({ source: e.target.value })}>
                {INCOME_SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Amount</label>
              <input type="number" min="0" step="0.01" value={editing.form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Date received</label>
              <input type="date" value={editing.form.date} onChange={(e) => set({ date: e.target.value })} />
            </div>
            <div className="field">
              <label>Type</label>
              <select value={editing.form.recurring ? 'recurring' : 'one-time'} onChange={(e) => set({ recurring: e.target.value === 'recurring' })}>
                <option value="one-time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Notes</label>
            <input value={editing.form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Optional" />
          </div>
          <IconPicker set="income" value={editing.form.icon} onChange={(icon) => set({ icon })} />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={save}>Save</button>
        </Modal>
      )}
    </>
  );
}
