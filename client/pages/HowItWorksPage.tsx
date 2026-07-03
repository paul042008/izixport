// pages/HowItWorksPage.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Shield,
  CheckCircle2,
  Star,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  Package,
  Ship,
  Wallet,
  FileText,
  UserCheck,
  Globe,
  MessageCircle,
  Lock,
  Truck,
  ClipboardCheck,
  ArrowUp,
} from "lucide-react";

/* ============================================================
   BRAND COLORS – consistent with all pages
   ============================================================ */
const COLORS = {
  primary: "#006B3F",
  primaryDark: "#004D2E",
  primaryLight: "#E6F2ED",
  accent: "#D4A843",
  accentLight: "#F5ECD7",
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
};

/* ============================================================
   INTERSECTION OBSERVER HOOK FOR SCROLL ANIMATIONS
   ============================================================ */
function useInView(threshold = 0.1) {
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

/* ============================================================
   ANIMATED SECTION COMPONENT
   ============================================================ */
function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.15);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   EXPORTER STEPS (from your spec – enhanced with numbers)
   ============================================================ */
const exporterSteps = [
  { number: "01", icon: Building2, title: "Register & Get Verified", desc: "Sign up with your business details. Submit CAC registration number and NIN. Verified within 24 hours.", },
  { number: "02", icon: Package, title: "Add Your Export Listing", desc: "Create a product listing with commodity name, quantity, price per unit, origin state, and photos. Live instantly.", },
  { number: "03", icon: MessageCircle, title: "Receive Buyer Enquiries", desc: "International buyers browse your listing and send enquiries. You’re notified instantly. Every deal starts in a private Deal Room.", },
  { number: "04", icon: Ship, title: "Negotiate in the Deal Room", desc: "Chat directly with the buyer inside your secure Deal Room. Agree on price, quantity, shipping terms, and delivery expectations.", },
  { number: "05", icon: FileText, title: "Submit Your Freight Quote", desc: "Once terms are agreed, enter freight details – shipping company, cost estimate, and delivery timeframe. Buyer sees clean summary.", },
  { number: "06", icon: Lock, title: "Buyer Pays Into Escrow", desc: "Buyer pays full deal amount into IziXport's secure escrow. You’re notified that funds are held safely. No risk of non-payment.", },
  { number: "07", icon: ClipboardCheck, title: "Complete Your Shipment Checklist", desc: "A 9-step shipment checklist unlocks in your Deal Room. Upload each document as you go (invoice, packing list, certificate of origin, etc.). Buyer sees progress in real time.", },
  { number: "08", icon: UserCheck, title: "Buyer Confirms Delivery", desc: "When goods arrive, buyer has 72 hours to inspect and confirm receipt. Dispute available if needed.", },
  { number: "09", icon: Wallet, title: "You Get Paid", desc: "Once delivery is confirmed, escrow releases funds to your Nigerian bank account – usually same business day, minus platform fee.", },
];

/* ============================================================
   BUYER STEPS (from your spec – enhanced with numbers)
   ============================================================ */
const buyerSteps = [
  { number: "01", icon: UserCheck, title: "Register & Get Verified", desc: "Sign up as a buyer. Submit business registration documents. Nigerian buyers: CAC & NIN. International: business certificate & passport. 24-48 hours.", },
  { number: "02", icon: Globe, title: "Find Nigerian Exporters", desc: "Browse verified Nigerian agricultural exporters. Filter by product, origin state, minimum order, and price.", },
  { number: "03", icon: MessageCircle, title: "Send an Enquiry", desc: "Click Enquire on any listing. A private Deal Room opens between you, the exporter, and the IziXport AI Trade Facilitator.", },
  { number: "04", icon: MessageCircle, title: "Negotiate Securely", desc: "Discuss price, quantity, delivery timeline and shipping terms directly with the exporter. All communication stays inside the Deal Room – no phone numbers or external links.", },
  { number: "05", icon: Lock, title: "Pay Into Escrow", desc: "Review clear breakdown: goods value, shipping estimate, platform fee, total. Pay full amount into IziXport escrow via card, bank transfer or mobile money.", },
  { number: "06", icon: FileText, title: "Track Every Step", desc: "Watch exporter's shipment checklist update in real time. View uploaded documents – invoice, certificate of origin, bill of lading – at every stage.", },
  { number: "07", icon: CheckCircle2, title: "Confirm Delivery, Release Payment", desc: "When goods arrive, inspect them. If correct, click Confirm Delivery. Escrow releases automatically. If issue, raise dispute – funds stay frozen until resolved.", },
];

