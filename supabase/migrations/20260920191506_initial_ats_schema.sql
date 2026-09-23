-- ============================================================
-- Nowshera Digital ATS
-- Initial Database Schema
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================

do $$
begin
  create type public.app_role as enum (
    'candidate',
    'recruiter',
    'admin'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.job_status as enum (
    'draft',
    'open',
    'closed'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.application_stage as enum (
    'applied',
    'shortlisted',
    'interview',
    'offer',
    'hired',
    'rejected',
    'withdrawn'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.email_event_type as enum (
    'application_received',
    'interview_invite',
    'hired',
    'rejected'
  );
exception when duplicate_object then null;
end $$;


-- ============================================================
-- PROFILES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.app_role not null default 'candidate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx
on public.profiles(role);


-- ============================================================
-- JOBS
-- ============================================================

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text not null default '',
  requirements text not null default '',
  location text,
  employment_type text,

  openings integer not null default 1
    check (openings > 0),

  deadline timestamptz not null,

  status public.job_status not null default 'draft',

  created_by uuid not null
    references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint jobs_deadline_valid
    check (deadline > created_at)
);

create index if not exists jobs_status_idx
on public.jobs(status);

create index if not exists jobs_deadline_idx
on public.jobs(deadline);

create index if not exists jobs_created_by_idx
on public.jobs(created_by);


-- ============================================================
-- JOB RECRUITERS
-- ============================================================

create table if not exists public.job_recruiters (
  job_id uuid not null
    references public.jobs(id) on delete cascade,

  recruiter_id uuid not null
    references public.profiles(id) on delete cascade,

  assigned_at timestamptz not null default now(),

  primary key (job_id, recruiter_id)
);

create index if not exists job_recruiters_recruiter_idx
on public.job_recruiters(recruiter_id);


-- ============================================================
-- APPLICATIONS
-- ============================================================

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),

  job_id uuid not null
    references public.jobs(id) on delete cascade,

  candidate_id uuid not null
    references public.profiles(id) on delete cascade,

  stage public.application_stage not null default 'applied',

  cv_path text not null,
  cv_original_name text not null,
  cv_size_bytes bigint not null,
  cv_mime_type text not null,

  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  withdrawn_at timestamptz,
  hired_at timestamptz,
  rejected_at timestamptz,

  constraint applications_cv_pdf check (
    lower(cv_original_name) like '%.pdf'
    and lower(cv_mime_type) = 'application/pdf'
  ),

  constraint applications_cv_size check (
    cv_size_bytes > 0
    and cv_size_bytes <= 2097152
  ),

  constraint applications_withdrawn_consistency check (
    (stage = 'withdrawn' and withdrawn_at is not null)
    or stage <> 'withdrawn'
  ),

  constraint applications_hired_consistency check (
    (stage = 'hired' and hired_at is not null)
    or stage <> 'hired'
  ),

  constraint applications_rejected_consistency check (
    (stage = 'rejected' and rejected_at is not null)
    or stage <> 'rejected'
  )
);

create index if not exists applications_job_idx
on public.applications(job_id);

create index if not exists applications_candidate_idx
on public.applications(candidate_id);

create index if not exists applications_stage_idx
on public.applications(stage);

create index if not exists applications_job_stage_idx
on public.applications(job_id, stage);

create unique index if not exists applications_one_active_per_job_candidate
on public.applications(job_id, candidate_id)
where stage <> 'withdrawn';


-- ============================================================
-- APPLICATION STAGE HISTORY
-- ============================================================

create table if not exists public.application_stage_history (
  id uuid primary key default gen_random_uuid(),

  application_id uuid not null
    references public.applications(id) on delete cascade,

  from_stage public.application_stage,

  to_stage public.application_stage not null,

  changed_by uuid not null
    references public.profiles(id),

  created_at timestamptz not null default now()
);

create index if not exists application_stage_history_application_idx
on public.application_stage_history(application_id);


-- ============================================================
-- RECRUITER NOTES
-- ============================================================

