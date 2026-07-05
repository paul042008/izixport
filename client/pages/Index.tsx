import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Lock,
  Truck,
  CheckCircle,
  Globe,
  ArrowRight,
  Menu,
  BarChart3,
  Users,
  TrendingUp,
  Building2,
  X,
  Mail,
  Heart,
  MapPin,
  Linkedin,
  Github,
  Check,
  CreditCard,
  Zap,
  Star,
  Award,
  Twitter,
  Instagram,
} from "lucide-react";

import LiveStats from "../components/LiveStats";
import Testimonials from "../components/Testimonials";

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
   CUSTOM HOOKS — unchanged
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
   MODAL COMPONENT — unchanged logic
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", animation: "lp-fadeIn 0.2s ease-out" }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.white, borderRadius: 20, maxWidth: 640, width: "100%",
          maxHeight: "88vh", overflowY: "auto",
          border: `1px solid ${C.border}`,
          boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
          animation: "lp-scaleUp 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
    { label: "How it Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
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
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, display: "inline-flex" }}>
              <img src="/logo.jpeg" alt="IziXport" style={{ height: 36, width: "auto", display: "block" }} />
            </div>
          </a>

          {/* Desktop nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="lp-desktop-nav">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} style={{
                padding: "8px 16px", borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13, fontWeight: 600, color: C.gray600,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.greenBright; (e.currentTarget as HTMLElement).style.background = C.greenLight; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.gray600; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop buttons */}
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

          {/* Mobile toggle */}
          <button className="lp-mobile-only" onClick={() => setMobileOpen(!mobileOpen)} style={{
            background: C.greenLight, border: "none", borderRadius: 8,
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.greenBright,
          }}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
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
          {navLinks.map(link => (
            <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 14px", borderRadius: 10,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14, fontWeight: 600, color: C.gray700,
              textDecoration: "none", transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenLight; (e.currentTarget as HTMLElement).style.color = C.greenBright; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = C.gray700; }}>
              {link.label}
              <ArrowRight size={14} style={{ color: C.greenBright, opacity: 0.5 }} />
            </a>
          ))}
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
   HERO — Dark, editorial, commanding — with LiveStats integrated
   ============================================================ */
