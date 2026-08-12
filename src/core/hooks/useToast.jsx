import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { subscribeToast } from "./toastBus";
import ToastContainer from "../components/Toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (type, message) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  useEffect(() => subscribeToast(({ type, message }) => addToast(type, message)), [addToast]);

  const value = {
    success: useCallback((message) => addToast("success", message), [addToast]),
    error: useCallback((message) => addToast("error", message), [addToast]),
    warning: useCallback((message) => addToast("warning", message), [addToast]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
