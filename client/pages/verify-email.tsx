// src/pages/VerifyEmail.tsx
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'

const COLORS = {
  primary: '#006B3F',
  primaryDark: '#004D2E',
  primaryLight: '#E6F2ED',
  accent: '#D4A843',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
}

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(location.state?.email || null)
  const [resending, setResending] = useState(false)

  // Fallback: get email from session
  useEffect(() => {
    if (email) return
    const fetchEmail = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user?.email) {
        setEmail(data.user.email)
      }
    }
    fetchEmail()
  }, [email])

  // ── Resend verification email ───────────────────────────────────────────
  const resendEmail = async () => {
    if (!email) {
      toast.error('No email address found.')
      return
    }

    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })
      if (error) throw error

      toast.success('Verification email sent! Check your inbox.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl shadow-lg max-w-md w-full p-8 text-center"
        style={{ border: `1px solid ${COLORS.gray200}` }}
      >
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: `${COLORS.accent}10` }}
        >
          <Mail className="w-10 h-10" style={{ color: COLORS.accent }} />
        </div>

        <h1
          className="text-2xl font-black"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', color: COLORS.gray900 }}
        >
          Check your email
        </h1>

        <p className="text-sm mt-2 mb-6" style={{ color: COLORS.gray500 }}>
          We sent a verification link to{' '}
          <strong style={{ color: COLORS.gray700 }}>{email || 'your email'}</strong>.
          Click the link to verify your account.
        </p>

        <div style={{ background: COLORS.primaryLight, borderRadius: 12, padding: '14px 16px', marginBottom: 20, border: '1px solid rgba(0,107,63,0.1)' }}>
          <p style={{ fontSize: 13, color: COLORS.primary, margin: 0, lineHeight: 1.5 }}>
            After verifying, you'll be redirected to complete your onboarding.
          </p>
        </div>

        <button
          onClick={resendEmail}
          disabled={resending || !email}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            background: COLORS.gray900,
            color: 'white',
            border: 'none',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: resending ? 0.6 : 1,
          }}
        >
          {resending ? (
            <><Loader2 size={16} className="animate-spin" /> Sending...</>
          ) : (
            <><Send size={16} /> Resend email</>
          )}
        </button>

        <p className="text-center text-sm mt-4">
          <a
            href="/login"
            style={{ fontWeight: 600, color: COLORS.primary, textDecoration: 'none' }}
          >
            Already verified? Log in
          </a>
        </p>
      </div>
    </div>
  )
}