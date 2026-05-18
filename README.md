# My Mini-E Commerce

Supabase-powered e-commerce mini-system built for the technical exam. The app includes a marketplace-style product catalog, Supabase authentication, cart checkout with Stripe, webhook-based invoice recording, and invoice detail views.

## Deliverables

- **Source Code:** GitHub repository for the full React/Vite app and API routes.
- **Deployment:** Vercel-ready configuration in [vercel.json](./vercel.json).
- **Database Schema:** Supabase SQL schema in [supabase_schema.sql](./supabase_schema.sql).
- **Demo Instructions:** Local setup steps are documented below.
- **Short Write-Up:** Design, Supabase usage, and security notes in [WRITEUP.md](./WRITEUP.md).

## Features

- Product catalog stored in Supabase
- Search, category filters, price filter, sorting, product detail pages
- Supabase email/password sign-up and sign-in
- Cart with quantity controls
- Secure Stripe Checkout Session creation through backend API
- Stripe webhook invoice recording
- Invoice list and clickable invoice detail pages
- Row Level Security for product and invoice data
- System-wide UI animations

## Tech Stack

- React 19
- Vite
- TypeScript
- Supabase Auth and Postgres
- Stripe Checkout
- Express for local API development
- Vercel serverless functions for deployment
- Tailwind CSS v4
- Motion for animations

## Local Demo Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

```env
APP_URL="http://localhost:3000"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Set up Supabase

Open Supabase SQL Editor and run:

```sql
-- See full file:
-- supabase_schema.sql
```

The schema creates:

- `products`
- `invoices`
- product RLS read policy
- invoice owner-only RLS read policy
- seed products

For demo signups, enable email/password auth:

1. Supabase Dashboard -> Authentication -> Providers
2. Enable Email provider
3. Enable "Allow new users to sign up"
4. For local testing, disable email confirmation if you do not want to configure SMTP

### 4. Start local app

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 5. Start Stripe webhook forwarding

In another terminal:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET` in `.env`, then restart `npm run dev`.

### 6. Test checkout

Use Stripe test card:

```text
4242 4242 4242 4242
```

Use any future expiry date, any CVC, and any ZIP/postal code.

After successful payment:

1. Stripe redirects to `/success`.
2. Webhook records invoice in Supabase.
3. Open `/invoices`.
4. Click the invoice row to see purchased items.

## Vercel Deployment

1. Push this repo to GitHub.
2. Import the GitHub repo in Vercel.
3. Set these Vercel environment variables:

```env
APP_URL="https://your-vercel-domain.vercel.app"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

4. Deploy with:

```bash
npm run build
```

Vercel serves the Vite app from `dist` and API routes from `api/`.

### Stripe Webhook for Vercel

In Stripe Dashboard, create a webhook endpoint:

```text
https://your-vercel-domain.vercel.app/api/webhook
```

Listen for:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_failed`

Copy the webhook signing secret to Vercel as `STRIPE_WEBHOOK_SECRET`.

## Checks

```bash
npm run lint
npm run build
```
