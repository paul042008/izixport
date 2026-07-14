// src/App.tsx
import "./global.css";
import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import Index from "./pages/index";
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

// ════════════════════════════════════════════════════════
// ROUTE GUARDS
// ════════════════════════════════════════════════════════

/** Blocks unauthenticated users. Optionally checks allowed roles. */
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role, verification_status, verified")
        .eq("id", session.user.id)
        .single();

      setUser({ ...session.user, ...profile });
      setLoading(false);
    };
    check();
  }, []);

  if (loading) return <PageLoader />;

  // Not logged in → login
  if (!user) return <Navigate to="/login" replace />;

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "exporter")
      return <Navigate to="/dashboard/exporter" replace />;
    if (user.role === "buyer")
      return <Navigate to="/dashboard/buyer" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Prevents logged-in users from accessing login/signup.
 * EXCEPTION: If the user is on /signup with a ?type= that differs from their
 * current role, we sign them out so they can create a new account (e.g. buyer
 * clicking "Join as Exporter" or vice versa).
 */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // No session at all → safe to show login/signup
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role, verified")
        .eq("id", session.user.id)
        .single();

      const searchParams = new URLSearchParams(location.search);
      const intendedType = searchParams.get("type");

      // ROLE-SWITCH FIX:
      // If user is on /signup with an explicit ?type= that differs from their
      // current role, they want to create a new account. Sign them out and
      // let the signup page render for the new role.
      if (
        location.pathname === "/signup" &&
        intendedType &&
        intendedType !== profile?.role
      ) {
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Normal redirect flow for logged-in users
      if (profile?.role === "admin") setRedirectTo("/admin");
      else if (profile?.verified && profile?.role === "exporter")
        setRedirectTo("/dashboard/exporter");
      else if (profile?.verified && profile?.role === "buyer")
        setRedirectTo("/dashboard/buyer");
      else if (profile?.role === "exporter")
        setRedirectTo("/onboarding/exporter");
      else if (profile?.role === "buyer")
        setRedirectTo("/onboarding/buyer");
      else setRedirectTo("/");

      setLoading(false);
    };
    check();
  }, [location]);

  if (loading) return <PageLoader />;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}

/** Prevents verified users from re-visiting onboarding. */
function OnboardingGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole: "exporter" | "buyer";
}) {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setRedirectTo("/login");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role, verification_status, verified")
        .eq("id", session.user.id)
        .single();

      // Already fully verified → dashboard
      if (profile?.verified) {
        setRedirectTo(
          requiredRole === "exporter"
            ? "/dashboard/exporter"
            : "/dashboard/buyer"
        );
        setLoading(false);
        return;
      }

      // Wrong role trying to access wrong onboarding path
      if (
        profile?.role &&
        profile.role !== requiredRole &&
        profile.role !== "user"
      ) {
        setRedirectTo(
          profile.role === "admin" ? "/admin" : `/dashboard/${profile.role}`
        );
        setLoading(false);
        return;
      }

      setLoading(false);
    };
    check();
  }, [requiredRole]);

  if (loading) return <PageLoader />;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}

// ════════════════════════════════════════════════════════
// APP
// ════════════════════════════════════════════════════════

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public pages (redirect if logged in) ───────── */}
            <Route
              element={
                <PublicOnlyRoute>
                  <Outlet />
                </PublicOnlyRoute>
              }
            >
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
            </Route>

            {/* ── Public pages (always accessible) ─────────── */}
            <Route path="/" element={<Index />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />

            {/* ── Onboarding (protected + role-guarded) ──────── */}
            <Route
              path="/onboarding/exporter"
              element={
                <OnboardingGuard requiredRole="exporter">
                  <ExporterOnboarding />
                </OnboardingGuard>
              }
            />
            <Route
              path="/onboarding/buyer"
              element={
                <OnboardingGuard requiredRole="buyer">
                  <BuyerOnboarding />
                </OnboardingGuard>
              }
            />

            {/* ── Dashboards (auth + role required) ────────── */}
            <Route
              path="/dashboard/exporter"
              element={
                <ProtectedRoute allowedRoles={["exporter"]}>
                  <ExporterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/buyer"
              element={
                <ProtectedRoute allowedRoles={["buyer"]}>
                  <BuyerDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Deep‑linked exporter pages ───────────────── */}
            <Route
              path="/dashboard/exporter/track"
              element={
                <ProtectedRoute allowedRoles={["exporter"]}>
                  <ExporterTrack />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/exporter/add-listing"
              element={
                <ProtectedRoute allowedRoles={["exporter"]}>
                  <AddListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/exporter/bank-details"
              element={
                <ProtectedRoute allowedRoles={["exporter"]}>
                  <BankDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/exporter/profile"
              element={
                <ProtectedRoute allowedRoles={["exporter"]}>
                  <ExporterProfile />
                </ProtectedRoute>
              }
            />

            {/* ── Generic tracking (any authenticated user) ──── */}
            <Route
              path="/dashboard/track"
              element={
                <ProtectedRoute>
                  <Track />
                </ProtectedRoute>
              }
            />

            {/* ── Deal Room (any authenticated user) ─────────── */}
            <Route
              path="/deal/:orderId"
              element={
                <ProtectedRoute>
                  <DealRoom />
                </ProtectedRoute>
              }
            />

            {/* ── Admin (admin role only) ────────────────────── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* ── 404 ────────────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);