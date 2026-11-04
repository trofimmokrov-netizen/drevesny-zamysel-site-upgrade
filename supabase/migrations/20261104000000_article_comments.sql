create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_slug text not null check (article_slug in (
    'metallicheskiy-karkas', 'porody-drevesiny', 'zamer-lestnicy',
    'otkrytaya-ili-zakrytaya', 'skolko-mesta-zanimaet', 'kogda-planirovat',
    'ograzhdenie-poruchen', 'obshivka-betonnoy-lestnicy', 'podsvetka-stupeney',
    'uhod-za-derevyannymi-stupenyami'
  )),
  email text not null check (char_length(email) between 5 and 254),
  body text not null check (char_length(body) between 5 and 3000),
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists article_comments_public_idx
  on public.article_comments (article_slug, created_at desc)
  where is_approved = true;

alter table public.article_comments enable row level security;
revoke all on public.article_comments from anon, authenticated;
grant all on public.article_comments to service_role;

create table if not exists public.article_comment_rate_limits (
  visitor_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 0
);

alter table public.article_comment_rate_limits enable row level security;
revoke all on public.article_comment_rate_limits from anon, authenticated;
grant all on public.article_comment_rate_limits to service_role;

create or replace function public.consume_article_comment_rate_limit(
  p_visitor_hash text,
  p_now timestamptz
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  insert into public.article_comment_rate_limits as current_limit
    (visitor_hash, window_started_at, request_count)
  values (p_visitor_hash, p_now, 1)
  on conflict (visitor_hash) do update
    set window_started_at = case
          when current_limit.window_started_at <= p_now - interval '1 hour' then p_now
          else current_limit.window_started_at
        end,
        request_count = case
          when current_limit.window_started_at <= p_now - interval '1 hour' then 1
          else current_limit.request_count + 1
        end
  returning request_count into v_count;

  return v_count;
end;
$$;

revoke all on function public.consume_article_comment_rate_limit(text, timestamptz) from public, anon, authenticated;
grant execute on function public.consume_article_comment_rate_limit(text, timestamptz) to service_role;
