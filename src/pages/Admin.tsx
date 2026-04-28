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
          <TabsList className="flex w-full overflow-x-auto md:grid md:max-w-3xl md:grid-cols-6">
            <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1.5" />Analytics</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1.5" />Users</TabsTrigger>
            <TabsTrigger value="moderation"><Clock className="w-4 h-4 mr-1.5" />Moderation</TabsTrigger>
            <TabsTrigger value="jobs"><Briefcase className="w-4 h-4 mr-1.5" />Jobs</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="w-4 h-4 mr-1.5" />Events</TabsTrigger>
            <TabsTrigger value="reports"><Flag className="w-4 h-4 mr-1.5" />Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6"><AnalyticsTab /></TabsContent>
          <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
          <TabsContent value="moderation" className="mt-6"><ModerationTab /></TabsContent>
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
  const [stats, setStats] = useState({ users: 0, verified: 0, suspended: 0, jobs: 0, pendingJobs: 0, events: 0, reports: 0, applications: 0 });
  const [signupsByDay, setSignupsByDay] = useState<{ day: string; n: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [u, v, s, j, pj, e, r, a, recent] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verified", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("suspended", true),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("directory_reports").select("id", { count: "exact", head: true }).eq("resolved", false),
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("created_at").gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
    ]);
    setStats({ users: u.count ?? 0, verified: v.count ?? 0, suspended: s.count ?? 0, jobs: j.count ?? 0, pendingJobs: pj.count ?? 0, events: e.count ?? 0, reports: r.count ?? 0, applications: a.count ?? 0 });
    const buckets: Record<string, number> = {};
    (recent.data ?? []).forEach((row: any) => {
      const d = new Date(row.created_at).toISOString().slice(0, 10);
      buckets[d] = (buckets[d] ?? 0) + 1;
    });
    const days: { day: string; n: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push({ day: d, n: buckets[d] ?? 0 });
    }
    setSignupsByDay(days);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const exportAll = async () => {
    const { data } = await supabase.from("profiles").select("display_name, email, department, graduation_year, city, state, phone, whatsapp, verified, suspended, created_at");
    downloadCsv(`coou-users-${new Date().toISOString().slice(0, 10)}`, (data ?? []) as any);
    toast.success("Users exported");
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  const cards = [
    { l: "Total users", v: stats.users, c: "from-primary to-primary-glow" },
    { l: "Verified", v: stats.verified, c: "from-green-600 to-emerald-500" },
    { l: "Suspended", v: stats.suspended, c: "from-red-600 to-orange-500" },
    { l: "Approved jobs", v: stats.jobs, c: "from-amber-600 to-yellow-500" },
    { l: "Pending jobs", v: stats.pendingJobs, c: "from-orange-600 to-amber-500" },
    { l: "Events", v: stats.events, c: "from-purple-600 to-fuchsia-500" },
    { l: "Applications", v: stats.applications, c: "from-blue-600 to-cyan-500" },
    { l: "Open reports", v: stats.reports, c: "from-rose-600 to-pink-500" },
  ];
  const max = Math.max(1, ...signupsByDay.map((d) => d.n));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={refresh} aria-label="Refresh analytics">Refresh</Button>
        <Button size="sm" variant="hero" onClick={exportAll} aria-label="Export users CSV"><Download className="w-4 h-4" /> Export users</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.l} className={`rounded-2xl p-5 bg-gradient-to-br ${c.c} text-white shadow-card`}>
            <div className="text-xs uppercase tracking-wider opacity-80">{c.l}</div>
            <div className="font-display text-3xl font-semibold mt-2">{c.v}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-card border border-border/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Signups · last 30 days</div>
            <div className="font-display text-xl font-semibold text-primary">{signupsByDay.reduce((a, b) => a + b.n, 0)} new alumni</div>
          </div>
        </div>
        <div className="flex items-end gap-1 h-32">
          {signupsByDay.map((d) => (
            <div key={d.day} title={`${d.day}: ${d.n}`} className="flex-1 bg-gradient-to-t from-primary to-primary-glow rounded-t" style={{ height: `${(d.n / max) * 100}%`, minHeight: 2 }} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
          <span>{signupsByDay[0]?.day}</span>
          <span>{signupsByDay[signupsByDay.length - 1]?.day}</span>
        </div>
      </div>
    </div>
  );
};

// -------- Moderation (pending jobs) --------
const ModerationTab = () => {
  const [pending, setPending] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [posters, setPosters] = useState<Record<string, { name: string | null; email: string | null }>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("jobs").select("*").eq("status", "pending").order("created_at", { ascending: false });
    const list = (data ?? []) as Job[];
    setPending(list);
    const ids = Array.from(new Set(list.map((j) => j.posted_by).filter(Boolean) as string[]));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", ids);
      const m: Record<string, { name: string | null; email: string | null }> = {};
      (ps ?? []).forEach((p: any) => { m[p.user_id] = { name: p.display_name, email: p.email }; });
      setPosters(m);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("jobs").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(status === "approved" ? "Approved & published" : "Rejected"); load(); }
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  if (pending.length === 0) return <p className="text-center text-muted-foreground py-12">No submissions awaiting review. ✨</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{pending.length} job submission{pending.length > 1 ? "s" : ""} awaiting review.</p>
      {pending.map((j) => {
        const p = j.posted_by ? posters[j.posted_by] : null;
        return (
          <div key={j.id} className="rounded-2xl bg-card border border-border/60 p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display font-semibold text-primary">{j.title}</div>
                <div className="text-sm text-muted-foreground">{j.company} · {j.location || "—"} · {j.type || "—"}</div>
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{j.description}</p>
                <div className="text-xs text-muted-foreground mt-3">
                  Submitted by <span className="font-medium">{p?.name || p?.email || "Unknown"}</span> · {new Date(j.created_at).toLocaleString()}
                  {j.apply_url && <> · <a href={j.apply_url} target="_blank" rel="noreferrer" className="text-primary underline">Apply link</a></>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="hero" onClick={() => decide(j.id, "approved")} aria-label="Approve job"><Check className="w-4 h-4" /> Approve</Button>
                <Button size="sm" variant="outline" onClick={() => decide(j.id, "rejected")} aria-label="Reject job"><XIcon className="w-4 h-4" /> Reject</Button>
              </div>
            </div>
          </div>
        );
      })}
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
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <Input placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" aria-label="Search users" />
        <Button size="sm" variant="outline" onClick={() => downloadCsv(`coou-users-filtered-${Date.now()}`, filtered as any)} aria-label="Export filtered users CSV"><Download className="w-4 h-4" /> Export ({filtered.length})</Button>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
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
    const payload: any = { title: editing.title, company: editing.company, location: editing.location, type: editing.type, description: editing.description, apply_url: editing.apply_url };
    if (!editing.id) payload.status = "approved"; // admin posts go live immediately
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
  const setStatus = async (id: string, status: string) => {
    await supabase.from("jobs").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    toast.success(`Marked ${status}`); load();
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Button onClick={() => setEditing({})} aria-label="Create new job"><Plus className="w-4 h-4" /> New job</Button>
        <Button size="sm" variant="outline" onClick={() => downloadCsv(`coou-jobs-${Date.now()}`, jobs as any)} aria-label="Export jobs CSV"><Download className="w-4 h-4" /> Export ({jobs.length})</Button>
      </div>
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
