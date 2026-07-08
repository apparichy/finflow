import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { useStore } from '../store';
import { fmtMoney, lastMonths, monthKey, monthLabel, downloadCSV } from '../utils';

const PIE_COLORS = ['#8b5cf6', '#2dd4bf', '#f87171', '#fbbf24', '#60a5fa', '#34d399', '#f472b6', '#a3e635'];

export default function Reports() {
  const { data, derived } = useStore();
  const c = data.settings.currency;

  const months = lastMonths(6);

  const monthly = useMemo(() => {
    return months.map((mk) => {
      const income = data.incomes.filter((t) => monthKey(t.date) === mk).reduce((s, t) => s + Number(t.amount || 0), 0);
      const billsPaid = data.bills.filter((b) => (b.paidMonths || []).includes(mk)).reduce((s, b) => s + Number(b.amount || 0), 0);
      const expenses = data.expenses.filter((t) => monthKey(t.date) === mk).reduce((s, t) => s + Number(t.amount || 0), 0) + billsPaid;
      return { month: monthLabel(mk), Income: income, Expenses: expenses, Net: income - expenses };
    });
  }, [data, months]);

  const byCategory = useMemo(() => {
    const mk = monthKey();
    const map = {};
    data.expenses.filter((t) => monthKey(t.date) === mk).forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  const budgetPerf = data.budgets.map((b) => ({
    name: b.category,
    Planned: Number(b.limit),
    Actual: derived.spentByCategory[b.category] || 0,
  }));

  const savingsGrowth = useMemo(() => {
    // Cumulative saved across goals is a single point-in-time number locally;
    // approximate growth using contributions inferred per goal is not stored,
    // so show goal-by-goal saved vs target instead.
    return data.goals.map((g) => ({ name: g.name, Saved: Number(g.saved || 0), Target: Number(g.target || 0) }));
  }, [data]);

  const tooltipStyle = {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)',
  };

  const exportTransactions = () => {
    const rows = [
      ...data.incomes.map((t) => ({ type: 'income', name: t.source, category: '', amount: t.amount, date: t.date, method: '', recurring: t.recurring, notes: t.notes || '' })),
      ...data.expenses.map((t) => ({ type: 'expense', name: t.merchant || '', category: t.category, amount: -Math.abs(t.amount), date: t.date, method: t.method, recurring: t.recurring, notes: t.notes || '' })),
    ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    if (!rows.length) return alert('No transactions to export yet.');
    downloadCSV(rows, `finflow-transactions-${monthKey()}.csv`);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">Last 6 months of activity</p>
        </div>
        <button className="btn" onClick={exportTransactions}><Download size={16} /> Export CSV</button>
      </div>

      <div className="card">
        <h3 className="card-title">Income vs expenses</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" stroke="var(--text-dim)" fontSize={12} />
            <YAxis stroke="var(--text-dim)" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtMoney(v, c)} />
            <Legend />
            <Bar dataKey="Income" fill="#34d399" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Expenses" fill="#f87171" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-2 stack-sm section-gap">
        <div className="card" style={{ marginTop: 0 }}>
          <h3 className="card-title">This month by category</h3>
          {byCategory.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>No expenses logged this month.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtMoney(v, c)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card" style={{ marginTop: 0 }}>
          <h3 className="card-title">Net cash flow</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-dim)" fontSize={12} />
              <YAxis stroke="var(--text-dim)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtMoney(v, c)} />
              <Line type="monotone" dataKey="Net" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-2 stack-sm section-gap">
        <div className="card" style={{ marginTop: 0 }}>
          <h3 className="card-title">Budget performance (planned vs actual)</h3>
          {budgetPerf.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>Add budgets to see this chart.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={budgetPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text-dim)" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="var(--text-dim)" fontSize={12} width={90} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtMoney(v, c)} />
                <Legend />
                <Bar dataKey="Planned" fill="#60a5fa" radius={[0, 6, 6, 0]} />
                <Bar dataKey="Actual" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card" style={{ marginTop: 0 }}>
          <h3 className="card-title">Savings by goal</h3>
          {savingsGrowth.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>Add savings goals to see this chart.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={savingsGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} />
                <YAxis stroke="var(--text-dim)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtMoney(v, c)} />
                <Legend />
                <Bar dataKey="Target" fill="#334155" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Saved" fill="#2dd4bf" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}
