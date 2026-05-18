import { getStripe, getSupabase, readRawBody } from './_shared';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = getStripe();
    const rawBody = await readRawBody(req);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET is not set, skipping webhook validation');
      event = JSON.parse(rawBody.toString());
    } else {
      event = stripe.webhooks.constructEvent(rawBody, sig as string, webhookSecret);
    }
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const statusByEvent: Record<string, string> = {
    'checkout.session.completed': 'paid',
    'checkout.session.expired': 'expired',
    'checkout.session.async_payment_failed': 'failed',
  };

  if (statusByEvent[event.type]) {
    const session = event.data.object as any;
    try {
      const supabase = getSupabase();
      await supabase.from('invoices').upsert(
        {
          stripe_session_id: session.id,
          customer_id: session.metadata.customerId,
          products: session.metadata.productIds,
          amount_total: (session.amount_total || 0) / 100,
          payment_status: statusByEvent[event.type],
        },
        { onConflict: 'stripe_session_id' },
      );
    } catch (err) {
      console.error('Failed to record invoice:', err);
    }
  }

  return res.status(200).json({ received: true });
}
