import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Budget from './pages/Budget';
import Bills from './pages/Bills';
import Savings from './pages/Savings';
import Debt from './pages/Debt';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  const [page, setPage] = useState('dashboard');

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
      {pages[page]}
    </Layout>
  );
}
