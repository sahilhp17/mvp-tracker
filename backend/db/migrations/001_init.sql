-- One row per distinct version of MVP.md the app has read.
-- The server parses `content` when it reads a row, so nothing parsed is stored here.
create table mvp (
  id            bigint generated always as identity primary key,
  content       text        not null,          -- the file exactly as it was read
  content_hash  text        not null unique,   -- sha256 of content, so an unchanged file isn't saved again
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

-- One row per press of Compare with code, from start to finish.
create table comparisons (
  id          bigint generated always as identity primary key,
  status      text        not null check (status in ('running', 'succeeded', 'failed')),
  mvp_id      bigint      not null references mvp(id),  -- the MVP this comparison used
  result      jsonb,                                    -- the validated AI response, on success
  failure     text,                                     -- what went wrong, on failure
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  check (status <> 'succeeded' or result  is not null),
  check (status <> 'failed'    or failure is not null)
);

-- Only one comparison can be running at a time; a second insert fails.
create unique index one_running_comparison on comparisons ((true)) where status = 'running';