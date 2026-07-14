// src/pages/deal/DealRoom.tsx
// UPDATED — Simplified checklist (pre-shipment photos + B/L + tracking only)
// UPDATED — LibreTranslate integration via translate.argosopentech.com
// All existing business logic, escrow, payment, dispute flow preserved

import { useEffect, useRef, useState, useCallback, type ReactNode, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from '@/lib/supabase/client';
import PlatformReviewPrompt from '@/components/PlatformReviewPrompt';
import { generateAIResponse } from '@/lib/ai/platformKnowledge';

interface Message {
  id: string;
  order_id: string;
  sender_id: string | null;
  sender_type: "buyer" | "exporter" | "ai" | "system";
  content: string;
  is_ai: boolean;
  is_blocked?: boolean;
  created_at: string;
  translatedContent?: string; // runtime only — not in DB
}

interface ChecklistItem {
  id: string;
  order_id: string;
  step_key: string;
  step_label: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  document_url: string | null;
  document_name: string | null;
  notes: string | null;
  requires_document: boolean;
  icon: string;
  created_at: string;
  reference_number?: string | null;
  carrier_name?: string | null;
  document_verified?: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
}

interface Order {
  id: string;
  buyer_id: string;
  exporter_id: string;
  listing_id: string;
  quantity: number;
  order_status: string;
  escrow_status: string;
  total_amount: number;
  shipping_amount: number;
  currency: string;
  payment_reference: string | null;
  payment_method: string | null;
  freight_company: string | null;
  freight_cost: number | null;
  freight_currency: string | null;
  freight_estimate_days: number | null;
  freight_quote_pdf_url: string | null;
  freight_approved_at: string | null;
  freight_approved_by: string | null;
  delivery_deadline: string | null;
  delivery_confirmed_at: string | null;
  dispute_raised: boolean;
  pandascrow_escrow_id: number | null;
  pandascrow_transaction_ref: string | null;
  escrow_fee_amount: number | null;
  platform_fee_amount: number | null;
  payment_confirmed_at: string | null;
  created_at: string;
  listing: {
    title: string;
    price_per_unit: number;
    unit: string;
    min_order_quantity: number;
    origin_state: string;
  };
  buyer: {
    full_name: string;
    company_name: string;
    country: string;
    email: string;
    verified: boolean;
    business_state: string;
  } | null;
  exporter: {
    full_name: string;
    company_name: string;
    email: string;
    verified: boolean;
    business_state?: string;
  } | null;
}

interface CurrentUser {
  id: string;
  role: "buyer" | "exporter" | "admin";
  full_name: string;
  email: string;
  violation_count: number;
  preferred_language?: string;
}

const PAYMENT_TRIGGERS = /\b(payment|pay now|review payment|open payment|proceed to payment|pay)\b/i;

const WAKE_PHRASE = /izixport\s*ai/i;

const AI_WELCOME = `Welcome to your IziXport Trade Room 👋

I am your AI Trade Facilitator. I keep the deal clear, private, and trackable from negotiation to delivery.

How this room works:
1. The exporter lists the product and agrees on freight privately.
2. The buyer only sees the shipping estimate, payment summary, and shipment checklist.
3. When the freight quote is ready, the payment button appears.
4. The buyer funds escrow.
5. The exporter completes the checklist and uploads proof.
6. The buyer confirms delivery, then escrow is released.

Important:
• Keep all trade communication inside this room
• No phone numbers, emails, or external links
• Shipping details stay hidden from the buyer
• The buyer sees only the checklist and the final estimate

Need help? Just say "IziXport AI" followed by your question, e.g.:
• "IziXport AI, how do I verify my account?"
• "IziXport AI, what are the fees?"
• "IziXport AI, explain the shipping process"

When you are ready, tap the payment button or type "payment" to continue.`;

// ─── SIMPLIFIED CHECKLIST ───────────────────────────────────────────────────
// Removed: commercial_invoice, packing_list, certificate_of_origin, phytosanitary_cert
// These are handled between exporter and freight forwarder — not IziXport's responsibility
// IziXport only needs proof the goods are real, packed, and moving
const DEFAULT_CHECKLIST = [
  {
    key: "pre_shipment_photos",
    label: "Pre-Shipment Photos",
    requires_document: true,
    icon: "📸",
    hint: "Upload photos of the packed goods, bags, and container before loading. Clear, well-lit photos build buyer trust.",
  },
  {
    key: "bill_of_lading",
    label: "Bill of Lading",
    requires_document: true,
    icon: "🚢",
    hint: "Upload the Bill of Lading issued by your shipping line. This is the official proof goods are loaded on the vessel.",
  },
  {
    key: "tracking_confirmed",
    label: "Tracking Number Confirmed",
    requires_document: false,
    icon: "📍",
    hint: "Enter the container or shipment tracking number so the buyer can independently verify progress.",
  },
];

// ─── LANGUAGE NAME MAP ───────────────────────────────────────────────────────
const LANG_NAMES: Record<string, string> = {
  zh: "Chinese", hi: "Hindi", ar: "Arabic", fr: "French",
  de: "German", pt: "Portuguese", tr: "Turkish", ja: "Japanese",
  ko: "Korean", es: "Spanish", ru: "Russian", it: "Italian",
  nl: "Dutch", vi: "Vietnamese", th: "Thai", en: "English",
};

// ─── TRANSLATION — via Supabase Edge Function ────────────────────────────────
// Calls our own backend function which proxies to LibreTranslate mirrors.
// Avoids CORS, domain death, and rate-limit issues.

const autoTranslate = async (
  text: string,
  viewerLang: string
): Promise<{ translated: string; detectedLang: string } | null> => {
  if (!text || text.length < 3 || viewerLang === "auto") return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text, targetLang: viewerLang }),
      }
    );

    if (!res.ok) {
      console.error("Translate function error:", res.status);
      return null;
    }

    const data = await res.json();
    if (data.translated && data.translated !== text) {
      if (data.detectedLang === viewerLang) return null;
      return { translated: data.translated, detectedLang: data.detectedLang };
    }
    return null;
  } catch (err) {
    console.error("Translation failed:", err);
    return null;
  }
};

const BUYER_ESCROW_FEE_RATE = 0.045;
const EXPORTER_PLATFORM_FEE_RATE = 0.03;

const DEAL_FLOW = [
  { key: "enquiring", label: "Negotiating" },
  { key: "freight_quoted", label: "Freight Quoted" },
  { key: "freight_approved", label: "Freight Approved" },
  { key: "escrow_funded", label: "Escrow Funded" },
  { key: "docs_in_progress", label: "Docs In Progress" },
  { key: "goods_shipped", label: "Goods Shipped" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
  { key: "disputed", label: "Disputed" },
];

const BLOCK_PATTERNS = [
  { pattern: /(\+?[\d\s\-\(\)]{10,})/g, reason: "a phone number" },
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, reason: "an email address" },
  { pattern: /(https?:\/\/|www\.)[^\s]+/g, reason: "an external link" },
  { pattern: /wa\.me/i, reason: "a WhatsApp link" },
  { pattern: /t\.me/i, reason: "a Telegram link" },
];

const CARRIER_TRACKING_URLS: Record<string, string> = {
  DHL: "https://www.dhl.com/global-en/home/tracking.html",
  Maersk: "https://www.maersk.com/tracking",
  MSC: "https://www.msc.com/track-a-shipment",
  "CMA CGM": "https://www.cma-cgm.com/ebusiness/tracking",
  GIG: "https://www.giglogistics.com/track",
};

const formatMoney = (value: number, currency = "USD") => {
  const safe = Number.isFinite(value) ? value : 0;
  return `${currency === "NGN" ? "₦" : "$"}${safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `Today ${formatTime(iso)}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${formatTime(iso)}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${formatTime(iso)}`;
};

const scanMessage = (text: string) => {
  for (const { pattern, reason } of BLOCK_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return { blocked: true, reason };
  }
  return { blocked: false, reason: "" };
};

const isSimpleGreeting = (text: string) => {
  const cleaned = text.trim().toLowerCase();
  return (
    cleaned.length > 0 &&
    cleaned.split(/\s+/).length <= 3 &&
    /^(hi|hello|hey|ok|okay|thanks|thank you|good|great|nice|cool|alright|yes|no)$/i.test(cleaned)
  );
};

const shouldAIRespond = (text: string) => {
  if (isSimpleGreeting(text)) return false;
  if (PAYMENT_TRIGGERS.test(text)) return true;
  if (WAKE_PHRASE.test(text)) return true; // ← NEW: respond to wake phrase
  if (text.includes("?")) return true;
  return /\b(price|terms|payment|discount|minimum|quantity|agree|ship|issue|problem|help|deal|escrow|quality|certificate|document|freight|quote|approve|checklist|track|delivery|verify|fee|cost|how|what|when|why|who|where|which|can|do|does|is|are|will|would|should|could|may|might|must|shall|need|want|have|has|had|did|was|were|been|being|be|am)\b/i.test(text);
};

const currentStage = (status: string) => {
  if (status === "disputed") return "disputed";
  if (status === "completed") return "completed";
  if (status === "delivered") return "delivered";
  if (status === "in_transit") return "in_transit";
  if (status === "goods_shipped") return "goods_shipped";
  if (status === "docs_in_progress") return "docs_in_progress";
  if (status === "escrow_funded") return "escrow_funded";
  if (status === "freight_approved") return "freight_approved";
  if (status === "freight_quoted") return "freight_quoted";
  return "enquiring";
};

function Spinner({ size = 16, color = "#D4A843" }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${color}33`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      flexShrink: 0,
    }} />
  );
}