function HeroSection() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section style={{
      position: "relative", minHeight: "100vh",
      display: "flex", flexDirection: "column",
      background: C.greenDeep, overflow: "hidden",
    }}>
      {/* Structural grid overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
      }} />

      {/* Gold radial — top right */}
      <div style={{
        position: "absolute", top: "-15%", right: "-10%", zIndex: 0, pointerEvents: "none",
        width: "55vw", height: "55vw", borderRadius: "50%",
        background: `radial-gradient(circle, rgba(212,168,67,0.10) 0%, transparent 65%)`,
      }} />

      {/* Deep green radial — bottom left */}
      <div style={{
        position: "absolute", bottom: "0", left: "0", zIndex: 0, pointerEvents: "none",
        width: "40vw", height: "40vw", borderRadius: "50%",
        background: `radial-gradient(circle, rgba(26,92,65,0.6) 0%, transparent 70%)`,
      }} />

      {/* Subtle video */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.06 }}>
        <video autoPlay loop muted playsInline preload="none" poster="/hero-poster.jpg"
          style={{ width: "100%", height: "100%", objectFit: "cover" }} src="/hero-bg.mp4" />
      </div>

      {/* Main content */}
      <div style={{
        position: "relative", zIndex: 10,
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        maxWidth: 1200, margin: "0 auto", padding: "120px 28px 0",
        width: "100%",
        opacity: loaded ? 1 : 0,
        transform: loaded ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.9s ease-out, transform 0.9s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Eyebrow */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 28,
          padding: "8px 16px", borderRadius: 6,
          border: `1px solid rgba(212,168,67,0.25)`,
          background: "rgba(212,168,67,0.06)",
          alignSelf: "flex-start",
        }}>
           
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10, fontWeight: 800, letterSpacing: "0.22em",
            textTransform: "uppercase", color: C.gold,
          }}>Africa's #1 Verified Trade Marketplace</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(52px, 9.5vw, 110px)",
          fontWeight: 900, lineHeight: 0.9,
          letterSpacing: "-0.03em",
          color: C.white,
          margin: "0 0 28px",
          maxWidth: 900,
        }}>
          Where Nigeria<br />
          <span style={{ color: C.gold }}>Trades</span> With<br />
          The World.
        </h1>

        {/* Subheadline */}
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: "clamp(14px, 1.6vw, 18px)",
          color: "rgba(255,255,255,0.55)",
          fontWeight: 400, lineHeight: 1.75,
          maxWidth: 560, margin: "0 0 44px",
        }}>
          Connecting verified Nigerian exporters with global buyers through a{" "}
          <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
            secure, end-to-end platform
          </span>{" "}
          — no middlemen, full escrow, real-time tracking.
        </p>

        {/* CTA row */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 64 }}>
          <button onClick={() => navigate("/signup?type=exporter")} style={{
            padding: "15px 32px", borderRadius: 9,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14, fontWeight: 700, color: C.greenDeep,
            background: C.gold, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            transition: "all 0.2s",
            boxShadow: "0 8px 32px rgba(212,168,67,0.3)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E0B94F"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.gold; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
            Start Exporting <ArrowRight size={15} />
          </button>
          <button onClick={() => navigate("/signup?type=buyer")} style={{
            padding: "15px 32px", borderRadius: 9,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}>
            Find Suppliers <ArrowRight size={15} />
          </button>
        </div>

        {/* Trust badges row */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 48 }}>
          {[
            { icon: CheckCircle, label: "100% Verified Suppliers" },
            { icon: Lock, label: "Escrow Protected" },
            { icon: Truck, label: "Real-time Tracking" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "9px 16px", borderRadius: 7,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)",
            }}>
              <Icon size={13} style={{ color: C.gold, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
      </div>
      {/* LiveStats white card — sits BELOW the hero, no overlap */}
      <div style={{
        position: "relative",
        zIndex: 20,
        marginTop: 0,            /* no longer pulled up */
        marginBottom: 0,         /* no longer overlapping next section */
      }}>
        <div style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 28px",
        }}>
          <div style={{
            background: C.white,
            borderRadius: 18,
            boxShadow: "0 24px 64px rgba(0,0,0,0.10)",
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}>
            <LiveStats transparent />
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
      {/* Watermark */}
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

        {/* Tab switcher */}
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

        {/* Step cards */}
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
                {/* Step number — faint background */}
                <div style={{
                  position: "absolute", top: 18, right: 18,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 54, fontWeight: 900, lineHeight: 1,
                  color: "rgba(0,107,63,0.05)", letterSpacing: "-0.03em",
                  pointerEvents: "none", userSelect: "none",
                }}>{step.number}</div>

                {/* Icon */}
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

                {/* Step tag */}
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

                {/* Connector dot */}
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
   FEATURED PRODUCTS
   ============================================================ */
const COMMODITY_META: Record<string, { accent: string; bg: string }> = {
  "Cashew Nuts":   { accent: "#B87840", bg: "rgba(184,120,64,0.06)" },
  "Cocoa Beans":   { accent: "#8B5E3C", bg: "rgba(139,94,60,0.06)" },
  "Sesame Seeds":  { accent: "#C4A84A", bg: "rgba(196,168,74,0.06)" },
  "Shea Butter":   { accent: "#6AAD5A", bg: "rgba(106,173,90,0.06)" },
};

const COMMODITY_EMOJI: Record<string, string> = {
  "Cashew Nuts": "🥜", "Cocoa Beans": "🍫", "Sesame Seeds": "🌾", "Shea Butter": "🫙",
};

const featuredListings = [
  { title: "Cashew Nuts",  exporter: "AgroExport Ltd",  price: "$1,200/ton", origin: "Lagos, Nigeria",  minOrder: "5 tons",  rating: 4.9, deals: 48 },
  { title: "Cocoa Beans",  exporter: "African Harvest", price: "$2,800/ton", origin: "Kano, Nigeria",   minOrder: "10 tons", rating: 4.8, deals: 61 },
  { title: "Sesame Seeds", exporter: "North Agro",      price: "$900/ton",  origin: "Benue, Nigeria",  minOrder: "15 tons", rating: 5.0, deals: 32 },
  { title: "Shea Butter",  exporter: "Ogun Naturals",   price: "$1,500/ton", origin: "Ogun, Nigeria",   minOrder: "2 tons",  rating: 4.7, deals: 27 },
];

function FeaturedProducts() {
  const navigate = useNavigate();

  return (
    <section id="marketplace" style={{ padding: "100px 0", background: C.bg, position: "relative", overflow: "hidden" }}>
      {/* Dot pattern */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(12,56,37,0.055) 1px, transparent 0)`,
        backgroundSize: "36px 36px",
        opacity: 0.5,
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", position: "relative" }}>
        <AnimatedSection>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 52 }}>
            <div>
              <Label>Live Listings</Label>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "clamp(38px, 6vw, 78px)", fontWeight: 900,
                color: C.gray900, letterSpacing: "-0.03em", margin: 0,
              }}>Browse Active Listings</h2>
            </div>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14, color: C.gray500, maxWidth: 360, lineHeight: 1.75,
            }}>
              Real products from verified Nigerian exporters. Join to start trading.
            </p>
          </div>
        </AnimatedSection>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="lp-4col-grid">
          {featuredListings.map((item, i) => {
            const meta = COMMODITY_META[item.title] || { accent: C.greenBright, bg: C.greenLight };
            return (
              <AnimatedSection key={i} delay={i * 90}>
                <div style={{
                  background: C.white, borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  overflow: "hidden", height: "100%",
                  display: "flex", flexDirection: "column",
                  transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 24px 60px rgba(0,0,0,0.1)`;
                  (e.currentTarget as HTMLElement).style.borderColor = meta.accent;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                }}>
                  {/* Color accent bar */}
                  <div style={{ height: 3, background: meta.accent }} />

                  {/* Image area */}
                  <div style={{
                    height: 150, background: meta.bg,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 10,
                    position: "relative",
                  }}>
                    <span style={{ fontSize: 52, lineHeight: 1 }}>{COMMODITY_EMOJI[item.title]}</span>
                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 10, fontWeight: 700, color: C.gray500,
                      textTransform: "uppercase", letterSpacing: "0.12em",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <MapPin size={9} /> {item.origin}
                    </span>
                    <div style={{
                      position: "absolute", top: 11, right: 11,
                      background: C.greenDeep, borderRadius: 5,
                      padding: "3px 9px", display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <CheckCircle size={9} color={C.gold} />
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 800, color: C.white, letterSpacing: "0.08em" }}>VERIFIED</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 22, fontWeight: 900, color: C.gray900,
                      margin: "0 0 3px", letterSpacing: "0.01em",
                    }}>{item.title}</h3>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: C.gray400, fontWeight: 600, margin: "0 0 12px" }}>
                      {item.exporter}
                    </p>

                    {/* Stars */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12}
                            fill={s <= Math.round(item.rating) ? C.gold : "none"}
                            color={s <= Math.round(item.rating) ? C.gold : C.gray200}
                          />
                        ))}
                      </div>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: C.gray400, fontWeight: 600 }}>
                        {item.rating} · {item.deals} deals
                      </span>
                    </div>

                    {/* Price */}
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 28, fontWeight: 900, color: meta.accent,
                      lineHeight: 1, marginBottom: 10,
                    }}>{item.price}</div>

                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11,
                      color: C.gray400, fontWeight: 600, marginBottom: 18,
                    }}>
                      <span>Min: {item.minOrder}</span>
                      <span style={{ color: "#10B981", fontWeight: 700 }}>● In Stock</span>
                    </div>

                    <button onClick={() => navigate("/signup?type=buyer")} style={{
                      marginTop: "auto", width: "100%", padding: "11px",
                      borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      background: "transparent", color: C.greenBright,
                      border: `1.5px solid rgba(0,107,63,0.22)`,
                      transition: "all 0.18s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenDeep; (e.currentTarget as HTMLElement).style.color = C.white; (e.currentTarget as HTMLElement).style.borderColor = C.greenDeep; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = C.greenBright; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,107,63,0.22)"; }}>
                      Enquire Now
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        <AnimatedSection delay={350}>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <a href="/marketplace" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 28px", borderRadius: 9,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14, fontWeight: 700, color: C.greenBright,
              background: C.white, border: `1.5px solid rgba(0,107,63,0.2)`,
              textDecoration: "none", transition: "all 0.18s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.greenDeep; (e.currentTarget as HTMLElement).style.color = C.white; (e.currentTarget as HTMLElement).style.borderColor = C.greenDeep; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.white; (e.currentTarget as HTMLElement).style.color = C.greenBright; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,107,63,0.2)"; }}>
              View All Listings <ArrowRight size={15} />
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ============================================================
   TRUST SECTION — dark, institutional
   ============================================================ */
