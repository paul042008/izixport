// src/lib/ai/platformKnowledge.ts
// IziXport platform knowledge base for AI responses
// COMPREHENSIVE VERSION — covers platform, trade, logistics, compliance, and conversation

export const PLATFORM_KNOWLEDGE = {
    overview: {
      name: "IziXport",
      tagline: "Nigerian Trade, Exported Easy",
      description: "Africa's first verified B2B trade marketplace connecting Nigerian exporters with global buyers through secure escrow payments, real-time tracking, and end-to-end trade support.",
      founded: "2026",
      headquarters: "Victoria Island, Lagos, Nigeria",
      website: "izixport.com",
      mission: "To make Nigerian agro-commodity exports transparent, safe, and accessible to verified global buyers.",
      vision: "Become Africa's most trusted B2B export platform by 2030."
    },
  
    process: {
      exporter: [
        "Sign up & verify — Submit business documents (CAC, NIN, NEPC) for free. Get verified badge within 48 hours.",
        "List your products — Add commodities, pricing, and specifications. Go live to global buyers in minutes.",
        "Connect & negotiate — Buyers send enquiries. Chat privately, agree on terms, and confirm freight quote.",
        "Ship & get paid — Payment held in escrow. You ship. Funds release upon confirmed delivery."
      ],
      buyer: [
        "Browse verified suppliers — Search products and review exporter certifications, ratings, and trade history.",
        "Enquire & negotiate — Chat with exporters, request samples, and agree on the best terms.",
        "Pay into escrow — Your funds are held securely until you physically confirm receipt of goods.",
        "Receive & confirm — Track shipment in real-time. Release payment only after inspection."
      ],
      fullCycle: "Enquiry → Freight Quote → Approval → Escrow Payment → Shipment Checklist → Delivery Confirmation → Escrow Release → Reviews"
    },
  
    products: {
      list: ["Cashew Nuts", "Cocoa Beans", "Sesame Seeds", "Shea Butter", "Hibiscus", "Ginger", "Palm Oil", "Chili Pepper"],
      cashew: "Nigeria is one of the world's top cashew producers. Grades: W180, W210, W240, W320, LP, SP. Common specs: moisture 8-10%, out-turn 48-52 lbs, nut count 170-200/kg.",
      cocoa: "Nigerian cocoa is known for its fine flavor profile. Available as fermented/dried beans. Specs: moisture max 7.5%, bean count 95-105/100g, mould max 3%, slate max 3%.",
      sesame: "Nigerian sesame (white, brown, mixed) is high-oil content. Specs: purity 99.95%, oil content 48-52%, moisture max 6%, FFA max 2%.",
      shea: "Wild-harvested shea butter from Northern Nigeria. Available raw/unrefined or refined. Specs: moisture max 0.5%, FFA max 6%, iodine value 55-65.",
      hibiscus: "Nigerian hibiscus (Hibiscus sabdariffa) is prized for tea and natural dyes. Specs: flower size, moisture max 12%, ash max 10%, foreign matter max 2%.",
      ginger: "Nigerian ginger is highly aromatic and oleoresin-rich. Available dried splits, powder, or fresh. Specs: moisture max 10%, ash max 7%, volatile oil min 1.5%.",
      palmOil: "Nigerian palm oil — crude or refined. Specs: FFA max 5% (crude), moisture max 0.1% (refined), color 3.5R max.",
      chili: "Nigerian chili pepper (scotch bonnet, bird's eye, cayenne). Available dried, crushed, or powder. Specs: moisture max 10%, capsaicin content varies by variety."
    },
  
    verification: {
      exporters: "Verified via NIN + CAC + NEPC. Free verification, 48-hour turnaround.",
      buyers: "Verified via SumSub (Sum and Substance). Free tier: 300 API calls/month. Handles KYC/KYB (passport, business license).",
      badge: "Verified badge appears on profile. Buyers see verification status in deal rooms.",
      whyVerify: "Verification prevents fraud, builds trust, and is required to use escrow. Unverified users cannot start deals or receive payments.",
      documents: {
        exporter: ["CAC Certificate of Incorporation", "National Identity Number (NIN)", "NEPC Registration Certificate", "Bank Verification Number (BVN)", "Valid ID (passport or driver's license)"],
        buyer: ["International passport or national ID", "Business registration / incorporation docs", "Proof of address (utility bill or bank statement)"]
      }
    },
  
    escrow: {
      partner: "PandasCrow",
      buyerFee: "4.5% for first $250K, 4.0% for $250K-$1M, 3.5% above $1M",
      exporterFee: "3% platform fee on exporter side",
      howItWorks: "Buyer pays into escrow → Exporter ships → Buyer confirms delivery → Escrow releases to exporter",
      protection: "Funds held securely until buyer physically confirms receipt. Dispute mediation available.",
      payout: "Released to exporter's Nigerian bank account within 1-3 business days after confirmation",
      whyEscrow: "Both parties are protected. Buyer knows goods must arrive before payment releases. Exporter knows payment is secured before shipping.",
      holdPeriod: "No maximum hold period. Funds stay in escrow until delivery is confirmed or a dispute is resolved.",
      partialRelease: "Not currently supported. Full escrow releases only upon delivery confirmation or dispute resolution.",
      chargebacks: "Not applicable. Escrow is not a card payment — funds are held by PandasCrow, not deducted from buyer's card after delivery."
    },
  
    shipping: {
      process: "Exporter arranges freight, uploads quote privately. Buyer only sees estimate and final total.",
      documents: "Bill of Lading, Pre-shipment Photos, Tracking Number required for checklist completion.",
      tracking: "Real-time tracking via carrier (DHL, Maersk, MSC, CMA CGM, GIG, etc.)",
      hiddenFromBuyer: "Freight company name, actual freight cost, and exporter's logistics details are private until quote approval.",
      incoterms: "Most deals use FOB (Free On Board) Lagos or CIF (Cost Insurance Freight) depending on agreement. Clarify with your exporter before approving.",
      insurance: "Cargo insurance is recommended but not mandatory. Exporter can arrange or buyer can request it. Not included in standard freight quote unless specified.",
      packaging: "Exporters must use export-standard packaging: jute bags, PP woven bags, or food-grade containers. Pre-shipment photos verify packaging quality.",
      containerTypes: "20ft (approx. 18-20 MT) and 40ft (approx. 26-28 MT) containers for sea freight. Air freight available for samples and small orders.",
      customs: "Exporter handles Nigerian customs (NCS) export clearance. Buyer handles import customs in destination country. IziXport provides guidance on required docs.",
      labTesting: "SGS, Bureau Veritas, or Intertek pre-shipment inspection can be arranged. Buyer pays if requested; exporter pays if required by destination country.",
      shippingModes: "Sea freight (most common, cheapest for bulk), Air freight (fast, expensive), Road freight (for regional Africa)."
    },
  
    checklist: {
      steps: [
        { name: "Pre-Shipment Photos", icon: "📸", required: true, description: "Photos of packed goods, bags, and container before loading" },
        { name: "Bill of Lading", icon: "🚢", required: true, description: "Official proof goods are loaded on vessel" },
        { name: "Tracking Number Confirmed", icon: "📍", required: false, description: "Container or shipment tracking number for buyer verification" }
      ],
      trigger: "Activates when escrow is funded. All 3 steps must complete before delivery confirmation.",
      whyThreeSteps: "These three proofs protect both parties: photos prove goods exist and are packed correctly, B/L proves goods are on the vessel, tracking proves the shipment is moving.",
      buyerCanSee: "Buyers can view uploaded photos and documents once admin verifies them. Tracking info is visible immediately.",
      adminVerification: "Uploaded documents are flagged for admin review to prevent fake or reused documents. This usually takes a few hours."
    },
  
    payments: {
      methods: "Escrow via PandasCrow (secure, held until delivery confirmation)",
      currencies: "USD, NGN",
      whenBuyerPays: "After freight quote is approved",
      whenExporterGetsPaid: "After buyer confirms delivery",
      refundPolicy: "If dispute is resolved in buyer's favor, escrow is refunded minus fees",
      paymentSteps: "1) Buyer clicks Pay Now, 2) Redirected to PandasCrow secure checkout, 3) Buyer completes payment, 4) Status changes to 'Escrow Funded', 5) Exporter begins checklist.",
      failedPayment: "If payment fails, the buyer can retry. The deal status stays at 'Freight Approved' until successful payment.",
      paymentReceipt: "Buyer receives a payment confirmation email from PandasCrow. The deal room also shows 'Escrow Funded' status."
    },
  
    disputes: {
      process: "Buyer raises dispute → Escrow frozen → Lagos-based trade team mediates → Resolution within 7-14 days",
      reasons: ["Wrong goods received", "Goods damaged", "Quality mismatch", "Quantity incorrect", "Not delivered", "Other"],
      team: "Lagos-based trade team for mediation",
      evidence: "Chat history, checklist uploads, tracking records, and photos are all used as evidence. This is why keeping communication in the deal room is critical.",
      outcomes: "If buyer wins: full or partial refund from escrow. If exporter wins: escrow releases to exporter. If split: partial refund, partial release.",
      prevention: "Most disputes are prevented by: requesting samples, verifying exporter badge, reviewing pre-shipment photos, and using the checklist.",
      arbitration: "If mediation fails, either party can escalate to formal arbitration under Nigerian law. IziXport facilitates but does not act as judge."
    },
  
    support: {
      email: "hello@izixport.com",
      location: "Victoria Island, Lagos, Nigeria",
      responseTime: "24-48 hours",
      disputeTeam: "Lagos-based trade team for mediation",
      hours: "Monday–Friday, 9:00 AM – 6:00 PM WAT (GMT+1). Weekend support for urgent disputes only.",
      whatsapp: "Not available. All support goes through hello@izixport.com or the deal room AI.",
      escalation: "If your issue is unresolved after 48 hours, reply to your support ticket with 'ESCALATE' and a senior team member will take over."
    },
  
    features: {
      sampleRequests: "Request product samples, lab certificates, and pre-shipment inspection reports before committing to bulk orders",
      paperworkSupport: "Guidance through NEPC registration, NXP processing, and customs documentation",
      disputeMediation: "Lagos-based team mediates any issues",
      globalLogistics: "Connected to freight forwarders and shipping lines across Europe, Asia, and Americas",
      realTimeTracking: "Track shipment progress in deal room",
      autoTranslation: "Messages auto-translated between buyer and exporter in their preferred languages",
      ratings: "Both buyers and exporters rate each other after deal completion. Ratings affect profile visibility and trust scores.",
      analytics: "Exporters get dashboard analytics: views, enquiries, conversion rates, and buyer geography.",
      notifications: "Email and in-app notifications for every deal milestone: quote submitted, payment received, checklist update, delivery."
    },
  
    roles: {
      exporter: "Nigerian businesses exporting agro-commodities. Must be CAC-registered, NEPC-registered.",
      buyer: "Global businesses importing Nigerian goods. Verified via SumSub KYC/KYB.",
      admin: "Platform administrators for verification and dispute resolution",
      freightForwarder: "Not a platform role. Exporters use their own freight partners and upload quotes privately."
    },
  
    onboarding: {
      exporter: "Sign up → Select 'Exporter' → Submit CAC, NIN, NEPC documents → Admin verification (48h) → Dashboard access",
      buyer: "Sign up → Select 'Buyer' → SumSub verification → Browse marketplace → Start deals",
      tips: "Complete your profile fully — add company logo, description, and product photos. Verified exporters with complete profiles get 3x more enquiries."
    },
  
    dealStatuses: {
      enquiring: "Negotiating terms and quantity",
      freight_quoted: "Exporter submitted shipping estimate",
      freight_approved: "Buyer approved freight quote",
      escrow_funded: "Payment secured, checklist active",
      docs_in_progress: "Exporter preparing shipment documents",
      goods_shipped: "Goods loaded, tracking active",
      in_transit: "Shipment en route to destination",
      delivered: "Goods arrived at destination",
      completed: "Buyer confirmed, escrow released",
      disputed: "Issue raised, escrow frozen"
    },
  
    safety: {
      blockedContent: "Phone numbers, emails, external links, WhatsApp/Telegram links are blocked in chat",
      why: "All trade communication must stay inside the deal room for escrow protection and dispute evidence",
      tips: [
        "Never share contact details in chat",
        "Keep all negotiation in the deal room",
        "Verify exporter badge before dealing",
        "Request samples before bulk orders",
        "Only confirm delivery after physical inspection"
      ],
      redFlags: [
        "Exporter asks to communicate outside the platform",
        "Exporter refuses to use escrow and asks for direct payment",
        "Prices are dramatically lower than market rate",
        "Exporter has no verified badge and no reviews",
        "Exporter pressures you to confirm delivery before inspecting goods"
      ],
      reporting: "If you suspect fraud, click 'Raise Dispute' immediately and email hello@izixport.com with evidence."
    },
  
    credentials: {
      cacRegistered: "Registered business in Nigeria",
      escrowPartner: "Secure payments powered by PandasCrow escrow",
      compliance: "Fully compliant with Nigerian SEC guidelines for escrow services and CBN regulations for foreign exchange transactions."
    },
  
    nigerianExport: {
      nepc: "Nigerian Export Promotion Council — mandatory for all Nigerian exporters. Registration is free and takes 2-5 business days.",
      nxp: "Nigerian Export Proceeds (NXP) form — required for all exports over $2,500. Your bank processes this. IziXport guides you through it.",
      customs: "Nigerian Customs Service (NCS) export clearance. Required docs: commercial invoice, packing list, export license (NEPC), customs entry, and cargo declaration.",
      son: "Standards Organisation of Nigeria (SON) export clearance certificate may be required depending on the commodity and destination.",
      nafdac: "NAFDAC registration required for food and drug exports (e.g., palm oil, processed foods). Not required for raw agricultural commodities.",
      forex: "Export proceeds must be repatriated to Nigeria within 90 days per CBN regulation. IziXport helps document this for compliance."
    },
  
    marketInfo: {
      cashewPrice: "Cashew prices fluctuate with the global market. As of 2026, W320 raw cashew nuts average $1,200–$1,500/MT FOB Lagos. Always check current listings.",
      cocoaPrice: "Cocoa prices are highly volatile. 2026 average: $3,500–$4,200/MT for fermented dried beans. ICCO daily prices affect local rates.",
      sesamePrice: "White sesame typically $1,400–$1,700/MT. Brown sesame slightly lower. Prices depend on purity, oil content, and crop season.",
      sheaPrice: "Raw shea butter: $2,000–$2,800/MT. Refined shea butter: $3,500–$4,500/MT. Prices peak during dry season (Nov–Mar).",
      peakSeason: "Nigerian agro-commodities are typically harvested during the dry season (October–March). Prices are lowest at harvest and rise toward the rainy season.",
      exportVolume: "Nigeria exports approximately 300,000+ MT of cashew, 250,000+ MT of cocoa, and 150,000+ MT of sesame annually."
    }
  };
  
  // ─── KEYWORD-BASED RESPONSES ────────────────────────────────────────────────
  // These match on keyword groups, not exact phrases. More flexible than QUICK_RESPONSES.
  
  interface KeywordResponse {
    keywords: string[];
    response: string;
  }
  
  const KEYWORD_RESPONSES: KeywordResponse[] = [
    // PLATFORM OVERVIEW
    {
      keywords: ["what is izixport", "about izixport", "what does izixport do", "izixport platform", "who are you", "what do you do", "tell me about izixport", "izixport meaning"],
      response: PLATFORM_KNOWLEDGE.overview.description
    },
    {
      keywords: ["mission", "vision", "goal", "purpose", "why izixport"],
      response: `${PLATFORM_KNOWLEDGE.overview.mission} ${PLATFORM_KNOWLEDGE.overview.vision}`
    },
    {
      keywords: ["how does it work", "how izixport works", "process", "steps", "how to use", "getting started", "begin", "start"],
      response: `IziXport works in 4 steps: ${PLATFORM_KNOWLEDGE.process.fullCycle}.`
    },
    {
      keywords: ["what products", "what do you sell", "what can i buy", "commodities", "goods available", "what do you export", "what do you trade", "agricultural", "agro"],
      response: `We trade: ${PLATFORM_KNOWLEDGE.products.list.join(", ")}.`
    },
    {
      keywords: ["cashew", "cashew nuts", "cashew price", "cashew grade"],
      response: PLATFORM_KNOWLEDGE.products.cashew
    },
    {
      keywords: ["cocoa", "cocoa beans", "cocoa price", "cocoa quality"],
      response: PLATFORM_KNOWLEDGE.products.cocoa
    },
    {
      keywords: ["sesame", "sesame seeds", "sesame price", "white sesame", "brown sesame"],
      response: PLATFORM_KNOWLEDGE.products.sesame
    },
    {
      keywords: ["shea", "shea butter", "shea price", "shea oil"],
      response: PLATFORM_KNOWLEDGE.products.shea
    },
    {
      keywords: ["hibiscus", "hibiscus flower", "zobo", "hibiscus tea"],
      response: PLATFORM_KNOWLEDGE.products.hibiscus
    },
    {
      keywords: ["ginger", "dried ginger", "ginger powder", "ginger price"],
      response: PLATFORM_KNOWLEDGE.products.ginger
    },
    {
      keywords: ["palm oil", "palm oil price", "red oil", "cpo"],
      response: PLATFORM_KNOWLEDGE.products.palmOil
    },
    {
      keywords: ["chili", "chili pepper", "pepper", "scotch bonnet", "cayenne"],
      response: PLATFORM_KNOWLEDGE.products.chili
    },
  
    // FEES & PRICING
    {
      keywords: ["how much fees", "what are the fees", "cost", "charges", "commission", "how much do you charge", "pricing", "price", "how much", "expensive", "cheap"],
      response: `Buyer pays ${PLATFORM_KNOWLEDGE.escrow.buyerFee} escrow fee. Exporter pays ${PLATFORM_KNOWLEDGE.escrow.exporterFee} platform fee.`
    },
    {
      keywords: ["cashew price", "cocoa price", "sesame price", "shea price", "market price", "current price", "price today", "how much per ton", "how much per mt", "price per kg"],
      response: `Prices fluctuate with global markets. ${PLATFORM_KNOWLEDGE.marketInfo.cashewPrice} ${PLATFORM_KNOWLEDGE.marketInfo.cocoaPrice} ${PLATFORM_KNOWLEDGE.marketInfo.sesamePrice} ${PLATFORM_KNOWLEDGE.marketInfo.sheaPrice} Check current listings for exact pricing.`
    },
    {
      keywords: ["peak season", "harvest season", "when to buy", "best time", "seasonal", "crop season"],
      response: PLATFORM_KNOWLEDGE.marketInfo.peakSeason
    },
  
    // SAFETY & TRUST
    {
      keywords: ["is it safe", "secure", "trust", "scam", "protection", "guarantee", "fraud", "legit", "real", "authentic", "reliable"],
      response: `Yes. All payments are held in ${PLATFORM_KNOWLEDGE.escrow.partner} escrow until you confirm delivery. Dispute mediation available. ${PLATFORM_KNOWLEDGE.safety.why}`
    },
    {
      keywords: ["red flag", "warning sign", "suspicious", "fake exporter", "fraud alert", "scam sign"],
      response: `Watch out for: ${PLATFORM_KNOWLEDGE.safety.redFlags.join("; ")}. If you suspect fraud, click 'Raise Dispute' immediately.`
    },
    {
      keywords: ["report", "report fraud", "report scam", "report user", "bad exporter", "bad buyer"],
      response: PLATFORM_KNOWLEDGE.safety.reporting
    },
  
    // VERIFICATION
    {
      keywords: ["how do i verify", "verification", "get verified", "verified badge", "kyc", "documents needed", "verify my account", "verification process", "how long verification", "48 hours"],
      response: `Exporters: ${PLATFORM_KNOWLEDGE.verification.exporters}. Buyers: ${PLATFORM_KNOWLEDGE.verification.buyers}. ${PLATFORM_KNOWLEDGE.verification.whyVerify}`
    },
    {
      keywords: ["cac", "certificate of incorporation", "business registration", "company registration"],
      response: "CAC (Corporate Affairs Commission) registration is required for all Nigerian exporters on IziXport. Submit your CAC certificate during verification."
    },
    {
      keywords: ["nepc", "export promotion council", "nepc registration", "how to register nepc"],
      response: PLATFORM_KNOWLEDGE.nigerianExport.nepc
    },
    {
      keywords: ["nin", "national identity number", "national id", "identity verification"],
      response: "NIN (National Identity Number) is required for Nigerian exporter verification. It links your identity to your CAC-registered business."
    },
    {
      keywords: ["sumsub", "buyer verification", "passport verification", "international buyer", "foreign buyer"],
      response: PLATFORM_KNOWLEDGE.verification.buyers
    },
    {
      keywords: ["why verify", "benefit of verification", "verified badge meaning", "unverified"],
      response: PLATFORM_KNOWLEDGE.verification.whyVerify
    },
  
    // ESCROW & PAYMENTS
    {
      keywords: ["when do i get paid", "payout", "receive money", "payment release", "when paid", "my money", "funds", "transfer"],
      response: PLATFORM_KNOWLEDGE.escrow.payout
    },
    {
      keywords: ["how to track", "tracking", "where is my shipment", "shipment status", "track order", "track container", "where is my goods", "shipment location"],
      response: "Enter your tracking number in the deal room checklist. Click the carrier link to track independently. You can also ask the exporter for updates in the chat."
    },
    {
      keywords: ["what is escrow", "how does escrow work", "escrow works", "escrow process", "how escrow", "escrow meaning", "escrow", "escrow payment", "escrow service"],
      response: PLATFORM_KNOWLEDGE.escrow.whyEscrow
    },
    {
      keywords: ["why escrow", "why use escrow", "benefit of escrow", "escrow advantage"],
      response: PLATFORM_KNOWLEDGE.escrow.whyEscrow
    },
    {
      keywords: ["pandascrow", "who is pandascrow", "escrow partner", "payment partner"],
      response: `IziXport partners with PandasCrow for secure escrow payments. ${PLATFORM_KNOWLEDGE.escrow.howItWorks}`
    },
    {
      keywords: ["payment failed", "payment error", "cant pay", "payment declined", "transaction failed", "checkout error"],
      response: PLATFORM_KNOWLEDGE.payments.failedPayment
    },
    {
      keywords: ["payment receipt", "payment proof", "confirmation email", "paid confirmation", "how do i know i paid"],
      response: PLATFORM_KNOWLEDGE.payments.paymentReceipt
    },
    {
      keywords: ["hold period", "how long escrow", "when does escrow expire", "escrow timeout", "escrow duration"],
      response: PLATFORM_KNOWLEDGE.escrow.holdPeriod
    },
    {
      keywords: ["partial payment", "partial release", "split payment", "pay in installments", "milestone payment"],
      response: PLATFORM_KNOWLEDGE.escrow.partialRelease
    },
    {
      keywords: ["chargeback", "reverse payment", "get money back", "dispute refund", "refund process"],
      response: PLATFORM_KNOWLEDGE.escrow.chargebacks
    },
    {
      keywords: ["can i get samples", "samples", "test order", "trial", "lab certificate", "inspection report", "sample request", "test batch"],
      response: PLATFORM_KNOWLEDGE.features.sampleRequests
    },
    {
      keywords: ["what if dispute", "dispute", "problem with order", "something wrong", "not received", "damaged goods", "wrong goods", "quality issue", "complaint"],
      response: PLATFORM_KNOWLEDGE.disputes.process
    },
    {
      keywords: ["dispute evidence", "proof", "what evidence", "how to win dispute", "dispute tips"],
      response: PLATFORM_KNOWLEDGE.disputes.evidence
    },
    {
      keywords: ["dispute outcome", "who wins", "refund amount", "partial refund", "dispute resolution"],
      response: PLATFORM_KNOWLEDGE.disputes.outcomes
    },
    {
      keywords: ["prevent dispute", "avoid problem", "safe trade", "trade safely", "protect myself"],
      response: PLATFORM_KNOWLEDGE.disputes.prevention
    },
  
    // SUPPORT & CONTACT
    {
      keywords: ["contact support", "help", "support email", "customer service", "talk to someone", "human support", "real person", "call", "phone", "contact number"],
      response: `Email ${PLATFORM_KNOWLEDGE.support.email} or visit ${PLATFORM_KNOWLEDGE.support.location}. Response time is ${PLATFORM_KNOWLEDGE.support.responseTime}. Support hours: ${PLATFORM_KNOWLEDGE.support.hours}.`
    },
    {
      keywords: ["escalate", "escalation", "unresolved", "not solved", "senior team", "manager"],
      response: PLATFORM_KNOWLEDGE.support.escalation
    },
    {
      keywords: ["whatsapp", "telegram", "call me", "voice call", "video call"],
      response: PLATFORM_KNOWLEDGE.support.whatsapp
    },
  
    // SHIPPING & LOGISTICS
    {
      keywords: ["how long shipping", "shipping time", "delivery time", "transit time", "how long does it take", "when will it arrive", "arrival time", "expected delivery"],
      response: "Depends on destination and carrier. Exporter provides estimated transit days in the freight quote. Sea freight to Europe/Asia is typically 14–35 days. Air freight is 3–7 days."
    },
    {
      keywords: ["what documents needed", "required documents", "paperwork", "registration needed", "cac", "nepc", "nin", "export documents", "shipping documents", "customs documents"],
      response: "Exporters need: CAC certificate, NIN, NEPC registration. For shipping: commercial invoice, packing list, Bill of Lading, export license. Buyers need: passport or business license for SumSub verification."
    },
    {
      keywords: ["can i cancel order", "cancel", "refund", "change order", "stop order", "abort", "terminate"],
      response: PLATFORM_KNOWLEDGE.payments.refundPolicy
    },
    {
      keywords: ["minimum order", "moq", "minimum quantity", "smallest order", "minimum amount", "least order"],
      response: "Minimum order quantity is set by each exporter on their listing. Check the product page for details. Most commodities start at 1 MT (1,000 kg)."
    },
    {
      keywords: ["payment methods", "how to pay", "pay with", "card", "bank transfer", "payment options", "usd", "ngn", "dollar", "naira"],
      response: "All payments go through PandasCrow escrow. We accept USD and NGN. You will be redirected to a secure checkout page to complete payment."
    },
    {
      keywords: ["refund policy", "money back", "get refund", "return policy", "refund process", "refund time"],
      response: PLATFORM_KNOWLEDGE.payments.refundPolicy
    },
    {
      keywords: ["how to list product", "add listing", "sell on izixport", "become exporter", "start selling", "create listing", "post product"],
      response: PLATFORM_KNOWLEDGE.onboarding.tips
    },
    {
      keywords: ["what is nepc", "nepc registration", "export council", "nigerian export", "export license"],
      response: PLATFORM_KNOWLEDGE.nigerianExport.nepc
    },
    {
      keywords: ["nxp", "nigerian export proceeds", "export form", "cbn form", "foreign exchange", "forex"],
      response: PLATFORM_KNOWLEDGE.nigerianExport.nxp
    },
    {
      keywords: ["customs", "nigerian customs", "ncs", "customs clearance", "export clearance", "port clearance"],
      response: PLATFORM_KNOWLEDGE.nigerianExport.customs
    },
    {
      keywords: ["son", "standards organisation", "son cap", "quality certificate", "product standard"],
      response: PLATFORM_KNOWLEDGE.nigerianExport.son
    },
    {
      keywords: ["nafdac", "food and drug", "food safety", "nafdac registration"],
      response: PLATFORM_KNOWLEDGE.nigerianExport.nafdac
    },
    {
      keywords: ["bank details", "payout account", "receive payment", "bank account", "nigerian bank", "add bank", "change bank"],
      response: "Exporters add Nigerian bank details in their profile. Payouts go directly there after delivery confirmation. Ensure your bank account name matches your CAC-registered business name."
    },
    {
      keywords: ["language support", "translate", "translation", "different language", "auto translate", "chinese", "arabic", "french", "hindi", "spanish"],
      response: "Deal room messages are auto-translated into your preferred language. Set your language in Profile Settings. We support 15+ languages including English, Chinese, Arabic, French, Spanish, Hindi, and more."
    },
    {
      keywords: ["blocked message", "why blocked", "cant send", "message blocked", "phone number blocked", "email blocked", "link blocked", "external link"],
      response: PLATFORM_KNOWLEDGE.safety.blockedContent + " " + PLATFORM_KNOWLEDGE.safety.why
    },
  
    // FREIGHT & LOGISTICS
    {
      keywords: ["freight quote", "shipping cost", "shipping quote", "freight cost", "how much to ship", "transport cost", "logistics cost", "shipping fee"],
      response: "The exporter arranges freight and uploads a private quote. You review the estimate in Deal Actions and approve it before payment. The actual freight company name and cost breakdown are hidden from you until approval for the exporter's protection."
    },
    {
      keywords: ["checklist", "shipment checklist", "documents needed", "what to upload", "pre-shipment", "bill of lading", "bol", "tracking number", "photos"],
      response: PLATFORM_KNOWLEDGE.checklist.whyThreeSteps
    },
    {
      keywords: ["confirm delivery", "delivery confirmation", "received goods", "release payment", "mark delivered", "goods received"],
      response: "Once goods arrive, go to Deal Actions → Click 'Confirm Delivery' only after you've inspected the shipment. This releases escrow to the exporter. Do not confirm before inspection."
    },
    {
      keywords: ["raise dispute", "open dispute", "report problem", "escrow frozen", "issue with goods", "complaint"],
      response: "If something is wrong, click 'Raise Dispute' in Deal Actions. Escrow freezes immediately and our Lagos team mediates within 7-14 days. Do not confirm delivery if you have concerns."
    },
    {
      keywords: ["who can use", "who can buy", "who can sell", "eligibility", "can i join", "can anyone", "requirements"],
      response: "Exporters: Nigerian CAC-registered businesses with NEPC. Buyers: Global businesses verified via SumSub KYC/KYB."
    },
    {
      keywords: ["headquarters", "where are you based", "location", "lagos", "nigeria", "office", "address"],
      response: `IziXport is headquartered at ${PLATFORM_KNOWLEDGE.overview.headquarters}.`
    },
    {
      keywords: ["when founded", "founded", "started", "launch", "how old", "year established"],
      response: `IziXport was founded in ${PLATFORM_KNOWLEDGE.overview.founded}.`
    },
    {
      keywords: ["website", "url", "link", "izixport.com", "domain", "online"],
      response: `Visit us at ${PLATFORM_KNOWLEDGE.overview.website}.`
    },
  
    // SHIPPING DEEP DIVE
    {
      keywords: ["fob", "cif", "incoterms", "shipping terms", "delivery terms", "trade terms", "free on board", "cost insurance freight"],
      response: `Most deals use FOB Lagos or CIF depending on agreement. ${PLATFORM_KNOWLEDGE.shipping.incoterms}`
    },
    {
      keywords: ["insurance", "cargo insurance", "shipping insurance", "marine insurance", "goods insured", "cover"],
      response: PLATFORM_KNOWLEDGE.shipping.insurance
    },
    {
      keywords: ["packaging", "packing", "bag", "container", "jute bag", "pp bag", "packing standard", "how packed"],
      response: PLATFORM_KNOWLEDGE.shipping.packaging
    },
    {
      keywords: ["container", "20ft", "40ft", "fcl", "lcl", "full container", "less container", "container size", "how much fits"],
      response: PLATFORM_KNOWLEDGE.shipping.containerTypes
    },
    {
      keywords: ["customs destination", "import customs", "duty", "tariff", "import tax", "clearance destination", "receiving country"],
      response: "Exporter handles Nigerian customs export clearance. Buyer handles import customs, duties, and taxes in the destination country. IziXport provides guidance on required documents but does not handle foreign customs."
    },
    {
      keywords: ["lab test", "sgs", "bureau veritas", "intertek", "quality inspection", "pre-shipment inspection", "psi", "certificate of analysis", "coa"],
      response: PLATFORM_KNOWLEDGE.shipping.labTesting
    },
    {
      keywords: ["sea freight", "air freight", "road freight", "shipping mode", "by sea", "by air", "by road", "ocean freight"],
      response: PLATFORM_KNOWLEDGE.shipping.shippingModes
    },
    {
      keywords: ["carrier", "shipping line", "maersk", "msc", "cma cgm", "dhl", "gig", "freight forwarder", "forwarder"],
      response: `Supported carriers: ${Object.keys({"DHL":"","Maersk":"","MSC":"","CMA CGM":"","GIG":""}).join(", ")}. Exporters choose their preferred freight partner and upload the quote privately.`
    },
    {
      keywords: ["shipping delay", "delayed", "late", "not moving", "stuck at port", "port congestion", "customs delay"],
      response: "Shipping delays can happen due to port congestion, weather, or customs. Check the tracking number in the checklist. If delayed beyond the estimated transit time, contact the exporter or raise a dispute if concerned."
    },
  
    // ACCOUNT & PROFILE
    {
      keywords: ["change password", "reset password", "forgot password", "password reset", "login issue", "cant login", "account locked"],
      response: "Go to the login page and click 'Forgot Password'. You'll receive a reset link via email. If your account is locked after multiple failed attempts, wait 30 minutes or contact hello@izixport.com."
    },
    {
      keywords: ["delete account", "close account", "remove account", "deactivate", "leave platform"],
      response: "To delete your account, email hello@izixport.com with your registered email and reason. Note: you cannot delete an account with active deals or pending escrow. All deals must be completed or resolved first."
    },
    {
      keywords: ["change email", "update email", "new email", "email address"],
      response: "Email changes require admin approval for security. Go to Profile Settings → Request Email Change. You'll verify the new email before it activates."
    },
    {
      keywords: ["notification", "email alert", "push notification", "notify me", "alert", "reminder"],
      response: PLATFORM_KNOWLEDGE.features.notifications
    },
    {
      keywords: ["dashboard", "exporter dashboard", "buyer dashboard", "analytics", "stats", "performance", "views", "enquiries"],
      response: PLATFORM_KNOWLEDGE.features.analytics
    },
    {
      keywords: ["rating", "review", "stars", "feedback", "reputation", "trust score", "profile rating"],
      response: PLATFORM_KNOWLEDGE.features.ratings
    },
  
    // DEAL ROOM & CHAT
    {
      keywords: ["deal room", "chat room", "trade room", "private chat", "message", "conversation"],
      response: "The deal room is your private, secure space to negotiate, share documents, and track the deal. All messages are auto-translated and monitored for safety. Keep all communication here for escrow protection."
    },
    {
      keywords: ["cant upload", "upload failed", "file too big", "document error", "photo upload", "upload problem"],
      response: "Supported formats: JPG, PNG, PDF. Max file size: 10MB per file. If upload fails, check your internet connection and file size. Try compressing images or converting to PDF."
    },
    {
      keywords: ["translation not working", "wrong language", "translate error", "language issue", "not translated"],
      response: "Translation works automatically for incoming messages from the other party. If it's not working, check that your preferred language is set in Profile Settings. Some technical terms may not translate perfectly."
    },
  
    // GENERAL TRADE KNOWLEDGE
    {
      keywords: ["export volume", "how much nigeria export", "nigeria export statistics", "export data", "nigeria trade"],
      response: PLATFORM_KNOWLEDGE.marketInfo.exportVolume
    },
    {
      keywords: ["bv", "bureau veritas", "sgs inspection", "intertek", "third party inspection", "independent inspection"],
      response: PLATFORM_KNOWLEDGE.shipping.labTesting
    },
    {
      keywords: ["letter of credit", "lc", "l/c", "bank guarantee", "bg", "documentary credit"],
      response: "IziXport uses escrow (PandasCrow), not Letters of Credit. Escrow is simpler, faster, and protects both parties without complex banking procedures. No LC or bank guarantee is needed."
    },
    {
      keywords: ["tt", "telegraphic transfer", "wire transfer", "bank transfer", "direct payment", "pay exporter directly"],
      response: "Direct bank transfers outside escrow are NOT allowed. All payments must go through PandasCrow escrow. This protects you from fraud and ensures dispute evidence."
    },
    {
      keywords: ["proforma invoice", "pi", "commercial invoice", "invoice", "proforma"],
      response: "The freight summary in Deal Actions serves as your proforma invoice. Once escrow is funded, the exporter can generate a commercial invoice from the deal details."
    },
    {
      keywords: ["certificate of origin", "co", "origin certificate", "country of origin"],
      response: "Certificate of Origin is handled between the exporter and their freight forwarder. It is not part of the IziXport checklist but may be required by the buyer's country. Ask your exporter to include it if needed."
    },
    {
      keywords: ["phytosanitary", "phytosanitary certificate", "plant health", "pest free", "fumigation"],
      response: "Phytosanitary certificates are handled between the exporter and Nigerian authorities (NAQS). Not part of the IziXport checklist but required by many importing countries for agricultural goods."
    },
    {
      keywords: ["fumigation", "fumigate", "pest control", "treatment", "methyl bromide"],
      response: "Fumigation is often required by importing countries for agricultural commodities. The exporter arranges this through certified fumigation providers. Ask for the fumigation certificate if your country requires it."
    },
    {
      keywords: ["moisture content", "mc", "quality spec", "specification", "grade", "standard", "quality standard"],
      response: "Quality specifications vary by commodity. Check the product listing for specific specs, or request a Certificate of Analysis (COA) from the exporter before ordering."
    },
    {
      keywords: ["hs code", "harmonized code", "tariff code", "customs code", "classification"],
      response: "HS codes vary by commodity and destination country. Your exporter should provide the correct HS code on the commercial invoice. Common examples: Cashew 0801.32, Cocoa 1801.00, Sesame 1207.40."
    },
    {
      keywords: ["bulk order", "wholesale", "large quantity", "container load", "full load", "bulk purchase"],
      response: "IziXport is designed for bulk B2B orders. Typical orders range from 1 MT to full container loads (18–28 MT). Larger orders may qualify for better freight rates and escrow fee tiers."
    },
    {
      keywords: ["sample cost", "pay for sample", "sample fee", "sample price", "free sample"],
      response: "Sample costs are negotiated directly between buyer and exporter. IziXport does not handle sample payments through escrow. Use the deal room chat to agree on sample terms."
    },
    {
      keywords: ["repeat order", "reorder", "next order", "future order", "long term", "partnership", "regular supplier"],
      response: "After a successful deal, you can start a new deal with the same exporter. Repeat buyers often get better pricing and priority scheduling. Build long-term relationships through consistent deals."
    },
  
    // PLATFORM RULES
    {
      keywords: ["terms of service", "tos", "terms and conditions", "legal", "agreement", "user agreement", "policy"],
      response: "All users agree to IziXport's Terms of Service and Privacy Policy during signup. Key rules: keep communication in the deal room, no external payments, verified-only trading, and honest representation of goods."
    },
    {
      keywords: ["privacy", "data protection", "gdpr", "personal data", "information security", "who sees my data"],
      response: "IziXport protects your data in compliance with Nigerian NDPR and international best practices. Your contact details are never shared with the other party. All communication stays inside the encrypted deal room."
    },
    {
      keywords: ["commission", "referral", "affiliate", "earn money", "refer a friend", "partner program"],
      response: "IziXport does not currently offer a referral or affiliate program. Focus on building your exporter/buyer reputation for better deal flow."
    },
    {
      keywords: ["api", "developer", "integration", "webhook", "automation", "connect my system"],
      response: "IziXport API access is available for enterprise exporters and logistics partners on request. Contact hello@izixport.com with your use case."
    },
    {
      keywords: ["mobile app", "app", "download", "ios", "android", "apk"],
      response: "IziXport is currently a responsive web app. A native mobile app for iOS and Android is planned for 2027. Use the web app on your mobile browser — it works perfectly."
    }
  ];
  
  // ─── QUICK RESPONSES (exact substring matches for speed) ───────────────────
  
  export const QUICK_RESPONSES: Record<string, string> = {
    "what is izixport": PLATFORM_KNOWLEDGE.overview.description,
    "how does it work": `IziXport works in 4 steps: ${PLATFORM_KNOWLEDGE.process.fullCycle}.`,
    "what products": `We trade: ${PLATFORM_KNOWLEDGE.products.list.join(", ")}.`,
    "how much fees": `Buyer pays ${PLATFORM_KNOWLEDGE.escrow.buyerFee} escrow fee. Exporter pays ${PLATFORM_KNOWLEDGE.escrow.exporterFee} platform fee.`,
    "is it safe": `Yes. All payments are held in ${PLATFORM_KNOWLEDGE.escrow.partner} escrow until you confirm delivery. Dispute mediation available.`,
    "how do i verify": `Exporters: ${PLATFORM_KNOWLEDGE.verification.exporters}. Buyers: ${PLATFORM_KNOWLEDGE.verification.buyers}.`,
    "when do i get paid": PLATFORM_KNOWLEDGE.escrow.payout,
    "how to track": "Enter your tracking number in the deal room checklist. Click the carrier link to track independently.",
    "what is escrow": PLATFORM_KNOWLEDGE.escrow.whyEscrow,
    "can i get samples": PLATFORM_KNOWLEDGE.features.sampleRequests,
    "what if dispute": PLATFORM_KNOWLEDGE.disputes.process,
    "contact support": `Email ${PLATFORM_KNOWLEDGE.support.email} or visit ${PLATFORM_KNOWLEDGE.support.location}. Response time is ${PLATFORM_KNOWLEDGE.support.responseTime}.`,
    "how long shipping": "Depends on destination and carrier. Exporter provides estimated transit days in the freight quote. Sea freight to Europe/Asia is typically 14–35 days. Air freight is 3–7 days.",
    "what documents needed": "Exporters need: CAC certificate, NIN, NEPC registration. For shipping: commercial invoice, packing list, Bill of Lading, export license. Buyers need: passport or business license for SumSub verification.",
    "can i cancel order": PLATFORM_KNOWLEDGE.payments.refundPolicy,
    "minimum order": "Minimum order quantity is set by each exporter on their listing. Check the product page for details. Most commodities start at 1 MT (1,000 kg).",
    "payment methods": "All payments go through PandasCrow escrow. We accept USD and NGN. You will be redirected to a secure checkout page.",
    "refund policy": PLATFORM_KNOWLEDGE.payments.refundPolicy,
    "how to list product": PLATFORM_KNOWLEDGE.onboarding.tips,
    "what is nepc": PLATFORM_KNOWLEDGE.nigerianExport.nepc,
    "bank details": "Exporters add Nigerian bank details in their profile. Payouts go directly there after delivery confirmation. Ensure your bank account name matches your CAC-registered business name.",
    "language support": "Deal room messages are auto-translated into your preferred language. Set your language in Profile Settings. We support 15+ languages including English, Chinese, Arabic, French, Spanish, Hindi, and more.",
    "blocked message": PLATFORM_KNOWLEDGE.safety.blockedContent + " " + PLATFORM_KNOWLEDGE.safety.why,
  };
  
  // ─── SMART KEYWORD MATCHER ────────────────────────────────────────────────
  
  function matchByKeywords(userMessage: string): string | null {
    const lower = userMessage.toLowerCase();
  
    for (const item of KEYWORD_RESPONSES) {
      const matched = item.keywords.some(kw => lower.includes(kw.toLowerCase()));
      if (matched) return item.response;
    }
  
    return null;
  }
  
  // ─── GENERATE AI RESPONSE ─────────────────────────────────────────────────
  
  export function generateAIResponse(userMessage: string, context: {
    isBuyer: boolean;
    isExporter: boolean;
    orderStatus?: string;
    paymentReady?: boolean;
  }): string {
    const lower = userMessage.toLowerCase().trim();
  
    // 1. Quick exact-match responses
    for (const [key, response] of Object.entries(QUICK_RESPONSES)) {
      if (lower.includes(key)) return response;
    }
  
    // 2. Keyword-group matching
    const keywordMatch = matchByKeywords(userMessage);
    if (keywordMatch) return keywordMatch;
  
    // 3. Context-specific responses — EXPORTER
    if (context.isExporter) {
      if (lower.includes("how to ship") || lower.includes("shipping process") || lower.includes("send goods") || lower.includes("start shipping") || lower.includes("export process")) {
        return "As an exporter: 1) Submit freight quote in Deal Actions (carrier, cost, transit time), 2) Wait for buyer approval, 3) Once escrow is funded, complete the checklist: upload pre-shipment photos → Bill of Lading → tracking number, 4) Buyer confirms delivery, 5) Get paid to your Nigerian bank account.";
      }
      if (lower.includes("when paid") || lower.includes("get my money") || lower.includes("receive payment") || lower.includes("my payout") || lower.includes("payment release")) {
        return PLATFORM_KNOWLEDGE.escrow.payout;
      }
      if (lower.includes("payout") || lower.includes("how much") || lower.includes("my earnings") || lower.includes("what do i get") || lower.includes("net amount") || lower.includes("after fee")) {
        return `You receive: Goods value + Freight - ${PLATFORM_KNOWLEDGE.escrow.exporterFee} platform fee. Payout goes directly to your Nigerian bank account.`;
      }
      if (lower.includes("freight quote") || lower.includes("submit shipping") || lower.includes("add freight") || lower.includes("shipping estimate") || lower.includes("logistics quote")) {
        return "Go to Deal Actions → fill in carrier name, freight cost, currency, and estimated transit days. The buyer will review and approve. You can also attach a PDF quote from your freight forwarder.";
      }
      if (lower.includes("price my product") || lower.includes("set price") || lower.includes("how to price") || lower.includes("competitive price") || lower.includes("market rate")) {
        return `Research current market rates before listing. ${PLATFORM_KNOWLEDGE.marketInfo.cashewPrice} ${PLATFORM_KNOWLEDGE.marketInfo.cocoaPrice} Prices fluctuate seasonally — lowest at harvest (Oct–Mar), highest pre-harvest. Check competitor listings on the platform.`;
      }
      if (lower.includes("negotiate") || lower.includes("buyer offering") || lower.includes("counter offer") || lower.includes("bargain") || lower.includes("discount")) {
        return "Negotiate in the deal room chat. Be transparent about your costs. Don't agree to prices below your break-even. Escrow protects you, but a bad price still hurts. Always confirm freight separately from goods price.";
      }
      if (lower.includes("packaging") || lower.includes("how to pack") || lower.includes("export packaging") || lower.includes("bag type")) {
        return PLATFORM_KNOWLEDGE.shipping.packaging;
      }
      if (lower.includes("customs") || lower.includes("export clearance") || lower.includes("ncs") || lower.includes("nigerian customs")) {
        return PLATFORM_KNOWLEDGE.nigerianExport.customs;
      }
      if (lower.includes("nxp") || lower.includes("export proceeds") || lower.includes("cbn form")) {
        return PLATFORM_KNOWLEDGE.nigerianExport.nxp;
      }
      if (lower.includes("son") || lower.includes("standards") || lower.includes("quality cert")) {
        return PLATFORM_KNOWLEDGE.nigerianExport.son;
      }
      if (lower.includes("nafdac") || lower.includes("food registration")) {
        return PLATFORM_KNOWLEDGE.nigerianExport.nafdac;
      }
      if (lower.includes("incomplete checklist") || lower.includes("checklist not working") || lower.includes("cant upload") || lower.includes("upload error")) {
        return "Ensure you're uploading the correct file type (JPG, PNG, PDF under 10MB). The checklist activates only after escrow is funded. If issues persist, refresh the page or contact support.";
      }
      if (lower.includes("buyer not responding") || lower.includes("buyer silent") || lower.includes("no reply") || lower.includes("ghosted")) {
        return "Buyers may take time to review quotes. If no response after 48 hours, send a polite follow-up in the deal room. Avoid sending contact details — it's blocked and may flag your account.";
      }
      if (lower.includes("multiple buyers") || lower.includes("many enquiries") || lower.includes("busy") || lower.includes("high demand")) {
        return PLATFORM_KNOWLEDGE.onboarding.tips;
      }
      if (lower.includes("reputation") || lower.includes("rating") || lower.includes("review") || lower.includes("stars") || lower.includes("good rating")) {
        return "Your exporter rating affects your visibility. Deliver on time, upload quality photos, communicate clearly, and resolve issues professionally. High-rated exporters get 3x more enquiries.";
      }
    }
  
    // 4. Context-specific responses — BUYER
    if (context.isBuyer) {
      if (lower.includes("how to pay") || lower.includes("make payment") || lower.includes("where to pay") || lower.includes("pay now") || lower.includes("checkout")) {
        return "Go to Deal Actions → Review the freight estimate → Click 'Pay Now' → You'll be redirected to secure PandasCrow escrow checkout. Funds are held until you confirm delivery.";
      }
      if (lower.includes("is my money safe") || lower.includes("safe") || lower.includes("protected") || lower.includes("guaranteed") || lower.includes("secure payment") || lower.includes("risk")) {
        return "Yes. Your payment is held in PandasCrow escrow. It's only released to the exporter after you physically confirm delivery. If there's a problem, raise a dispute and our Lagos team will mediate.";
      }
      if (lower.includes("how to confirm delivery") || lower.includes("confirm receipt") || lower.includes("mark received") || lower.includes("release escrow") || lower.includes("done")) {
        return "Once goods arrive, go to Deal Actions → Click 'Confirm Delivery' only after you've inspected the shipment. This releases escrow to the exporter. Do NOT confirm before inspection.";
      }
      if (lower.includes("approve freight") || lower.includes("accept quote") || lower.includes("freight approved") || lower.includes("approve shipping")) {
        return "Review the freight estimate in Deal Actions. Check the carrier, cost, and transit time. If acceptable, click 'Approve & Proceed to Pay'. This locks in the shipping cost and activates payment.";
      }
      if (lower.includes("request changes") || lower.includes("change freight") || lower.includes("wrong quote") || lower.includes("too expensive") || lower.includes("cheaper shipping")) {
        return "Click 'Request Changes' in Deal Actions and describe what needs to change (carrier, cost, transit time). The exporter will receive your feedback and submit a revised quote.";
      }
      if (lower.includes("due diligence") || lower.includes("check exporter") || lower.includes("verify supplier") || lower.includes("trust exporter") || lower.includes("exporter legit")) {
        return "Check the exporter's verified badge, review ratings from past buyers, request samples before bulk orders, and review their pre-shipment photos carefully. Verified exporters have passed CAC + NIN + NEPC checks.";
      }
      if (lower.includes("inspection") || lower.includes("inspect goods") || lower.includes("check quality") || lower.includes("before confirm") || lower.includes("what to check")) {
        return "Before confirming delivery, inspect: quantity matches order, quality matches specs, packaging is intact, no damage or contamination. If anything is wrong, do NOT confirm — raise a dispute immediately.";
      }
      if (lower.includes("first time") || lower.includes("new buyer") || lower.includes("never imported") || lower.includes("beginner") || lower.includes("first order")) {
        return "Welcome! Start small: request samples, verify the exporter's badge, review their ratings, and start with a 1–5 MT trial order. Use escrow for every deal — never pay outside the platform.";
      }
      if (lower.includes("compare exporters") || lower.includes("best exporter") || lower.includes("choose supplier") || lower.includes("which exporter") || lower.includes("recommend")) {
        return "I can't recommend specific exporters, but look for: verified badge, high ratings (4+ stars), complete profile with photos, responsive communication, and transparent pricing. Request samples from 2–3 exporters to compare.";
      }
      if (lower.includes("import duty") || lower.includes("customs fee") || lower.includes("tax") || lower.includes("destination cost") || lower.includes("arrival cost")) {
        return "Import duties, VAT, and customs fees in your country are your responsibility as the buyer. IziXport does not calculate or collect these. Contact your local customs broker for estimates.";
      }
    }
  
    // 5. Status-specific responses
    if (context.orderStatus === "enquiring") {
      if (lower.includes("next step") || lower.includes("what now") || lower.includes("what do i do") || lower.includes("progress")) {
        return "You're currently negotiating. Discuss terms, quantity, pricing, and delivery requirements. The exporter will then submit a freight quote for your approval.";
      }
      if (lower.includes("freight") || lower.includes("shipping") || lower.includes("delivery") || lower.includes("transport")) {
        return "The exporter will submit a freight quote after you agree on the product terms. You'll review the shipping estimate in Deal Actions before approving.";
      }
    }
  
    if (context.orderStatus === "freight_quoted") {
      if (lower.includes("approve") || lower.includes("accept") || lower.includes("next") || lower.includes("proceed") || lower.includes("pay")) {
        return "Review the freight estimate in Deal Actions. If acceptable, click 'Approve & Proceed to Pay'. This locks in the shipping cost and activates the payment button.";
      }
      if (lower.includes("too expensive") || lower.includes("high cost") || lower.includes("reduce") || lower.includes("cheaper") || lower.includes("negotiate freight")) {
        return "If the freight cost seems high, click 'Request Changes' and explain what you'd like adjusted. The exporter can revise the quote or suggest a different carrier.";
      }
    }
  
    if (context.orderStatus === "freight_approved") {
      if (lower.includes("next") || lower.includes("what now") || lower.includes("pay") || lower.includes("payment") || lower.includes("escrow")) {
        return "Freight is approved! The payment button is now active in Deal Actions. Click 'Pay Now' to fund escrow via PandasCrow. Once paid, the exporter begins the shipment checklist.";
      }
    }
  
    if (context.orderStatus === "escrow_funded") {
      if (lower.includes("what next") || lower.includes("when ship") || lower.includes("status") || lower.includes("update") || lower.includes("progress")) {
        return "Payment is secured! The exporter is now completing the shipment checklist: pre-shipment photos → Bill of Lading → tracking number. You'll see live updates as each step completes.";
      }
      if (lower.includes("how long") || lower.includes("when ready") || lower.includes("preparation time")) {
        return "Exporters typically complete the checklist within 3–7 business days after escrow funding, depending on product availability and freight scheduling.";
      }
    }
  
    if (context.orderStatus === "docs_in_progress") {
      if (lower.includes("status") || lower.includes("where") || lower.includes("update") || lower.includes("next")) {
        return "The exporter is preparing shipment documents and uploading proof. You'll be notified when pre-shipment photos, Bill of Lading, and tracking are submitted.";
      }
    }
  
    if (context.orderStatus === "goods_shipped") {
      if (lower.includes("where") || lower.includes("status") || lower.includes("update") || lower.includes("track") || lower.includes("location")) {
        return "Your shipment has been loaded! Check the deal room checklist for the tracking number and click the carrier link to track independently. Transit time was estimated by the exporter in the freight quote.";
      }
      if (lower.includes("confirm") || lower.includes("delivery") || lower.includes("received")) {
        return "Not yet! Wait until the goods physically arrive at your location. Only then should you inspect and click 'Confirm Delivery' in Deal Actions. Do not confirm early.";
      }
    }
  
    if (context.orderStatus === "in_transit") {
      if (lower.includes("where") || lower.includes("status") || lower.includes("update") || lower.includes("track") || lower.includes("location") || lower.includes("delay")) {
        return "Your shipment is en route. Check the tracking number in the checklist for real-time updates. If the delay exceeds the estimated transit time by more than 7 days, contact the exporter or consider raising a dispute.";
      }
    }
  
    if (context.orderStatus === "delivered") {
      if (lower.includes("confirm") || lower.includes("done") || lower.includes("received") || lower.includes("next")) {
        return "Goods have arrived! Please inspect carefully before confirming. Check quantity, quality, and packaging. If everything is correct, click 'Confirm Delivery' in Deal Actions to release escrow. If not, raise a dispute.";
      }
    }
  
    if (context.orderStatus === "completed") {
      if (lower.includes("review") || lower.includes("rate") || lower.includes("feedback") || lower.includes("stars") || lower.includes("next deal")) {
        return "The deal is complete! Please leave a review for your trading partner — it helps future buyers and exporters make informed decisions. You can start a new deal anytime.";
      }
      if (lower.includes("reorder") || lower.includes("buy again") || lower.includes("same exporter") || lower.includes("next order")) {
        return "Great! You can start a new deal with the same exporter from their profile or your order history. Repeat buyers often get priority and better pricing.";
      }
    }
  
    if (context.orderStatus === "disputed") {
      if (lower.includes("status") || lower.includes("what now") || lower.includes("update") || lower.includes("how long") || lower.includes("resolution")) {
        return "A dispute is active. Escrow is frozen. Our Lagos-based mediation team is reviewing the case. Resolution typically takes 7–14 days. You'll be notified of any updates. Do not communicate outside the deal room.";
      }
      if (lower.includes("evidence") || lower.includes("proof") || lower.includes("document") || lower.includes("photo")) {
        return "All chat history, checklist uploads, and tracking records in the deal room are automatically used as evidence. Do not delete any messages. If you have additional evidence, mention it in the chat so it's recorded.";
      }
    }
  
    // 6. General conversational fallbacks
    if (lower.includes("help") || lower.includes("support") || lower.includes("assist") || lower.includes("guide me") || lower.includes("lost") || lower.includes("confused")) {
      return `I can help with: deal steps, payments, shipping, verification, fees, commodity specs, or safety tips. What specifically do you need? You can also email ${PLATFORM_KNOWLEDGE.support.email}.`;
    }
  
    if (lower.includes("thank") || lower.includes("appreciate") || lower.includes("grateful")) {
      return "You're welcome! I'm here anytime you need help with your trade. Keep all communication in this room for your protection. Safe trading!";
    }
  
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("good morning") || lower.includes("good afternoon") || lower.includes("good evening") || lower.includes("greetings")) {
      return "Hello! I'm your IziXport AI Trade Facilitator. Ask me anything about your deal, our platform, Nigerian exports, or international trade procedures. How can I help?";
    }
  
    if (lower.includes("bye") || lower.includes("goodbye") || lower.includes("see you") || lower.includes("later") || lower.includes("talk soon")) {
      return "Goodbye! Feel free to ask anytime you need help. Keep your trade safe and inside this room. Have a great day!";
    }
  
    if (lower.includes("ok") || lower.includes("okay") || lower.includes("got it") || lower.includes("understood") || lower.includes("clear") || lower.includes("makes sense")) {
      return "Great! Let me know if you need anything else. I'm here to help keep your deal moving smoothly.";
    }
  
    if (lower.includes("sorry") || lower.includes("apologize") || lower.includes("my mistake") || lower.includes("wrong")) {
      return "No problem at all! Mistakes happen. Let me know how I can help you get back on track.";
    }
  
    if (lower.includes("frustrated") || lower.includes("annoyed") || lower.includes("angry") || lower.includes("upset") || lower.includes("terrible") || lower.includes("worst")) {
      return "I'm sorry to hear that. If there's an issue with your deal, please raise a dispute or email hello@izixport.com immediately. Our team is here to help resolve problems fairly.";
    }
  
    if (lower.includes("amazing") || lower.includes("awesome") || lower.includes("great") || lower.includes("excellent") || lower.includes("love") || lower.includes("perfect")) {
      return "That's wonderful to hear! We're glad IziXport is helping your trade. Don't forget to leave a review after your deal completes — it helps the community grow.";
    }
  
    if (lower.includes("joke") || lower.includes("funny") || lower.includes("laugh") || lower.includes("humor")) {
      return "I'm a trade facilitator, not a comedian — but here's one: Why did the cashew cross the ocean? To reach a verified buyer on IziXport! 😄 Back to business — how can I help?";
    }
  
    if (lower.includes("who are you") || lower.includes("your name") || lower.includes("what is your name") || lower.includes("introduce yourself")) {
      return "I'm the IziXport AI Trade Facilitator. I help buyers and exporters navigate deals, answer questions about the platform, shipping, payments, and Nigerian agro-commodities. I don't sleep, so ask me anything, anytime!";
    }
  
    if (lower.includes("human") || lower.includes("real person") || lower.includes("not a bot") || lower.includes("speak to human") || lower.includes("agent")) {
      return "I'm an AI assistant, but I know a lot about IziXport and international trade. For human support, email hello@izixport.com — our Lagos team responds within 24-48 hours. For urgent disputes, use the 'Raise Dispute' button.";
    }
  
    // 7. Default contextual response
    return "I can help with that. Ask me about deals, payments, shipping, verification, commodity specs, fees, or safety. What specifically do you need? You can also try saying 'IziXport AI' followed by your question for detailed guidance.";
  }