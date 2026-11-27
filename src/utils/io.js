import { ACHEMINEMENTS } from "../data/acheminements.js";

const achIds = new Set(ACHEMINEMENTS.map((a) => a.id));

export function newId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `r-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function normalizeRow(r) {
  const statuts =
    Array.isArray(r.statuts) && r.statuts.length
      ? r.statuts.map((s) => ({ statut: String(s.statut || "aucun"), annee: String(s.annee || "") }))
      : [{ statut: String(r.statut || "aucun"), annee: String(r.annee || "") }];
  return {
    id: r.id || newId(),
    region: String(r.region || ""),
    departement: String(r.departement || ""),
    beneficiaire: String(r.beneficiaire || ""),
    acheminements: Array.isArray(r.acheminements)
      ? r.acheminements.filter((a) => achIds.has(a))
      : [],
    statuts,
    note: String(r.note || ""),
    files: Array.isArray(r.files) ? r.files : [],
    history: Array.isArray(r.history) ? r.history.slice(-20) : [],
  };
}

// ---------- CSV (séparateur ;, champs entre guillemets si besoin) ----------

const csvEsc = (v) => {
  const s = String(v ?? "");
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV(rows) {
  const head = ["id", "region", "departement", "beneficiaire", "acheminements", "statuts", "note"];
  const lines = [head.join(";")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.region,
        r.departement,
        r.beneficiaire,
        (r.acheminements || []).join("|"),
        (r.statuts || []).map((s) => `${s.statut}:${s.annee || ""}`).join("|"),
        r.note || "",
      ]
        .map(csvEsc)
        .join(";")
    );
  }
  return "\uFEFF" + lines.join("\r\n"); // BOM pour Excel
}

export function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ";") { cur.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      cur.push(field); field = "";
      if (cur.length > 1 || cur[0] !== "") rows.push(cur);
      cur = [];
    } else field += c;
  }
  if (field !== "" || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

export function fromCSV(text) {
  const table = parseCSV(text.replace(/^\uFEFF/, ""));
  if (!table.length) return [];
  const head = table[0].map((h) => h.trim().toLowerCase());
  const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  return table.slice(1).map((cols) =>
    normalizeRow({
      id: cols[idx.id] || undefined,
      region: cols[idx.region] || "",
      departement: cols[idx.departement] || "",
      beneficiaire: cols[idx.beneficiaire] || "",
      acheminements: (cols[idx.acheminements] || "")
        .split("|").map((s) => s.trim()).filter((a) => achIds.has(a)),
      statuts: (cols[idx.statuts] || "")
        .split("|").map((s) => s.trim()).filter(Boolean)
        .map((p) => {
          const [st, a] = p.split(":");
          return { statut: st, annee: a || "" };
        })
        .filter((s) => s.statut),
      note: cols[idx.note] || "",
    })
  );
}

export function fromJSON(text) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : data.rows;
  if (!Array.isArray(arr)) throw new Error("Format JSON invalide (tableau attendu)");
  return arr.map(normalizeRow);
}

export function readTextFile(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsText(file);
  });
}