function TrustSection() {
  const cards = [
    {
      icon: Lock, title: "Escrow Protection",
      desc: "Funds are held securely in escrow until delivery is physically confirmed — zero payment risk for buyers and sellers.",
      stat: "100%", statLabel: "Payment Security", accent: C.gold,
    },
    {
      icon: Shield, title: "Verified Profiles",
      desc: "Every trader is document-verified before platform access. Only registered, legitimate businesses with real trade history.",
      stat: "247+", statLabel: "Verified Traders", accent: C.white,
    },
    {
      icon: Truck, title: "Tracked Shipments",
      desc: "Real-time status updates from origin to destination. Know exactly where your goods are at every stage.",
      stat: "38", statLabel: "Countries Served", accent: C.gold,
    },
  ];

  return (
    <section style={{ padding: "100px 0", background: C.greenDeep, position: "relative", overflow: "hidden" }}>
      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />

      {/* Watermark */}
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
            <Label light>Why Thousands Choose Us</Label>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(44px, 7vw, 88px)", fontWeight: 900,
              color: C.white, letterSpacing: "-0.03em", margin: 0,
            }}>Why IziXport?</h2>
          </div>
        </AnimatedSection>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="lp-3col-grid">
          {cards.map((card, idx) => (
            <AnimatedSection key={idx} delay={idx * 120}>
              <div style={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "36px 30px",
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
                  width: 52, height: 52, borderRadius: 11, marginBottom: 24,
                  background: "rgba(212,168,67,0.15)",
                  border: "1px solid rgba(212,168,67,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <card.icon size={22} color={C.gold} />
                </div>

                <h3 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 22, fontWeight: 800, color: C.white,
                  margin: "0 0 12px", letterSpacing: "0.01em",
                }}>{card.title}</h3>

                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13, color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.75, margin: "0 0 28px", flex: 1,
                }}>{card.desc}</p>

                <div style={{
                  display: "inline-flex", alignItems: "baseline", gap: 8,
                  padding: "11px 16px", borderRadius: 8,
                  background: "rgba(212,168,67,0.1)",
                  border: "1px solid rgba(212,168,67,0.2)",
                }}>
                  <span style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 28, fontWeight: 900, color: C.gold, lineHeight: 1,
                  }}>{card.stat}</span>
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 11, fontWeight: 700, color: "rgba(212,168,67,0.6)",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>{card.statLabel}</span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TESTIMONIALS — unchanged logic
   ============================================================ */
