import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import { resolveCoords, zoneGroup, DEPARTMENTS } from "../data/france.js";
import { markerIcon, pointCardHTML, overlayCardHTML, computeOverlaySummary } from "../utils/markers.js";
import { loadDeptGeo, loadRegionGeo, deptProps, regionProps } from "../utils/geo.js";

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

const deptStyle = (dark) => ({
  color: dark ? "#475569" : "#94a3b8",
  weight: 1,
  fillColor: "#0ea5e9",
  fillOpacity: dark ? 0.06 : 0.04,
});
const regionStyle = (dark) => ({
  color: dark ? "#334155" : "#64748b",
  weight: 2,
  fillColor: "#0ea5e9",
  fillOpacity: dark ? 0.05 : 0.03,
});

// Couche d'overlay : "departements" | "regions" | "none" (masquée pendant le picking)
function OverlayLayer({ mode, dark, picking, rows, onSelectDept, onSelectRegion, onCloseTerritory }) {
  const map = useMap();
  const [layer, setLayer] = useState(null);
  const pickingRef = useRef(picking);
  pickingRef.current = picking;

  useEffect(() => {
    let cancelled = false;
    let l = null;
    (async () => {
      if (mode === "none") {
        setLayer(null);
        return;
      }
      const isRegion = mode === "regions";
      const data = isRegion ? await loadRegionGeo() : await loadDeptGeo();
      if (cancelled || !data) return;
      l = L.geoJSON(data, {
        style: () => (isRegion ? regionStyle(dark) : deptStyle(dark)),
        onEachFeature: (f, fLayer) => {
          const p = isRegion ? regionProps(f) : deptProps(f);
          if (p.nom) fLayer.bindTooltip(p.nom, { sticky: true, direction: "top", className: "dept-tooltip" });
          // Fiche récapitulative du territoire au clic (+ filtre)
          fLayer.bindPopup(
            overlayCardHTML(computeOverlaySummary(rows, isRegion, p)),
            { className: "point-tooltip overlay-popup", maxWidth: 300 }
          );
          fLayer.on("click", () => {
            fLayer.openPopup();
            // Zoom à l'échelle du territoire cliqué (et pas sur les points qu'il contient)
            map.fitBounds(fLayer.getBounds().pad(0.12));
            if (isRegion) onSelectRegion?.(p.nom);
            else onSelectDept?.(p.nom);
          });
          // Fermeture de la fiche -> on rend toutes les lignes (filtre retiré côté App)
          fLayer.on("popupclose", () => onCloseTerritory?.(isRegion ? "region" : "dept", p.nom));
          fLayer.on("mouseover", () => fLayer.setStyle({ weight: 3, color: "#0ea5e9", fillOpacity: 0.18 }));
          fLayer.on("mouseout", () => l && l.resetStyle(fLayer));
        },
      });
      setLayer(l);
      if (!pickingRef.current) l.addTo(map); // en picking, le layer reste retiré (double-clic)
    })();
    return () => {
      cancelled = true;
      if (l) map.removeLayer(l);
      setLayer(null);
    };
  }, [map, dark, mode, rows, onSelectDept, onSelectRegion, onCloseTerritory]);

  useEffect(() => {
    if (!layer) return;
    if (picking) {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    } else if (!map.hasLayer(layer)) {
      layer.addTo(map);
    }
  }, [layer, picking, map]);

  return null;
}

// Mode "picking" : double-clic sur la carte -> onPick(latlng) ; double-clic-zoom désactivé pendant le choix
function PickHandler({ picking, onPick }) {
  const map = useMap();
  useEffect(() => {
    if (!picking) return;
    map.doubleClickZoom.disable();
    map.getContainer().classList.add("picking");
    const h = (e) => onPick?.(e.latlng);
    map.on("dblclick", h);
    return () => {
      map.off("dblclick", h);
      map.getContainer().classList.remove("picking");
      map.doubleClickZoom.enable();
    };
  }, [map, picking, onPick]);
  return null;
}

