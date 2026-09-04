import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchAuthorizedApps, fetchZohoStatus } from '../services/zohoApi.js';
import { pathForService } from '../utils/services.js';
import { catalogFor } from '../utils/serviceCatalog.js';
import { displayName, greetingForNow } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { SkeletonCards } from '../components/Skeleton.jsx';
import { IconBolt, IconCheck, IconShield, IconUsers } from '../components/icons.jsx';

export default function DashboardPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [connected, setConnected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [appsRes, statusRes] = await Promise.all([
        fetchAuthorizedApps(token),
        fetchZohoStatus(token).catch(() => null),
      ]);
      setApps(appsRes.data.apps || []);
      if (statusRes?.data && typeof statusRes.data.connected === 'boolean') {
        setConnected(statusRes.data.connected);
      } else {
        setConnected(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const greeting = `${greetingForNow()}, ${displayName(user)}`;

  return (
    <div>
      <PageHeader title={greeting} />

      {loading && <SkeletonCards count={3} />}

      {!loading && error && <ErrorState title="Unable to load dashboard" message={error} onRetry={load} />}

      {!loading && !error && (
        <>
          <div className="stat-grid">
            <StatCard
              label="Active Services"
              value={String(apps.length).padStart(2, '0')}
              hint="Available to you"
              icon={<IconBolt />}
            />
            <StatCard
              label="Assigned Roles"
              value={String(user?.roles?.length || 0).padStart(2, '0')}
              hint={user?.roles?.join(', ') || 'No roles assigned'}
              icon={<IconUsers />}
            />
            {connected !== null && (
              <StatCard
                label="System Status"
                value={connected ? 'Operational' : 'Attention'}
                hint={connected ? 'Zoho connection is active' : 'Zoho connection needs attention'}
                icon={connected ? <IconCheck /> : <IconShield />}
              />
            )}
          </div>

          <div className="section-title" style={{ marginTop: 28 }}>Your Services</div>

          {apps.length === 0 ? (
            <EmptyState
              title="No Zoho services assigned"
              description="Ask your administrator to grant the required RBAC permissions."
            />
          ) : (
            <div className="service-grid">
              {apps.map((app) => {
                const item = catalogFor(app.service, app);
                return (
                  <ServiceCard
                    key={app.service}
                    service={app.service}
                    label={item.label}
                    description={item.description}
                    summary={item.detail}
                    status="Authorized"
                    onOpen={() => navigate(pathForService(app))}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
