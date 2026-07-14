// src/lib/ai/platformKnowledge.ts
// IziXport platform knowledge base for AI responses

export const PLATFORM_KNOWLEDGE = {
    // Platform overview
    overview: {
      name: "IziXport",
      tagline: "Nigerian Trade, Exported Easy",
      description: "Africa's first verified B2B trade marketplace connecting Nigerian exporters with global buyers through secure escrow payments, real-time tracking, and end-to-end trade support.",
      founded: "2026",
      headquarters: "Victoria Island, Lagos, Nigeria",
      website: "izixport.com",
    },
  
    // How it works
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
      ]
    },
  
    // Products traded
    products: [
      "Cashew Nuts", "Cocoa Beans", "Sesame Seeds", "Shea Butter",
      "Hibiscus", "Ginger", "Palm Oil", "Chili Pepper"
    ],
  
    // Verification
    verification: {
      exporters: "Verified via NIN + CAC + NEPC. Free verification, 48-hour turnaround.",
      buyers: "Verified via SumSub (Sum and Substance). Free tier: 300 API calls/month. Handles KYC/KYB (passport, business license).",
      badge: "Verified badge appears on profile. Buyers see verification status in deal rooms."
    },
  
    // Escrow & fees
    escrow: {
      partner: "PandasCrow",
      buyerFee: "4.5% for first $250K, 4.0% for $250K-$1M, 3.5% above $1M",
      exporterFee: "3% platform fee on exporter side",
      howItWorks: "Buyer pays into escrow → Exporter ships → Buyer confirms delivery → Escrow releases to exporter",
      protection: "Funds held securely until buyer physically confirms receipt. Dispute mediation available.",
      payout: "Released to exporter's Nigerian bank account within 1-3 business days after confirmation"
    },
  
    // Shipping & logistics
    shipping: {
      process: "Exporter arranges freight, uploads quote privately. Buyer only sees estimate and final total.",
      documents: "Bill of Lading, Pre-shipment Photos, Tracking Number required for checklist completion.",
      tracking: "Real-time tracking via carrier (DHL, Maersk, MSC, CMA CGM, GIG, etc.)",
      hiddenFromBuyer: "Freight company name, actual freight cost, and exporter's logistics details are private until quote approval."
    },
  
    // Checklist steps
    checklist: {
      steps: [
        { name: "Pre-Shipment Photos", icon: "📸", required: true, description: "Photos of packed goods, bags, and container before loading" },
        { name: "Bill of Lading", icon: "🚢", required: true, description: "Official proof goods are loaded on vessel" },
        { name: "Tracking Number Confirmed", icon: "📍", required: false, description: "Container or shipment tracking number for buyer verification" }
      ],
      trigger: "Activates when escrow is funded. All 3 steps must complete before delivery confirmation."
    },
  
    // Payments
    payments: {
      methods: "Escrow via PandasCrow (secure, held until delivery confirmation)",
      currencies: "USD, NGN",
      whenBuyerPays: "After freight quote is approved",
      whenExporterGetsPaid: "After buyer confirms delivery",
      refundPolicy: "If dispute is resolved in buyer's favor, escrow is refunded minus fees"
    },
  
    // Dispute resolution
    disputes: {
      process: "Buyer raises dispute → Escrow frozen → Lagos-based trade team mediates → Resolution within 7-14 days",
      reasons: ["Wrong goods received", "Goods damaged", "Quality mismatch", "Quantity incorrect", "Not delivered", "Other"],
      team: "Lagos-based trade team steps in to mediate. You're never left alone in a transaction."
    },
  
    // Support
    support: {
      email: "hello@izixport.com",
      location: "Victoria Island, Lagos, Nigeria",
      responseTime: "24-48 hours",
      disputeTeam: "Lagos-based trade team for mediation"
    },
  
    // Features
    features: {
      sampleRequests: "Request product samples, lab certificates, and pre-shipment inspection reports before committing to bulk orders",
      paperworkSupport: "Guidance through NEPC registration, NXP processing, and customs documentation",
      disputeMediation: "Lagos-based team mediates any issues",
      globalLogistics: "Connected to freight forwarders and shipping lines across Europe, Asia, and Americas",
      realTimeTracking: "Track shipment progress in deal room",
      autoTranslation: "Messages auto-translated between buyer and exporter in their preferred languages"
    },
  
    // Account types
    roles: {
      exporter: "Nigerian businesses exporting agro-commodities. Must be CAC-registered, NEPC-registered.",
      buyer: "Global businesses importing Nigerian goods. Verified via SumSub KYC/KYB.",
      admin: "Platform administrators for verification and dispute resolution"
    },
  
    // Onboarding
    onboarding: {
      exporter: "Sign up → Select 'Exporter' → Submit CAC, NIN, NEPC documents → Admin verification (48h) → Dashboard access",
      buyer: "Sign up → Select 'Buyer' → SumSub verification → Browse marketplace → Start deals"
    },
  
    // Deal flow statuses
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
  
    // Safety & rules
    safety: {
      blockedContent: "Phone numbers, emails, external links, WhatsApp/Telegram links are blocked in chat",
      why: "All trade communication must stay inside the deal room for escrow protection and dispute evidence",
      tips: [
        "Never share contact details in chat",
        "Keep all negotiation in the deal room",
        "Verify exporter badge before dealing",
        "Request samples before bulk orders",
        "Only confirm delivery after physical inspection"
      ]
    },
  
    // Platform credentials
    credentials: {
      cacRegistered: "Registered business in Nigeria",
      escrowPartner: "Secure payments powered by PandasCrow escrow"
    }
  };
  
  // Quick response templates for common questions
  export const QUICK_RESPONSES: Record<string, string> = {
    "what is izixport": PLATFORM_KNOWLEDGE.overview.description,
    "how does it work": "IziXport works in 4 steps: 1) Exporter signs up & gets verified, 2) Lists products, 3) Connects with buyers via private deal room, 4) Ships goods and gets paid via escrow after buyer confirms delivery.",
    "what products": `We trade: ${PLATFORM_KNOWLEDGE.products.join(", ")}.`,
    "how much fees": `Buyer pays ${PLATFORM_KNOWLEDGE.escrow.buyerFee} escrow fee. Exporter pays ${PLATFORM_KNOWLEDGE.escrow.exporterFee} platform fee.`,
    "is it safe": `Yes. All payments are held in ${PLATFORM_KNOWLEDGE.escrow.partner} escrow until you confirm delivery. Dispute mediation available.`,
    "how do i verify": `Exporters: ${PLATFORM_KNOWLEDGE.verification.exporters}. Buyers: ${PLATFORM_KNOWLEDGE.verification.buyers}.`,
    "when do i get paid": PLATFORM_KNOWLEDGE.escrow.payout,
    "how to track": "Enter your tracking number in the deal room checklist. Click the carrier link to track independently.",
    "what is escrow": "Escrow is a secure holding service. Buyer pays IziXport, we hold the money, exporter ships, buyer confirms receipt, then we release funds to exporter.",
    "can i get samples": "Yes. Request samples, lab certificates, and pre-shipment inspection reports before committing to bulk orders.",
    "what if dispute": PLATFORM_KNOWLEDGE.disputes.process,
    "contact support": `Email ${PLATFORM_KNOWLEDGE.support.email} or visit ${PLATFORM_KNOWLEDGE.support.location}.`,
    "how long shipping": "Depends on destination and carrier. Exporter provides estimated transit days in the freight quote.",
    "what documents needed": "Exporters need: CAC certificate, NIN, NEPC registration. Buyers need: passport or business license for SumSub verification.",
    "can i cancel order": "Orders can only be cancelled before escrow is funded. Once funded, cancellation requires mutual agreement or dispute resolution.",
    "minimum order": "Minimum order quantity is set by each exporter on their listing. Check the product page for details.",
    "payment methods": "All payments go through PandasCrow escrow. We accept USD and NGN.",
    "refund policy": PLATFORM_KNOWLEDGE.payments.refundPolicy,
    "how to list product": "Go to your Exporter Dashboard → Add Listing → Fill product details, pricing, photos → Submit for review.",
    "what is nepc": "NEPC (Nigerian Export Promotion Council) registration is required for Nigerian exporters. We guide you through it.",
    "bank details": "Exporters add Nigerian bank details in their profile. Payouts go directly there after delivery confirmation.",
    "language support": "Deal room messages are auto-translated. Set your preferred language in your profile settings.",
    "blocked message": "We block phone numbers, emails, and external links to keep you safe. All communication must stay in the deal room for escrow protection.",
  };
  
  // Generate contextual AI response based on user message
  export function generateAIResponse(userMessage: string, context: {
    isBuyer: boolean;
    isExporter: boolean;
    orderStatus?: string;
    paymentReady?: boolean;
  }): string {
    const lower = userMessage.toLowerCase();
    
    // Check quick responses first
    for (const [key, response] of Object.entries(QUICK_RESPONSES)) {
      if (lower.includes(key)) return response;
    }
  
    // Context-specific responses
    if (context.isExporter) {
      if (lower.includes("how to ship") || lower.includes("shipping process")) {
        return "As an exporter: 1) Submit freight quote in Deal Actions (carrier, cost, transit time), 2) Wait for buyer approval, 3) Once escrow is funded, complete the checklist: upload pre-shipment photos → Bill of Lading → tracking number, 4) Buyer confirms delivery, 5) Get paid.";
      }
      if (lower.includes("when paid") || lower.includes("get my money")) {
        return PLATFORM_KNOWLEDGE.escrow.payout;
      }
      if (lower.includes("payout") || lower.includes("how much")) {
        return `You receive: Goods value + Freight - ${PLATFORM_KNOWLEDGE.escrow.exporterFee} platform fee. Payout goes to your Nigerian bank account.`;
      }
    }
  
    if (context.isBuyer) {
      if (lower.includes("how to pay") || lower.includes("make payment")) {
        return "Go to Deal Actions → Review the freight estimate → Click 'Pay Now' → You'll be redirected to secure PandasCrow escrow checkout. Funds are held until you confirm delivery.";
      }
      if (lower.includes("is my money safe")) {
        return "Yes. Your payment is held in PandasCrow escrow. It's only released to the exporter after you physically confirm delivery. If there's a problem, raise a dispute and our Lagos team will mediate.";
      }
      if (lower.includes("how to confirm delivery")) {
        return "Once goods arrive, go to Deal Actions → Click 'Confirm Delivery' only after you've inspected the shipment. This releases escrow to the exporter.";
      }
    }
  
    // Status-specific
    if (context.orderStatus === "enquiring") {
      if (lower.includes("next step") || lower.includes("what now")) {
        return "You're currently negotiating. Discuss terms, quantity, and pricing. The exporter will then submit a freight quote for your approval.";
      }
    }
  
    if (context.orderStatus === "freight_quoted") {
      if (lower.includes("approve") || lower.includes("accept")) {
        return "Review the freight estimate in Deal Actions. If acceptable, click 'Approve & Proceed to Pay'. This locks in the shipping cost and activates payment.";
      }
    }
  
    if (context.orderStatus === "escrow_funded") {
      if (lower.includes("what next") || lower.includes("when ship")) {
        return "Payment is secured! The exporter is now completing the shipment checklist: pre-shipment photos → Bill of Lading → tracking number. You'll see updates as each step completes.";
      }
    }
  
    // General fallback
    if (lower.includes("help") || lower.includes("support") || lower.includes("assist")) {
      return `I can help with: deal steps, payments, shipping, verification, fees, or safety tips. What specifically do you need? You can also email ${PLATFORM_KNOWLEDGE.support.email}.`;
    }
  
    if (lower.includes("thank")) {
      return "You're welcome! I'm here anytime you need help with your trade. Keep all communication in this room for your protection.";
    }
  
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      return "Hello! I'm your IziXport AI Trade Facilitator. Ask me anything about your deal, our platform, or export procedures. How can I help?";
    }
  
    // Default contextual response
    return "I can help with that. For the most accurate guidance, could you tell me more about what you need? I can explain deal steps, payments, shipping requirements, verification, or platform fees.";
  }