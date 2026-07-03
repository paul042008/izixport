// src/pages/Signup.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Globe, Eye, EyeOff, Check, ArrowRight, Shield, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['exporter', 'buyer']),
  terms: z.boolean().refine(val => val === true, 'You must accept the Terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

type SignupForm = z.infer<typeof signupSchema>

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

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: (searchParams.get('type') as 'exporter' | 'buyer') || 'buyer',
      terms: false
    }
  })

  const selectedRole = watch('role')

  // ── Role from URL ─────────────────────────────────────────────────────────
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'exporter') setValue('role', 'exporter')
    if (type === 'buyer') setValue('role', 'buyer')
  }, [searchParams, setValue])

  // ── Enforce role on existing session ──────────────────────────────────────
  useEffect(() => {
    const enforceRole = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const pendingRole = localStorage.getItem('pendingRole')
      if (!pendingRole) return
      const userId = session.user.id
      const currentMetadataRole = session.user.user_metadata?.role
      if (currentMetadataRole === pendingRole) return
      await supabase.from('users').update({ role: pendingRole }).eq('id', userId)
      await supabase.auth.updateUser({ data: { role: pendingRole } })
      console.log(`✅ Forced role to ${pendingRole} for user ${userId}`)
      localStorage.removeItem('pendingRole')
    }
    enforceRole()
  }, [])

  // ── Signup with Supabase Auth (email confirmation enabled) ───────────────
  const onSubmit = async (data: SignupForm) => {
    setLoading(true)

    try {
      // 1. Sign up with Supabase Auth (email confirmation required)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?role=${data.role}`,
        },
      })

      if (signUpError) {
        toast.error(signUpError.message || 'Signup failed', { duration: 5000 })
        return
      }

      if (!authData.user) {
        toast.error('Something went wrong. Please try again.', { duration: 5000 })
        return
      }

      // Store role for callback handling
      localStorage.setItem('pendingRole', data.role)

      // 2. Insert into public.users (email_verified starts as false)
      const { error: dbError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: data.email.toLowerCase().trim(),
        full_name: data.fullName.trim(),
        role: data.role,
        verification_status: 'pending',
        email_verified: false,
        created_at: new Date().toISOString(),
      })

      // If user already exists in DB, that's okay (they might have signed up before)
      if (dbError && !dbError.message.includes('duplicate')) {
        console.error('DB insert error:', dbError)
      }

      toast.success('Account created! Check your email to verify.', { duration: 4000 })

      // 3. Redirect to Verify Email page
      navigate('/verify-email', { 
        state: { email: data.email },
        replace: true 
      })

    } catch (err: any) {
      console.error('Signup error:', err)
      toast.error('Network error. Please check your connection and try again.', { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  
  const passwordVal = watch('password') || ''
  const strengthChecks = [
    { label: 'At least 8 characters', pass: passwordVal.length >= 8 },
    { label: 'Contains a number',     pass: /\d/.test(passwordVal) },
    { label: 'Contains a letter',     pass: /[a-zA-Z]/.test(passwordVal) },
  ]
  const strengthScore = strengthChecks.filter(c => c.pass).length

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes lp-spin    { to { transform: rotate(360deg); } }
        @keyframes lp-fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }

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
        .auth-shell { animation: lp-fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }

        .auth-role-card {
          flex: 1;
          padding: 18px 14px;
          border-radius: 11px;
          border: 1.5px solid #E2DDD6;
          background: #FAF9F7;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
          transition: all 0.18s;
          position: relative;
        }
        .auth-role-card:hover  { border-color: #D4A843; background: rgba(212,168,67,0.04); }
        .auth-role-card.active { border-color: #D4A843; background: rgba(212,168,67,0.07); }

        .auth-checkbox {
          width: 18px; height: 18px;
          border-radius: 5px;
          border: 1.5px solid #D1CBC1;
          accent-color: #D4A843;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 1px;
        }

        @media (min-width: 640px) {
          .auth-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        }

        @media (max-width: 860px) {
          .auth-left-panel { display: none !important; }
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
          <Link to="/login" style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13, fontWeight: 600, color: C.greenMid,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            Sign in <ArrowRight size={13} />
          </Link>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'flex-start',
          maxWidth: 1100, margin: '0 auto', width: '100%',
          padding: '0 20px 48px', gap: 32,
        }}>

          {/* LEFT — branding panel */}
          <div className="auth-left-panel" style={{
            flex: '0 0 360px', borderRadius: 16,
            background: C.greenDeep, position: 'sticky', top: 28,
            overflow: 'hidden', padding: '44px 36px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: 540,
          }}>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }} />
            <div style={{
              position: 'absolute', bottom: '-25%', left: '-20%', width: '70%', height: '70%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,168,67,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 12px', borderRadius: 6,
                border: '1px solid rgba(212,168,67,0.25)',
                background: 'rgba(212,168,67,0.08)',
                marginBottom: 28,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.gold }} />
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold }}>
                  Free to Join
                </span>
              </div>

              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 50, fontWeight: 900, lineHeight: 0.92,
                letterSpacing: '-0.03em', color: C.white,
                margin: '0 0 18px',
              }}>
                Start Trading<br />
                <span style={{ color: C.gold }}>The Smart</span><br />
                Way.
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.75 }}>
                Join verified Nigerian exporters and global buyers on Africa's most trusted trade platform.
              </p>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {[
                { icon: Lock,    label: 'Escrow-Protected Payments',  sub: 'Zero payment risk'             },
                { icon: Shield,  label: 'Document Verification',       sub: 'Serious businesses only'       },
                { icon: Globe,   label: '38 Countries Active',         sub: 'Global reach from Nigeria'     },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(212,168,67,0.12)',
                    border: '1px solid rgba(212,168,67,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                  }}>
                    <Icon size={14} color={C.gold} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.2 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — form */}
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div className="auth-shell" style={{
              background: C.white, borderRadius: 16,
              border: `1px solid ${C.border}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              padding: '36px',
            }}>
              <div style={{ marginBottom: 26 }}>
                <h1 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em',
                  color: C.text, margin: '0 0 5px',
                }}>Create Account</h1>
                <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
                  Join Africa's verified trade marketplace
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Role selector */}
                <div>
                  <span className="auth-label">I want to</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {([
                      { role: 'exporter' as const, icon: Building2, label: 'Export', sub: 'I sell Nigerian products globally' },
                      { role: 'buyer'    as const, icon: Globe,     label: 'Buy',    sub: 'I source products from Nigeria'   },
                    ] as const).map(({ role, icon: Icon, label, sub }) => (
                      <button
                        key={role}
                        type="button"
                        className={`auth-role-card${selectedRole === role ? ' active' : ''}`}
                        onClick={() => setValue('role', role)}
                      >
                        {selectedRole === role && (
                          <div style={{
                            position: 'absolute', top: 10, right: 10,
                            width: 18, height: 18, borderRadius: '50%',
                            background: C.gold,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check size={10} color={C.white} />
                          </div>
                        )}
                        <div style={{
                          width: 38, height: 38, borderRadius: 9,
                          background: selectedRole === role ? C.greenDeep : C.gray100,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.18s',
                        }}>
                          <Icon size={17} color={selectedRole === role ? C.gold : C.textMuted} />
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.4 }}>{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name + Email */}
                <div className="auth-2col">
                  <div>
                    <label className="auth-label">Full Name</label>
                    <input
                      type="text"
                      autoComplete="name"
                      {...register('fullName')}
                      className="auth-input"
                      placeholder="John Okafor"
                    />
                    {errors.fullName && <p className="auth-error">{errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className="auth-label">Email Address</label>
                    <input
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      className="auth-input"
                      placeholder="john@example.com"
                    />
                    {errors.email && <p className="auth-error">{errors.email.message}</p>}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="auth-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('password')}
                      className="auth-input"
                      placeholder="Min. 8 characters"
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

                  {/* Strength bar */}
                  {passwordVal.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 2,
                            background: i < strengthScore
                              ? (strengthScore === 1 ? C.danger : strengthScore === 2 ? C.gold : C.greenMid)
                              : C.border,
                            transition: 'background 0.25s',
                          }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                        {strengthChecks.map(({ label, pass }) => (
                          <span key={label} style={{
                            fontSize: 10, fontWeight: 600, color: pass ? C.greenMid : C.textMuted,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <span style={{ fontSize: 9 }}>{pass ? '✓' : '○'}</span> {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="auth-label">Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                      className="auth-input"
                      placeholder="Repeat your password"
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                      position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted,
                      display: 'flex', alignItems: 'center',
                    }}>
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="auth-error">{errors.confirmPassword.message}</p>}
                </div>

                {/* Terms */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input type="checkbox" {...register('terms')} className="auth-checkbox" />
                  <label style={{ fontSize: 12.5, color: C.textSub, lineHeight: 1.6 }}>
                    I agree to the{' '}
                    <Link to="/terms" style={{ fontWeight: 700, color: C.greenMid, textDecoration: 'none' }}>Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" style={{ fontWeight: 700, color: C.greenMid, textDecoration: 'none' }}>Privacy Policy</Link>
                  </label>
                </div>
                {errors.terms && <p className="auth-error" style={{ marginTop: -12 }}>{errors.terms.message}</p>}

                {/* Submit */}
                <button type="submit" disabled={loading} className="auth-btn" style={{ marginTop: 4 }}>
                  {loading
                    ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'lp-spin 0.8s linear infinite' }} />
                    : <><span>Create Account</span><ArrowRight size={15} /></>
                  }
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>or</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>

                <p style={{ textAlign: 'center', fontSize: 13, color: C.textSub, margin: 0 }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ fontWeight: 700, color: C.greenMid, textDecoration: 'none' }}>
                    Log In
                  </Link>
                </p>
              </form>

              {/* Security footer */}
              <div style={{
                marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.border}`,
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
    </>
  )
}