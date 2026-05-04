-- Create a secure view for the directory that automatically hides phone numbers based on the hide_phone flag
-- Only the owner or an admin can see the phone number if hide_phone is true
CREATE OR REPLACE VIEW public.directory_profiles WITH (security_invoker=on) AS
SELECT 
  p.id, 
  p.user_id, 
  p.display_name, 
  p.avatar_url, 
  p.bio, 
  p.email, 
  p.alt_email, 
  p.city, 
  p.state, 
  p.country, 
  p.department, 
  p.graduation_year, 
  p.verified, 
  p.linkedin, 
  p.github, 
  p.twitter, 
  p.website, 
  p.facebook, 
  p.instagram, 
  p.youtube, 
  p.tiktok,
  CASE 
    WHEN p.hide_phone = true AND auth.uid() != p.user_id AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') 
    THEN null 
    ELSE p.phone 
  END as phone,
  CASE 
    WHEN p.hide_phone = true AND auth.uid() != p.user_id AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') 
    THEN null 
    ELSE p.whatsapp 
  END as whatsapp,
  p.hide_phone, 
  p.created_at, 
  p.suspended
FROM profiles p;

-- Performance improvements for Chat
-- This dramatically speeds up chat history loading on vercel production
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_time ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_dm_time ON public.chat_messages(sender_id, recipient_id, created_at DESC);
