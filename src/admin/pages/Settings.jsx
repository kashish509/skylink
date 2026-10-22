import React, { useState } from 'react';
import { Check, Lock, Minus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PERMISSION_LABELS, PERMS, ROLE_LABEL, can, fullName } from '../../lib/admin';
import { Card, Field, PageHeader, Pill } from '../ui';

export default function SettingsPage() {
  const app = useApp();
  const { settings, users, currentUser } = app;
  const [s, setS] = useState({ ...settings });
  const [error, setError] = useState('');
  const sensitiveOk = can(currentUser, 'settings.sensitive');
  const set = (k) => (e) => setS((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const dirty = JSON.stringify(s) !== JSON.stringify(settings);

  function save(e) {
    e.preventDefault();
    setError('');
    const r = app.adminSaveSettings(s);
    if (!r.ok) return setError(r.message);
    app.notify(r.unchanged ? 'No changes to save.' : 'Settings saved.');
  }

  const admins = users.filter((u) => u.role !== 'user');

  return (
    <>
      <PageHeader title="Settings" subtitle="Business details, notifications and operating policy." />
      <form onSubmit={save} noValidate>
        <Card title="Business information">
          <div className="adm-grid-2">
            <Field label="Business name"><input className="field-input" value={s.businessName} onChange={set('businessName')} /></Field>
            <Field label="Support email"><input className="field-input" type="email" value={s.supportEmail} onChange={set('supportEmail')} /></Field>
            <Field label="Support phone"><input className="field-input" value={s.supportPhone} onChange={set('supportPhone')} /></Field>
            <Field label="Address"><input className="field-input" value={s.businessAddress} onChange={set('businessAddress')} maxLength={200} /></Field>
          </div>
        </Card>

        <Card title="Notification preferences" className="adm-gap">
          <p className="adm-muted">Choose which events appear in the Overview activity feed.</p>
          {[['notifyNewBooking', 'New bookings'], ['notifyCancellation', 'Cancellations'], ['notifyNewUser', 'New user registrations']].map(([k, label]) => (
            <label key={k} className="adm-check"><input type="checkbox" checked={!!s[k]} onChange={set(k)} /> {label}</label>
          ))}
        </Card>

        <Card title="Operational settings" className="adm-gap">
          {!sensitiveOk && <p className="adm-note"><Lock size={13} /> Only a Super Admin can change the cancellation policy.</p>}
          <div className="adm-grid-2">
            <Field label="Cancellation fee (%)" hint="Deducted from the refund when a customer cancels."><input className="field-input" type="number" min="0" max="100" value={s.cancellationFeePercent} onChange={set('cancellationFeePercent')} disabled={!sensitiveOk} /></Field>
            <Field label="Cancellation cutoff (hours before departure)" hint="Customers can't cancel inside this window."><input className="field-input" type="number" min="0" max="720" value={s.cancellationCutoffHours} onChange={set('cancellationCutoffHours')} disabled={!sensitiveOk} /></Field>
          </div>
        </Card>

        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="adm-save-row">
          <button type="button" className="adm-btn" disabled={!dirty} onClick={() => { setS({ ...settings }); setError(''); }}>Reset</button>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={!dirty}>Save settings</button>
        </div>
      </form>

      <Card title="Roles & permissions" className="adm-gap">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Permission</th><th>Admin</th><th>Super Admin</th></tr></thead>
            <tbody>
              {Object.entries(PERMISSION_LABELS).map(([k, label]) => (
                <tr key={k}>
                  <td>{label}</td>
                  {['admin', 'superadmin'].map((r) => (<td key={r}>{PERMS[r].includes(k) ? <Check size={15} className="adm-yes" aria-label="Allowed" /> : <Minus size={15} className="adm-no" aria-label="Not allowed" />}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="adm-subhead">Administrator accounts</h3>
        <ul className="adm-mini-list">
          {admins.map((u) => (<li key={u.id}><b>{fullName(u)}</b><span>{u.email}</span><Pill tone={u.role === 'superadmin' ? 'accent' : 'info'}>{ROLE_LABEL[u.role]}</Pill></li>))}
        </ul>
        {can(currentUser, 'users.role') && <p className="adm-muted">Change a role from Users → View profile.</p>}
      </Card>
    </>
  );
}
