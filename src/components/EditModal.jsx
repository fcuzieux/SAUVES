import RowForm from "./RowForm.jsx";

export default function EditModal({ row, onSubmit, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>✏️ Modifier — {row.departement}</h2>
        <RowForm initial={row} onSubmit={onSubmit} onCancel={onCancel} submitLabel="💾 Enregistrer" />
      </div>
    </div>
  );
}
