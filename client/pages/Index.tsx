import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, Lock, Truck, CheckCircle, Globe, ArrowRight, Menu,
  BarChart3, Users, TrendingUp, Building2, X, Mail, Heart,
  MapPin, Linkedin, Github, Check, CreditCard, Zap, Star,
  Award, Twitter, Instagram, Loader2,
  FileText, Headphones, Beaker,
} from "lucide-react";

import Testimonials from "../components/Testimonials";
import { supabase } from "@/lib/supabase/client";

/* ============================================================
   BRAND TOKENS
   ============================================================ */
const C = {
  greenDeep:    "#0C3825",
  greenMid:     "#1A5C41",
  greenBright:  "#006B3F",
  greenLight:   "rgba(26,92,65,0.08)",
  greenFaint:   "rgba(12,56,37,0.04)",
  gold:         "#C9A84C",
  goldBright:   "#D4A843",
  goldLight:    "rgba(212,168,67,0.12)",
  goldFaint:    "rgba(212,168,67,0.05)",
  bg:           "#F8F6F1",
  white:        "#FFFFFF",
  dark:         "#0D0D0D",
  darkSurface:  "#111810",
  gray50:       "#F9F8F5",
  gray100:      "#F2F0EB",
  gray200:      "#E4E0D8",
  gray400:      "#9E9A93",
  gray500:      "#78746D",
  gray600:      "#4A4640",
  gray700:      "#322F2A",
  gray800:      "#1E1B17",
  gray900:      "#0D0B08",
  border:       "rgba(200,192,180,0.35)",
  borderDark:   "rgba(255,255,255,0.08)",
};

/* ============================================================
   CUSTOM HOOKS
   ============================================================ */
function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
      else setCount(target);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration, start]);
  return count;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ============================================================
   ANIMATED SECTION WRAPPER
   ============================================================ */
function AnimatedSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const { ref, inView } = useInView(0.08);
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.75s ease-out ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

/* ============================================================
   MODAL COMPONENT
   ============================================================ */
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", animation: "lp-fadeIn 0.2s ease-out" }}
      onClick={onClose}>
      <div style={{
        background: C.white, borderRadius: 20, maxWidth: 640, width: "100%",
        maxHeight: "88vh", overflowY: "auto",
        border: `1px solid ${C.border}`,
        boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
        animation: "lp-scaleUp 0.28s cubic-bezier(0.16,1,0.3,1)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "24px 28px 20px",
          borderBottom: `1px solid ${C.border}`,
          position: "sticky", top: 0, background: C.white, zIndex: 1,
        }}>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800, fontSize: 22, color: C.gray900, margin: 0,
            letterSpacing: "0.02em",
          }}>{title}</h2>
          <button onClick={onClose} style={{
            background: C.gray100, border: "none", borderRadius: 8,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.gray500,
          }}><X size={16} /></button>
        </div>
        <div style={{ padding: "22px 28px 28px", color: C.gray600, fontSize: 14, lineHeight: 1.75, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   EYEBROW LABEL
   ============================================================ */
function Label({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{ width: 24, height: 1.5, background: light ? C.gold : C.greenBright, borderRadius: 1 }} />
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase",
        color: light ? C.gold : C.greenBright,
      }}>{children}</span>
      <div style={{ width: 24, height: 1.5, background: light ? C.gold : C.greenBright, borderRadius: 1 }} />
    </div>
  );
}

/* ============================================================
   NAVBAR
   ============================================================ */
