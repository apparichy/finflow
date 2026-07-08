import React, { useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useStore, BILL_TYPES } from '../store';
import { fmtMoney, nextDueDate, daysUntil } from '../utils';
import { Modal, IconBadge, IconPicker, Empty } from '../components/ui';

const blank = () => ({ name: '', amount: '', dueDay: 1, frequency: 'monthly', icon: 'Home', notes: '', paidMonths: [] });

export default function Bills() {
  const { data, add, update, remove, togglePaid, derived } = useStore();
  const c = data.settings.currency;
  const mk = derived.mk;
  const [editing, setEditing] = useState(null);

  const save = () => {
    const f = editing.form;
    if (!f.name || !f.amount) return;
    const item = { ...f, amount: Number(f.amount), dueDay: Number(f.dueDay) };
    editing.id ? update('bills', editing.id, item) : add('bills', item);
    setEditing(null);
  };
  const set = (patch) => setEditing((e) => ({ ...e, form: { ...e.form, ...patch } }));

  const bills = data.bills
    .map((b) => ({ ...b, due: nextDueDate(b), paid: (b.paidMonths || []).includes(mk) }))
    .sort((a, b) => a.paid - b.paid || a.due - b.due);

  const dueSoon = bills.filter((b) => !b.paid && daysUntil(b.due) <= 3);
  const monthTotal = bills.reduce((s, b) => s + Number(b.amount || 0), 0);
  const paidTotal = bills.filter((b) => b.paid).reduce((s, b) => s + Number(b.amount || 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Bills &amp; subscriptions</h1>
          <p className="page-sub">{fmtMoney(paidTotal, c)} paid of {fmtMoney(monthTotal, c)} this month</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ form: blank() })}>
          <Plus size={16} /> Add bill
        </button>
      </div>

      {dueSoon.length > 0 && (
        <div className="alert" style={{ background: 'var(--red-soft)', color: 'var(--red)', marginBottom: 16 }}>
          <span style={{ color: 'var(--text)' }}>
            <strong>Reminder:</strong> {dueSoon.map((b) => b.name).join(', ')} {dueSoon.length > 1 ? 'are' : 'is'} due within 3 days.
          </span>
        </div>
      )}

      <div className="card">
        {bills.length === 0 && <Empty>No bills or subscriptions yet.</Empty>}
        {bills.map((b) => {
          const days = daysUntil(b.due);
          return (
            <div className="row" key={b.id} style={{ opacity: b.paid ? 0.65 : 1 }}>
              <button className="btn btn-icon btn-sm" style={{ border: 'none', background: 'none', color: b.paid ? 'var(--green)' : 'var(--text-dim)' }}
                onClick={() => togglePaid(b.id)} title={b.paid ? 'Mark unpaid' : 'Mark paid'}>
                {b.paid ? <CheckCircle2 size={22} /> : <Circle size={22} />}
              </button>
              <IconBadge name={b.icon} color={b.paid ? 'green' : days <= 3 ? 'red' : 'blue'} />
              <div className="row-main">
                <div className="row-title">{b.name}</div>
                <div className="row-sub">
                  {b.frequency} · {b.paid ? 'paid this month' : days === 0 ? 'due today' : days < 0 ? 'overdue' : `due ${b.due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </div>
              </div>
              <div className="row-amount">{fmtMoney(b.amount, c)}</div>
              <button className="btn btn-icon btn-sm" onClick={() => setEditing({ id: b.id, form: { ...b } })}><Pencil size={15} /></button>
              <button className="btn btn-icon btn-sm btn-danger" onClick={() => remove('bills', b.id)}><Trash2 size={15} /></button>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit bill' : 'Add bill'} onClose={() => setEditing(null)}>
          <div className="form-grid">
            <div className="field">
              <label>Bill name</label>
              <input value={editing.form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Rent, Netflix" list="bill-types" />
              <datalist id="bill-types">{BILL_TYPES.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="field">
              <label>Amount</label>
              <input type="number" min="0" step="0.01" value={editing.form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="field">
              <label>Due day of month</label>
              <input type="number" min="1" max="28" value={editing.form.dueDay} onChange={(e) => set({ dueDay: e.target.value })} />
            </div>
            <div className="field">
              <label>Schedule</label>
              <select value={editing.form.frequency} onChange={(e) => set({ frequency: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Notes</label>
            <input value={editing.form.notes || ''} onChange={(e) => set({ notes: e.target.value })} placeholder="Optional" />
          </div>
          <IconPicker set="bill" value={editing.form.icon} onChange={(icon) => set({ icon })} />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={save}>Save</button>
        </Modal>
      )}
    </>
  );
}
