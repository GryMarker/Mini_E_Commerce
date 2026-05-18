create extension if not exists "uuid-ossp";

create table if not exists public.products (
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

create table if not exists public.invoices (
  id uuid default uuid_generate_v4() primary key,
  stripe_session_id text not null unique,
  customer_id uuid references auth.users(id),
  products text,
  amount_total numeric,
  payment_status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.products enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "Products are readable by everyone" on public.products;
create policy "Products are readable by everyone"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "Users can read their own invoices" on public.invoices;
create policy "Users can read their own invoices"
on public.invoices
for select
to authenticated
using (customer_id = auth.uid());

insert into public.products (name, price, image, stock, category, rating, sold, badge, description)
select *
from (
  values
    ('Premium Wireless Headphones', 299, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop', 25, 'Audio', 4.8, 1280, 'Top Rated', 'Noise-isolating wireless headphones with long battery life.'),
    ('Mechanical Keyboard', 149, 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=600&auto=format&fit=crop', 30, 'Workspace', 4.7, 860, 'Hot', 'Tactile keyboard for focused typing and gaming setups.'),
    ('Ergonomic Mouse', 79, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=600&auto=format&fit=crop', 40, 'Workspace', 4.6, 710, 'Best Value', 'Comfortable daily mouse with precise tracking.'),
    ('4K Portable Monitor', 249, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop', 18, 'Displays', 4.7, 540, 'New', 'Slim USB-C monitor for mobile workstations.'),
    ('USB-C Docking Station', 119, 'https://images.unsplash.com/photo-1625842268584-8f3296236761?q=80&w=600&auto=format&fit=crop', 32, 'Accessories', 4.5, 680, 'Fast Ship', 'Multi-port hub for displays, charging, and peripherals.'),
    ('Smart Fitness Watch', 189, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop', 22, 'Wearables', 4.6, 920, 'Popular', 'Lightweight fitness tracker with health and notification tools.'),
    ('Compact Bluetooth Speaker', 89, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=600&auto=format&fit=crop', 45, 'Audio', 4.4, 1120, 'Deal', 'Portable speaker with punchy sound for small rooms.'),
    ('Laptop Stand Pro', 69, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=600&auto=format&fit=crop', 50, 'Workspace', 4.5, 760, 'Best Value', 'Adjustable aluminum stand for cleaner desk ergonomics.'),
    ('HD Webcam', 99, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=600&auto=format&fit=crop', 28, 'Accessories', 4.3, 430, null, 'Crisp video calls with simple plug-and-play setup.'),
    ('Gaming Controller', 129, 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?q=80&w=600&auto=format&fit=crop', 35, 'Gaming', 4.7, 830, 'Hot', 'Wireless controller for PC and cloud gaming.'),
    ('Minimal Desk Lamp', 59, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop', 60, 'Workspace', 4.4, 390, null, 'Focused desk lighting with a compact footprint.'),
    ('Travel Tech Organizer', 39, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop', 75, 'Accessories', 4.6, 1250, 'Top Seller', 'Pouch for cables, chargers, adapters, and small devices.')
) as seed(name, price, image, stock, category, rating, sold, badge, description)
where not exists (
  select 1 from public.products where public.products.name = seed.name
);
