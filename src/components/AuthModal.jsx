import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';

export default function AuthModal() {
  const app = useApp();
  const t = useT();
  const initialTab = app.authModal === 'signup' ? 'signup' : 'signin';
  const [tab, setTab] = useState(initialTab);
  const [forgot, setForgot] = useState(false);

  if (!app.authModal) return null;

  function close() {
    app.setAuthModal(null);
    app.setPendingBooking(null);
    setForgot(false);
  }

  function afterLoginSuccess() {
    close();
    if (app.pendingBooking) {
      app.pendingBooking.resume();
    } else {
      app.notify('Signed in successfully.');
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="glass modal modal--sm anim-pop-in">
        <button className="modal__close" onClick={close} aria-label={t('Close')}><X size={18} /></button>
        {!forgot ? (
          <>
            <div className="auth-tabs">
              <TabBtn active={tab === 'signin'} onClick={() => setTab('signin')}>{t('Login')}</TabBtn>
              <TabBtn active={tab === 'signup'} onClick={() => setTab('signup')}>{t('Register')}</TabBtn>
            </div>
            <div className="modal__body">
              {tab === 'signin' && <SignInForm onSuccess={afterLoginSuccess} onForgot={() => setForgot(true)} />}
              {tab === 'signup' && <SignUpForm onSuccess={afterLoginSuccess} onCancel={close} />}
            </div>
          </>
        ) : (
          <div className="modal__body">
            <ForgotPasswordForm onDone={() => setForgot(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      className={`auth-tab ${active ? 'auth-tab--active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Err({ children }) {
  if (!children) return null;
  return <div className="form-error">{children}</div>;
}

function PasswordField({ label, value, onChange, placeholder, id }) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  return (
    <label>
      <span className="field-label">{t(label)}</span>
      <div className="password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="field-input"
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('Hide password') : t('Show password')}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

function SignInForm({ onSuccess, onForgot }) {
  const app = useApp();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const res = app.login(email, password);
    if (!res.ok) return setError(t(res.message));
    onSuccess();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <h3 className="auth-form__title">{t('Welcome back')}</h3>
      <p className="auth-form__subtitle">{t('Sign in to search fares, book seats and manage your trips.')}</p>
      <label><span className="field-label">{t('Email')}</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('you@example.com')} className="field-input" /></label>
      <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
      <Err>{error}</Err>
      <div className="auth-form__actions">
        <button type="submit" className="btn-primary">{t('Login')}</button>
        <button type="button" className="btn-link" onClick={onForgot}>{t('Forgot Password?')}</button>
      </div>
    </form>
  );
}

function SignUpForm({ onSuccess, onCancel }) {
  const app = useApp();
  const t = useT();
  const [form, setForm] = useState({ title: 'Mr', firstName: '', lastName: '', email: '', password: '', confirmPassword: '', dob: '', phone: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const res = app.register(form);
    if (!res.ok) return setError(t(res.message));
    app.notify(t('Account created — welcome, {0}!', res.user.firstName));
    onSuccess();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <h3 className="auth-form__title">{t('Create your account')}</h3>
      <p className="auth-form__subtitle">{t('Registration is required before booking a flight.')}</p>
      <div className="auth-form__grid">
        <label><span className="field-label">{t('Title')}</span><select value={form.title} onChange={set('title')} className="field-input"><option value="Mr">{t('Mr')}</option><option value="Ms">{t('Ms')}</option><option value="Mrs">{t('Mrs')}</option></select></label>
        <label><span className="field-label">{t('First Name')}</span><input required value={form.firstName} onChange={set('firstName')} className="field-input" /></label>
        <label><span className="field-label">{t('Last Name')}</span><input required value={form.lastName} onChange={set('lastName')} className="field-input" /></label>
        <label><span className="field-label">{t('Email')}</span><input type="email" required value={form.email} onChange={set('email')} className="field-input" /></label>
        <PasswordField label="Password" value={form.password} onChange={set('password')} />
        <PasswordField label="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} />
        <label><span className="field-label">{t('Date of Birth')}</span><input type="date" required value={form.dob} onChange={set('dob')} className="field-input" /></label>
        <label><span className="field-label">{t('Phone Number')}</span><input required value={form.phone} onChange={set('phone')} placeholder={t('10-digit number')} className="field-input" /></label>
      </div>
      <Err>{error}</Err>
      <div className="auth-form__actions">
        <button type="submit" className="btn-primary">{t('Sign Up')}</button>
        <button type="button" className="btn-link" onClick={onCancel}>{t('Cancel')}</button>
      </div>
    </form>
  );
}

function ForgotPasswordForm({ onDone }) {
  const app = useApp();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function submit(e) {
    e.preventDefault();
    const res = app.resetPassword(email, password, confirmPassword);
    if (!res.ok) return setError(t(res.message));
    setSuccess(true);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <h3 className="auth-form__title">{t('Reset password')}</h3>
      {success ? (
        <>
          <p className="auth-form__subtitle">{t('Your password has been updated. You can now log in with your new password.')}</p>
          <div><button type="button" className="btn-primary" onClick={onDone}>{t('Back to Login')}</button></div>
        </>
      ) : (
        <>
          <p className="auth-form__subtitle">{t('Enter your account email and choose a new password.')}</p>
          <label><span className="field-label">{t('Email')}</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" /></label>
          <PasswordField label="New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <PasswordField label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <Err>{error}</Err>
          <div className="auth-form__actions">
            <button type="submit" className="btn-primary">{t('Update Password')}</button>
            <button type="button" className="btn-link" onClick={onDone}>{t('Back')}</button>
          </div>
        </>
      )}
    </form>
  );
}