function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const navLinks = [
    { label: "Marketplace", href: "#marketplace" },
    { label: "How it Works", path: "/how-it-works" },
  ];
  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
        boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.06)" : "none",
        transition: "all 0.4s ease",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 28px",
          height: 68, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, display: "inline-flex" }}>
              <img src="/logo.jpeg" alt="IziXport" style={{ height: 36, width: "auto", display: "block" }} />
            </div>
          </a>
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            padding: 4, borderRadius: 10,
            background: C.gray50, border: `1px solid ${C.border}`,
          }} className="lp-desktop-nav">
            {navLinks.map(link => {
              const style = {
                padding: "8px 16px", borderRadius: 7,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13, fontWeight: 600, color: C.gray600,
                textDecoration: "none", transition: "all 0.15s",
                background: "transparent", border: "none", cursor: "pointer",
              } as React.CSSProperties;
              const hoverIn = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.color = C.greenBright; (e.currentTarget as HTMLElement).style.background = C.white; };
              const hoverOut = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.color = C.gray600; (e.currentTarget as HTMLElement).style.background = "transparent"; };
              return link.path ? (
                <button key={link.label} onClick={() => navigate(link.path)} style={style} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                  {link.label}
                </button>
              ) : (
                <a key={link.label} href={link.href} style={style} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                  {link.label}
                </a>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="lp-desktop-nav">
            <button onClick={() => navigate("/login")} style={{
              padding: "9px 20px", borderRadius: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13, fontWeight: 600, color: C.greenBright,
              background: "transparent", border: `1.5px solid rgba(0,107,63,0.2)`,
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenLight; (e.currentTarget as HTMLElement).style.borderColor = C.greenBright; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,107,63,0.2)"; }}>
              Log In
            </button>
            <button onClick={() => navigate("/signup")} style={{
              padding: "9px 22px", borderRadius: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13, fontWeight: 700, color: C.white,
              background: C.greenDeep, border: "none", cursor: "pointer",
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenMid; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.greenDeep; }}>
              Get Started <ArrowRight size={13} />
            </button>
          </div>
          <button className="lp-mobile-only" onClick={() => setMobileOpen(!mobileOpen)} style={{
            background: C.greenDeep, border: "none", borderRadius: 8,
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.gold,
          }}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)} />
      )}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 50,
        width: 300, background: C.white,
        boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
        transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
          <img src="/logo.jpeg" alt="IziXport" style={{ height: 34, width: "auto", borderRadius: 8 }} />
          <button onClick={() => setMobileOpen(false)} style={{ background: C.greenLight, border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.greenBright }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navLinks.map(link => {
            const style = {
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 14px", borderRadius: 10,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14, fontWeight: 600, color: C.gray700,
              textDecoration: "none", transition: "all 0.15s",
              width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
            } as React.CSSProperties;
            const hoverIn = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = C.greenLight; (e.currentTarget as HTMLElement).style.color = C.greenBright; };
            const hoverOut = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = C.gray700; };
            return link.path ? (
              <button key={link.label} onClick={() => { navigate(link.path); setMobileOpen(false); }} style={style} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                {link.label}
                <ArrowRight size={14} style={{ color: C.greenBright, opacity: 0.5 }} />
              </button>
            ) : (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} style={style} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                {link.label}
                <ArrowRight size={14} style={{ color: C.greenBright, opacity: 0.5 }} />
              </a>
            );
          })}
        </div>
        <div style={{ padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => navigate("/login")} style={{
            width: "100%", padding: "13px", borderRadius: 10,
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600,
            color: C.greenBright, background: "white",
            border: `1.5px solid rgba(0,107,63,0.25)`, cursor: "pointer",
          }}>Log In</button>
          <button onClick={() => navigate("/signup")} style={{
            width: "100%", padding: "13px", borderRadius: 10,
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700,
            color: C.white, background: C.greenDeep, border: "none", cursor: "pointer",
          }}>Get Started Free →</button>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   HERO
   ============================================================ */

const HERO_TRUST_PILLS = [
  { icon: CheckCircle, label: "Verified profiles" },
  { icon: Lock, label: "Escrow protected" },
  { icon: Truck, label: "Tracked shipments" },
  { icon: Globe, label: "Global buyers" },
];

const HERO_PROOF_CARDS = [
  {
    icon: Building2,
    title: "Verified onboarding",
    text: "CAC, ID, and business checks before trade begins.",
  },
  {
    icon: CreditCard,
    title: "Secure payment flow",
    text: "Escrow-first design that protects both sides of the deal.",
  },
  {
    icon: Truck,
    title: "Shipment visibility",
    text: "Clear movement from pickup, transit, to delivery.",
  },
  {
    icon: BarChart3,
    title: "Trade readiness",
    text: "Designed to help exporters look serious from day one.",
  },
];

function HeroSection() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "94vh",
        display: "flex",
        flexDirection: "column",
        background: C.greenDeep,
        overflow: "hidden",
        paddingBottom: 56,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-18%",
          right: "-12%",
          zIndex: 0,
          pointerEvents: "none",
          width: "60vw",
          height: "60vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,168,67,0.12) 0%, transparent 68%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-18%",
          left: "-10%",
          zIndex: 0,
          pointerEvents: "none",
          width: "45vw",
          height: "45vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(26,92,65,0.6) 0%, transparent 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          opacity: 0.05,
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster="/hero-poster.jpg"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          src="/hero-bg.mp4"
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          alignItems: "center",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "124px 28px 0",
          width: "100%",
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(18px)",
          transition:
            "opacity 0.9s ease-out, transform 0.9s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="grid w-full items-center gap-10 lg:grid-cols-2">
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 22,
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid rgba(212,168,67,0.25)",
                background: "rgba(212,168,67,0.06)",
              }}
            >
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: C.gold,
                }}
              >
                Nigerian trade marketplace
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(52px, 9vw, 112px)",
                fontWeight: 900,
                lineHeight: 0.92,
                letterSpacing: "-0.04em",
                color: C.white,
                margin: "0 0 22px",
                maxWidth: 900,
              }}
            >
              Nigerian goods.
              <span style={{ display: "block" }}>Global buyers.</span>
              <span style={{ display: "block", color: C.gold }}>
                Exported with trust.
              </span>
            </h1>

            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: "clamp(14px, 1.6vw, 18px)",
                color: "rgba(255,255,255,0.58)",
                fontWeight: 400,
                lineHeight: 1.8,
                maxWidth: 590,
                margin: "0 0 34px",
              }}
            >
              IziXport is designed to feel serious from the first screen: verified
              exporters, secure payments, trade contracts, and logistics tracking — all in
              one clean, premium experience for phones and desktops.
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 30 }}>
              <button
                onClick={() => navigate("/signup?type=exporter")}
                style={{
                  padding: "15px 32px",
                  borderRadius: 10,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.greenDeep,
                  background: C.gold,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                  boxShadow: "0 10px 34px rgba(212,168,67,0.28)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#E0B94F";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = C.gold;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                Join as Exporter <ArrowRight size={15} />
              </button>

              <button
                onClick={() => navigate("/signup?type=buyer")}
                style={{
                  padding: "15px 32px",
                  borderRadius: 10,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.white,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.2s",
                  backdropFilter: "blur(4px)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.2)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.55)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.12)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.3)";
                }}
              >
                Join as Buyer <ArrowRight size={15} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 26,
              }}
            >
              {["Cashew nuts", "Cocoa beans", "Sesame seeds", "Shea butter"].map(
                (item) => (
                  <div
                    key={item}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 14px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.58)",
                    }}
                  >
                    <CheckCircle size={13} style={{ color: C.gold, flexShrink: 0 }} />
                    {item}
                  </div>
                )
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {HERO_TRUST_PILLS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: "rgba(212,168,67,0.15)",
                      border: "1px solid rgba(212,168,67,0.22)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} color={C.gold} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.white,
                        margin: 0,
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.42)",
                        margin: "3px 0 0",
                      }}
                    >
                      Built for real trade
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ position: "relative", maxWidth: 640, marginLeft: "auto" }}>
              <div
                style={{
                  position: "absolute",
                  inset: "-20px -14px auto auto",
                  width: "56%",
                  height: "56%",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(212,168,67,0.18), transparent 68%)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  borderRadius: 28,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 28px 80px rgba(0,0,0,0.2)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ position: "relative", aspectRatio: "16 / 10" }}>
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="none"
                    poster="/hero-poster.jpg"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    src="/hero-bg.mp4"
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(12,56,37,0.1) 0%, rgba(12,56,37,0.35) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 18,
                      top: 18,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.86)",
                      color: C.gray700,
                      boxShadow: "0 10px 26px rgba(0,0,0,0.08)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <Star size={12} color={C.goldBright} />
                    Premium trade story
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      right: 18,
                      bottom: 18,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: "rgba(12,56,37,0.88)",
                      color: C.white,
                      boxShadow: "0 10px 26px rgba(0,0,0,0.16)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Award size={12} color={C.gold} />
                    Built for phones and desktop
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                <div
                  style={{
                    borderRadius: 24,
                    overflow: "hidden",
                    background: C.white,
                    border: "1px solid rgba(255,255,255,0.75)",
                    boxShadow: "0 18px 44px rgba(12,56,37,0.08)",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 16px 12px",
                      borderBottom: "1px solid rgba(230,225,216,0.8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: C.greenBright,
                          margin: 0,
                        }}
                      >
                        Hero visual
                      </p>
                      <p
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.gray800,
                          margin: "4px 0 0",
                        }}
                      >
                        Inspired by your preferred trade collage
                      </p>
                    </div>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: C.greenLight,
                        border: "1px solid rgba(0,107,63,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: C.greenBright,
                        flexShrink: 0,
                      }}
                    >
                      <Globe size={16} />
                    </div>
                  </div>
                  <img
                    src="/hero-cashew-collage.png"
                    alt="Trade collage inspired hero visual"
                    style={{
                      display: "block",
                      width: "100%",
                      height: 230,
                      objectFit: "cover",
                      background: "#f5f2ea",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {HERO_PROOF_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.title}
                        style={{
                          borderRadius: 22,
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          padding: 16,
                          display: "flex",
                          gap: 14,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            background: "rgba(212,168,67,0.14)",
                            border: "1px solid rgba(212,168,67,0.22)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: C.gold,
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3
                            style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: 14,
                              fontWeight: 800,
                              color: C.white,
                              margin: "0 0 5px",
                            }}
                          >
                            {card.title}
                          </h3>
                          <p
                            style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: 12.5,
                              lineHeight: 1.7,
                              color: "rgba(255,255,255,0.52)",
                              margin: 0,
                            }}
                          >
                            {card.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
/* ============================================================
   HOW IT WORKS
   ============================================================ */
const exporterSteps = [
  { number: "01", icon: Building2, title: "Sign Up & Verify", desc: "Submit your business documents for free and get your trusted verified badge within 48 hours." },
  { number: "02", icon: Globe, title: "List Your Products", desc: "Add commodities, pricing, and specifications. Go live to global buyers in minutes." },
  { number: "03", icon: Users, title: "Connect & Negotiate", desc: "Buyers send enquiries. Chat privately, agree on terms, and confirm the freight quote." },
  { number: "04", icon: Truck, title: "Ship & Get Paid", desc: "We hold payment in escrow. You ship. Funds release upon confirmed delivery." },
];

const buyerSteps = [
  { number: "01", icon: Globe, title: "Browse Verified Suppliers", desc: "Search products and review exporter certifications, ratings, and trade history." },
  { number: "02", icon: Heart, title: "Enquire & Negotiate", desc: "Chat with exporters, request samples, and agree on the best terms." },
  { number: "03", icon: Lock, title: "Pay into Escrow", desc: "Your funds are held securely until you physically confirm receipt of goods." },
  { number: "04", icon: TrendingUp, title: "Receive & Confirm", desc: "Track your shipment in real-time. Release payment only after inspection." },
];

function HowItWorks() {
  const [activeTab, setActiveTab] = useState<"exporter" | "buyer">("exporter");
  const steps = activeTab === "exporter" ? exporterSteps : buyerSteps;
  return (
    <section id="how-it-works" style={{ padding: "100px 0", background: C.white, position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", right: 0, top: "5%",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(120px, 20vw, 260px)", fontWeight: 900,
        color: "rgba(0,107,63,0.025)", lineHeight: 1,
        pointerEvents: "none", userSelect: "none",
        letterSpacing: "-0.04em",
      }}>HOW</div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", position: "relative" }}>
        <AnimatedSection className="lp-text-center">
          <div style={{ marginBottom: 20 }}>
            <Label>Process</Label>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(44px, 7vw, 88px)", fontWeight: 900,
              color: C.gray900, letterSpacing: "-0.03em",
              margin: "0 0 0",
            }}>How IziXport Works</h2>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 28, marginBottom: 60 }}>
            <div style={{
              display: "inline-flex", padding: 5, borderRadius: 10, gap: 4,
              background: C.gray100, border: `1px solid ${C.border}`,
            }}>
              {(["exporter", "buyer"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: "10px 26px", borderRadius: 7,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13, fontWeight: 700,
                  background: activeTab === tab ? C.greenDeep : "transparent",
                  color: activeTab === tab ? C.white : C.gray500,
                  border: "none", cursor: "pointer",
                  boxShadow: activeTab === tab ? "0 4px 16px rgba(12,56,37,0.25)" : "none",
                  transition: "all 0.25s ease",
                }}>
                  {tab === "exporter" ? "For Exporters" : "For Buyers"}
                </button>
              ))}
            </div>
          </div>
        </AnimatedSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="lp-4col-grid">
          {steps.map((step, idx) => (
            <AnimatedSection key={`${activeTab}-${idx}`} delay={idx * 90}>
              <div style={{
                background: C.white, borderRadius: 14,
                border: `1px solid ${C.border}`,
                padding: "30px 24px 26px",
                height: "100%", position: "relative",
                transition: "all 0.25s ease",
                cursor: "default",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-5px)";
                (e.currentTarget as HTMLElement).style.borderColor = C.greenBright;
                (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,107,63,0.10)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.borderColor = C.border;
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}>
                <div style={{
                  position: "absolute", top: 18, right: 18,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 54, fontWeight: 900, lineHeight: 1,
                  color: "rgba(0,107,63,0.05)", letterSpacing: "-0.03em",
                  pointerEvents: "none", userSelect: "none",
                }}>{step.number}</div>
                <div style={{
                  width: 48, height: 48, borderRadius: 11,
                  background: C.greenDeep,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                  boxShadow: "0 6px 18px rgba(12,56,37,0.22)",
                }}>
                  <step.icon size={20} color={C.white} />
                </div>
                <h3 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 20, fontWeight: 800, color: C.gray900,
                  margin: "0 0 10px", letterSpacing: "0.01em",
                }}>{step.title}</h3>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13, color: C.gray500, lineHeight: 1.7, margin: "0 0 20px",
                }}>{step.desc}</p>
                <div style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "4px 10px", borderRadius: 5,
                  background: C.goldLight,
                  border: `1px solid rgba(212,168,67,0.18)`,
                }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 11, fontWeight: 800, color: C.gold,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                  }}>Step {step.number}</span>
                </div>
                {idx < 3 && (
                  <div className="lp-connector" style={{
                    position: "absolute", right: -22, top: "42%",
                    width: 28, height: 28, borderRadius: "50%",
                    background: C.gold, zIndex: 2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 3px 10px rgba(212,168,67,0.35)",
                  }}>
                    <ArrowRight size={13} color={C.greenDeep} />
                  </div>
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
/* ============================================================
   PRODUCTS TRADED — simple showcase of agro commodities
   ============================================================ */
   const AGRO_PRODUCTS = [
    { name: "Cashew Nuts",   image: "/cashew-nuts.jpg", accent: "#B87840", bg: "rgba(184,120,64,0.08)" },
    { name: "Cocoa Beans",   image: "/cocoa-beans.jpg", accent: "#8B5E3C", bg: "rgba(139,94,60,0.08)" },
    { name: "Sesame Seeds",  image: "/sesame-seeds.jpg", accent: "#C4A84A", bg: "rgba(196,168,74,0.08)" },
    { name: "Shea Butter",   image: "/shea-butter.jpg", accent: "#6AAD5A", bg: "rgba(106,173,90,0.08)" },
    { name: "Hibiscus",      image: "/ginger.jpg", accent: "#C06080", bg: "rgba(192,96,128,0.08)" },
    { name: "Ginger",        image: "/hibiscus.jpg", accent: "#D4A843", bg: "rgba(212,168,67,0.08)" },
    { name: "Palm Oil",      image: "/palm-oil.png", accent: "#D4721A", bg: "rgba(212,114,26,0.08)" },
    { name: "Chili Pepper",  image: "/chili-pepper.jpg", accent: "#D45050", bg: "rgba(212,80,80,0.08)" },
  ];
  
  function FeaturedProducts() {
    const navigate = useNavigate();
    return (
      <section id="marketplace" style={{ padding: "100px 0", background: C.bg, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(12,56,37,0.055) 1px, transparent 0)`,
          backgroundSize: "36px 36px",
          opacity: 0.5,
        }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", position: "relative" }}>
          <AnimatedSection>
            <div style={{ marginBottom: 44 }}>
              <Label>Marketplace</Label>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(38px, 6vw, 78px)", fontWeight: 900,
                color: C.gray900, letterSpacing: "-0.03em", margin: "0 0 12px",
              }}>Agro Products We Trade</h2>
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 15, color: C.gray500, maxWidth: 640, lineHeight: 1.7,
              }}>
                Nigerian exporters on IziXport list a range of agro-commodities for global buyers — here's what's traded on the platform.
              </p>
            </div>
          </AnimatedSection>
  
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="lp-4col-grid">
            {AGRO_PRODUCTS.map((item, i) => (
              <AnimatedSection key={item.name} delay={i * 80}>
                <div style={{
                  background: C.white, borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  overflow: "hidden", height: "100%",
                  transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  cursor: "default",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 24px 60px rgba(0,0,0,0.1)`;
                  (e.currentTarget as HTMLElement).style.borderColor = item.accent;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                }}>
                  <div style={{ height: 3, background: item.accent }} />
                  <div style={{
                    height: 220, background: item.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                  <div style={{ padding: "18px 20px" }}>
                    <h3 style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 21, fontWeight: 900, color: C.gray900,
                      margin: 0, letterSpacing: "0.01em",
                    }}>{item.name}</h3>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
  

        <AnimatedSection delay={350}>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <button onClick={() => navigate("/signup?type=exporter")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 28px", borderRadius: 9,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14, fontWeight: 700, color: C.greenBright,
              background: C.white, border: `1.5px solid rgba(0,107,63,0.2)`,
              cursor: "pointer", transition: "all 0.18s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenDeep; (e.currentTarget as HTMLElement).style.color = C.white; (e.currentTarget as HTMLElement).style.borderColor = C.greenDeep; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.white; (e.currentTarget as HTMLElement).style.color = C.greenBright; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,107,63,0.2)"; }}>
              List Your Product <ArrowRight size={15} />
            </button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}


/* ============================================================
   TRUST SECTION — Platform depth & social proof
   ============================================================ */
function TrustSection() {
  const cards = [
    {
      icon: Beaker, title: "Sample Before You Buy",
      desc: "Request product samples, lab certificates, and pre-shipment inspection reports before committing to bulk orders.",
    },
    {
      icon: FileText, title: "Export Paperwork Support",
      desc: "We guide exporters through NEPC registration, NXP processing, and customs documentation — so nothing gets held up at the port.",
    },
    {
      icon: Headphones, title: "Dispute Mediation",
      desc: "Our Lagos-based trade team steps in to mediate any issues. You're never left alone in a transaction.",
    },
    {
      icon: Globe, title: "Global Logistics Network",
      desc: "Connected to freight forwarders and shipping lines across Europe, Asia, and the Americas for seamless delivery.",
    },
  ];

  const credentials = [
    { label: "CAC Registered", desc: "Registered business in Nigeria" },
    { label: "Escrow by Pandacrow", desc: "Secure payments powered by our escrow partner" },
  ];

  return (
    <section style={{ padding: "100px 0", background: C.greenDeep, position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />
      <div style={{
        position: "absolute", left: 0, bottom: "5%",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(100px, 18vw, 220px)", fontWeight: 900,
        color: "rgba(255,255,255,0.03)", lineHeight: 1,
        pointerEvents: "none", userSelect: "none", letterSpacing: "-0.04em",
      }}>TRUST</div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 1 }}>
        <AnimatedSection>
          <div style={{ marginBottom: 56, textAlign: "center" }}>
            <Label light>Platform Depth</Label>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(44px, 7vw, 88px)", fontWeight: 900,
              color: C.white, letterSpacing: "-0.03em", margin: 0,
            }}>The IziXport Difference</h2>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15, color: "rgba(255,255,255,0.45)",
              maxWidth: 560, margin: "16px auto 0", lineHeight: 1.7,
            }}>
              Beyond escrow and verification — we handle the hard parts of international trade so you don't have to.
            </p>
          </div>
        </AnimatedSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="lp-4col-grid">
          {cards.map((card, idx) => (
            <AnimatedSection key={idx} delay={idx * 100}>
              <div style={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "32px 26px",
                height: "100%", display: "flex", flexDirection: "column",
                background: "rgba(255,255,255,0.04)",
                transition: "all 0.25s ease",
                cursor: "default",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLElement).style.borderColor = `rgba(212,168,67,0.3)`;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 11, marginBottom: 20,
                  background: "rgba(212,168,67,0.15)",
                  border: "1px solid rgba(212,168,67,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <card.icon size={20} color={C.gold} />
                </div>
                <h3 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 20, fontWeight: 800, color: C.white,
                  margin: "0 0 10px", letterSpacing: "0.01em",
                }}>{card.title}</h3>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13, color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.75, margin: 0, flex: 1,
                }}>{card.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={400}>
          <div style={{ marginTop: 64, textAlign: "center" }}>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.2em", textTransform: "uppercase",
              marginBottom: 24,
            }}>
              Our Credentials
            </p>
            <div style={{
              display: "flex", justifyContent: "center", gap: 16,
              flexWrap: "wrap", alignItems: "stretch", maxWidth: 640, margin: "0 auto",
            }}>
              {credentials.map(cred => (
                <div key={cred.label} style={{
                  flex: "1 1 240px",
                  padding: "18px 22px", borderRadius: 12,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  textAlign: "left",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                    background: "rgba(212,168,67,0.15)",
                    border: "1px solid rgba(212,168,67,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <CheckCircle size={16} color={C.gold} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 15, fontWeight: 800, color: C.white,
                      letterSpacing: "0.01em", lineHeight: 1.2,
                    }}>{cred.label}</div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginTop: 3,
                    }}>{cred.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */
function TestimonialsSection() {
  return <Testimonials />;
}

/* ============================================================
   DUAL CTA BANNER
   ============================================================ */
function DualCTABanner() {
  const navigate = useNavigate();
  return (
    <section style={{ padding: "100px 0", background: C.white, position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px" }}>
        <AnimatedSection>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <Label>Join the Platform</Label>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(44px, 7vw, 88px)", fontWeight: 900,
              color: C.gray900, letterSpacing: "-0.03em", margin: 0,
            }}>Ready to Trade?</h2>
          </div>
        </AnimatedSection>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="lp-2col-grid">
          <AnimatedSection delay={0}>
            <div style={{
              borderRadius: 16, padding: "48px 40px",
              background: C.greenDeep, position: "relative", overflow: "hidden",
              border: `1px solid rgba(255,255,255,0.05)`,
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
              cursor: "pointer",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-5px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 24px 60px rgba(12,56,37,0.25)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }} />
              <div style={{
                position: "absolute", right: -10, bottom: -20,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 160, fontWeight: 900, color: "rgba(212,168,67,0.07)",
                lineHeight: 1, letterSpacing: "-0.04em", userSelect: "none",
              }}>01</div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "6px 14px", borderRadius: 6,
                  background: C.goldLight, border: `1px solid rgba(212,168,67,0.25)`,
                  marginBottom: 24,
                }}>
                  <Award size={12} color={C.gold} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 800, color: C.gold, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    For Nigerian Exporters
                  </span>
                </div>
                <h3 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 900,
                  color: C.white, margin: "0 0 14px", lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}>Are you a Nigerian<br />Exporter?</h3>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14, color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.75, margin: "0 0 32px", maxWidth: 340,
                }}>Get verified and start reaching international buyers today. Free to list.</p>
                <button onClick={() => navigate("/signup?type=exporter")} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 28px", borderRadius: 9,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14, fontWeight: 700, color: C.greenDeep,
                  background: C.gold, border: "none", cursor: "pointer",
                  transition: "all 0.18s",
                  boxShadow: "0 6px 24px rgba(212,168,67,0.3)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E0B94F"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.gold; }}>
                  Start Exporting Free <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={120}>
            <div style={{
              borderRadius: 16, padding: "48px 40px",
              background: C.bg, position: "relative", overflow: "hidden",
              border: `1px solid ${C.border}`,
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
              cursor: "pointer",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-5px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 24px 60px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = C.gold; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = C.border; }}>
              <div style={{
                position: "absolute", right: -10, bottom: -20,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 160, fontWeight: 900, color: "rgba(12,56,37,0.04)",
                lineHeight: 1, letterSpacing: "-0.04em", userSelect: "none",
              }}>02</div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "6px 14px", borderRadius: 6,
                  background: C.greenLight, border: `1px solid rgba(12,56,37,0.12)`,
                  marginBottom: 24,
                }}>
                  <Globe size={12} color={C.greenBright} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 800, color: C.greenBright, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    For Global Buyers
                  </span>
                </div>
                <h3 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "clamp(28px, 3.5vw, 40px)", fontWeight: 900,
                  color: C.gray900, margin: "0 0 14px", lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}>Are you a Global<br />Buyer?</h3>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14, color: C.gray500,
                  lineHeight: 1.75, margin: "0 0 32px", maxWidth: 340,
                }}>Browse verified Nigerian suppliers in 60 seconds. Escrow-protected transactions.</p>
                <button onClick={() => navigate("/signup?type=buyer")} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 28px", borderRadius: 9,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14, fontWeight: 700, color: C.white,
                  background: C.greenDeep, border: "none", cursor: "pointer",
                  transition: "all 0.18s",
                  boxShadow: "0 6px 24px rgba(12,56,37,0.2)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenMid; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.greenDeep; }}>
                  Browse Listings <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  const navigate = useNavigate();
  const [modal, setModal] = useState<{ type: "about" | "contact" | "terms" | "privacy" } | null>(null);

  const platformLinks = [
    { label: "Marketplace", href: "#marketplace" },
    { label: "How It Works", path: "/how-it-works" },
    { label: "For Exporters", href: "#" },
    { label: "For Buyers", href: "#" },
  ];

  const companyLinks = [
    { label: "About Us",            action: () => setModal({ type: "about" }) },
    { label: "Contact Us",          action: () => setModal({ type: "contact" }) },
    { label: "Terms & Conditions",    action: () => navigate("/terms") },
    { label: "Privacy Policy",        action: () => navigate("/privacy") },
  ];

  return (
    <>
      <footer style={{ background: C.gray900, color: C.gray400 }}>
        <div style={{
          height: 2, width: "100%",
          background: `linear-gradient(90deg, transparent 0%, ${C.greenDeep} 20%, ${C.gold} 50%, ${C.greenDeep} 80%, transparent 100%)`,
        }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 28px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", gap: "40px 32px" }} className="lp-footer-grid">
            <div>
              <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid rgba(255,255,255,0.1)`, display: "inline-flex", marginBottom: 20 }}>
                <img src="/logo.jpeg" alt="IziXport" style={{ height: 40, width: "auto", display: "block" }} />
              </div>
              <p style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 18, fontWeight: 800, color: C.greenBright,
                margin: "0 0 10px", lineHeight: 1.25,
              }}>Nigerian Trade,<br />Exported Easy.</p>
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13, color: C.gray500, lineHeight: 1.7,
                margin: "0 0 22px", maxWidth: 260,
              }}>Africa's first verified B2B trade marketplace for Nigerian exports.</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { Icon: Twitter, href: "#", label: "Twitter" },
                  { Icon: Linkedin, href: "#", label: "LinkedIn" },
                  { Icon: Instagram, href: "#", label: "Instagram" },
                ].map(({ Icon, href, label }) => (
                  <a key={label} href={href} aria-label={label} style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: C.gray800, border: `1px solid rgba(255,255,255,0.05)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.18s", textDecoration: "none",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenBright; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.gray800; }}>
                    <Icon size={14} color={C.gray400} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10, fontWeight: 800, color: C.greenBright,
                letterSpacing: "0.18em", textTransform: "uppercase",
                margin: "0 0 20px",
              }}>Platform</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {platformLinks.map(link => {
                  const style = {
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13, fontWeight: 500, color: C.gray500,
                    textDecoration: "none", transition: "color 0.15s",
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                  } as React.CSSProperties;
                  const hoverIn = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.color = C.white; };
                  const hoverOut = (e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.color = C.gray500; };
                  return (
                    <li key={link.label}>
                      {link.path ? (
                        <button onClick={() => navigate(link.path)} style={style} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                          {link.label}
                        </button>
                      ) : (
                        <a href={link.href} style={style} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h4 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10, fontWeight: 800, color: C.greenBright,
                letterSpacing: "0.18em", textTransform: "uppercase",
                margin: "0 0 20px",
              }}>Company</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {companyLinks.map(link => (
                  <li key={link.label}>
                    <button onClick={link.action} style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 13, fontWeight: 500, color: C.gray500,
                      background: "none", border: "none", cursor: "pointer",
                      padding: 0, transition: "color 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.white; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.gray500; }}>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10, fontWeight: 800, color: C.greenBright,
                letterSpacing: "0.18em", textTransform: "uppercase",
                margin: "0 0 20px",
              }}>Get in Touch</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                <li>
                  <a href="mailto:hello@izixport.com" style={{
                    display: "flex", alignItems: "center", gap: 10,
                    color: C.gray500, textDecoration: "none", transition: "color 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.white; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.gray500; }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: C.gray800, border: `1px solid rgba(255,255,255,0.05)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Mail size={13} color={C.greenBright} />
                    </div>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13 }}>hello@izixport.com</span>
                  </a>
                </li>
                <li style={{ display: "flex", alignItems: "flex-start", gap: 10, color: C.gray500 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: C.gray800, border: `1px solid rgba(255,255,255,0.05)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <MapPin size={13} color={C.greenBright} />
                  </div>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, lineHeight: 1.65 }}>Victoria Island,<br />Lagos, Nigeria.</span>
                </li>
              </ul>
              <div style={{
                marginTop: 24, padding: "13px 14px", borderRadius: 10,
                background: "rgba(0,107,63,0.1)", border: "1px solid rgba(0,107,63,0.2)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Shield size={16} style={{ color: "#4ADE80", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: C.gray500, lineHeight: 1.5 }}>
                  Escrow-secured.<br />Trade with confidence.
                </span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.gray800}` }}>
          <div style={{
            maxWidth: 1200, margin: "0 auto", padding: "20px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 8,
          }}>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: C.gray600, margin: 0 }}>
              &copy; 2026 IziXport Technologies Ltd. All rights reserved.
            </p>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: C.gray600, margin: 0 }}>
              Made with &hearts; in Lagos, Nigeria &#127475;&#127468;
            </p>
          </div>
        </div>
      </footer>
      <Modal open={modal?.type === "about"} onClose={() => setModal(null)} title="About IziXport">
        <p style={{ marginBottom: 14 }}>IziXport is Nigeria's premier verified trade marketplace, connecting exporters with global buyers through a secure, end-to-end platform.</p>
        <p style={{ marginBottom: 14 }}>Founded in 2026, we're on a mission to make Nigerian export simple, trustworthy, and accessible to the world.</p>
        <p>Our platform combines escrow payment protection, verified trader profiles, and real-time shipment tracking — giving both buyers and sellers complete peace of mind.</p>
      </Modal>
      <Modal open={modal?.type === "contact"} onClose={() => setModal(null)} title="Contact Us">
        <p style={{ marginBottom: 22 }}>We'd love to hear from you! Reach out through any of the channels below.</p>
        {[{ Icon: Mail, label: "Email", value: "hello@izixport.com" }, { Icon: MapPin, label: "Address", value: "123 Trade Avenue, Victoria Island, Lagos, Nigeria" }].map(({ Icon, label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 10, background: C.gray50, marginBottom: 10, border: `1px solid ${C.border}` }}>
            <Icon size={16} style={{ color: C.greenBright, marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.gray900, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, color: C.gray600 }}>{value}</div>
            </div>
          </div>
        ))}
      </Modal>
    </>
  );
}

