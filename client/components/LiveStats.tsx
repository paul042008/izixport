import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase/client";

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
      else setCount(target);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration, start]);
  return count;
}

export default function LiveStats({ transparent = false }: { transparent?: boolean }) {
  const [stats, setStats] = useState({ verifiedUsers: 0, countries: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_stats');
        if (error) throw error;
        setStats({
          verifiedUsers: Number(data?.[0]?.verified_users || 0),
          countries: Number(data?.[0]?.countries || 0),
        });
      } catch (err) {
        console.error("LiveStats fetch failed:", err);
        // Fallback: show 0 rather than blank
        setStats({ verifiedUsers: 0, countries: 0 });
      } finally {
        setLoaded(true);
      }
    };
    fetchStats();
  }, []);

  const usersCount = useCountUp(stats.verifiedUsers, 2000, loaded);
  const countriesCount = useCountUp(stats.countries, 2000, loaded);

  return (
    <div className={`py-10 md:py-14 ${transparent ? "" : "bg-white border-y border-gray-100"}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 gap-8 text-center">
          <div>
            <div className="text-5xl md:text-6xl font-black text-[#D4A843]">
              {loaded ? `${usersCount}+` : '—'}
            </div>
            <p className="text-sm uppercase tracking-widest mt-2 text-gray-500">Verified Users</p>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-black text-[#D4A843]">
              {loaded ? `${countriesCount}+` : '—'}
            </div>
            <p className="text-sm uppercase tracking-widest mt-2 text-gray-500">Countries Reached</p>
          </div>
        </div>
      </div>
    </div>
  );
}