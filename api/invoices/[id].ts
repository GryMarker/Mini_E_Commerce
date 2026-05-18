import { getAuthenticatedUser, getSupabase } from '../_shared.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    const { user, error: authError } = await getAuthenticatedUser(req, supabase);
    if (authError || !user) return res.status(401).json({ error: authError });

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', req.query.id)
      .eq('customer_id', user.id)
      .single();

    if (invoiceError) throw invoiceError;
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const productIds = String(invoice.products || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    let products: any[] = [];
    if (productIds.length > 0) {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image, category, description')
        .in('id', productIds);
      if (error) throw error;
      products = data || [];
    }

    return res.status(200).json({ ...invoice, product_items: products });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