function MarkersLayer({ rows, cluster, picking }) {
  const map = useMap();
  useEffect(() => {
    const layer = cluster
      ? L.markerClusterGroup({ maxClusterRadius: 45 })
      : L.layerGroup();
    const byId = {};
    const pinned = new Set(); // ids des fiches épinglées par un clic

    const closeAll = () => {
      pinned.clear();
      for (const id in byId) byId[id].closeTooltip();
    };

    for (const r of rows) {
      const c = resolveCoords(r.departement, r.lat, r.lng, r.region);
      const m = L.marker([c.lat, c.lng], { icon: markerIcon(r) });
      m.bindTooltip(pointCardHTML(r), {
        permanent: true, // on gère nous-mêmes ouvrir/fermer (survol + clic)
        interactive: true, // la fiche reste survolable et cliquable (boutons ✏️/🗑)
        direction: "top",
        offset: [0, -20],
        className: "point-tooltip",
      });
      // Survol = aperçu ; Clic = épingle/désépingle la fiche
      m.on("mouseover", () => {
        if (!pinned.has(r.id) && !picking) m.openTooltip();
      });
      m.on("mouseout", () => {
        if (!pinned.has(r.id)) m.closeTooltip();
      });
      m.on("click", (e) => {
        if (picking) return; // en mode picking, on laisse passer les événements vers la carte (double-clic)
        L.DomEvent.stop(e); // le clic sur un point ne doit pas fermer les fiches (événement carte)
        if (pinned.has(r.id)) {
          pinned.delete(r.id);
          m.closeTooltip();
        } else {
          closeAll();
          pinned.add(r.id);
          m.openTooltip();
        }
      });
      byId[r.id] = m;
      layer.addLayer(m);
    }
    layer.addTo(map);
    for (const id in byId) byId[id].closeTooltip(); // permanent = ouverte par défaut -> on referme

    // Clic hors fiche (sur la carte) ou Échap -> on ferme toutes les fiches épinglées
    const onMapClick = (e) => {
      if (e.originalEvent?.target?.closest?.(".point-tooltip")) return; // clic DANS une fiche
      closeAll();
    };
    const onKey = (e) => {
      if (e.key === "Escape") closeAll();
    };
    // Zoom / re-cluster : les marqueurs ré-ajoutés rouvrent leurs tooltips permanent ->
    // on referme tout ce qui n'est pas épinglé (les fiches épinglées restent ouvertes)
    const closeUnpinned = () => {
      for (const id in byId) if (!pinned.has(id)) byId[id].closeTooltip();
    };
    map.on("click", onMapClick);
    map.on("zoomend", closeUnpinned);
    if (cluster && layer.on) layer.on("animationend", closeUnpinned);
    document.addEventListener("keydown", onKey);

    return () => {
      map.off("click", onMapClick);
      map.off("zoomend", closeUnpinned);
      if (cluster && layer.off) layer.off("animationend", closeUnpinned);
      document.removeEventListener("keydown", onKey);
      map.removeLayer(layer);
    };
  }, [map, rows, cluster, picking]);
  return null;
}

// Bounds de repli si aucun point dans le territoire demandé
const FALLBACK_BOUNDS = {
  hexagone: [[41.5, -5.5], [51.5, 9.8]],
  monde: [[-60, -180], [78, 180]],
};
// demi-taille de la fenêtre de repli pour les grands territoires (code INSEE)
const TERRITOIRE_DELTA = { "973": 4, "987": 5, "988": 3 };

