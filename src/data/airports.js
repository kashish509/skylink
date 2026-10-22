// Airport/city dataset for the From/To autocomplete. `popular` entries show
// up when a field is empty; everything is matched by city, country, code,
// or airport name while typing.
export const airports = [
  { code: 'DEL', city: 'Delhi', country: 'India', airport: 'Indira Gandhi International', popular: true, lat: 28.5665, lon: 77.1031, tz: 5.5 },
  { code: 'BOM', city: 'Mumbai', country: 'India', airport: 'Chhatrapati Shivaji Maharaj International', popular: true, lat: 19.0887, lon: 72.8679, tz: 5.5 },
  { code: 'BLR', city: 'Bengaluru', country: 'India', airport: 'Kempegowda International', lat: 13.1979, lon: 77.7063, tz: 5.5 },
  { code: 'HYD', city: 'Hyderabad', country: 'India', airport: 'Rajiv Gandhi International', lat: 17.2403, lon: 78.4294, tz: 5.5 },
  { code: 'MAA', city: 'Chennai', country: 'India', airport: 'Chennai International', lat: 12.9941, lon: 80.1709, tz: 5.5 },
  { code: 'CCU', city: 'Kolkata', country: 'India', airport: 'Netaji Subhas Chandra Bose International', lat: 22.6547, lon: 88.4467, tz: 5.5 },
  { code: 'GOI', city: 'Goa', country: 'India', airport: 'Dabolim Airport', lat: 15.3808, lon: 73.8314, tz: 5.5 },
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', airport: 'Dubai International', popular: true, lat: 25.2532, lon: 55.3657, tz: 4 },
  { code: 'AUH', city: 'Abu Dhabi', country: 'United Arab Emirates', airport: 'Zayed International', lat: 24.4330, lon: 54.6511, tz: 4 },
  { code: 'DOH', city: 'Doha', country: 'Qatar', airport: 'Hamad International', popular: true, lat: 25.2731, lon: 51.6081, tz: 3 },
  { code: 'DUB', city: 'Dublin', country: 'Ireland', airport: 'Dublin Airport', lat: 53.4213, lon: -6.2701, tz: 0 },
  { code: 'DPS', city: 'Denpasar (Bali)', country: 'Indonesia', airport: 'Ngurah Rai International', lat: -8.7482, lon: 115.1671, tz: 8 },
  { code: 'DMK', city: 'Bangkok', country: 'Thailand', airport: 'Don Mueang International', lat: 13.9126, lon: 100.6067, tz: 7 },
  { code: 'DEN', city: 'Denver', country: 'United States', airport: 'Denver International', lat: 39.8561, lon: -104.6737, tz: -7 },
  { code: 'DFW', city: 'Dallas', country: 'United States', airport: 'Dallas/Fort Worth International', lat: 32.8998, lon: -97.0403, tz: -6 },
  { code: 'DTW', city: 'Detroit', country: 'United States', airport: 'Detroit Metropolitan', lat: 42.2124, lon: -83.3534, tz: -5 },
  { code: 'DUR', city: 'Durban', country: 'South Africa', airport: 'King Shaka International', lat: -29.6144, lon: 31.1197, tz: 2 },
  { code: 'DJE', city: 'Djerba', country: 'Tunisia', airport: 'Djerba–Zarzis', lat: 33.8753, lon: 10.7755, tz: 1 },
  { code: 'DBV', city: 'Dubrovnik', country: 'Croatia', airport: 'Dubrovnik Airport', lat: 42.5614, lon: 18.2682, tz: 1 },
  { code: 'DAM', city: 'Damascus', country: 'Syria', airport: 'Damascus International', lat: 33.4114, lon: 36.5156, tz: 3 },
  { code: 'DAC', city: 'Dhaka', country: 'Bangladesh', airport: 'Hazrat Shahjalal International', lat: 23.8433, lon: 90.3978, tz: 6 },
  { code: 'DAD', city: 'Da Nang', country: 'Vietnam', airport: 'Da Nang International', lat: 16.0439, lon: 108.1994, tz: 7 },
  { code: 'LHR', city: 'London', country: 'United Kingdom', airport: 'Heathrow Airport', popular: true, lat: 51.4700, lon: -0.4543, tz: 0 },
  { code: 'CDG', city: 'Paris', country: 'France', airport: 'Charles de Gaulle', popular: true, lat: 49.0097, lon: 2.5479, tz: 1 },
  { code: 'JFK', city: 'New York', country: 'United States', airport: 'John F. Kennedy International', popular: true, lat: 40.6413, lon: -73.7781, tz: -5 },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', airport: 'Changi Airport', popular: true, lat: 1.3644, lon: 103.9915, tz: 8 },
  { code: 'NRT', city: 'Tokyo', country: 'Japan', airport: 'Narita International', popular: true, lat: 35.7720, lon: 140.3929, tz: 9 },
  { code: 'HND', city: 'Tokyo', country: 'Japan', airport: 'Haneda Airport', lat: 35.5494, lon: 139.7798, tz: 9 },
  { code: 'SYD', city: 'Sydney', country: 'Australia', airport: 'Kingsford Smith', lat: -33.9399, lon: 151.1753, tz: 10 },
  { code: 'HKG', city: 'Hong Kong', country: 'Hong Kong', airport: 'Hong Kong International', lat: 22.3080, lon: 113.9185, tz: 8 },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', airport: 'Suvarnabhumi Airport', lat: 13.6900, lon: 100.7501, tz: 7 },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', airport: 'Kuala Lumpur International', lat: 2.7456, lon: 101.7099, tz: 8 },
  { code: 'IST', city: 'Istanbul', country: 'Turkey', airport: 'Istanbul Airport', lat: 41.2753, lon: 28.7519, tz: 3 },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', airport: 'Schiphol Airport', lat: 52.3105, lon: 4.7683, tz: 1 },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', airport: 'Frankfurt Airport', lat: 50.0379, lon: 8.5622, tz: 1 },
  { code: 'ZRH', city: 'Zurich', country: 'Switzerland', airport: 'Zurich Airport', lat: 47.4647, lon: 8.5492, tz: 1 },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', airport: 'Josep Tarradellas Barcelona–El Prat', lat: 41.2974, lon: 2.0833, tz: 1 },
  { code: 'ROM', city: 'Rome', country: 'Italy', airport: 'Fiumicino Airport', lat: 41.8003, lon: 12.2389, tz: 1 },
  { code: 'YYZ', city: 'Toronto', country: 'Canada', airport: 'Toronto Pearson International', lat: 43.6777, lon: -79.6248, tz: -5 },
  { code: 'LAX', city: 'Los Angeles', country: 'United States', airport: 'Los Angeles International', lat: 33.9416, lon: -118.4085, tz: -8 },
];

