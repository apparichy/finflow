import React, { useState } from 'react';
import { Plus, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useStore } from '../store';
import { fmtMoney } from '../utils';
import { Modal, IconBadge, IconPicker, ProgressBar, Empty } from '../components/ui';

const blank = () => ({ name: '', total: '', paid: 0, minPayment: '', interestRate: '', dueDay: 1, icon: 'CreditCard' });

export default function Debt() {
  const { data, add, update, remove } = useStore();
  const c = data.settings.currency;
  const [editing, setEditing] = useState(null);
  const [payment, setPayment] = useState(null); // { debt, amount }

  const save = () => {
    const f = editing.form;
    if (!f.name || !f.total) return;
    const item = {
      ...f, total: Number(f.total), paid: Number(f.paid || 0),
      minPayment: Number(f.minPayment || 0), interestRate: Number(f.interestRate || 0), dueDay: Number(f.dueDay || 1),
    };
    editing.id ? update('debts', editing.id, item) : add('debts', item);
    setEditing(null);
  };
  const set = (patch) => setEditing((e) => ({ ...e, form: { ...e.form, ...patch } }));

  const addPayment = () => {
    const amt = Number(payment.amount);
    if (!amt) return setPayment(null);
    update('debts', payment.debt.id, { paid: Number(payment.debt.paid || 0) + amt });
    setPayment(null);
  };

  const debts = data.debts;
  const totalOwed = debts.reduce((s, d) => s + Math.max(Number(d.total) - Number(d.paid || 0), 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Debt</h1>
          <p className="page-sub">{fmtMoney(totalOwed, c)} still owed across {debts.length} debt{debts.length === 1 ? '' : 's'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ form: blank() })}>
          <Plus size={16} /> Add debt
        </button>
      </div>

      {debts.length === 0 && <div className="card"><Empty>No debts tracked. That's the dream — keep it that way!</Empty></div>}

      <div className="grid grid-2 stack-sm">
        {debts.map((d) => {
          const pct = d.total > 0 ? (Number(d.paid || 0) / Number(d.total)) * 100 : 0;
          const left = Math.max(Number(d.total) - Number(d.paid || 0), 0);
          return (
            <div className="card" key={d.id} style={{ marginTop: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <IconBadge name={d.icon} color="red" />
                <div style={{ flex: 1 }}>
                  <div className="row-title">{d.name}</div>
                  <div className="row-sub">
                    {d.interestRate ? `${d.interestRate}% APR · ` : ''}min {fmtMoney(d.minPayment, c)} · due day {d.dueDay}
                  </div>
                </div>
              </div>
              <ProgressBar pct={pct} color="green" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }} className="muted">
                <span>{fmtMoney(d.paid, c)} paid</span>
                <span>{fmtMoney(left, c)} left · {Math.round(pct)}%</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-sm" onClick={() => setPayment({ debt: d, amount: d.minPayment || '' })}><PlusCircle size={14} /> Log payment</button>
                <button className="btn btn-sm btn-icon" onClick={() => setEditing({ id: d.id, form: { ...d } })}><Pencil size={14} /></button>
                <button className="btn btn-sm btn-icon btn-danger" onClick={() => remove('debts', d.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit debt' : 'Add debt'} onClose={() => setEditing(null)}>
          <div className="form-grid">
            <div className="field">
              <label>Debt name</label>
              <input value={editing.form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Car loan" />
            </div>
            <div className="field">
              <label>Total owed</label>
              <input type="number" min="0" step="0.01" value={editing.form.total} onChange={(e) => set({ total: e.target.value })} placeholder="0" />
            </div>
            <div className="field">
              <label>Already paid</label>
              <input type="number" min="0" step="0.01" value={editing.form.paid} onChange={(e) => set({ paid: e.target.value })} />
            </div>
            <div className="field">
              <label>Minimum payment</label>
              <input type="number" min="0" step="0.01" value={editing.form.minPayment} onChange={(e) => set({ minPayment: e.target.value })} />
            </div>
            <div className="field">
              <label>Interest rate (% APR)</label>
              <input type="number" min="0" step="0.01" value={editing.form.interestRate} onChange={(e) => set({ interestRate: e.target.value })} />
            </div>
            <div className="field">
              <label>Due day of month</label>
              <input type="number" min="1" max="28" value={editing.form.dueDay} onChange={(e) => set({ dueDay: e.target.value })} />
            </div>
          </div>
          <IconPicker set="debt" value={editing.form.icon} onChange={(icon) => set({ icon })} />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={save}>Save</button>
        </Modal>
      )}

      {payment && (
        <Modal title={`Log payment — ${payment.debt.name}`} onClose={() => setPayment(null)}>
          <div className="field">
            <label>Payment amount</label>
            <input type="number" min="0" step="0.01" autoFocus value={payment.amount}
              onChange={(e) => setPayment((x) => ({ ...x, amount: e.target.value }))} placeholder="0.00" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={addPayment}>Log payment</button>
        </Modal>
      )}
    </>
  );
}