function FitBounds({ rows, view }) {
  const map = useMap();
  // rows via une ref : on ne refit PAS à chaque changement de filtre (seulement quand la vue change)
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  useEffect(() => {
    const all = rowsRef.current.map((r) => resolveCoords(r.departement, r.lat, r.lng, r.region));
    let wanted;
    if (view === "monde") wanted = all;
    else if (view === "hexagone") wanted = all.filter((c) => zoneGroup(c.zone) === "hexagone");
    else wanted = all.filter((c) => c.code === view); // vue = code territoire (971, 973, 987…)
    let b;
    if (wanted.length) {
      b = L.latLngBounds(wanted.map((c) => [c.lat, c.lng]));
    } else if (view !== "hexagone" && view !== "monde" && DEPARTMENTS[view]) {
      const d = DEPARTMENTS[view];
      const delta = TERRITOIRE_DELTA[view] ?? 1.2;
      b = L.latLngBounds([[d.lat - delta, d.lng - delta], [d.lat + delta, d.lng + delta]]);
    } else {
      b = L.latLngBounds(FALLBACK_BOUNDS[view] ?? FALLBACK_BOUNDS.monde);
    }
    if (b.isValid()) map.fitBounds(b.pad(0.12));
  }, [view, map]);
  return null;
}

const INSETS = [
  { zone: "guyane", title: "Guyane", center: [4.0, -53.1], zoom: 6 },
  { zone: "antilles", title: "Antilles", center: [16.2, -62.2], zoom: 6 },
  { zone: "reunion", title: "La Réunion", center: [-21.1, 55.5], zoom: 9 },
  { zone: "mayotte", title: "Mayotte", center: [-12.83, 45.16], zoom: 10 },
  { zone: "spm", title: "St-Pierre-et-Miquelon", center: [46.85, -56.3], zoom: 8 },
  { zone: "pacifique", title: "Pacifique (COM)", center: [-18, -172], zoom: 3 },
];

function Inset({ def, rows, style }) {
  const pts = rows.filter((r) => resolveCoords(r.departement, r.lat, r.lng, r.region).zone === def.zone);
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
        <MarkersLayer rows={pts} cluster={false} picking={false} />
      </MapContainer>
    </div>
  );
}

export default function MapView({ rows, allRows, style, dark, onStyleChange, onSelectDept, onSelectRegion, onCloseTerritory, onOverlayModeChange, picking, onPick, onCancelPick, view }) {
  const [cluster, setCluster] = useState(true);
  const [overlay, setOverlay] = useState("departements"); // "departements" | "regions" | "none"

  // Changement de mode d'overlay -> on retire le filtre de territoire (toutes les lignes réapparaissent)
  const onOverlayModeChangeRef = useRef(onOverlayModeChange);
  onOverlayModeChangeRef.current = onOverlayModeChange;
  useEffect(() => {
    onOverlayModeChangeRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay]);
  const s = MAP_STYLES[style] ?? MAP_STYLES.basic;
  return (
    <div className="map-area">
      <MapContainer center={[46.6, 2.5]} zoom={6} className="main-map">
        <TileLayer key={style} url={s.url} attribution={s.attr} />
        <OverlayLayer mode={overlay} dark={dark} picking={picking} rows={allRows ?? rows} onSelectDept={onSelectDept} onSelectRegion={onSelectRegion} onCloseTerritory={onCloseTerritory} />
        <FitBounds rows={rows} view={view} />
        <PickHandler picking={picking} onPick={onPick} />
        <MarkersLayer rows={rows} cluster={cluster} picking={picking} />
      </MapContainer>
      {picking && (
        <div className="pick-banner">
          📍 Double-cliquez sur la carte pour définir la position
          <button type="button" className="mini-btn" onClick={onCancelPick}>Annuler</button>
        </div>
      )}
      <div className="map-controls" title="Style de carte et zone">
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
        <span className="ctrl-sep" />
        <button
          type="button"
          className={cluster ? "active" : ""}
          onClick={() => setCluster((c) => !c)}
          title="Activer / désactiver le regroupement des points (clusters) selon l'échelle"
        >
          🧲 Clusters {cluster ? "ON" : "OFF"}
        </button>
        <span className="ctrl-sep" />
        {[
          ["departements", "🧩 Départements"],
          ["regions", "🗺️ Régions"],
          ["none", "🚫 Aucun"],
        ].map(([v, l]) => (
          <button
            key={v}
            type="button"
            className={overlay === v ? "active" : ""}
            onClick={() => setOverlay(v)}
            title="Overlay affiché sur la carte"
          >
            {l}
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
