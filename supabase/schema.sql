create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9-]{2,31}$')
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public"
  on public.profiles
  for select
  using (true);

drop policy if exists "users create own profile" on public.profiles;
create policy "users create own profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own profile" on public.profiles;
create policy "users delete own profile"
  on public.profiles
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create table if not exists public.profile_comments (
  id uuid primary key default gen_random_uuid(),
  profile_username text not null references public.profiles (username) on delete cascade,
  scope text not null check (scope in ('guestbook', 'block')),
  block_id text,
  author text not null default '이름 없는 방문자',
  body text not null,
  created_at timestamptz not null default now(),
  constraint profile_comments_body_length check (char_length(body) between 1 and 280),
  constraint profile_comments_author_length check (char_length(author) between 1 and 24),
  constraint profile_comments_target check (
    (scope = 'guestbook' and block_id is null)
    or (scope = 'block' and block_id is not null)
  )
);

create index if not exists profile_comments_profile_created_at_idx
  on public.profile_comments (profile_username, created_at);

create index if not exists profile_comments_block_idx
  on public.profile_comments (profile_username, block_id, created_at)
  where scope = 'block';

alter table public.profile_comments enable row level security;

drop policy if exists "profile comments are public" on public.profile_comments;
create policy "profile comments are public"
  on public.profile_comments
  for select
  using (true);

drop policy if exists "visitors create profile comments" on public.profile_comments;
create policy "visitors create profile comments"
  on public.profile_comments
  for insert
  with check (true);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author text not null,
  title text not null,
  body text not null,
  category text not null check (category in ('잡담', '질문', '추천', '공지')),
  tags text[] not null default '{}',
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_author_length check (char_length(author) between 1 and 24),
  constraint community_posts_title_length check (char_length(title) between 1 and 120),
  constraint community_posts_body_length check (char_length(body) between 1 and 4000),
  constraint community_posts_views_positive check (views >= 0)
);

create index if not exists community_posts_created_at_idx
  on public.community_posts (created_at desc);

create index if not exists community_posts_category_created_at_idx
  on public.community_posts (category, created_at desc);

alter table public.community_posts enable row level security;

drop policy if exists "community posts are public" on public.community_posts;
create policy "community posts are public"
  on public.community_posts
  for select
  using (true);

drop policy if exists "members create community posts" on public.community_posts;
create policy "members create community posts"
  on public.community_posts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "members update own community posts" on public.community_posts;
create policy "members update own community posts"
  on public.community_posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "members delete own community posts" on public.community_posts;
create policy "members delete own community posts"
  on public.community_posts
  for delete
  using (auth.uid() = user_id);

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row
  execute function public.set_updated_at();

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint community_replies_author_length check (char_length(author) between 1 and 24),
  constraint community_replies_body_length check (char_length(body) between 1 and 1000)
);

create index if not exists community_replies_post_created_at_idx
  on public.community_replies (post_id, created_at);

alter table public.community_replies enable row level security;

drop policy if exists "community replies are public" on public.community_replies;
create policy "community replies are public"
  on public.community_replies
  for select
  using (true);

drop policy if exists "members create community replies" on public.community_replies;
create policy "members create community replies"
  on public.community_replies
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "members update own community replies" on public.community_replies;
create policy "members update own community replies"
  on public.community_replies
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "members delete own community replies" on public.community_replies;
create policy "members delete own community replies"
  on public.community_replies
  for delete
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile images are public" on storage.objects;
create policy "profile images are public"
  on storage.objects
  for select
  using (bucket_id = 'profile-images');

drop policy if exists "users upload own profile images" on storage.objects;
create policy "users upload own profile images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users update own profile images" on storage.objects;
create policy "users update own profile images"
  on storage.objects
  for update
  using (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users delete own profile images" on storage.objects;
create policy "users delete own profile images"
  on storage.objects
  for delete
  using (
    bucket_id = 'profile-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;

grant select on public.profile_comments to anon, authenticated;
grant insert on public.profile_comments to anon, authenticated;

grant select on public.community_posts to anon, authenticated;
grant insert, update, delete on public.community_posts to authenticated;

grant select on public.community_replies to anon, authenticated;
grant insert, update, delete on public.community_replies to authenticated;
