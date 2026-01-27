-- 1. Create a table to store user data (Store Name & Members List)
-- We use a JSONB column for 'members' to keep the schema flexible and compatible with the current frontend data structure.
create table if not exists user_data (
  user_id uuid references auth.users not null primary key,
  store_name text,
  members jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS) is crucial
alter table user_data enable row level security;

-- 3. Create Policies

-- Policy: Users can view their own data
create policy "Users can view their own data" 
on user_data for select 
using (auth.uid() = user_id);

-- Policy: Users can insert their own data
create policy "Users can insert their own data" 
on user_data for insert 
with check (auth.uid() = user_id);

-- Policy: Users can update their own data
create policy "Users can update their own data" 
on user_data for update 
using (auth.uid() = user_id);
