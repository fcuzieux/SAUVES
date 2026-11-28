import RowForm from "./RowForm.jsx";

// Modale générique contenant le formulaire de ligne (ajout ou édition).
// hidden : masque la modale le temps du "picking" sur la carte (l'état du formulaire est conservé)
export default function FormModal({ title, initial, onSubmit, onCancel, submitLabel = "Enregistrer", hidden, pickedLL, onPickMode }) {
  return (
    <div className={hidden ? "modal-overlay hidden-modal" : "modal-overlay"} onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <RowForm
          initial={initial}
          onSubmit={onSubmit}
          onCancel={onCancel}
          submitLabel={submitLabel}
          pickedLL={pickedLL}
          onPickMode={onPickMode}
        />
      </div>
    </div>
  );
}
