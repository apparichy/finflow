import React, { useState } from 'react';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Budget from './pages/Budget';
import Bills from './pages/Bills';
import Savings from './pages/Savings';
import Debt from './pages/Debt';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { useStore } from './store';

export default function App() {
    const [page, setPage] = useState('dashboard');
    const { session, loading } = useStore();

  if (session === undefined) {
            return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }} className="muted">Loading...</div>;
  }
    if (!session) return <Auth />;

  const pages = {
        dashboard: <Dashboard setPage={setPage} />,
        income: <Income />,
        expenses: <Expenses />,
        budget: <Budget />,
        bills: <Bills />,
        savings: <Savings />,
        debt: <Debt />,
        reports: <Reports />,
        settings: <Settings setPage={setPage} />,
  };

  return (
        <Layout page={page} setPage={setPage}>
          {loading ? <div className="empty">Syncing your data...</div> : pages[page]}
        </Layout>
      );
}

          
