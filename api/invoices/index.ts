import { getAuthenticatedUser, getSupabase } from '../_shared.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    const { user, error: authError } = await getAuthenticatedUser(req, supabase);
    if (authError || !user) return res.status(401).json({ error: authError });

    const customerId = req.query.customerId;
    if (customerId && customerId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
