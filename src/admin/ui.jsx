import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Inbox, Search, X } from 'lucide-react';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="adm-page-head">
      <div>
        <h1 className="adm-page-title">{title}</h1>
        {subtitle && <p className="adm-page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="adm-page-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, hint, trend }) {
  return (
    <div className="glass adm-stat">
      <div className="adm-stat__icon">{icon}</div>
      <div className="adm-stat__body">
        <span className="adm-stat__label">{label}</span>
        <b className="adm-stat__value">{value}</b>
        {(hint || trend !== undefined) && (
          <span className="adm-stat__hint">
            {trend !== undefined && trend !== null && (
              <span className={`adm-trend ${trend >= 0 ? 'adm-trend--up' : 'adm-trend--down'}`}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(0)}%
              </span>
            )}
            {trend === null && <span className="adm-trend">new</span>}
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

export function Pill({ tone = 'neutral', children }) {
  return <span className={`adm-pill adm-pill--${tone}`}>{children}</span>;
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`glass adm-card ${className}`}>
      {(title || actions) && (
        <header className="adm-card__head">
          {title && <h2 className="adm-card__title">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title = 'Nothing here yet', text, icon }) {
  return (
    <div className="adm-empty">
      {icon || <Inbox size={28} />}
      <b>{title}</b>
      {text && <p>{text}</p>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <label className="adm-search">
      <Search size={15} />
      <input
        className="adm-search__input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Select({ value, onChange, options, label, disabled }) {
  return (
    <select
      className="adm-select"
      value={value}
      aria-label={label}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="adm-field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <small className="adm-field__hint">{hint}</small>}
    </label>
  );
}

export function Modal({ title, onClose, children, footer, size = 'md' }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      if (prev && prev.focus) prev.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-overlay adm-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`glass modal adm-modal adm-modal--${size} anim-pop-in`}
      >
        <button className="modal__close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="modal__body">
          <h2 className="modal__title">{title}</h2>
          {children}
        </div>
        {footer && <div className="adm-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={onCancel}
      footer={(
        <>
          <button className="adm-btn" onClick={onCancel}>Cancel</button>
          <button className={`adm-btn ${danger ? 'adm-btn--danger' : 'adm-btn--primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </>
      )}
    >
      <p className="adm-confirm-text">{message}</p>
    </Modal>
  );
}

// Sortable, paginated table. Filtering/search happens in the caller; this
// component sorts and pages whatever rows it is given.
export function DataTable({ columns, rows, rowKey = 'id', pageSize = 10, defaultSort, emptyTitle, emptyText }) {
  const [sort, setSort] = useState(defaultSort || null); // { key, dir }
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = col.sortValue || ((r) => r[col.key]);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      if (x === y) return 0;
      if (x === null || x === undefined || x === '') return 1;
      if (y === null || y === undefined || y === '') return -1;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' }) * dir;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { if (page > pages) setPage(pages); }, [pages, page]);
  // Jump back to page 1 whenever the filtered result set changes size.
  useEffect(() => { setPage(1); }, [rows.length]);

  const start = (page - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  function toggle(col) {
    if (!col.sortable) return;
    setSort((s) => (s && s.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' }));
  }

  if (!rows.length) return <EmptyState title={emptyTitle} text={emptyText} />;

  return (
    <>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={c.className}
                >
                  {c.sortable ? (
                    <button className="adm-th-btn" onClick={() => toggle(c)}>
                      {c.label}
                      {sort?.key === c.key && (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r[rowKey]}>
                {columns.map((c) => (
                  <td key={c.key} data-label={c.label} className={c.className}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-pager">
        <span>
          {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}
        </span>
        <div className="adm-pager__btns">
          <button className="adm-icon-btn" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
          <span className="adm-pager__page">Page {page} / {pages}</span>
          <button className="adm-icon-btn" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- charts ---
const short = (n) => (n >= 1e7 ? `${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `${(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n)));

export function BarChart({ data, format = short, title }) {
  const W = 560, H = 200, P = { l: 40, r: 8, t: 12, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const bw = iw / data.length;
  const ticks = [0, 0.5, 1];
  return (
    <svg className="adm-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      {ticks.map((t) => {
        const y = P.t + ih - ih * t;
        return (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y} y2={y} className="adm-chart__grid" />
            <text x={P.l - 6} y={y + 3} textAnchor="end" className="adm-chart__tick">{format(max * t)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (d.value / max) * ih;
        const x = P.l + i * bw + bw * 0.18;
        return (
          <g key={d.label + i}>
            <rect x={x} y={P.t + ih - h} width={bw * 0.64} height={Math.max(h, d.value ? 2 : 0)} rx="3" className="adm-chart__bar">
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </rect>
            {(data.length <= 8 || i % 2 === 0) && (
              <text x={x + bw * 0.32} y={H - 8} textAnchor="middle" className="adm-chart__tick">{d.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ data, format = short, title }) {
  const W = 560, H = 200, P = { l: 40, r: 12, t: 12, b: 28 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const step = data.length > 1 ? iw / (data.length - 1) : 0;
  const pts = data.map((d, i) => [P.l + i * step, P.t + ih - (d.value / max) * ih]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = pts.length ? `${path} L${pts[pts.length - 1][0].toFixed(1)},${P.t + ih} L${pts[0][0].toFixed(1)},${P.t + ih} Z` : '';
  return (
    <svg className="adm-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <title>{title}</title>
      {[0, 0.5, 1].map((t) => {
        const y = P.t + ih - ih * t;
        return (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y} y2={y} className="adm-chart__grid" />
            <text x={P.l - 6} y={y + 3} textAnchor="end" className="adm-chart__tick">{format(max * t)}</text>
          </g>
        );
      })}
      <path d={area} className="adm-chart__area" />
      <path d={path} className="adm-chart__line" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3.5" className="adm-chart__dot"><title>{`${data[i].label}: ${format(data[i].value)}`}</title></circle>
          {(data.length <= 8 || i % 2 === 0) && <text x={p[0]} y={H - 8} textAnchor="middle" className="adm-chart__tick">{data[i].label}</text>}
        </g>
      ))}
    </svg>
  );
}

export function Donut({ data, title }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 46, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="adm-donut">
      <svg viewBox="0 0 120 120" className="adm-donut__svg" role="img" aria-label={title}>
        <title>{title}</title>
        <circle cx="60" cy="60" r={R} className="adm-donut__track" />
        {total > 0 && data.map((d) => {
          const len = (d.value / total) * C;
          const el = (
            <circle
              key={d.label}
              cx="60" cy="60" r={R}
              fill="none" strokeWidth="14"
              stroke={d.color}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 60 60)"
            />
          );
          acc += len;
          return el;
        })}
        <text x="60" y="58" textAnchor="middle" className="adm-donut__num">{total}</text>
        <text x="60" y="72" textAnchor="middle" className="adm-donut__cap">total</text>
      </svg>
      <ul className="adm-legend">
        {data.map((d) => (
          <li key={d.label}>
            <i style={{ background: d.color }} /> {d.label} <b>{d.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
