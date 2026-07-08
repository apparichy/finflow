import React, { useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useStore, EXPENSE_CATEGORIES } from '../store';
import { fmtMoney } from '../utils';
import { Modal, IconBadge, IconPicker, ProgressBar, Empty } from '../components/ui';

const blank = () => ({ category: 'Groceries', limit: '', icon: 'ShoppingCart' });

export default function Budget() {
  const { data, add, update, remove, derived } = useStore();
  const c = data.settings.currency;
  const alertPct = data.settings.budgetAlertPct;
  const [editing, setEditing] = useState(null);

  const save = () => {
    const f = editing.form;
    if (!f.category || !f.limit) return;
    const item = { ...f, limit: Number(f.limit) };
    editing.id ? update('budgets', editing.id, item) : add('budgets', item);
    setEditing(null);
  };
  const set = (patch) => setEditing((e) => ({ ...e, form: { ...e.form, ...patch } }));

  const budgets = data.budgets.map((b) => {
    const spent = derived.spentByCategory[b.category] || 0;
    return { ...b, spent, remaining: b.limit - spent, pct: b.limit > 0 ? (spent / b.limit) * 100 : 0 };
  });
  const totalLimit = budgets.reduce((s, b) => s + Number(b.limit), 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Budget</h1>
          <p className="page-sub">
            This month: {fmtMoney(totalSpent, c)} of {fmtMoney(totalLimit, c)} planned
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ form: blank() })}>
          <Plus size={16} /> Add budget
        </button>
      </div>

      {budgets.length === 0 && <div className="card"><Empty>No budgets yet — add a monthly limit per category.</Empty></div>}

      <div className="grid grid-2 stack-sm">
        {budgets.map((b) => (
          <div className="card" key={b.id} style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <IconBadge name={b.icon} color={b.pct >= 100 ? 'red' : b.pct >= alertPct ? 'amber' : 'accent'} />
              <div style={{ flex: 1 }}>
                <div className="row-title">{b.category}</div>
                <div className="row-sub">
                  {fmtMoney(b.spent, c)} spent · {fmtMoney(Math.max(b.remaining, 0), c)} left
                </div>
              </div>
              <button className="btn btn-icon btn-sm" onClick={() => setEditing({ id: b.id, form: { ...b } })}><Pencil size={15} /></button>
              <button className="btn btn-icon btn-sm btn-danger" onClick={() => remove('budgets', b.id)}><Trash2 size={15} /></button>
            </div>
            <ProgressBar pct={b.pct} color="auto" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12.5 }} className="muted">
              <span>{Math.round(b.pct)}% used</span>
              <span>Limit {fmtMoney(b.limit, c)}</span>
            </div>
            {b.pct >= 100 && (
              <div className="alert" style={{ background: 'var(--red-soft)', color: 'var(--red)', marginTop: 10 }}>
                <AlertTriangle size={15} /> <span style={{ color: 'var(--text)' }}>Over budget by {fmtMoney(b.spent - b.limit, c)}</span>
              </div>
            )}
            {b.pct >= alertPct && b.pct < 100 && (
              <div className="alert" style={{ background: 'var(--amber-soft)', color: 'var(--amber)', marginTop: 10 }}>
                <AlertTriangle size={15} /> <span style={{ color: 'var(--text)' }}>Close to the limit</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit budget' : 'Add budget'} onClose={() => setEditing(null)}>
          <div className="form-grid">
            <div className="field">
              <label>Category</label>
              <select value={editing.form.category} onChange={(e) => set({ category: e.target.value })}>
                {EXPENSE_CATEGORIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Monthly limit</label>
              <input type="number" min="0" step="1" value={editing.form.limit} onChange={(e) => set({ limit: e.target.value })} placeholder="0" />
            </div>
          </div>
          <IconPicker set="expense" value={editing.form.icon} onChange={(icon) => set({ icon })} />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={save}>Save</button>
        </Modal>
      )}
    </>
  );
}