function Avatar({ label, type, size = 32, verified }: {
  label: string; type: "buyer" | "exporter" | "ai"; size?: number; verified?: boolean;
}) {
  const bg =
    type === "ai" ? "linear-gradient(135deg,#D4A843,#B8890F)"
    : type === "exporter" ? "linear-gradient(145deg,#006B3F,#004D2E)"
    : "linear-gradient(145deg,#002E1A,#006B3F)";
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 800, fontSize: size * 0.38,
        fontFamily: "'Barlow Condensed',sans-serif",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "2px solid white",
      }}>
        {type === "ai" ? "✦" : (label?.[0] || "?").toUpperCase()}
      </div>
      {verified && (
        <div style={{
          position: "absolute", bottom: -1, right: -1,
          background: "#D4A843", borderRadius: "50%",
          width: size * 0.38, height: size * 0.38,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.18, color: "#fff", border: "1.5px solid white",
        }}>✓</div>
      )}
    </div>
  );
}

function BottomSheet({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: 520, margin: "0 auto",
        background: "#fff", borderRadius: "20px 20px 0 0",
        border: "1px solid #E5E7EB", maxHeight: "92dvh", overflowY: "auto",
        paddingBottom: "env(safe-area-inset-bottom,20px)",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 20px 14px", borderBottom: "1px solid #E5E7EB",
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <span style={{
            color: "#111827", fontWeight: 800, fontSize: 15,
            fontFamily: "'Barlow Condensed',sans-serif",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>{title}</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#6B7280", fontSize: 22, cursor: "pointer",
          }}>✕</button>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>{children}</div>
      </div>
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 8px" }}>
      <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
      <span style={{ color: "#9CA3AF", fontSize: 10, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
    </div>
  );
}

// ─── AUTO TRANSLATE LABEL ────────────────────────────────────────────────────
// Shows "Translated from Chinese" label with toggle to see original
function AutoTranslateLabel({ detectedLang, onShowOriginal }: {
  detectedLang: string; onShowOriginal: () => void;
}) {
  const langName = LANG_NAMES[detectedLang] || detectedLang;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
      <span style={{ fontSize: 10, color: "#9CA3AF" }}>
        🌐 Translated from {langName}
      </span>
      <button
        onClick={onShowOriginal}
        style={{
          background: "none", border: "none", color: "#D4A843",
          fontSize: 10, cursor: "pointer", padding: 0,
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
          letterSpacing: "0.03em",
        }}
      >
        Show original
      </button>
    </div>
  );
}

function AIMessage({ msg, showAvatar, viewerLang }: {
  msg: Message; showAvatar: boolean; viewerLang: string;
}) {
  const [translated, setTranslated] = useState("");
  const [detectedLang, setDetectedLang] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    // AI messages are always English — only translate if viewer isn't English
    if (viewerLang && viewerLang !== "en") {
      autoTranslate(msg.content, viewerLang).then((result) => {
        if (result) {
          setTranslated(result.translated);
          setDetectedLang(result.detectedLang);
        }
      });
    }
  }, [msg.content, viewerLang]);

  const displayContent = !showOriginal && translated ? translated : msg.content;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "3px 0" }}>
      {showAvatar ? <Avatar label="AI" type="ai" size={30} /> : <div style={{ width: 30 }} />}
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 3 }}>
        {showAvatar && (
          <span style={{
            color: "#D4A843", fontSize: 10, fontWeight: 700,
            fontFamily: "'Barlow Condensed',sans-serif",
            letterSpacing: "0.06em", textTransform: "uppercase", paddingLeft: 2,
          }}>IziXport AI · Trade Facilitator</span>
        )}
        <div style={{
          background: "#F3F4F6", border: "1px solid #E5E7EB",
          borderRadius: "18px 18px 18px 4px", padding: "10px 14px",
        }}>
          <div style={{ color: "#374151", fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {displayContent}
          </div>
          {translated && !showOriginal && (
            <AutoTranslateLabel
              detectedLang={detectedLang}
              onShowOriginal={() => setShowOriginal(true)}
            />
          )}
          {showOriginal && (
            <button onClick={() => setShowOriginal(false)} style={{ background: "none", border: "none", color: "#D4A843", fontSize: 10, cursor: "pointer", padding: 0, marginTop: 4 }}>
              Show translation
            </button>
          )}
        </div>
        <span style={{ color: "#9CA3AF", fontSize: 10, paddingLeft: 4 }}>{formatTime(msg.created_at)}</span>
      </div>
    </div>
  );
}

function UserMessage({ msg, isOwn, senderName, showAvatar, order, viewerLang }: {
  msg: Message; isOwn: boolean; senderName: string;
  showAvatar: boolean; order: Order; viewerLang: string;
}) {
  const [translated, setTranslated] = useState("");
  const [detectedLang, setDetectedLang] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    // Only auto-translate messages from the OTHER party, not your own
    if (isOwn) return;

    const run = async () => {
      setTranslating(true);
      const result = await autoTranslate(msg.content, viewerLang || "en");
      if (result) {
        setTranslated(result.translated);
        setDetectedLang(result.detectedLang);
      }
      setTranslating(false);
    };

    run();
  }, [msg.content, isOwn, viewerLang]);

  const displayContent = !showOriginal && translated ? translated : msg.content;

  // Own message — never translate, always show as typed
  if (isOwn) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "3px 0" }}>
        <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <div style={{
            background: msg.sender_type === "buyer"
              ? "linear-gradient(145deg,#002E1A,#006B3F)"
              : "linear-gradient(145deg,#006B3F,#004D2E)",
            borderRadius: "18px 18px 4px 18px",
            padding: "10px 14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          }}>
            <div style={{ color: "#fff", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {msg.content}
            </div>
          </div>
          <span style={{ color: "#9CA3AF", fontSize: 10, paddingRight: 4 }}>{formatTime(msg.created_at)}</span>
        </div>
      </div>
    );
  }

  // Incoming message from other party — show translation if detected
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "3px 0" }}>
      {showAvatar ? (
        <Avatar
          label={senderName}
          type={msg.sender_type as "buyer" | "exporter"}
          size={30}
          verified={msg.sender_type === "buyer" ? order.buyer?.verified : order.exporter?.verified}
        />
      ) : <div style={{ width: 30 }} />}
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 3 }}>
        {showAvatar && (
          <span style={{ color: "#6B7280", fontSize: 10.5, paddingLeft: 2 }}>{senderName}</span>
        )}
        <div style={{
          background: "#F3F4F6", border: "1px solid #E5E7EB",
          borderRadius: "18px 18px 18px 4px", padding: "10px 14px",
        }}>
          {translating ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ color: "#111827", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
              <Spinner size={10} color="#D4A843" />
            </div>
          ) : (
            <div style={{ color: "#111827", fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {displayContent}
            </div>
          )}
          {translated && !translating && !showOriginal && (
            <AutoTranslateLabel
              detectedLang={detectedLang}
              onShowOriginal={() => setShowOriginal(true)}
            />
          )}
          {showOriginal && (
            <button
              onClick={() => setShowOriginal(false)}
              style={{ background: "none", border: "none", color: "#D4A843", fontSize: 10, cursor: "pointer", padding: 0, marginTop: 4 }}
            >
              Show translation
            </button>
          )}
        </div>
        <span style={{ color: "#9CA3AF", fontSize: 10, paddingLeft: 4 }}>{formatTime(msg.created_at)}</span>
      </div>
    </div>
  );
}

function StatusPill({ label, color, bg, border }: {
  label: string; color: string; bg: string; border: string;
}) {
  return (
    <span style={{
      background: bg, color, border: `1px solid ${border}`,
      fontSize: 9, fontWeight: 800, padding: "2px 8px",
      borderRadius: 999, fontFamily: "'Barlow Condensed',sans-serif",
      letterSpacing: "0.05em",
    }}>{label}</span>
  );
}

