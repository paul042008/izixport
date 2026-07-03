// src/components/PlatformReviewPrompt.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import BottomSheet from './BottomSheet';

interface Props {
  userId: string;
  userRole: 'buyer' | 'exporter';
  onClose: () => void;
}

/* ─── local spinner (replaces missing <Loader />) ─── */
function Spinner({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}33`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}

export default function PlatformReviewPrompt({ userId, userRole, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const platformTable = userRole === 'buyer' ? 'buyer_platform_reviews' : 'exporter_platform_reviews';

  const submitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating (1–5 stars).');
      return;
    }
    setSubmitting(true);
    try {
      // 1. Fetch user name first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, company_name')
        .eq('id', userId)
        .single();
      if (userError) {
        console.error('User fetch error:', userError);
        throw userError;
      }

      const author = userData.company_name || userData.full_name || (userRole === 'buyer' ? 'Buyer' : 'Exporter');
      const roleLabel = userRole === 'buyer' ? 'Buyer' : 'Exporter';

      // 2. Insert into platform-specific table (one per user)
      const { data: platformData, error: platformError } = await supabase.from(platformTable).insert({
        user_id: userId,
        rating,
        review: reviewText.trim() || null,
        author: author,
        role: roleLabel,
      }).select();
      if (platformError) {
        console.error('Platform review insert error:', platformTable, platformError);
        throw new Error(platformError.message || 'Platform review insert failed');
      }
      console.log('Platform review inserted:', platformData);

      // 3. Insert into main `reviews` table for testimonials

      const { data: reviewData, error: reviewError } = await supabase.from('reviews').insert({
        user_id: userId,
        rating,
        quote: reviewText.trim() || null,
        author,
        role: roleLabel,
        approved: false,
      }).select();
      if (reviewError) {
        console.error('Testimonials insert error:', reviewError);
        throw new Error(reviewError.message || 'Testimonials insert failed');
      }
      console.log('Testimonial inserted:', reviewData);

      toast.success('Thank you for your feedback! Your review will appear after admin approval.');
      onClose();
    } catch (err: any) {
      console.error('submitReview catch:', err);
      toast.error('Review save failed: ' + (err?.message || err?.code || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet open onClose={onClose} title="Rate IziXport">
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#374151', fontSize: 13, marginBottom: 8 }}>
            How would you rate your experience with IziXport?
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
            {[1,2,3,4,5].map(star => (
              <button key={star} onClick={() => setRating(star)} style={{
                background: 'none', border: 'none', fontSize: 28, cursor: 'pointer',
                color: star <= rating ? '#FBBF24' : '#D1D5DB',
              }}>★</button>
            ))}
          </div>
        </div>
        <textarea
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          rows={3}
          placeholder="Share your experience (optional)"
          style={{ width: '100%', padding: '11px 12px', border: '1px solid #D1D5DB', borderRadius: 10, background: '#F9FAFB' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 12, background: '#F3F4F6', border: 'none', color: '#374151', fontWeight: 700 }}>
            Remind Me Later
          </button>
          <button onClick={submitReview} disabled={submitting} style={{ flex: 1, padding: 12, borderRadius: 12, background: '#D4A843', border: 'none', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {submitting ? <Spinner size={14} color="#fff" /> : 'Submit'}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}