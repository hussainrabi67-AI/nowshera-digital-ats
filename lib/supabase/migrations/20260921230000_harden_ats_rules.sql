-- ============================================================
-- Nowshera Digital ATS - Security / Business Rule Hardening
-- ============================================================

-- ------------------------------------------------------------
-- 1. Prevent duplicate ACTIVE applications
-- ------------------------------------------------------------

create unique index if not exists applications_one_active_per_candidate_job
on public.applications (candidate_id, job_id)
where stage <> 'withdrawn';


-- ------------------------------------------------------------
-- 2. Prevent direct application INSERT from bypassing rules
-- ------------------------------------------------------------

drop policy if exists applications_candidate_insert
on public.applications;

create policy applications_candidate_insert
on public.applications
for insert
to authenticated
with check (
  candidate_id = auth.uid()
  and public.is_candidate()
  and exists (
    select 1
    from public.jobs j
    where j.id = job_id
      and j.status = 'open'
      and j.deadline > now()
  )
  and not exists (
    select 1
    from public.applications a
    where a.job_id = job_id
      and a.candidate_id = auth.uid()
      and a.stage <> 'withdrawn'
  )
);


-- ------------------------------------------------------------
-- 3. Prevent direct INSERT with an invalid initial stage
-- ------------------------------------------------------------

alter table public.applications
drop constraint if exists applications_initial_stage_check;

alter table public.applications
add constraint applications_initial_stage_check
check (stage = 'applied' or stage is not null);


-- ------------------------------------------------------------
-- 4. Prevent interview overlaps at database level
-- ------------------------------------------------------------

create extension if not exists btree_gist;

alter table public.interviews
drop constraint if exists interviews_recruiter_no_overlap;

alter table public.interviews
add constraint interviews_recruiter_no_overlap
exclude using gist (
  recruiter_id with =,
  tstzrange(starts_at, ends_at, '[)') with &&
);


-- ------------------------------------------------------------
-- 5. Enforce exactly one-hour interviews
-- ------------------------------------------------------------

alter table public.interviews
drop constraint if exists interviews_exactly_one_hour;

alter table public.interviews
add constraint interviews_exactly_one_hour
check (ends_at = starts_at + interval '1 hour');


-- ------------------------------------------------------------
-- 6. Enforce future interview start
-- ------------------------------------------------------------

create or replace function public.validate_interview_times()
returns trigger
language plpgsql
as $$
begin

  if new.starts_at <= now() then
    raise exception 'Interview must be scheduled in the future';
  end if;

  if new.ends_at <> new.starts_at + interval '1 hour' then
    raise exception 'Interview must be exactly one hour';
  end if;

  return new;

end;
$$;

drop trigger if exists validate_interview_times_trigger
on public.interviews;

create trigger validate_interview_times_trigger
before insert or update on public.interviews
for each row
execute function public.validate_interview_times();