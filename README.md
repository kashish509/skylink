# SkyLink — Premium Redesign

A cinematic, Apple-inspired redesign of the SkyLink airline booking site, built with **plain React + Vite + hand-written CSS** (no Tailwind, no Framer Motion, no other UI/animation frameworks). Core booking functionality (search, seat selection, checkout, sign in/up, PNR lookup/cancellation) is preserved. An Admin Dashboard has since been added back (see below).

## Trust & polish + Weather (added)
- **Weather section** (`#weather`, `src/components/WeatherSection.jsx`, `src/lib/weather.js`): live conditions and a 7-day outlook for the six featured cities plus every city in the airport list, °C/°F toggle, packing tip, loading skeletons and an error/retry state. Data comes from [Open-Meteo](https://open-meteo.com/) (free, no API key) straight from the browser, so it needs an internet connection.
- **Information pages** (hash routes): `#/terms`, `#/privacy`, `#/refunds`, `#/contact`. The refund page and FAQ read the live cancellation fee/cutoff from Admin → Settings. Legal text is template wording: have it reviewed before real use.
- **Contact form** saves messages locally; admins read and resolve them in **Admin → Messages** (new `messages.manage` permission).
- **FAQ section**, **404 page**, **error boundary** (friendly fallback instead of a blank screen), **skip link + `<main>` landmark + visible focus rings**, and SEO basics in `index.html` (description, Open Graph, favicon).
- Site sections are now numbered 01-05 (Weather is 03, SkyLink Way 04, Help 05).

## Admin Dashboard (added)
Open it at `#/admin` (e.g. `http://localhost:5173/#/admin`) or via **Account → Admin Dashboard** once signed in as an admin.

**First run:** when no administrator exists, `#/admin` shows a one-time "Create Super Admin" form. There are no built-in credentials.

**Sections:** Overview (live stats, charts, activity feed, quick actions), Users, Bookings, Flights, Reports & Analytics, Activity Logs, Settings.

**Roles:** `superadmin` (everything, incl. role changes, deleting users, cancellation policy), `admin` (users status, bookings, flights, reports, logs, business/notification settings), `user` (no admin access). Permission rules live in `src/lib/admin.js`; every admin action re-checks them in `src/context/AppContext.jsx` (`admin*` functions).

**Files:** `src/admin/` (UI, pages, `admin.css`), `src/lib/admin.js`, admin data layer in `src/context/AppContext.jsx`, hash routing in `src/main.jsx`.

**Data:** new localStorage keys `skylink_audit` and `skylink_settings`; user records gained `role`, `status`, `createdAt`, `lastLoginAt` (old accounts are migrated automatically as active regular users).

**Important limitation:** SkyLink has no backend, so all data and all permission checks live in the browser. Anyone with DevTools can edit localStorage, so this is demo-grade access control, not real security. For production, move users/bookings/flights/auth to a server and enforce these rules there.

## Latest pass: destination popups + dependency cleanup
- Clicking a destination photo (Tokyo, Paris, Dubai, Singapore, London, New York) now opens a popup (`src/components/DestinationModal.jsx`, data in `src/data/destinations.js`) showing the destination photo, a list of famous hotspots around that city, and a short "why choose this destination" write-up.
- Tailwind CSS and Framer Motion have been removed from the project entirely. All animation (scroll reveals, staggered entrances, modal/dropdown transitions, the search-tab underline, the expandable "Why SkyLink" cards) is now done with plain CSS `@keyframes`/transitions plus a small `useReveal` IntersectionObserver hook (`src/lib/useReveal.js`).
- The `AdminPanel` component and every related bit of admin plumbing have been deleted: no more admin login, admin credentials, "Flight Inventory" admin dashboard, or admin-only account menu items. `AppContext.jsx` no longer tracks an admin session type, and the now-unused `addFlight`/`deleteFlight` functions were removed along with it.
- `lucide-react` is kept for icons (it's a plain SVG icon library, not a styling/animation framework) — everything else is vanilla React, CSS, HTML, and JavaScript.

## Earlier pass: reachable, interactive search
- The hero is a single, fast-loading view (~85vh) with a subtle Ken Burns background animation and a fade-in headline — no scroll-linked JavaScript.
- The flight search card overlaps the bottom of the hero, so it's visible with zero or one small scroll.
- **From/To fields use a Skyscanner-style autocomplete** (`src/components/CityAutocomplete.jsx`, backed by `src/data/airports.js`): typing "D" instantly suggests Delhi, Dubai, Doha, Dublin (with country, airport name, and code), arrow keys/Enter navigate the list, and an empty field shows popular destinations.
- A whole-page scroll progress bar sits at the top of the site.
- Core flow: From → To → Dates → Travellers → Search.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## Demo accounts
- Accounts are created via the **Register** tab and stored in your browser's local storage (this is a front-end demo with no backend).
