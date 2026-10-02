import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

function Toast() {
  const { toast, dismissToast } = useToast();

  if (!toast) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-message">{toast.message}</span>
      {toast.actionLabel && toast.actionTo && (
        <Link to={toast.actionTo} className="toast-action" onClick={dismissToast}>
          {toast.actionLabel}
        </Link>
      )}
      <button className="toast-close" onClick={dismissToast} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

export default Toast;
