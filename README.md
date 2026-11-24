# Carte des acheminements — France & DOM-TOM

Application React (Vite) qui affiche les lignes de la base (Région, Département,
Bénéficiaire, Acheminement, Statut, Année) sur une carte Leaflet de la France
métropolitaine avec encarts DOM-TOM (Guyane, Antilles, La Réunion, Mayotte).

- Chaque ligne = un point sur le département (centroïde).
- Icône(s) dans le point = type(s) d'acheminement ; taille ∝ nombre de sites du bénéficiaire.
- Bordure du point = statut (plein = Routine, double anneau = Expédition en cours,
  tirets = Projet, pointillés + ⭐ = Démo faisabilité).
- Survol d'un point = capsule avec toutes les infos + bouton supprimer.
- Formulaire latéral pour ajouter une ligne (persistée en `localStorage`).

## Lancement

```bash
npm install
npm run dev
```

Build de production : `npm run build`, aperçu : `npm run preview`.

## Structure

- `src/data/france.js` — régions, départements (code, nom, lat/lng, zone), `resolveCoords()`
- `src/data/acheminements.js` — types d'acheminement (icône/couleur) et statuts
- `src/data/seed.js` — les 42 lignes du tableau original
- `src/components/MapView.jsx` — carte Leaflet, marqueurs `divIcon`, tooltips, encarts DOM-TOM
- `src/components/AddForm.jsx` — formulaire d'ajout d'une ligne
- `src/App.jsx` — état global, persistance `localStorage`, légende

Pour brancher une vraie base (API/Supabase/...), remplacer `loadRows`/`useEffect`
dans `App.jsx` par des appels réseau.
