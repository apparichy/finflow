import React, { useState } from 'react';
import { Plus, Pencil, Trash2, PlusCircle } from 'lucide-react';
import { useStore } from '../store';
import { fmtMoney, fmtDate } from '../utils';
import { Modal, IconBadge, IconPicker, ProgressBar, Empty } from '../components/ui';

const blank = () => ({ name: '', target: '', saved: 0, deadline: '', priority: 2, icon: 'PiggyBank' });
const PRIORITY = { 1: ['High', 'red'], 2: ['Medium', 'amber'], 3: ['Low', 'blue'] };

export default function Savings() {
  const { data, add, update, remove } = useStore();
  const c = data.settings.currency;
  const [editing, setEditing] = useState(null);
  const [contrib, setContrib] = useState(null); // { goal, amount }

  const save = () => {
    const f = editing.form;
    if (!f.name || !f.target) return;
    const item = { ...f, target: Number(f.target), saved: Number(f.saved || 0), priority: Number(f.priority) };
    editing.id ? update('goals', editing.id, item) : add('goals', item);
    setEditing(null);
  };
  const set = (patch) => setEditing((e) => ({ ...e, form: { ...e.form, ...patch } }));

  const addContribution = () => {
    const amt = Number(contrib.amount);
    if (!amt) return setContrib(null);
    update('goals', contrib.goal.id, { saved: Number(contrib.goal.saved || 0) + amt });
    setContrib(null);
  };

  const goals = [...data.goals].sort((a, b) => (a.priority || 2) - (b.priority || 2));
  const totalSaved = goals.reduce((s, g) => s + Number(g.saved || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target || 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Savings goals</h1>
          <p className="page-sub">{fmtMoney(totalSaved, c)} saved of {fmtMoney(totalTarget, c)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ form: blank() })}>
          <Plus size={16} /> Add goal
        </button>
      </div>

      {goals.length === 0 && <div className="card"><Empty>No savings goals yet.</Empty></div>}

      <div className="grid grid-2 stack-sm">
        {goals.map((g) => {
          const pct = g.target > 0 ? (Number(g.saved) / Number(g.target)) * 100 : 0;
          const [pLabel, pColor] = PRIORITY[g.priority] || PRIORITY[2];
          return (
            <div className="card" key={g.id} style={{ marginTop: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <IconBadge name={g.icon} color="teal" />
                <div style={{ flex: 1 }}>
                  <div className="row-title">{g.name}</div>
                  <div className="row-sub">{g.deadline ? `by ${fmtDate(g.deadline)}` : 'No deadline'}</div>
                </div>
                <span className="chip" style={{ background: `var(--${pColor}-soft)`, color: `var(--${pColor})` }}>{pLabel}</span>
              </div>
              <ProgressBar pct={pct} color="teal" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }} className="muted">
                <span>{fmtMoney(g.saved, c)} / {fmtMoney(g.target, c)}</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-sm" onClick={() => setContrib({ goal: g, amount: '' })}><PlusCircle size={14} /> Add money</button>
                <button className="btn btn-sm btn-icon" onClick={() => setEditing({ id: g.id, form: { ...g } })}><Pencil size={14} /></button>
                <button className="btn btn-sm btn-icon btn-danger" onClick={() => remove('goals', g.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit goal' : 'Add savings goal'} onClose={() => setEditing(null)}>
          <div className="form-grid">
            <div className="field">
              <label>Goal name</label>
              <input value={editing.form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Vacation" />
            </div>
            <div className="field">
              <label>Target amount</label>
              <input type="number" min="0" step="1" value={editing.form.target} onChange={(e) => set({ target: e.target.value })} placeholder="0" />
            </div>
            <div className="field">
              <label>Already saved</label>
              <input type="number" min="0" step="0.01" value={editing.form.saved} onChange={(e) => set({ saved: e.target.value })} />
            </div>
            <div className="field">
              <label>Deadline</label>
              <input type="date" value={editing.form.deadline} onChange={(e) => set({ deadline: e.target.value })} />
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={editing.form.priority} onChange={(e) => set({ priority: e.target.value })}>
                <option value={1}>High</option>
                <option value={2}>Medium</option>
                <option value={3}>Low</option>
              </select>
            </div>
          </div>
          <IconPicker set="goal" value={editing.form.icon} onChange={(icon) => set({ icon })} />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={save}>Save</button>
        </Modal>
      )}

      {contrib && (
        <Modal title={`Add money to ${contrib.goal.name}`} onClose={() => setContrib(null)}>
          <div className="field">
            <label>Amount (use a negative number to withdraw)</label>
            <input type="number" step="0.01" autoFocus value={contrib.amount}
              onChange={(e) => setContrib((x) => ({ ...x, amount: e.target.value }))} placeholder="0.00" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={addContribution}>Add</button>
        </Modal>
      )}
    </>
  );
}
