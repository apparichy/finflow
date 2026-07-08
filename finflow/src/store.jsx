import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { uid, monthKey } from './utils';

/*
  FinFlow data model (mirrors the budget spreadsheet's five groups:
  Income, Expenses, Bills, Savings, Debt — plus per-transaction detail).

  settings: { currency, theme, budgetAlertPct }
  incomes:  [{ id, source, amount, date, recurring, notes, icon }]
  expenses: [{ id, category, amount, date, method, merchant, recurring, notes, icon, receipt }]
  budgets:  [{ id, category, limit, icon }]              // monthly planned per category
  bills:    [{ id, name, amount, dueDay, frequency, icon, notes, paidMonths: ['YYYY-MM'] }]
  goals:    [{ id, name, target, saved, deadline, priority, icon }]
  debts:    [{ id, name, total, paid, minPayment, interestRate, dueDay, icon }]
*/

const LS_KEY = 'finflow-data-v1';

// Seed categories taken from the BUDGET SPREADSHEET 2025 template
export const EXPENSE_CATEGORIES = [
  'Groceries', 'Takeout', 'Restaurants', 'Household', 'Commuting', 'Fuel',
  'Gifts', 'Cosmetics', 'Online Classes', 'Entertainment', 'Shopping', 'Health', 'Other',
];
export const INCOME_SOURCES = [
  'Salary', 'Self-Employment', 'Gig Earnings', 'Investment Interest', 'Social Media', 'Bonus', 'Other',
];
export const BILL_TYPES = [
  'Housing', 'Electricity', 'Water', 'Cell Phone', 'Heating', 'Internet',
  'Spotify', 'YouTube Premium', 'Netflix', 'HBO', 'Gym', 'Insurance', 'Other',
];
export const PAYMENT_METHODS = ['Card', 'Cash', 'Bank Transfer', 'Mobile Pay', 'Other'];

const defaultData = {
  settings: { currency: '$', theme: 'dark', budgetAlertPct: 80 },
  incomes: [],
  expenses: [],
  budgets: [
    { id: uid(), category: 'Groceries', limit: 400, icon: 'ShoppingCart' },
    { id: uid(), category: 'Takeout', limit: 120, icon: 'Pizza' },
    { id: uid(), category: 'Fuel', limit: 150, icon: 'Fuel' },
    { id: uid(), category: 'Entertainment', limit: 80, icon: 'Clapperboard' },
  ],
  bills: [],
  goals: [],
  debts: [],
};

const load = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed, settings: { ...defaultData.settings, ...parsed.settings } };
  } catch {
    return defaultData;
  }
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [data, setData] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not persist data (storage full?)', e);
    }
  }, [data]);

  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.theme;
  }, [data.settings.theme]);

  // Generic CRUD over any collection key
  const api = useMemo(() => {
    const add = (key, item) =>
      setData((d) => ({ ...d, [key]: [{ id: uid(), ...item }, ...d[key]] }));
    const update = (key, id, patch) =>
      setData((d) => ({ ...d, [key]: d[key].map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
    const remove = (key, id) =>
      setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));
    const setSettings = (patch) =>
      setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
    const replaceAll = (next) =>
      setData({ ...defaultData, ...next, settings: { ...defaultData.settings, ...next.settings } });
    const togglePaid = (billId, mk = monthKey()) =>
      setData((d) => ({
        ...d,
        bills: d.bills.map((b) => {
          if (b.id !== billId) return b;
          const paid = b.paidMonths || [];
          return {
            ...b,
            paidMonths: paid.includes(mk) ? paid.filter((m) => m !== mk) : [...paid, mk],
          };
        }),
      }));
    return { add, update, remove, setSettings, replaceAll, togglePaid };
  }, []);

  // ===== Derived monthly figures (the spreadsheet's "Financial Overview") =====
  const derived = useMemo(() => {
    const mk = monthKey();
    const inMonth = (t) => monthKey(t.date) === mk;

    const monthIncome = data.incomes.filter(inMonth).reduce((s, t) => s + Number(t.amount || 0), 0);
    const monthExpenses = data.expenses.filter(inMonth).reduce((s, t) => s + Number(t.amount || 0), 0);
    const monthBillsPaid = data.bills
      .filter((b) => (b.paidMonths || []).includes(mk))
      .reduce((s, b) => s + Number(b.amount || 0), 0);
    const monthBillsDue = data.bills.reduce((s, b) => s + Number(b.amount || 0), 0);

    const totalIncome = data.incomes.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpenses = data.expenses.reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalSaved = data.goals.reduce((s, g) => s + Number(g.saved || 0), 0);
    const totalDebtPaid = data.debts.reduce((s, g) => s + Number(g.paid || 0), 0);
    const allBillsPaid = data.bills.reduce(
      (s, b) => s + (b.paidMonths || []).length * Number(b.amount || 0), 0);

    // Total balance = everything earned − everything spent/paid/saved (rollover concept)
    const totalBalance = totalIncome - totalExpenses - allBillsPaid - totalSaved - totalDebtPaid;
    const monthLeft = monthIncome - monthExpenses - monthBillsPaid;

    // Spend per budget category this month
    const spentByCategory = {};
    data.expenses.filter(inMonth).forEach((t) => {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Number(t.amount || 0);
    });

    return {
      mk, monthIncome, monthExpenses, monthBillsPaid, monthBillsDue,
      totalBalance, monthLeft, spentByCategory, totalSaved,
    };
  }, [data]);

  const value = { data, ...api, derived };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
