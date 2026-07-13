// client/lib/dojah.ts
// UNIFIED — Auto-switches: mock in dev, real API in production
// Falls back to direct fetch if supabase.function is unavailable (bundler issues)

import { supabase } from './supabase/client';

const IS_DEV = import.meta.env.DEV;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface CACResult {
  verified: boolean;
  rc_number?: string;
  company_name?: string;
  company_type?: string;
  registration_date?: string;
  raw?: any;
  error?: string;
  manualFallback?: boolean;
}

export interface NINResult {
  verified: boolean;
  error?: string;
  raw?: any;
  manualFallback?: boolean;
}

// ─── MOCK DATA (local dev only) ──────────────────────────────────────────
async function mockVerifyCAC(rcNumber: string): Promise<CACResult> {
  await new Promise(r => setTimeout(r, 800));
  const normalized = rcNumber.trim().toUpperCase();

  if (normalized === 'RC1234567') {
    return {
      verified: true,
      rc_number: normalized,
      company_name: 'IziXport Test Ventures Ltd',
      company_type: 'Private Limited Company',
      registration_date: '2022-03-15',
      raw: { entity: [{ rc_number: normalized, company_name: 'IziXport Test Ventures Ltd' }] },
    };
  }

  if (normalized === 'RC0000000') {
    return {
      verified: false,
      error: 'Dojah verification service returned an error (503). You can submit your documents for manual admin review instead.',
      manualFallback: true,
    };
  }

  if (normalized === 'RC9999999') {
    return {
      verified: false,
      error: 'Verification service is not configured. Please submit your documents for manual review — our admin team will verify your CAC within 24 hours.',
      manualFallback: true,
    };
  }

  return {
    verified: false,
    error: 'CAC record not found for this RC number. Please check the number and try again, or submit for manual review.',
    manualFallback: true,
  };
}

async function mockVerifyNIN(nin: string): Promise<NINResult> {
  await new Promise(r => setTimeout(r, 800));
  const normalized = nin.trim();

  if (normalized === '12345678901') {
    return {
      verified: true,
      raw: { entity: { nin: normalized, firstname: 'Chinedu', surname: 'Okonkwo' } },
    };
  }

  if (normalized === '00000000000') {
    return {
      verified: false,
      error: 'NIN verification service error (503). Submit for manual review instead.',
      manualFallback: true,
    };
  }

  if (normalized === '99999999999') {
    return {
      verified: false,
      error: 'NIN verification is not configured. You can still submit your documents for manual admin review.',
      manualFallback: true,
    };
  }

  return {
    verified: false,
    error: 'NIN record not found. Please check the number or submit for manual review.',
    manualFallback: true,
  };
}

// ─── REAL API CALLER ─────────────────────────────────────────────────────
async function callEdgeFunction(functionName: string, body: any) {
  // Try supabase.function.invoke first (production)
  const funcModule = (supabase as any).function || (supabase as any).functionS;

  if (funcModule?.invoke) {
    return funcModule.invoke(functionName, { body });
  }

  // Fallback: direct fetch (works in production, CORS issues only on localhost)
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || SUPABASE_ANON_KEY;

  const res = await fetch(`${SUPABASE_URL}/functionS/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return { data, error: null };
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────
export async function verifyCACNumber(rcNumber: string): Promise<CACResult> {
  if (IS_DEV) {
    return mockVerifyCAC(rcNumber);
  }

  try {
    const { data, error } = await callEdgeFunction('verify-cac', {
      rc_number: rcNumber.trim().toUpperCase(),
    });

    if (error) {
      return {
        verified: false,
        error: error.message || 'Verification service unavailable. Submit for manual review.',
        manualFallback: true,
      };
    }

    if (data?.error) {
      return {
        verified: false,
        error: data.error,
        manualFallback: true,
      };
    }

    if (data?.verified) {
      return {
        verified: true,
        rc_number: data.rc_number,
        company_name: data.company_name,
        company_type: data.company_type,
        registration_date: data.registration_date,
        raw: data.raw,
      };
    }

    return {
      verified: false,
      error: data?.message || 'CAC not found. Check the number or submit for manual review.',
      manualFallback: true,
    };
  } catch (err: any) {
    return {
      verified: false,
      error: err?.message || 'Something went wrong. Submit for manual review.',
      manualFallback: true,
    };
  }
}

export async function verifyNINNumber(nin: string): Promise<NINResult> {
  if (IS_DEV) {
    return mockVerifyNIN(nin);
  }

  try {
    const { data, error } = await callEdgeFunction('verify-nin', {
      nin: nin.trim(),
    });

    if (error) {
      return {
        verified: false,
        error: error.message || 'NIN verification unavailable. Submit for manual review.',
        manualFallback: true,
      };
    }

    if (data?.error) {
      return {
        verified: false,
        error: data.error,
        manualFallback: true,
      };
    }

    if (data?.verified) {
      return {
        verified: true,
        raw: data.raw,
      };
    }

    return {
      verified: false,
      error: data?.message || 'NIN not found. Check the number or submit for manual review.',
      manualFallback: true,
    };
  } catch (err: any) {
    return {
      verified: false,
      error: err?.message || 'Something went wrong. Submit for manual review.',
      manualFallback: true,
    };
  }
}