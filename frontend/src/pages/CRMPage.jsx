import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchCrmLeads } from '../services/zohoApi.js';
import ServicePage from '../components/ServicePage.jsx';
import DataTable from '../components/DataTable.jsx';
import StatCard from '../components/StatCard.jsx';
import { IconRefresh } from '../components/icons.jsx';
import { countMatching, formatDateTime, formatPhone } from '../utils/format.js';

const COLUMNS = [
  { key: 'name', label: 'Lead' },
  { key: 'company', label: 'Company' },
  { key: 'email', label: 'Email', truncate: true },
  { key: 'phone', label: 'Phone', render: (value) => formatPhone(value) },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'createdTime', label: 'Created', render: (value) => formatDateTime(value) },
];

export default function CRMPage() {
  const { token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetchCrmLeads(token);
      setLeads(res.data.leads || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load Zoho CRM leads');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    if (!leads.length) return [];
    const cards = [
      <StatCard key="total" label="Total Leads" value={String(leads.length)} hint="From Zoho CRM" />,
    ];
    const qualified = countMatching(leads, 'status', (v) => /qualified/i.test(v));
    const contacted = countMatching(leads, 'status', (v) => /contact/i.test(v) && !/not\s*contact/i.test(v));
    const notContacted = countMatching(leads, 'status', (v) => /not\s*contact/i.test(v));
    if (qualified) cards.push(<StatCard key="q" label="Qualified" value={String(qualified)} hint="Current workspace" />);
    if (contacted) cards.push(<StatCard key="c" label="Contacted" value={String(contacted)} hint="Current workspace" />);
    if (notContacted) cards.push(<StatCard key="n" label="Not Contacted" value={String(notContacted)} hint="Current workspace" />);
    return cards;
  }, [leads]);

  return (
    <ServicePage
      title="Zoho CRM"
      subtitle="Manage and review leads from your Zoho CRM workspace."
      crumbs={['Services', 'CRM', 'Leads']}
      loading={loading}
      error={error}
      onRefresh={load}
      stats={stats}
    >
      <DataTable
        columns={COLUMNS}
        rows={leads}
        emptyTitle="No leads yet"
        emptyDescription="Your Zoho CRM workspace currently has no leads to display."
        emptyAction={
          <button className="btn btn-primary" type="button" onClick={load}>
            <IconRefresh />
            Refresh
          </button>
        }
        searchPlaceholder="Search leads"
      />
    </ServicePage>
  );
}
