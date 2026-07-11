import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { monthKey } from './utils';

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

const COLLECTIONS = ['incomes', 'expenses', 'budgets', 'bills', 'goals', 'debts'];
const emptyData = { incomes: [], expenses: [], budgets: [], bills: [], goals: [], debts: [] };

// camelCase (app) <-> snake_case (database)
const SPECIAL = { budgets: { limit: 'limit_amount' } };
const toSnake = (k) => k.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
const toCamel = (k) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const toRow = (table, item) => {
    const out = {};
    for (const [k, v] of Object.entries(item)) {
          if (k === 'createdAt' || k === 'userId' || k === 'due') continue;
          if (table === 'bills' && k === 'paid') continue;
          const col = SPECIAL[table]?.[k] || toSnake(k);
          out[col] = v === '' && ['date', 'deadline'].includes(col) ? null : v;
    }
    return out;
};

const fromRow = (table, row) => {
    const out = {};
    const special = Object.entries(SPECIAL[table] || {});
    for (const [col, v] of Object.entries(row)) {
          if (col === 'user_id' || col === 'created_at') continue;
          const specialKey = special.find(([, c]) => c === col)?.[0];
          out[specialKey || toCamel(col)] = v ?? (['date', 'deadline'].includes(col) ? '' : v);
    }
    if (table === 'bills') out.paidMonths = out.paidMonths || [];
    if ('notes' in out && out.notes == null) out.notes = '';
    if ('date' in out && out.date == null) out.date = '';
    if ('deadline' in out && out.deadline == null) out.deadline = '';
    return out;
};

