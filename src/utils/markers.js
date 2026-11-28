import L from "leaflet";
import { achById, statutById } from "../data/acheminements.js";
import { esc, countSites } from "./summary.js";

export { esc, countSites, computeOverlaySummary, overlayCardHTML } from "./summary.js";

export function sizeForRow(row) {
  return 30 + Math.min(countSites(row.beneficiaire), 6) * 5;
}

export function primaryStatut(row) {
  const s = row.statuts?.[0];
  return statutById[s?.statut] ?? statutById.aucun;
}

export function markerIcon(row) {
  const size = sizeForRow(row);
  const first = row.acheminements?.[0] ? achById[row.acheminements[0]] : null;
  const color = first?.color ?? "#64748b";
  const st = primaryStatut(row);
  const ring = st.doubleRing
    ? `0 0 0 2px #ffffff, 0 0 0 4px ${color}`
    : "0 2px 6px rgba(0,0,0,0.35)";
  const icons = (row.acheminements || [])
    .slice(0, 3)
    .map((id) => achById[id]?.icon ?? "")
    .join("");
  const more =
    (row.acheminements || []).length > 3
      ? `<span class="marker-more">+${row.acheminements.length - 3}</span>`
      : "";
  const star = (row.statuts || []).some((s) => s.statut === "demo")
    ? `<span class="marker-star">⭐</span>`
    : "";
  const html = `<div class="marker${st.muted ? " marker-muted" : ""}" style="width:${size}px;height:${size}px;border-color:${color};border-style:${st.borderStyle};box-shadow:${ring}"><span class="marker-icons">${icons}</span>${more}${star}</div>`;
  return L.divIcon({
    className: "marker-wrap",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function pointCardHTML(row) {
  const list = row.statuts?.length ? row.statuts : [{ statut: "aucun", annee: "" }];
  const badges = list
    .map((s) => {
      const st = statutById[s.statut] ?? statutById.aucun;
      return `<span class="badge badge-${esc(s.statut)}">${st.label}${s.annee ? ` · ${esc(s.annee)}` : ""}</span>`;
    })
    .join(" ");
  const chips = (row.acheminements || [])
    .map((id) => {
      const a = achById[id];
      return a
        ? `<span class="chip" style="border-color:${a.color};color:${a.color}">${a.icon} ${esc(a.label)}</span>`
        : "";
    })
    .join("");
  const files = (row.files || [])
    .map((f) => {
      // Anti-XSS : on n'accepte comme lien téléchargeable que les data: (un JSON importé
      // ne doit pas pouvoir injecter un href "javascript:...")
      const safeUrl = typeof f.dataUrl === "string" && f.dataUrl.startsWith("data:") ? f.dataUrl : null;
      return safeUrl
        ? `<a class="file-link" href="${safeUrl}" download="${esc(f.name)}">📎 ${esc(f.name)} <small>(${(f.size / 1024).toFixed(0)} kB)</small></a>`
        : `<span class="file-link">📎 ${esc(f.name)} <small>(${(f.size / 1024).toFixed(0)} kB, non embarqué)</small></span>`;
    })
    .join("");
  const hist = (row.history || [])
    .slice(-5)
    .reverse()
    .map(
      (h) =>
        `<div class="hist-item"><span class="hist-date">${esc(new Date(h.t).toLocaleString("fr-FR"))}</span> <b>${esc(h.action)}</b>${h.detail ? ` — ${esc(h.detail)}` : ""}</div>`
    )
    .join("");
  const hasLL = Number.isFinite(row.lat) && Number.isFinite(row.lng);
  return `<div class="point-card">
    <div class="pc-head"><strong>${esc(row.departement)}</strong><span class="pc-region">${esc(row.region)}</span></div>
    <div class="pc-row">🏥 ${esc(row.beneficiaire)}</div>
    ${hasLL ? `<div class="pc-row pc-ll">📍 ${row.lat.toFixed(5)}, ${row.lng.toFixed(5)} <small>(position manuelle)</small></div>` : ""}
    <div class="pc-achs">${chips}</div>
    <div class="pc-statuts">${badges}</div>
    ${row.note ? `<div class="pc-note">${esc(row.note)}</div>` : ""}
    ${files ? `<div class="pc-files">${files}</div>` : ""}
    ${hist ? `<div class="pc-hist"><div class="hist-title">Historique</div>${hist}</div>` : ""}
    <div class="pc-foot">
      <button type="button" class="pc-btn" data-action="edit" data-id="${esc(row.id)}">✏️ Modifier</button>
      <button type="button" class="pc-btn pc-delete" data-action="delete" data-id="${esc(row.id)}" title="Supprimer la ligne">🗑 Supprimer</button>
    </div>
  </div>`;
}
