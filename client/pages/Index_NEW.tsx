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
  MapPin,
  Linkedin,
  Github,
  ChevronDown,
  Check,
  CreditCard,
} from "lucide-react";

import LiveStats from "../components/LiveStats";
import Testimonials from "../components/Testimonials";

/* Professional B2B Marketplace Colors */
const COLORS = {
  primary: "#1a2342",
  primaryDark: "#0f172a",
  primaryLight: "#f0f4f9",
  accent: "#0891b2",
  accentLight: "#e0f2fe",
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray400: "#9ca3af",
  gray600: "#4b5563",
  gray800: "#1f2937",
  gray900: "#111827",
  success: "#059669",
  border: "#e5e7eb",
};

/* Custom Hooks */
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
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, start]);

  return count;
}

function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* Animated Section Wrapper */
function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.08);
  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-out ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(40px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* Modal Component */
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-xl max-w-2xl w-full max-h-[88vh] overflow-y-auto relative bg-white"
        style={{ border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 rounded-t-2xl px-8 pt-8 pb-5 flex items-center justify-between z-10 bg-white border-b" style={{ borderColor: COLORS.border }}>
          <h2
            className="text-2xl font-bold"
            style={{ color: COLORS.primary }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-gray-100"
          >
            <X className="w-5 h-5" style={{ color: COLORS.gray600 }} />
          </button>
        </div>
        <div
          className="px-8 py-7 leading-relaxed text-sm"
          style={{ color: COLORS.gray600 }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* Section Label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 mb-5">
      <div
        className="w-2 h-2 rounded-full"
        style={{ background: COLORS.accent }}
      />
      <span
        className="text-xs font-semibold tracking-[0.15em] uppercase"
        style={{ color: COLORS.accent }}
      >
        {children}
      </span>
    </div>
  );
}

/* Navbar */
function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Marketplace", href: "#marketplace" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Enterprise", href: "#pricing" },
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          boxShadow: scrolled ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group shrink-0">
            <div className="rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
              <img src="/logo.jpeg" alt="IziXport" className="h-11 w-auto block" />
            </div>
            <span className="font-bold text-lg" style={{ color: COLORS.primary }}>
              IziXport
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
                style={{ color: COLORS.gray600 }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = COLORS.accent;
                  (e.currentTarget as HTMLElement).style.background = COLORS.accentLight;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = COLORS.gray600;
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all"
              style={{
                color: COLORS.primary,
                border: `1.5px solid ${COLORS.primary}`,
                background: "transparent",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = COLORS.primaryLight;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-6 py-2.5 text-sm font-bold rounded-lg text-white transition-all hover:shadow-lg"
              style={{ background: COLORS.accent }}
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" style={{ color: COLORS.primary }} />
            ) : (
              <Menu className="w-5 h-5" style={{ color: COLORS.primary }} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t" style={{ borderColor: COLORS.border }}>
            <div className="px-6 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block px-4 py-2 text-sm font-medium rounded-lg"
                  style={{ color: COLORS.gray600 }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => navigate("/login")}
                className="w-full px-5 py-2.5 text-sm font-semibold rounded-lg"
                style={{
                  color: COLORS.primary,
                  border: `1.5px solid ${COLORS.primary}`,
                  background: "transparent",
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="w-full px-6 py-2.5 text-sm font-bold rounded-lg text-white"
                style={{ background: COLORS.accent }}
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div className="h-[72px]" />
    </>
  );
}

/* Hero Section */
function HeroSection() {
  const navigate = useNavigate();
  const { ref: statsRef, inView: statsInView } = useInView();
  const exporters = useCountUp(2500, 2000, statsInView);
  const trades = useCountUp(450000, 2000, statsInView);
  const merchants = useCountUp(1200, 2000, statsInView);

  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden" style={{ background: COLORS.white }}>
      {/* Gradient Background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.accentLight} 100%)`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <AnimatedSection className="space-y-8">
            <div className="space-y-4">
              <h1
                className="text-5xl md:text-6xl font-bold leading-tight"
                style={{ color: COLORS.primary }}
              >
                Simplify Global Trade
              </h1>
              <p
                className="text-lg md:text-xl leading-relaxed"
                style={{ color: COLORS.gray600 }}
              >
                The secure B2B marketplace connecting export businesses with verified buyers worldwide. Fast, transparent, and trustworthy.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/signup")}
                className="px-8 py-4 text-base font-bold rounded-lg text-white transition-all hover:shadow-lg"
                style={{ background: COLORS.accent }}
              >
                Start Trading Today
              </button>
              <a
                href="#how-it-works"
                className="px-8 py-4 text-base font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                style={{
                  color: COLORS.primary,
                  border: `2px solid ${COLORS.primary}`,
                  background: "transparent",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = COLORS.primaryLight;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: COLORS.success }} />
                <span className="text-sm font-medium" style={{ color: COLORS.gray700 }}>
                  Verified Traders
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" style={{ color: COLORS.success }} />
                <span className="text-sm font-medium" style={{ color: COLORS.gray700 }}>
                  Secure Escrow
                </span>
              </div>
            </div>
          </AnimatedSection>

          {/* Right: Visual */}
          <AnimatedSection delay={200} className="hidden md:block relative h-[500px]">
            <div
              className="absolute inset-0 rounded-2xl opacity-10"
              style={{ background: COLORS.accent }}
            />
            <div className="absolute inset-0 rounded-2xl" style={{ border: `2px solid ${COLORS.border}` }}>
              <div className="w-full h-full flex items-center justify-center">
                <div className="space-y-6 w-4/5">
                  <div className="space-y-3">
                    <div className="h-12 rounded-lg" style={{ background: COLORS.gray200 }} />
                    <div className="h-3 rounded" style={{ background: COLORS.gray200, width: "70%" }} />
                  </div>
                  <div className="space-y-3">
                    <div className="h-12 rounded-lg" style={{ background: COLORS.gray200 }} />
                    <div className="h-3 rounded" style={{ background: COLORS.gray200, width: "80%" }} />
                  </div>
                  <div className="space-y-3">
                    <div className="h-12 rounded-lg" style={{ background: COLORS.gray200 }} />
                    <div className="h-3 rounded" style={{ background: COLORS.gray200, width: "60%" }} />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Stats */}
        <AnimatedSection ref={statsRef} delay={400} className="mt-20 grid grid-cols-3 gap-8">
          <div className="text-center">
            <div
              className="text-4xl md:text-5xl font-bold mb-2"
              style={{ color: COLORS.accent }}
            >
              {exporters}+
            </div>
            <p className="text-sm md:text-base" style={{ color: COLORS.gray600 }}>
              Active Exporters
            </p>
          </div>
          <div className="text-center">
            <div
              className="text-4xl md:text-5xl font-bold mb-2"
              style={{ color: COLORS.accent }}
            >
              ${(trades / 1000).toFixed(0)}K+
            </div>
            <p className="text-sm md:text-base" style={{ color: COLORS.gray600 }}>
              Monthly Trade Volume
            </p>
          </div>
          <div className="text-center">
            <div
              className="text-4xl md:text-5xl font-bold mb-2"
              style={{ color: COLORS.accent }}
            >
              {merchants}+
            </div>
            <p className="text-sm md:text-base" style={{ color: COLORS.gray600 }}>
              Verified Buyers
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* Features Section */
function FeaturesSection() {
  const features = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Logistics Management",
      description: "Track shipments in real-time with full visibility and integrated carrier management.",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Buyer Verification",
      description: "Advanced KYC/AML verification ensures you only trade with legitimate businesses.",
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Secure Payments",
      description: "Escrow-protected transactions with multiple payment options for peace of mind.",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into your trading performance and market trends.",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Reach",
      description: "Connect with verified buyers across 150+ countries without borders.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Dedicated Support",
      description: "24/7 multilingual support team to assist your trading operations.",
    },
  ];

  return (
    <section id="marketplace" className="py-20 md:py-32" style={{ background: COLORS.gray50 }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <AnimatedSection className="text-center mb-16">
          <SectionLabel>Platform Features</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
            style={{ color: COLORS.primary }}
          >
            Everything You Need to Trade Confidently
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.gray600 }}
          >
            Built for professional exporters and verified buyers, with enterprise-grade security and reliability.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <AnimatedSection
              key={i}
              delay={i * 100}
              className="p-8 rounded-xl transition-all hover:shadow-lg"
              style={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = COLORS.accent;
                el.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = COLORS.border;
                el.style.transform = "translateY(0)";
              }}
            >
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center mb-6"
                style={{ background: COLORS.accentLight, color: COLORS.accent }}
              >
                {feature.icon}
              </div>
              <h3
                className="text-xl font-bold mb-3"
                style={{ color: COLORS.primary }}
              >
                {feature.title}
              </h3>
              <p style={{ color: COLORS.gray600 }}>
                {feature.description}
              </p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* How It Works Section */
function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Create Account",
      description: "Sign up as an exporter or buyer and complete your business verification.",
    },
    {
      number: "02",
      title: "Build Profile",
      description: "Set up your company profile with credentials, certifications, and banking details.",
    },
    {
      number: "03",
      title: "Browse & Connect",
      description: "Explore verified listings or post your export products for qualified buyers.",
    },
    {
      number: "04",
      title: "Negotiate & Close",
      description: "Communicate directly with trusted trading partners and finalize terms.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-32" style={{ background: COLORS.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <AnimatedSection className="text-center mb-16">
          <SectionLabel>The Process</SectionLabel>
          <h2
            className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
            style={{ color: COLORS.primary }}
          >
            Streamlined Trading Workflow
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.gray600 }}
          >
            From registration to successful trade in just four simple steps.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <AnimatedSection key={i} delay={i * 150}>
              <div className="space-y-4">
                <div
                  className="text-5xl font-bold opacity-20"
                  style={{ color: COLORS.accent }}
                >
                  {step.number}
                </div>
                <h3
                  className="text-xl font-bold"
                  style={{ color: COLORS.primary }}
                >
                  {step.title}
                </h3>
                <p style={{ color: COLORS.gray600, lineHeight: 1.6 }}>
                  {step.description}
                </p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute mt-8 -right-4 top-8">
                    <ArrowRight className="w-6 h-6" style={{ color: COLORS.border }} />
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

/* CTA Section */
function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-32" style={{ background: COLORS.primaryLight }}>
      <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
        <AnimatedSection className="space-y-8">
          <h2
            className="text-4xl md:text-5xl font-bold leading-tight"
            style={{ color: COLORS.primary }}
          >
            Ready to Start Trading?
          </h2>
          <p
            className="text-lg"
            style={{ color: COLORS.gray600 }}
          >
            Join thousands of verified exporters and buyers on IziXport. Get access to a global marketplace with enterprise-grade security and support.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="px-8 py-4 text-base font-bold rounded-lg text-white mx-auto block transition-all hover:shadow-lg"
            style={{ background: COLORS.accent }}
          >
            Get Started Today
          </button>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* Footer */
function Footer() {
  const footerLinks = {
    product: [
      { label: "Marketplace", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Security", href: "#" },
    ],
    company: [
      { label: "About Us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
    ],
    legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Contact", href: "#" },
    ],
  };

  return (
    <footer style={{ background: COLORS.primary, color: COLORS.white }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          <div>
            <h3 className="font-bold text-lg mb-2">IziXport</h3>
            <p className="text-sm opacity-75">
              Simplifying global trade for exporters and buyers worldwide.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 opacity-75">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.href}
                      className="text-sm opacity-75 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }} className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm opacity-75">
            © 2024 IziXport. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="opacity-75 hover:opacity-100 transition-opacity">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="opacity-75 hover:opacity-100 transition-opacity">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="opacity-75 hover:opacity-100 transition-opacity">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* Main Component */
export default function Index() {
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
        e.preventDefault();
        const id = target.getAttribute("href")?.slice(1);
        const element = document.getElementById(id || "");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };
    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  return (
    <div style={{ background: COLORS.white, color: COLORS.gray900 }}>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <LiveStats />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
}