// Local (per-device) settings
const SETTINGS_KEY = 'finflow-settings-v1';
const defaultSettings = { currency: '$', theme: 'dark', budgetAlertPct: 80 };
const loadSettings = () => {
    try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
    catch { return defaultSettings; }
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
    const [session, setSession] = useState(undefined);
    const [cloud, setCloud] = useState(emptyData);
    const [loading, setLoading] = useState(false);
    const [settings, setSettingsState] = useState(loadSettings);

  useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
        return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        document.documentElement.dataset.theme = settings.theme;
  }, [settings]);

  const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
                const results = await Promise.all(
                          COLLECTIONS.map((t) =>
                                      supabase.from(t).select('*').order('created_at', { ascending: false })
                                                  )
                        );
                const next = {};
                COLLECTIONS.forEach((t, i) => {
                          if (results[i].error) throw results[i].error;
                          next[t] = (results[i].data || []).map((r) => fromRow(t, r));
                });
                setCloud(next);
        } catch (err) {
                console.error('Fetch failed', err);
                alert('Could not load your data: ' + (err.message || 'unknown error'));
        } finally {
                setLoading(false);
        }
  }, []);

  useEffect(() => {
        if (session) fetchAll();
        else setCloud(emptyData);
  }, [session?.user?.id]);

  const api = useMemo(() => {
        const fail = (err) => {
                console.error(err);
                alert('Sync error: ' + (err.message || 'could not save. Check your connection.'));
                fetchAll();
        };

                          const add = async (table, item) => {
                                  const id = crypto.randomUUID();
                                  const withId = { id, ...item };
                                  setCloud((d) => ({ ...d, [table]: [withId, ...d[table]] }));
                                  const { error } = await supabase.from(table).insert(toRow(table, withId));
                                  if (error) fail(error);
                          };

                          const update = async (table, id, patch) => {
                                  setCloud((d) => ({ ...d, [table]: d[table].map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
                                  const { error } = await supabase.from(table).update(toRow(table, patch)).eq('id', id);
                                  if (error) fail(error);
                          };

                          const remove = async (table, id) => {
                                  setCloud((d) => ({ ...d, [table]: d[table].filter((x) => x.id !== id) }));
                                  const { error } = await supabase.from(table).delete().eq('id', id);
                                  if (error) fail(error);
                          };

                          const togglePaid = async (billId, mk = monthKey()) => {
                                  let nextMonths;
                                  setCloud((d) => ({
                                            ...d,
                                            bills: d.bills.map((b) => {
                                                        if (b.id !== billId) return b;
                                                        const paid = b.paidMonths || [];
                                                        nextMonths = paid.includes(mk) ? paid.filter((m) => m !== mk) : [...paid, mk];
                                                        return { ...b, paidMonths: nextMonths };
                                            }),
                                  }));
                                  const { error } = await supabase.from('bills').update({ paid_months: nextMonths }).eq('id', billId);
                                  if (error) fail(error);
                          };

                          const setSettings = (patch) => setSettingsState((s) => ({ ...s, ...patch }));

                          const wipeCloud = async () => {
                                  for (const t of COLLECTIONS) {
                                            const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                                            if (error) return fail(error);
                                  }
                                  setCloud(emptyData);
                          };

                          const bulkInsert = async (obj) => {
                                  for (const t of COLLECTIONS) {
                                            const items = (obj[t] || []).map((item) => {
                                                        const { id, ...rest } = item;
                                                        return toRow(t, rest);
                                            });
                                            if (!items.length) continue;
                                            const { error } = await supabase.from(t).insert(items);
                                            if (error) return fail(error);
                                  }
                                  await fetchAll();
                          };

                          const importLocalData = async () => {
                                  try {
                                            const raw = localStorage.getItem('finflow-data-v1');
                                            if (!raw) { alert('No local FinFlow data found on this device.'); return; }
                                            const parsed = JSON.parse(raw);
                                            const counts = COLLECTIONS.map((t) => (parsed[t] || []).length).reduce((a, b) => a + b, 0);
                                            if (!counts) { alert('Local data is empty - nothing to import.'); return; }
                                            if (!confirm(`Found ${counts} items saved on this device. Upload them to your cloud account?`)) return;
                                            await bulkInsert(parsed);
                                            alert('Imported! Your local data is now in the cloud.');
                                  } catch (e) {
                                            alert('Import failed: ' + e.message);
                                  }
                          };

                          const signOut = () => supabase.auth.signOut();

                          return { add, update, remove, togglePaid, setSettings, wipeCloud, bulkInsert, importLocalData, signOut, refetch: fetchAll };
  }, [fetchAll]);

  const derived = useMemo(() => {
        const mk = monthKey();
        const inMonth = (t) => t.date && monthKey(t.date) === mk;

                              const monthIncome = cloud.incomes.filter(inMonth).reduce((s, t) => s + Number(t.amount || 0), 0);
        const monthExpenses = cloud.expenses.filter(inMonth).reduce((s, t) => s + Number(t.amount || 0), 0);
        const monthBillsPaid = cloud.bills
          .filter((b) => (b.paidMonths || []).includes(mk))
          .reduce((s, b) => s + Number(b.amount || 0), 0);
        const monthBillsDue = cloud.bills.reduce((s, b) => s + Number(b.amount || 0), 0);

                              const totalIncome = cloud.incomes.reduce((s, t) => s + Number(t.amount || 0), 0);
        const totalExpenses = cloud.expenses.reduce((s, t) => s + Number(t.amount || 0), 0);
        const totalSaved = cloud.goals.reduce((s, g) => s + Number(g.saved || 0), 0);
        const totalDebtPaid = cloud.debts.reduce((s, g) => s + Number(g.paid || 0), 0);
        const allBillsPaid = cloud.bills.reduce(
                (s, b) => s + (b.paidMonths || []).length * Number(b.amount || 0), 0);

                              const totalBalance = totalIncome - totalExpenses - allBillsPaid - totalSaved - totalDebtPaid;
        const monthLeft = monthIncome - monthExpenses - monthBillsPaid;

                              const spentByCategory = {};
        cloud.expenses.filter(inMonth).forEach((t) => {
                spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Number(t.amount || 0);
        });

                              return {
                                      mk, monthIncome, monthExpenses, monthBillsPaid, monthBillsDue,
                                      totalBalance, monthLeft, spentByCategory, totalSaved,
                              };
  }, [cloud]);

  const value = {
        data: { settings, ...cloud },
        session, loading,
        ...api,
        derived,
  };
          return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
