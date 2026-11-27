import RowForm from "./RowForm.jsx";

// Modale générique contenant le formulaire de ligne (ajout ou édition)
export default function FormModal({ title, initial, onSubmit, onCancel, submitLabel = "Enregistrer" }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <RowForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} submitLabel={submitLabel} />
      </div>
    </div>
  );
}
