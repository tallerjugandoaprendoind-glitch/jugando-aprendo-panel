-- ================================================================
-- parent_session_logs
-- Tracks how long each parent (profiles row) is connected per visit.
-- ================================================================

create table if not exists public.parent_session_logs (
  id               uuid primary key default gen_random_uuid(),
  parent_id        uuid not null references public.profiles(id) on delete cascade,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_seconds int,                 -- filled on session end / periodic sync
  device           text,                -- 'mobile' | 'desktop' | 'unknown'
  created_at       timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────
create index if not exists idx_psl_parent_id   on public.parent_session_logs(parent_id);
create index if not exists idx_psl_started_at  on public.parent_session_logs(started_at desc);

-- ── RLS ──────────────────────────────────────────────────────────
alter table public.parent_session_logs enable row level security;

-- Parents can insert / update their own rows
create policy "parent_session_logs: parents insert own"
  on public.parent_session_logs for insert
  with check (parent_id = auth.uid());

create policy "parent_session_logs: parents update own"
  on public.parent_session_logs for update
  using (parent_id = auth.uid());

-- Admins / service role can read all rows (use service_role key in API)
create policy "parent_session_logs: admin read all"
  on public.parent_session_logs for select
  using (
    auth.uid() in (
      select id from public.profiles where role in ('admin', 'jefe', 'especialista', 'secretaria')
    )
    or parent_id = auth.uid()
  );
