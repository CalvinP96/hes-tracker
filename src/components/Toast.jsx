import React, { useEffect } from "react";

export function ToastContainer({ toasts, onDismiss }) {
  const getTypeStyles = (type) => {
    const baseStyles = {
      success: {
        bg: "rgba(34, 197, 94, 0.1)",
        border: "1px solid rgba(34, 197, 94, 0.3)",
        icon: "✓",
        iconColor: "#22c55e",
      },
      error: {
        bg: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        icon: "✕",
        iconColor: "#ef4444",
      },
      warning: {
        bg: "rgba(245, 158, 11, 0.1)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        icon: "⚠",
        iconColor: "#f59e0b",
      },
      info: {
        bg: "rgba(37, 99, 235, 0.1)",
        border: "1px solid rgba(37, 99, 235, 0.3)",
        icon: "ℹ",
        iconColor: "#2563EB",
      },
    };
    return baseStyles[type] || baseStyles.info;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 10000,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          index={index}
          typeStyles={getTypeStyles(toast.type)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss, index, typeStyles }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: typeStyles.bg,
        border: typeStyles.border,
        borderRadius: "8px",
        padding: "12px 16px",
        marginTop: index > 0 ? "12px" : "0px",
        color: "#e2e8f0",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "14px",
        maxWidth: "320px",
        wordWrap: "break-word",
        pointerEvents: "all",
        animation: "slideInRight 0.3s ease-out",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
        backfaceVisibility: "hidden",
        perspective: 1000,
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(400px);
          }
        }
      `}</style>
      <div
        style={{
          flex: "0 0 auto",
          fontSize: "18px",
          color: typeStyles.iconColor,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "20px",
          height: "20px",
        }}
      >
        {typeStyles.icon}
      </div>
      <div style={{ flex: "1 1 auto", overflow: "hidden" }}>
        {toast.message}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          flex: "0 0 auto",
          background: "transparent",
          border: "none",
          color: "#64748b",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.target.style.color = "#e2e8f0")}
        onMouseLeave={(e) => (e.target.style.color = "#64748b")}
      >
        ✕
      </button>
    </div>
  );
}
