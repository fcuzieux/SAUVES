import { useEffect, useState } from "react";
import MapView from "./components/MapView.jsx";
import AddForm from "./components/AddForm.jsx";
import { ACHEMINEMENTS, STATUTS } from "./data/acheminements.js";
import { seed } from "./data/seed.js";

const LS_KEY = "acheminements_db_v1";

function loadRows() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  return seed.map((r) => ({ ...r }));
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
        <h3>Statuts</h3>
        {STATUTS.map((s) => (
          <div key={s.id} className="legend-item">
            <span
              className="legend-ring"
              style={{
                borderStyle: s.borderStyle,
                borderColor: s.muted ? "#94a3b8" : "#0ea5e9",
                boxShadow: s.doubleRing
                  ? "0 0 0 2px #fff, 0 0 0 4px #0ea5e9"
                  : "none",
              }}
            >
              {s.star ? "⭐" : ""}
            </span>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [rows, setRows] = useState(loadRows);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(rows));
    } catch {
      /* ignore */
    }
  }, [rows]);

  const addRow = (row) => setRows((rs) => [...rs, row]);
  const deleteRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));
  const resetSeed = () => {
    localStorage.removeItem(LS_KEY);
    setRows(seed.map((r) => ({ ...r })));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗺️ Carte des acheminements — France &amp; DOM-TOM</h1>
        <div className="header-actions">
          <span className="count">{rows.length} point{rows.length > 1 ? "s" : ""}</span>
          <button type="button" onClick={resetSeed} className="reset-btn">
            Réinitialiser les données
          </button>
        </div>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <AddForm onAdd={addRow} />
          <Legend />
        </aside>
        <MapView rows={rows} onDelete={deleteRow} />
      </div>
    </div>
  );
}
