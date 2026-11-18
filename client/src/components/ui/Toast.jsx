import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

// In-memory listeners for zero-dependency global toast dispatch
const listeners = new Set();

export const toast = {
  success: (title, description = "") => emitToast({ type: "success", title, description }),
  error: (title, description = "") => emitToast({ type: "error", title, description }),
  info: (title, description = "") => emitToast({ type: "info", title, description }),
  warning: (title, description = "") => emitToast({ type: "warning", title, description }),
};

function emitToast(newToast) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const toastItem = { id, timestamp: Date.now(), ...newToast };
  listeners.forEach((listener) => listener(toastItem));
}

export function Toaster({ position = "top-right" }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (toastItem) => {
      setToasts((prev) => [...prev, toastItem]);

      // Auto-dismiss after 4.2 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastItem.id));
      }, 4200);
    };

    listeners.add(handleNewToast);
    return () => listeners.delete(handleNewToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0 || typeof document === "undefined") return null;

  const positionClasses = {
    "top-right": "top-5 right-5",
    "top-left": "top-5 left-5",
    "bottom-right": "bottom-5 right-5",
    "bottom-left": "bottom-5 left-5",
    "top-center": "top-5 left-1/2 -translate-x-1/2",
  }[position] || "top-5 right-5";

  return createPortal(
    <div
      aria-live="polite"
      style={{ zIndex: 9999999 }}
      className={`fixed ${positionClasses} flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0 select-none`}
    >
      {toasts.map((t) => {
        const config = {
          success: {
            icon: CheckCircle2,
            iconClass: "text-emerald-400",
            bg: "bg-[#041d2e]/90",
            border: "border-emerald-500/30",
            glow: "shadow-[0_10px_30px_rgba(16,185,129,0.2)]",
          },
          error: {
            icon: AlertCircle,
            iconClass: "text-rose-400",
            bg: "bg-[#1f0d14]/90",
            border: "border-rose-500/30",
            glow: "shadow-[0_10px_30px_rgba(244,63,94,0.25)]",
          },
          warning: {
            icon: AlertTriangle,
            iconClass: "text-amber-400",
            bg: "bg-[#1f1707]/90",
            border: "border-amber-500/30",
            glow: "shadow-[0_10px_30px_rgba(245,158,11,0.2)]",
          },
          info: {
            icon: Info,
            iconClass: "text-cyan-400",
            bg: "bg-[#062438]/90",
            border: "border-cyan-500/30",
            glow: "shadow-[0_10px_30px_rgba(56,189,248,0.2)]",
          },
        }[t.type] || {
          icon: Info,
          iconClass: "text-cyan-400",
          bg: "bg-[#062438]/90",
          border: "border-cyan-500/30",
          glow: "shadow-[0_10px_30px_rgba(56,189,248,0.2)]",
        };

        const Icon = config.icon;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border ${config.border} ${config.bg} ${config.glow} backdrop-blur-xl transition-all duration-300 animate-fade-rise`}
          >
            <div className="shrink-0 mt-0.5">
              <Icon className={`w-4 h-4 ${config.iconClass}`} />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs font-semibold text-white tracking-tight">{t.title}</p>
              {t.description && (
                <p className="text-[11px] text-zinc-300/80 mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-zinc-400 hover:text-white p-0.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

export default Toaster;
