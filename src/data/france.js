export const REGIONS = [
  { name: "Auvergne-Rhône-Alpes", codes: ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"] },
  { name: "Bourgogne-Franche-Comté", codes: ["21", "25", "39", "58", "70", "71", "89", "90"] },
  { name: "Bretagne", codes: ["22", "29", "35", "56"] },
  { name: "Centre-Val de Loire", codes: ["18", "28", "36", "37", "41", "45"] },
  { name: "Corse", codes: ["2A", "2B"] },
  { name: "Grand Est", codes: ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"] },
  { name: "Hauts-de-France", codes: ["02", "59", "60", "62", "80"] },
  { name: "Île-de-France", codes: ["75", "77", "78", "91", "92", "93", "94", "95"] },
  { name: "Normandie", codes: ["14", "27", "50", "61", "76"] },
  { name: "Nouvelle-Aquitaine", codes: ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"] },
  { name: "Occitanie", codes: ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"] },
  { name: "Pays de la Loire", codes: ["44", "49", "53", "72", "85"] },
  { name: "Provence-Alpes-Côte d'Azur", codes: ["04", "05", "06", "13", "83", "84"] },
  { name: "Guadeloupe", codes: ["971"] },
  { name: "Martinique", codes: ["972"] },
  { name: "Guyane", codes: ["973"] },
  { name: "La Réunion", codes: ["974"] },
  { name: "Mayotte", codes: ["976"] },
  // Collectivités d'outre-mer (COM) — en bas de liste, département forcé à "COM"
  { name: "Saint-Pierre-et-Miquelon", codes: ["975"], com: true },
  { name: "Saint-Martin", codes: ["977"], com: true },
  { name: "Saint-Barthélemy", codes: ["978"], com: true },
  { name: "Wallis-et-Futuna", codes: ["986"], com: true },
  { name: "Polynésie française", codes: ["987"], com: true },
  { name: "Nouvelle-Calédonie", codes: ["988"], com: true },
];

// [code, nom, lat, lng, zone DOM-TOM facultative]
const RAW = [
  ["01", "Ain", 46.20, 5.45],
  ["02", "Aisne", 49.60, 3.60],
  ["03", "Allier", 46.30, 3.35],
  ["04", "Alpes-de-Haute-Provence", 44.10, 6.20],
  ["05", "Hautes-Alpes", 44.55, 6.10],
  ["06", "Alpes-Maritimes", 43.95, 7.25],
  ["07", "Ardèche", 44.75, 4.60],
  ["08", "Ardennes", 49.75, 4.70],
  ["09", "Ariège", 42.95, 1.60],
  ["10", "Aube", 48.30, 4.10],
  ["11", "Aude", 43.20, 2.60],
  ["12", "Aveyron", 44.35, 2.55],
  ["13", "Bouches-du-Rhône", 43.55, 5.20],
  ["14", "Calvados", 49.15, -0.55],
  ["15", "Cantal", 45.05, 2.70],
  ["16", "Charente", 45.65, 0.20],
  ["17", "Charente-Maritime", 45.75, -0.85],
  ["18", "Cher", 47.00, 2.45],
  ["19", "Corrèze", 45.30, 1.95],
  ["2A", "Corse-du-Sud", 41.95, 9.00],
  ["2B", "Haute-Corse", 42.55, 9.30],
  ["21", "Côte-d'Or", 47.35, 5.00],
  ["22", "Côtes-d'Armor", 48.45, -2.90],
  ["23", "Creuse", 46.05, 2.10],
  ["24", "Dordogne", 45.05, 0.75],
  ["25", "Doubs", 47.20, 6.20],
  ["26", "Drôme", 44.55, 5.15],
  ["27", "Eure", 49.10, 1.15],
  ["28", "Eure-et-Loir", 48.40, 1.45],
  ["29", "Finistère", 48.35, -4.10],
  ["30", "Gard", 43.95, 4.25],
  ["31", "Haute-Garonne", 43.45, 1.30],
  ["32", "Gers", 43.65, 0.65],
  ["33", "Gironde", 44.85, -0.60],
  ["34", "Hérault", 43.55, 3.40],
  ["35", "Ille-et-Vilaine", 48.15, -1.60],
  ["36", "Indre", 46.85, 1.65],
  ["37", "Indre-et-Loire", 47.25, 0.75],
  ["38", "Isère", 45.40, 5.55],
  ["39", "Jura", 46.70, 5.60],
  ["40", "Landes", 43.95, -0.70],
  ["41", "Loir-et-Cher", 47.60, 1.45],
  ["42", "Loire", 46.05, 4.00],
  ["43", "Haute-Loire", 45.05, 3.85],
  ["44", "Loire-Atlantique", 47.20, -1.55],
  ["45", "Loiret", 47.90, 2.20],
  ["46", "Lot", 44.60, 1.55],
  ["47", "Lot-et-Garonne", 44.35, 0.45],
  ["48", "Lozère", 44.55, 3.45],
  ["49", "Maine-et-Loire", 47.35, -0.60],
  ["50", "Manche", 48.85, -1.30],
  ["51", "Marne", 48.95, 4.30],
  ["52", "Haute-Marne", 48.15, 5.15],
  ["53", "Mayenne", 48.10, -0.65],
  ["54", "Meurthe-et-Moselle", 48.75, 6.15],
  ["55", "Meuse", 49.00, 5.40],
  ["56", "Morbihan", 47.75, -2.80],
  ["57", "Moselle", 49.00, 6.70],
  ["58", "Nièvre", 47.05, 3.55],
  ["59", "Nord", 50.35, 3.40],
  ["60", "Oise", 49.45, 2.50],
  ["61", "Orne", 48.65, -0.15],
  ["62", "Pas-de-Calais", 50.45, 2.30],
  ["63", "Puy-de-Dôme", 45.70, 3.15],
  ["64", "Pyrénées-Atlantiques", 43.25, -0.85],
  ["65", "Hautes-Pyrénées", 43.10, 0.05],
  ["66", "Pyrénées-Orientales", 42.65, 2.60],
  ["67", "Bas-Rhin", 48.65, 7.60],
  ["68", "Haut-Rhin", 47.85, 7.25],
  ["69", "Rhône", 45.85, 4.75],
  ["70", "Haute-Saône", 47.65, 6.15],
  ["71", "Saône-et-Loire", 46.55, 4.65],
  ["72", "Sarthe", 48.05, 0.25],
  ["73", "Savoie", 45.55, 6.05],
  ["74", "Haute-Savoie", 46.05, 6.40],
  ["75", "Paris", 48.8566, 2.3522],
  ["76", "Seine-Maritime", 49.55, 0.85],
  ["77", "Seine-et-Marne", 48.60, 2.95],
  ["78", "Yvelines", 48.80, 1.95],
  ["79", "Deux-Sèvres", 46.40, -0.35],
  ["80", "Somme", 49.90, 2.40],
  ["81", "Tarn", 43.75, 2.10],
  ["82", "Tarn-et-Garonne", 44.05, 1.10],
  ["83", "Var", 43.40, 6.10],
  ["84", "Vaucluse", 43.95, 4.95],
  ["85", "Vendée", 46.65, -1.20],
  ["86", "Vienne", 46.55, 0.45],
  ["87", "Haute-Vienne", 45.90, 1.15],
  ["88", "Vosges", 48.15, 6.35],
  ["89", "Yonne", 47.85, 3.50],
  ["90", "Territoire de Belfort", 47.65, 6.85],
  ["91", "Essonne", 48.60, 2.35],
  ["92", "Hauts-de-Seine", 48.85, 2.25],
  ["93", "Seine-Saint-Denis", 48.90, 2.45],
  ["94", "Val-de-Marne", 48.80, 2.45],
  ["95", "Val-d'Oise", 49.05, 2.10],
  ["971", "Guadeloupe", 16.25, -61.58, "antilles"],
  ["972", "Martinique", 14.64, -61.02, "antilles"],
  ["973", "Guyane", 3.93, -53.08, "guyane"],
  ["974", "La Réunion", -21.12, 55.53, "reunion"],
  ["976", "Mayotte", -12.83, 45.17, "mayotte"],
  ["975", "Saint-Pierre-et-Miquelon", 46.85, -56.30, "spm"],
  ["977", "Saint-Martin", 18.07, -63.05, "antilles"],
  ["978", "Saint-Barthélemy", 17.90, -62.85, "antilles"],
  ["986", "Wallis-et-Futuna", -13.30, 176.20, "pacifique"],
  ["987", "Polynésie française", -17.70, -149.40, "pacifique"],
  ["988", "Nouvelle-Calédonie", -21.30, 165.80, "pacifique"],
];

export const DEPARTMENTS = Object.fromEntries(
  RAW.map(([code, nom, lat, lng, zone]) => [code, { code, nom, lat, lng, zone: zone ?? "metro" }])
);

export const DEPT_BY_CODE = DEPARTMENTS;

const norm = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const BY_NORM = Object.fromEntries(Object.values(DEPARTMENTS).map((d) => [norm(d.nom), d]));

// Bounding boxes des zones DOM-TOM (pour classer un lat/lng manuel)
const DOM_BOXES = [
  { zone: "guyane", lat: [1.5, 6], lng: [-55, -51] },
  { zone: "antilles", lat: [14, 18.3], lng: [-63.3, -60.3] },
  { zone: "reunion", lat: [-21.5, -20.7], lng: [55.2, 55.9] },
  { zone: "mayotte", lat: [-13.2, -12.5], lng: [44.9, 45.4] },
  { zone: "spm", lat: [46.5, 47.2], lng: [-56.6, -56.0] },
  { zone: "pacifique", lat: [-22.5, -12.5], lng: [164, 177] }, // Wallis-et-Futuna, Nouvelle-Calédonie
  { zone: "pacifique", lat: [-24, -8], lng: [-155, -134] }, // Polynésie française
];
export function zoneFromLatLng(lat, lng) {
  for (const b of DOM_BOXES) {
    if (lat >= b.lat[0] && lat <= b.lat[1] && lng >= b.lng[0] && lng <= b.lng[1]) return b.zone;
  }
  return "metro";
}

// Résout la position d'une ligne : lat/lng manuels prioritaires, sinon centroïde du département.
// "COM" comme département = collectivité d'outre-mer : on retombe sur le code de la région choisie.
export function resolveCoords(departement, lat, lng, region) {
  let depName = String(departement);
  if (norm(depName) === "com" && region) {
    const r = REGIONS.find((x) => x.name === region);
    if (r && r.codes[0]) depName = DEPARTMENTS[r.codes[0]].nom;
  }
  const parts = String(depName)
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
  const found = parts.map((p) => BY_NORM[norm(p)]).filter(Boolean);
  const base = found.length
    ? {
        lat: found.reduce((a, d) => a + d.lat, 0) / found.length,
        lng: found.reduce((a, d) => a + d.lng, 0) / found.length,
        zone: found[0].zone,
        code: found[0].code,
      }
    : { lat: 46.6, lng: 2.5, zone: "metro", code: null };
  const la = +lat, ln = +lng;
  const hasLL =
    Number.isFinite(la) && Number.isFinite(ln) &&
    !(la === 0 && ln === 0) && Math.abs(la) <= 90 && Math.abs(ln) <= 180;
  if (hasLL) {
    return { lat: la, lng: ln, zone: found.length ? base.zone : zoneFromLatLng(la, ln), code: base.code };
  }
  return base;
}

// Région correspondant à un code département (pour le reverse geocoding)
export function regionOfCode(code) {
  const r = REGIONS.find((x) => x.codes.includes(String(code)));
  return r ? r.name : "";
}

// Retrouve le code département à partir de la région + du nom (pré-remplissage du formulaire)
export function findCode(regionName, deptName) {
  const r = REGIONS.find((x) => x.name === regionName);
  if (!r) return "";
  if (norm(deptName) === "com") return r.codes[0] ?? ""; // COM -> code du territoire
  const first = String(deptName).split("/")[0].trim();
  const d = r.codes.map((c) => DEPARTMENTS[c]).find((d) => d.nom === first);
  return d ? d.code : "";
}
