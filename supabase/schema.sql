-- ============================================================
-- SCHEMA SQL — Application de gestion de dépenses personnelles
-- À copier-coller dans Supabase > SQL Editor > New query > Run
-- ============================================================

-- Extension nécessaire pour générer des UUID
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. Table "profiles"
--    Un profil par utilisateur (lié à auth.users de Supabase)
--    Contient le lien avec Telegram
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  telegram_chat_id text unique,          -- id du chat Telegram une fois lié
  telegram_link_code text unique,        -- code temporaire à envoyer au bot pour lier le compte
  currency text default 'FCFA',
  created_at timestamptz default now()
);

-- Génère automatiquement un profil + un code de liaison à la création d'un compte
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, telegram_link_code)
  values (
    new.id,
    new.email,
    upper(substr(md5(random()::text || new.id::text), 1, 6))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Table "expenses"
--    Chaque dépense appartient à un utilisateur
-- ------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'autre',
  description text,
  source text default 'web',             -- 'web' ou 'telegram'
  expense_date date not null default current_date,
  created_at timestamptz default now()
);

create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_expenses_date on public.expenses(expense_date);

-- ------------------------------------------------------------
-- 3. Row Level Security (RLS)
--    Chaque utilisateur ne voit / modifie que SES données
--    Le bot utilise la clé "service_role" qui contourne la RLS
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own"
  on public.expenses for select
  using (auth.uid() = user_id);

drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own"
  on public.expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists "expenses_update_own" on public.expenses;
create policy "expenses_update_own"
  on public.expenses for update
  using (auth.uid() = user_id);

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. Realtime (pour la mise à jour automatique du dashboard)
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.expenses;
