import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, ChevronDown, LayoutDashboard, LogOut, Menu, Plane, Ticket, UserRound, X } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import CinematicHero from './components/CinematicHero';
import FlightSearch from './components/FlightSearch';
import Destinations from './components/Destinations';
import WhySkyLink from './components/WhySkyLink';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProfilePanel from './components/ProfilePanel';
import EnquiryModal from './components/EnquiryModal';
import AdminApp from './admin/AdminApp';
import WeatherSection from './components/WeatherSection';
import FaqSection from './components/FaqSection';
import ErrorBoundary from './components/ErrorBoundary';
import { TermsPage, PrivacyPage, RefundsPage, ContactPage, NotFoundPage } from './components/InfoPages';
import { isAdmin } from './lib/admin';
import './styles.css';

const navLinks = [
  { href: '#flights', label: 'Flights' },
  { href: '#destinations', label: 'Destinations' },
  { href: '#weather', label: 'Weather' },
  { href: '#experience', label: 'Experience' },
];

function Nav({ menu, setMenu }) {
  const app = useApp();
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const user = app.currentUser;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
      <a className="site-header__brand" href="#">
        <Plane size={17} className="icon-ice" />
        SkyLink
      </a>

      <nav className="site-nav">
        {navLinks.map((l) => (
          <a key={l.href} href={l.href} className="site-nav__link">
            {l.label}
          </a>
        ))}
        <button className="site-nav__button" onClick={() => app.setEnquiryOpen(true)}>
          Track Booking
        </button>
        <a href="#footer" className="site-nav__link">Support</a>
      </nav>

      <div className="site-header__actions">
        {user ? (
          <div className="account-menu">
            <button
              className="account-trigger"
              onClick={() => setAccountOpen((v) => !v)}
            >
              <UserRound size={15} className="icon-ice" /> {user.firstName} <ChevronDown size={13} className={`account-trigger__chevron ${accountOpen ? 'account-trigger__chevron--open' : ''}`} />
            </button>
            <AccountDropdown open={accountOpen}>
              <DropdownItem icon={<Ticket size={14} />} onClick={() => { app.setProfileOpen(true); setAccountOpen(false); }}>My Bookings</DropdownItem>
              <DropdownItem icon={<Ticket size={14} />} onClick={() => { app.setEnquiryOpen(true); setAccountOpen(false); }}>Track / Cancel by PNR</DropdownItem>
              {isAdmin(user) && (
                <DropdownItem icon={<LayoutDashboard size={14} />} onClick={() => { window.location.hash = '#/admin'; setAccountOpen(false); }}>Admin Dashboard</DropdownItem>
              )}
              <DropdownItem icon={<LogOut size={14} />} onClick={() => { app.logout(); setAccountOpen(false); }}>Logout</DropdownItem>
            </AccountDropdown>
          </div>
        ) : (
          <button
            className="signin-btn"
            onClick={() => app.setAuthModal('signin')}
          >
            <UserRound size={15} /> Sign In
          </button>
        )}

        <a
          href="#flights"
          className="book-cta"
          onClick={() => setMenu(false)}
        >
          Book a Flight <ArrowRight size={14} />
        </a>

        <button
          className="menu-toggle"
          onClick={() => setMenu(!menu)}
          aria-label="Menu"
        >
          {menu ? <X /> : <Menu />}
        </button>
      </div>

      {menu && (
        <nav className="mobile-nav anim-drop-in">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="mobile-nav__link" onClick={() => setMenu(false)}>
              {l.label}
            </a>
          ))}
          <button className="mobile-nav__link" onClick={() => { app.setEnquiryOpen(true); setMenu(false); }}>
            Track Booking
          </button>
          <a href="#footer" className="mobile-nav__link" onClick={() => setMenu(false)}>Support</a>
          <div className="mobile-nav__divider" />
          {user ? (
            <>
              <button className="mobile-nav__link" onClick={() => { app.setProfileOpen(true); setMenu(false); }}>My Bookings</button>
              {isAdmin(user) && (
                <button className="mobile-nav__link" onClick={() => { window.location.hash = '#/admin'; setMenu(false); }}>Admin Dashboard</button>
              )}
              <button className="mobile-nav__link" onClick={() => { app.logout(); setMenu(false); }}>Logout</button>
            </>
          ) : (
            <button className="mobile-nav__link" onClick={() => { app.setAuthModal('signin'); setMenu(false); }}>Sign In</button>
          )}
        </nav>
      )}
    </header>
  );
}

function AccountDropdown({ open, children }) {
  if (!open) return null;
  return (
    <div className="glass account-dropdown anim-drop-in">
      {children}
    </div>
  );
}

function DropdownItem({ icon, onClick, children }) {
  return (
    <button
      className="dropdown-item"
      onClick={onClick}
    >
      {icon} {children}
    </button>
  );
}

function Toast() {
  const app = useApp();
  const [shown, setShown] = useState(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (app.toast) {
      setShown(app.toast);
      setLeaving(false);
    } else if (shown) {
      setLeaving(true);
      const t = setTimeout(() => setShown(null), 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [app.toast]);

  if (!shown) return null;
  return (
    <div key={shown.key} className={`glass toast ${leaving ? 'anim-toast-out' : 'anim-toast-in'}`}>
      {shown.message}
    </div>
  );
}



function App() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <Nav menu={menu} setMenu={setMenu} />
      <main id="main">
        <CinematicHero />
        <FlightSearch />
        <Destinations />
        <WeatherSection />
        <WhySkyLink />
        <FaqSection />
      </main>
      <Footer />
      <AuthModal />
      <ProfilePanel />
      <EnquiryModal />
      <Toast />
    </div>
  );
}

// Hash routing: "#/admin/..." opens the admin area, anything else is the public site.
function Root() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const m = hash.match(/^#\/admin(?:\/(.*))?$/);
  if (m) return <AdminApp segments={(m[1] || '').split('/').filter(Boolean)} />;

  // Other "#/page" routes are information pages; unknown ones show the 404 screen.
  const pages = { '#/terms': TermsPage, '#/privacy': PrivacyPage, '#/refunds': RefundsPage, '#/contact': ContactPage };
  if (hash.startsWith('#/')) {
    const Page = pages[hash.replace(/\/+$/, '')] || NotFoundPage;
    return <Page />;
  }
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AppProvider>
      <Root />
    </AppProvider>
  </ErrorBoundary>
);
