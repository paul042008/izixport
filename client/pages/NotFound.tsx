import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: "#F8F6F1",
        fontFamily: "Barlow, system-ui, sans-serif",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 16px)",
        overflowWrap: "break-word",
      }}
    >
      <div
        className="text-center w-full max-w-md"
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: "32px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden>
          🔍
        </div>
        <h1
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 28,
            color: "#111827",
            margin: "0 0 8px",
            textTransform: "uppercase",
          }}
        >
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 24px", lineHeight: 1.6 }}>
          We couldn&apos;t find <strong style={{ color: "#111827" }}>{location.pathname}</strong>.
          It may have moved or no longer exists.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "12px 20px",
              borderRadius: 9999,
              border: "none",
              background: "#002E1A",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={18} />
            Go back
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              minHeight: 44,
              width: "100%",
              padding: "12px 20px",
              borderRadius: 9999,
              border: "2px solid #002E1A",
              background: "transparent",
              color: "#002E1A",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Return to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
