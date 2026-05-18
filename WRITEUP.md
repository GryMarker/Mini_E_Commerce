# Short Write-Up

## Design Choices

My Mini-E Commerce is built with React and Vite because the exam scope is a focused single-page checkout flow. React keeps the UI modular across catalog, cart, auth, success, and invoice screens, while Vite keeps local development and Vercel deployment straightforward.

The UI follows familiar marketplace patterns: searchable catalog, category filters, sorting, product cards, product detail pages, cart quantity controls, invoice history, and invoice detail pages. Motion animations are used for page transitions and interaction feedback without changing the core checkout flow.

## Supabase Usage

Supabase is used for:

- Email/password authentication with Supabase Auth.
- Product storage in `public.products`.
- Invoice storage in `public.invoices`.
- Row Level Security on exposed public tables.

Products include required exam fields (`name`, `price`, `stock`) plus merchandising fields (`category`, `rating`, `sold`, `badge`, `description`) for a richer storefront. Invoices store the required fields: invoice ID, customer ID, product IDs, total amount, payment status, and created date.

## Payment and Invoice Flow

Stripe Checkout is created through a secure backend API route. The frontend sends only product IDs and quantities. The server verifies the Supabase session, reloads trusted product prices from Supabase, creates the Stripe Checkout Session, and returns the hosted Checkout URL.

Stripe webhook events record invoice status:

- `checkout.session.completed` -> `paid`
- `checkout.session.expired` -> `expired`
- `checkout.session.async_payment_failed` -> `failed`

## Security Considerations

- Stripe secret key and Supabase service role key are server-only environment variables.
- The browser only receives the Supabase anon key and public Stripe publishable key.
- Checkout requests require a valid Supabase access token.
- Product prices are never trusted from the client during checkout.
- Invoice API responses are scoped to the authenticated user's `customer_id`.
- RLS allows public product reads but restricts invoice reads to the owning user.
- Webhook signature verification is enabled through `STRIPE_WEBHOOK_SECRET`.
