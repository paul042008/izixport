// src/pages/dashboard/BankDetails.tsx
// REDESIGN — Executive Emerald. All business logic preserved.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, CheckCircle2, Landmark, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { DS, sectionLabel } from '@/lib/dashboard/theme'
import { NIGERIAN_BANKS } from '@/lib/dashboard/nigerian-banks'
import '@/styles/marketplace.css'

// Extend the theme locally to include missing design tokens
const theme = {
  ...DS,
  emerald: '#10B981',
  emeraldLight: '#D1FAE5',
  goldDark: '#B8860B',
  goldLight: '#FEF3C7',
  surfaceAlt: '#F3F4F6',
  fontHeading: 'Inter, sans-serif',
} as const

interface BankProfile {
  bank_name?: string | null
  bank_account_number?: string | null
  bank_account_name?: string | null
  bank_code?: string | null
  payout_verified?: boolean | null
}

export default function BankDetails() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [profile, setProfile] = useState<BankProfile | null>(null)
  const [bankName, setBankName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      const { data, error } = await supabase
        .from('users')
        .select('bank_name,bank_account_number,bank_account_name,bank_code,payout_verified')
        .eq('id', session.user.id)
        .single()
      if (error) {
        toast.error('Failed to load bank details')
        navigate('/dashboard/exporter/profile')
        return
      }
      setProfile(data)
      if (data?.payout_verified) {
        setBankName(data.bank_name || '')
        setBankCode(data.bank_code || '')
        setAccountNumber(data.bank_account_number || '')
        setAccountName(data.bank_account_name || '')
        setVerified(true)
      }
      setLoading(false)
    }
    init()
  }, [navigate])

  const handleBankChange = (name: string) => {
    setBankName(name)
    const bank = NIGERIAN_BANKS.find(b => b.name === name)
    setBankCode(bank?.code ?? '')
    setAccountName('')
    setVerified(false)
  }

  const verifyAccount = async () => {
    if (!/^\d{10}$/.test(accountNumber)) { toast.error('Enter a valid 10-digit account number'); return }
    if (!bankCode || bankCode === '000') { toast.error('Select your bank from the list'); return }
    setVerifying(true)
    try {
      const res = await fetch('/api/paystack/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Verification failed')
      setAccountName(json.account_name)
      setVerified(true)
      toast.success('Account verified')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not verify account'
      toast.error(msg)
      setVerified(false)
    } finally {
      setVerifying(false)
    }
  }

  const handleSave = async () => {
    if (!verified || !accountName) { toast.error('Verify your account number first'); return }
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { error } = await supabase
      .from('users')
      .update({
        bank_name: bankName,
        bank_account_number: accountNumber,
        bank_account_name: accountName,
        bank_code: bankCode,
        payout_verified: true,
      })
      .eq('id', session.user.id)
    setSaving(false)
    if (error) { toast.error(error.message || 'Failed to save'); return }
    toast.success('Bank details saved')
    setProfile({
      bank_name: bankName,
      bank_account_number: accountNumber,
      bank_account_name: accountName,
      bank_code: bankCode,
      payout_verified: true,
    })
  }

  const last4 = profile?.bank_account_number?.slice(-4) ?? accountNumber.slice(-4)

  if (loading) {
    return (
      <div className="mk-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 size={28} className="mk-spin" style={{ color: theme.emerald }} />
      </div>
    )
  }

  return (
    <div className="mk-root">
      <div className="mk-container-narrow mk-fade-up" style={{ maxWidth: 600 }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard/exporter/profile')}
          className="mk-btn mk-btn-ghost mk-btn-sm"
          style={{ padding: '6px 10px', marginBottom: 18 }}
        >
          <ChevronLeft size={16} /> Back
        </button>

        <p style={sectionLabel}>Payments</p>
        <h1 className="mk-h1" style={{ marginBottom: 8 }}>Bank account</h1>
        <p className="mk-text-secondary" style={{ marginBottom: 28, fontSize: 14 }}>
          Your payout account for completed deals.
        </p>

        {profile?.payout_verified ? (
          <div className="mk-card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: theme.emeraldLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={22} style={{ color: theme.emerald }} />
              </div>
              <div>
                <p style={{ fontFamily: theme.fontHeading, fontWeight: 700, color: theme.text, margin: 0, fontSize: 16 }}>Account verified</p>
                <p style={{ color: theme.textSecondary, fontSize: 13, margin: '2px 0 0' }}>
                  Payouts arrive after each completed deal
                </p>
              </div>
            </div>

            <div style={{ background: theme.surfaceAlt, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="mk-text-muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Bank</span>
                <span style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>{profile.bank_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mk-text-muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Account</span>
                <span className="mk-num" style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>•••• {last4}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setProfile(null); setVerified(false); setAccountName('') }}
              className="mk-btn mk-btn-outline mk-btn-block"
            >
              Change account
            </button>
          </div>
        ) : (
          <div className="mk-card" style={{ padding: 24 }}>
            <div style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              background: theme.goldLight, border: `1px solid ${theme.gold}55`,
              borderRadius: 12, padding: '14px 16px', marginBottom: 22,
            }}>
              <Landmark size={18} style={{ color: theme.goldDark, flexShrink: 0, marginTop: 2 }} />
              <p style={{ color: theme.text, fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>
                Add your Nigerian bank account. Earnings are paid here automatically after each deal completes.
              </p>
            </div>

            <label className="mk-label">Bank name</label>
            <div className="mk-select-wrap" style={{ marginBottom: 16 }}>
              <select
                className="mk-field"
                value={bankName}
                onChange={e => handleBankChange(e.target.value)}
                style={{ paddingRight: 36 }}
              >
                <option value="">Select bank</option>
                {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
              </select>
            </div>

            <label className="mk-label">Account number</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={e => { setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); setVerified(false); setAccountName('') }}
              onBlur={() => { if (accountNumber.length === 10) verifyAccount() }}
              placeholder="10-digit account number"
              className="mk-field mk-num"
              style={{ marginBottom: 8 }}
            />
            {verifying && (
              <p className="mk-text-muted" style={{ fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={12} className="mk-spin" /> Verifying…
              </p>
            )}
            {accountName && verified && (
              <p style={{ color: theme.emerald, fontSize: 13, fontWeight: 600, margin: '6px 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={14} /> {accountName}
              </p>
            )}

            <label className="mk-label" style={{ marginTop: 12 }}>Account name</label>
            <input
              readOnly
              value={accountName}
              placeholder="Auto-filled after verification"
              className="mk-field"
              style={{ background: theme.surfaceAlt, marginBottom: 24, color: theme.textSecondary }}
            />

            <button
              type="button"
              disabled={saving || !verified}
              onClick={handleSave}
              className="mk-btn mk-btn-dark mk-btn-block"
            >
              {saving ? (<><Loader2 size={16} className="mk-spin" /> Saving…</>) : 'Save bank details'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}