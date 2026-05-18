# Supabase Setup Guide

This project requires a Supabase backend to be configured. The app expects the following tables to exist. Complete these steps in your Supabase SQL Editor:

## 1. Create `products` table

```sql
create extension if not exists "uuid-ossp";

create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  price numeric not null,
  image text,
  stock integer default 0,
  category text default 'Featured',
  rating numeric default 4.6,
  sold integer default 0,
  badge text,
  description text
);
```

Optional seed data:

```sql
insert into products (name, price, image, stock, category, rating, sold, badge, description) values
  ('Premium Wireless Headphones', 299, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop', 25, 'Audio', 4.8, 1280, 'Top Rated', 'Noise-isolating wireless headphones with long battery life.'),
  ('Mechanical Keyboard', 149, 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=600&auto=format&fit=crop', 30, 'Workspace', 4.7, 860, 'Hot', 'Tactile keyboard for focused typing and gaming setups.'),
  ('Ergonomic Mouse', 79, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=600&auto=format&fit=crop', 40, 'Workspace', 4.6, 710, 'Best Value', 'Comfortable daily mouse with precise tracking.');
```

## 2. Create `invoices` table

```sql
create table invoices (
  id uuid default uuid_generate_v4() primary key,
  stripe_session_id text not null unique,
  customer_id uuid references auth.users(id),
  products text,
  amount_total numeric,
  payment_status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: the actual invoice ID will be automatically generated as UUID 'id', while the 'stripe_session_id' tracks the Stripe session. 
```

For the current mini-system, invoice reads and writes go through the Express server using the Supabase service role key. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## 3. Environment Variables setup

Grab your credentials from Supabase:
- **Project Settings** -> **API**: Copy `URL` and `anon` key, replace `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the secrets or `.env` file.
- **Service Role Key**: Copy the `service_role` key and place it as `SUPABASE_SERVICE_ROLE_KEY`.

In Stripe:
- Grab your **Publishable key** -> `VITE_STRIPE_PUBLISHABLE_KEY`
- Grab your **Secret key** -> `STRIPE_SECRET_KEY`
- Setup a Webhook pointing to `[YOUR_APP_URL]/api/webhook` to listen to `checkout.session.completed` events and grab the endpoint secret -> `STRIPE_WEBHOOK_SECRET`
