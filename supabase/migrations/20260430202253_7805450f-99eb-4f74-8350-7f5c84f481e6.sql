
-- DONATIONS (pledges only)
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  purpose TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pledged', -- pledged | fulfilled | cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create own donations" ON public.donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own donations" ON public.donations FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users update own pledges" ON public.donations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage donations" ON public.donations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER donations_updated BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MENTORSHIP
CREATE TABLE public.mentor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bio TEXT,
  topics TEXT[] DEFAULT '{}',
  capacity INTEGER NOT NULL DEFAULT 3,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentor profiles viewable by authenticated" ON public.mentor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own mentor profile" ON public.mentor_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage mentor profiles" ON public.mentor_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER mentor_profiles_updated BEFORE UPDATE ON public.mentor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id UUID NOT NULL,
  mentor_id UUID NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined | completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view requests" ON public.mentorship_requests FOR SELECT TO authenticated USING (auth.uid() = mentee_id OR auth.uid() = mentor_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Mentees create requests" ON public.mentorship_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = mentee_id);
CREATE POLICY "Mentors update requests" ON public.mentorship_requests FOR UPDATE TO authenticated USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);
CREATE POLICY "Admins manage requests" ON public.mentorship_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER mentorship_requests_updated BEFORE UPDATE ON public.mentorship_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CHAT
CREATE TABLE public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Channels viewable by authenticated" ON public.chat_channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage channels" ON public.chat_channels FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.chat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view membership" ON public.chat_channel_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users join channels" ON public.chat_channel_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave channels" ON public.chat_channel_members FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  channel_id UUID REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  recipient_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((channel_id IS NOT NULL AND recipient_id IS NULL) OR (channel_id IS NULL AND recipient_id IS NOT NULL))
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read channel or DM messages" ON public.chat_messages FOR SELECT TO authenticated USING (
  (channel_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.chat_channel_members m WHERE m.channel_id = chat_messages.channel_id AND m.user_id = auth.uid()))
  OR (recipient_id IS NOT NULL AND (auth.uid() = sender_id OR auth.uid() = recipient_id))
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "Send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Delete own messages" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = sender_id OR public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_chat_messages_channel ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_chat_messages_dm ON public.chat_messages(sender_id, recipient_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channel_members;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

-- EVENT RSVPs
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'going', -- going | maybe | declined
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVPs viewable by authenticated" ON public.event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own RSVP" ON public.event_rsvps FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage RSVPs" ON public.event_rsvps FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER event_rsvps_updated BEFORE UPDATE ON public.event_rsvps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RESOURCE HUB (admin-only uploads)
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  file_url TEXT,
  external_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources viewable by authenticated" ON public.resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage resources" ON public.resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER resources_updated BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources','resources', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Resources bucket public read" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "Admins upload resources" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resources' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update resources" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'resources' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete resources" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resources' AND public.has_role(auth.uid(),'admin'));

-- Seed a few default chat channels
INSERT INTO public.chat_channels (name, description) VALUES
  ('general', 'General discussion for all alumni'),
  ('jobs-and-careers', 'Career talk, openings, and referrals'),
  ('mentorship', 'Connect with mentors and mentees');
