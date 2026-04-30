import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { GraduationCap, Loader2, MessageSquare, Sparkles } from "lucide-react";

type Mentor = {
  id: string; user_id: string; bio: string | null; topics: string[]; capacity: number; available: boolean;
  profile?: { display_name: string | null; avatar_url: string | null; department: string | null; graduation_year: number | null };
};
type Request = { id: string; mentor_id: string; mentee_id: string; message: string | null; status: string; created_at: string };

const MentorshipPage = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [myProfile, setMyProfile] = useState<{ department: string | null; graduation_year: number | null } | null>(null);
  const [myMentor, setMyMentor] = useState<Mentor | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [namesById, setNamesById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [reqOpen, setReqOpen] = useState<Mentor | null>(null);
  const [reqMsg, setReqMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ bio: "", topics: "", capacity: 3, available: true });

  useEffect(() => { document.title = "Mentorship — COOU Alumni Connect"; load(); }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [m, mine, prof, reqs] = await Promise.all([
      supabase.from("mentor_profiles").select("*").eq("available", true),
      supabase.from("mentor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("department, graduation_year").eq("user_id", user.id).maybeSingle(),
      supabase.from("mentorship_requests").select("*").or(`mentee_id.eq.${user.id},mentor_id.eq.${user.id}`).order("created_at", { ascending: false }),
    ]);
    const rawMentors = (m.data ?? []) as any[];
    const ids = Array.from(new Set([...rawMentors.map((x) => x.user_id), ...((reqs.data ?? []) as any[]).flatMap((r) => [r.mentee_id, r.mentor_id])]));
    const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url, department, graduation_year").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const byId: Record<string, any> = {};
    (profs ?? []).forEach((p: any) => { byId[p.user_id] = p; });
    setMentors(rawMentors.map((x) => ({ ...x, profile: byId[x.user_id] })));
    setMyMentor((mine.data ?? null) as Mentor | null);
    if (mine.data) setForm({ bio: mine.data.bio ?? "", topics: (mine.data.topics ?? []).join(", "), capacity: mine.data.capacity, available: mine.data.available });
    setMyProfile((prof.data ?? null) as any);
    setRequests((reqs.data ?? []) as Request[]);
    const n: Record<string, string> = {};
    (profs ?? []).forEach((p: any) => { n[p.user_id] = p.display_name || "Alumnus"; });
    setNamesById(n);
    setLoading(false);
  };

  const saveMentor = async () => {
    if (!user) return;
    const topics = form.topics.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12);
    const payload = { user_id: user.id, bio: form.bio.slice(0, 500), topics, capacity: Math.max(1, Math.min(20, form.capacity)), available: form.available };
    const { error } = myMentor
      ? await supabase.from("mentor_profiles").update(payload).eq("user_id", user.id)
      : await supabase.from("mentor_profiles").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Mentor profile saved"); setEditOpen(false); load();
  };

  const sendRequest = async () => {
    if (!user || !reqOpen) return;
    const { error } = await supabase.from("mentorship_requests").insert({ mentor_id: reqOpen.user_id, mentee_id: user.id, message: reqMsg.slice(0, 500) });
    if (error) return toast.error(error.message);
    toast.success("Request sent"); setReqOpen(null); setReqMsg(""); load();
  };

  const decide = async (id: string, status: "accepted" | "declined") => {
    await supabase.from("mentorship_requests").update({ status }).eq("id", id);
    toast.success(status); load();
  };

  const filtered = useMemo(() => {
    let list = mentors.filter((m) => m.user_id !== user?.id);
    if (q) {
      const qq = q.toLowerCase();
      list = list.filter((m) => (m.profile?.display_name || "").toLowerCase().includes(qq)
        || (m.profile?.department || "").toLowerCase().includes(qq)
        || (m.topics || []).join(" ").toLowerCase().includes(qq));
    }
    return list;
  }, [mentors, q, user]);

  const suggested = useMemo(() => {
    if (!myProfile) return [];
    return filtered.filter((m) => m.profile?.department === myProfile.department || (myProfile.graduation_year && m.profile?.graduation_year && Math.abs((m.profile!.graduation_year! - myProfile.graduation_year!)) <= 5)).slice(0, 6);
  }, [filtered, myProfile]);

  if (loading) return <AppShell><div className="container py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div></AppShell>;

  return (
    <AppShell>
      <section className="container py-10 space-y-6">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-8 grain relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Mentorship</div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">Learn from COOU alumni</h1>
              <p className="text-primary-foreground/70 mt-2 max-w-2xl">Connect with mentors across industries — or volunteer as one yourself.</p>
            </div>
            <Button variant="gold" onClick={() => setEditOpen(true)} aria-label="Edit mentor profile"><GraduationCap className="w-4 h-4" /> {myMentor ? "Update mentor profile" : "Become a mentor"}</Button>
          </div>
        </div>

        <Tabs defaultValue="browse">
          <TabsList>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            {suggested.length > 0 && <TabsTrigger value="suggested"><Sparkles className="w-4 h-4 mr-1" />Suggested</TabsTrigger>}
            <TabsTrigger value="requests">My requests ({requests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4 space-y-4">
            <Input placeholder="Search mentors by name, department, topic..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search mentors" />
            <MentorGrid list={filtered} onRequest={setReqOpen} />
          </TabsContent>

          <TabsContent value="suggested" className="mt-4">
            <p className="text-sm text-muted-foreground mb-3">Mentors matching your department or graduation year.</p>
            <MentorGrid list={suggested} onRequest={setReqOpen} />
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-2">
            {requests.length === 0 && <p className="text-center text-muted-foreground py-10">No requests yet.</p>}
            {requests.map((r) => {
              const iAmMentor = r.mentor_id === user?.id;
              const otherId = iAmMentor ? r.mentee_id : r.mentor_id;
              return (
                <div key={r.id} className="rounded-xl bg-card border border-border/60 p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm">{iAmMentor ? "From" : "To"} <span className="font-semibold">{namesById[otherId] || "Alumnus"}</span></div>
                    {r.message && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.message}</p>}
                    <div className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === "accepted" ? "bg-green-100 text-green-800" : r.status === "declined" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{r.status}</span>
                    {iAmMentor && r.status === "pending" && (
                      <>
                        <Button size="sm" variant="hero" onClick={() => decide(r.id, "accepted")}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => decide(r.id, "declined")}>Decline</Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </section>

      {/* Request dialog */}
      <Dialog open={!!reqOpen} onOpenChange={(o) => !o && setReqOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request mentorship from {reqOpen?.profile?.display_name || "Alumnus"}</DialogTitle></DialogHeader>
          <Textarea rows={5} maxLength={500} placeholder="Briefly describe what you'd like guidance on..." value={reqMsg} onChange={(e) => setReqMsg(e.target.value)} />
          <DialogFooter><Button onClick={sendRequest}><MessageSquare className="w-4 h-4" /> Send request</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mentor profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{myMentor ? "Update mentor profile" : "Become a mentor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Short bio</Label><Textarea rows={3} maxLength={500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
            <div><Label>Topics (comma-separated)</Label><Input value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} placeholder="Career, Software, Entrepreneurship" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Capacity</Label><Input type="number" min={1} max={20} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
              <div className="flex items-end gap-3"><Switch checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} /><span className="text-sm">Available</span></div>
            </div>
          </div>
          <DialogFooter><Button onClick={saveMentor}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

const MentorGrid = ({ list, onRequest }: { list: Mentor[]; onRequest: (m: Mentor) => void }) => {
  if (list.length === 0) return <p className="text-center text-muted-foreground py-10">No mentors found.</p>;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((m) => (
        <div key={m.id} className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {m.profile?.avatar_url ? (
              <img src={m.profile.avatar_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
            ) : <div className="w-12 h-12 rounded-xl bg-muted grid place-items-center text-sm font-semibold">{(m.profile?.display_name || "A")[0]}</div>}
            <div className="min-w-0">
              <div className="font-semibold truncate">{m.profile?.display_name || "Alumnus"}</div>
              <div className="text-xs text-muted-foreground truncate">{m.profile?.department || "—"} · {m.profile?.graduation_year || "—"}</div>
            </div>
          </div>
          {m.bio && <p className="text-sm text-muted-foreground line-clamp-3">{m.bio}</p>}
          <div className="flex flex-wrap gap-1">
            {(m.topics || []).slice(0, 5).map((t) => <span key={t} className="px-2 py-0.5 rounded-full text-[11px] bg-muted">{t}</span>)}
          </div>
          <Button size="sm" variant="hero" className="mt-auto" onClick={() => onRequest(m)} aria-label={`Request mentorship from ${m.profile?.display_name || "Alumnus"}`}>Request mentorship</Button>
        </div>
      ))}
    </div>
  );
};

export default MentorshipPage;
