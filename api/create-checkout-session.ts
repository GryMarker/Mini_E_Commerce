import { getAuthenticatedUser, getStripe, getSupabase } from './_shared.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = getStripe();
    const supabase = getSupabase();
    const { user, error: authError } = await getAuthenticatedUser(req, supabase);
    if (authError || !user) return res.status(401).json({ error: authError });

    const { items } = req.body as { items?: Array<{ id: string; amount: number }> };
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const requestedItems = items.map((item) => ({
      id: item.id,
      amount: Math.max(1, Math.floor(Number(item.amount) || 1)),
    }));
    const productIds = [...new Set(requestedItems.map((item) => item.id))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .in('id', productIds);

    if (productsError) throw productsError;
    if (!products || products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more cart items are unavailable' });
    }

    const productsById = new Map(products.map((product: any) => [product.id, product]));
    const lineItems = requestedItems.map((item) => {
      const product: any = productsById.get(item.id);
      if (typeof product.stock === 'number' && product.stock < item.amount) {
        throw new Error(`${product.name} does not have enough stock`);
      }
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
          },
          unit_amount: Math.round(Number(product.price) * 100),
        },
        quantity: item.amount,
      };
    });

    const appUrl = process.env.APP_URL || `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
      metadata: {
        customerId: user.id,
        productIds: requestedItems.map((i) => i.id).join(','),
      },
    });

    if (!session.url) throw new Error('Stripe did not return a Checkout Session URL.');

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error('Checkout Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
