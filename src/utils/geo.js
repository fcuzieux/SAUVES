// Chargement du GeoJSON des départements (métropole + outre-mer) et reverse geocoding
export const DEPT_SOURCES = [
  "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-avec-outre-mer.geojson",
  "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/france-departments.geojson",
];

let deptCache = null;

export async function loadDeptGeo() {
  if (deptCache) return deptCache;
  for (const url of DEPT_SOURCES) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        deptCache = await r.json();
        return deptCache;
      }
    } catch {
      /* source suivante */
    }
  }
  return null;
}

export const deptProps = (f) => {
  const p = f.properties || {};
  return {
    code: String(p.code ?? p.code_insee ?? p.CODE_DEPT ?? ""),
    nom: String(p.nom ?? p.NOM_DEPT ?? p.name ?? ""),
  };
};

// --- point-in-polygon (ray casting, coordonnées GeoJSON = [lng, lat]) ---
export function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function pointInPolygon(x, y, poly) {
  // poly = [anneau extérieur, ...trous]
  if (!poly.length || !pointInRing(x, y, poly[0])) return false;
  for (let i = 1; i < poly.length; i++) if (pointInRing(x, y, poly[i])) return false;
  return true;
}

// Retourne { code, nom } du département contenant le point, ou null (hors France / données indispo)
export async function findDeptAt(lat, lng, data) {
  const geo = data !== undefined ? data : await loadDeptGeo();
  if (!geo) return null;
  const la = +lat;
  const ln = +lng;
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  for (const f of geo.features || []) {
    const { code, nom } = deptProps(f);
    const g = f.geometry;
    if (!g) continue;
    const polys =
      g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
    for (const poly of polys) {
      if (pointInPolygon(ln, la, poly)) return { code, nom };
    }
  }
  return null;
}
