import React, { useEffect, useMemo, useState } from 'react';
import { api, authHeader } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import DataTable from '../components/DataTable.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { SkeletonCards, SkeletonTable } from '../components/Skeleton.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import { IconRefresh } from '../components/icons.jsx';
import { formatDateTime } from '../utils/format.js';

function CheckboxGroup({ options, value, onChange }) {
  return (
    <div className="checkbox-list">
      {options.map((opt) => (
        <label key={opt.value}>
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={(event) => {
              if (event.target.checked) onChange([...value, opt.value]);
              else onChange(value.filter((item) => item !== opt.value));
            }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

export default function AdminPanelPage() {
  const { token, user, logout } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [userModal, setUserModal] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const [permissionModal, setPermissionModal] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const [newUser, setNewUser] = useState({ username: '', password: '', email: '', roleNames: [] });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUser, setEditUser] = useState({ username: '', password: '', email: '', roleNames: [] });

  const [newRole, setNewRole] = useState({ name: '', displayName: '' });
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editRole, setEditRole] = useState({ name: '', displayName: '' });

  const [rolePermissionsText, setRolePermissionsText] = useState('');
  const [selectedRolePermissionsRoleId, setSelectedRolePermissionsRoleId] = useState(null);
  const [rolePermissionCodes, setRolePermissionCodes] = useState([]);

  const [newPermission, setNewPermission] = useState({ code: '', description: '' });
  const [editingPermissionId, setEditingPermissionId] = useState(null);
  const [editPermission, setEditPermission] = useState({ code: '', description: '' });

  const rolesOptions = useMemo(
    () => roles.map((r) => ({ value: r.name, label: `${r.name}${r.displayName ? ` (${r.displayName})` : ''}` })),
    [roles],
  );

  function withAuth(config = {}) {
    return { ...config, headers: { ...authHeader(token), ...(config.headers || {}) } };
  }

  async function authFetch(fn) {
    try {
      setError('');
      return await fn();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) logout();
      const message = err?.response?.data?.message || err?.message || 'Request failed';
      setError(message);
      toast.push({ title: 'Request failed', message, tone: 'danger' });
      throw err;
    }
  }

  async function refreshAll() {
    setLoading(true);
    try {
      const [u, r, p, a] = await Promise.all([
        authFetch(() => api.get('/api/admin/users', withAuth())),
        authFetch(() => api.get('/api/admin/roles', withAuth())),
        authFetch(() => api.get('/api/admin/permissions', withAuth())),
        authFetch(() => api.get('/api/admin/audit-logs?limit=200', withAuth())),
      ]);
      setUsers(u.data.users || []);
      setRoles(r.data.roles || []);
      setPermissions(p.data.permissions || []);
      setAuditLogs(a.data.auditLogs || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createUser() {
    await authFetch(() => api.post('/api/admin/users', { ...newUser }, withAuth()));
    setNewUser({ username: '', password: '', email: '', roleNames: [] });
    setUserModal(null);
    toast.push({ title: 'User created', tone: 'success' });
    await refreshAll();
  }

  async function startEditUser(u) {
    setEditingUserId(u.id);
    setEditUser({
      username: u.username,
      password: '',
      email: u.email || '',
      roleNames: u.roles || [],
    });
    setUserModal('edit');
  }

  async function saveEditUser() {
    if (!editingUserId) return;
    await authFetch(() =>
      api.put(`/api/admin/users/${editingUserId}`, { ...editUser, password: editUser.password || undefined }, withAuth()),
    );
    setEditingUserId(null);
    setEditUser({ username: '', password: '', email: '', roleNames: [] });
    setUserModal(null);
    toast.push({ title: 'User updated', tone: 'success' });
    await refreshAll();
  }

  function requestDeleteUser(userId) {
    setConfirm({
      title: 'Delete this user?',
      message: 'This removes the user from BrainWave. This cannot be undone from this screen.',
      confirmLabel: 'Delete user',
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        await deleteUser(userId);
      },
    });
  }

  async function deleteUser(userId) {
    await authFetch(() => api.delete(`/api/admin/users/${userId}`, withAuth()));
    toast.push({ title: 'User deleted', tone: 'success' });
    await refreshAll();
  }

  function parsePermissionCodes(text) {
    return text
      .split(/[,\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function setPermissionsForRole() {
    if (!selectedRolePermissionsRoleId) return;
    const permissionCodes = parsePermissionCodes(rolePermissionsText);
    await authFetch(() =>
      api.post(`/api/admin/roles/${selectedRolePermissionsRoleId}/permissions`, { permissionCodes }, withAuth()),
    );
    toast.push({ title: 'Permissions saved', tone: 'success' });
    await refreshAll();
  }

  async function loadRolePermissions(roleId) {
    const res = await authFetch(() => api.get(`/api/admin/roles/${roleId}/permissions`, withAuth()));
    setRolePermissionCodes(res.data.permissionCodes || []);
    setRolePermissionsText((res.data.permissionCodes || []).join(', '));
    setSelectedRolePermissionsRoleId(roleId);
  }

  async function createRole() {
    await authFetch(() => api.post('/api/admin/roles', newRole, withAuth()));
    setNewRole({ name: '', displayName: '' });
    setRoleModal(null);
    toast.push({ title: 'Role created', tone: 'success' });
    await refreshAll();
  }

  async function startEditRole(r) {
    setEditingRoleId(r.id);
    setEditRole({ name: r.name, displayName: r.displayName || '' });
    setRoleModal('edit');
  }

  async function saveEditRole() {
    if (!editingRoleId) return;
    await authFetch(() => api.put(`/api/admin/roles/${editingRoleId}`, editRole, withAuth()));
    setEditingRoleId(null);
    setEditRole({ name: '', displayName: '' });
    setRoleModal(null);
    toast.push({ title: 'Role updated', tone: 'success' });
    await refreshAll();
  }

  function requestDeleteRole(roleId) {
    setConfirm({
      title: 'Delete this role?',
      message: 'Users assigned to this role may lose access.',
      confirmLabel: 'Delete role',
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        await deleteRole(roleId);
      },
    });
  }

  async function deleteRole(roleId) {
    await authFetch(() => api.delete(`/api/admin/roles/${roleId}`, withAuth()));
    toast.push({ title: 'Role deleted', tone: 'success' });
    await refreshAll();
  }

  async function createPermission() {
    await authFetch(() => api.post('/api/admin/permissions', newPermission, withAuth()));
    setNewPermission({ code: '', description: '' });
    setPermissionModal(null);
    toast.push({ title: 'Permission created', tone: 'success' });
    await refreshAll();
  }

  async function startEditPermission(p) {
    setEditingPermissionId(p.id);
    setEditPermission({ code: p.code, description: p.description || '' });
    setPermissionModal('edit');
  }

  async function saveEditPermission() {
    if (!editingPermissionId) return;
    await authFetch(() => api.put(`/api/admin/permissions/${editingPermissionId}`, editPermission, withAuth()));
    setEditingPermissionId(null);
    setEditPermission({ code: '', description: '' });
    setPermissionModal(null);
    toast.push({ title: 'Permission updated', tone: 'success' });
    await refreshAll();
  }

  function requestDeletePermission(permissionId) {
    setConfirm({
      title: 'Delete this permission?',
      message: 'Roles using this permission will lose that grant.',
      confirmLabel: 'Delete permission',
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        await deletePermission(permissionId);
      },
    });
  }

  async function deletePermission(permissionId) {
    await authFetch(() => api.delete(`/api/admin/permissions/${permissionId}`, withAuth()));
    toast.push({ title: 'Permission deleted', tone: 'success' });
    await refreshAll();
  }

  const userRows = users.map((u) => ({
    ...u,
    roleLabel: u.roles?.length ? u.roles.join(', ') : '—',
    status: 'Active',
  }));

  return (
    <div>
      <div className="page-header" style={{ marginTop: 0 }}>
        <div className="tabs">
        {[
          ['users', 'Users'],
          ['roles', 'Roles'],
          ['permissions', 'Permissions'],
          ['audit', 'Audit Logs'],
        ].map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'is-active' : ''}`} type="button" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
        </div>
        <button className="btn" type="button" onClick={refreshAll} disabled={loading}>
          <IconRefresh />
          Refresh
        </button>
      </div>

      {error && !loading && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="error">{error}</div>
        </div>
      )}

      {loading && (
        <>
          <SkeletonCards count={3} />
          <div style={{ height: 16 }} />
          <SkeletonTable />
        </>
      )}

      {!loading && (
        <div className="admin-summary stat-grid" style={{ marginBottom: 18 }}>
          <StatCard label="Users" value={String(users.length)} hint="Active BrainWave accounts" />
          <StatCard label="Roles" value={String(roles.length)} hint="Defined in this workspace" />
          <StatCard label="Permissions" value={String(permissions.length)} hint="Available grants" />
          <StatCard label="Audit events" value={String(auditLogs.length)} hint="Latest 200 records" />
        </div>
      )}

      {!loading && tab === 'users' && (
        <>
          <div className="page-header-actions" style={{ marginBottom: 12 }}>
            <button className="btn btn-primary" type="button" onClick={() => setUserModal('create')}>
              Create user
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'username', label: 'Username' },
              { key: 'email', label: 'Email', truncate: true },
              { key: 'roleLabel', label: 'Role' },
              { key: 'status', label: 'Status', type: 'status' },
              {
                key: 'actions',
                label: 'Actions',
                render: (_value, row) => (
                  <div className="table-actions">
                    <button className="btn btn-sm" type="button" onClick={() => startEditUser(row)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" type="button" onClick={() => requestDeleteUser(row.id)}>
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
            rows={userRows}
            emptyTitle="No users yet"
            emptyDescription="Create a user to grant BrainWave access."
            searchPlaceholder="Search users"
          />
        </>
      )}

      {!loading && tab === 'roles' && (
        <>
          <div className="page-header-actions" style={{ marginBottom: 12 }}>
            <button className="btn btn-primary" type="button" onClick={() => setRoleModal('create')}>
              Create role
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'Role' },
              { key: 'displayName', label: 'Description' },
              {
                key: 'actions',
                label: 'Actions',
                render: (_value, row) => (
                  <div className="table-actions">
                    <button className="btn btn-sm" type="button" onClick={() => startEditRole(row)}>
                      Edit
                    </button>
                    <button className="btn btn-sm" type="button" onClick={() => loadRolePermissions(row.id)}>
                      Permissions
                    </button>
                    <button className="btn btn-sm btn-danger" type="button" onClick={() => requestDeleteRole(row.id)}>
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
            rows={roles}
            emptyTitle="No roles yet"
            emptyDescription="Create a role before assigning permissions."
            searchPlaceholder="Search roles"
          />

          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-title">Assign permissions to a role</div>
            <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="field">
                <div className="label">Select role</div>
                <select
                  value={selectedRolePermissionsRoleId || ''}
                  onChange={(e) => loadRolePermissions(e.target.value)}
                >
                  <option value="" disabled>
                    Choose a role...
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                  Current permissions: {rolePermissionCodes.length ? rolePermissionCodes.join(', ') : '—'}
                </div>
              </div>
              <div className="field">
                <div className="label">Permission codes (comma or newline separated)</div>
                <textarea
                  value={rolePermissionsText}
                  onChange={(e) => setRolePermissionsText(e.target.value)}
                />
                <button className="btn btn-primary" type="button" onClick={setPermissionsForRole} disabled={!selectedRolePermissionsRoleId}>
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && tab === 'permissions' && (
        <>
          <div className="page-header-actions" style={{ marginBottom: 12 }}>
            <button className="btn btn-primary" type="button" onClick={() => setPermissionModal('create')}>
              Create permission
            </button>
          </div>
          <DataTable
            columns={[
              { key: 'code', label: 'Code' },
              { key: 'description', label: 'Description' },
              {
                key: 'actions',
                label: 'Actions',
                render: (_value, row) => (
                  <div className="table-actions">
                    <button className="btn btn-sm" type="button" onClick={() => startEditPermission(row)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" type="button" onClick={() => requestDeletePermission(row.id)}>
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
            rows={permissions}
            emptyTitle="No permissions yet"
            emptyDescription="Create permission codes used by role grants."
            searchPlaceholder="Search permissions"
          />
        </>
      )}

      {!loading && tab === 'audit' && (
        <DataTable
          columns={[
            { key: 'createdAt', label: 'Timestamp', render: (value) => formatDateTime(value) },
            { key: 'username', label: 'User', render: (_value, row) => row.username || row.userId || '—' },
            { key: 'action', label: 'Action' },
            {
              key: 'resource',
              label: 'Resource',
              render: (value, row) => `${value || '—'}${row.resourceId ? `/${row.resourceId}` : ''}`,
            },
            { key: 'status', label: 'Status', render: (value) => <StatusBadge value={value} /> },
            { key: 'message', label: 'Message', truncate: true },
          ]}
          rows={auditLogs}
          emptyTitle="No audit logs yet"
          emptyDescription="Activity will appear here as administrators and services are used."
          searchPlaceholder="Search audit logs"
        />
      )}

      <Modal
        open={userModal === 'create'}
        title="Create user"
        description="Add a BrainWave account and assign roles."
        onClose={() => setUserModal(null)}
        actions={
          <>
            <button className="btn btn-ghost" type="button" onClick={() => setUserModal(null)}>Cancel</button>
            <button className="btn btn-primary" type="button" onClick={createUser}>Create</button>
          </>
        }
      >
        <div className="modal-grid">
          <div className="field">
            <div className="label">Username</div>
            <input value={newUser.username} onChange={(e) => setNewUser((s) => ({ ...s, username: e.target.value }))} />
          </div>
          <div className="field">
            <div className="label">Password</div>
            <input type="password" value={newUser.password} onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))} />
          </div>
          <div className="field">
            <div className="label">Email (optional)</div>
            <input value={newUser.email} onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))} />
          </div>
          <div className="field">
            <div className="label">Assign roles</div>
            <CheckboxGroup options={rolesOptions} value={newUser.roleNames} onChange={(v) => setNewUser((s) => ({ ...s, roleNames: v }))} />
          </div>
        </div>
      </Modal>

      <Modal
        open={userModal === 'edit'}
        title="Edit user"
        onClose={() => setUserModal(null)}
        actions={
          <>
            <button className="btn btn-ghost" type="button" onClick={() => { setUserModal(null); setEditingUserId(null); }}>Cancel</button>
            <button className="btn btn-primary" type="button" onClick={saveEditUser}>Save</button>
          </>
        }
      >
        <div className="modal-grid">
          <div className="field">
            <div className="label">Username</div>
            <input value={editUser.username} onChange={(e) => setEditUser((s) => ({ ...s, username: e.target.value }))} />
          </div>
          <div className="field">
            <div className="label">Password (leave blank to keep)</div>
            <input type="password" value={editUser.password} onChange={(e) => setEditUser((s) => ({ ...s, password: e.target.value }))} />
          </div>
          <div className="field">
            <div className="label">Email (optional)</div>
            <input value={editUser.email} onChange={(e) => setEditUser((s) => ({ ...s, email: e.target.value }))} />
          </div>
          <div className="field">
            <div className="label">Assign roles</div>
            <CheckboxGroup options={rolesOptions} value={editUser.roleNames} onChange={(v) => setEditUser((s) => ({ ...s, roleNames: v }))} />
          </div>
        </div>
      </Modal>

      <Modal
        open={roleModal === 'create'}
        title="Create role"
        onClose={() => setRoleModal(null)}
        actions={
          <>
            <button className="btn btn-ghost" type="button" onClick={() => setRoleModal(null)}>Cancel</button>
            <button className="btn btn-primary" type="button" onClick={createRole}>Create</button>
          </>
        }
      >
        <div className="modal-grid">
          <div className="field">
            <div className="label">Role name</div>
            <input value={newRole.name} onChange={(e) => setNewRole((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div className="field">
            <div className="label">Display name (optional)</div>
            <input value={newRole.displayName} onChange={(e) => setNewRole((s) => ({ ...s, displayName: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        open={roleModal === 'edit'}
        title="Edit role"
        onClose={() => setRoleModal(null)}
        actions={
          <>
            <button className="btn btn-ghost" type="button" onClick={() => { setRoleModal(null); setEditingRoleId(null); }}>Cancel</button>
            <button className="btn btn-primary" type="button" onClick={saveEditRole}>Save</button>
          </>
        }
      >
        <div className="modal-grid">
          <div className="field">
            <div className="label">Role name</div>
            <input value={editRole.name} onChange={(e) => setEditRole((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div className="field">
            <div className="label">Display name</div>
            <input value={editRole.displayName} onChange={(e) => setEditRole((s) => ({ ...s, displayName: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        open={permissionModal === 'create'}
        title="Create permission"
        onClose={() => setPermissionModal(null)}
        actions={
          <>
            <button className="btn btn-ghost" type="button" onClick={() => setPermissionModal(null)}>Cancel</button>
            <button className="btn btn-primary" type="button" onClick={createPermission}>Create</button>
          </>
        }
      >
        <div className="modal-grid">
          <div className="field">
            <div className="label">Permission code</div>
            <input value={newPermission.code} onChange={(e) => setNewPermission((s) => ({ ...s, code: e.target.value }))} />
          </div>
          <div className="field">
            <div className="label">Description</div>
            <input value={newPermission.description} onChange={(e) => setNewPermission((s) => ({ ...s, description: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <Modal
        open={permissionModal === 'edit'}
        title="Edit permission"
        onClose={() => setPermissionModal(null)}
        actions={
          <>
            <button className="btn btn-ghost" type="button" onClick={() => { setPermissionModal(null); setEditingPermissionId(null); }}>Cancel</button>
            <button className="btn btn-primary" type="button" onClick={saveEditPermission}>Save</button>
          </>
        }
      >
        <div className="modal-grid">
          <div className="field">
            <div className="label">Permission code</div>
            <input value={editPermission.code} onChange={(e) => setEditPermission((s) => ({ ...s, code: e.target.value }))} />
          </div>
          <div className="field">
            <div className="label">Description</div>
            <input value={editPermission.description} onChange={(e) => setEditPermission((s) => ({ ...s, description: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onCancel={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
      />

      <span className="sr-only">Signed in as {user?.username}</span>
    </div>
  );
}
