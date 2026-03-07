import React, { useEffect, useMemo, useRef, useState } from 'react';

type AdminUser = {
  id: number;
  username: string;
  email?: string | null;
  role: string;
  is_admin: boolean;
  is_blocked: boolean;
  blocked_reason?: string | null;
  token_version: number;
  last_seen_at?: string | null;
  created_at?: string | null;
};

type ActivityItem = {
  id: number;
  username?: string | null;
  action: string;
  ip?: string | null;
  created_at?: string | null;
  details?: Record<string, any> | null;
};

type ServiceItem = {
  name: string;
  kind: string;
  status: string;
  url?: string;
  http_status?: number | null;
  latency_ms?: number | null;
  last_processed_at?: string | null;
  age_seconds?: number | null;
  error?: string;
};

type AdminSectionKey = 'users' | 'activity' | 'services';

const AUTH_BASE = (import.meta as any).env?.VITE_AUTH_URL || `http://${window.location.hostname}:8400`;
const PRIMARY_ADMIN_USERNAME = ((import.meta as any).env?.VITE_PRIMARY_ADMIN_USERNAME || 'admin').toLowerCase();
const ROLES = ['viewer', 'analyst', 'admin'];
const ASSIGNABLE_ROLES = ['viewer', 'analyst'];
const DEFAULT_SECTION_ORDER: AdminSectionKey[] = ['users', 'activity', 'services'];
const DEFAULT_COLLAPSED: Record<AdminSectionKey, boolean> = {
  users: false,
  activity: false,
  services: false,
};

function roleLabel(role: string): string {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : role;
}

function isAdminSectionKey(value: string): value is AdminSectionKey {
  return value === 'users' || value === 'activity' || value === 'services';
}

function getInitialSectionOrder(): AdminSectionKey[] {
  try {
    const raw = window.localStorage.getItem('admin_sections_order');
    if (!raw) return DEFAULT_SECTION_ORDER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_SECTION_ORDER;

    const saved = parsed.filter((item): item is AdminSectionKey => typeof item === 'string' && isAdminSectionKey(item));
    if (saved.length === 0) return DEFAULT_SECTION_ORDER;

    const missing = DEFAULT_SECTION_ORDER.filter((key) => !saved.includes(key));
    return [...saved, ...missing];
  } catch {
    return DEFAULT_SECTION_ORDER;
  }
}

function getInitialCollapsed(): Record<AdminSectionKey, boolean> {
  try {
    const raw = window.localStorage.getItem('admin_sections_collapsed');
    if (!raw) return DEFAULT_COLLAPSED;
    const parsed = JSON.parse(raw);
    return {
      users: Boolean(parsed?.users),
      activity: Boolean(parsed?.activity),
      services: Boolean(parsed?.services),
    };
  } catch {
    return DEFAULT_COLLAPSED;
  }
}