/* ============================================================
   MAIN LANDING PAGE
   ============================================================ */
export default function LandingPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      const queryString = window.location.search
      window.location.href = `/auth/callback${queryString}`
    }
  }, [])

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

      *, *::before, *::after { box-sizing: border-box; }
      html { scroll-behavior: smooth; }

      @keyframes lp-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes lp-scaleUp { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes lp-pulse   { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.8); } }
      @keyframes lp-spin   { to { transform: rotate(360deg); } }

      ::-webkit-scrollbar        { width: 3px; }
      ::-webkit-scrollbar-track  { background: #F1EDE6; }
      ::-webkit-scrollbar-thumb  { background: #1A5C41; border-radius: 99px; }

      ::selection { background: rgba(12,56,37,0.15); color: #0C3825; }

      @media (max-width: 1024px) {
        .lp-4col-grid  { grid-template-columns: repeat(2, 1fr) !important; }
        .lp-3col-grid  { grid-template-columns: repeat(2, 1fr) !important; }
        .lp-2col-grid  { grid-template-columns: 1fr !important; }
        .lp-footer-grid { grid-template-columns: 1fr 1fr !important; }
        .lp-connector  { display: none !important; }
      }
      @media (max-width: 640px) {
        .lp-4col-grid  { grid-template-columns: 1fr !important; }
        .lp-3col-grid  { grid-template-columns: 1fr !important; }
        .lp-footer-grid { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 768px) {
        .lp-trust-grid { grid-template-columns: 1fr 1fr !important; gap: 20px !important; }
      }
      @media (max-width: 480px) {
        .lp-trust-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
      }
      @media (min-width: 768px) {
        .lp-mobile-only { display: none !important; }
      }
      @media (max-width: 767px) {
        .lp-desktop-nav { display: none !important; }
      }
      .lp-text-center { text-align: center; }
      .lp-spin { animation: lp-spin 1s linear infinite; }
    `;
    document.head.appendChild(style);
    return () => { void document.head.removeChild(style); };
  }, []);

  return (
    <div style={{ width: "100%", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.white }}>
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeaturedProducts />
      <TrustSection />
      <TestimonialsSection />
      <DualCTABanner />
      <Footer />
    </div>
  );
}