-- 用户生成的 AI 简报（Markdown），用于历史列表、删除与邮件发送
create table if not exists public.saved_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_type text not null check (period_type in ('day', 'week', 'month', 'year')),
  reference_date date not null,
  period_start date not null,
  period_end date not null,
  body_markdown text not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_briefs_user_created_idx
  on public.saved_briefs (user_id, created_at desc);

alter table public.saved_briefs enable row level security;

create policy "saved_briefs_select_own"
  on public.saved_briefs for select
  using (auth.uid() = user_id);

create policy "saved_briefs_insert_own"
  on public.saved_briefs for insert
  with check (auth.uid() = user_id);

create policy "saved_briefs_delete_own"
  on public.saved_briefs for delete
  using (auth.uid() = user_id);
