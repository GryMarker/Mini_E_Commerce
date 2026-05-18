import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY missing');
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });
}

export function getSupabase() {
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials missing');
  }

  return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getAuthenticatedUser(req: any, supabase = getSupabase()) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { user: null, error: 'Unauthorized' };

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { user: null, error: 'Invalid session' };

  return { user: data.user, error: null };
}

export async function readRawBody(req: any) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
