import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useStore } from '../store';
import { fmtMoney, fmtDate, nextDueDate, daysUntil } from '../utils';
import { StatCard, ProgressBar, IconBadge, Empty } from '../components/ui';

export default function Dashboard({ setPage }) {
  const { data, derived } = useStore();
  const c = data.settings.currency;
  const { monthIncome, monthExpenses, monthBillsPaid, totalBalance, monthLeft, spentByCategory, mk } = derived;

  // Recent transactions (income + expenses merged)
  const recent = [
    ...data.expenses.map((t) => ({ ...t, kind: 'expense', title: t.merchant || t.category })),
    ...data.incomes.map((t) => ({ ...t, kind: 'income', title: t.source })),
  ]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 6);

  // Upcoming bills within 14 days, unpaid this month first
  const upcoming = data.bills
    .map((b) => ({ ...b, due: nextDueDate(b), paid: (b.paidMonths || []).includes(mk) }))
    .sort((a, b) => a.due - b.due)
    .slice(0, 5);

  // Budget usage
  const budgets = data.budgets.map((b) => {
    const spent = spentByCategory[b.category] || 0;
    return { ...b, spent, pct: b.limit > 0 ? (spent / b.limit) * 100 : 0 };
  });
  const overBudget = budgets.filter((b) => b.pct >= 100);
  const nearBudget = budgets.filter((b) => b.pct >= data.settings.budgetAlertPct && b.pct < 100);

  // Savings
  const goals = [...data.goals]
    .sort((a, b) => (a.priority || 2) - (b.priority || 2))
    .slice(0, 3);

  // Simple financial health summary
  const spendRatio = monthIncome > 0 ? (monthExpenses + monthBillsPaid) / monthIncome : null;
  let health = { color: 'blue', icon: Info, text: 'Add this month\u2019s income and expenses to see your financial health summary.' };
  if (spendRatio !== null) {
    if (spendRatio <= 0.7 && overBudget.length === 0)
      health = { color: 'green', icon: CheckCircle2, text: `Looking healthy — you\u2019ve spent ${Math.round(spendRatio * 100)}% of this month\u2019s income and every budget is on track.` };
    else if (spendRatio <= 1)
      health = { color: 'amber', icon: AlertTriangle, text: `Caution — ${Math.round(spendRatio * 100)}% of this month\u2019s income is spent${overBudget.length ? ` and ${overBudget.length} budget${overBudget.length > 1 ? 's are' : ' is'} over the limit` : ''}.` };
    else
      health = { color: 'red', icon: AlertTriangle, text: 'You\u2019ve spent more than you earned this month. Review your expenses and budgets.' };
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Your money at a glance — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="alert" style={{ background: `var(--${health.color}-soft)`, color: `var(--${health.color})`, marginBottom: 16 }}>
        <health.icon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ color: 'var(--text)' }}>{health.text}</span>
      </div>

      <div className="grid grid-4">
        <StatCard label="Total balance" value={fmtMoney(totalBalance, c)} icon="Wallet" color="accent" hint="All-time in minus out" />
        <StatCard label="Income this month" value={fmtMoney(monthIncome, c)} icon="TrendingUp" color="green" />
        <StatCard label="Spent this month" value={fmtMoney(monthExpenses + monthBillsPaid, c)} icon="CreditCard" color="red" hint={`incl. ${fmtMoney(monthBillsPaid, c)} bills`} />
        <StatCard label="Left to spend" value={fmtMoney(monthLeft, c)} icon="PiggyBank" color={monthLeft >= 0 ? 'teal' : 'red'} />
      </div>

      <div className="grid grid-2 stack-sm section-gap" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 className="card-title">Budget progress</h3>
          {(overBudget.length > 0 || nearBudget.length > 0) && (
            <div className="alert" style={{ background: 'var(--amber-soft)', color: 'var(--amber)', marginBottom: 12 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ color: 'var(--text)' }}>
                {overBudget.map((b) => b.category).concat(nearBudget.map((b) => b.category)).join(', ')}{' '}
                {overBudget.length + nearBudget.length > 1 ? 'are' : 'is'} at or near the limit.
              </span>
            </div>
          )}
          {budgets.length === 0 && <Empty>No budgets yet — set them up in the Budget tab.</Empty>}
          {budgets.slice(0, 5).map((b) => (
            <div key={b.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 5 }}>
                <span style={{ fontWeight: 600 }}>{b.category}</span>
                <span className="muted">{fmtMoney(b.spent, c)} / {fmtMoney(b.limit, c)}</span>
              </div>
              <ProgressBar pct={b.pct} color="auto" />
            </div>
          ))}
          {budgets.length > 0 && (
            <button className="btn btn-sm" onClick={() => setPage('budget')}>View all budgets</button>
          )}
        </div>

        <div className="card">
          <h3 className="card-title">Upcoming bills</h3>
          {upcoming.length === 0 && <Empty>No bills yet — add them in the Bills tab.</Empty>}
          {upcoming.map((b) => {
            const days = daysUntil(b.due);
            return (
              <div className="row" key={b.id}>
                <IconBadge name={b.icon} color={b.paid ? 'green' : days <= 3 ? 'red' : 'blue'} />
                <div className="row-main">
                  <div className="row-title">{b.name}</div>
                  <div className="row-sub">
                    {b.paid ? 'Paid this month' : days === 0 ? 'Due today' : days < 0 ? 'Overdue' : `Due in ${days} day${days > 1 ? 's' : ''}`}
                    {' · '}{b.due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="row-amount">{fmtMoney(b.amount, c)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-2 stack-sm section-gap" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 className="card-title">Recent transactions</h3>
          {recent.length === 0 && <Empty>Nothing yet — log income or an expense to get started.</Empty>}
          {recent.map((t) => (
            <div className="row" key={t.id}>
              <IconBadge name={t.icon} color={t.kind === 'income' ? 'green' : 'red'} />
              <div className="row-main">
                <div className="row-title">{t.title}</div>
                <div className="row-sub">{fmtDate(t.date)}{t.kind === 'expense' && t.category ? ` · ${t.category}` : ''}</div>
              </div>
              <div className="row-amount" style={{ color: t.kind === 'income' ? 'var(--green)' : 'var(--text)' }}>
                {t.kind === 'income' ? '+' : '−'}{fmtMoney(t.amount, c)}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="card-title">Savings progress</h3>
          {goals.length === 0 && <Empty>No goals yet — create one in the Savings tab.</Empty>}
          {goals.map((g) => {
            const pct = g.target > 0 ? (Number(g.saved) / Number(g.target)) * 100 : 0;
            return (
              <div key={g.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, marginBottom: 5 }}>
                  <span style={{ fontWeight: 600 }}>{g.name}</span>
                  <span className="muted">{fmtMoney(g.saved, c)} / {fmtMoney(g.target, c)}</span>
                </div>
                <ProgressBar pct={pct} color="teal" />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
