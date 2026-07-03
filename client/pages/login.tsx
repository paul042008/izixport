// src/pages/Login.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Shield, Building2, Globe, ArrowRight, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['exporter', 'buyer']),
})

type LoginForm = z.infer<typeof loginSchema>

const C = {
  greenDeep:   '#0C3825',
  greenMid:    '#1A5C41',
  greenBright: '#006B3F',
  greenLight:  'rgba(26,92,65,0.08)',
  gold:        '#D4A843',
  goldLight:   'rgba(212,168,67,0.10)',
  bg:          '#F1EDE6',
  white:       '#FFFFFF',
  border:      '#E2DDD6',
  text:        '#1C1917',
  textSub:     '#57534E',
  textMuted:   '#A8A29E',
  gray50:      '#FAF9F7',
  gray100:     '#F5F2EC',
  danger:      '#DC2626',
}

export default function Login() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'exporter' | 'buyer'>('exporter')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: 'exporter' },
  })

  // ── FIXED: Better error handling, onboarding redirect, unverified email ──
  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        // Handle unverified email
        if (authError.message?.includes('Email not confirmed') || authError.message?.includes('not confirmed')) {
          toast.error('Please verify your email first.')
          navigate('/verify-email', { state: { email: data.email } })
          setLoading(false)
          return
        }
        toast.error(authError.message || 'Invalid credentials')
        setLoading(false)
        return
      }

      if (!authData.user) {
        toast.error('Login failed. Please try again.')
        setLoading(false)
        return
      }

      // Check if user has a profile (completed onboarding)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, full_name, verification_status')
        .eq('id', authData.user.id)
        .single()

      // No profile = needs onboarding
      if (profileError || !profile) {
        toast.success('Welcome! Please complete your onboarding.')
        if (data.role === 'exporter') {
          navigate('/onboarding/exporter')
        } else {
          navigate('/onboarding/buyer')
        }
        setLoading(false)
        return
      }

      // Role mismatch
      if (profile.role !== 'admin' && profile.role !== data.role) {
        toast.error(`This account is registered as ${profile.role}. Please select the correct role.`)
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      toast.success(`Welcome back, ${profile.full_name || 'trader'}!`)

      // Redirect based on role
      if (profile.role === 'exporter') {
        navigate('/dashboard/exporter', { replace: true })
      } else if (profile.role === 'buyer') {
        navigate('/dashboard/buyer', { replace: true })
      } else if (profile.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }

    } catch (err: any) {
      toast.error(err?.message || 'An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (role: 'exporter' | 'buyer') => {
    setSelectedRole(role)
    setValue('role', role)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes lp-spin { to { transform: rotate(360deg); } }
        @keyframes lp-fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }

        .auth-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 9px;
          border: 1px solid #E2DDD6;
          background: #FAF9F7;
          color: #1C1917;
          font-size: 13.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .auth-input:focus {
          border-color: #1A5C41;
          box-shadow: 0 0 0 3px rgba(26,92,65,0.1);
        }
        .auth-input::placeholder { color: #A8A29E; }

        .auth-btn {
          width: 100%;
          padding: 13px;
          border-radius: 9px;
          background: #0C3825;
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 14px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
        }
        .auth-btn:hover:not(:disabled) {
          background: #1A5C41;
          box-shadow: 0 6px 24px rgba(12,56,37,0.22);
        }
        .auth-btn:active:not(:disabled) { transform: scale(0.98); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .auth-role-card {
          flex: 1;
          padding: 14px 12px;
          border-radius: 10px;
          border: 1.5px solid #E2DDD6;
          background: #FAF9F7;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          transition: all 0.18s;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .auth-role-card:hover { border-color: #D4A843; background: rgba(212,168,67,0.05); }
        .auth-role-card.active { border-color: #D4A843; background: rgba(212,168,67,0.08); }

        .auth-label {
          display: block;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #57534E;
          margin-bottom: 6px;
        }

        .auth-error {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          color: #DC2626;
          margin-top: 5px;
        }

        .auth-shell {
          animation: lp-fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both;
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(26,92,65,0.2); border-radius: 3px; }
      `}</style>

      <div style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ borderRadius: 9, overflow: 'hidden', border: `1px solid ${C.border}`, display: 'inline-flex' }}>
            <img src="/logo.jpeg" alt="IziXport" style={{ height: 34, width: 'auto', display: 'block' }} />
          </div>
          <Link to="/signup" style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13, fontWeight: 600, color: C.greenMid,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            Create account <ArrowRight size={13} />
          </Link>
        </div>

        {/* Two-column layout on desktop */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'stretch',
          maxWidth: 1100, margin: '0 auto', width: '100%',
          padding: '0 20px 40px',
          gap: 32,
        }}>

          {/* LEFT — branding panel (desktop only) */}
          <div style={{
            flex: '0 0 420px', borderRadius: 16,
            background: C.greenDeep, position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: '48px 40px',
          }} className="auth-left-panel">
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }} />
            <div style={{
              position: 'absolute', top: '-20%', right: '-20%',
              width: '60%', height: '60%', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,168,67,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 6,
                border: '1px solid rgba(212,168,67,0.25)',
                background: 'rgba(212,168,67,0.08)',
                marginBottom: 32,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold }}>
                  Verified Trade Platform
                </span>
              </div>

              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 56, fontWeight: 900, lineHeight: 0.92,
                letterSpacing: '-0.03em', color: C.white,
                margin: '0 0 20px',
              }}>
                Trade With<br />
                <span style={{ color: C.gold }}>Confidence.</span>
              </h2>

              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: 300 }}>
                Connecting verified Nigerian exporters with global buyers through full escrow protection.
              </p>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {[
                { icon: Lock,    label: 'Escrow-Protected Payments' },
                { icon: Shield,  label: '100% Verified Traders' },
                { icon: Globe,   label: '38 Countries Served' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(212,168,67,0.12)',
                    border: '1px solid rgba(212,168,67,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={14} color={C.gold} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — form */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div className="auth-shell" style={{
              background: C.white, borderRadius: 16,
              border: `1px solid ${C.border}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              padding: '36px 36px 32px',
              width: '100%', maxWidth: 440,
            }}>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 38, fontWeight: 900, letterSpacing: '-0.02em',
                  color: C.text, margin: '0 0 6px',
                }}>Welcome Back</h1>
                <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
                  Sign in to your IziXport account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Role selector */}
                <div>
                  <span className="auth-label">I am a</span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {([
                      { role: 'exporter' as const, icon: Building2, label: 'Exporter', sub: 'I sell Nigerian products' },
                      { role: 'buyer'    as const, icon: Globe,     label: 'Buyer',    sub: 'I source from Nigeria'  },
                    ] as const).map(({ role, icon: Icon, label, sub }) => (
                      <button
                        key={role}
                        type="button"
                        className={`auth-role-card${selectedRole === role ? ' active' : ''}`}
                        onClick={() => handleRoleChange(role)}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 9,
                          background: selectedRole === role ? C.greenDeep : C.gray100,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.18s',
                        }}>
                          <Icon size={16} color={selectedRole === role ? C.gold : C.textMuted} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{label}</span>
                        <span style={{ fontSize: 10, color: C.textMuted, textAlign: 'center' }}>{sub}</span>
                      </button>
                    ))}
                  </div>
                  <input type="hidden" {...register('role')} />
                </div>

                {/* Email */}
                <div>
                  <label className="auth-label">Email Address</label>
                  <input type="email" {...register('email')} className="auth-input" placeholder="you@example.com" />
                  {errors.email && <p className="auth-error">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="auth-label" style={{ margin: 0 }}>Password</label>
                    <Link to="/forgot-password" style={{ fontSize: 12, fontWeight: 600, color: C.greenMid, textDecoration: 'none' }}>
                      Forgot?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className="auth-input"
                      placeholder="••••••••"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                      position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted,
                      display: 'flex', alignItems: 'center',
                    }}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.password && <p className="auth-error">{errors.password.message}</p>}
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} className="auth-btn" style={{ marginTop: 4 }}>
                  {loading
                    ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'lp-spin 0.8s linear infinite' }} />
                    : <><span>Log In</span> <ArrowRight size={15} /></>
                  }
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>or</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                <p style={{ textAlign: 'center', fontSize: 13, color: C.textSub, margin: 0 }}>
                  Don't have an account?{' '}
                  <Link to="/signup" style={{ fontWeight: 700, color: C.greenMid, textDecoration: 'none' }}>
                    Create Account
                  </Link>
                </p>
              </form>

              {/* Security footer */}
              <div style={{
                marginTop: 24, paddingTop: 20,
                borderTop: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Shield size={13} color={C.greenMid} />
                <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
                  Secured by IziXport Escrow Protection
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </>
  )
}