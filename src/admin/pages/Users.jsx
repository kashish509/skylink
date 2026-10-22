import React, { useMemo, useState } from 'react';
import { Eye, Trash2, UserCheck, UserX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import { ROLES, ROLE_LABEL, can, dayKey, fmtDay, fmtDateTime, fullName } from '../../lib/admin';
import { Card, ConfirmDialog, DataTable, Modal, PageHeader, Pill, SearchBox, Select } from '../ui';

const roleTone = { superadmin: 'accent', admin: 'info', user: 'neutral' };

export default function UsersPage() {
  const app = useApp();
  const { users, bookings, audit, currentUser } = app;
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [view, setView] = useState(null);       // user id for profile modal
  const [confirm, setConfirm] = useState(null); // { type, user }

  const counts = useMemo(() => {
    const c = {};
    bookings.forEach((b) => { if (b.userId) c[b.userId] = (c[b.userId] || 0) + 1; });
    return c;
  }, [bookings]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (needle && !`${fullName(u)} ${u.email} ${u.phone || ''}`.toLowerCase().includes(needle)) return false;
      if (role !== 'all' && u.role !== role) return false;
      if (status !== 'all' && (u.status || 'active') !== status) return false;
      if (from || to) {
        if (!u.createdAt) return false;
        const k = dayKey(u.createdAt);
        if (from && k < from) return false;
        if (to && k > to) return false;
      }
      return true;
    });
  }, [users, q, role, status, from, to]);

  function result(res, okMsg) {
    app.notify(res.ok ? okMsg : res.message, res.ok ? 'ok' : 'error');
  }

  function canTouch(u) {
    if (u.id === currentUser.id) return false;
    if (u.role !== 'user' && currentUser.role !== 'superadmin') return false;
    return true;
  }

  const columns = [
    { key: 'name', label: 'User', sortable: true, sortValue: (u) => fullName(u).toLowerCase(), render: (u) => (<div className="adm-cell-user"><b>{fullName(u)}{u.id === currentUser.id && <small> (you)</small>}</b><small>{u.email}</small></div>) },
    { key: 'role', label: 'Role', sortable: true, render: (u) => <Pill tone={roleTone[u.role]}>{ROLE_LABEL[u.role]}</Pill> },
    { key: 'status', label: 'Status', sortable: true, render: (u) => <Pill tone={u.status === 'inactive' ? 'danger' : 'ok'}>{u.status === 'inactive' ? 'Inactive' : 'Active'}</Pill> },
    { key: 'createdAt', label: 'Registered', sortable: true, render: (u) => fmtDay(u.createdAt) },
    { key: 'lastLoginAt', label: 'Last login', sortable: true, render: (u) => fmtDay(u.lastLoginAt) },
    { key: 'bookings', label: 'Bookings', sortable: true, sortValue: (u) => counts[u.id] || 0, render: (u) => counts[u.id] || 0 },
    {
      key: 'actions', label: 'Actions', render: (u) => (
        <div className="adm-actions">
          <button className="adm-icon-btn" onClick={() => setView(u.id)} aria-label={`View ${fullName(u)}`} title="View profile"><Eye size={15} /></button>
          {can(currentUser, 'users.status') && canTouch(u) && (
            <button className="adm-icon-btn" onClick={() => setConfirm({ type: u.status === 'inactive' ? 'activate' : 'deactivate', user: u })} aria-label={u.status === 'inactive' ? 'Activate' : 'Deactivate'} title={u.status === 'inactive' ? 'Activate' : 'Deactivate'}>
              {u.status === 'inactive' ? <UserCheck size={15} /> : <UserX size={15} />}
            </button>
          )}
          {can(currentUser, 'users.delete') && u.id !== currentUser.id && (
            <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setConfirm({ type: 'delete', user: u })} aria-label={`Delete ${fullName(u)}`} title="Delete"><Trash2 size={15} /></button>
          )}
        </div>
      ),
    },
  ];

  function runConfirm() {
    const { type, user } = confirm;
    if (type === 'delete') result(app.adminDeleteUser(user.id), 'User deleted.');
    else result(app.adminSetUserStatus(user.id, type === 'activate' ? 'active' : 'inactive'), type === 'activate' ? 'Account activated.' : 'Account deactivated.');
    setConfirm(null);
  }

  const profile = view ? users.find((u) => u.id === view) : null;

  return (
    <>
      <PageHeader title="Users" subtitle={`${users.length} registered account${users.length === 1 ? '' : 's'}`} />
      <Card>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Search name, email or phone" />
          <Select label="Filter by role" value={role} onChange={setRole} options={[{ value: 'all', label: 'All roles' }, ...ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))]} />
          <Select label="Filter by status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          <label className="adm-date"><span>From</span><input type="date" className="adm-select" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="adm-date"><span>To</span><input type="date" className="adm-select" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          {(q || role !== 'all' || status !== 'all' || from || to) && (
            <button className="adm-btn" onClick={() => { setQ(''); setRole('all'); setStatus('all'); setFrom(''); setTo(''); }}>Clear</button>
          )}
        </div>
        <DataTable columns={columns} rows={rows} defaultSort={{ key: 'createdAt', dir: 'desc' }} emptyTitle={users.length ? 'No users match your filters' : 'No registered users yet'} emptyText={users.length ? 'Try clearing a filter.' : 'Accounts appear here as people register on the site.'} />
      </Card>

      {profile && (
        <ProfileModal
          user={profile}
          bookings={bookings.filter((b) => b.userId === profile.id)}
          activity={audit.filter((a) => a.actorId === profile.id || a.target.includes(`<${profile.email}>`)).slice(0, 8)}
          canRole={can(currentUser, 'users.role') && profile.id !== currentUser.id}
          onRole={(r) => result(app.adminSetUserRole(profile.id, r), 'Role updated.')}
          onClose={() => setView(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          danger={confirm.type !== 'activate'}
          title={confirm.type === 'delete' ? 'Delete account?' : confirm.type === 'activate' ? 'Activate account?' : 'Deactivate account?'}
          message={confirm.type === 'delete'
            ? `${fullName(confirm.user)} will be permanently removed. Their bookings are kept for records. This can't be undone.`
            : confirm.type === 'activate'
              ? `${fullName(confirm.user)} will be able to sign in again.`
              : `${fullName(confirm.user)} will be blocked from signing in.`}
          confirmLabel={confirm.type === 'delete' ? 'Delete' : confirm.type === 'activate' ? 'Activate' : 'Deactivate'}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

function ProfileModal({ user, bookings, activity, canRole, onRole, onClose }) {
  const spent = bookings.filter((b) => b.status === 'Confirmed').reduce((s, b) => s + b.amount, 0);
  const detail = [
    ['Email', user.email], ['Phone', user.phone || '—'], ['Date of birth', user.dob ? fmtDay(user.dob) : '—'],
    ['Registered', fmtDateTime(user.createdAt)], ['Last login', fmtDateTime(user.lastLoginAt)], ['Total spent', formatINR(spent)],
  ];
  return (
    <Modal title={fullName(user)} size="lg" onClose={onClose}>
      <div className="adm-profile-head">
        <Pill tone={roleTone[user.role]}>{ROLE_LABEL[user.role]}</Pill>
        <Pill tone={user.status === 'inactive' ? 'danger' : 'ok'}>{user.status === 'inactive' ? 'Inactive' : 'Active'}</Pill>
      </div>
      <dl className="adm-dl">
        {detail.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
      </dl>
      {canRole && (
        <div className="adm-role-edit">
          <span className="field-label">Role</span>
          <Select label="Change role" value={user.role} onChange={onRole} options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
        </div>
      )}
      <h3 className="adm-subhead">Bookings ({bookings.length})</h3>
      {bookings.length ? (
        <ul className="adm-mini-list">
          {bookings.slice(0, 6).map((b) => (<li key={b.id}><b>{b.pnr}</b><span>{b.cls} · {formatINR(b.amount)}</span><Pill tone={b.status === 'Confirmed' ? 'ok' : 'danger'}>{b.status}</Pill></li>))}
        </ul>
      ) : <p className="adm-muted">No bookings yet.</p>}
      <h3 className="adm-subhead">Recent activity</h3>
      {activity.length ? (
        <ul className="adm-mini-list">
          {activity.map((a) => (<li key={a.id}><b>{a.action}</b><span>{a.details || a.target}</span><small>{fmtDateTime(a.at)}</small></li>))}
        </ul>
      ) : <p className="adm-muted">No admin activity recorded for this account.</p>}
    </Modal>
  );
}
