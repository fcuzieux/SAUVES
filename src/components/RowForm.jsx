import { useEffect, useMemo, useState } from "react";
import { REGIONS, DEPT_BY_CODE, findCode, regionOfCode } from "../data/france.js";
import { ACHEMINEMENTS, STATUTS } from "../data/acheminements.js";
import { findDeptAt } from "../utils/geo.js";

const MAX_FILE = 800_000; // octets : au-delà, on stocke juste le nom/la taille

export default function RowForm({ initial, onSubmit, onCancel, submitLabel = "Enregistrer", pickedLL, onPickMode }) {
  const [region, setRegion] = useState(initial?.region ?? REGIONS[0].name);
  const [code, setCode] = useState(
    initial ? findCode(initial.region, initial.departement) : ""
  );
  const [beneficiaire, setBeneficiaire] = useState(initial?.beneficiaire ?? "");
  const [achs, setAchs] = useState(initial?.acheminements ?? []);
  const [statuts, setStatuts] = useState(
    initial?.statuts?.length ? initial.statuts : [{ statut: "routine", annee: "" }]
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [files, setFiles] = useState(initial?.files ?? []);
  const [lat, setLat] = useState(initial?.lat ?? "");
  const [lng, setLng] = useState(initial?.lng ?? "");
  const [error, setError] = useState("");

  const regionDef = REGIONS.find((x) => x.name === region);
  const isCOM = Boolean(regionDef?.com); // collectivité d'outre-mer -> département forcé à "COM"

  // Quand l'utilisateur a double-cliqué sur la carte en mode "picking", on pré-remplit lat/lng
  useEffect(() => {
    if (pickedLL) {
      setLat(String(+pickedLL.lat.toFixed(6)));
      setLng(String(+pickedLL.lng.toFixed(6)));
      setError("");
    }
  }, [pickedLL]);

  // Reverse geocoding : si lat/lng valides -> on cherche le département contenant le point
  // et on verrouille + remplit Région / Département automatiquement
  const latOk = lat.trim() !== "" && Number.isFinite(+lat) && Math.abs(+lat) <= 90;
  const lngOk = lng.trim() !== "" && Number.isFinite(+lng) && Math.abs(+lng) <= 180;
  const hasLL = latOk && lngOk;
  const [geo, setGeo] = useState(null); // null | "loading" | "none" | { code, nom, region }

  useEffect(() => {
    if (!hasLL) {
      setGeo(null);
      return;
    }
    // En COM, pas besoin de reverse geocoding : le territoire est déjà choisi
    if (isCOM && regionDef) {
      setGeo({ code: regionDef.codes[0], nom: "COM", region });
      return;
    }
    setGeo("loading");
    const t = setTimeout(async () => {
      try {
        const d = await findDeptAt(+lat, +lng);
        if (d && d.code) {
          const region = regionOfCode(d.code);
          setGeo({ ...d, region });
          if (region) {
            setRegion(region);
            setCode(d.code);
          }
        } else {
          setGeo("none");
        }
      } catch {
        setGeo("none");
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, isCOM, region]);

  const depts = useMemo(() => {
    const r = REGIONS.find((x) => x.name === region);
    return r ? r.codes.map((c) => DEPT_BY_CODE[c]) : [];
  }, [region]);

  const toggleAch = (id) =>
    setAchs((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  const setStatut = (i, key, value) =>
    setStatuts((prev) => prev.map((s, j) => (j === i ? { ...s, [key]: value } : s)));
  const addStatut = () => setStatuts((prev) => [...prev, { statut: "routine", annee: "" }]);
  const removeStatut = (i) => setStatuts((prev) => prev.filter((_, j) => j !== i));

  const addFiles = (e) => {
    const list = [...(e.target.files || [])];
    e.target.value = "";
    for (const f of list) {
      if (f.size <= MAX_FILE) {
        const fr = new FileReader();
        fr.onload = () =>
          setFiles((prev) => [...prev, { name: f.name, size: f.size, dataUrl: String(fr.result) }]);
        fr.readAsDataURL(f);
      } else {
        setFiles((prev) => [...prev, { name: f.name, size: f.size }]);
      }
    }
  };
  const removeFile = (i) => setFiles((prev) => prev.filter((_, j) => j !== i));

  const submit = (e) => {
    e.preventDefault();
    if (!isCOM && !code) return setError("Choisis un département.");
    if (!beneficiaire.trim()) return setError("Renseigne le bénéficiaire (ex. « 2 CHG »).");
    if (!achs.length) return setError("Coche au moins un type d'acheminement.");
    if (!statuts.length) return setError("Ajoute au moins un statut.");
    const hasLat = lat.trim() !== "";
    const hasLng = lng.trim() !== "";
    if (hasLat !== hasLng) return setError("Renseigne latitude ET longitude, ou aucune des deux.");
    const la = hasLat ? +lat : undefined;
    const ln = hasLng ? +lng : undefined;
    if (hasLat && (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180)) {
      return setError("Coordonnées invalides (lat -90..90, lng -180..180).");
    }
    if (hasLL) {
      if (geo === "loading") return setError("Résolution du département en cours…");
      if (geo === "none" || !geo) return setError("Ce point n'est pas en France / DOM-TOM : effacez lat/lng ou choisissez Région + Département.");
      if (!code) return setError("Département non résolu pour ce point.");
    }
    onSubmit({
      region,
      departement: isCOM ? "COM" : DEPT_BY_CODE[code].nom,
      beneficiaire: beneficiaire.trim(),
      acheminements: achs,
      statuts: statuts.map((s) => ({ statut: s.statut, annee: s.annee.trim() })),
      note: note.trim(),
      files,
      lat: hasLat ? la : undefined,
      lng: hasLng ? ln : undefined,
    });
  };

  return (
    <form className="row-form" onSubmit={submit}>
      <label>
        Région/Collectivité
        <select
          value={region}
          disabled={hasLL}
          onChange={(e) => {
            const v = e.target.value;
            const def = REGIONS.find((x) => x.name === v);
            setRegion(v);
            setCode(def?.com ? def.codes[0] : ""); // COM -> code du territoire, département affiché "COM"
          }}
        >
          {REGIONS.map((r) => (
            <option key={r.name} value={r.name}>{r.name}{r.com ? " (COM)" : ""}</option>
          ))}
        </select>
      </label>

      <label>
        Département
        {isCOM ? (
          <select value="COM" disabled>
            <option value="COM">COM</option>
          </select>
        ) : (
          <select value={code} disabled={hasLL} onChange={(e) => setCode(e.target.value)}>
            <option value="">— choisir —</option>
            {depts.map((d) => (
              <option key={d.code} value={d.code}>{d.nom} ({d.code})</option>
            ))}
          </select>
        )}
        {isCOM && <small className="hint">Collectivité d'outre-mer : département = COM.</small>}
        {hasLL && !isCOM && (
          <small className="hint">
            {geo === "loading" && "🔍 Recherche du département…"}
            {geo && geo !== "loading" && geo !== "none" && `📍 ${geo.nom} (${geo.code}) — ${geo.region} (détecté automatiquement depuis lat/lng)`}
            {geo === "none" && "⚠️ Ce point n'est pas en France / DOM-TOM"}
            {!geo && "🔍…"}
          </small>
        )}
      </label>

      <label>
        Bénéficiaire
        <input type="text" value={beneficiaire} onChange={(e) => setBeneficiaire(e.target.value)} placeholder="ex. 1 CHU + 2 CHG" />
      </label>

      <fieldset>
        <legend>Acheminement</legend>
        <div className="ach-grid">
          {ACHEMINEMENTS.map((a) => (
            <label key={a.id} className="ach-item">
              <input type="checkbox" checked={achs.includes(a.id)} onChange={() => toggleAch(a.id)} />
              <span style={{ color: a.color }}>{a.icon}</span> {a.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Statut(s) + année</legend>
        {statuts.map((s, i) => (
          <div className="statut-row" key={i}>
            <select value={s.statut} onChange={(e) => setStatut(i, "statut", e.target.value)}>
              {STATUTS.map((st) => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={s.annee}
              onChange={(e) => setStatut(i, "annee", e.target.value)}
              placeholder="Année / période (ex. 2027, 2021-2023)"
            />
            {statuts.length > 1 && (
              <button type="button" className="mini-btn danger" onClick={() => removeStatut(i)} title="Retirer ce statut">🗑</button>
            )}
          </div>
        ))}
        <button type="button" className="mini-btn" onClick={addStatut}>+ Ajouter un statut</button>
      </fieldset>

      <label>
        Note (optionnel)
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex. contrat cadre, prestataire…" />
      </label>

      <fieldset>
        <legend>Position manuelle (optionnel)</legend>
        <div className="ll-row">
          <label>
            Latitude
            <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="ex. 45.7640" />
          </label>
          <label>
            Longitude
            <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="ex. 4.8357" />
          </label>
        </div>
        <small className="hint">Si renseignées, le point est placé exactement ici (prioritaire sur le centroïde du département). Sinon, centroïde automatique.</small>
        {hasLL && (
          <button type="button" className="mini-btn danger" style={{ marginTop: "0.4rem" }} onClick={() => { setLat(""); setLng(""); setGeo(null); }}>
            ✕ Effacer lat/lng (repasser en choix manuel Région/Département)
          </button>
        )}
        {onPickMode && (
          <button type="button" className="mini-btn pick-btn" onClick={onPickMode} style={{ marginTop: "0.4rem" }}>
            🗺️ Pointer sur la carte
          </button>
        )}
        {onPickMode && (
          <small className="hint">La fenêtre se masque : naviguez sur la carte et <b>double-cliquez</b> à l'endroit voulu — lat/lng seront remplis automatiquement.</small>
        )}
      </fieldset>

      <fieldset>
        <legend>Pièces jointes (optionnel)</legend>
        {files.length > 0 && (
          <ul className="file-list">
            {files.map((f, i) => (
              <li key={i}>
                📎 {f.name} <small>({(f.size / 1024).toFixed(0)} kB{f.dataUrl ? "" : ", non embarqué"})</small>
                <button type="button" className="mini-btn danger" onClick={() => removeFile(i)}>✕</button>
              </li>
            ))}
          </ul>
        )}
        <input type="file" multiple onChange={addFiles} />
        <small className="hint">Fichiers ≤ 800 kB embarqués (data URL), les autres référencés par nom.</small>
      </fieldset>

      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="mini-btn" onClick={onCancel}>Annuler</button>
        )}
        <button type="submit" className="submit-btn">{submitLabel}</button>
      </div>
    </form>
  );
}
