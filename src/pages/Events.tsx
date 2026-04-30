import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

type EventRow = { id: string; title: string; description: string | null; location: string | null; starts_at: string; ends_at: string | null; image_url: string | null };
type RSVPStatus = "going" | "maybe" | "declined";

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, RSVPStatus>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Events — COOU Alumni Connect"; load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data: evs } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
    const list = (evs ?? []) as EventRow[];
    setEvents(list);
    const { data: allRsvps } = await supabase.from("event_rsvps").select("event_id, user_id, status");
    const c: Record<string, number> = {};
    const mine: Record<string, RSVPStatus> = {};
    (allRsvps ?? []).forEach((r: any) => {
      if (r.status === "going") c[r.event_id] = (c[r.event_id] ?? 0) + 1;
      if (user && r.user_id === user.id) mine[r.event_id] = r.status;
    });
    setCounts(c); setRsvps(mine); setLoading(false);
  };

  const setRsvp = async (eventId: string, status: RSVPStatus) => {
    if (!user) return toast.error("Please sign in");
    const { error } = await supabase.from("event_rsvps").upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: "event_id,user_id" });
    if (error) return toast.error(error.message);
    toast.success(`RSVP: ${status}`); load();
  };

  if (loading) return <AppShell><div className="container py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div></AppShell>;

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = events.filter((e) => new Date(e.starts_at).getTime() < now);

  return (
    <AppShell>
      <section className="container py-10 space-y-8">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Events</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary mt-1">Alumni Events & RSVPs</h1>
          <p className="text-muted-foreground mt-2">Reunions, meetups, conferences and webinars.</p>
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold mb-3">Upcoming ({upcoming.length})</h2>
          {upcoming.length === 0 ? <p className="text-muted-foreground">No upcoming events.</p> : (
            <div className="grid md:grid-cols-2 gap-4">{upcoming.map((e) => <EventCard key={e.id} e={e} mine={rsvps[e.id]} count={counts[e.id] ?? 0} onRsvp={(s) => setRsvp(e.id, s)} />)}</div>
          )}
        </div>

        {past.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-semibold mb-3 text-muted-foreground">Past ({past.length})</h2>
            <div className="grid md:grid-cols-2 gap-4 opacity-70">{past.map((e) => <EventCard key={e.id} e={e} mine={rsvps[e.id]} count={counts[e.id] ?? 0} onRsvp={(s) => setRsvp(e.id, s)} past />)}</div>
          </div>
        )}
      </section>
    </AppShell>
  );
};

const EventCard = ({ e, mine, count, onRsvp, past }: { e: EventRow; mine?: RSVPStatus; count: number; onRsvp: (s: RSVPStatus) => void; past?: boolean }) => (
  <div className="rounded-2xl bg-card border border-border/60 overflow-hidden flex flex-col">
    {e.image_url && <img src={e.image_url} alt="" className="w-full h-40 object-cover" />}
    <div className="p-5 flex flex-col gap-2 flex-1">
      <div className="font-display text-lg font-semibold text-primary">{e.title}</div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(e.starts_at).toLocaleString()}</span>
        {e.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{e.location}</span>}
        <span>· {count} going</span>
      </div>
      {e.description && <p className="text-sm text-muted-foreground line-clamp-3">{e.description}</p>}
      {!past && (
        <div className="flex gap-2 mt-auto pt-2">
          {(["going", "maybe", "declined"] as RSVPStatus[]).map((s) => (
            <Button key={s} size="sm" variant={mine === s ? "hero" : "outline"} onClick={() => onRsvp(s)} aria-label={`RSVP ${s}`}>{s[0].toUpperCase() + s.slice(1)}</Button>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default EventsPage;
