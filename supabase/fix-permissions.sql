grant usage on schema public to anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;

grant select on public.profile_comments to anon, authenticated;
grant insert on public.profile_comments to anon, authenticated;

grant select on public.community_posts to anon, authenticated;
grant insert, update, delete on public.community_posts to authenticated;

grant select on public.community_replies to anon, authenticated;
grant insert, update, delete on public.community_replies to authenticated;
