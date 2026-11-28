import { achById } from "../data/acheminements.js";
import { resolveCoords } from "../data/france.js";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function countSites(b) {
  const n = [...String(b).matchAll(/(\d+)/g)].map((m) => +m[1]);
  return n.length ? n.reduce((a, b) => a + b, 0) : 1;
}

// Résumé d'un territoire (département ou région) : lignes, établissements, types d'acheminement
export function computeOverlaySummary(rows, isRegion, p) {
  const match = isRegion
    ? (r) => r.region === p.nom
    : (r) => resolveCoords(r.departement, r.lat, r.lng, r.region).code === p.code;
  const sel = rows.filter(match);
  let etabs = 0;
  const achs = {};
  for (const r of sel) {
    etabs += countSites(r.beneficiaire);
    for (const a of r.acheminements || []) achs[a] = (achs[a] || 0) + 1;
  }
  return { nom: p.nom, lignes: sel.length, etabs, achs };
}

export function overlayCardHTML({ nom, lignes, etabs, achs }) {
  const chips = Object.entries(achs)
    .map(([id, n]) => {
      const a = achById[id];
      return a ? `<span class="chip" style="border-color:${a.color};color:${a.color}">${a.icon} ${esc(a.label)} ×${n}</span>` : "";
    })
    .join("");
  return `<div class="point-card overlay-card">
    <div class="pc-head"><strong>${esc(nom)}</strong></div>
    <div class="pc-row">📋 ${lignes} ligne${lignes > 1 ? "s" : ""} · 🏥 ${etabs} établissement${etabs > 1 ? "s" : ""}</div>
    <div class="pc-achs">${chips || '<span class="hint">aucun acheminement</span>'}</div>
  </div>`;
}
