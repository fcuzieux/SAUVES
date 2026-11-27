import { useEffect, useMemo, useRef, useState } from "react";
import MapView from "./components/MapView.jsx";
import RowForm from "./components/RowForm.jsx";
import EditModal from "./components/EditModal.jsx";
import FilterBar, { EMPTY_FILTERS } from "./components/FilterBar.jsx";
import { ACHEMINEMENTS, STATUTS } from "./data/acheminements.js";
import { seed } from "./data/seed.js";
import { normalizeRow, newId, toCSV, fromCSV, fromJSON, download, readTextFile } from "./utils/io.js";
import { pushHistory } from "./utils/history.js";

const LS_KEY = "acheminements_db_v2";
const POINTS_URL = "/data/points.json"; // fichier JSON servi depuis public/, chargé au démarrage

// Charge les points depuis public/data/points.json (source de vérité éditable),
// avec repli sur le seed embarqué si le fichier est illisible.
async function fetchPointsFile() {
  const r = await fetch(POINTS_URL);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const arr = Array.isArray(data) ? data : data.rows;
  if (!Array.isArray(arr)) throw new Error("format invalide");
  return arr.map(normalizeRow);
}

function loadStored() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed.map(normalizeRow);
    }
  } catch {
    /* ignore */
  }
  return null;
}

