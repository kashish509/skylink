import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Mail, MapPin, Phone, Plane } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Footer from './Footer';
import { LanguageSwitch, useLang } from '../i18n';

const UPDATED = '22 October 2026';

// Renders a translated string that may contain <b>bold</b> and <a href="#/x">link</a> markup.
function Rich({ text }) {
  const out = [];
  const re = /<(b|a)(?: href="([^"]*)")?>(.*?)<\/\1>/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] === 'b' ? <b key={i++}>{m[3]}</b> : <a key={i++} href={m[2]}>{m[3]}</a>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function PageShell({ title, intro, children, notice = true }) {
  const { t, lang } = useLang();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${t(title)} · SkyLink`;
    return () => { document.title = t('SkyLink — Fly further. Live closer.'); };
  }, [title, lang]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#page-main">{t('Skip to content')}</a>
      <header className="info-header">
        <a className="site-header__brand" href="#"><Plane size={17} className="icon-ice" /> SkyLink</a>
        <LanguageSwitch />
        <a className="info-header__back" href="#"><ArrowLeft size={14} /> {t('Back to home')}</a>
      </header>
      <main id="page-main" className="info-page">
        <span className="label-eyebrow">{t('Information')}</span>
        <h1 className="info-page__title">{t(title)}</h1>
        {intro && <p className="info-page__intro">{t(intro)}</p>}
        {notice && (
          <p className="info-page__notice" role="note">
            {t('Last updated {0}. This is template wording for a demonstration project. Have it reviewed by a qualified professional before using it for a real business.', t(UPDATED))}
          </p>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}

function P({ k }) {
  const { t } = useLang();
  return <p><Rich text={t(k)} /></p>;
}
function LI({ k }) {
  const { t } = useLang();
  return <li><Rich text={t(k)} /></li>;
}

const cutoffWord = (n) => (Number(n) === 1 ? 'hour' : 'hours');

function Block({ title, children }) {
  const { t } = useLang();
  return (
    <section className="info-block">
      <h2>{t(title)}</h2>
      {children}
    </section>
  );
}

export function TermsPage() {
  return (
    <PageShell title="Terms of Service" intro="The rules that apply when you search, book and travel with SkyLink.">
      <Block title="1. Using SkyLink">
        <P k={'By creating an account or making a booking you agree to these terms. You must provide accurate information and be authorised to book for every traveller on the reservation.'} />
      </Block>
      <Block title="2. Bookings and fares">
        <P k={"A booking is confirmed once you receive a PNR (booking reference). Fares shown are per traveller for the selected class and may change until the booking is confirmed. Seats are allocated at booking and can't be duplicated across reservations."} />
      </Block>
      <Block title="3. Passenger details">
        <P k={"Names and ages must match each traveller's travel documents. You're responsible for valid identification, visas and any health or entry requirements for your destination."} />
      </Block>
      <Block title="4. Changes and cancellations">
        <P k={"Cancellations are governed by our <a href=\"#/refunds\">Refund & Cancellation policy</a>. Where a flight is cancelled or materially changed by us, we'll contact you using the details on your booking."} />
      </Block>
      <Block title="5. Your account">
        <P k={"Keep your sign-in details private. You're responsible for activity under your account. We may suspend accounts that are used fraudulently or in breach of these terms."} />
      </Block>
      <Block title="6. Acceptable use">
        <P k={"Don't misuse the service: no automated scraping, attempts to bypass security, or reselling of bookings without permission."} />
      </Block>
      <Block title="7. Liability">
        <P k={"We work hard to keep information accurate, but schedules, weather and prices are subject to change. To the extent permitted by law, we aren't liable for indirect or consequential losses arising from use of the service."} />
      </Block>
      <Block title="8. Changes to these terms">
        <P k={'We may update these terms from time to time. The date at the top shows when they were last changed. Continued use means you accept the updated terms.'} />
      </Block>
      <Block title="9. Contact">
        <P k={'Questions about these terms? Reach us through the <a href="#/contact">Contact page</a>.'} />
      </Block>
    </PageShell>
  );
}

export function PrivacyPage() {
  return (
    <PageShell title="Privacy Notice" intro="What SkyLink stores, why, and how you stay in control.">
      <Block title="What we store">
        <ul>
          <LI k={'<b>Account details:</b> name, email, phone, date of birth and password.'} />
          <LI k={'<b>Bookings:</b> passengers, seats, contact details and payment totals. Card details entered at checkout are not saved.'} />
          <LI k={'<b>Messages:</b> anything you send through the Contact form.'} />
          <LI k={'<b>Session:</b> a small record that keeps you signed in on this device.'} />
        </ul>
      </Block>
      <Block title="Where it's stored">
        <P k={"In this version of SkyLink, data is saved in your own browser's local storage on your device. It isn't sent to an advertising or analytics service. Clearing your browser data, or using <b>Reset demo data</b> in the footer, removes it."} />
      </Block>
      <Block title="Cookies and tracking">
        <P k={"We don't use advertising or analytics trackers. Browser storage is used only for essential features: staying signed in and keeping your bookings."} />
      </Block>
      <Block title="Third-party services">
        <ul>
          <LI k={'<b>Open-Meteo</b> provides weather. Your browser sends the coordinates of the city you select (not your location) to open-meteo.com.'} />
          <LI k={'<b>Google Fonts and Unsplash</b> serve fonts and photos, so those providers can see your IP address when the page loads.'} />
        </ul>
      </Block>
      <Block title="Your choices">
        <P k={'You can ask us to correct or delete your information at any time through the <a href="#/contact">Contact page</a>. You can also delete local data yourself by clearing your browser storage.'} />
      </Block>
      <Block title="Security">
        <P k={'We limit access to administrative tools to authorised staff accounts. Never share your password, and sign out on shared devices.'} />
      </Block>
      <Block title="Changes">
        <P k={"If this notice changes in a meaningful way we'll update the date above."} />
      </Block>
    </PageShell>
  );
}

export function RefundsPage() {
  const app = useApp();
  const { t } = useLang();
  const hrs = t(cutoffWord(app.settings.cancellationCutoffHours));
  const fee = Number(app.settings.cancellationFeePercent);
  const cutoff = Number(app.settings.cancellationCutoffHours);
  return (
    <PageShell title="Refund & Cancellation Policy" intro="Plans change. Here's exactly what happens when you cancel.">
      <div className="policy-cards">
        <div className="glass policy-card"><Clock size={20} className="icon-ice" /><b>{cutoff} {hrs}</b><span>{t('Latest cancellation time before departure')}</span></div>
        <div className="glass policy-card"><CheckCircle2 size={20} className="icon-ice" /><b>{100 - fee}%</b><span>{t('Of the fare refunded when you cancel in time')}</span></div>
        <div className="glass policy-card"><Mail size={20} className="icon-ice" /><b>{fee}%</b><span>{t('Cancellation fee deducted from the fare')}</span></div>
      </div>
      <Block title="How to cancel">
        <P k={'Sign in and open <b>My Bookings</b>, or use <b>Track Booking</b> with your PNR, then choose <b>Cancel Booking</b>. The refund amount is shown straight away.'} />
      </Block>
      <Block title="What you get back">
        <p>{t("Cancelling at least {0} {1} before departure refunds {2}% of the booking amount. The remaining {3}% is a cancellation fee. Inside that window, cancellation online isn't available.", cutoff, hrs, 100 - fee, fee)}</p>
      </Block>
      <Block title="When we cancel or change your flight">
        <P k={"If we cancel a flight we'll contact you with options. Please keep your contact details up to date so we can reach you."} />
      </Block>
      <Block title="Need a hand?">
        <P k={"If something doesn't look right, send us your PNR through the <a href=\"#/contact\">Contact page</a>."} />
      </Block>
    </PageShell>
  );
}

export function ContactPage() {
  const app = useApp();
  const { t } = useLang();
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
    if (!r.ok) return setError(t(r.message));
    setSent(r.ref);
  }

  return (
    <PageShell title="Contact us" intro="We usually reply within one working day." notice={false}>
      <div className="contact-grid">
        <form className="glass contact-form" onSubmit={submit} noValidate>
          {sent ? (
            <div className="contact-done" role="status">
              <CheckCircle2 size={34} className="icon-ice" />
              <h2>{t('Message sent')}</h2>
              <p><Rich text={t("Thanks, {0}. Your reference is <b>{1}</b>. We'll reply to {2}.", f.name.split(' ')[0] || t('friend'), sent, f.email)} /></p>
              <a className="btn-outline" href="#">{t('Back to home')}</a>
            </div>
          ) : (
            <>
              <div className="contact-row">
                <label className="contact-field"><span className="field-label">{t('Name')}</span><input className="field-input" value={f.name} onChange={set('name')} autoComplete="name" required /></label>
                <label className="contact-field"><span className="field-label">{t('Email')}</span><input className="field-input" type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></label>
              </div>
              <label className="contact-field"><span className="field-label">{t('Topic')}</span>
                <select className="field-input" value={f.topic} onChange={set('topic')} required>
                  <option value="">{t('Choose a topic…')}</option>
                  {app.contactTopics.map((topic) => (<option key={topic} value={topic}>{t(topic)}</option>))}
                </select>
              </label>
              <label className="contact-field"><span className="field-label">{t('Message')}</span>
                <textarea className="field-input" rows={6} value={f.message} onChange={set('message')} maxLength={1500} placeholder={t("Include your PNR if it's about a booking.")} required />
                <small className="contact-count">{f.message.length}/1500</small>
              </label>
              {/* Honeypot: hidden from people, tempting for bots */}
              <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} name="website" />
              {error && <div className="form-error" role="alert">{error}</div>}
              <button type="submit" className="btn-primary contact-submit">{t('Send message')}</button>
            </>
          )}
        </form>

        <aside className="contact-side">
          <div className="glass contact-card"><Mail size={18} className="icon-ice" /><div><b>{t('Email')}</b><span>{s.supportEmail || t("Use the form and we'll reply by email")}</span></div></div>
          <div className="glass contact-card"><Phone size={18} className="icon-ice" /><div><b>{t('Phone')}</b><span>{s.supportPhone || t('Not available yet')}</span></div></div>
          <div className="glass contact-card"><MapPin size={18} className="icon-ice" /><div><b>{t('Address')}</b><span>{s.businessAddress || t('Online only')}</span></div></div>
          <div className="glass contact-card"><Clock size={18} className="icon-ice" /><div><b>{t('Hours')}</b><span>{t('Mon–Sat, 9:00–18:00 IST')}</span></div></div>
        </aside>
      </div>
    </PageShell>
  );
}

export function NotFoundPage() {
  const { t, lang } = useLang();
  useEffect(() => { document.title = `${t('Page not found')} · SkyLink`; return () => { document.title = t('SkyLink — Fly further. Live closer.'); }; }, [lang]);
  return (
    <div className="status-page">
      <div className="glass status-page__card">
        <span className="status-page__code">404</span>
        <h1 className="status-page__title">{t('This page missed its flight')}</h1>
        <p className="status-page__text">{t("The page you're looking for doesn't exist or has moved.")}</p>
        <div className="status-page__actions">
          <a className="btn-primary" href="#">{t('Back to home')}</a>
          <a className="btn-outline" href="#/contact">{t('Contact support')}</a>
        </div>
      </div>
    </div>
  );
}
