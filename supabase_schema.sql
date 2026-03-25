-- ============================================================
-- StudySync Database Schema
-- Paste this entire file into Supabase SQL Editor and click Run
-- ============================================================

-- Users (stores Canvas OAuth tokens)
create table if not exists users (
  canvas_user_id  text primary key,
  name            text not null,
  email           text,
  access_token    text not null,
  refresh_token   text,
  canvas_base_url text not null default 'https://uta.instructure.com',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Schedule slots (the calendar blocks)
create table if not exists schedule_slots (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references users(canvas_user_id) on delete cascade,
  date            date not null,
  start_time      time,
  end_time        time,
  title           text not null,
  subtitle        text,
  type            text not null default 'study'
                    check (type in ('study', 'canvas', 'personal')),
  canvas_item_id  text,
  created_at      timestamptz default now()
);

-- Unique index to prevent duplicate Canvas syncs
create unique index if not exists idx_canvas_item
  on schedule_slots(canvas_item_id)
  where canvas_item_id is not null;

-- Index for fast date range queries per user
create index if not exists idx_slots_user_date
  on schedule_slots(user_id, date);

-- Tasks (pulled from Canvas + manual)
create table if not exists tasks (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references users(canvas_user_id) on delete cascade,
  title           text not null,
  course_name     text,
  due_date        timestamptz,
  completed       boolean default false,
  source          text default 'manual' check (source in ('canvas', 'manual')),
  canvas_item_id  text unique,
  created_at      timestamptz default now()
);

create index if not exists idx_tasks_user
  on tasks(user_id, due_date);

-- Dismissed announcements (so alerts don't re-appear)
create table if not exists dismissed_announcements (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references users(canvas_user_id) on delete cascade,
  announce_id text not null,
  created_at  timestamptz default now(),
  unique(user_id, announce_id)
);
