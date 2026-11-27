import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import { resolveCoords } from "../data/france.js";
import { markerIcon, pointCardHTML } from "../utils/markers.js";

// Clef CARTO (styles Positron / Dark Matter) : à définir dans un fichier .env à la racine
// du projet (voir .env.example) -> VITE_CARTO_API_KEY=ta_clef
// Obtention gratuite : https://carto.com/basemaps/apikey/ — à ajouter en ?key= sur les tuiles CARTO.
const CARTO_KEY = import.meta.env.VITE_CARTO_API_KEY || "";
const withCartoKey = (url) =>
  CARTO_KEY && url.includes("cartocdn.com")
    ? `${url}${url.includes("?") ? "&" : "?"}key=${encodeURIComponent(CARTO_KEY)}`
    : url;

export const MAP_STYLES = {
  basic: {
    label: "Basic",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  positron: {
    label: "Positron",
    url: withCartoKey("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"),
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  dark: {
    label: "Dark Matter",
    url: withCartoKey("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"),
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
};

const DEPT_SOURCES = [
  "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-avec-outre-mer.geojson",
  "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/france-departments.geojson",
];
let deptCache = null;
async function loadDepts() {
  if (deptCache) return deptCache;
  for (const url of DEPT_SOURCES) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        deptCache = await r.json();
        return deptCache;
      }
    } catch {
      /* essaie la source suivante */
    }
  }
  return null;
}

const deptProps = (f) => {
  const p = f.properties || {};
  return {
    code: String(p.code ?? p.code_insee ?? p.CODE_DEPT ?? ""),
    nom: String(p.nom ?? p.NOM_DEPT ?? p.name ?? ""),
  };
};
const deptStyle = (dark) => ({
  color: dark ? "#475569" : "#94a3b8",
  weight: 1,
  fillColor: "#0ea5e9",
  fillOpacity: dark ? 0.06 : 0.04,
});

function DepartmentsLayer({ dark, onSelectDept }) {
  const map = useMap();
  useEffect(() => {
    let layer = null;
    let cancelled = false;
    loadDepts().then((data) => {
      if (cancelled || !data) return;
      layer = L.geoJSON(data, {
        style: () => deptStyle(dark),
        onEachFeature: (f, l) => {
          const { nom } = deptProps(f);
          if (nom) l.bindTooltip(nom, { sticky: true, direction: "top", className: "dept-tooltip" });
          l.on("click", () => onSelectDept?.(nom));
          l.on("mouseover", () => l.setStyle({ weight: 3, color: "#0ea5e9", fillOpacity: 0.18 }));
          l.on("mouseout", () => layer && layer.resetStyle(l));
        },
      });
      layer.addTo(map);
    });
    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, dark, onSelectDept]);
  return null;
}

function MarkersLayer({ rows, cluster }) {
  const map = useMap();
  useEffect(() => {
    const layer = cluster
      ? L.markerClusterGroup({ maxClusterRadius: 45 })
      : L.layerGroup();
    for (const r of rows) {
      const c = resolveCoords(r.departement);
      const m = L.marker([c.lat, c.lng], { icon: markerIcon(r) });
      m.bindTooltip(pointCardHTML(r), {
        direction: "top",
        offset: [0, -20],
        className: "point-tooltip",
      });
      layer.addLayer(m);
    }
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, rows, cluster]);
  return null;
}

function FitBounds({ rows }) {
  const map = useMap();
  useEffect(() => {
    const pts = rows
      .map((r) => resolveCoords(r.departement))
      .filter((c) => c.zone === "metro")
      .map((c) => [c.lat, c.lng]);
    if (pts.length) {
      const b = L.latLngBounds(pts);
      if (b.isValid()) map.fitBounds(b.pad(0.12));
    }
  }, [rows, map]);
  return null;
}

const INSETS = [
  { zone: "guyane", title: "Guyane", center: [4.0, -53.1], zoom: 6 },
  { zone: "antilles", title: "Antilles", center: [15.4, -61.3], zoom: 6 },
  { zone: "reunion", title: "La Réunion", center: [-21.1, 55.5], zoom: 9 },
  { zone: "mayotte", title: "Mayotte", center: [-12.83, 45.16], zoom: 10 },
];

function Inset({ def, rows, style }) {
  const pts = rows.filter((r) => resolveCoords(r.departement).zone === def.zone);
  if (!pts.length) return null;
  const s = MAP_STYLES[style] ?? MAP_STYLES.basic;
  return (
    <div className="inset">
      <div className="inset-title">{def.title}</div>
      <MapContainer
        center={def.center}
        zoom={def.zoom}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
        className="inset-map"
      >
        <TileLayer key={style} url={s.url} attribution={s.attr} />
        <MarkersLayer rows={pts} cluster={false} />
      </MapContainer>
    </div>
  );
}

export default function MapView({ rows, style, dark, onStyleChange, onSelectDept }) {
  const metroRows = rows.filter((r) => resolveCoords(r.departement).zone === "metro");
  const s = MAP_STYLES[style] ?? MAP_STYLES.basic;
  return (
    <div className="map-area">
      <MapContainer center={[46.6, 2.5]} zoom={6} className="main-map">
        <TileLayer key={style} url={s.url} attribution={s.attr} />
        <DepartmentsLayer dark={dark} onSelectDept={onSelectDept} />
        <FitBounds rows={rows} />
        <MarkersLayer rows={metroRows} cluster={true} />
      </MapContainer>
      <div className="map-controls" title="Style de carte">
        {Object.entries(MAP_STYLES).map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={k === style ? "active" : ""}
            onClick={() => onStyleChange(k)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="insets">
        {INSETS.map((def) => (
          <Inset key={def.zone} def={def} rows={rows} style={style} />
        ))}
      </div>
    </div>
  );
}
