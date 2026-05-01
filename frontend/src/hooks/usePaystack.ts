import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

export interface Bank {
  name: string;
  code: string;
}

// ─── Single subaccount entry (matches backend subaccounts array items) ────────
export interface SubaccountData {
  subaccount_code: string | null;
  id: number | null;
  domain: string | null;
  business_name: string | null;
  description: string | null;
  product: string | null;
  bank_name: string | null;
  bank_code: string | null;
  account_name: string | null;
  account_number: string | null;
  settlement_schedule: string | null;
  percentage_charge: number | null;
  currency: string | null;
  is_verified: boolean | null;
  active: boolean | null;
  migrate: boolean | null;
  integration: number | null;
  managed_by_integration: number | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── Top-level status response ────────────────────────────────────────────────
export interface SubaccountStatus {
  success: boolean;
  has_subaccount: boolean;
  subaccounts: SubaccountData[];
}

export interface PaymentInitResult {
  success: boolean;
  authorization_url?: string;
  reference?: string;
  access_code?: string;
  amount?: number;
  has_split?: boolean;
  error?: string;
}

const base = API_BASE_URL || 'http://127.0.0.1:5000';

// ─── Fetch banks ──────────────────────────────────────────────────────────────
export const useBanks = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${base}/api/paystack/banks`)
      .then(r => r.json())
      .then(d => { if (d.success) setBanks(d.banks); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { banks, loading };
};

// ─── Verify bank account ──────────────────────────────────────────────────────
export const verifyAccount = async (account_number: string, bank_code: string) => {
  const res = await fetch(`${base}/api/paystack/verify-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_number, bank_code })
  });
  return res.json();
};

// ─── Create subaccount ────────────────────────────────────────────────────────
export const createSubaccount = async (payload: {
  user_id: string;
  business_name: string;
  account_number: string;
  bank_code: string;
  account_name: string;
}) => {
  const res = await fetch(`${base}/api/paystack/create-subaccount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
};

// ─── Remove subaccount ────────────────────────────────────────────────────────
export const removeSubaccount = async (user_id: string, subaccount_code: string) => {
  const res = await fetch(`${base}/api/paystack/remove-subaccount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, subaccount_code })
  });
  return res.json();
};

// ─── Subaccount status ────────────────────────────────────────────────────────
export const useSubaccountStatus = (user_id: string | undefined) => {
  const [status, setStatus] = useState<SubaccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!user_id) return;
    setLoading(true);
    fetch(`${base}/api/paystack/subaccount-status?user_id=${user_id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setStatus(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user_id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { status, loading, refetch };
};

// ─── Initialize payment ───────────────────────────────────────────────────────
export const initializePayment = async (invoice_id: string, email: string): Promise<PaymentInitResult> => {
  const res = await fetch(`${base}/api/paystack/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id, email })
  });
  return res.json();
};

// ─── Verify payment ───────────────────────────────────────────────────────────
export const verifyPayment = async (reference: string) => {
  const res = await fetch(`${base}/api/paystack/verify/${reference}`);
  return res.json();
};