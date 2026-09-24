import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

const ICONS = { success: "✅", error: "❌", info: "ℹ️" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const showToast = useCallback((message, type = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div id="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <div className="toast-icon">{ICONS[toast.type] || ICONS.info}</div>
            <div className="toast-msg">{toast.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
