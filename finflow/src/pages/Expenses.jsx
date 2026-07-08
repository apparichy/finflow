import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Paperclip } from 'lucide-react';
import { useStore, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../store';
import { fmtMoney, fmtDate, todayISO, fileToDataURL } from '../utils';
import { Modal, IconBadge, IconPicker, Empty } from '../components/ui';

const blank = () => ({
  category: 'Groceries', amount: '', date: todayISO(), method: 'Card',
  merchant: '', recurring: false, notes: '', icon: 'ShoppingCart', receipt: null,
});

export default function Expenses() {
  const { data, add, update, remove } = useStore();
  const c = data.settings.currency;
  const [editing, setEditing] = useState(null);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [filter, setFilter] = useState('All');

  const save = () => {
    const f = editing.form;
    if (!f.amount) return;
    const item = { ...f, amount: Number(f.amount) };
    editing.id ? update('expenses', editing.id, item) : add('expenses', item);
    setEditing(null);
  };
  const set = (patch) => setEditing((e) => ({ ...e, form: { ...e.form, ...patch } }));

  const onReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataURL(file);
      set({ receipt: dataUrl });
    } catch {
      alert('Could not read that image.');
    }
  };

  const items = [...data.expenses]
    .filter((t) => filter === 'All' || t.category === filter)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const total = items.reduce((s, t) => s + Number(t.amount || 0), 0);
  const categories = ['All', ...new Set([...EXPENSE_CATEGORIES, ...data.expenses.map((t) => t.category)])];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-sub">{fmtMoney(total, c)} shown</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="btn" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ paddingRight: 28 }}>
            {categories.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setEditing({ form: blank() })}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="card">
        {items.length === 0 && <Empty>No expenses logged{filter !== 'All' ? ' in this category' : ''} yet.</Empty>}
        {items.map((t) => (
          <div className="row" key={t.id}>
            <IconBadge name={t.icon} color="red" />
            <div className="row-main">
              <div className="row-title">{t.merchant || t.category}</div>
              <div className="row-sub">
                {fmtDate(t.date)} · {t.category} · {t.method}{t.recurring ? ' · recurring' : ''}
              </div>
            </div>
            {t.receipt && (
              <img src={t.receipt} alt="Receipt" className="receipt-thumb" onClick={() => setViewReceipt(t.receipt)} />
            )}
            <div className="row-amount">−{fmtMoney(t.amount, c)}</div>
            <button className="btn btn-icon btn-sm" onClick={() => setEditing({ id: t.id, form: { ...t } })}><Pencil size={15} /></button>
            <button className="btn btn-icon btn-sm btn-danger" onClick={() => remove('expenses', t.id)}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit expense' : 'Add expense'} onClose={() => setEditing(null)}>
          <div className="form-grid">
            <div className="field">
              <label>Category</label>
              <select value={editing.form.category} onChange={(e) => set({ category: e.target.value })}>
                {EXPENSE_CATEGORIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Amount</label>
              <input type="number" min="0" step="0.01" value={editing.form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={editing.form.date} onChange={(e) => set({ date: e.target.value })} />
            </div>
            <div className="field">
              <label>Payment method</label>
              <select value={editing.form.method} onChange={(e) => set({ method: e.target.value })}>
                {PAYMENT_METHODS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Merchant / name</label>
              <input value={editing.form.merchant} onChange={(e) => set({ merchant: e.target.value })} placeholder="e.g. Walmart" />
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
          <div className="field">
            <label><Paperclip size={12} style={{ verticalAlign: -2 }} /> Receipt (photo)</label>
            <input type="file" accept="image/*" onChange={onReceipt} />
            {editing.form.receipt && <img src={editing.form.receipt} alt="Receipt preview" style={{ maxWidth: 120, borderRadius: 8, marginTop: 6 }} />}
          </div>
          <IconPicker set="expense" value={editing.form.icon} onChange={(icon) => set({ icon })} />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={save}>Save</button>
        </Modal>
      )}

      {viewReceipt && (
        <Modal title="Receipt" onClose={() => setViewReceipt(null)}>
          <img src={viewReceipt} alt="Receipt" style={{ width: '100%', borderRadius: 12 }} />
        </Modal>
      )}
    </>
  );
}
