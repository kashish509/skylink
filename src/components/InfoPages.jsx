import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Mail, MapPin, Phone, Plane } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Footer from './Footer';

const UPDATED = '22 October 2026';

function PageShell({ title, intro, children, notice = true }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${title} · SkyLink`;
    return () => { document.title = 'SkyLink — Fly further. Live closer.'; };
  }, [title]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#page-main">Skip to content</a>
      <header className="info-header">
        <a className="site-header__brand" href="#"><Plane size={17} className="icon-ice" /> SkyLink</a>
        <a className="info-header__back" href="#"><ArrowLeft size={14} /> Back to home</a>
      </header>
      <main id="page-main" className="info-page">
        <span className="label-eyebrow">Information</span>
        <h1 className="info-page__title">{title}</h1>
        {intro && <p className="info-page__intro">{intro}</p>}
        {notice && (
          <p className="info-page__notice" role="note">
            Last updated {UPDATED}. This is template wording for a demonstration project. Have it reviewed by a qualified professional before using it for a real business.
          </p>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Block({ title, children }) {
  return (
    <section className="info-block">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function TermsPage() {
  return (
    <PageShell title="Terms of Service" intro="The rules that apply when you search, book and travel with SkyLink.">
      <Block title="1. Using SkyLink">
        <p>By creating an account or making a booking you agree to these terms. You must provide accurate information and be authorised to book for every traveller on the reservation.</p>
      </Block>
      <Block title="2. Bookings and fares">
        <p>A booking is confirmed once you receive a PNR (booking reference). Fares shown are per traveller for the selected class and may change until the booking is confirmed. Seats are allocated at booking and can't be duplicated across reservations.</p>
      </Block>
      <Block title="3. Passenger details">
        <p>Names and ages must match each traveller's travel documents. You're responsible for valid identification, visas and any health or entry requirements for your destination.</p>
      </Block>
      <Block title="4. Changes and cancellations">
        <p>Cancellations are governed by our <a href="#/refunds">Refund &amp; Cancellation policy</a>. Where a flight is cancelled or materially changed by us, we'll contact you using the details on your booking.</p>
      </Block>
      <Block title="5. Your account">
        <p>Keep your sign-in details private. You're responsible for activity under your account. We may suspend accounts that are used fraudulently or in breach of these terms.</p>
      </Block>
      <Block title="6. Acceptable use">
        <p>Don't misuse the service: no automated scraping, attempts to bypass security, or reselling of bookings without permission.</p>
      </Block>
      <Block title="7. Liability">
        <p>We work hard to keep information accurate, but schedules, weather and prices are subject to change. To the extent permitted by law, we aren't liable for indirect or consequential losses arising from use of the service.</p>
      </Block>
      <Block title="8. Changes to these terms">
        <p>We may update these terms from time to time. The date at the top shows when they were last changed. Continued use means you accept the updated terms.</p>
      </Block>
      <Block title="9. Contact">
        <p>Questions about these terms? Reach us through the <a href="#/contact">Contact page</a>.</p>
      </Block>
    </PageShell>
  );
}

export function PrivacyPage() {
  return (
    <PageShell title="Privacy Notice" intro="What SkyLink stores, why, and how you stay in control.">
      <Block title="What we store">
        <ul>
          <li><b>Account details:</b> name, email, phone, date of birth and password.</li>
          <li><b>Bookings:</b> passengers, seats, contact details and payment totals. Card details entered at checkout are not saved.</li>
          <li><b>Messages:</b> anything you send through the Contact form.</li>
          <li><b>Session:</b> a small record that keeps you signed in on this device.</li>
        </ul>
      </Block>
      <Block title="Where it's stored">
        <p>In this version of SkyLink, data is saved in your own browser's local storage on your device. It isn't sent to an advertising or analytics service. Clearing your browser data, or using <b>Reset demo data</b> in the footer, removes it.</p>
      </Block>
      <Block title="Cookies and tracking">
        <p>We don't use advertising or analytics trackers. Browser storage is used only for essential features: staying signed in and keeping your bookings.</p>
      </Block>
      <Block title="Third-party services">
        <ul>
          <li><b>Open-Meteo</b> provides weather. Your browser sends the coordinates of the city you select (not your location) to open-meteo.com.</li>
          <li><b>Google Fonts and Unsplash</b> serve fonts and photos, so those providers can see your IP address when the page loads.</li>
        </ul>
      </Block>
      <Block title="Your choices">
        <p>You can ask us to correct or delete your information at any time through the <a href="#/contact">Contact page</a>. You can also delete local data yourself by clearing your browser storage.</p>
      </Block>
      <Block title="Security">
        <p>We limit access to administrative tools to authorised staff accounts. Never share your password, and sign out on shared devices.</p>
      </Block>
      <Block title="Changes">
        <p>If this notice changes in a meaningful way we'll update the date above.</p>
      </Block>
    </PageShell>
  );
}

export function RefundsPage() {
  const app = useApp();
  const fee = Number(app.settings.cancellationFeePercent);
  const cutoff = Number(app.settings.cancellationCutoffHours);
  return (
    <PageShell title="Refund & Cancellation Policy" intro="Plans change. Here's exactly what happens when you cancel.">
      <div className="policy-cards">
        <div className="glass policy-card"><Clock size={20} className="icon-ice" /><b>{cutoff} hour{cutoff === 1 ? '' : 's'}</b><span>Latest cancellation time before departure</span></div>
        <div className="glass policy-card"><CheckCircle2 size={20} className="icon-ice" /><b>{100 - fee}%</b><span>Of the fare refunded when you cancel in time</span></div>
        <div className="glass policy-card"><Mail size={20} className="icon-ice" /><b>{fee}%</b><span>Cancellation fee deducted from the fare</span></div>
      </div>
      <Block title="How to cancel">
        <p>Sign in and open <b>My Bookings</b>, or use <b>Track Booking</b> with your PNR, then choose <b>Cancel Booking</b>. The refund amount is shown straight away.</p>
      </Block>
      <Block title="What you get back">
        <p>Cancelling at least {cutoff} hour{cutoff === 1 ? '' : 's'} before departure refunds {100 - fee}% of the booking amount. The remaining {fee}% is a cancellation fee. Inside that window, cancellation online isn't available.</p>
      </Block>
      <Block title="When we cancel or change your flight">
        <p>If we cancel a flight we'll contact you with options. Please keep your contact details up to date so we can reach you.</p>
      </Block>
      <Block title="Need a hand?">
        <p>If something doesn't look right, send us your PNR through the <a href="#/contact">Contact page</a>.</p>
      </Block>
    </PageShell>
  );
}

export function ContactPage() {
  const app = useApp();
  const user = app.currentUser;
  const s = app.settings;
  const [f, setF] = useState({ name: user ? `${user.firstName} ${user.lastName}` : '', email: user?.email || '', topic: '', message: '', website: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    setError('');
    const r = app.sendContactMessage(f);
    if (!r.ok) return setError(r.message);
    setSent(r.ref);
  }

  return (
    <PageShell title="Contact us" intro="We usually reply within one working day." notice={false}>
      <div className="contact-grid">
        <form className="glass contact-form" onSubmit={submit} noValidate>
          {sent ? (
            <div className="contact-done" role="status">
              <CheckCircle2 size={34} className="icon-ice" />
              <h2>Message sent</h2>
              <p>Thanks, {f.name.split(' ')[0] || 'friend'}. Your reference is <b>{sent}</b>. We'll reply to {f.email}.</p>
              <a className="btn-outline" href="#">Back to home</a>
            </div>
          ) : (
            <>
              <div className="contact-row">
                <label className="contact-field"><span className="field-label">Name</span><input className="field-input" value={f.name} onChange={set('name')} autoComplete="name" required /></label>
                <label className="contact-field"><span className="field-label">Email</span><input className="field-input" type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></label>
              </div>
              <label className="contact-field"><span className="field-label">Topic</span>
                <select className="field-input" value={f.topic} onChange={set('topic')} required>
                  <option value="">Choose a topic…</option>
                  {app.contactTopics.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </label>
              <label className="contact-field"><span className="field-label">Message</span>
                <textarea className="field-input" rows={6} value={f.message} onChange={set('message')} maxLength={1500} placeholder="Include your PNR if it's about a booking." required />
                <small className="contact-count">{f.message.length}/1500</small>
              </label>
              {/* Honeypot: hidden from people, tempting for bots */}
              <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} name="website" />
              {error && <div className="form-error" role="alert">{error}</div>}
              <button type="submit" className="btn-primary contact-submit">Send message</button>
            </>
          )}
        </form>

        <aside className="contact-side">
          <div className="glass contact-card"><Mail size={18} className="icon-ice" /><div><b>Email</b><span>{s.supportEmail || 'Use the form and we\'ll reply by email'}</span></div></div>
          <div className="glass contact-card"><Phone size={18} className="icon-ice" /><div><b>Phone</b><span>{s.supportPhone || 'Not available yet'}</span></div></div>
          <div className="glass contact-card"><MapPin size={18} className="icon-ice" /><div><b>Address</b><span>{s.businessAddress || 'Online only'}</span></div></div>
          <div className="glass contact-card"><Clock size={18} className="icon-ice" /><div><b>Hours</b><span>Mon–Sat, 9:00–18:00 IST</span></div></div>
        </aside>
      </div>
    </PageShell>
  );
}

export function NotFoundPage() {
  useEffect(() => { document.title = 'Page not found · SkyLink'; return () => { document.title = 'SkyLink — Fly further. Live closer.'; }; }, []);
  return (
    <div className="status-page">
      <div className="glass status-page__card">
        <span className="status-page__code">404</span>
        <h1 className="status-page__title">This page missed its flight</h1>
        <p className="status-page__text">The page you're looking for doesn't exist or has moved.</p>
        <div className="status-page__actions">
          <a className="btn-primary" href="#">Back to home</a>
          <a className="btn-outline" href="#/contact">Contact support</a>
        </div>
      </div>
    </div>
  );
}
