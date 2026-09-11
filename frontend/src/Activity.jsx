import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Activity({ complaint, onClose }) {
  const dialog = useRef(null)

  useEffect(() => {
    dialog.current.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      className="history-modal panel"
      aria-label="Complaint activity"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current.close()
      }}
    >
      <header>
        <div>
          <h2>Complaint activity</h2>
          <p>{complaint.reference}</p>
        </div>
        <button autoFocus aria-label="Close activity" onClick={() => dialog.current.close()}>
          <X size={20} />
        </button>
      </header>
      <div className="history-list">
        {[...complaint.history].reverse().map((entry, index) => (
          <article key={index}>
            <div>
              <strong>{entry.action}</strong>
              <time>{new Date(entry.time).toLocaleString()}</time>
            </div>
            {entry.changes.map((change) => (
              <p key={change.field}>
                <b>{change.field.replaceAll('_', ' ')}</b>
                <span>
                  {change.before || 'Not provided'} → {change.after || 'Cleared'}
                </span>
              </p>
            ))}
          </article>
        ))}
      </div>
    </dialog>
  )
}
