import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapView from "./components/MapView.jsx";
import RowForm from "./components/RowForm.jsx";
import FormModal from "./components/FormModal.jsx";
import ConfirmModal from "./components/ConfirmModal.jsx";
import FilterBar, { EMPTY_FILTERS } from "./components/FilterBar.jsx";
import { ACHEMINEMENTS, STATUTS } from "./data/acheminements.js";
import { REGIONS } from "./data/france.js";
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

// Hexagone + Monde + un bouton par DOM et par COM (ordre de la liste des régions)
const DOM_CODES = ["971", "972", "973", "974", "976"];
const TERRITOIRE_BOUTONS = [
  ["hexagone", "Hexagone"],
  ["monde", "🌍 Monde"],
  ...REGIONS.filter((r) => r.com || DOM_CODES.includes(r.codes[0])).map((r) => [r.codes[0], r.name]),
];

function Legend({ rows, hiddenAchs, onToggleAch, view, onViewChange }) {
  const counts = {};
  for (const r of rows) for (const a of r.acheminements || []) counts[a] = (counts[a] || 0) + 1;
  return (
    <div className="legend">
      <h2>Légende</h2>
      <p className="legend-count">
        {rows.length} ligne{rows.length > 1 ? "s" : ""} en activité. Zoomez ou cliquez sur un
        département pour les voir.
      </p>
      <div className="legend-block">
        <h3>Types d'acheminement</h3>
        {ACHEMINEMENTS.map((a) => {
          const hidden = hiddenAchs.has(a.id);
          return (
            <label key={a.id} className="legend-item legend-toggle">
              <input type="checkbox" checked={!hidden} onChange={() => onToggleAch(a.id)} />
              <span className="legend-dot" style={{ background: a.color, opacity: hidden ? 0.3 : 1 }}>{a.icon}</span>
              <span className="legend-label" style={{ opacity: hidden ? 0.45 : 1 }}>{a.label}</span>
              <span className="legend-n">{counts[a.id] || 0}</span>
            </label>
          );
        })}
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
      <div className="legend-block">
        <h3>Territoire</h3>
        <div className="view-btns">
          {TERRITOIRE_BOUTONS.map(([v, l]) => (
            <button key={v} type="button" className={view === v ? "active" : ""} onClick={() => onViewChange(v)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <p className="legend-hint">
        💡 Clique sur un département / une région de la carte pour filtrer et voir sa fiche
        récapitulative. <b>Survole</b> un point pour voir sa
        fiche, <b>clique</b> dessus pour la garder ouverte (✏️ modifier / 🗑 supprimer), puis
        reclique sur le point, ailleurs sur la carte, ou Échap pour la fermer.
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
  const [adding, setAdding] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickedLL, setPickedLL] = useState(null);
  const [view, setView] = useState("hexagone"); // hexagone | monde | dom | com
  const [hiddenAchs, setHiddenAchs] = useState(() => new Set()); // types d'acheminement masqués

  const toggleAchVisibility = (id) =>
    setHiddenAchs((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const [confirm, setConfirm] = useState(null); // { kind: "delete", row } | { kind: "save", id, values }
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
      if (hiddenAchs.size && !(r.acheminements || []).some((a) => !hiddenAchs.has(a))) return false;
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
  }, [rows, filters, hiddenAchs]);

  // Délégation de clics pour les boutons ✏️/🗑 rendus en HTML dans les tooltips Leaflet
  useEffect(() => {
    const h = (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      if (btn.dataset.action === "edit") setEditingId(btn.dataset.id);
      if (btn.dataset.action === "delete") {
        const row = rowsRef.current.find((x) => x.id === btn.dataset.id);
        if (row) setConfirm({ kind: "delete", row });
      }
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // rowsRef pour lire les lignes courantes dans la délégation de clics
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

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

  // Handlers stables (évite de recréer la couche GeoJSON à chaque rendu)
  const onSelectDept = useCallback((nom) => setFilters((f) => ({ ...f, q: nom })), []);
  const onSelectRegion = useCallback((nom) => setFilters((f) => ({ ...f, region: nom })), []);

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
          <div className="add-panel">
            <button type="button" className="submit-btn" onClick={() => setAdding(true)}>
              ➕ Ajouter une ligne
            </button>
          </div>
          <Legend
            rows={rows}
            hiddenAchs={hiddenAchs}
            onToggleAch={toggleAchVisibility}
            view={view}
            onViewChange={setView}
          />
        </aside>
        <div className="map-col">
          <FilterBar filters={filters} setFilters={setFilters} />
          <MapView
            rows={filtered}
            allRows={rows}
            style={mapStyle}
            dark={dark}
            onStyleChange={setMapStyle}
            onSelectDept={onSelectDept}
            onSelectRegion={onSelectRegion}
            view={view}
            picking={picking}
            onPick={(latlng) => {
              setPickedLL({ lat: latlng.lat, lng: latlng.lng });
              setPicking(false);
            }}
            onCancelPick={() => setPicking(false)}
          />
        </div>
      </div>
      {adding && (
        <FormModal
          title="➕ Ajouter une ligne"
          hidden={picking}
          pickedLL={pickedLL}
          onPickMode={() => setPicking(true)}
          onSubmit={(v) => {
            addRow(v);
            setAdding(false);
            setPickedLL(null);
          }}
          onCancel={() => { setAdding(false); setPicking(false); setPickedLL(null); }}
          submitLabel="➕ Ajouter sur la carte"
        />
      )}
      {editing && (
        <FormModal
          title={`✏️ Modifier — ${editing.departement}`}
          initial={editing}
          hidden={picking}
          pickedLL={pickedLL}
          onPickMode={() => setPicking(true)}
          onSubmit={(v) => setConfirm({ kind: "save", id: editing.id, values: v })}
          onCancel={() => { setEditingId(null); setPicking(false); setPickedLL(null); }}
          submitLabel="💾 Enregistrer"
        />
      )}
      {confirm?.kind === "delete" && (
        <ConfirmModal
          title="Supprimer cette ligne ?"
          message={`« ${confirm.row.departement} — ${confirm.row.beneficiaire} » sera définitivement supprimée de la carte.`}
          confirmLabel="🗑 Supprimer"
          onConfirm={() => {
            deleteRow(confirm.row.id);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.kind === "save" && (
        <ConfirmModal
          title="Enregistrer les modifications ?"
          message={`Les modifications sur « ${confirm.values.departement} — ${confirm.values.beneficiaire} » seront appliquées et journalisées dans l'historique.`}
          confirmLabel="💾 Enregistrer"
          onConfirm={() => {
            updateRow(confirm.id, confirm.values);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