/* ============================================================
   TRUST CARDS (escrow, verification, documentation)
   ============================================================ */
const trustCards = [
  {
    icon: Lock,
    title: "Funds Held Until Delivery",
    desc: "Every payment is held in secure escrow. The exporter cannot access the money until you confirm delivery. If something goes wrong, your funds are frozen and our team reviews the case.",
  },
  {
    icon: UserCheck,
    title: "Every User Is Verified",
    desc: "Exporters verified via CAC registration and NIN. Buyers verified with business documents. Anonymous trading is not allowed. Real identities mean real accountability.",
  },
  {
    icon: FileText,
    title: "Proof At Every Checkpoint",
    desc: "From commercial invoice to bill of lading, every document is uploaded and stored on the platform. Disputes are resolved with evidence, not just claims. Your deal is fully traceable.",
  },
];

/* ============================================================
   FAQ DATA
   ============================================================ */
const faqs = [
  {
    q: "What is escrow?",
    a: "Escrow means a neutral third party (IziXport) holds the payment safely. The seller cannot access it until the buyer confirms the goods arrived in correct condition.",
  },
  {
    q: "What if the goods arrive damaged or wrong?",
    a: "The buyer can raise a dispute within 72 hours of delivery. Escrow freezes immediately. Our team reviews the uploaded documents and evidence from both parties, then makes a fair decision.",
  },
  {
    q: "How long does verification take?",
    a: "Exporter verification takes up to 24 hours. International buyer verification takes 24–48 hours. You can browse the marketplace while you wait but cannot start a deal until verified.",
  },
  {
    q: "What currencies are supported?",
    a: "Deals are priced in USD for international trades. Nigerian buyers can pay in Naira via Paystack. International buyers pay in USD via card or bank transfer.",
  },
  {
    q: "What is IziXport's fee?",
    a: "IziXport charges 2.5% of the deal value, split equally — 1.25% from the buyer and 1.25% from the exporter. Your first deal is charged at 1% only.",
  },
  {
    q: "Who handles the shipping?",
    a: "The exporter arranges their own shipment with their preferred freight company. IziXport does not book or manage shipping. We track the process through document uploads and milestone checkpoints.",
  },
  {
    q: "Is IziXport regulated?",
    a: "IziXport is a registered Nigerian company (CAC) and complies with NDPR data protection regulations. Payments are processed through Paystack and Flutterwave, both licensed by the Central Bank of Nigeria.",
  },
];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function HowItWorksPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"exporter" | "buyer">("exporter");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const steps = activeTab === "exporter" ? exporterSteps : buyerSteps;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      {/* ── Sticky Header ── */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${COLORS.gray200}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm px-3 py-1.5">
            <img src="/logo.jpeg" alt="IziXport" className="h-7 w-auto block" />
          </div>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-gray-100"
            style={{ color: COLORS.primary }}
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="pt-20 pb-16 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-b from-primaryLight/40 to-white pointer-events-none"
          style={{ background: `linear-gradient(to bottom, ${COLORS.primaryLight}40, white)` }}
        />
        <div className="max-w-7xl mx-auto px-6 relative text-center">
          <AnimatedSection>
            <span
              className="inline-block text-xs font-bold tracking-[0.2em] uppercase mb-4"
              style={{ color: COLORS.primary }}
            >
              HOW IT WORKS
            </span>
            <h1
              className="text-5xl md:text-7xl font-black leading-tight"
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                color: COLORS.gray900,
              }}
            >
              From Product Listed
              <br />
              To Payment Received
            </h1>
            <p
              className="mt-6 max-w-2xl mx-auto text-lg"
              style={{ color: COLORS.gray600 }}
            >
              IziXport connects verified Nigerian exporters with international
              buyers. Every deal is guided, documented, and protected by escrow
              from first message to final payment.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={() => setActiveTab("exporter")}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                  activeTab === "exporter"
                    ? "bg-primary text-white shadow-lg"
                    : "border border-gray-300 text-gray-600 hover:border-primary/50"
                }`}
                style={{ backgroundColor: activeTab === "exporter" ? COLORS.primary : "" }}
              >
                I'm an Exporter
              </button>
              <button
                onClick={() => setActiveTab("buyer")}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                  activeTab === "buyer"
                    ? "bg-primary text-white shadow-lg"
                    : "border border-gray-300 text-gray-600 hover:border-primary/50"
                }`}
                style={{ backgroundColor: activeTab === "buyer" ? COLORS.primary : "" }}
              >
                I'm a Buyer
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Steps Grid ── */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-6">
          {/* Active tab indicator */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-sm font-semibold" style={{ color: COLORS.gray700 }}>
              {activeTab === "exporter" ? "🏭 Exporter Flow" : "🌍 Buyer Flow"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <AnimatedSection key={idx} delay={idx * 60}>
                <div
                  className="group bg-white rounded-3xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 transition-all duration-300 flex flex-col h-full relative"
                >
                  {/* Step number badge */}
                  <div
                    className="absolute top-6 right-6 text-3xl font-black opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{ fontFamily: "Barlow Condensed, sans-serif", color: COLORS.primary }}
                  >
                    {step.number}
                  </div>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-300"
                    style={{ background: COLORS.primary }}
                  >
                    <step.icon className="w-7 h-7" />
                  </div>
                  <h3
                    className="text-xl font-bold mb-3 pr-8"
                    style={{
                      fontFamily: "Barlow Condensed, sans-serif",
                      color: COLORS.gray900,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: COLORS.gray600 }}>
                    {step.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Section (Your Money Is Safe) ── */}
      <section className="py-20 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-black"
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                color: COLORS.gray900,
              }}
            >
              Your Money Is Safe Until Goods Arrive
            </h2>
            <div
              className="w-16 h-1 mx-auto mt-4 rounded-full"
              style={{ background: COLORS.accent }}
            />
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8">
            {trustCards.map((card, idx) => (
              <AnimatedSection key={idx} delay={idx * 100}>
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: COLORS.accentLight }}
                  >
                    <card.icon className="w-6 h-6" style={{ color: COLORS.accent }} />
                  </div>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ fontFamily: "Barlow Condensed, sans-serif", color: COLORS.gray900 }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: COLORS.gray600 }}>
                    {card.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="py-20 bg-white relative">
        <div className="max-w-4xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <h2
              className="text-4xl md:text-5xl font-black"
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                color: COLORS.gray900,
              }}
            >
              Frequently Asked Questions
            </h2>
            <div
              className="w-16 h-1 mx-auto mt-4 rounded-full"
              style={{ background: COLORS.accent }}
            />
          </AnimatedSection>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-primary/30"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold pr-4" style={{ color: COLORS.gray900 }}>
                    {faq.q}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5" style={{ color: COLORS.primary }} />
                  ) : (
                    <ChevronDown className="w-5 h-5" style={{ color: COLORS.primary }} />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 text-sm leading-relaxed border-t border-gray-100" style={{ color: COLORS.gray600 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        className="py-20 text-white text-center relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>
        <div className="max-w-4xl mx-auto px-6 relative">
          <AnimatedSection>
            <h2
              className="text-4xl md:text-5xl font-black mb-4"
              style={{ fontFamily: "Barlow Condensed, sans-serif" }}
            >
              Ready to Trade?
            </h2>
            <p className="text-lg mb-8 text-white/80">
              Join thousands of verified exporters and buyers already trading on IziXport.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate("/signup?type=exporter")}
                className="btn-primary px-8 py-4 rounded-full font-bold text-sm shadow-lg"
              >
                Create Exporter Account →
              </button>
              <button
                onClick={() => navigate("/signup?type=buyer")}
                className="px-8 py-4 rounded-full font-bold text-sm shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{ background: COLORS.accent, color: COLORS.white }}
              >
                Create Buyer Account →
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 rounded-full shadow-lg transition-all hover:scale-110"
          style={{ background: COLORS.primary, color: COLORS.white }}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Global styles for animations and button gradient */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        @keyframes btnShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .btn-primary {
          background: linear-gradient(90deg, #004D2E 0%, #006B3F 30%, #00994D 50%, #006B3F 70%, #004D2E 100%);
          background-size: 200% auto;
          animation: btnShimmer 3s linear infinite;
          color: white;
          border: none;
          cursor: pointer;
          transition: filter 0.18s, transform 0.12s, box-shadow 0.18s;
        }
        .btn-primary:hover {
          filter: brightness(1.08);
          box-shadow: 0 6px 24px rgba(0,107,63,0.25);
        }
        .btn-primary:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
}