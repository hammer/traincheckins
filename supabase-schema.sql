-- Supabase Schema for Tube Check-in App
-- Run this in your Supabase SQL Editor to set up the database

-- Enable anonymous auth in Supabase Dashboard > Authentication > Providers

-- Journeys table
create table journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  train_id text not null,
  line_id text not null,
  line_name text not null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  origin_station text,
  destination_station text,
  status text default 'active' check (status in ('active', 'completed', 'cancelled'))
);

-- Stops visited during journey
create table stops (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid references journeys(id) on delete cascade,
  station_id text not null,
  station_name text not null,
  arrived_at timestamptz default now(),
  sequence int not null
);

-- Indexes for better query performance
create index idx_journeys_user_id on journeys(user_id);
create index idx_journeys_status on journeys(status);
create index idx_stops_journey_id on stops(journey_id);

-- Row Level Security (RLS)
alter table journeys enable row level security;
alter table stops enable row level security;

-- Policies: users can only access their own data
create policy "Users can view their own journeys"
  on journeys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own journeys"
  on journeys for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own journeys"
  on journeys for update
  using (auth.uid() = user_id);

create policy "Users can view stops for their journeys"
  on stops for select
  using (
    journey_id in (
      select id from journeys where user_id = auth.uid()
    )
  );

create policy "Users can insert stops for their journeys"
  on stops for insert
  with check (
    journey_id in (
      select id from journeys where user_id = auth.uid()
    )
  );