function getInitialAdminTextSetting(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function getInitialRoleFilter(): string {
  const raw = getInitialAdminTextSetting('admin_users_role_filter', 'all');
  return raw === 'all' || ROLES.includes(raw) ? raw : 'all';
}

function getInitialBlockedFilter(): string {
  const raw = getInitialAdminTextSetting('admin_users_blocked_filter', 'all');
  return raw === 'all' || raw === 'blocked' || raw === 'active' ? raw : 'all';
}

function getInitialActivityLimit(): number {
  try {
    const raw = Number(window.localStorage.getItem('admin_activity_limit') || '50');
    return raw === 10 || raw === 50 || raw === 100 ? raw : 50;
  } catch {
    return 50;
  }
}

function isProtectedPrimaryAdmin(user: AdminUser): boolean {
  return (user.username || '').trim().toLowerCase() === PRIMARY_ADMIN_USERNAME;
}

async function authApi(path: string, opts: RequestInit = {}) {
  const token = window.localStorage.getItem('auth_token');
  if (!token) throw new Error('Нет токена авторизации. Выполните вход снова.');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(opts.headers as Record<string, string>),
  };
  if (opts.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${AUTH_BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json().catch(() => null);
}

export function AdminPanel() {
  const [busyCount, setBusyCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [query, setQuery] = useState(() => getInitialAdminTextSetting('admin_users_query', ''));
  const [roleFilter, setRoleFilter] = useState(getInitialRoleFilter);
  const [blockedFilter, setBlockedFilter] = useState(getInitialBlockedFilter);

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [activityLimit, setActivityLimit] = useState(getInitialActivityLimit);

  const [services, setServices] = useState<ServiceItem[]>([]);

  const [sectionOrder, setSectionOrder] = useState<AdminSectionKey[]>(getInitialSectionOrder);
  const [collapsed, setCollapsed] = useState<Record<AdminSectionKey, boolean>>(getInitialCollapsed);
  const activityRealtimeDebounceRef = useRef<number | null>(null);

  const busy = busyCount > 0;

  const usersQueryString = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query.trim());
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (blockedFilter !== 'all') params.set('blocked', blockedFilter === 'blocked' ? 'true' : 'false');
    params.set('limit', '200');
    return params.toString();
  }, [query, roleFilter, blockedFilter]);

  async function runWithBusy<T>(task: () => Promise<T>): Promise<T> {
    setBusyCount((prev) => prev + 1);
    try {
      return await task();
    } finally {
      setBusyCount((prev) => Math.max(0, prev - 1));
    }
  }

  async function loadUsers() {
    await runWithBusy(async () => {
      setError(null);
      try {
        const data = await authApi(`/admin/users?${usersQueryString}`);
        setUsers(Array.isArray(data?.items) ? data.items : []);
        setTotalUsers(Number(data?.total || 0));
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    });
  }

  async function loadActivity() {
    await runWithBusy(async () => {
      setError(null);
      try {
        const [rows, agg] = await Promise.all([
          authApi(`/admin/activity?limit=${activityLimit}`),
          authApi('/admin/activity/summary'),
        ]);
        setActivity(Array.isArray(rows?.items) ? rows.items : []);
        setSummary(agg || null);
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    });
  }

  async function clearActivity() {
    setError(null);
    try {
      await authApi('/admin/activity', { method: 'DELETE' });
      await loadActivity();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function loadServices() {
    await runWithBusy(async () => {
      setError(null);
      try {
        const data = await authApi('/admin/services/status');
        setServices(Array.isArray(data?.services) ? data.services : []);
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    });
  }

  useEffect(() => {
    loadActivity().catch(() => null);
    loadServices().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadActivity().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityLimit]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      loadUsers().catch(() => null);
    }, 250);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersQueryString]);

  useEffect(() => {
    const id = window.setInterval(() => {
      loadServices().catch(() => null);
    }, 30000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      loadActivity().catch(() => null);
    }, 30000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem('auth_token');
    if (!token) return;

    let ws: WebSocket | null = null;
    try {
      const envHost = (import.meta as any).env?.VITE_REALTIME_HOST;
      const host = envHost || window.location.hostname || 'localhost';
      const normalizedHost = host === '0.0.0.0' || host === '' ? 'localhost' : host;
      ws = new WebSocket(`ws://${normalizedHost}:8700/ws`);

      ws.onmessage = () => {
        if (activityRealtimeDebounceRef.current) return;
        activityRealtimeDebounceRef.current = window.setTimeout(() => {
          activityRealtimeDebounceRef.current = null;
          loadActivity().catch(() => null);
        }, 350);
      };
    } catch {
      // Ignore realtime connection errors in admin panel.
    }

    return () => {
      if (activityRealtimeDebounceRef.current) {
        window.clearTimeout(activityRealtimeDebounceRef.current);
        activityRealtimeDebounceRef.current = null;
      }
      if (ws) {
        try {
          ws.close();
        } catch {
          // Ignore close errors.
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityLimit]);

  useEffect(() => {
    try {
      window.localStorage.setItem('admin_sections_order', JSON.stringify(sectionOrder));
    } catch {
      // Ignore storage errors
    }
  }, [sectionOrder]);

  useEffect(() => {
    try {
      window.localStorage.setItem('admin_sections_collapsed', JSON.stringify(collapsed));
    } catch {
      // Ignore storage errors
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      window.localStorage.setItem('admin_users_query', query);
      window.localStorage.setItem('admin_users_role_filter', roleFilter);
      window.localStorage.setItem('admin_users_blocked_filter', blockedFilter);
      window.localStorage.setItem('admin_activity_limit', String(activityLimit));
    } catch {
      // Ignore storage errors
    }
  }, [query, roleFilter, blockedFilter, activityLimit]);

  function toggleSection(section: AdminSectionKey) {
    setCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function moveSection(source: AdminSectionKey, target: AdminSectionKey) {
    if (source === target) return;
    setSectionOrder((prev) => {
      const sourceIndex = prev.indexOf(source);
      const targetIndex = prev.indexOf(target);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, section: AdminSectionKey) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', section);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, targetSection: AdminSectionKey) {
    e.preventDefault();
    const sourceSection = e.dataTransfer.getData('text/plain');
    if (!isAdminSectionKey(sourceSection)) return;
    moveSection(sourceSection, targetSection);
  }

  async function updateRole(user: AdminUser, role: string) {
    setError(null);
    try {
      await authApi(`/admin/users/${user.id}/role`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function setBlocked(user: AdminUser, blocked: boolean) {
    setError(null);
    try {
      const reason = blocked ? 'blocked_by_admin' : null;
      await authApi(`/admin/users/${user.id}/block`, {
        method: 'POST',
        body: JSON.stringify({ blocked, reason }),
      });
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function forceLogout(user: AdminUser) {
    setError(null);
    try {
      await authApi(`/admin/users/${user.id}/force-logout`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'admin_action' }),
      });
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!window.confirm(`Удалить пользователя ${user.username}?`)) return;
    setError(null);
    try {
      await authApi(`/admin/users/${user.id}`, { method: 'DELETE' });
      await loadUsers();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  function renderUsersSection() {
    return (
      <>
        <div className="admin-filters">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search username/email"
            className="admin-input"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="admin-select">
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{roleLabel(r)}</option>
            ))}
          </select>
          <select value={blockedFilter} onChange={(e) => setBlockedFilter(e.target.value)} className="admin-select">
            <option value="all">All statuses</option>
            <option value="blocked">Blocked</option>
            <option value="active">Active</option>
          </select>
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8}}>
          <div className="heading">Total: {totalUsers}</div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="no-data">No users found</td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email || '-'}</td>
                  <td>
                    {isProtectedPrimaryAdmin(u) ? (
                      <span className="admin-badge admin-badge-active">admin</span>
                    ) : (
                      <select
                        className="admin-select"
                        value={ASSIGNABLE_ROLES.includes(u.role) ? u.role : 'viewer'}
                        onChange={(e) => updateRole(u, e.target.value)}
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{roleLabel(r)}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {u.is_blocked ? (
                      <span className="admin-badge admin-badge-blocked">blocked</span>
                    ) : (
                      <span className="admin-badge admin-badge-active">active</span>
                    )}
                  </td>
                  <td>{u.last_seen_at ? new Date(u.last_seen_at).toLocaleString() : '-'}</td>
                  <td>
                    <div className="admin-actions">
                      {isProtectedPrimaryAdmin(u) ? (
                        <span className="admin-badge admin-badge-active">protected</span>
                      ) : (
                        <>
                          {u.is_blocked ? (
                            <button className="btn btn--neutral" onClick={() => setBlocked(u, false)}>Unblock</button>
                          ) : (
                            <button className="btn btn--neutral" onClick={() => setBlocked(u, true)}>Block</button>
                          )}
                          <button className="btn btn--neutral" onClick={() => forceLogout(u)}>Force logout</button>
                          <button className="btn btn--neutral" onClick={() => deleteUser(u)}>Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  function renderActivitySection() {
    return (
      <>
        <div className="admin-summary">
          <div className="card"><div className="k">Events (24h):</div><div className="v">{summary?.total_events ?? '-'}</div></div>
          <div className="card"><div className="k">Active users:</div><div className="v">{summary?.active_users ?? '-'}</div></div>
          <div className="card"><div className="k">Blocked users:</div><div className="v">{summary?.blocked_users ?? '-'}</div></div>
        </div>

        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12,width:'100%'}}>
          <label style={{fontWeight:600}}>Records:</label>
          <select
            value={activityLimit}
            onChange={(e) => setActivityLimit(Number(e.target.value))}
            className="admin-select admin-select-compact"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <button className="btn btn--danger" style={{marginLeft:'auto'}} onClick={clearActivity}>Clear All</button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table--activity">
            <thead>
              <tr>
                <th>Time</th>
                <th>ID</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {activity.length === 0 && (
                <tr>
                  <td colSpan={5} className="no-data">No activity yet</td>
                </tr>
              )}
              {activity.map((row) => (
                <tr key={row.id}>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</td>
                  <td>{row.id}</td>
                  <td>{row.username || '-'}</td>
                  <td>{row.action}</td>
                  <td><code>{row.details ? JSON.stringify(row.details) : '-'}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  function renderServicesSection() {
    return (
      <div className="admin-services-grid">
        {services.map((svc) => (
          <div key={svc.name} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <strong>{svc.name}</strong>
              <span className={`admin-badge ${svc.status === 'up' ? 'admin-badge-active' : 'admin-badge-blocked'}`}>{svc.status}</span>
            </div>
            {typeof svc.latency_ms !== 'undefined' && (
              <div className="muted" style={{ fontSize: '12px', marginTop: 4 }}>latency: {svc.latency_ms} ms</div>
            )}
            {svc.error && <div className="admin-error" style={{ fontSize: '12px', marginTop: 4 }}>{svc.error}</div>}
          </div>
        ))}
      </div>
    );
  }

  function renderSection(section: AdminSectionKey) {
    const title = section === 'users' ? 'Users' : section === 'activity' ? 'Activity' : 'Services';

    return (
      <div
        key={section}
        className="card"
        draggable
        onDragStart={(e) => handleDragStart(e, section)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, section)}
      >
        <div style={{display:'flex',alignItems:'center',cursor:'grab'}} onClick={() => toggleSection(section)}>
          <div className="heading">{title}</div>
          <div style={{flex:1}} />
          <div style={{opacity:0.6}}>{collapsed[section] ? '>' : 'v'}</div>
        </div>

        {!collapsed[section] && (
          <div style={{marginTop:12}}>
            {section === 'users' && renderUsersSection()}
            {section === 'activity' && renderActivitySection()}
            {section === 'services' && renderServicesSection()}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {error && <div className="admin-error">{error}</div>}

      {sectionOrder.map((section) => renderSection(section))}
    </>
  );
}
