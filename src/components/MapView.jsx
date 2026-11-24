import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { achById, statutById } from "../data/acheminements.js";
import { resolveCoords } from "../data/france.js";

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const INSETS = [
  { zone: "guyane", title: "Guyane", center: [4.0, -53.1], zoom: 6 },
  { zone: "antilles", title: "Antilles", center: [15.4, -61.3], zoom: 6 },
  { zone: "reunion", title: "La Réunion", center: [-21.1, 55.5], zoom: 9 },
  { zone: "mayotte", title: "Mayotte", center: [-12.83, 45.16], zoom: 10 },
];

function countSites(beneficiaire) {
  const nums = [...String(beneficiaire).matchAll(/(\d+)/g)].map((m) => +m[1]);
  return nums.length ? nums.reduce((a, b) => a + b, 0) : 1;
}

function markerIcon(row) {
  const size = 30 + Math.min(countSites(row.beneficiaire), 6) * 5;
  const first = row.acheminements[0] ? achById[row.acheminements[0]] : null;
  const color = first ? first.color : "#64748b";
  const statut = statutById[row.statut] ?? statutById.aucun;
  const ring = statut.doubleRing
    ? `0 0 0 2px #ffffff, 0 0 0 4px ${color}`
    : "0 2px 6px rgba(0,0,0,0.35)";
  const icons = row.acheminements
    .slice(0, 3)
    .map((id) => achById[id]?.icon ?? "")
    .join("");
  const more =
    row.acheminements.length > 3
      ? `<span class="marker-more">+${row.acheminements.length - 3}</span>`
      : "";
  const star = statut.star ? `<span class="marker-star">⭐</span>` : "";
  const html = `<div class="marker${statut.muted ? " marker-muted" : ""}" style="width:${size}px;height:${size}px;border-color:${color};border-style:${statut.borderStyle};box-shadow:${ring}"><span class="marker-icons">${icons}</span>${more}${star}</div>`;
  return L.divIcon({
    className: "marker-wrap",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function PointCard({ row, onDelete }) {
  const statut = statutById[row.statut] ?? statutById.aucun;
  return (
    <div className="point-card">
      <div className="pc-head">
        <strong>{row.departement}</strong>
        <span className="pc-region">{row.region}</span>
      </div>
      <div className="pc-row">🏥 {row.beneficiaire}</div>
      <div className="pc-achs">
        {row.acheminements.map((id) => {
          const a = achById[id];
          return a ? (
            <span key={id} className="chip" style={{ borderColor: a.color, color: a.color }}>
              {a.icon} {a.label}
            </span>
          ) : null;
        })}
      </div>
      <div className="pc-foot">
        <span className={`badge badge-${row.statut}`}>
          {statut.label}
          {row.annee ? ` · ${row.annee}` : ""}
        </span>
        <button
          type="button"
          className="pc-delete"
          title="Supprimer cette ligne"
          onClick={() => onDelete(row.id)}
        >
          🗑
        </button>
      </div>
      {row.note ? <div className="pc-note">{row.note}</div> : null}
    </div>
  );
}

function PointMarker({ row, onDelete }) {
  const c = resolveCoords(row.departement);
  return (
    <Marker position={[c.lat, c.lng]} icon={markerIcon(row)}>
      <Tooltip direction="top" offset={[0, -20]} className="point-tooltip">
        <PointCard row={row} onDelete={onDelete} />
      </Tooltip>
    </Marker>
  );
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

function Inset({ def, rows, onDelete }) {
  const pts = rows
    .filter((r) => resolveCoords(r.departement).zone === def.zone)
    .map((r) => ({ row: r, c: resolveCoords(r.departement) }));
  if (!pts.length) return null;
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
        <TileLayer url={TILE_URL} attribution={ATTR} />
        {pts.map(({ row, c }) => (
          <Marker key={row.id} position={[c.lat, c.lng]} icon={markerIcon(row)}>
            <Tooltip direction="top" offset={[0, -20]} className="point-tooltip">
              <PointCard row={row} onDelete={onDelete} />
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default function MapView({ rows, onDelete }) {
  const metroRows = rows.filter((r) => resolveCoords(r.departement).zone === "metro");
  return (
    <div className="map-area">
      <MapContainer center={[46.6, 2.5]} zoom={6} className="main-map">
        <TileLayer url={TILE_URL} attribution={ATTR} />
        <FitBounds rows={rows} />
        {metroRows.map((r) => (
          <PointMarker key={r.id} row={r} onDelete={onDelete} />
        ))}
      </MapContainer>
      <div className="insets">
        {INSETS.map((def) => (
          <Inset key={def.zone} def={def} rows={rows} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
