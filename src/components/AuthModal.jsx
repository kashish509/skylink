import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AuthModal() {
  const app = useApp();
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
        <button className="modal__close" onClick={close} aria-label="Close"><X size={18} /></button>
        {!forgot ? (
          <>
            <div className="auth-tabs">
              <TabBtn active={tab === 'signin'} onClick={() => setTab('signin')}>Login</TabBtn>
              <TabBtn active={tab === 'signup'} onClick={() => setTab('signup')}>Register</TabBtn>
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
  const [visible, setVisible] = useState(false);
  return (
    <label>
      <span className="field-label">{label}</span>
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
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

function SignInForm({ onSuccess, onForgot }) {
  const app = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    const res = app.login(email, password);
    if (!res.ok) return setError(res.message);
    onSuccess();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <h3 className="auth-form__title">Welcome back</h3>
      <p className="auth-form__subtitle">Sign in to search fares, book seats and manage your trips.</p>
      <label><span className="field-label">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field-input" /></label>
      <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="********" />
      <Err>{error}</Err>
      <div className="auth-form__actions">
        <button type="submit" className="btn-primary">Login</button>
        <button type="button" className="btn-link" onClick={onForgot}>Forgot Password?</button>
      </div>
    </form>
  );
}

function SignUpForm({ onSuccess, onCancel }) {
  const app = useApp();
  const [form, setForm] = useState({ title: 'Mr', firstName: '', lastName: '', email: '', password: '', confirmPassword: '', dob: '', phone: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const res = app.register(form);
    if (!res.ok) return setError(res.message);
    app.notify(`Account created \u2014 welcome, ${res.user.firstName}!`);
    onSuccess();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <h3 className="auth-form__title">Create your account</h3>
      <p className="auth-form__subtitle">Registration is required before booking a flight.</p>
      <div className="auth-form__grid">
        <label><span className="field-label">Title</span><select value={form.title} onChange={set('title')} className="field-input"><option>Mr</option><option>Ms</option><option>Mrs</option></select></label>
        <label><span className="field-label">First Name</span><input required value={form.firstName} onChange={set('firstName')} className="field-input" /></label>
        <label><span className="field-label">Last Name</span><input required value={form.lastName} onChange={set('lastName')} className="field-input" /></label>
        <label><span className="field-label">Email</span><input type="email" required value={form.email} onChange={set('email')} className="field-input" /></label>
        <PasswordField label="Password" value={form.password} onChange={set('password')} />
        <PasswordField label="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} />
        <label><span className="field-label">Date of Birth</span><input type="date" required value={form.dob} onChange={set('dob')} className="field-input" /></label>
        <label><span className="field-label">Phone Number</span><input required value={form.phone} onChange={set('phone')} placeholder="10-digit number" className="field-input" /></label>
      </div>
      <Err>{error}</Err>
      <div className="auth-form__actions">
        <button type="submit" className="btn-primary">Sign Up</button>
        <button type="button" className="btn-link" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function ForgotPasswordForm({ onDone }) {
  const app = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function submit(e) {
    e.preventDefault();
    const res = app.resetPassword(email, password, confirmPassword);
    if (!res.ok) return setError(res.message);
    setSuccess(true);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <h3 className="auth-form__title">Reset password</h3>
      {success ? (
        <>
          <p className="auth-form__subtitle">Your password has been updated. You can now log in with your new password.</p>
          <div><button type="button" className="btn-primary" onClick={onDone}>Back to Login</button></div>
        </>
      ) : (
        <>
          <p className="auth-form__subtitle">Enter your account email and choose a new password.</p>
          <label><span className="field-label">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" /></label>
          <PasswordField label="New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <PasswordField label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <Err>{error}</Err>
          <div className="auth-form__actions">
            <button type="submit" className="btn-primary">Update Password</button>
            <button type="button" className="btn-link" onClick={onDone}>Back</button>
          </div>
        </>
      )}
    </form>
  );
}