function DealProgress({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const activeIndex = Math.max(0,
    DEAL_FLOW.findIndex((step) => step.key === currentStage(order.order_status))
  );

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 18, overflow: "hidden" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 14px", cursor: "pointer", background: "#F9FAFB",
        borderBottom: expanded ? "1px solid #E5E7EB" : "none",
      }} onClick={() => setExpanded((prev) => !prev)}>
        <div style={{
          fontWeight: 800, fontSize: 11,
          fontFamily: "'Barlow Condensed',sans-serif",
          letterSpacing: "0.08em", textTransform: "uppercase", color: "#374151",
        }}>Deal Progress</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#9CA3AF", fontSize: 10 }}>
            Step {activeIndex + 1}/{DEAL_FLOW.length}
          </span>
          <span style={{
            color: "#9CA3AF", fontSize: 10,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .25s",
          }}>▼</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "8px 14px 12px" }}>
          <div style={{ display: "grid", gap: 8 }}>
            {DEAL_FLOW.map((step, index) => {
              const completed = index < activeIndex;
              const active = index === activeIndex;
              return (
                <div key={step.key} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: completed ? "#006B3F" : active ? "#D4A843" : "transparent",
                    border: completed || active ? "none" : "1.5px solid #D1D5DB",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 10, fontWeight: 700,
                  }}>{completed ? "✓" : index + 1}</div>
                  <div style={{
                    color: completed ? "#059669" : active ? "#D4A843" : "#9CA3AF",
                    fontSize: 11.5, fontWeight: 700,
                    fontFamily: "'Barlow Condensed',sans-serif",
                    letterSpacing: "0.04em", textTransform: "uppercase",
                  }}>{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FREIGHT COMPONENTS (unchanged from original) ────────────────────────────
function FreightQuoteForm({ orderId, orderCurrency, onSubmitted }: {
  orderId: string; orderCurrency: string; onSubmitted: () => void;
}) {
  const [company, setCompany] = useState("");
  const [cost, setCost] = useState("");
  const [currency, setCurrency] = useState(orderCurrency || "USD");
  const [days, setDays] = useState("");
  const [notes, setNotes] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inputStyle: CSSProperties = {
    width: "100%", padding: "10px 12px", background: "#F9FAFB",
    border: "1px solid #D1D5DB", borderRadius: 10, color: "#111827",
    fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none",
    boxSizing: "border-box", marginBottom: 10,
  };

  const submit = async () => {
    if (!company.trim() || !cost.trim() || !days.trim()) {
      toast.error("Please fill the required freight fields.");
      return;
    }
    setSubmitting(true);
    try {
      let pdfUrl: string | null = null;
      if (pdfFile) {
        const uploadPath = `freight-quotes/${orderId}/${Date.now()}_${pdfFile.name}`;
        const { data, error } = await supabase.storage.from("listings").upload(uploadPath, pdfFile, {
          cacheControl: "3600", upsert: false,
        });
        if (error) throw error;
        pdfUrl = supabase.storage.from("listings").getPublicUrl(data.path).data.publicUrl;
      }
      const freightCost = Number(cost);
      const freightDays = Number(days);
      const { error } = await supabase.from("orders").update({
        order_status: "freight_quoted",
        freight_company: company.trim(),
        freight_cost: freightCost,
        freight_currency: currency,
        freight_estimate_days: freightDays,
        freight_quote_pdf_url: pdfUrl,
      }).eq("id", orderId);
      if (error) throw error;
      await supabase.from("messages").insert({
        order_id: orderId, sender_type: "system", is_ai: true,
        content: `🚚 Freight quote added by the exporter.\nCarrier: ${company.trim()}\nEstimate: ${formatMoney(freightCost, currency)}\nTransit: ${freightDays} day(s)\n\nThe buyer can now review the payment estimate.`,
      });
      toast.success("Freight quote submitted.");
      onSubmitted();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit freight quote.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 16, boxSizing: "border-box", width: "100%" }}>
      <div style={{ color: "#111827", fontWeight: 800, fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
        🚚 Private Freight Quote
      </div>
      <div style={{ color: "#6B7280", fontSize: 11, marginBottom: 12 }}>
        Only the exporter can edit this section. The buyer sees the estimate and checklist only.
      </div>
      <div style={{ color: "#6B7280", fontSize: 10.5, marginBottom: 4 }}>Freight Company</div>
      <input name="freight-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Maersk, DHL, local freight forwarder" style={inputStyle} />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}>
          <div style={{ color: "#6B7280", fontSize: 10.5, marginBottom: 4 }}>Freight Cost</div>
          <input name="freight-cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#6B7280", fontSize: 10.5, marginBottom: 4 }}>Currency</div>
          <select name="freight-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
            <option value="USD">USD</option>
            <option value="NGN">NGN</option>
          </select>
        </div>
      </div>
      <div style={{ color: "#6B7280", fontSize: 10.5, marginBottom: 4 }}>Estimated Transit (days)</div>
      <input name="freight-days" type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="e.g. 21" style={inputStyle} />
      <div style={{ color: "#6B7280", fontSize: 10.5, marginBottom: 4 }}>Notes (optional)</div>
      <textarea name="freight-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. FOB Lagos, sea freight, includes customs handling" style={{ ...inputStyle, resize: "none" }} />
      <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "1.5px dashed #D1D5DB", cursor: "pointer", marginBottom: 14, color: "#6B7280", fontSize: 12 }}>
        📎 {pdfFile ? pdfFile.name : "Attach freight quote PDF (optional)"}
        <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
      </label>
      <button onClick={submit} disabled={submitting} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#D4A843", border: "none", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {submitting ? <><Spinner size={14} color="#fff" />Submitting…</> : "Submit Freight Quote"}
      </button>
    </div>
  );
}

function FreightSummary({ order, isBuyer }: { order: Order; isBuyer: boolean }) {
  const hasFreight = Boolean(order.freight_company) && order.freight_cost !== null && order.freight_cost !== undefined;
  const currency = order.freight_currency || order.currency || "USD";
  const goodsAmount = Number(order.total_amount || 0);
  const freightCost = Number(order.freight_cost || 0);
  const escrowFee = (goodsAmount + freightCost) * BUYER_ESCROW_FEE_RATE;
  const grandTotal = goodsAmount + freightCost + escrowFee;

  return (
    <div style={{ background: "#fff", border: `1px solid ${hasFreight ? "#D4A843" : "#E5E7EB"}`, borderRadius: 16, padding: 16, boxSizing: "border-box", width: "100%", borderLeft: hasFreight ? "4px solid #D4A843" : undefined }}>
      <div style={{ color: hasFreight ? "#D4A843" : "#111827", fontWeight: 800, fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
        {hasFreight ? "Shipping Estimate" : "Shipping Estimate Pending"}
      </div>
      {hasFreight ? (
        <div style={{ display: "grid", gap: 10 }}>
          {[
            { label: "Carrier", value: order.freight_company },
            { label: "Freight Cost", value: formatMoney(freightCost, currency) },
            { label: "Transit Time", value: `${order.freight_estimate_days || 0} day(s)` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ color: "#6B7280", fontSize: 12 }}>{label}</span>
              <span style={{ color: "#111827", fontWeight: 700, fontSize: 13 }}>{value}</span>
            </div>
          ))}
          <div style={{ height: 1, background: "#E5E7EB" }} />
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 12, display: "grid", gap: 6 }}>
            {[
              { label: "Goods value", value: formatMoney(goodsAmount, order.currency || "USD") },
              { label: "Freight", value: formatMoney(freightCost, currency) },
              { label: "Platform fee (3%)", value: formatMoney(escrowFee, order.currency || "USD") },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280", fontSize: 12 }}>{label}</span>
                <span style={{ color: "#111827", fontWeight: 700, fontSize: 13 }}>{value}</span>
              </div>
            ))}
            <div style={{ height: 1, background: "#E5E7EB" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#111827", fontWeight: 800, fontSize: 13 }}>Buyer pays total (incl. escrow fee)</span>
              <span style={{ color: "#111827", fontWeight: 900, fontSize: 15 }}>{formatMoney(grandTotal, order.currency || "USD")}</span>
            </div>
          </div>
          {order.freight_quote_pdf_url && (
            <a href={order.freight_quote_pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: "#D4A843", fontSize: 12, textDecoration: "underline", display: "flex", alignItems: "center", gap: 4 }}>
              📄 View Quote Document →
            </a>
          )}
        </div>
      ) : (
        <div style={{ color: "#6B7280", fontSize: 12, lineHeight: 1.6 }}>
          The exporter has not submitted shipping details yet. Once they do, the payment estimate and payment button will appear here.
        </div>
      )}
    </div>
  );
}

