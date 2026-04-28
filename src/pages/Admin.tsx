import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BadgeCheck, Ban, Shield, ShieldOff, Trash2, Plus, Pencil, Users, Briefcase, Calendar, Flag, BarChart3, Loader2, Download, Check, X as XIcon, Clock } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

type Role = "admin" | "moderator" | "user";

type ProfileRow = {
  id: string; user_id: string; display_name: string | null; email: string | null; avatar_url: string | null;
  verified: boolean; suspended: boolean; created_at: string; department: string | null; graduation_year: number | null;
};

type Job = { id: string; title: string; company: string; location: string | null; type: string | null; description: string | null; apply_url: string | null; created_at: string; status: string; posted_by: string | null };
type Event = { id: string; title: string; description: string | null; location: string | null; starts_at: string; ends_at: string | null; image_url: string | null };
type Report = { id: string; reporter_id: string; reported_user_id: string; reason: string; resolved: boolean; created_at: string };

const AdminPage = () => {
  useEffect(() => { document.title = "Admin — COOU Alumni Connect"; }, []);

  return (
    <AppShell>
      <section className="container py-10">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-2">Administration</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary">Admin Control Panel</h1>
          <p className="text-muted-foreground mt-2">Manage users, roles, content, and review platform analytics.</p>
        </div>

        <Tabs defaultValue="analytics">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1.5" />Analytics</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1.5" />Users</TabsTrigger>
            <TabsTrigger value="jobs"><Briefcase className="w-4 h-4 mr-1.5" />Jobs</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="w-4 h-4 mr-1.5" />Events</TabsTrigger>
            <TabsTrigger value="reports"><Flag className="w-4 h-4 mr-1.5" />Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6"><AnalyticsTab /></TabsContent>
          <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
          <TabsContent value="jobs" className="mt-6"><JobsTab /></TabsContent>
          <TabsContent value="events" className="mt-6"><EventsTab /></TabsContent>
          <TabsContent value="reports" className="mt-6"><ReportsTab /></TabsContent>
        </Tabs>
      </section>
    </AppShell>
  );
};

// -------- Analytics --------
const AnalyticsTab = () => {
  const [stats, setStats] = useState({ users: 0, verified: 0, suspended: 0, jobs: 0, events: 0, reports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const [u, v, s, j, e, r] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verified", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("suspended", true),
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("directory_reports").select("id", { count: "exact", head: true }).eq("resolved", false),
    ]);
    setStats({ users: u.count ?? 0, verified: v.count ?? 0, suspended: s.count ?? 0, jobs: j.count ?? 0, events: e.count ?? 0, reports: r.count ?? 0 });
    setLoading(false);
  })(); }, []);

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  const cards = [
    { l: "Total users", v: stats.users, c: "from-primary to-primary-glow" },
    { l: "Verified", v: stats.verified, c: "from-green-600 to-emerald-500" },
    { l: "Suspended", v: stats.suspended, c: "from-red-600 to-orange-500" },
    { l: "Jobs", v: stats.jobs, c: "from-amber-600 to-yellow-500" },
    { l: "Events", v: stats.events, c: "from-purple-600 to-fuchsia-500" },
    { l: "Open reports", v: stats.reports, c: "from-rose-600 to-pink-500" },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.l} className={`rounded-2xl p-6 bg-gradient-to-br ${c.c} text-white shadow-card`}>
          <div className="text-xs uppercase tracking-wider opacity-80">{c.l}</div>
          <div className="font-display text-4xl font-semibold mt-2">{c.v}</div>
        </div>
      ))}
    </div>
  );
};

