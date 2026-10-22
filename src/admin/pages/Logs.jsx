import React, { useMemo, useState } from 'react';
import { Download, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLE_LABEL, dayKey, downloadCSV, fmtDateTime } from '../../lib/admin';
import { Card, DataTable, PageHeader, Pill, SearchBox, Select } from '../ui';

const tone = (a) => (a.endsWith('.delete') || a.endsWith('.deactivate') ? 'danger' : a.endsWith('.create') || a.endsWith('.activate') || a === 'admin.setup' ? 'ok' : a.startsWith('admin.') ? 'neutral' : 'info');

export default function LogsPage() {
  const { audit } = useApp();
  const [q, setQ] = useState('');
  const [action, setAction] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const actions = useMemo(() => [...new Set(audit.map((a) => a.action))].sort(), [audit]);
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return audit.filter((a) => {
      if (action !== 'all' && a.action !== action) return false;
      const k = dayKey(a.at);
      if (from && k < from) return false;
      if (to && k > to) return false;
      return !n || `${a.actorName} ${a.target} ${a.details} ${a.action}`.toLowerCase().includes(n);
    });
  }, [audit, q, action, from, to]);

  const columns = [
    { key: 'at', label: 'When', sortable: true, render: (a) => fmtDateTime(a.at) },
    { key: 'actorName', label: 'Admin', sortable: true, render: (a) => (<div className="adm-cell-user"><b>{a.actorName}</b><small>{ROLE_LABEL[a.actorRole] || '—'}</small></div>) },
    { key: 'action', label: 'Action', sortable: true, render: (a) => <Pill tone={tone(a.action)}>{a.action}</Pill> },
    { key: 'target', label: 'Affected record', sortable: true },
    { key: 'details', label: 'Details' },
  ];

  function exportCsv() {
    downloadCSV('audit-log.csv', ['When', 'Admin', 'Role', 'Action', 'Affected record', 'Details'], rows.map((a) => [a.at, a.actorName, a.actorRole || '', a.action, a.target, a.details]));
  }

  return (
    <>
      <PageHeader
        title="Activity Logs"
        subtitle="Administrative actions, newest first."
        actions={<button className="adm-btn" onClick={exportCsv} disabled={!rows.length}><Download size={15} /> Export CSV</button>}
      />
      <p className="adm-note"><Lock size={13} /> The audit log is append-only: no screen in the admin area can edit or delete entries.</p>
      <Card>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Search admin, record or details" />
          <Select label="Filter by action" value={action} onChange={setAction} options={[{ value: 'all', label: 'All actions' }, ...actions.map((a) => ({ value: a, label: a }))]} />
          <label className="adm-date"><span>From</span><input type="date" className="adm-select" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="adm-date"><span>To</span><input type="date" className="adm-select" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        <DataTable columns={columns} rows={rows} defaultSort={{ key: 'at', dir: 'desc' }} emptyTitle={audit.length ? 'No entries match your filters' : 'No activity recorded yet'} emptyText="Logins, role changes, edits and deletions are recorded here." />
      </Card>
    </>
  );
}
