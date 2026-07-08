import React from 'react';
import {
  LayoutDashboard, TrendingUp, ReceiptText, PieChart, CalendarClock,
  PiggyBank, CreditCard, BarChart3, Settings, Moon, Sun, Wallet,
} from 'lucide-react';
import { useStore } from '../store';

export const PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'income', label: 'Income', icon: TrendingUp },
  { id: 'expenses', label: 'Expenses', icon: ReceiptText },
  { id: 'budget', label: 'Budget', icon: PieChart },
  { id: 'bills', label: 'Bills', icon: CalendarClock },
  { id: 'savings', label: 'Savings', icon: PiggyBank },
  { id: 'debt', label: 'Debt', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const MOBILE_PAGES = ['dashboard', 'expenses', 'budget', 'bills', 'reports'];

export default function Layout({ page, setPage, children }) {
  const { data, setSettings } = useStore();
  const dark = data.settings.theme === 'dark';

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-badge"><Wallet size={18} /></div>
          FinFlow
        </div>
        {PAGES.map((p) => (
          <button
            key={p.id}
            className={`nav-item ${page === p.id ? 'active' : ''}`}
            onClick={() => setPage(p.id)}
          >
            <p.icon size={18} /> {p.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="nav-item" onClick={() => setSettings({ theme: dark ? 'light' : 'dark' })}>
          {dark ? <Sun size={18} /> : <Moon size={18} />} {dark ? 'Light mode' : 'Dark mode'}
        </button>
      </aside>

      <main className="main">{children}</main>

      <nav className="bottom-nav">
        {PAGES.filter((p) => MOBILE_PAGES.includes(p.id)).map((p) => (
          <button
            key={p.id}
            className={`nav-item ${page === p.id ? 'active' : ''}`}
            onClick={() => setPage(p.id)}
          >
            <p.icon size={20} /> {p.label}
          </button>
        ))}
        <button
          className={`nav-item ${['settings', 'income', 'savings', 'debt'].includes(page) ? 'active' : ''}`}
          onClick={() => setPage('settings')}
        >
          <Settings size={20} /> More
        </button>
      </nav>
    </div>
  );
}
