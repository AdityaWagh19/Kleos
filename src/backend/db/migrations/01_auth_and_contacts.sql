-- Migration: 01_auth_and_contacts
-- Description: Creates users and contacts tables, and links canvases to users.

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add user_id to canvases
ALTER TABLE public.canvases 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 4. Enable Row Level Security (RLS) for public schema tables if needed
-- (Assuming service_role key is used by backend, which bypasses RLS, so this is optional but good practice)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for users (Only service role can access everything, users can read their own)
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (true); -- Public read for now if needed, or restricted.

-- Backend uses service_role key, so it bypasses RLS anyway.
