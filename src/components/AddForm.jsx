import { useMemo, useState } from "react";
import { REGIONS, DEPT_BY_CODE } from "../data/france.js";
import { ACHEMINEMENTS, STATUTS } from "../data/acheminements.js";

export default function AddForm({ onAdd }) {
  const [region, setRegion] = useState(REGIONS[0].name);
  const [code, setCode] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");
  const [achs, setAchs] = useState([]);
  const [statut, setStatut] = useState("routine");
  const [annee, setAnnee] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const depts = useMemo(() => {
    const r = REGIONS.find((x) => x.name === region);
    return r ? r.codes.map((c) => DEPT_BY_CODE[c]) : [];
  }, [region]);

  const toggleAch = (id) =>
    setAchs((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  const submit = (e) => {
    e.preventDefault();
    if (!code) return setError("Choisis un département.");
    if (!beneficiaire.trim()) return setError("Renseigne le bénéficiaire (ex. « 2 CHG »).");
    if (!achs.length) return setError("Coche au moins un type d'acheminement.");
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `r-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    onAdd({
      id,
      region,
      departement: DEPT_BY_CODE[code].nom,
      beneficiaire: beneficiaire.trim(),
      acheminements: achs,
      statut,
      annee: annee.trim(),
      note: note.trim(),
    });
    setCode("");
    setBeneficiaire("");
    setAchs([]);
    setStatut("routine");
    setAnnee("");
    setNote("");
    setError("");
  };

  return (
    <form className="add-form" onSubmit={submit}>
      <h2>Ajouter une ligne</h2>

      <label>
        Région
        <select value={region} onChange={(e) => { setRegion(e.target.value); setCode(""); }}>
          {REGIONS.map((r) => (
            <option key={r.name} value={r.name}>{r.name}</option>
          ))}
        </select>
      </label>

      <label>
        Département
        <select value={code} onChange={(e) => setCode(e.target.value)}>
          <option value="">— choisir —</option>
          {depts.map((d) => (
            <option key={d.code} value={d.code}>{d.nom} ({d.code})</option>
          ))}
        </select>
      </label>

      <label>
        Bénéficiaire
        <input
          type="text"
          value={beneficiaire}
          onChange={(e) => setBeneficiaire(e.target.value)}
          placeholder="ex. 1 CHU + 2 CHG"
        />
      </label>

      <fieldset>
        <legend>Acheminement</legend>
        <div className="ach-grid">
          {ACHEMINEMENTS.map((a) => (
            <label key={a.id} className="ach-item">
              <input
                type="checkbox"
                checked={achs.includes(a.id)}
                onChange={() => toggleAch(a.id)}
              />
              <span style={{ color: a.color }}>{a.icon}</span> {a.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        Statut
        <select value={statut} onChange={(e) => setStatut(e.target.value)}>
          {STATUTS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </label>

      <label>
        Année / période
        <input
          type="text"
          value={annee}
          onChange={(e) => setAnnee(e.target.value)}
          placeholder="ex. 2027 ou 2021-2023"
        />
      </label>

      <label>
        Note (optionnel)
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ex. Démo faisabilité 2015-2017"
        />
      </label>

      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="submit-btn">➕ Ajouter sur la carte</button>
    </form>
  );
}