function Legend() {
  return (
    <div className="legend">
      <h2>Légende</h2>
      <div className="legend-block">
        <h3>Types d'acheminement</h3>
        {ACHEMINEMENTS.map((a) => (
          <div key={a.id} className="legend-item">
            <span className="legend-dot" style={{ background: a.color }}>{a.icon}</span>
            {a.label}
          </div>
        ))}
      </div>
      <div className="legend-block">
        <h3>Statuts (bordure du point)</h3>
        {STATUTS.map((s) => (
          <div key={s.id} className="legend-item">
            <span
              className="legend-ring"
              style={{
                borderStyle: s.borderStyle,
                borderColor: s.muted ? "#94a3b8" : "#0ea5e9",
                boxShadow: s.doubleRing ? "0 0 0 2px var(--panel), 0 0 0 4px #0ea5e9" : "none",
              }}
            >
              {s.star ? "⭐" : ""}
            </span>
            {s.label}
          </div>
        ))}
      </div>
      <p className="legend-hint">
        💡 Clique sur un département de la carte pour filtrer. Survole un point pour voir sa fiche
        (✏️ modifier / 🗑 supprimer).
      </p>
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [mapStyle, setMapStyle] = useState("basic");
  const [dark, setDark] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const fileRef = useRef(null);

  // Chargement initial : localStorage (modifs utilisateur) sinon points.json au démarrage
  useEffect(() => {
    (async () => {
      const stored = loadStored();
      if (stored) {
        setRows(stored);
        setLoaded(true);
        return;
      }
      try {
        const fromFile = await fetchPointsFile();
        setRows(fromFile);
        setNotice(`${fromFile.length} points chargés depuis ${POINTS_URL}`);
      } catch {
        const fallback = seed.map((r) => ({ ...r, statuts: r.statuts.map((s) => ({ ...s })) }));
        setRows(fallback);
        setNotice(`${POINTS_URL} illisible — seed embarqué utilisé (${fallback.length} points)`);
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(rows));
    } catch {
      /* ignore */
    }
  }, [rows, loaded]);

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
  }, [dark]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const annee = filters.annee.trim();
    return rows.filter((r) => {
      if (filters.region !== "all" && r.region !== filters.region) return false;
      if (filters.ach !== "all" && !(r.acheminements || []).includes(filters.ach)) return false;
      if (filters.statut !== "all" && !(r.statuts || []).some((s) => s.statut === filters.statut))
        return false;
      if (annee) {
        const ok =
          (r.statuts || []).some((s) => (s.annee || "").includes(annee)) ||
          (r.note || "").includes(annee);
        if (!ok) return false;
      }
      if (q) {
        const hay = `${r.departement} ${r.region} ${r.beneficiaire}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  // Délégation de clics pour les boutons ✏️/🗑 rendus en HTML dans les tooltips Leaflet
  useEffect(() => {
    const h = (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "edit") setEditingId(btn.dataset.id);
      if (btn.dataset.action === "delete") deleteRow(btn.dataset.id);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRow = (values) => {
    const row = normalizeRow({ ...values, id: newId() });
    row.history = pushHistory(row, "création", `${row.departement} — ${row.beneficiaire}`);
    setRows((rs) => [...rs, row]);
    setNotice(`Ligne ajoutée : ${row.departement}`);
  };

  const updateRow = (id, values) => {
    setRows((rs) =>
      rs.map((r) =>
        r.id === id
          ? {
              ...normalizeRow({ ...r, ...values, id }),
              history: pushHistory(r, "modification", `${values.departement} — ${values.beneficiaire}`),
            }
          : r
      )
    );
    setEditingId(null);
    setNotice(`Ligne modifiée : ${values.departement}`);
  };

  const deleteRow = (id) => {
    const r = rows.find((x) => x.id === id);
    setRows((rs) => rs.filter((x) => x.id !== id));
    if (r) setNotice(`Ligne supprimée : ${r.departement}`);
  };

  const resetSeed = async () => {
    localStorage.removeItem(LS_KEY);
    try {
      const fromFile = await fetchPointsFile();
      setRows(fromFile);
      setNotice(`Données réinitialisées depuis ${POINTS_URL} (${fromFile.length} points)`);
    } catch {
      const fallback = seed.map((r) => ({ ...r, statuts: r.statuts.map((s) => ({ ...s })) }));
      setRows(fallback);
      setNotice("Réinitialisation sur le seed embarqué (points.json illisible)");
    }
    setFilters(EMPTY_FILTERS);
  };

  const exportCSV = () => download("acheminements.csv", toCSV(rows), "text/csv;charset=utf-8");
  const exportJSON = () =>
    download("acheminements.json", JSON.stringify(rows, null, 2), "application/json");

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await readTextFile(file);
      const imported = (file.name.toLowerCase().endsWith(".json") ? fromJSON(text) : fromCSV(text))
        .filter((r) => r.departement && r.acheminements.length)
        .map((r) => ({ ...r, history: pushHistory(r, "import", `fichier ${file.name}`) }));
      if (!imported.length) throw new Error("Aucune ligne valide trouvée");
      setRows((rs) => [...rs, ...imported]);
      setNotice(`${imported.length} ligne(s) importée(s) depuis ${file.name}`);
    } catch (err) {
      setNotice(`Import impossible : ${err.message}`);
    }
  };

  const toggleDark = () =>
    setDark((d) => {
      if (!d && mapStyle === "basic") setMapStyle("dark");
      if (d && mapStyle === "dark") setMapStyle("positron");
      return !d;
    });

  const editing = rows.find((r) => r.id === editingId) || null;

  return (
    <div className={dark ? "app dark" : "app"}>
      <header className="app-header">
        <h1>🗺️ Carte des acheminements — France &amp; DOM-TOM</h1>
        <div className="header-actions">
          <span className="count">{filtered.length}/{rows.length} points</span>
          <button type="button" className="hbtn" onClick={exportCSV} title="Exporter en CSV">⬇️ CSV</button>
          <button type="button" className="hbtn" onClick={exportJSON} title="Exporter en JSON">⬇️ JSON</button>
          <label className="hbtn file-btn" title="Importer un fichier CSV ou JSON">
            ⬆️ Importer
            <input ref={fileRef} type="file" accept=".json,.csv" hidden onChange={onImport} />
          </label>
          <button type="button" className="hbtn" onClick={() => window.print()} title="Imprimer la carte">🖨️</button>
          <button type="button" className="hbtn" onClick={toggleDark} title="Mode sombre / clair">
            {dark ? "☀️" : "🌙"}
          </button>
          <button type="button" onClick={resetSeed} className="reset-btn">Réinitialiser</button>
        </div>
      </header>
      {notice && (
        <div className="notice" onClick={() => setNotice("")}>{notice} ✕</div>
      )}
      {!loaded && <div className="notice">Chargement des points depuis {POINTS_URL}…</div>}
      <div className="layout">
        <aside className="sidebar">
          <div className="add-form">
            <h2>Ajouter une ligne</h2>
            <RowForm onSubmit={addRow} submitLabel="➕ Ajouter sur la carte" />
          </div>
          <Legend />
        </aside>
        <div className="map-col">
          <FilterBar filters={filters} setFilters={setFilters} />
          <MapView
            rows={filtered}
            style={mapStyle}
            dark={dark}
            onStyleChange={setMapStyle}
            onSelectDept={(nom) => setFilters((f) => ({ ...f, q: nom }))}
          />
        </div>
      </div>
      {editing && (
        <EditModal
          row={editing}
          onSubmit={(v) => updateRow(editing.id, v)}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
