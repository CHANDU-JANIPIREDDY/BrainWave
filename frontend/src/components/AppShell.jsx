import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import BrandMark from './BrandMark.jsx';
import { initials } from '../utils/format.js';
import { metaForPath } from '../utils/pageMeta.js';
import { SERVICE_PATHS } from '../utils/services.js';
import { SERVICE_CATALOG } from '../utils/serviceCatalog.js';
import {
  IconAdmin,
  IconClose,
  IconDashboard,
  IconLogout,
  IconMenu,
  ServiceGlyph,
} from './icons.jsx';

const COLLAPSE_KEY = 'brainwave_sidebar_collapsed';

function NavButton({ active, icon, label, onClick, title }) {
  return (
    <button className={`nav-item ${active ? 'is-active' : ''}`} type="button" onClick={onClick} title={title || label}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function AppShell() {
  const { user, logout, canAccessService, canAccessAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);

  const meta = metaForPath(location.pathname);
  const services = useMemo(
    () => Object.keys(SERVICE_CATALOG).filter((service) => canAccessService(service)),
    [canAccessService, user],
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  }

  async function onLogout() {
    await logout();
    navigate('/login');
  }

  const shellClass = [
    'app-shell',
    collapsed ? 'is-collapsed' : '',
    mobileOpen ? 'is-nav-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClass}>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <BrandMark size={40} />
          <div className="sidebar-brand-copy">
            <strong>BrainWave</strong>
            <span>Workspace</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          <NavButton
            active={location.pathname === '/dashboard'}
            icon={<IconDashboard />}
            label="Dashboard"
            onClick={() => navigate('/dashboard')}
          />

          {services.length > 0 && <div className="sidebar-label">Zoho Services</div>}
          {services.map((service) => (
            <NavButton
              key={service}
              active={location.pathname === SERVICE_PATHS[service]}
              icon={<ServiceGlyph service={service} />}
              label={SERVICE_CATALOG[service].label}
              onClick={() => navigate(SERVICE_PATHS[service])}
            />
          ))}

          {canAccessAdmin() && (
            <>
              <div className="sidebar-label">Administration</div>
              <NavButton
                active={location.pathname === '/admin'}
                icon={<IconAdmin />}
                label="Admin"
                onClick={() => navigate('/admin')}
              />
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{initials(user?.username)}</div>
            <div className="sidebar-user-meta">
              <strong>{user?.username}</strong>
              <span>{user?.roles?.join(', ') || 'Member'}</span>
            </div>
          </div>
          <button className="btn btn-ghost sidebar-collapse" type="button" onClick={toggleCollapsed} title="Collapse sidebar">
            <span>{collapsed ? 'Expand' : 'Collapse'}</span>
          </button>
          <button className="btn" type="button" onClick={onLogout}>
            <IconLogout />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            <button className="icon-btn menu-btn" type="button" onClick={() => setMobileOpen((v) => !v)} aria-label="Open menu">
              {mobileOpen ? <IconClose /> : <IconMenu />}
            </button>
            <BrandMark size={32} />
            <div className="topbar-copy">
              {meta.crumbs?.length > 0 && (
                <div className="crumbs">
                  {meta.crumbs.map((crumb, index) => (
                    <React.Fragment key={crumb}>
                      {index > 0 && <span>/</span>}
                      <span>{crumb}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}
              <h1>{meta.title}</h1>
              {meta.description && <p>{meta.description}</p>}
            </div>
          </div>
          <div className="topbar-actions">
            <span className="role-badge">{user?.roles?.[0] || 'User'}</span>
            <div className="avatar" title={user?.username}>
              {initials(user?.username)}
            </div>
          </div>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
