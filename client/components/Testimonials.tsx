// client/components/Testimonials.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/client";
import { Star, ArrowRight, Quote } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  quote: string;
  author: string;
  role: string;
};

// ---------- Skeleton card for loading state ----------
const SkeletonCard = () => (
  <div className="bg-white p-8 rounded-3xl shadow-sm animate-pulse">
    <div className="flex mb-6 gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-5 h-5 rounded-full bg-gray-200" />
      ))}
    </div>
    <div className="space-y-3 mb-8">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-200" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    </div>
  </div>
);

// ---------- Empty state with icon ----------
const EmptyState = () => (
  <div className="col-span-full py-20 text-center">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#E6F2ED] mb-6">
      <Star className="w-10 h-10 text-[#006B3F]" />
    </div>
    <p className="text-xl font-semibold text-gray-700">No reviews yet</p>
    <p className="text-gray-500 mt-2">
      Be the first to share your experience!
    </p>
  </div>
);

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false); // for fade-in animation
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const fetchViaSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, rating, quote, author, role")
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(5);

        console.log("Supabase result:", data, error);
        if (error) throw error;
        if (!cancelled && data && data.length > 0) {
          setReviews(data);
          return true;
        }
        return false;
      } catch (err) {
        console.warn("Supabase fetch failed, will try raw fetch.", err);
        return false;
      }
    };

    const fetchViaRaw = async () => {
      try {
        const response = await fetch(
          "https://ekwujrzymivouqckzbdu.supabase.co/rest/v1/reviews?select=id,rating,quote,author,role&approved=eq.true&order=created_at.desc&limit=5",
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!cancelled) setReviews(data);
      } catch (err) {
        console.error("Raw fetch failed:", err);
      }
    };

    const loadData = async () => {
      const supabaseWorked = await fetchViaSupabase();
      if (!supabaseWorked) {
        timeoutId = setTimeout(async () => {
          if (!cancelled && reviews.length === 0) {
            await fetchViaRaw();
            if (!cancelled) {
              setLoading(false);
              setShowContent(true);
            }
          }
        }, 3000);
      } else {
        if (!cancelled) {
          setLoading(false);
          setShowContent(true);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section className="relative py-28 bg-gray-50 overflow-hidden">
      {/* Subtle background pattern (green dots) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #006B3F 2px, transparent 2px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-[#006B3F] uppercase tracking-widest text-sm mb-4 font-medium">
            REAL TRADERS • REAL RESULTS
          </p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900">
            What Our Traders Say
          </h2>
          <div className="mt-6 h-1 w-20 bg-[#D4A843] mx-auto rounded-full" />
        </div>

        {/* Cards grid / skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            // Show 3 skeleton cards while loading
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : reviews.length > 0 ? (
            reviews.map((review, idx) => (
              <article
                key={review.id}
                className={`bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col ${
                  showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                {/* Stars */}
                <div className="flex mb-6 gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating
                          ? "text-[#D4A843] fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {/* Quote with icon */}
                <div className="relative flex-1">
                  <Quote className="absolute -top-1 -left-1 w-8 h-8 text-[#006B3F]/10" />
                  <p className="italic text-lg leading-relaxed mb-8 pl-6 text-gray-700">
                    “{review.quote}”
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-4 mt-auto border-t border-gray-100 pt-6">
                  <div className="w-12 h-12 rounded-full bg-[#006B3F] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {review.author?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{review.author}</p>
                    <p className="text-sm text-gray-500">{review.role}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState />
          )}
        </div>

        {/* View All button */}
        {reviews.length > 0 && (
          <div className="text-center mt-12">
            <button
              onClick={() => navigate("/reviews")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm bg-[#006B3F] text-white hover:bg-[#004f2e] shadow-md hover:shadow-lg transition-all duration-300 group"
            >
              View All Reviews
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}