export function searchAirports(query, { limit = 6 } = {}) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return airports.filter((a) => a.popular).slice(0, limit);
  const starts = [];
  const contains = [];
  for (const a of airports) {
    const hay = `${a.city} ${a.code} ${a.country} ${a.airport}`.toLowerCase();
    if (a.city.toLowerCase().startsWith(q) || a.code.toLowerCase().startsWith(q)) starts.push(a);
    else if (hay.includes(q)) contains.push(a);
  }
  return [...starts, ...contains].slice(0, limit);
}

export function airportByCode(code) {
  return airports.find((a) => a.code === (code || '').toUpperCase());
}

// Resolves whatever the user has typed/selected into a 3-letter airport
// code for search matching. Prefers an already-selected code; otherwise
// tries to match the free-typed text against a known city or code, falling
// back to the raw text (so manually typing a code like "DEL" still works).
export function resolveCode(query, selectedCode) {
  if (selectedCode) return selectedCode;
  const q = (query || '').trim();
  if (!q) return '';

  // Handle text like "Delhi (DEL)" that wasn't picked from the dropdown
  // (e.g. the user re-edited the field after selecting) by pulling the
  // parenthesized code out and validating it against the known airports.
  const parenMatch = q.match(/\(([A-Za-z]{3})\)\s*$/);
  if (parenMatch) {
    const code = parenMatch[1].toUpperCase();
    if (airports.some((a) => a.code === code)) return code;
  }

  const exact = airports.find(
    (a) => a.code.toLowerCase() === q.toLowerCase() || a.city.toLowerCase() === q.toLowerCase()
  );
  if (exact) return exact.code;
  return q.toUpperCase();
}
