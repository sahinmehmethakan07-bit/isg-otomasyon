import React from "react";

type LockedModuleNoticeProps = {
  message: string;
  onClose: () => void;
};

export function LockedModuleNotice({ message, onClose }: LockedModuleNoticeProps) {
  return (
    <div style={{
      backgroundColor: "rgba(217,119,6,0.12)",
      border: "1px solid rgba(217,119,6,0.32)",
      borderRadius: 8,
      color: "#fcd34d",
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 16,
      padding: "10px 14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    }}>
      <span>🔒 {message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "#fcd34d",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
