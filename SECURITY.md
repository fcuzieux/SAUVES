# Security Policy

## Reporting a vulnerability

Please report any suspected vulnerability privately (do not open a public issue):
open a GitHub **private security advisory** on this repository
(*Security → Advisories → Report a vulnerability*), or contact the repository owner directly.
We will acknowledge within 72 hours.

## Scope

This project is a **client-side only** single-page app (Vite + React + Leaflet). There is no
backend, no database server and no secrets stored server-side. Data lives in the browser
(`localStorage`) and in `public/data/points.json`.

## Review performed (current state)

- **Dependencies** : `npm audit` reports **0 vulnerabilities** ; CI runs
  `npm audit --audit-level=high` on every push/PR (`.github/workflows/ci.yml`).
  Vite 7 + plugin-react 5 used (vite 5.x had unpatched advisories).
- **XSS** : all user/base data rendered into Leaflet tooltips/markers goes through an HTML
  escaper (`esc()` in `src/utils/markers.js`). Downloadable file links only accept `data:`
  URLs (a `javascript:` URL injected via an imported JSON is rendered as plain text).
- **CSV injection** : exported CSV cells starting with `= + - @` (or tab/CR) are prefixed with
  `'` so spreadsheet apps don't execute them (`csvEsc` in `src/utils/io.js`).
- **CARTO API key** : `VITE_CARTO_API_KEY` is embedded in the client bundle by design (browser
  tile requests). `.env` is gitignored; restrict the key by HTTP referrer in the CARTO dashboard
  (https://dashboard.basemaps.carto.com). Never commit a real key.
- **External runtime data** : department boundaries GeoJSON is fetched at runtime from
  `raw.githubusercontent.com` (gregoiredavid/france-geojson, then click_that_hood) and map tiles
  from OSM/CARTO CDNs — pinned to HTTPS sources. If you need stronger guarantees, self-host the
  GeoJSON in `public/` and adjust `DEPT_SOURCES` in `src/utils/geo.js`.
- **Import** : imported `.json`/`.csv` files are normalized (`normalizeRow`) and all rendered
  fields are escaped; file attachments > 800 kB are referenced by name only.
- **localStorage** : treated as untrusted input (parsed defensively, normalized on load).