function TestimonialsSection() {
  return <Testimonials />;
}

/* ============================================================
   DUAL CTA BANNER — bold split layout
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
          {/* Exporter — dark */}
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
              {/* Grid bg */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }} />
              {/* Gold accent number */}
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

          {/* Buyer — light */}
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
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
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
        {/* Gold separator */}
        <div style={{
          height: 2, width: "100%",
          background: `linear-gradient(90deg, transparent 0%, ${C.greenDeep} 20%, ${C.gold} 50%, ${C.greenDeep} 80%, transparent 100%)`,
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 28px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", gap: "40px 32px" }} className="lp-footer-grid">
            {/* Brand */}
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

            {/* Platform */}
            <div>
              <h4 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10, fontWeight: 800, color: C.greenBright,
                letterSpacing: "0.18em", textTransform: "uppercase",
                margin: "0 0 20px",
              }}>Platform</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {platformLinks.map(link => (
                  <li key={link.label}>
                    <a href={link.href} style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 13, fontWeight: 500, color: C.gray500,
                      textDecoration: "none", transition: "color 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.white; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.gray500; }}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
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

            {/* Contact */}
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

              {/* Security badge */}
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
              © 2026 IziXport Technologies Ltd. All rights reserved.
            </p>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: C.gray600, margin: 0 }}>
              Made with ♥ in Lagos, Nigeria 🇳🇬
            </p>
          </div>
        </div>
      </footer>

      {/* Modals — unchanged content */}
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

      ::-webkit-scrollbar        { width: 3px; }
      ::-webkit-scrollbar-track  { background: #F1EDE6; }
      ::-webkit-scrollbar-thumb  { background: #1A5C41; border-radius: 99px; }

      ::selection { background: rgba(12,56,37,0.15); color: #0C3825; }

      /* Responsive grids */
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

      /* Hide/show nav items at breakpoint */
      @media (min-width: 768px) {
        .lp-mobile-only { display: none !important; }
      }
      @media (max-width: 767px) {
        .lp-desktop-nav { display: none !important; }
      }

      .lp-text-center { text-align: center; }
    `;
    document.head.appendChild(style);
    return () => { void document.head.removeChild(style); };
  }, []);

  return (
    <div style={{ width: "100%", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.white }}>
      <Navbar />
      <HeroSection />
      {/* Remove duplicate LiveStatsBar – stats already inside HeroSection */}
      <HowItWorks />
      <FeaturedProducts />
      <TrustSection />
      <TestimonialsSection />
      <DualCTABanner />
      <Footer />
    </div>
  );
}