import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    className: "bg-green-50 border-green-200 text-green-800",
    iconClassName: "text-green-500",
  },
  error: {
    icon: XCircle,
    className: "bg-red-50 border-red-200 text-red-800",
    iconClassName: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-amber-50 border-amber-200 text-amber-800",
    iconClassName: "text-amber-500",
  },
};

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.success;
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 rounded-md border px-4 py-3 shadow-lg ${config.className}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconClassName}`} />
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded p-0.5 text-current opacity-60 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