create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),

  application_id uuid not null
    references public.applications(id) on delete cascade,

  recruiter_id uuid not null
    references public.profiles(id) on delete cascade,

  note text not null
    check (length(trim(note)) > 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists application_notes_application_idx
on public.application_notes(application_id);


-- ============================================================
-- INTERVIEWS
-- ============================================================

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),

  application_id uuid not null unique
    references public.applications(id) on delete cascade,

  recruiter_id uuid not null
    references public.profiles(id),

  starts_at timestamptz not null,

  ends_at timestamptz not null,

  created_at timestamptz not null default now(),

  constraint interviews_exactly_one_hour
    check (ends_at = starts_at + interval '1 hour')
);

create index if not exists interviews_recruiter_time_idx
on public.interviews(recruiter_id, starts_at);


-- ============================================================
-- INTERVIEW VALIDATION
-- ============================================================

create or replace function public.validate_interview_times()
returns trigger
language plpgsql
as $$
begin

  if new.ends_at <> new.starts_at + interval '1 hour' then
    raise exception 'Interview must be exactly one hour';
  end if;

  if new.starts_at <= now() then
    raise exception 'Interview must be scheduled in the future';
  end if;

  return new;

end;
$$;

drop trigger if exists validate_interview_times_trigger
on public.interviews;

create trigger validate_interview_times_trigger
before insert or update
on public.interviews
for each row
execute function public.validate_interview_times();


-- ============================================================
-- EMAIL EVENTS
-- ============================================================

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),

  application_id uuid not null
    references public.applications(id) on delete cascade,

  event_type public.email_event_type not null,

  recipient_email text not null,

  payload jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  sent_at timestamptz,
  failed_at timestamptz,
  error_message text
);

create unique index if not exists email_events_application_type_unique
on public.email_events(application_id, event_type);

create index if not exists email_events_unsent_idx
on public.email_events(created_at)
where sent_at is null;


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_recruiter()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'recruiter'
  );
$$;

create or replace function public.is_candidate()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'candidate'
  );
$$;

create or replace function public.is_recruiter_for_job(
  p_job_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.job_recruiters jr
    join public.profiles p
      on p.id = jr.recruiter_id
    where jr.job_id = p_job_id
      and jr.recruiter_id = auth.uid()
      and p.role = 'recruiter'
  );
$$;

create or replace function public.can_access_application(
  p_application_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.applications a
      where a.id = p_application_id
        and a.candidate_id = auth.uid()
    )
    or exists (
      select 1
      from public.applications a
      where a.id = p_application_id
        and public.is_recruiter_for_job(a.job_id)
    );
$$;


-- ============================================================
-- UPDATED AT
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at
on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists jobs_set_updated_at
on public.jobs;

create trigger jobs_set_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();

drop trigger if exists applications_set_updated_at
on public.applications;

create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

drop trigger if exists application_notes_set_updated_at
on public.application_notes;

create trigger application_notes_set_updated_at
before update on public.application_notes
for each row
execute function public.set_updated_at();


-- ============================================================
-- AUTH USER -> PROFILE
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.profiles (
    id,
    email,
    full_name,
    role
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'candidate'
  )
  on conflict (id) do nothing;

  return new;

end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- ============================================================
-- APPLICATION EMAIL
-- ============================================================

create or replace function public.create_application_email_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_email text;
begin

  select email
  into candidate_email
  from public.profiles
  where id = new.candidate_id;

  insert into public.email_events (
    application_id,
    event_type,
    recipient_email,
    payload
  )
  values (
    new.id,
    'application_received',
    candidate_email,
    jsonb_build_object(
      'application_id', new.id,
      'job_id', new.job_id,
      'stage', new.stage
    )
  )
  on conflict (application_id, event_type)
  do nothing;

  return new;

end;
$$;

drop trigger if exists application_received_email_trigger
on public.applications;

create trigger application_received_email_trigger
after insert on public.applications
for each row
execute function public.create_application_email_event();


-- ============================================================
-- VALIDATE APPLICATION TRANSITIONS
-- ============================================================

create or replace function public.validate_application_transition(
  p_from public.application_stage,
  p_to public.application_stage
)
returns boolean
language plpgsql
immutable
as $$
begin

  if p_from in ('hired', 'rejected', 'withdrawn') then
    return false;
  end if;

  if p_from = p_to then
    return false;
  end if;

  if p_to = 'rejected' then
    return true;
  end if;

  if p_to = 'withdrawn' then
    return true;
  end if;

  if p_from = 'applied'
     and p_to = 'shortlisted' then
    return true;
  end if;

  if p_from = 'shortlisted'
     and p_to = 'interview' then
    return true;
  end if;

  if p_from = 'interview'
     and p_to = 'offer' then
    return true;
  end if;

  if p_from = 'offer'
     and p_to = 'hired' then
    return true;
  end if;

  return false;

