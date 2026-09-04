import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchPeopleEmployees } from '../services/zohoApi.js';
import ServicePage from '../components/ServicePage.jsx';
import DataTable from '../components/DataTable.jsx';
import StatCard from '../components/StatCard.jsx';
import { IconRefresh } from '../components/icons.jsx';
import { uniqueValues } from '../utils/format.js';

const COLUMNS = [
  { key: 'employeeId', label: 'Employee ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', truncate: true },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'status', label: 'Status', type: 'status' },
];

export default function PeoplePage() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetchPeopleEmployees(token);
      setEmployees(res.data.employees || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load Zoho People employees');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    if (!employees.length) return [];
    const departments = uniqueValues(employees, 'department');
    const cards = [
      <StatCard key="total" label="Employees" value={String(employees.length)} hint="From Zoho People" />,
    ];
    if (departments.size) {
      cards.push(<StatCard key="dept" label="Departments" value={String(departments.size)} hint="Present in this list" />);
    }
    return cards;
  }, [employees]);

  return (
    <ServicePage
      title="Zoho People"
      subtitle="Review employees from your Zoho People workspace."
      crumbs={['Services', 'People']}
      loading={loading}
      error={error}
      onRefresh={load}
      stats={stats}
    >
      <DataTable
        columns={COLUMNS}
        rows={employees}
        emptyTitle="No employees yet"
        emptyDescription="Your Zoho People workspace currently has no employees to display."
        emptyAction={
          <button className="btn btn-primary" type="button" onClick={load}>
            <IconRefresh />
            Refresh
          </button>
        }
        searchPlaceholder="Search employees"
      />
    </ServicePage>
  );
}
