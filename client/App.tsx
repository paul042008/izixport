// src/App.tsx
import "./global.css";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// ── Auth / Onboarding / Dashboard ──────────────────────────────────────────
const Signup = lazy(() => import("./pages/signup"));
const Login = lazy(() => import("./pages/login"));
const ExporterProfile = lazy(() => import("./pages/dashboard/ExporterProfile"));
const VerifyEmail = lazy(() => import("./pages/verify-email"));
const ForgotPassword = lazy(() => import("./pages/forgot-password"));
const ExporterOnboarding = lazy(() => import("./pages/onboarding/exporter"));
const BuyerOnboarding = lazy(() => import("./pages/onboarding/buyer"));
const ExporterDashboard = lazy(() => import("./pages/dashboard/exporter"));
const BuyerDashboard = lazy(() => import("./pages/dashboard/buyer"));
const AuthCallback = lazy(() => import("./pages/auth/callback"));
const AdminPanel = lazy(() => import("./pages/admin/AdminVerification"));

// ── NEW PAGES ───────────────────────────────────────────────────────────────
const Track = lazy(() => import("./pages/dashboard/Track"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const ExporterTrack = lazy(() => import("./pages/dashboard/ExporterTrack"));
const AddListing = lazy(() => import("./pages/dashboard/AddListing"));
const BankDetails = lazy(() => import("./pages/dashboard/BankDetails"));
const DealRoom = lazy(() => import("./pages/deal/DealRoom"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));
// ── LEGAL PAGES ─────────────────────────────────────────────────────────────
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
// ──────────────────────────────────────────────────────────────────────────────

const queryClient = new QueryClient();

const PageLoader = () => (
  <div
    className="min-h-screen bg-[#002E1A] flex items-center justify-center"
    style={{
      paddingTop: "env(safe-area-inset-top, 0px)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      maxWidth: "100%",
      overflow: "hidden",
    }}
    role="status"
    aria-label="Loading page"
  >
    <div
      className="w-12 h-12 border-4 border-[#C8991A] border-t-transparent rounded-full animate-spin"
      style={{ flexShrink: 0 }}
    />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public pages ─────────────────────────────── */}
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />

            {/* ── Legal pages ─────────────────────────────── */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* ── Onboarding ────────────────────────────────── */}
            <Route path="/onboarding/exporter" element={<ExporterOnboarding />} />
            <Route path="/onboarding/buyer" element={<BuyerOnboarding />} />

            {/* ── Dashboards ────────────────────────────────── */}
            <Route path="/dashboard/exporter" element={<ExporterDashboard />} />
            <Route path="/dashboard/buyer" element={<BuyerDashboard />} />

            {/* ── Deep‑linked pages for exporter ───────────── */}
            <Route path="/dashboard/exporter/track" element={<ExporterTrack />} />
            <Route path="/dashboard/exporter/add-listing" element={<AddListing />} />
            <Route path="/dashboard/exporter/bank-details" element={<BankDetails />} />

            {/* ── Generic tracking (works for both roles) ──── */}
            <Route path="/dashboard/track" element={<Track />} />

            {/* ── Deal Room ─────────────────────────────────── */}
            <Route path="/deal/:orderId" element={<DealRoom />} />
            <Route path="/dashboard/exporter/profile" element={<ExporterProfile />} />

            {/* ── Reviews Page ────────────────────────────────── */}
            <Route path="/reviews" element={<ReviewsPage />} />

            {/* ── Admin (protected inside page) ───────────────── */}
            <Route path="/admin" element={<AdminPanel />} />

            {/* ── 404 — must stay last ────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);