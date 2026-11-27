# Carte des acheminements — France & DOM-TOM

Application React (Vite + Leaflet) qui affiche les lignes de la base (Région, Département,
Bénéficiaire, Acheminement, Statut(s) + année, Note, Pièces jointes, Historique) sur une carte
de France avec encarts DOM-TOM (Guyane, Antilles, La Réunion, Mayotte).

## Fonctionnalités

- **Un point par ligne** au centroïde du département : icône(s) = type(s) d'acheminement
  (🧪 💊 🩺 🩸 🍼 🚁 ⚡ 🫘), taille ∝ nombre de sites du bénéficiaire, bordure = statut
  (plein = Routine, double anneau = Expédition en cours, tirets = Projet, pointillés + ⭐ =
  Démo faisabilité). Plusieurs statuts par ligne possibles (ex. Gironde : expédition 2026 +
  démo 2015-2017).
- **Fiche au survol** : toutes les infos + historique + pièces jointes + boutons ✏️ Modifier /
  🗑 Supprimer.
- **Formulaire d'ajout / édition** : région → département dépendant, multi-acheminements,
  liste dynamique de statuts + années, note, pièces jointes (≤ 800 kB embarquées en data URL).
- **Filtres et recherche** : texte (département/région/bénéficiaire), région, acheminement,
  statut, année.
- **Styles de carte** : Basic (OSM), Positron, Dark Matter (CARTO) via le sélecteur en haut à
  droite de la carte. **Mode sombre** 🌙 pour toute l'interface. **🖨️ Impression** de la carte.
- **Carte améliorée** : contours des départements chargés en GeoJSON (cliquer = filtrer sur le
  département), regroupement des points en clusters au zoom arrière (leaflet.markercluster).
- **Export / import** : CSV (séparateur `;`, compatible Excel) et JSON ; import de fichier
  `.csv`/`.json` (les lignes sont ajoutées à la base).
- **Persistance** `localStorage` (seed = les 42 lignes du tableau initial), réinitialisation
  possible depuis l'en-tête.

## Lancement

```bash
npm install
npm run dev
```

Build : `npm run build`, aperçu : `npm run preview`. CI GitHub Actions : `npm ci && npm run build`.

## Structure

- `src/data/france.js` — régions, 101 départements (code, nom, lat/lng, zone), `resolveCoords()`, `findCode()`
- `src/data/acheminements.js` — types d'acheminement (icône/couleur) et statuts (style de bordure)
- `src/data/seed.js` — les 42 lignes du tableau initial
- `src/utils/io.js` — export/import CSV/JSON, normalisation des lignes
- `src/utils/markers.js` — icônes Leaflet (`divIcon`) et HTML de la fiche au survol
- `src/utils/history.js` — historique des actions par ligne
- `src/components/MapView.jsx` — carte, styles, clusters, contours GeoJSON, encarts DOM-TOM
- `src/components/RowForm.jsx` — formulaire ajout/édition
- `src/components/EditModal.jsx`, `FilterBar.jsx`
- `src/App.jsx` — état global, filtres, persistance, délégation des clics des tooltips

Pour brancher une vraie base (API/Supabase/...), remplacer `loadRows` et le `useEffect`
`localStorage` dans `App.jsx` par des appels réseau.

Les contours des départements proviennent de
[france-geojson](https://github.com/gregoiredavid/france-geojson) (avec repli sur
click_that_hood) ; si aucune source n'est joignable, la carte fonctionne sans les contours.
