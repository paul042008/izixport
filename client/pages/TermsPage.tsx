import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Scale } from "lucide-react";

const C = {
  greenDeep: "#0C3825",
  greenBright: "#006B3F",
  gold: "#C9A84C",
  bg: "#F8F6F1",
  white: "#FFFFFF",
  gray900: "#0D0B08",
  gray700: "#322F2A",
  gray600: "#4A4640",
  gray500: "#78746D",
  gray400: "#9E9A93",
  gray100: "#F2F0EB",
  border: "rgba(200,192,180,0.35)",
};

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="flex items-center gap-3 text-xl font-black mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: C.greenDeep, letterSpacing: "-0.01em" }}>
        <span className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black text-white" style={{ background: C.gold, flexShrink: 0 }}>
          {num}
        </span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: C.gray600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {children}
      </div>
    </div>
  );
}

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Bar */}
      <div className="sticky top-0 z-50" style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-green-700" style={{ color: C.gray600 }}>
            <ArrowLeft size={18} /> Back to Home
          </button>
          <img src="/logo.jpeg" alt="IziXport" className="h-8 rounded-lg" />
        </div>
      </div>

      {/* Header */}
      <div className="py-16 px-6" style={{ background: C.greenDeep }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ background: "rgba(212,168,67,0.15)", border: "1px solid rgba(212,168,67,0.3)" }}>
            <Scale size={14} style={{ color: C.gold }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.02em" }}>
            Terms & Conditions
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Effective Date: To be finalized once CAC registration is complete.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-start gap-4 p-4 rounded-xl mb-10" style={{ background: "rgba(0,107,63,0.04)", border: "1px solid rgba(0,107,63,0.12)" }}>
            <FileText size={20} className="mt-0.5 shrink-0" style={{ color: C.greenBright }} />
            <p className="text-sm leading-relaxed" style={{ color: C.gray600 }}>
              These Terms & Conditions govern your access to and use of IziXport. By creating an account or using the platform, you agree to be bound by these Terms. If you do not agree, you must not use IziXport.
            </p>
          </div>

          <Section num="1" title="Definitions">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>"Platform"</strong> refers to the IziXport website and any related services.</li>
              <li><strong>"Exporter"</strong> refers to a user who lists products for export sale.</li>
              <li><strong>"Buyer"</strong> refers to a user who purchases or seeks to purchase listed products.</li>
              <li><strong>"Deal"</strong> refers to any transaction initiated between an Exporter and Buyer through the Platform.</li>
              <li><strong>"Escrow Partner"</strong> refers to Pandascrow, our third-party payment and escrow service provider.</li>
            </ul>
          </Section>

          <Section num="2" title="Eligibility">
            <p>You must be at least 18 years old and capable of entering a legally binding agreement to use IziXport. By registering, you confirm that all information you provide is accurate and that you have the legal authority (personal or business) to engage in export or import trade.</p>
          </Section>

          <Section num="3" title="Account Registration & Verification">
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You must complete identity verification (KYC) before listing products, initiating deals, or receiving payouts.</li>
              <li>IziXport reserves the right to suspend or reject accounts that fail verification or provide false information.</li>
              <li>Exporters must provide accurate bank account details for payout purposes; IziXport is not liable for payouts sent to incorrect details provided by the Exporter.</li>
            </ul>
          </Section>

          <Section num="4" title="Listings (Exporters)">
            <ul className="list-disc pl-5 space-y-2">
              <li>Exporters are solely responsible for the accuracy of product listings, including descriptions, quantity, pricing, and images.</li>
              <li>Listings must represent genuine, legally exportable goods. Prohibited, counterfeit, or illegally sourced goods are strictly forbidden.</li>
              <li>IziXport reserves the right to remove any listing that violates these Terms or applicable law, without prior notice.</li>
            </ul>
          </Section>

          <Section num="5" title="Deals & Payments">
            <ul className="list-disc pl-5 space-y-2">
              <li>All payments for Deals made through IziXport must be processed via our Escrow Partner. Off-platform payment for a Deal initiated on IziXport is strictly prohibited.</li>
              <li>Funds are held in escrow by the Escrow Partner until the agreed delivery or completion conditions of the Deal are met.</li>
              <li>IziXport charges a percentage-based commission on each completed Deal. The applicable commission rate will be clearly displayed before a Deal is confirmed.</li>
              <li>Payouts to Exporters are released after a Deal is marked complete and any applicable holding period has passed.</li>
            </ul>
          </Section>

          <Section num="6" title="Dispute Resolution">
            <p className="mb-3">Where a dispute arises between an Exporter and Buyer regarding a Deal, IziXport will act as the primary mediator to investigate and resolve the dispute fairly, based on evidence provided by both parties.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Both parties agree to cooperate in good faith with IziXport's investigation and provide requested evidence within a reasonable timeframe.</li>
              <li>IziXport's decision on a dispute, including instructions to release or refund escrowed funds, will be communicated to the Escrow Partner for execution.</li>
              <li>IziXport reserves the right to escalate unresolved or high-value disputes to the Escrow Partner's own resolution process or to relevant legal channels where necessary.</li>
              <li>IziXport's mediation is offered in good faith but does not constitute formal legal arbitration. Either party retains the right to pursue separate legal remedies.</li>
            </ul>
          </Section>

          <Section num="7" title="Prohibited Conduct">
            <p className="mb-3">Users agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide false, misleading, or fraudulent information</li>
              <li>Attempt to bypass the Platform's escrow system for a Deal initiated on IziXport</li>
              <li>List or trade prohibited, illegal, or unsafe goods</li>
              <li>Harass, defraud, or mislead other users</li>
              <li>Use the Platform for money laundering or other unlawful financial activity</li>
              <li>Attempt to interfere with the Platform's security, infrastructure, or normal operation</li>
            </ul>
          </Section>

          <Section num="8" title="Fees & Commission">
            <p>IziXport earns revenue through a percentage-based commission applied to completed Deals. The commission rate is subject to change, and any changes will be communicated to users in advance and applied only to Deals initiated after the change takes effect.</p>
          </Section>

          <Section num="9" title="Account Suspension & Termination">
            <p>IziXport may suspend or terminate any account that violates these Terms, fails verification requirements, or engages in fraudulent or harmful conduct, with or without prior notice depending on the severity of the violation. Users may also close their own account at any time, subject to completion of any pending Deals.</p>
          </Section>

          <Section num="10" title="Limitation of Liability">
            <p className="mb-3">IziXport facilitates connections and transactions between independent Exporters and Buyers but is not a party to the underlying trade of goods itself. To the fullest extent permitted by law, IziXport is not liable for:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The quality, safety, legality, or accuracy of goods listed by Exporters</li>
              <li>Shipping delays, customs issues, or logistics failures outside the Platform's control</li>
              <li>Losses arising from a Buyer's or Exporter's breach of agreed Deal terms</li>
              <li>Service interruptions caused by our Escrow Partner or other third-party providers</li>
            </ul>
            <p className="mt-3">IziXport's total liability for any claim arising from use of the Platform shall not exceed the commission fees earned by IziXport on the specific Deal giving rise to the claim.</p>
          </Section>

          <Section num="11" title="Intellectual Property">
            <p>All content on the Platform — including the IziXport name, logo, design, and underlying software — is the property of IziXport and may not be copied, reproduced, or used without written permission. Exporters retain ownership of their own listing content (text, images) but grant IziXport a license to display it on the Platform.</p>
          </Section>

          <Section num="12" title="Changes to These Terms">
            <p>IziXport may update these Terms from time to time. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms. Material changes will be communicated to users in advance where reasonably possible.</p>
          </Section>

          <Section num="13" title="Governing Law">
            <p>These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes not resolved through IziXport's mediation process shall be subject to the jurisdiction of the courts of the applicable State/Jurisdiction.</p>
          </Section>

          <Section num="14" title="Contact Us">
            <p>For questions about these Terms, contact us at:</p>
            <div className="mt-3 p-4 rounded-xl" style={{ background: C.gray100, border: `1px solid ${C.border}` }}>
              <p className="font-semibold text-sm" style={{ color: C.gray700 }}>IziXport Technologies Ltd</p>
              <p className="text-sm mt-1" style={{ color: C.gray500 }}>hello@izixport.com</p>
            </div>
          </Section>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 text-center text-xs" style={{ color: C.gray400, borderTop: `1px solid ${C.border}`, background: C.white }}>
        © 2026 IziXport Technologies Ltd. All rights reserved.
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>
    </div>
  );
}