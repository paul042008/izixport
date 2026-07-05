import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock } from "lucide-react";

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

export default function PrivacyPage() {
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
            <Shield size={14} style={{ color: C.gold }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.gold }}>Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "-0.02em" }}>
            Privacy Policy
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
            <Lock size={20} className="mt-0.5 shrink-0" style={{ color: C.greenBright }} />
            <p className="text-sm leading-relaxed" style={{ color: C.gray600 }}>
              IziXport operates a digital trade platform connecting Nigerian exporters with international buyers. This Privacy Policy explains what personal data we collect, why we collect it, how we use and protect it, and the rights you have over it. By creating an account or using IziXport, you agree to the practices described in this Policy.
            </p>
          </div>

          <Section num="1" title="Who We Are">
            <p>IziXport is operated by IziXport Technologies Ltd, a business registered in Nigeria under CAC registration number (pending), with its registered address at Lagos, Nigeria.</p>
            <p className="mt-2">For any questions about this Policy or how your data is handled, you can reach us at hello@izixport.com.</p>
          </Section>

          <Section num="2" title="Information We Collect">
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-sm mb-2" style={{ color: C.gray700 }}>2.1 Account Information</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Full name, email address, phone number, and password</li>
                  <li>Role on the platform (exporter or buyer)</li>
                  <li>Business name and business description, where applicable</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2" style={{ color: C.gray700 }}>2.2 Verification (KYC) Information</h3>
                <p className="mb-2">To meet regulatory and payment partner requirements, exporters and buyers may be asked to provide:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Government-issued identification (e.g. National ID, International Passport, Driver's Licence, Voter's Card)</li>
                  <li>Bank Verification Number (BVN), where required by our payment partners</li>
                  <li>Business registration documents (e.g. CAC certificate), where applicable</li>
                  <li>Proof of address or other documents requested for verification</li>
                </ul>
                <p className="mt-2">Identity verification is processed through our payment and escrow partner's KYC provider. We do not store raw ID document images longer than necessary for verification and compliance purposes.</p>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2" style={{ color: C.gray700 }}>2.3 Financial Information</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Bank account name, number, and bank code (for exporter payouts)</li>
                  <li>Transaction history related to listings, deals, and payouts</li>
                </ul>
                <p className="mt-2">IziXport does not directly process or store full card or payment credentials. Payments and escrow are handled by our licensed payment partner.</p>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2" style={{ color: C.gray700 }}>2.4 Listing and Trade Information</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Product listings, descriptions, pricing, and images uploaded by exporters</li>
                  <li>Deal and shipment tracking information</li>
                  <li>Messages or communication exchanged through the platform between exporters and buyers</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2" style={{ color: C.gray700 }}>2.5 Technical Information</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>IP address, device type, browser type, and operating system</li>
                  <li>Log data such as access times and pages viewed</li>
                  <li>Cookies or similar technologies used to keep you logged in and improve platform performance</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section num="3" title="How We Use Your Information">
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Create and manage your account</li>
              <li>Verify your identity and eligibility to trade on the platform</li>
              <li>Facilitate listings, deals, escrow payments, and payouts</li>
              <li>Communicate with you about your account, transactions, or platform updates</li>
              <li>Detect and prevent fraud, abuse, or violations of our Terms</li>
              <li>Comply with legal, regulatory, and tax obligations</li>
              <li>Improve platform performance, security, and user experience</li>
            </ul>
          </Section>

          <Section num="4" title="How We Share Your Information">
            <p className="mb-2">We do not sell your personal data. We share information only in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>With our payment and escrow partner (Pandascrow) to process verification, payments, and payouts</li>
              <li>With identity verification providers used by our payment partner to confirm KYC details</li>
              <li>Between exporters and buyers who are actively engaged in a deal together, limited to information necessary to complete that transaction (e.g. business name, contact details, shipment status)</li>
              <li>With regulators, law enforcement, or government bodies where required by law</li>
              <li>With service providers who support our platform's operation (e.g. hosting providers), under confidentiality obligations</li>
            </ul>
            <p className="mt-3 p-3 rounded-lg text-xs font-medium" style={{ background: "rgba(0,107,63,0.06)", border: "1px solid rgba(0,107,63,0.15)", color: C.greenDeep }}>
              We do not share your government ID, bank details, or KYC documents with other users of the platform.
            </p>
          </Section>

          <Section num="5" title="Data Retention">
            <p>We retain personal and verification data for as long as your account is active, and for a period afterward as required to meet legal, tax, and compliance obligations — including obligations imposed by our payment and escrow partner. We do not promise deletion of verification data immediately after a transaction, since compliance and dispute-resolution requirements may require us to retain it for a defined period afterward.</p>
          </Section>

          <Section num="6" title="Data Security">
            <p>We apply reasonable technical and organizational measures to protect your information, including encrypted data transmission and restricted internal access to sensitive data. However, no system is completely secure, and we cannot guarantee absolute security of information transmitted to or from the platform.</p>
          </Section>

          <Section num="7" title="Your Rights">
            <p className="mb-2">Depending on applicable law, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your data, subject to our legal and regulatory retention obligations</li>
              <li>Withdraw consent for optional data processing, where applicable</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at hello@izixport.com.</p>
          </Section>

          <Section num="8" title="International Data Transfers">
            <p>Because IziXport connects Nigerian exporters with international buyers, your information may be processed or accessed from outside Nigeria, including by buyers or partners located in other countries, solely for the purpose of facilitating trade and payments through the platform.</p>
          </Section>

          <Section num="9" title="Children's Privacy">
            <p>IziXport is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from minors.</p>
          </Section>

          <Section num="10" title="Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify users of material changes by posting the updated Policy on the platform with a revised effective date.</p>
          </Section>

          <Section num="11" title="Contact Us">
            <p>If you have questions, concerns, or requests regarding this Privacy Policy, contact us at:</p>
            <div className="mt-3 p-4 rounded-xl" style={{ background: C.gray100, border: `1px solid ${C.border}` }}>
              <p className="font-semibold text-sm" style={{ color: C.gray700 }}>IziXport Technologies Ltd</p>
              <p className="text-sm mt-1" style={{ color: C.gray500 }}>hello@izixport.com</p>
              <p className="text-sm mt-1" style={{ color: C.gray500 }}>Victoria Island, Lagos, Nigeria</p>
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