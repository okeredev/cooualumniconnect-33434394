-- 1. Profiles Update
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS matric_number TEXT,
ADD COLUMN IF NOT EXISTS state_of_origin TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS coou_id TEXT,
ADD COLUMN IF NOT EXISTS directory_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS welcome_seen BOOLEAN DEFAULT false;

-- 2. Newsletter Subscribers & Broadcasts
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS public.newsletter_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.newsletter_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage broadcasts" ON public.newsletter_broadcasts FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 8. Chat Media Support
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT; -- 'image', 'video', 'file'

-- Storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_attachments','chat_attachments', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Chat attachments public read" ON storage.objects;
CREATE POLICY "Chat attachments public read" ON storage.objects FOR SELECT USING (bucket_id = 'chat_attachments');
DROP POLICY IF EXISTS "Authenticated users upload chat attachments" ON storage.objects;
CREATE POLICY "Authenticated users upload chat attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat_attachments');
CREATE TABLE IF NOT EXISTS public.support_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- 'adopt', 'direct', 'academic', 'welfare'
    target_amount NUMERIC,
    raised_amount NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.profiles(user_id)
);
ALTER TABLE public.support_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.support_campaigns;
CREATE POLICY "Anyone can view active campaigns" ON public.support_campaigns FOR SELECT USING (active = true OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.support_campaigns;
CREATE POLICY "Admins can manage campaigns" ON public.support_campaigns FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS public.support_pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.support_campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id),
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'fulfilled', 'cancelled'
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.support_pledges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own pledges" ON public.support_pledges;
CREATE POLICY "Users can view own pledges" ON public.support_pledges FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Users can insert own pledges" ON public.support_pledges;
CREATE POLICY "Users can insert own pledges" ON public.support_pledges FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage pledges" ON public.support_pledges;
CREATE POLICY "Admins can manage pledges" ON public.support_pledges FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 4. Voting System
CREATE TABLE IF NOT EXISTS public.elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES public.profiles(user_id)
);
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view elections" ON public.elections;
CREATE POLICY "Anyone can view elections" ON public.elections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage elections" ON public.elections;
CREATE POLICY "Admins can manage elections" ON public.elections FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS public.election_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id),
    name TEXT NOT NULL,
    manifesto TEXT,
    position TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.election_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view candidates" ON public.election_candidates;
CREATE POLICY "Anyone can view candidates" ON public.election_candidates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage candidates" ON public.election_candidates;
CREATE POLICY "Admins can manage candidates" ON public.election_candidates FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.election_candidates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(user_id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(election_id, user_id) -- Prevent double voting
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own votes" ON public.votes;
CREATE POLICY "Users can view own votes" ON public.votes FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Users can vote once" ON public.votes;
CREATE POLICY "Users can vote once" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Fix directory_profiles view
-- Remove the recursive user_roles lookup that causes timeouts/errors, and add directory_approved = true.
-- Also using standard security_invoker=false since we removed the auth.uid() and role lookups from the view body to improve performance.
-- Phone/WhatsApp filtering will now be done on the frontend or a separate RPC function.
DROP VIEW IF EXISTS public.directory_profiles;

CREATE VIEW public.directory_profiles AS
SELECT 
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.email,
    p.alt_email,
    p.department,
    p.graduation_year,
    p.city,
    p.state,
    p.country,
    p.linkedin,
    p.github,
    p.twitter,
    p.facebook,
    p.instagram,
    p.youtube,
    p.tiktok,
    p.website,
    p.verified,
    p.suspended,
    p.hide_phone,
    p.phone,     -- Frontend will obscure this if hide_phone = true and not admin
    p.whatsapp,  -- Frontend will obscure this if hide_phone = true and not admin
    p.coou_id,
    p.created_at
FROM public.profiles p
WHERE p.directory_approved = true AND p.suspended = false;

-- 6. Realtime Configuration
-- Ensure the publication exists and add tables to it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Enable realtime for chat_messages
-- We use a DO block to avoid errors if already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
END $$;

-- 7. Restore Existing Users to Directory
-- Since we added the directory_approved column, all existing users are hidden by default.
-- Run this to approve all current accounts so they show up in the directory again.
UPDATE public.profiles 
SET directory_approved = true 
WHERE directory_approved IS FALSE OR directory_approved IS NULL;
