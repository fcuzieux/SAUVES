export default function ConfirmModal({ title, message, confirmLabel = "Confirmer", onConfirm, onCancel }) {
  return (
    <div className="modal-overlay confirm-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="form-actions">
          <button type="button" className="mini-btn" onClick={onCancel}>Annuler</button>
          <button type="button" className="submit-btn danger-btn" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
