grant usage on schema public to anon, authenticated;

do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'grant select on public.profiles to anon, authenticated';
    execute 'grant insert, update, delete on public.profiles to authenticated';
  end if;

  if to_regclass('public.profile_comments') is not null then
    execute 'grant select on public.profile_comments to anon, authenticated';
    execute 'grant insert on public.profile_comments to anon, authenticated';
  end if;

  if to_regclass('public.community_posts') is not null then
    execute 'grant select on public.community_posts to anon, authenticated';
    execute 'grant insert, update, delete on public.community_posts to authenticated';
  end if;

  if to_regclass('public.community_replies') is not null then
    execute 'grant select on public.community_replies to anon, authenticated';
    execute 'grant insert, update, delete on public.community_replies to authenticated';
  end if;
end $$;
