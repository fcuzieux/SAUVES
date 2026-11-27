import { REGIONS } from "../data/france.js";
import { ACHEMINEMENTS, STATUTS } from "../data/acheminements.js";

export const EMPTY_FILTERS = { q: "", region: "all", ach: "all", statut: "all", annee: "" };

export default function FilterBar({ filters, setFilters }) {
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  return (
    <div className="filter-bar">
      <input
        className="f-search"
        placeholder="🔍 Département, région, bénéficiaire…"
        value={filters.q}
        onChange={(e) => set("q", e.target.value)}
      />
      <select value={filters.region} onChange={(e) => set("region", e.target.value)} title="Région">
        <option value="all">Toutes régions</option>
        {REGIONS.map((r) => (
          <option key={r.name} value={r.name}>{r.name}</option>
        ))}
      </select>
      <select value={filters.ach} onChange={(e) => set("ach", e.target.value)} title="Type d'acheminement">
        <option value="all">Tous acheminements</option>
        {ACHEMINEMENTS.map((a) => (
          <option key={a.id} value={a.id}>{a.icon} {a.label}</option>
        ))}
      </select>
      <select value={filters.statut} onChange={(e) => set("statut", e.target.value)} title="Statut">
        <option value="all">Tous statuts</option>
        {STATUTS.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      <input
        className="f-annee"
        placeholder="Année"
        value={filters.annee}
        onChange={(e) => set("annee", e.target.value)}
        title="Année / période"
      />
      <button type="button" className="mini-btn" onClick={() => setFilters(EMPTY_FILTERS)}>
        Réinitialiser
      </button>
    </div>
  );
}
