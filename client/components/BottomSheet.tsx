// src/components/BottomSheet.tsx
import type { ReactNode } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          border: "1px solid #E5E7EB",
          maxHeight: "92dvh",
          overflowY: "auto",
          paddingBottom: "env(safe-area-inset-bottom,20px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 20px 14px",
            borderBottom: "1px solid #E5E7EB",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 1,
          }}
        >
          <span
            style={{
              color: "#111827",
              fontWeight: 800,
              fontSize: 15,
              fontFamily: "'Barlow Condensed',sans-serif",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#6B7280", fontSize: 22, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>{children}</div>
      </div>
    </div>
  );
}