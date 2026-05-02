import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PRESENCE_CHANNEL = "global-presence";

/**
 * Tracks the current user as online via Supabase Realtime presence,
 * heartbeats `last_seen_at` to their profile every 60s, and exposes
 * the live set of online user_ids to subscribers.
 */
export const usePresence = () => {
  const { user } = useAuth();
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`${PRESENCE_CHANNEL}-${user.id}-${Math.random().toString(36).slice(2, 8)}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnline(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    // heartbeat last_seen_at
    const beat = async () => {
      await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("user_id", user.id);
    };
    beat();
    const interval = setInterval(beat, 60_000);

    const handleVisibility = () => { if (document.visibilityState === "visible") beat(); };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      // mark last seen on unmount
      supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("user_id", user.id);
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { online };
};

export const formatLastSeen = (iso: string | null | undefined): string => {
  if (!iso) return "Offline";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "Active just now";
  if (min < 60) return `Last seen ${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Last seen ${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `Last seen ${d}d ago`;
  return `Last seen ${new Date(iso).toLocaleDateString()}`;
};
