import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchDeskTickets } from '../services/zohoApi.js';
import ServicePage from '../components/ServicePage.jsx';
import DataTable from '../components/DataTable.jsx';
import StatCard from '../components/StatCard.jsx';
import { IconRefresh } from '../components/icons.jsx';
import { countMatching, formatDateTime } from '../utils/format.js';

const COLUMNS = [
  { key: 'ticketId', label: 'Ticket ID' },
  { key: 'subject', label: 'Subject', truncate: true },
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'priority', label: 'Priority', type: 'status' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'createdTime', label: 'Created', render: (value) => formatDateTime(value) },
];

export default function DeskPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDeskTickets(token);
      setTickets(res.data.tickets || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load Zoho Desk tickets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    if (!tickets.length) return [];
    const open = countMatching(tickets, 'status', (v) => /open|progress|hold|new/i.test(v));
    const closed = countMatching(tickets, 'status', (v) => /closed|resolved|complete/i.test(v));
    const high = countMatching(tickets, 'priority', (v) => /high|urgent|critical/i.test(v));
    const cards = [
      <StatCard key="total" label="Tickets" value={String(tickets.length)} hint="From Zoho Desk" />,
    ];
    if (open) cards.push(<StatCard key="open" label="Open" value={String(open)} hint="Needs attention" />);
    if (closed) cards.push(<StatCard key="closed" label="Closed" value={String(closed)} hint="Resolved in this list" />);
    if (high) cards.push(<StatCard key="high" label="High priority" value={String(high)} hint="From current tickets" />);
    return cards;
  }, [tickets]);

  return (
    <ServicePage
      title="Zoho Desk"
      subtitle="Track customer support tickets from Zoho Desk."
      crumbs={['Services', 'Desk']}
      loading={loading}
      error={error}
      onRefresh={load}
      stats={stats}
    >
      <DataTable
        columns={COLUMNS}
        rows={tickets}
        emptyTitle="No tickets yet"
        emptyDescription="Your Zoho Desk workspace currently has no tickets to display."
        emptyAction={
          <button className="btn btn-primary" type="button" onClick={load}>
            <IconRefresh />
            Refresh
          </button>
        }
        searchPlaceholder="Search tickets"
      />
    </ServicePage>
  );
}
