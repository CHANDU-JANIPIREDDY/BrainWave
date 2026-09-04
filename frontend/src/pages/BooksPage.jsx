import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchBooksInvoices } from '../services/zohoApi.js';
import ServicePage from '../components/ServicePage.jsx';
import DataTable from '../components/DataTable.jsx';
import StatCard from '../components/StatCard.jsx';
import { IconRefresh } from '../components/icons.jsx';
import { countMatching, formatDate } from '../utils/format.js';

const COLUMNS = [
  { key: 'invoiceId', label: 'Invoice' },
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'date', label: 'Date', render: (value) => formatDate(value) },
];

export default function BooksPage() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetchBooksInvoices(token);
      setInvoices(res.data.invoices || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load Zoho Books invoices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    if (!invoices.length) return [];
    const paid = countMatching(invoices, 'status', (v) => /paid|closed/i.test(v));
    const overdue = countMatching(invoices, 'status', (v) => /overdue/i.test(v));
    const draft = countMatching(invoices, 'status', (v) => /draft|sent|unpaid|open/i.test(v));
    const cards = [
      <StatCard key="total" label="Invoices" value={String(invoices.length)} hint="From Zoho Books" />,
    ];
    if (paid) cards.push(<StatCard key="paid" label="Paid" value={String(paid)} hint="Current list" />);
    if (draft) cards.push(<StatCard key="open" label="Open" value={String(draft)} hint="Current list" />);
    if (overdue) cards.push(<StatCard key="over" label="Overdue" value={String(overdue)} hint="Current list" />);
    return cards;
  }, [invoices]);

  return (
    <ServicePage
      title="Zoho Books"
      subtitle="Review invoices from your Zoho Books workspace."
      crumbs={['Services', 'Books']}
      loading={loading}
      error={error}
      onRefresh={load}
      stats={stats}
    >
      <DataTable
        columns={COLUMNS}
        rows={invoices}
        emptyTitle="No invoices yet"
        emptyDescription="Your Zoho Books workspace currently has no invoices to display."
        emptyAction={
          <button className="btn btn-primary" type="button" onClick={load}>
            <IconRefresh />
            Refresh
          </button>
        }
        searchPlaceholder="Search invoices"
      />
    </ServicePage>
  );
}
