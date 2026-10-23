import { useAppStore } from '../../state/app-store';

export function Toasts() {
  const { toasts, dismissToast } = useAppStore();
  if (toasts.length === 0) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <button key={toast.id} type="button" className="toast" onClick={() => dismissToast(toast.id)}>
          <strong>{toast.title}</strong>
          {toast.body ? <p>{toast.body}</p> : null}
        </button>
      ))}
    </div>
  );
}