// -------- Users --------
const UsersTab = () => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<Record<string, Role[]>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: ps } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: rs } = await supabase.from("user_roles").select("user_id, role");
    const map: Record<string, Role[]> = {};
    (rs ?? []).forEach((r: any) => { (map[r.user_id] ??= []).push(r.role); });
    setProfiles((ps ?? []) as ProfileRow[]);
    setRoles(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleVerify = async (p: ProfileRow) => {
    await supabase.from("profiles").update({ verified: !p.verified }).eq("user_id", p.user_id);
    toast.success(p.verified ? "Unverified" : "Verified");
    load();
  };
  const toggleSuspend = async (p: ProfileRow) => {
    await supabase.from("profiles").update({ suspended: !p.suspended }).eq("user_id", p.user_id);
    toast.success(p.suspended ? "Reinstated" : "Suspended");
    load();
  };
  const setRole = async (userId: string, role: Role, has: boolean) => {
    if (has) await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    else await supabase.from("user_roles").insert({ user_id: userId, role });
    toast.success("Role updated");
    load();
  };

  const filtered = profiles.filter((p) =>
    !q || (p.display_name + " " + p.email).toLowerCase().includes(q.toLowerCase())
  );

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-4">
      <Input placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left p-3">User</th><th className="text-left p-3">Roles</th><th className="text-left p-3">Status</th><th className="text-right p-3">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const r = roles[p.user_id] ?? [];
              return (
                <tr key={p.user_id} className="border-t border-border/60">
                  <td className="p-3">
                    <div className="font-medium">{p.display_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.email}</div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {(["admin", "moderator", "user"] as Role[]).map((role) => {
                        const has = r.includes(role);
                        return (
                          <button key={role} onClick={() => setRole(p.user_id, role, has)}
                            className={`px-2 py-0.5 rounded-full text-xs border ${has ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {p.verified && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Verified</span>}
                      {p.suspended && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">Suspended</span>}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => toggleVerify(p)} title={p.verified ? "Unverify" : "Verify"}>
                        <BadgeCheck className={`w-4 h-4 ${p.verified ? "text-green-600" : ""}`} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleSuspend(p)} title={p.suspended ? "Reinstate" : "Suspend"}>
                        {p.suspended ? <ShieldOff className="w-4 h-4 text-red-600" /> : <Ban className="w-4 h-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------- Jobs --------
const JobsTab = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [editing, setEditing] = useState<Partial<Job> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    setJobs((data ?? []) as Job[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title || !editing?.company) { toast.error("Title and company required"); return; }
    const payload = { title: editing.title, company: editing.company, location: editing.location, type: editing.type, description: editing.description, apply_url: editing.apply_url };
    const { error } = editing.id
      ? await supabase.from("jobs").update(payload).eq("id", editing.id)
      : await supabase.from("jobs").insert({ ...payload, posted_by: (await supabase.auth.getUser()).data.user?.id });
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setEditing(null); load(); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete job?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({})}><Plus className="w-4 h-4" /> New job</Button>
      <div className="grid gap-3">
        {jobs.map((j) => (
          <div key={j.id} className="rounded-2xl bg-card border border-border/60 p-5 flex items-start justify-between gap-4">
            <div>
              <div className="font-display font-semibold text-primary">{j.title}</div>
              <div className="text-sm text-muted-foreground">{j.company} · {j.location} · {j.type}</div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{j.description}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing(j)}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(j.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <p className="text-center text-muted-foreground py-8">No jobs yet.</p>}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit job" : "New job"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Company</Label><Input value={editing.company ?? ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })} /></div>
                <div><Label>Location</Label><Input value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="Lagos, Nigeria" /></div>
              </div>
              <div><Label>Type</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={editing.type ?? ""} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  <option value="">Select</option><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                </select>
              </div>
              <div><Label>Description</Label><Textarea rows={4} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} maxLength={2000} /></div>
              <div><Label>Apply URL</Label><Input value={editing.apply_url ?? ""} onChange={(e) => setEditing({ ...editing, apply_url: e.target.value })} placeholder="https://..." /></div>
            </div>
          )}
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// -------- Events --------
const EventsTab = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [editing, setEditing] = useState<Partial<Event> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
    setEvents((data ?? []) as Event[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.title || !editing?.starts_at) { toast.error("Title and start date required"); return; }
    const payload = { title: editing.title, description: editing.description, location: editing.location, starts_at: editing.starts_at, ends_at: editing.ends_at, image_url: editing.image_url };
    const { error } = editing.id
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id });
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setEditing(null); load(); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete event?")) return;
    await supabase.from("events").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({})}><Plus className="w-4 h-4" /> New event</Button>
      <div className="grid gap-3">
        {events.map((e) => (
          <div key={e.id} className="rounded-2xl bg-card border border-border/60 p-5 flex items-start justify-between gap-4">
            <div>
              <div className="font-display font-semibold text-primary">{e.title}</div>
              <div className="text-sm text-muted-foreground">{new Date(e.starts_at).toLocaleString()} · {e.location}</div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{e.description}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing(e)}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-center text-muted-foreground py-8">No events yet.</p>}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit event" : "New event"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={editing.title ?? ""} onChange={(ev) => setEditing({ ...editing, title: ev.target.value })} /></div>
              <div><Label>Location</Label><Input value={editing.location ?? ""} onChange={(ev) => setEditing({ ...editing, location: ev.target.value })} placeholder="COOU Igbariam Campus" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Starts at</Label><Input type="datetime-local" value={editing.starts_at?.slice(0, 16) ?? ""} onChange={(ev) => setEditing({ ...editing, starts_at: ev.target.value })} /></div>
                <div><Label>Ends at</Label><Input type="datetime-local" value={editing.ends_at?.slice(0, 16) ?? ""} onChange={(ev) => setEditing({ ...editing, ends_at: ev.target.value })} /></div>
              </div>
              <div><Label>Description</Label><Textarea rows={4} value={editing.description ?? ""} onChange={(ev) => setEditing({ ...editing, description: ev.target.value })} maxLength={2000} /></div>
              <div><Label>Image URL</Label><Input value={editing.image_url ?? ""} onChange={(ev) => setEditing({ ...editing, image_url: ev.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// -------- Reports --------
const ReportsTab = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const { data } = await supabase.from("directory_reports").select("*").order("created_at", { ascending: false });
    setReports((data ?? []) as Report[]); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id: string) => {
    await supabase.from("directory_reports").update({ resolved: true }).eq("id", id);
    toast.success("Resolved"); load();
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded-2xl bg-card border border-border/60 p-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm">Reported user: <code className="text-xs">{r.reported_user_id}</code></div>
            <p className="mt-1">{r.reason}</p>
            <div className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</div>
          </div>
          {!r.resolved ? (
            <Button size="sm" onClick={() => resolve(r.id)}>Resolve</Button>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Resolved</span>
          )}
        </div>
      ))}
      {reports.length === 0 && <p className="text-center text-muted-foreground py-8">No reports.</p>}
    </div>
  );
};

export default AdminPage;
