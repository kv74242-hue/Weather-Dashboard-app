# Weather & Air Quality Dashboard

A responsive vanilla JavaScript web application that fetches real-time weather conditions and European Air Quality Index (AQI) data for any city worldwide.

**[Live Demo](https://kv74242-hue.github.io/Weather-Dashboard-app/)**

## Features

- **Real-Time Weather & Air Quality:** Displays temperature, feels-like temperature, WMO weather condition descriptions, humidity, wind speed, European AQI with color-coded status badges, PM2.5, and PM10 levels.
- **Debounced City Autocomplete:** Suggests matching cities with region and country disambiguation after a 300ms input debounce, with floating dropdown dismissal via `Escape` or outside click.
- **Parallel Fetching & Partial Failure Handling:** Requests weather and air quality data concurrently via `Promise.allSettled`, rendering whichever dataset succeeds even if the other API fails.
- **Race-Condition Prevention:** Uses separate `AbortController` instances for autocomplete suggestions and dashboard fetches so stale network responses never overwrite newer selections.
- **Coordinate-Based Search History:** Saves up to 5 recent cities in `localStorage` deduplicated by latitude and longitude (allowing same-name cities like London, UK and London, Canada to coexist), complete with schema validation and automatic loading of the most recent city on startup.
- **Responsive Layout:** Adapts between a two-column desktop grid and a single-column mobile layout using CSS Grid.

## Tech Stack & APIs

- **Frontend:** HTML5, CSS3 (Flexbox & CSS Grid), Vanilla JavaScript (ES Modules)
- **APIs (No API key required):**
  - [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
  - [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs)
  - [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)

## Running Locally

Because the app uses `<script type="module">`, serve it over a local HTTP server instead of opening `index.html` directly via `file://`.

```bash
git clone https://github.com/kv74242-hue/Weather-Dashboard-app.git
cd Weather-Dashboard-app
```

Open the folder in VS Code and launch `index.html` using the **Live Server** extension (or run `npx serve .`).
