import React, { useMemo, useState } from 'react';
import { CheckCircle2, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fmtDateTime } from '../../lib/admin';
import { Card, ConfirmDialog, DataTable, Modal, PageHeader, Pill, SearchBox, Select } from '../ui';

export default function MessagesPage() {
  const app = useApp();
  const { messages } = app;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [del, setDel] = useState(null);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return messages.filter((m) => (status === 'all' || m.status === status) && (!n || `${m.ref} ${m.name} ${m.email} ${m.topic} ${m.message}`.toLowerCase().includes(n)));
  }, [messages, q, status]);

  const result = (r, ok) => app.notify(r.ok ? ok : r.message, r.ok ? 'ok' : 'error');
  const open = openId ? messages.find((m) => m.id === openId) : null;
  const newCount = messages.filter((m) => m.status === 'new').length;

  const columns = [
    { key: 'ref', label: 'Ref', sortable: true, render: (m) => <b>{m.ref}</b> },
    { key: 'from', label: 'From', sortable: true, sortValue: (m) => m.name.toLowerCase(), render: (m) => (<div className="adm-cell-user"><b>{m.name}</b><small>{m.email}</small></div>) },
    { key: 'topic', label: 'Topic', sortable: true },
    { key: 'at', label: 'Received', sortable: true, render: (m) => fmtDateTime(m.at) },
    { key: 'status', label: 'Status', sortable: true, render: (m) => <Pill tone={m.status === 'new' ? 'info' : 'ok'}>{m.status === 'new' ? 'New' : 'Resolved'}</Pill> },
    {
      key: 'actions', label: 'Actions', render: (m) => (
        <div className="adm-actions">
          <button className="adm-icon-btn" onClick={() => setOpenId(m.id)} aria-label={`Open message ${m.ref}`} title="Open"><Eye size={15} /></button>
          <button className="adm-icon-btn" onClick={() => result(app.adminSetMessageStatus(m.id, m.status === 'new' ? 'resolved' : 'new'), 'Message updated.')} aria-label={m.status === 'new' ? 'Mark resolved' : 'Reopen'} title={m.status === 'new' ? 'Mark resolved' : 'Reopen'}>
            {m.status === 'new' ? <CheckCircle2 size={15} /> : <RotateCcw size={15} />}
          </button>
          <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setDel(m)} aria-label={`Delete ${m.ref}`} title="Delete"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Messages" subtitle={`${newCount} new · ${messages.length} total from the website contact form`} />
      <Card>
        <div className="adm-toolbar">
          <SearchBox value={q} onChange={setQ} placeholder="Search ref, name, email or text" />
          <Select label="Filter by status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All' }, { value: 'new', label: 'New' }, { value: 'resolved', label: 'Resolved' }]} />
        </div>
        <DataTable columns={columns} rows={rows} defaultSort={{ key: 'at', dir: 'desc' }} emptyTitle={messages.length ? 'No messages match your filters' : 'No messages yet'} emptyText="Messages sent from the Contact page appear here." />
      </Card>

      {open && (
        <Modal
          title={`${open.topic} · ${open.ref}`}
          onClose={() => setOpenId(null)}
          footer={(
            <>
              <a className="adm-btn" href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.topic} (${open.ref})`)}`}>Reply by email</a>
              <button className="adm-btn adm-btn--primary" onClick={() => { result(app.adminSetMessageStatus(open.id, open.status === 'new' ? 'resolved' : 'new'), 'Message updated.'); }}>
                {open.status === 'new' ? 'Mark resolved' : 'Reopen'}
              </button>
            </>
          )}
        >
          <dl className="adm-dl">
            <div><dt>From</dt><dd>{open.name}</dd></div>
            <div><dt>Email</dt><dd>{open.email}</dd></div>
            <div><dt>Received</dt><dd>{fmtDateTime(open.at)}</dd></div>
            <div><dt>Status</dt><dd>{open.status === 'new' ? 'New' : 'Resolved'}</dd></div>
          </dl>
          <p className="adm-msg-body">{open.message}</p>
        </Modal>
      )}
      {del && (
        <ConfirmDialog danger title="Delete message?" message={`Message ${del.ref} from ${del.name} will be permanently removed.`} confirmLabel="Delete" onCancel={() => setDel(null)} onConfirm={() => { result(app.adminDeleteMessage(del.id), 'Message deleted.'); setDel(null); }} />
      )}
    </>
  );
}
