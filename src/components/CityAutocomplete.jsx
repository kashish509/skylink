import React, { useId, useMemo, useState } from 'react';
import { Plane, TrendingUp } from 'lucide-react';
import { searchAirports } from '../data/airports';

export default function CityAutocomplete({ label, value, onChange, onSelect, placeholder, autoFocus }) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = useId();

  const results = useMemo(() => searchAirports(value, { limit: 6 }), [value]);
  const isEmpty = !value.trim();

  function choose(a) {
    onSelect(a);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[highlight]) choose(results[highlight]); }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <span className="city-autocomplete">
      <span className="field-label field-label--tight">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setHighlight(0); setOpen(true); }}
        onFocus={() => { setOpen(true); setHighlight(0); }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="city-autocomplete__input"
      />

      {open && (
        <div id={listId} className="city-dropdown anim-drop-in">
          <div className="city-dropdown__header">
            {isEmpty ? <><TrendingUp size={11} /> Popular destinations</> : <>Suggestions</>}
          </div>
          {results.length === 0 ? (
            <p className="city-dropdown__empty">No matches &mdash; try a city or airport code.</p>
          ) : (
            <ul className="city-dropdown__list">
              {results.map((a, i) => (
                <li key={a.code}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(a)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`city-option ${highlight === i ? 'city-option--active' : ''}`}
                  >
                    <span className="city-option__icon">
                      <Plane size={13} />
                    </span>
                    <span className="city-option__body">
                      <span className="city-option__row">
                        <b className="city-option__city">{a.city}</b>
                        <span className="city-option__country">{a.country}</span>
                      </span>
                      <span className="city-option__airport">{a.airport}</span>
                    </span>
                    <span className="city-option__code">{a.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </span>
  );
}