end;
$$;


-- ============================================================
-- APPLICATION STAGE TRANSITION
-- ============================================================

create or replace function public.transition_application_stage(
  p_application_id uuid,
  p_new_stage public.application_stage
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare

  v_application public.applications;
  v_job public.jobs;
  v_actor_role public.app_role;
  v_recipient_email text;
  v_hired_count integer;
  v_previous_stage public.application_stage;

begin

  select *
  into v_application
  from public.applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found';
  end if;

  v_previous_stage := v_application.stage;

  select *
  into v_job
  from public.jobs
  where id = v_application.job_id
  for update;

  if not found then
    raise exception 'Job not found';
  end if;

  select role
  into v_actor_role
  from public.profiles
  where id = auth.uid();

  if v_actor_role is null then
    raise exception 'User profile not found';
  end if;

  if p_new_stage = 'withdrawn' then

    if v_application.candidate_id <> auth.uid() then
      raise exception 'You can only withdraw your own application';
    end if;

  else

    if v_actor_role <> 'admin'
       and not public.is_recruiter_for_job(v_application.job_id) then

      raise exception
        'You are not authorized to manage this application';

    end if;

  end if;

  if not public.validate_application_transition(
    v_previous_stage,
    p_new_stage
  ) then

    raise exception
      'Invalid application transition: % -> %',
      v_previous_stage,
      p_new_stage;

  end if;

  if p_new_stage = 'hired' then

    select count(*)
    into v_hired_count
    from public.applications
    where job_id = v_application.job_id
      and stage = 'hired';

    if v_hired_count >= v_job.openings then
      raise exception 'This job has no remaining openings';
    end if;

  end if;

  update public.applications
  set
    stage = p_new_stage,

    withdrawn_at =
      case
        when p_new_stage = 'withdrawn'
        then now()
        else withdrawn_at
      end,

    hired_at =
      case
        when p_new_stage = 'hired'
        then now()
        else hired_at
      end,

    rejected_at =
      case
        when p_new_stage = 'rejected'
        then now()
        else rejected_at
      end

  where id = p_application_id

  returning *
  into v_application;

  insert into public.application_stage_history (
    application_id,
    from_stage,
    to_stage,
    changed_by
  )
  values (
    p_application_id,
    v_previous_stage,
    p_new_stage,
    auth.uid()
  );

  select email
  into v_recipient_email
  from public.profiles
  where id = v_application.candidate_id;

  if p_new_stage = 'hired' then

    insert into public.email_events (
      application_id,
      event_type,
      recipient_email,
      payload
    )
    values (
      p_application_id,
      'hired',
      v_recipient_email,
      jsonb_build_object(
        'application_id', p_application_id,
        'job_id', v_application.job_id
      )
    )
    on conflict (application_id, event_type)
    do nothing;

    select count(*)
    into v_hired_count
    from public.applications
    where job_id = v_application.job_id
      and stage = 'hired';

    if v_hired_count >= v_job.openings then

      update public.jobs
      set status = 'closed'
      where id = v_application.job_id;

    end if;

  elsif p_new_stage = 'rejected' then

    insert into public.email_events (
      application_id,
      event_type,
      recipient_email,
      payload
    )
    values (
      p_application_id,
      'rejected',
      v_recipient_email,
      jsonb_build_object(
        'application_id', p_application_id,
        'job_id', v_application.job_id
      )
    )
    on conflict (application_id, event_type)
    do nothing;

  end if;

  return v_application;

end;
$$;


-- ============================================================
-- INTERVIEW SCHEDULING
-- ============================================================

create or replace function public.schedule_application_interview(
  p_application_id uuid,
  p_starts_at timestamptz
)
returns public.interviews
language plpgsql
security definer
set search_path = public
as $$
declare

  v_application public.applications;
  v_interview public.interviews;
  v_recruiter_id uuid;
  v_recipient_email text;

begin

  select *
  into v_application
  from public.applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found';
  end if;

  if not public.is_recruiter_for_job(v_application.job_id)
     and not public.is_admin() then

    raise exception
      'You are not authorized to schedule this interview';

  end if;

  if p_starts_at <= now() then
    raise exception 'Interview must be scheduled in the future';
  end if;

  if v_application.stage <> 'shortlisted' then
    raise exception
      'Application must be Shortlisted before scheduling an interview';
  end if;

  if public.is_recruiter() then

    v_recruiter_id := auth.uid();

  else

    select recruiter_id
    into v_recruiter_id
    from public.job_recruiters
    where job_id = v_application.job_id
    order by assigned_at
    limit 1;

    if v_recruiter_id is null then
      raise exception 'No recruiter is assigned to this job';
    end if;

  end if;

  if exists (
    select 1
    from public.interviews i
    where i.recruiter_id = v_recruiter_id
      and tstzrange(
        i.starts_at,
        i.ends_at,
        '[)'
      )
      &&
      tstzrange(
        p_starts_at,
        p_starts_at + interval '1 hour',
        '[)'
      )
  ) then

    raise exception
      'Recruiter already has an overlapping interview';

  end if;

  if exists (
    select 1
    from public.interviews
    where application_id = p_application_id
  ) then

    raise exception
      'This application already has an interview';

  end if;

  insert into public.interviews (
    application_id,
    recruiter_id,
    starts_at,
    ends_at
  )
  values (
    p_application_id,
    v_recruiter_id,
    p_starts_at,
    p_starts_at + interval '1 hour'
  )
  returning *
  into v_interview;

  perform public.transition_application_stage(
    p_application_id,
    'interview'
  );

  select email
  into v_recipient_email
  from public.profiles
  where id = v_application.candidate_id;

  insert into public.email_events (
    application_id,
    event_type,
    recipient_email,
    payload
  )
  values (
    p_application_id,
    'interview_invite',
    v_recipient_email,
    jsonb_build_object(
      'application_id', p_application_id,
      'interview_id', v_interview.id,
      'starts_at', v_interview.starts_at,
      'ends_at', v_interview.ends_at
    )
  )
  on conflict (application_id, event_type)
  do nothing;

  return v_interview;

end;
$$;


-- ============================================================
-- CLOSE EXPIRED JOBS
-- ============================================================

create or replace function public.close_expired_jobs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin

  update public.jobs
  set status = 'closed'
  where status = 'open'
    and deadline <= now();

  get diagnostics v_count = row_count;

  return v_count;

end;
$$;


-- ============================================================
-- ENABLE RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.job_recruiters enable row level security;
alter table public.applications enable row level security;
alter table public.application_stage_history enable row level security;
alter table public.application_notes enable row level security;
alter table public.interviews enable row level security;
alter table public.email_events enable row level security;


-- ============================================================
-- PROFILE POLICIES
-- ============================================================

drop policy if exists profiles_select_own_or_admin
on public.profiles;

create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

drop policy if exists profiles_update_own
on public.profiles;

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_admin_all
on public.profiles;

create policy profiles_admin_all
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- JOB POLICIES
-- ============================================================

drop policy if exists jobs_candidate_open_read
on public.jobs;

create policy jobs_candidate_open_read
on public.jobs
for select
to authenticated
using (
  status = 'open'
  and deadline > now()
);

drop policy if exists jobs_recruiter_assigned_read
on public.jobs;

create policy jobs_recruiter_assigned_read
on public.jobs
for select
to authenticated
using (
  public.is_recruiter_for_job(id)
);

drop policy if exists jobs_admin_all
on public.jobs;

create policy jobs_admin_all
on public.jobs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- JOB RECRUITER POLICIES
-- ============================================================

drop policy if exists job_recruiters_relevant_read
on public.job_recruiters;

create policy job_recruiters_relevant_read
on public.job_recruiters
for select
to authenticated
using (
  recruiter_id = auth.uid()
  or public.is_admin()
);

drop policy if exists job_recruiters_admin_manage
on public.job_recruiters;

create policy job_recruiters_admin_manage
on public.job_recruiters
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- APPLICATION POLICIES
-- ============================================================

drop policy if exists applications_candidate_read
on public.applications;

create policy applications_candidate_read
on public.applications
for select
to authenticated
using (
  candidate_id = auth.uid()
);

drop policy if exists applications_recruiter_read
on public.applications;

create policy applications_recruiter_read
on public.applications
for select
to authenticated
using (
  public.is_recruiter_for_job(job_id)
);

drop policy if exists applications_admin_read
on public.applications;

create policy applications_admin_read
on public.applications
for select
to authenticated
using (
  public.is_admin()
);

drop policy if exists applications_candidate_insert
on public.applications;

create policy applications_candidate_insert
on public.applications
for insert
to authenticated
with check (
  candidate_id = auth.uid()
  and public.is_candidate()
);

drop policy if exists applications_admin_update
on public.applications;

create policy applications_admin_update
on public.applications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- STAGE HISTORY POLICIES
-- ============================================================

drop policy if exists stage_history_relevant_read
on public.application_stage_history;

create policy stage_history_relevant_read
on public.application_stage_history
for select
to authenticated
using (
  public.can_access_application(application_id)
);

drop policy if exists stage_history_admin_all
on public.application_stage_history;

create policy stage_history_admin_all
on public.application_stage_history
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- NOTES POLICIES
-- ============================================================

drop policy if exists notes_recruiter_read
on public.application_notes;

create policy notes_recruiter_read
on public.application_notes
for select
to authenticated
using (
  public.is_recruiter_for_job(
    (
      select a.job_id
      from public.applications a
      where a.id = application_id
    )
  )
  or public.is_admin()
);

drop policy if exists notes_recruiter_insert
on public.application_notes;

create policy notes_recruiter_insert
on public.application_notes
for insert
to authenticated
with check (
  recruiter_id = auth.uid()
  and public.is_recruiter_for_job(
    (
      select a.job_id
      from public.applications a
      where a.id = application_id
    )
  )
);

drop policy if exists notes_recruiter_update
on public.application_notes;

create policy notes_recruiter_update
on public.application_notes
for update
to authenticated
using (
  recruiter_id = auth.uid()
  or public.is_admin()
)
with check (
  recruiter_id = auth.uid()
  or public.is_admin()
);

drop policy if exists notes_recruiter_delete
on public.application_notes;

create policy notes_recruiter_delete
on public.application_notes
for delete
to authenticated
using (
  recruiter_id = auth.uid()
  or public.is_admin()
);


-- ============================================================
-- INTERVIEW POLICIES
-- ============================================================

drop policy if exists interviews_candidate_read
on public.interviews;

create policy interviews_candidate_read
on public.interviews
for select
to authenticated
using (
  exists (
    select 1
    from public.applications a
    where a.id = application_id
      and a.candidate_id = auth.uid()
  )
);

drop policy if exists interviews_recruiter_read
on public.interviews;

create policy interviews_recruiter_read
on public.interviews
for select
to authenticated
using (
  recruiter_id = auth.uid()
  or public.is_admin()
);

drop policy if exists interviews_admin_all
on public.interviews;

create policy interviews_admin_all
on public.interviews
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- ============================================================
-- EMAIL EVENT POLICIES
-- ============================================================

drop policy if exists email_events_admin_read
on public.email_events;

create policy email_events_admin_read
on public.email_events
for select
to authenticated
using (public.is_admin());


-- ============================================================
-- PRIVATE CV STORAGE
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'cv-files',
  'cv-files',
  false,
  2097152,
  array['application/pdf']
)
on conflict (id)
do update set
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = array['application/pdf'];


drop policy if exists cv_candidate_upload
on storage.objects;

create policy cv_candidate_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cv-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);


drop policy if exists cv_candidate_read
on storage.objects;

create policy cv_candidate_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'cv-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or exists (
      select 1
      from public.applications a
      where a.candidate_id::text =
        (storage.foldername(name))[1]
        and public.is_recruiter_for_job(a.job_id)
    )
  )
);


drop policy if exists cv_candidate_delete
on storage.objects;

create policy cv_candidate_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cv-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);


-- ============================================================
-- FUNCTION GRANTS
-- ============================================================

grant execute on function public.transition_application_stage(
  uuid,
  public.application_stage
)
to authenticated;

grant execute on function public.schedule_application_interview(
  uuid,
  timestamptz
)
to authenticated;

grant execute on function public.close_expired_jobs()
to authenticated;


-- ============================================================
-- END OF INITIAL ATS SCHEMA
-- ============================================================