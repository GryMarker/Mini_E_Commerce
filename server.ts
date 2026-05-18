import express from 'express';
import cors from 'cors';
import path from 'path';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import 'dotenv/config';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use raw body for Stripe webhook
  app.use('/api/webhook', express.raw({ type: 'application/json' }));
  
  // Standard body parser for other routes
  app.use(express.json());
  app.use(cors());

  // Initialize clients lazily or gracefully
  const getStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY missing');
    return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });
  };

  const getSupabase = () => {
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials missing');
    }
    return createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  };

  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const stripe = getStripe();
      const supabase = getSupabase();
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) return res.status(401).json({ error: 'Invalid session' });

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
      
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/cart`,
        metadata: {
          customerId: userData.user.id,
          productIds: requestedItems.map((i) => i.id).join(','),
        }
      });

      if (!session.url) {
        throw new Error('Stripe did not return a Checkout Session URL.');
      }
      
      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error('Checkout Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      const stripe = getStripe();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
         console.warn('STRIPE_WEBHOOK_SECRET is not set, skipping webhook validation');
         event = JSON.parse(req.body.toString());
      } else {
         event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
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
        const invoiceData = {
          stripe_session_id: session.id,
          customer_id: session.metadata.customerId,
          products: session.metadata.productIds,
          amount_total: (session.amount_total || 0) / 100,
          payment_status: statusByEvent[event.type],
        };
        
        await supabase.from('invoices').upsert(invoiceData, { onConflict: 'stripe_session_id' });
        console.log('Invoice recorded successfully for session:', session.id, statusByEvent[event.type]);
      } catch (err) {
        console.error('Failed to record invoice:', err);
      }
    }

    res.json({ received: true });
  });

  app.get('/api/invoices', async (req, res) => {
    try {
      const supabase = getSupabase();
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) return res.status(401).json({ error: 'Invalid session' });

      const customerId = req.query.customerId;
      if (customerId && customerId !== userData.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const query = supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', userData.user.id)
        .order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/invoices/:id', async (req, res) => {
    try {
      const supabase = getSupabase();
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) return res.status(401).json({ error: 'Invalid session' });

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', req.params.id)
        .eq('customer_id', userData.user.id)
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

      res.json({ ...invoice, product_items: products });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
