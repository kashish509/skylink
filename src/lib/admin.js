// Admin helpers: roles, permission matrix, CSV export, small formatters.
// NOTE: SkyLink is a front-end-only app (data lives in localStorage), so these
// checks are enforced in the app's data layer (AppContext), not on a server.

export const ROLES = ['user', 'admin', 'superadmin'];

export const ROLE_LABEL = { user: 'User', admin: 'Admin', superadmin: 'Super Admin' };

export const PERMISSION_LABELS = {
  dashboard: 'Access the admin area & overview',
  'reports.view': 'View reports & analytics',
  'users.view': 'View users & profiles',
  'users.status': 'Activate / deactivate user accounts',
  'users.role': 'Change user roles',
  'users.delete': 'Delete user accounts',
  'bookings.manage': 'Edit & delete bookings',
  'flights.manage': 'Create, edit & delete flights',
  'messages.manage': 'Read & manage contact messages',
  'logs.view': 'View the audit log',
  'settings.basic': 'Edit business & notification settings',
  'settings.sensitive': 'Edit cancellation policy',
};

export const PERMS = {
  superadmin: Object.keys(PERMISSION_LABELS),
  admin: [
    'dashboard', 'reports.view', 'users.view', 'users.status',
    'bookings.manage', 'flights.manage', 'messages.manage', 'logs.view', 'settings.basic',
  ],
  user: [],
};

// A deactivated account never holds permissions, whatever its role.
export function can(user, perm) {
  if (!user || user.status === 'inactive') return false;
  return (PERMS[user.role] || []).includes(perm);
}

export function isAdmin(user) {
  return can(user, 'dashboard');
}

export function fullName(u) {
  return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Deleted user';
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fmtDay(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthKey(iso) {
  return dayKey(iso).slice(0, 7);
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDay(iso);
}

export function pctChange(current, previous) {
  if (!previous) return current ? null : 0; // null = no baseline to compare against
  return ((current - previous) / previous) * 100;
}

function csvCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  // Neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function downloadCSV(filename, headers, rows) {
  const lines = [headers.map(csvCell).join(',')];
  rows.forEach((r) => lines.push(r.map(csvCell).join(',')));
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function goAdmin(sub = '') {
  window.location.hash = sub ? `#/admin/${sub}` : '#/admin';
}