function FreightApprovalCard({ order, orderId, currentUser }: {
  order: Order; orderId: string; currentUser: CurrentUser;
}) {
  const [approving, setApproving] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [changeText, setChangeText] = useState("");
  const [changeSending, setChangeSending] = useState(false);

  const goodsValue = Number(order.total_amount || 0);
  const freightCost = Number(order.freight_cost || 0);
  const escrowFee = (goodsValue + freightCost) * BUYER_ESCROW_FEE_RATE;
  const grandTotal = goodsValue + freightCost + escrowFee;
  const currency = order.currency || "USD";

  const handleApprove = async () => {
    setApproving(true);
    try {
      const { error } = await supabase.from("orders").update({
        order_status: "freight_approved",
        freight_approved_at: new Date().toISOString(),
        freight_approved_by: currentUser.id,
      }).eq("id", orderId);
      if (error) throw error;
      await supabase.from("messages").insert({
        order_id: orderId, sender_type: "system", is_ai: true,
        content: `✅ Buyer approved the freight quote.\nTotal: ${formatMoney(grandTotal, currency)}\nClick below to proceed to payment.`,
      });
      toast.success("Freight quote approved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve freight quote.");
    } finally {
      setApproving(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changeText.trim()) { toast.error("Please describe what needs to change."); return; }
    setChangeSending(true);
    try {
      await supabase.from("messages").insert({
        order_id: orderId, sender_id: currentUser.id, sender_type: "buyer", is_ai: false,
        content: `🔄 Freight Change Request:\n${changeText.trim()}`,
      });
      await supabase.from("orders").update({ order_status: "enquiring" }).eq("id", orderId);
      toast.success("Change request sent.");
      setShowChanges(false);
      setChangeText("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send change request.");
    } finally {
      setChangeSending(false);
    }
  };

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", borderLeft: "4px solid #D4A843", padding: 16, boxSizing: "border-box", width: "100%" }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#D4A843", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.05em", marginBottom: 12 }}>
          🚢 Freight Quote Pending Approval
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { label: "Carrier", value: order.freight_company || "—" },
            { label: "Cost", value: formatMoney(freightCost, order.freight_currency || currency) },
            { label: "Estimated", value: `${order.freight_estimate_days || "—"} days` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6B7280", fontSize: 12 }}>{label}</span>
              <span style={{ color: "#111827", fontWeight: 700, fontSize: 13 }}>{value}</span>
            </div>
          ))}
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 12, marginTop: 4, display: "grid", gap: 6 }}>
            {[
              { label: "Goods value", value: formatMoney(goodsValue, currency) },
              { label: "Freight estimate", value: formatMoney(freightCost, currency) },
              { label: "Escrow fee (4.5%)", value: formatMoney(escrowFee, currency) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280", fontSize: 12 }}>{label}</span>
                <span style={{ color: "#111827", fontWeight: 700, fontSize: 12 }}>{value}</span>
              </div>
            ))}
            <div style={{ height: 1, background: "#E5E7EB" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#D4A843", fontWeight: 800, fontSize: 13 }}>TOTAL</span>
              <span style={{ color: "#D4A843", fontWeight: 900, fontSize: 15 }}>{formatMoney(grandTotal, currency)}</span>
            </div>
          </div>
          <button onClick={handleApprove} disabled={approving} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#006B3F", border: "none", color: "#fff", fontWeight: 800, fontSize: 13.5, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
            {approving ? <Spinner size={14} color="#fff" /> : "Approve & Proceed to Pay ✓"}
          </button>
          <button onClick={() => setShowChanges(true)} style={{ width: "100%", padding: "11px", borderRadius: 12, background: "transparent", border: "1.5px solid #D1D5DB", color: "#6B7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Request Changes
          </button>
        </div>
      </div>
      <BottomSheet open={showChanges} onClose={() => setShowChanges(false)} title="Request Changes">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "#374151", fontSize: 13 }}>What needs to change with the freight quote?</div>
          <textarea value={changeText} onChange={(e) => setChangeText(e.target.value)} rows={4} placeholder="Describe what needs to change..." style={{ width: "100%", padding: "11px 12px", border: "1px solid #D1D5DB", borderRadius: 10, background: "#F9FAFB", resize: "none", fontSize: 13, fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }} />
          <button onClick={handleRequestChanges} disabled={changeSending} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#D4A843", border: "none", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {changeSending ? <Spinner size={14} color="#fff" /> : "Send Change Request"}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

// ─── SIMPLIFIED CHECKLIST PANEL ──────────────────────────────────────────────
function ChecklistPanel({ orderId, currentUser, isExporter, order, checklistRef }: {
  orderId: string; currentUser: CurrentUser; isExporter: boolean;
  order: Order; checklistRef?: React.RefObject<HTMLDivElement>;
}) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  const seedChecklist = async () => {
    if (!isExporter) return;

    // Check if existing items match the new simplified 3-step schema
    const { data: existing } = await supabase
      .from("deal_checklist")
      .select("step_key")
      .eq("order_id", orderId);

    const hasOldItems = existing?.some((item: any) => 
      !["pre_shipment_photos", "bill_of_lading", "tracking_confirmed"].includes(item.step_key)
    );

    // If old items exist (from previous 9-step version), delete and re-seed
    if (hasOldItems) {
      await supabase.from("deal_checklist").delete().eq("order_id", orderId);
    }

    // Only seed if empty or was just cleared
    const { data: check } = await supabase
      .from("deal_checklist")
      .select("id")
      .eq("order_id", orderId)
      .limit(1);

    if (check && check.length > 0) return;

    const items = DEFAULT_CHECKLIST.map((step) => ({
      order_id: orderId,
      step_key: step.key,
      step_label: step.label,
      completed: false,
      completed_at: null,
      completed_by: null,
      document_url: null,
      document_name: null,
      notes: null,
      requires_document: step.requires_document,
      icon: step.icon,
      reference_number: null,
      carrier_name: null,
      document_verified: false,
      verified_by: null,
      verified_at: null,
    }));
    const { error } = await supabase.from("deal_checklist").insert(items);
    if (error) console.error("Failed to seed checklist:", error);
  };

  const loadChecklist = async () => {
    const { data, error } = await supabase
      .from("deal_checklist")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setChecklist(data as ChecklistItem[]);
      if (data.length === 0 && isExporter && [
        "escrow_funded", "docs_in_progress", "goods_shipped", "in_transit", "arrived", "delivered", "completed"
      ].includes(order.order_status)) {
        await seedChecklist();
      }
    }
  };

  useEffect(() => {
    loadChecklist();
    const channel = supabase
      .channel(`deal-checklist-${orderId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "deal_checklist",
        filter: `order_id=eq.${orderId}`,
      }, () => loadChecklist())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const updateOrderStatusFromStep = async (stepKey: string) => {
    let nextStatus: string | null = null;
    if (stepKey === "bill_of_lading") nextStatus = "docs_in_progress";
    if (stepKey === "tracking_confirmed") nextStatus = "goods_shipped";
    if (!nextStatus) return;
    await supabase.from("orders").update({ order_status: nextStatus }).eq("id", orderId);
  };

  const markComplete = async (step: ChecklistItem) => {
    if (!isExporter) return;
    if (step.id.startsWith("preview-")) {
      toast.error("Checklist is not active yet. Wait for escrow to be funded.");
      return;
    }
    // Guard: already completed — don't duplicate messages or status updates
    if (step.completed) {
      toast.error("This step is already completed.");
      return;
    }

    // Bill of Lading requires document upload first
    if (step.step_key === "bill_of_lading" && !step.document_url) {
      toast.error("Upload the Bill of Lading document first.");
      return;
    }

    // Pre-shipment photos requires document upload first
    if (step.step_key === "pre_shipment_photos" && !step.document_url) {
      toast.error("Upload the pre-shipment photos first.");
      return;
    }

    // Tracking step requires number and carrier
    if (step.step_key === "tracking_confirmed") {
      if (!trackingNumber.trim()) { toast.error("Enter the tracking number."); return; }
      if (!carrier) { toast.error("Select the carrier."); return; }
    }

    try {
      const updatePayload: any = {
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: currentUser.id,
      };
      if (step.step_key === "tracking_confirmed") {
        updatePayload.reference_number = trackingNumber.trim();
        updatePayload.carrier_name = carrier;
      }

      const { error } = await supabase.from("deal_checklist").update(updatePayload).eq("id", step.id);
      if (error) throw error;

      const msgContent =
        step.step_key === "pre_shipment_photos"
          ? `📸 Pre-shipment photos uploaded and confirmed by the exporter. Goods are packed and ready for loading.`
          : step.step_key === "bill_of_lading"
          ? `🚢 Bill of Lading uploaded by the exporter. Goods are officially on a vessel.`
          : `📍 Tracking confirmed.\nTracking number: ${trackingNumber}\nCarrier: ${carrier}\n\nThe buyer can now independently track the shipment.`;

      await supabase.from("messages").insert({
        order_id: orderId, sender_type: "system", is_ai: true, content: msgContent,
      });

      await updateOrderStatusFromStep(step.step_key);
      toast.success("Checklist updated.");
      setTrackingNumber("");
      setCarrier("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update checklist.");
    }
  };

  const handleUpload = async (step: ChecklistItem) => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data, error } = await supabase.storage.from("listings").upload(
        `documents/${orderId}/${step.step_key}/${Date.now()}_${file.name}`,
        file, { cacheControl: "3600", upsert: false }
      );
      if (error) throw error;
      const url = supabase.storage.from("listings").getPublicUrl(data.path).data.publicUrl;
      const { error: updateErr } = await supabase.from("deal_checklist")
        .update({ document_url: url, document_name: file.name })
        .eq("id", step.id);
      if (updateErr) throw updateErr;
      toast.success("Document uploaded.");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const completedCount = checklist.filter((c) => c.completed).length;
  const percent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;
  const checklistEmpty = checklist.length === 0;

  const stagedChecklist = checklistEmpty
    ? DEFAULT_CHECKLIST.map((step) => ({
        id: `preview-${step.key}`, order_id: orderId, step_key: step.key,
        step_label: step.label, completed: false, completed_at: null,
        completed_by: null, document_url: null, document_name: null, notes: null,
        requires_document: step.requires_document, icon: step.icon,
        created_at: order.created_at, reference_number: null, carrier_name: null,
        document_verified: false, verified_by: null, verified_at: null,
      }))
    : checklist;

  return (
    <div ref={checklistRef} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 16, boxSizing: "border-box", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: 12 }}
        onClick={() => setExpanded((prev) => !prev)}>
        <span style={{ fontWeight: 800, fontSize: 14, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", color: "#D4A843" }}>
          📋 Shipment Checklist
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#9CA3AF", fontSize: 10 }}>
            {checklistEmpty ? "0" : `${completedCount} / ${checklist.length}`}
          </span>
          <span style={{ color: "#9CA3AF", fontSize: 10, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .25s" }}>▼</span>
        </div>
      </div>

      <div style={{ height: 4, background: "#E5E7EB", borderRadius: 2, marginBottom: 12 }}>
        <div style={{ height: "100%", width: `${checklistEmpty ? 0 : percent}%`, background: "linear-gradient(90deg, #D4A843, #B8890F)", borderRadius: 2, transition: "width .3s" }} />
      </div>

      {expanded && (
        <div>
          {!isExporter ? (
            <div style={{ color: "#6B7280", fontSize: 11, marginBottom: 10, fontStyle: "italic", lineHeight: 1.5 }}>
              Track the exporter's shipment evidence below. You can view uploaded photos and documents.
            </div>
          ) : (
            <div style={{ color: "#6B7280", fontSize: 11, marginBottom: 10, fontStyle: "italic", lineHeight: 1.5 }}>
              Upload evidence at each stage so the buyer can see the shipment is moving. All 3 steps required before escrow releases.
            </div>
          )}

          <div>
            {stagedChecklist.map((step, index) => {
              const isCompleted = step.completed;
              const isActive = !isCompleted && (
                checklistEmpty ? index === 0
                : checklist.findIndex((item) => item.id === step.id) === completedCount
              );
              const isTracking = step.step_key === "tracking_confirmed";
              const hint = DEFAULT_CHECKLIST.find(d => d.key === step.step_key)?.hint || "";

              return (
                <div key={step.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: isCompleted ? "#059669" : isActive ? "#D4A843" : "transparent",
                    border: isCompleted || isActive ? "none" : "1.5px solid #D1D5DB",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "#fff", flexShrink: 0, marginTop: 2,
                  }}>
                    {isCompleted ? "✅" : <span style={{ fontSize: 14 }}>{step.icon}</span>}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: isCompleted ? "#059669" : isActive ? "#D4A843" : "#9CA3AF", fontWeight: 700, fontSize: 12.5, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.03em" }}>
                      {step.step_label}
                    </div>

                    {/* Hint text for active step */}
                    {isActive && isExporter && hint && (
                      <div style={{ color: "#6B7280", fontSize: 11, marginTop: 2, lineHeight: 1.5, fontStyle: "italic" }}>
                        {hint}
                      </div>
                    )}

                    {isCompleted && step.completed_at && (
                      <div style={{ color: "#9CA3AF", fontSize: 10 }}>
                        Completed {formatTime(step.completed_at)}
                      </div>
                    )}

                    {/* Tracking info display */}
                    {isCompleted && isTracking && step.reference_number && (
                      <div style={{ marginTop: 4, fontSize: 11, color: "#374151" }}>
                        <div><strong>Tracking:</strong> {step.reference_number}</div>
                        {step.carrier_name && (
                          <div>
                            <strong>Carrier:</strong> {step.carrier_name}
                            {CARRIER_TRACKING_URLS[step.carrier_name] && (
                              <a href={CARRIER_TRACKING_URLS[step.carrier_name]} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: "#D4A843", textDecoration: "underline", fontSize: 10 }}>
                                Track →
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Document link */}
                    {step.document_url && (
                      isExporter ? (
                        <a href={step.document_url} target="_blank" rel="noopener noreferrer" style={{ color: "#D4A843", fontSize: 11, textDecoration: "underline", display: "block", marginTop: 2 }}>
                          View document →
                        </a>
                      ) : step.document_verified ? (
                        <a href={step.document_url} target="_blank" rel="noopener noreferrer" style={{ color: "#D4A843", fontSize: 11, textDecoration: "underline", display: "block", marginTop: 2 }}>
                          View document →
                        </a>
                      ) : (
                        <div style={{ color: "#D4A843", fontSize: 11, marginTop: 2 }}>
                          Awaiting admin verification
                        </div>
                      )
                    )}

                    {/* Active exporter controls */}
                    {isActive && isExporter && !checklistEmpty && (
                      <div style={{ marginTop: 8 }}>
                        {/* Tracking step inputs */}
                        {isTracking && (
                          <div style={{ display: "grid", gap: 8, marginBottom: 8 }}>
                            <input
                              name="tracking-number"
                              type="text"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="Enter tracking / container / B/L number"
                              style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12, background: "#F9FAFB" }}
                            />
                            <select
                              name="carrier"
                              value={carrier}
                              onChange={(e) => setCarrier(e.target.value)}
                              style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12, background: "#F9FAFB" }}
                            >
                              <option value="">Select carrier</option>
                              {Object.keys(CARRIER_TRACKING_URLS).map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {step.requires_document && (
                            <>
                              <button
                                onClick={() => fileRef.current?.click()}
                                style={{ background: "none", border: "1px solid #D4A843", borderRadius: 6, padding: "4px 10px", color: "#D4A843", fontSize: 11, cursor: "pointer" }}
                              >
                                Upload {step.step_key === "pre_shipment_photos" ? "Photos" : "Document"}
                              </button>
                              <input type="file" accept={step.step_key === "pre_shipment_photos" ? "image/*" : "image/*,application/pdf"} ref={fileRef} style={{ display: "none" }} onChange={() => handleUpload(step)} />
                            </>
                          )}
                          <button
                            onClick={() => markComplete(step)}
                            disabled={uploading}
                            style={{ background: "#D4A843", border: "none", borderRadius: 6, padding: "4px 12px", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                          >
                            Mark Complete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {checklistEmpty && (
              <div style={{ marginTop: 8, padding: 12, borderRadius: 12, border: "1px dashed #D1D5DB", color: "#6B7280", fontSize: 11, lineHeight: 1.5, textAlign: "center" }}>
                The checklist activates when escrow is funded. Preview: Photos → Bill of Lading → Tracking Number.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DELIVERY CONFIRM (unchanged from original) ──────────────────────────────
function DeliveryConfirmPanel({ order, orderId, currentUser, isBuyer, onShowPlatformReview }: {
  order: Order; orderId: string; currentUser: CurrentUser;
  isBuyer: boolean; onShowPlatformReview?: () => void;
}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (order.order_status === "completed" && isBuyer) {
      const check = async () => {
        const { data } = await supabase.from("exporter_reviews").select("id")
          .eq("order_id", orderId).eq("reviewer_id", currentUser.id).maybeSingle();
        if (!data) setShowRating(true);
      };
      check();
    }
  }, [order.order_status, isBuyer, orderId, currentUser.id]);

  const confirmDelivery = async () => {
    setSubmitting(true);
    try {
      const { data: releaseData, error: releaseError } = await supabase.functions.invoke(
        'pandascrow-escrow/release', { body: { orderId } }
      );
      if (releaseError) throw new Error(releaseError.message || "Escrow release failed.");
      const { error } = await supabase.from("orders").update({
        order_status: "completed", escrow_status: "released",
        delivery_confirmed_at: new Date().toISOString(),
      }).eq("id", orderId);
      if (error) throw error;
      const dealAmount = Number(order.total_amount || 0) + Number(order.freight_cost || 0);
      const total = dealAmount + dealAmount * 0.045;
      const exporterPayout = releaseData?.payout_amount || (dealAmount - dealAmount * 0.08);
      await supabase.from("messages").insert({
        order_id: orderId, sender_type: "system", is_ai: true,
        content: `🎉 Delivery confirmed! Escrow of ${formatMoney(total, order.currency || "USD")} has been released to exporter.\n\nExporter payout: ${formatMoney(exporterPayout, order.currency || "USD")}\nFunds will arrive in 1-3 business days.`,
      });
      toast.success(`Delivery confirmed! ${releaseData.message}`);
      setShowConfirm(false);
      setShowRating(true);
    } catch (err: any) {
      toast.error(err?.message || "Unable to confirm delivery.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRating = async () => {
    if (rating === 0) { toast.error("Please select a rating."); return; }
    setSubmittingRating(true);
    try {
      const { error } = await supabase.from("exporter_reviews").insert({
        order_id: orderId, reviewer_id: currentUser.id,
        reviewee_id: order.exporter_id, rating, review: null,
      });
      if (error) throw new Error(error.message);
      toast.success("Thank you for your review!");
      setShowRating(false);
      onShowPlatformReview?.();
    } catch (err: any) {
      toast.error("Save failed: " + (err?.message || "Unknown error"));
    } finally {
      setSubmittingRating(false);
    }
  };

  const submitDispute = async () => {
    if (!reason.trim()) { toast.error("Please choose a dispute reason."); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("orders").update({
        order_status: "disputed", escrow_status: "frozen", dispute_raised: true,
      }).eq("id", orderId);
      if (error) throw error;
      await supabase.from("messages").insert({
        order_id: orderId, sender_type: "system", is_ai: true,
        content: `⚠️ A dispute has been raised.\nReason: ${reason}\nEscrow is frozen until the case is reviewed.`,
      });
      toast.error("Dispute raised.");
      setShowDispute(false);
    } catch (err: any) {
      toast.error(err?.message || "Unable to submit dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isBuyer) {
    return (
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 16, textAlign: "center", boxSizing: "border-box", width: "100%" }}>
        <div style={{ color: "#6B7280", fontSize: 12, lineHeight: 1.6 }}>Delivery confirmation is only visible to the buyer.</div>
      </div>
    );
  }

  if (!["goods_shipped", "delivered", "completed"].includes(order.order_status)) return null;

  return (
    <>
      {order.order_status === "goods_shipped" && (
        <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #D4A843", padding: 16, boxSizing: "border-box", width: "100%" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#111827", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 12 }}>
            📦 Goods have been shipped by exporter
          </div>
          <div style={{ color: "#6B7280", fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
            Please inspect your shipment carefully before confirming.
          </div>
          <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
            ⚠️ <strong>Only click Confirm Delivery once you have physically received the goods.</strong>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <button onClick={() => setShowConfirm(true)} style={{ width: "100%", padding: "13px", borderRadius: 12, background: "#006B3F", border: "none", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", textTransform: "uppercase" }}>
              ✓ Confirm Delivery
            </button>
            <button onClick={() => setShowDispute(true)} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "transparent", border: "1.5px solid #FECACA", color: "#DC2626", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              ⚠️ Raise Dispute
            </button>
          </div>
        </div>
      )}

      <BottomSheet open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Delivery">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "#374151", fontSize: 13, lineHeight: 1.7 }}>
            Have you received the goods in good condition and correct quantity? This action is final and will release the escrow to the exporter.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowConfirm(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#F3F4F6", border: "none", color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={confirmDelivery} disabled={submitting} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#006B3F", border: "none", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {submitting ? <Spinner size={14} color="#fff" /> : "Yes, Confirm"}
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={showDispute} onClose={() => setShowDispute(false)} title="Raise Dispute">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "#374151", fontSize: 13, lineHeight: 1.7 }}>Tell us what went wrong. Escrow will be frozen until the issue is reviewed.</div>
          <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: "100%", padding: "11px 12px", border: "1px solid #D1D5DB", borderRadius: 10, background: "#F9FAFB", fontSize: 13 }}>
            <option value="">Select reason</option>
            <option value="Wrong goods received">Wrong goods received</option>
            <option value="Goods damaged">Goods damaged</option>
            <option value="Quality mismatch">Quality mismatch</option>
            <option value="Quantity incorrect">Quantity incorrect</option>
            <option value="Not delivered">Not delivered</option>
            <option value="Other">Other</option>
          </select>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Add more details (optional)" style={{ width: "100%", padding: "11px 12px", border: "1px solid #D1D5DB", borderRadius: 10, background: "#F9FAFB", resize: "none", fontSize: 13 }} />
          <button onClick={submitDispute} disabled={submitting} style={{ width: "100%", padding: "12px", borderRadius: 12, background: "#DC2626", border: "none", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {submitting ? <Spinner size={14} color="#fff" /> : "Submit Dispute"}
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={showRating} onClose={() => setShowRating(false)} title="Rate Your Experience">
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#374151", fontSize: 13, marginBottom: 12 }}>
              How was your experience with {order.exporter?.company_name || "the exporter"}?
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: "Best", value: 5, color: "#006B3F", bg: "#ECFDF5" },
                { label: "Good", value: 4, color: "#059669", bg: "#D1FAE5" },
                { label: "Medium", value: 3, color: "#D4A843", bg: "#FEF3C7" },
                { label: "Bad", value: 2, color: "#DC2626", bg: "#FEE2E2" },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setRating(opt.value)} style={{ padding: "12px 8px", borderRadius: 10, border: rating === opt.value ? `2px solid ${opt.color}` : "1.5px solid #E5E7EB", background: rating === opt.value ? opt.bg : "#fff", color: opt.color, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setShowRating(false); onShowPlatformReview?.(); }} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#F3F4F6", border: "none", color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Skip</button>
            <button onClick={submitRating} disabled={submittingRating} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#D4A843", border: "none", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {submittingRating ? <Spinner size={14} color="#fff" /> : "Submit Review"}
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

// LanguageSelector removed — translation is now fully automatic via detection

// ─── MAIN DEALROOM EXPORT ────────────────────────────────────────────────────
export default function DealRoom() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const checklistRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "actions">("messages");
  const [payLoading, setPayLoading] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showPlatformReview, setShowPlatformReview] = useState(false);
  const [showBuyerReview, setShowBuyerReview] = useState(false);
  const [buyerRating, setBuyerRating] = useState(0);
  const [submittingBuyerReview, setSubmittingBuyerReview] = useState(false);
  // viewerLang: the language this user reads — loaded from their profile
  // Used to determine what incoming messages should be translated into
  const [viewerLang, setViewerLang] = useState("en");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const refetchOrder = useCallback(async () => {
    if (!orderId) return;
    const { data } = await supabase.from("orders").select(
      `*,
      listing:listings(title,price_per_unit,unit,min_order_quantity,origin_state),
      buyer:users!orders_buyer_id_fkey(full_name,company_name,country,email,verified,business_state),
      exporter:users!orders_exporter_id_fkey(full_name,company_name,email,verified,business_state)`
    ).eq("id", orderId).single();
    if (data) setOrder(data as Order);
  }, [orderId]);

  const isBuyer = order && currentUser ? currentUser.id === order.buyer_id : false;
  const isExporter = order && currentUser ? currentUser.id === order.exporter_id : false;

  const goodsAmount = Number(order?.total_amount || 0);
  const freightAmount = Number(order?.freight_cost || 0);
  const dealAmount = goodsAmount + freightAmount;
  const buyerFee = dealAmount * BUYER_ESCROW_FEE_RATE;
  const grandTotal = Math.round((dealAmount + buyerFee) * 100) / 100;
  const exporterFee = dealAmount * EXPORTER_PLATFORM_FEE_RATE;
  const exporterPayout = dealAmount - exporterFee;
  const currency = order?.currency || order?.freight_currency || "USD";

  const initializePayment = async () => {
    if (!order || !currentUser) { toast.error("Order details missing."); return; }
    if (dealAmount <= 0) { toast.error("Total amount is invalid. Please check the freight quote."); return; }
    setPayLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const callbackUrl = `${window.location.origin}/deal/${orderId}?payment=success`;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pandascrow-escrow/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
          body: JSON.stringify({
            orderId: order.id, exporterId: order.exporter_id,
            goodsAmount, freightAmount, currency,
            buyer: { name: order.buyer?.company_name || order.buyer?.full_name || "Buyer", email: order.buyer?.email || currentUser.email, phone: "+0000000000" },
            seller: { name: order.exporter?.company_name || order.exporter?.full_name || "Exporter", email: order.exporter?.email || "", phone: "+0000000000" },
            callbackUrl,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create escrow");
      window.location.href = result.payment_url;
    } catch (err: any) {
      toast.error(err?.message || "Failed to initialize payment.");
      setPayLoading(false);
    }
  };

  const paymentReady = Boolean(order?.freight_company && order?.freight_cost !== null && order?.freight_cost !== undefined);

  const fetchMessages = async (dealId: string) => {
    const { data } = await supabase.from("messages").select("*").eq("order_id", dealId).order("created_at", { ascending: true });
    setMessages((data || []) as Message[]);
  };

  const seedWelcomeMessage = async (dealId: string) => {
    const { data } = await supabase.from("messages").select("id").eq("order_id", dealId).limit(1);
    if (!data || data.length === 0) {
      await supabase.from("messages").insert({ order_id: dealId, sender_type: "ai", is_ai: true, content: AI_WELCOME });
    }
  };

  useEffect(() => {
    if (order?.order_status === "completed" && currentUser?.role === "exporter") {
      const checkExisting = async () => {
        const { data } = await supabase.from("exporter_platform_reviews").select("id").eq("user_id", currentUser.id).maybeSingle();
        if (!data) setShowPlatformReview(true);
      };
      checkExisting();
    }
  }, [order, currentUser]);

  useEffect(() => {
    if ((order?.order_status === "goods_shipped" || order?.order_status === "delivered") && isBuyer) {
      setActiveTab("actions");
    }
  }, [order?.order_status, isBuyer]);

  useEffect(() => {
    if (order?.order_status === "completed" && isExporter && order?.buyer_id) {
      const checkBuyerReview = async () => {
        const { data } = await supabase.from("exporter_reviews").select("id").eq("order_id", order.id).eq("reviewer_id", currentUser?.id).maybeSingle();
        if (!data) setShowBuyerReview(true);
      };
      checkBuyerReview();
    }
  }, [order, isExporter, currentUser]);

  useEffect(() => {
    if (order?.order_status !== "escrow_funded" || !orderId) return;
    const ensurePaymentMessage = async () => {
      const { data: existing } = await supabase.from("messages").select("id").eq("order_id", orderId).eq("sender_type", "system").ilike("content", "%Payment secured%").limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from("messages").insert({
          order_id: orderId, sender_type: "system", is_ai: true,
          content: `🔒 Payment secured in PandasCrow escrow.\n\nExporter — your shipment checklist is now active. Upload photos, Bill of Lading, and tracking number to keep the buyer informed.\n\nBuyer — you will see live updates as the exporter completes each step.`,
        });
      }
    };
    ensurePaymentMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.order_status === "escrow_funded", orderId]);

  useEffect(() => {
    if (!orderId) return;
    let active = true;

    const init = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session) { navigate("/login"); return; }

        const { data: profile } = await supabase.from("users")
          .select("id,role,full_name,email,violation_count,preferred_language")
          .eq("id", session.user.id).single();

        if (!profile) { toast.error("Profile not found."); navigate("/login"); return; }

        const { data: orderData, error: orderErr } = await supabase.from("orders").select(
          `*,
          listing:listings(title,price_per_unit,unit,min_order_quantity,origin_state),
          buyer:users!orders_buyer_id_fkey(full_name,company_name,country,email,verified,business_state),
          exporter:users!orders_exporter_id_fkey(full_name,company_name,email,verified,business_state)`
        ).eq("id", orderId).single();

        if (orderErr || !orderData) { toast.error("Deal not found."); navigate("/dashboard"); return; }
        if (!active) return;

        const userObj: CurrentUser = {
          id: profile.id, role: profile.role,
          full_name: profile.full_name,
          email: session.user.email || profile.email,
          violation_count: profile.violation_count || 0,
          preferred_language: profile.preferred_language || "en",
        };

        setCurrentUser(userObj);
        // viewerLang: what THIS user reads — messages from others are translated INTO this
        setViewerLang(profile.preferred_language || "en");
        setOrder(orderData as Order);
        await seedWelcomeMessage(orderId);
        await fetchMessages(orderId);
      } catch (err) {
        toast.error("Unable to load deal room.");
      } finally {
        if (active) setLoading(false);
      }
    };

    init();

    const messagesChannel = supabase.channel(`deal-messages-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` }, () => fetchMessages(orderId))
      .subscribe();

    const orderChannel = supabase.channel(`deal-order-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => refetchOrder())
      .subscribe();

    return () => { active = false; supabase.removeChannel(messagesChannel); supabase.removeChannel(orderChannel); };
  }, [navigate, orderId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (activeTab === "messages") {
      const timer = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, scrollToBottom]);

  // Auto-confirm payment on return from PandasCrow
  useEffect(() => {
    const url = window.location.href;
    const hasPaymentSuccess = url.includes("payment=success") || url.includes("status=success");
    if (hasPaymentSuccess && orderId) {
      toast.loading("Confirming payment...");
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pandascrow-escrow/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      }).then((r) => r.json()).then((result) => {
        if (result.status) {
          toast.success("Payment confirmed!");
          window.history.replaceState({}, "", window.location.pathname);
          refetchOrder();
        } else {
          toast.error(result.error || "Failed to confirm payment");
        }
      }).catch(() => toast.error("Payment confirmation failed"));
    }
  }, [orderId, refetchOrder]);

  const aiReplyFor = (text: string, context: {
  isBuyer: boolean;
  isExporter: boolean;
  order?: Order;
  paymentReady?: boolean;
}) => {
  const lower = text.toLowerCase();

  // Wake phrase detected — use knowledge base for full response
  if (WAKE_PHRASE.test(text)) {
    // Strip wake phrase and get the actual question
    const question = text.replace(WAKE_PHRASE, "").trim().replace(/^[,\s]+/, "");
    if (question) {
      return generateAIResponse(question, {
        isBuyer: context.isBuyer,
        isExporter: context.isExporter,
        orderStatus: context.order?.order_status,
        paymentReady: context.paymentReady,
      });
    }
    // Just wake phrase with no question
    return "I'm here! Ask me anything about IziXport — deals, payments, shipping, verification, fees, or safety. How can I help?";
  }

  // Payment triggers
  if (PAYMENT_TRIGGERS.test(lower)) {
    if (context.order?.order_status === "freight_approved") {
      return "The payment button is now active in the Deal Actions tab. Tap it to review your full estimate — all secured by IziXport escrow.";
    }
    return "The payment button appears in Deal Actions once the exporter submits the freight quote and you approve it.";
  }

  // Freight/shipping
  if (/(freight|shipping|quote|carrier)/i.test(text) && context.isExporter) {
    return "Go to Deal Actions and fill in the freight quote form to enter your carrier, cost and estimated delivery time.";
  }

  // Photos/proof
  if (/(photo|picture|image|proof)/i.test(text)) {
    return "Upload pre-shipment photos in the checklist to show the buyer the goods are packed and ready.";
  }

  // Tracking/BOL
  if (/(track|tracking|lading|bill)/i.test(text)) {
    return "Upload the Bill of Lading, then enter the tracking number in the checklist so the buyer can independently verify the shipment.";
  }

  // Delivery/escrow release
  if (/(confirm|delivered|release escrow|release payment)/i.test(text)) {
    return "Once the buyer confirms delivery, escrow will be released automatically.";
  }

  // Fallback to knowledge base for any other question
  return generateAIResponse(text, {
    isBuyer: context.isBuyer,
    isExporter: context.isExporter,
    orderStatus: context.order?.order_status,
    paymentReady: context.paymentReady,
  });
};

  const handleSend = async () => {
    if (!currentUser || !order || !orderId || sending) return;
    const text = input.trim();
    if (!text) return;
    setInput("");
    setSending(true);

    const scan = scanMessage(text);
    if (scan.blocked) {
      toast.error(`Please do not send ${scan.reason} here.`);
      setSending(false);
      return;
    }

    try {
      const senderType = isBuyer ? "buyer" : "exporter";
      const { data: inserted, error } = await supabase.from("messages").insert({
        order_id: orderId, sender_id: currentUser.id, sender_type: senderType, content: text, is_ai: false,
      }).select().single();
      if (error) throw error;
      setMessages((prev) => [...prev, inserted as Message]);

      if (isBuyer && PAYMENT_TRIGGERS.test(text) && paymentReady) {
        await initializePayment();
      }

      if (shouldAIRespond(text)) {
        const reply = aiReplyFor(text, {
          isBuyer,
          isExporter,
          order,
          paymentReady,
        });
        setTimeout(async () => {
          await supabase.from("messages").insert({ order_id: orderId, sender_type: "ai", is_ai: true, content: reply });
        }, 700);
      }
    } catch (err) {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const showPaymentButton = Boolean(isBuyer && order && order.order_status === "freight_approved");

  const submitBuyerReview = async () => {
    if (buyerRating === 0) { toast.error("Please select a rating."); return; }
    setSubmittingBuyerReview(true);
    try {
      const { error } = await supabase.from("exporter_reviews").insert({
        order_id: order!.id, reviewer_id: currentUser!.id,
        reviewee_id: order!.buyer_id, rating: buyerRating, review: null,
      });
      if (error) throw new Error(error.message);
      toast.success("Thank you for your review!");
      setShowBuyerReview(false);
    } catch (err: any) {
      toast.error("Save failed: " + (err?.message || "Unknown error"));
    } finally {
      setSubmittingBuyerReview(false);
    }
  };

  if (loading || !order || !currentUser) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F9FAFB" }}>
        <Spinner size={32} color="#006B3F" />
      </div>
    );
  }

  const statusMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
    enquiring: { label: "Negotiating", color: "#D4A843", bg: "#FEF3C7", border: "#FDE68A" },
    freight_quoted: { label: "Freight Quoted", color: "#C8991A", bg: "rgba(200,153,26,0.1)", border: "#C8991A" },
    freight_approved: { label: "Freight Approved", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
    escrow_funded: { label: "Escrow Funded", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
    docs_in_progress: { label: "Docs In Progress", color: "#D4A843", bg: "#FEF3C7", border: "#FDE68A" },
    goods_shipped: { label: "Goods Shipped", color: "#006B3F", bg: "rgba(0,107,63,0.08)", border: "#006B3F" },
    in_transit: { label: "In Transit", color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD" },
    arrived: { label: "Arrived", color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD" },
    delivered: { label: "Delivered", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
    completed: { label: "Completed", color: "#059669", bg: "#D1FAE5", border: "#A7F3D0" },
    disputed: { label: "Disputed", color: "#DC2626", bg: "#FEE2E2", border: "#FECACA" },
  };

  const headerStatus = statusMap[order.order_status] || statusMap.enquiring;

  const viewMessages = messages.length ? messages : [{
    id: "welcome-message", order_id: order.id, sender_id: null,
    sender_type: "ai" as const, content: AI_WELCOME, is_ai: true,
    created_at: new Date().toISOString(),
  }];

  const renderItems: Array<
    | { kind: "date"; label: string; key: string }
    | { kind: "msg"; msg: Message; key: string; showAvatar: boolean }
  > = [];
  let lastDate = "";
  viewMessages.forEach((msg, index) => {
    const day = new Date(msg.created_at).toDateString();
    if (day !== lastDate) {
      renderItems.push({ kind: "date", label: formatDateLabel(msg.created_at), key: `date-${index}` });
      lastDate = day;
    }
    const prev = viewMessages[index - 1];
    const showAvatar = !prev || prev.sender_type !== msg.sender_type ||
      new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 120000;
    renderItems.push({ kind: "msg", msg, key: msg.id, showAvatar });
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Barlow', sans-serif; background: #F8F6F1; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,.12); border-radius: 2px; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", maxWidth: 560, margin: "0 auto", background: "#F9FAFB", overflow: "hidden" }}>
        {order.order_status === "disputed" && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", padding: "10px 14px", color: "#DC2626", fontSize: 12 }}>
            ⚠️ Dispute in progress. Escrow is frozen.
          </div>
        )}

        {/* Header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", gap: 10 }}>
            <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>←</button>
            <div style={{ background: "#F3F4F6", borderRadius: 12, padding: "8px 10px", flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 12.5, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {order.listing.title}
              </div>
              <div style={{ fontSize: 10, color: "#6B7280" }}>
                {order.quantity} {order.listing.unit} · <span style={{ color: "#D4A843", fontWeight: 700 }}>{formatMoney(Number(order.total_amount || 0), order.currency || "USD")}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <div style={{ display: "flex" }}>
                <Avatar label={order.exporter?.company_name || "E"} type="exporter" size={28} verified={order.exporter?.verified} />
                <Avatar label="AI" type="ai" size={28} />
                <Avatar label={order.buyer?.company_name || "B"} type="buyer" size={28} verified={order.buyer?.verified} />
              </div>
              <StatusPill {...headerStatus} />
            </div>
          </div>

          <div style={{ display: "flex", borderTop: "1px solid #E5E7EB" }}>
            {(["messages", "actions"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "12px", background: activeTab === tab ? "#fff" : "#F9FAFB", border: "none", borderBottom: activeTab === tab ? "2px solid #D4A843" : "2px solid transparent", color: activeTab === tab ? "#D4A843" : "#6B7280", fontWeight: 800, fontSize: 12, fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}>
                {tab === "messages" ? "💬 Chat Messages" : "📋 Deal Actions"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "messages" ? (
          <>
            {(order.order_status === "goods_shipped" || order.order_status === "delivered") && isBuyer && (
              <div style={{ padding: "10px 14px 0", flexShrink: 0 }}>
                <div style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setActiveTab("actions")}>
                  <span style={{ fontSize: 20 }}>📦</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#D4A843", fontFamily: "'Barlow Condensed',sans-serif" }}>GOODS HAVE BEEN SHIPPED</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Tap here to go to Deal Actions and confirm delivery →</div>
                  </div>
                  <span style={{ color: "#D4A843", fontSize: 14 }}>→</span>
                </div>
              </div>
            )}

            <div style={{ padding: "10px 14px 0", flexShrink: 0 }}>
              <DealProgress order={order} />
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px 6px" }}>
              {renderItems.map((item) => {
                if (item.kind === "date") return <DateDivider key={item.key} label={item.label} />;
                const msg = item.msg;
                if (msg.is_blocked) {
                  return (
                    <div key={item.key} style={{ display: "flex", justifyContent: "flex-end", margin: "3px 0" }}>
                      <div style={{ maxWidth: "78%", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "18px 18px 4px 18px", padding: "10px 14px" }}>
                        <div style={{ color: "#DC2626", fontWeight: 800, fontSize: 11, marginBottom: 4 }}>Blocked</div>
                        <div style={{ color: "#DC2626", fontSize: 12.5, lineHeight: 1.5 }}>This message was blocked for safety.</div>
                      </div>
                    </div>
                  );
                }
                if (msg.is_ai || msg.sender_type === "system") {
                  return <AIMessage key={item.key} msg={msg} showAvatar={item.showAvatar} viewerLang={viewerLang} />;
                }
                const own = msg.sender_type === (isBuyer ? "buyer" : "exporter");
                return (
                  <UserMessage
                    key={item.key} msg={msg} isOwn={own}
                    senderName={msg.sender_type === "buyer" ? order.buyer?.company_name || "Buyer" : order.exporter?.company_name || "Exporter"}
                    showAvatar={item.showAvatar} order={order}
                    viewerLang={viewerLang}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {order.order_status !== "completed" && order.order_status !== "disputed" && !(order.order_status === "delivered" && isBuyer) && (
              <div style={{ flexShrink: 0, borderTop: "1px solid #E5E7EB", background: "#fff", padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={1}
                    placeholder="Type a message…"
                    style={{ flex: 1, minHeight: 44, maxHeight: 120, padding: "11px 12px", borderRadius: 14, border: "1px solid #D1D5DB", background: "#F9FAFB", resize: "none", outline: "none", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    style={{ height: 44, padding: "0 16px", borderRadius: 14, border: "none", background: "#D4A843", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {sending ? <Spinner size={14} color="#fff" /> : "Send"}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ flex: 1, height: "calc(100dvh - 160px)", overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "14px", display: "grid", gap: 12, paddingBottom: "max(40px, env(safe-area-inset-bottom, 24px))" }}>
            {isExporter && (!order.freight_company || order.order_status === "enquiring") && (
              <FreightQuoteForm orderId={order.id} orderCurrency={currency} onSubmitted={() => refetchOrder()} />
            )}

            {order.order_status === "freight_quoted" && isBuyer && (
              <FreightApprovalCard order={order} orderId={order.id} currentUser={currentUser} />
            )}

            {["freight_approved","escrow_funded","docs_in_progress","goods_shipped","in_transit","arrived","delivered"].includes(order.order_status) && (
              <FreightSummary order={order} isBuyer={Boolean(isBuyer)} />
            )}

            {showPaymentButton && (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 16, boxSizing: "border-box", width: "100%" }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#111827", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 12 }}>💳 Secure Escrow Payment</div>
                <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
                  {[
                    { label: "Goods value", value: formatMoney(goodsAmount, currency) },
                    { label: "Freight", value: formatMoney(freightAmount, currency) },
                    { label: "Platform fee (3%)", value: formatMoney(buyerFee, currency) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6B7280", fontSize: 12 }}>{label}</span>
                      <span style={{ color: "#111827", fontWeight: 700, fontSize: 13 }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: "#E5E7EB" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#111827", fontWeight: 800, fontSize: 13 }}>YOU PAY</span>
                    <span style={{ color: "#111827", fontWeight: 900, fontSize: 16 }}>{formatMoney(grandTotal, currency)}</span>
                  </div>
                </div>
                <button onClick={initializePayment} disabled={payLoading} style={{ width: "100%", padding: "13px 14px", borderRadius: 999, background: payLoading ? "#4B8C6A" : "#006B3F", border: "none", color: "#fff", fontWeight: 800, fontSize: 14, cursor: payLoading ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                  {payLoading ? <><Spinner size={14} color="#fff" />Loading payment…</> : `🔒 Pay Now → ${formatMoney(grandTotal, currency)}`}
                </button>
                <div style={{ color: "#9CA3AF", fontSize: 11, textAlign: "center", lineHeight: 1.4 }}>Funds held in escrow until you confirm delivery</div>
              </div>
            )}

            {["escrow_funded","docs_in_progress","goods_shipped","in_transit","arrived","delivered","completed"].includes(order.order_status) && (
              <>
                {isExporter && (
                  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: 16, boxSizing: "border-box", width: "100%" }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#111827", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 12 }}>💰 Your Estimated Payout</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {[
                        { label: "Goods value", value: formatMoney(goodsAmount, currency), neg: false },
                        { label: "Freight included", value: formatMoney(freightAmount, currency), neg: false },
                        { label: "Platform fee (3%)", value: `-${formatMoney(exporterFee, currency)}`, neg: true },
                      ].map(({ label, value, neg }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#6B7280", fontSize: 12 }}>{label}</span>
                          <span style={{ color: neg ? "#DC2626" : "#111827", fontWeight: 700, fontSize: 13 }}>{value}</span>
                        </div>
                      ))}
                      <div style={{ height: 1, background: "#E5E7EB", margin: "4px 0" }} />
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#006B3F", fontWeight: 800, fontSize: 14 }}>YOU RECEIVE</span>
                        <span style={{ color: "#006B3F", fontWeight: 900, fontSize: 16 }}>{formatMoney(exporterPayout, currency)}</span>
                      </div>
                    </div>
                    <div style={{ color: "#9CA3AF", fontSize: 11, marginTop: 8, lineHeight: 1.4 }}>Released to your Nigerian bank account when buyer confirms delivery</div>
                  </div>
                )}

                {isExporter && (
                  <div style={{ background: "#FEF3C7", borderRadius: 16, border: "1px solid #FDE68A", padding: 16, boxSizing: "border-box", width: "100%", textAlign: "center" }}>
                    <div style={{ fontSize: 18, marginBottom: 8 }}>🔒</div>
                    <div style={{ fontWeight: 900, fontSize: 15, color: "#D4A843", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 8 }}>
                      Payment confirmed! Your checklist is now active.
                    </div>
                    <div style={{ color: "#374151", fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
                      Upload photos, Bill of Lading, and tracking number to release payment.
                    </div>
                    <button onClick={() => setShowChecklist(!showChecklist)} style={{ padding: "10px 18px", borderRadius: 999, background: "#D4A843", border: "none", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", textTransform: "uppercase" }}>
                      {showChecklist ? "Hide Checklist" : "View Checklist →"}
                    </button>
                  </div>
                )}

                {isBuyer && (
                  <div style={{ background: "#ECFDF5", borderRadius: 16, border: "1px solid #A7F3D0", padding: 16, boxSizing: "border-box", width: "100%", textAlign: "center" }}>
                    <div style={{ fontSize: 18, marginBottom: 8 }}>✅</div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#059669", fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 8 }}>
                      {formatMoney(grandTotal, currency)} secured in escrow
                    </div>
                    <div style={{ color: "#374151", fontSize: 13, lineHeight: 1.5 }}>
                      Track the exporter's shipment evidence below. You will be notified at each milestone.
                    </div>
                  </div>
                )}

                {(isExporter && showChecklist) || isBuyer ? (
                  <ChecklistPanel orderId={order.id} currentUser={currentUser} isExporter={Boolean(isExporter)} order={order} checklistRef={checklistRef} />
                ) : null}

                <DeliveryConfirmPanel order={order} orderId={order.id} currentUser={currentUser} isBuyer={Boolean(isBuyer)} onShowPlatformReview={() => setShowPlatformReview(true)} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Buyer review modal */}
      {showBuyerReview && (
        <BottomSheet open onClose={() => setShowBuyerReview(false)} title="Rate Buyer">
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#374151", fontSize: 13, marginBottom: 12 }}>
                How was your experience with {order.buyer?.company_name || "the buyer"}?
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Best", value: 5, color: "#006B3F", bg: "#ECFDF5" },
                  { label: "Good", value: 4, color: "#059669", bg: "#D1FAE5" },
                  { label: "Medium", value: 3, color: "#D4A843", bg: "#FEF3C7" },
                  { label: "Bad", value: 2, color: "#DC2626", bg: "#FEE2E2" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setBuyerRating(opt.value)} style={{ padding: "12px 8px", borderRadius: 10, border: buyerRating === opt.value ? `2px solid ${opt.color}` : "1.5px solid #E5E7EB", background: buyerRating === opt.value ? opt.bg : "#fff", color: opt.color, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Barlow Condensed',sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowBuyerReview(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#F3F4F6", border: "none", color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Skip</button>
              <button onClick={submitBuyerReview} disabled={submittingBuyerReview} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#D4A843", border: "none", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {submittingBuyerReview ? <Spinner size={14} color="#fff" /> : "Submit Review"}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {showPlatformReview && currentUser.role !== "admin" && (
        <PlatformReviewPrompt
          userId={currentUser.id}
          userRole={currentUser.role as "buyer" | "exporter"}
          onClose={() => {
            setShowPlatformReview(false);
            if (currentUser?.role === "buyer") navigate("/");
          }}
        />
      )}
    </>
  );
}