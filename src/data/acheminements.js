export const ACHEMINEMENTS = [
  { id: "prelevements", label: "Prélèvements biologiques", icon: "🧪", color: "#3b82f6" },
  { id: "medicaments", label: "Médicaments", icon: "💊", color: "#f59e0b" },
  { id: "materiel", label: "Matériel médical", icon: "🩺", color: "#8b5cf6" },
  { id: "sang", label: "Produits sanguins", icon: "🩸", color: "#dc2626" },
  { id: "biberons", label: "Biberons pour prématurés", icon: "🍼", color: "#ec4899" },
  { id: "secours", label: "Sauvetage-Secours", icon: "🚁", color: "#f97316" },
  { id: "defibrillateur", label: "Défibrillateur", icon: "⚡", color: "#eab308" },
  { id: "greffons", label: "Greffons de rein", icon: "🫘", color: "#92400e" },
];

export const STATUTS = [
  { id: "routine", label: "Routine", borderStyle: "solid" },
  { id: "expedition", label: "Expédition en cours", borderStyle: "solid", doubleRing: true },
  { id: "projet", label: "Projet", borderStyle: "dashed" },
  { id: "demo", label: "Démo faisabilité", borderStyle: "dotted", star: true },
  { id: "aucun", label: "Aucun", borderStyle: "solid", muted: true },
];

export const achById = Object.fromEntries(ACHEMINEMENTS.map((a) => [a.id, a]));
export const statutById = Object.fromEntries(STATUTS.map((s) => [s.id, s]));
