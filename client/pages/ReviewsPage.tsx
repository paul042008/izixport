// pages/ReviewsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/client";
import { Star, ArrowLeft, Quote, CheckCircle2, Search } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  quote: string | null;
  author: string;
  role: string;
  verified?: boolean;
  source: string;
};

const COLORS = {
  primary: "#006B3F",
  primaryDark: "#004D2E",
  primaryLight: "#E6F2ED",
  accent: "#D4A843",
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

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
      <div className="flex mb-6 gap-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
        ))}
      </div>
      <div className="h-20 bg-gray-100 rounded-lg mb-8 animate-pulse" />
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 9;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        const combined: Review[] = [];

        // 1. Fetch approved testimonials
        const { data: testimonials, error: tErr } = await supabase
          .from("reviews")
          .select("id, rating, quote, author, role")
          .eq("approved", true)
          .order("created_at", { ascending: false });

        if (tErr) console.error("reviews table error:", tErr);
        (testimonials || []).forEach((r: any) => {
          combined.push({
            id: r.id,
            rating: r.rating,
            quote: r.quote,
            author: r.author || "Anonymous",
            role: r.role || "Trader",
            verified: true,
            source: "testimonial",
          });
        });

        // 2. Fetch exporter platform reviews (author stored directly)
        const { data: expReviews, error: eErr } = await supabase
          .from("exporter_platform_reviews")
          .select("id, rating, review, author, role, created_at")
          .order("created_at", { ascending: false });

        if (eErr) console.error("exporter_platform_reviews error:", eErr);

        (expReviews || []).forEach((r: any) => {
          combined.push({
            id: r.id,
            rating: r.rating,
            quote: r.review,
            author: r.author || "Exporter",
            role: r.role || "Verified Exporter",
            verified: true,
            source: "platform",
          });
        });

        // 3. Fetch buyer platform reviews (author stored directly)
        const { data: buyReviews, error: bErr } = await supabase
          .from("buyer_platform_reviews")
          .select("id, rating, review, author, role, created_at")
          .order("created_at", { ascending: false });

        if (bErr) console.error("buyer_platform_reviews error:", bErr);

        (buyReviews || []).forEach((r: any) => {
          combined.push({
            id: r.id,
            rating: r.rating,
            quote: r.review,
            author: r.author || "Buyer",
            role: r.role || "Verified Buyer",
            verified: true,
            source: "platform",
          });
        });

        console.log("Total reviews loaded:", combined.length);
        setReviews(combined);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllReviews();
  }, []);

  const filteredReviews = reviews.filter(
    (review) =>
      review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (review.quote || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + reviewsPerPage);

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${COLORS.gray200}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm px-3 py-1.5">
            <img src="/logo.jpeg" alt="IziXport" className="h-7 w-auto block" />
          </div>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-gray-100"
            style={{ color: COLORS.primary }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div
          className="rounded-2xl p-6 mb-10 text-center"
          style={{ background: COLORS.primaryLight, border: `1px solid ${COLORS.primary}20` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.primary }}>
                Community Trust Score
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-current" style={{ color: COLORS.accent }} />
                  ))}
                </div>
                <span className="text-2xl font-black" style={{ color: COLORS.gray900 }}>{averageRating}</span>
                <span className="text-sm" style={{ color: COLORS.gray500 }}>out of 5</span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.primary }}>Total Reviews</p>
              <p className="text-2xl font-black" style={{ color: COLORS.gray900 }}>{reviews.length}</p>
            </div>
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.primary }}>Verified Traders</p>
              <p className="text-2xl font-black" style={{ color: COLORS.gray900 }}>{reviews.filter(r => r.verified).length}</p>
            </div>
          </div>
        </div>

        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: COLORS.primary }}>
            REAL TRADERS • REAL RESULTS
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight" style={{ fontFamily: "Barlow Condensed, sans-serif", color: COLORS.gray900 }}>
            All Reviews
          </h1>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: COLORS.accent }} />
        </div>

        <div className="max-w-md mx-auto mb-10">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="w-5 h-5" style={{ color: COLORS.gray400 }} />
            <input
              type="text"
              placeholder="Search by name, role, or quote..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: COLORS.gray100 }}>
              <Quote className="w-8 h-8" style={{ color: COLORS.gray400 }} />
            </div>
            <p className="text-xl font-semibold" style={{ color: COLORS.gray700 }}>No reviews found</p>
            <p className="text-sm mt-2" style={{ color: COLORS.gray500 }}>
              {searchTerm ? "Try a different search term" : "Be the first to share your experience!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedReviews.map((review, idx) => (
                <div
                  key={review.id}
                  className="group bg-white rounded-3xl p-8 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <Quote className="w-8 h-8 mb-4 opacity-20 group-hover:opacity-40 transition-opacity" style={{ color: COLORS.accent }} />
                  <div className="flex mb-4 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 transition-all ${i < review.rating ? "fill-current" : "text-gray-200 fill-gray-200"}`}
                        style={i < review.rating ? { color: COLORS.accent } : {}}
                      />
                    ))}
                  </div>
                  <p className="text-base md:text-lg leading-relaxed mb-6 text-gray-700 italic" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    "{review.quote || "No written feedback."}"
                  </p>
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
                    >
                      {review.author?.[0] || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                          {review.author}
                        </p>
                        {review.verified && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#059669" }} />}
                      </div>
                      <p className="text-xs" style={{ color: COLORS.gray500 }}>{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{ border: `1px solid ${COLORS.gray200}`, background: COLORS.white, color: COLORS.gray600 }}
                >
                  Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${currentPage === i + 1 ? "text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-100"}`}
                      style={currentPage === i + 1 ? { background: COLORS.primary } : { background: COLORS.white }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{ border: `1px solid ${COLORS.gray200}`, background: COLORS.white, color: COLORS.gray600 }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}