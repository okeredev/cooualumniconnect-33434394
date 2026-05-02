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
import { BadgeCheck, Ban, Shield, ShieldOff, Trash2, Plus, Pencil, Users, Briefcase, Calendar, Flag, BarChart3, Loader2, Download, Check, X as XIcon, Clock, Heart, GraduationCap, BookOpen, Upload, KeyRound, Eye, Cake, FileText, ExternalLink } from "lucide-react";
import { downloadCsv } from "@/lib/csv";

type Role = "admin" | "moderator" | "user";

// Generic bulk-selection helper used by every admin table
const useBulkSelect = <T extends { id: string }>(items: T[]) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  useEffect(() => {
    // Drop ids that no longer exist after a refresh
    setSelected((prev) => {
      const valid = new Set(items.map((i) => i.id));
      const next = new Set<string>();
      prev.forEach((id) => valid.has(id) && next.add(id));
      return next;
    });
  }, [items]);
  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  const toggleOne = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clear = () => setSelected(new Set());
  return { selected, allSelected, toggleAll, toggleOne, clear };
};

const bulkDelete = async (table: string, ids: string[], onDone: () => void) => {
  if (ids.length === 0) return;
  if (!confirm(`Delete ${ids.length} selected item${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
  const { error } = await supabase.from(table as any).delete().in("id", ids);
  if (error) toast.error(error.message);
  else { toast.success(`Deleted ${ids.length} item${ids.length > 1 ? "s" : ""}`); onDone(); }
};

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
          <TabsList className="flex w-full overflow-x-auto md:grid md:max-w-5xl md:grid-cols-9">
            <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1.5" />Analytics</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1.5" />Users</TabsTrigger>
            <TabsTrigger value="moderation"><Clock className="w-4 h-4 mr-1.5" />Moderation</TabsTrigger>
            <TabsTrigger value="jobs"><Briefcase className="w-4 h-4 mr-1.5" />Jobs</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="w-4 h-4 mr-1.5" />Events</TabsTrigger>
            <TabsTrigger value="donations"><Heart className="w-4 h-4 mr-1.5" />Donations</TabsTrigger>
            <TabsTrigger value="mentorship"><GraduationCap className="w-4 h-4 mr-1.5" />Mentorship</TabsTrigger>
            <TabsTrigger value="resources"><BookOpen className="w-4 h-4 mr-1.5" />Resources</TabsTrigger>
            <TabsTrigger value="reports"><Flag className="w-4 h-4 mr-1.5" />Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6"><AnalyticsTab /></TabsContent>
          <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
          <TabsContent value="moderation" className="mt-6"><ModerationTab /></TabsContent>
          <TabsContent value="jobs" className="mt-6"><JobsTab /></TabsContent>
          <TabsContent value="events" className="mt-6"><EventsTab /></TabsContent>
          <TabsContent value="donations" className="mt-6"><DonationsTab /></TabsContent>
          <TabsContent value="mentorship" className="mt-6"><MentorshipTab /></TabsContent>
          <TabsContent value="resources" className="mt-6"><ResourcesTab /></TabsContent>
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
  const [birthdays, setBirthdays] = useState<{ user_id: string; display_name: string | null; avatar_url: string | null; date_of_birth: string; daysUntil: number; turning: number }[]>([]);
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

    // Upcoming birthdays in the next 60 days
    const { data: dobRows } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, date_of_birth")
      .not("date_of_birth", "is", null)
      .eq("suspended", false);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = (dobRows ?? [])
      .map((r: any) => {
        const dob = new Date(r.date_of_birth);
        const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        if (next < today) next.setFullYear(today.getFullYear() + 1);
        const daysUntil = Math.round((next.getTime() - today.getTime()) / 86400000);
        const turning = next.getFullYear() - dob.getFullYear();
        return { ...r, daysUntil, turning };
      })
      .filter((r: any) => r.daysUntil <= 60)
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil)
      .slice(0, 25);
    setBirthdays(upcoming);

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

      {/* Upcoming birthdays */}
      <div className="rounded-2xl bg-card border border-border/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Cake className="w-3.5 h-3.5" /> Upcoming birthdays</div>
            <div className="font-display text-xl font-semibold text-primary">{birthdays.length} alumni in the next 60 days</div>
          </div>
        </div>
        {birthdays.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No birthdays in the next 60 days, or no alumni have added their date of birth yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {birthdays.map((b) => {
              const dob = new Date(b.date_of_birth);
              const monthDay = dob.toLocaleDateString(undefined, { month: "short", day: "numeric" });
              const isToday = b.daysUntil === 0;
              const isSoon = b.daysUntil <= 7;
              return (
                <div key={b.user_id} className={`rounded-xl border p-3 flex items-center gap-3 ${isToday ? "bg-gold/10 border-gold/40" : isSoon ? "bg-primary/5 border-primary/20" : "border-border/60"}`}>
                  {b.avatar_url ? (
                    <img src={b.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted grid place-items-center text-sm flex-shrink-0">{(b.display_name || "?")[0]}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{b.display_name || "Alumnus"}</div>
                    <div className="text-xs text-muted-foreground">
                      {monthDay} · turning {b.turning}
                    </div>
                  </div>
                  <div className={`text-xs font-semibold flex-shrink-0 ${isToday ? "text-gold" : isSoon ? "text-primary" : "text-muted-foreground"}`}>
                    {isToday ? "Today!" : `${b.daysUntil}d`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

// -------- Users (advanced: bulk select, password reset, delete, drill-down) --------
type FullProfile = ProfileRow & {
  bio: string | null; phone: string | null; whatsapp: string | null; city: string | null; state: string | null;
  country: string | null; address: string | null; current_address: string | null; linkedin: string | null;
  github: string | null; twitter: string | null; website: string | null; hide_phone: boolean;
  last_seen_at: string | null; date_of_birth: string | null; certificate_url: string | null;
};

const UsersTab = () => {
  const [profiles, setProfiles] = useState<FullProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, Role[]>>({});
  const [counts, setCounts] = useState<Record<string, { jobs: number; donations: number; events: number }>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "suspended" | "admins">("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [resetTarget, setResetTarget] = useState<FullProfile | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [resetting, setResetting] = useState(false);
  const [detail, setDetail] = useState<FullProfile | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: ps } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: rs } = await supabase.from("user_roles").select("user_id, role");
    const map: Record<string, Role[]> = {};
    (rs ?? []).forEach((r: any) => { (map[r.user_id] ??= []).push(r.role); });
    setProfiles((ps ?? []) as FullProfile[]);
    setRoles(map);
    setSelected(new Set());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadCountsFor = async (userId: string) => {
    if (counts[userId]) return;
    const [j, d, e] = await Promise.all([
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("donations").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("event_rsvps").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    setCounts((c) => ({ ...c, [userId]: { jobs: j.count ?? 0, donations: d.count ?? 0, events: e.count ?? 0 } }));
  };

  const toggleVerify = async (p: FullProfile) => {
    await supabase.from("profiles").update({ verified: !p.verified }).eq("user_id", p.user_id);
    toast.success(p.verified ? "Unverified" : "Verified"); load();
  };
  const toggleSuspend = async (p: FullProfile) => {
    await supabase.from("profiles").update({ suspended: !p.suspended }).eq("user_id", p.user_id);
    toast.success(p.suspended ? "Reinstated" : "Suspended"); load();
  };
  const setRole = async (userId: string, role: Role, has: boolean) => {
    if (has) await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    else await supabase.from("user_roles").insert({ user_id: userId, role });
    toast.success("Role updated"); load();
  };

  const submitReset = async () => {
    if (!resetTarget || newPwd.length < 8) { toast.error("Password must be 8+ characters"); return; }
    setResetting(true);
    const { data, error } = await supabase.functions.invoke("admin-reset-password", {
      body: { user_id: resetTarget.user_id, new_password: newPwd },
    });
    setResetting(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Reset failed");
    } else {
      toast.success(`Password reset for ${resetTarget.display_name || resetTarget.email}`);
      setResetTarget(null); setNewPwd("");
    }
  };

  const deleteUsers = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Permanently delete ${ids.length} user${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    const { data, error } = await supabase.functions.invoke("admin-delete-users", { body: { user_ids: ids } });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Delete failed");
    } else {
      const failed = ((data as any)?.results ?? []).filter((r: any) => !r.ok);
      if (failed.length) toast.error(`${failed.length} failed`);
      else toast.success(`Deleted ${ids.length} user${ids.length > 1 ? "s" : ""}`);
      load();
    }
  };

  const filtered = profiles.filter((p) => {
    if (q && !((p.display_name || "") + " " + (p.email || "")).toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "verified" && !p.verified) return false;
    if (filter === "suspended" && !p.suspended) return false;
    if (filter === "admins" && !(roles[p.user_id] ?? []).includes("admin")) return false;
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.user_id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.user_id)));
  };
  const toggleOne = (id: string) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Input placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" aria-label="Search users" />
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as any)} aria-label="Filter users">
            <option value="all">All ({profiles.length})</option>
            <option value="verified">Verified</option>
            <option value="suspended">Suspended</option>
            <option value="admins">Admins</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          {selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => deleteUsers(Array.from(selected))}><Trash2 className="w-4 h-4 text-destructive" /> Delete selected</Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => downloadCsv(`coou-users-filtered-${Date.now()}`, filtered as any)}><Download className="w-4 h-4" /> Export ({filtered.length})</Button>
        </div>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3 w-8"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Roles</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Joined</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const r = roles[p.user_id] ?? [];
              const isSel = selected.has(p.user_id);
              return (
                <tr key={p.user_id} className={`border-t border-border/60 ${isSel ? "bg-muted/40" : ""}`}>
                  <td className="p-3"><input type="checkbox" checked={isSel} onChange={() => toggleOne(p.user_id)} aria-label={`Select ${p.display_name || p.email}`} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-muted grid place-items-center text-xs">{(p.display_name || p.email || "?")[0]}</div>}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.display_name || "—"}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.email}</div>
                      </div>
                    </div>
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
                    <div className="flex gap-1 flex-wrap">
                      {p.verified && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Verified</span>}
                      {p.suspended && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">Suspended</span>}
                      {!p.verified && !p.suspended && <span className="text-xs text-muted-foreground">Active</span>}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => { setDetail(p); loadCountsFor(p.user_id); }} title="View details"><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleVerify(p)} title={p.verified ? "Unverify" : "Verify"}>
                        <BadgeCheck className={`w-4 h-4 ${p.verified ? "text-green-600" : ""}`} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleSuspend(p)} title={p.suspended ? "Reinstate" : "Suspend"}>
                        {p.suspended ? <ShieldOff className="w-4 h-4 text-red-600" /> : <Ban className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setResetTarget(p); setNewPwd(""); }} title="Reset password">
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteUsers([p.user_id])} title="Delete user">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) { setResetTarget(null); setNewPwd(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset password — {resetTarget?.display_name || resetTarget?.email}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Set a new password for this user. They'll be able to sign in immediately with the new password.</p>
            <div>
              <Label>New password (min 8 chars)</Label>
              <Input type="text" autoFocus value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="e.g. Welcome2026!" maxLength={200} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetTarget(null); setNewPwd(""); }}>Cancel</Button>
            <Button onClick={submitReset} disabled={resetting || newPwd.length < 8}>
              {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {detail.avatar_url ? <img src={detail.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" /> : <div className="w-12 h-12 rounded-full bg-muted grid place-items-center">{(detail.display_name || "?")[0]}</div>}
                  <div className="min-w-0">
                    <div className="truncate">{detail.display_name || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground font-normal truncate">{detail.email}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label="Department" value={detail.department} />
                  <DetailRow label="Graduation year" value={detail.graduation_year} />
                  <DetailRow label="Phone" value={detail.phone || "—"} />
                  <DetailRow label="WhatsApp" value={detail.whatsapp || "—"} />
                  <DetailRow label="City" value={detail.city || "—"} />
                  <DetailRow label="State" value={detail.state || "—"} />
                  <DetailRow label="Country" value={detail.country || "—"} />
                  <DetailRow label="Hide phone" value={detail.hide_phone ? "Yes" : "No"} />
                  <DetailRow label="Last seen" value={detail.last_seen_at ? new Date(detail.last_seen_at).toLocaleString() : "Never"} />
                  <DetailRow label="Joined" value={new Date(detail.created_at).toLocaleString()} />
                </div>
                {detail.bio && (
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
                    <p className="mt-1 whitespace-pre-line">{detail.bio}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Activity</Label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <Stat label="Job apps" value={counts[detail.user_id]?.jobs ?? "…"} />
                    <Stat label="Donations" value={counts[detail.user_id]?.donations ?? "…"} />
                    <Stat label="Event RSVPs" value={counts[detail.user_id]?.events ?? "…"} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  User ID: <code className="text-[10px]">{detail.user_id}</code>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setResetTarget(detail); setDetail(null); }}><KeyRound className="w-4 h-4" /> Reset password</Button>
                <Button variant="outline" onClick={() => { deleteUsers([detail.user_id]); setDetail(null); }}><Trash2 className="w-4 h-4 text-destructive" /> Delete user</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: any }) => (
  <div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-medium truncate">{value ?? "—"}</div>
  </div>
);


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

  return <JobsTabInner jobs={jobs} editing={editing} setEditing={setEditing} load={load} save={save} remove={remove} setStatus={setStatus} />;
};

const JobsTabInner = ({ jobs, editing, setEditing, load, save, remove, setStatus }: any) => {
  const sel = useBulkSelect(jobs);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Button onClick={() => setEditing({})} aria-label="Create new job"><Plus className="w-4 h-4" /> New job</Button>
        <div className="flex gap-2 items-center">
          {sel.selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{sel.selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => bulkDelete("jobs", Array.from(sel.selected), () => { sel.clear(); load(); })}><Trash2 className="w-4 h-4 text-destructive" /> Delete selected</Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => downloadCsv(`coou-jobs-${Date.now()}`, jobs as any)}><Download className="w-4 h-4" /> Export ({jobs.length})</Button>
        </div>
      </div>
      <div className="flex items-center gap-2 px-2">
        <input type="checkbox" checked={sel.allSelected} onChange={sel.toggleAll} aria-label="Select all jobs" />
        <span className="text-xs text-muted-foreground">Select all</span>
      </div>
      <div className="grid gap-3">
        {jobs.map((j: Job) => (
          <div key={j.id} className={`rounded-2xl bg-card border border-border/60 p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3 ${sel.selected.has(j.id) ? "ring-2 ring-primary/40" : ""}`}>
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <input type="checkbox" className="mt-1.5" checked={sel.selected.has(j.id)} onChange={() => sel.toggleOne(j.id)} aria-label={`Select ${j.title}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-semibold text-primary">{j.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${j.status === "approved" ? "bg-green-100 text-green-800" : j.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{j.status}</span>
                </div>
                <div className="text-sm text-muted-foreground">{j.company} · {j.location || "—"} · {j.type || "—"}</div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{j.description}</p>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              {j.status !== "approved" && <Button size="sm" variant="outline" onClick={() => setStatus(j.id, "approved")} aria-label="Approve"><Check className="w-4 h-4" /></Button>}
              {j.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => setStatus(j.id, "rejected")} aria-label="Reject"><XIcon className="w-4 h-4" /></Button>}
              <Button size="sm" variant="ghost" onClick={() => setEditing(j)} aria-label="Edit"><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(j.id)} aria-label="Delete"><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

// -------- Events (advanced: bulk select, view, delete) --------
const EventsTab = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [editing, setEditing] = useState<Partial<Event> | null>(null);
  const [viewing, setViewing] = useState<Event | null>(null);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const sel = useBulkSelect(events);

  const load = async () => {
    const { data } = await supabase.from("events").select("*").order("starts_at", { ascending: true });
    const list = (data ?? []) as Event[];
    setEvents(list);
    if (list.length) {
      const ids = list.map((e) => e.id);
      const { data: rs } = await supabase.from("event_rsvps").select("event_id").in("event_id", ids);
      const map: Record<string, number> = {};
      (rs ?? []).forEach((r: any) => { map[r.event_id] = (map[r.event_id] ?? 0) + 1; });
      setRsvpCounts(map);
    }
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
    if (!confirm("Delete event? This also removes all RSVPs.")) return;
    await supabase.from("events").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Button onClick={() => setEditing({})}><Plus className="w-4 h-4" /> New event</Button>
        <div className="flex gap-2 items-center">
          {sel.selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{sel.selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => bulkDelete("events", Array.from(sel.selected), () => { sel.clear(); load(); })}><Trash2 className="w-4 h-4 text-destructive" /> Delete selected</Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => downloadCsv(`coou-events-${Date.now()}`, events as any)}><Download className="w-4 h-4" /> Export ({events.length})</Button>
        </div>
      </div>
      <div className="flex items-center gap-2 px-2">
        <input type="checkbox" checked={sel.allSelected} onChange={sel.toggleAll} aria-label="Select all events" />
        <span className="text-xs text-muted-foreground">Select all</span>
      </div>
      <div className="grid gap-3">
        {events.map((e) => (
          <div key={e.id} className={`rounded-2xl bg-card border border-border/60 p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3 ${sel.selected.has(e.id) ? "ring-2 ring-primary/40" : ""}`}>
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <input type="checkbox" className="mt-1.5" checked={sel.selected.has(e.id)} onChange={() => sel.toggleOne(e.id)} aria-label={`Select ${e.title}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-semibold text-primary">{e.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-muted">{rsvpCounts[e.id] ?? 0} RSVPs</span>
                </div>
                <div className="text-sm text-muted-foreground">{new Date(e.starts_at).toLocaleString()} · {e.location || "—"}</div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{e.description}</p>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={() => setViewing(e)} title="View details"><Eye className="w-4 h-4" /></Button>
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

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader><DialogTitle className="font-display text-xl">{viewing.title}</DialogTitle></DialogHeader>
              {viewing.image_url && <img src={viewing.image_url} alt="" className="w-full h-48 object-cover rounded-lg" />}
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label="Starts" value={new Date(viewing.starts_at).toLocaleString()} />
                  <DetailRow label="Ends" value={viewing.ends_at ? new Date(viewing.ends_at).toLocaleString() : "—"} />
                  <DetailRow label="Location" value={viewing.location || "—"} />
                  <DetailRow label="RSVPs" value={rsvpCounts[viewing.id] ?? 0} />
                </div>
                {viewing.description && <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label><p className="mt-1 whitespace-pre-line">{viewing.description}</p></div>}
                <div className="text-xs text-muted-foreground">Event ID: <code className="text-[10px]">{viewing.id}</code></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setEditing(viewing); setViewing(null); }}><Pencil className="w-4 h-4" /> Edit</Button>
                <Button variant="outline" onClick={() => { remove(viewing.id); setViewing(null); }}><Trash2 className="w-4 h-4 text-destructive" /> Delete</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// -------- Reports (advanced: bulk delete, view detail with reporter & target profiles) --------
const ReportsTab = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string | null; email: string | null }>>({});
  const [viewing, setViewing] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const sel = useBulkSelect(reports);

  const load = async () => {
    const { data } = await supabase.from("directory_reports").select("*").order("created_at", { ascending: false });
    const list = (data ?? []) as Report[];
    setReports(list);
    const ids = Array.from(new Set([...list.map((r) => r.reporter_id), ...list.map((r) => r.reported_user_id)]));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", ids);
      const m: Record<string, { name: string | null; email: string | null }> = {};
      (ps ?? []).forEach((p: any) => { m[p.user_id] = { name: p.display_name, email: p.email }; });
      setProfiles(m);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id: string) => {
    await supabase.from("directory_reports").update({ resolved: true }).eq("id", id);
    toast.success("Resolved"); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete report?")) return;
    await supabase.from("directory_reports").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={sel.allSelected} onChange={sel.toggleAll} aria-label="Select all reports" />
          <span className="text-xs text-muted-foreground">Select all · {reports.length} total</span>
        </div>
        <div className="flex gap-2 items-center">
          {sel.selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{sel.selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => bulkDelete("directory_reports", Array.from(sel.selected), () => { sel.clear(); load(); })}><Trash2 className="w-4 h-4 text-destructive" /> Delete selected</Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => downloadCsv(`coou-reports-${Date.now()}`, reports as any)}><Download className="w-4 h-4" /> Export</Button>
        </div>
      </div>
      <div className="grid gap-3">
        {reports.map((r) => {
          const reporter = profiles[r.reporter_id];
          const target = profiles[r.reported_user_id];
          return (
            <div key={r.id} className={`rounded-2xl bg-card border border-border/60 p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3 ${sel.selected.has(r.id) ? "ring-2 ring-primary/40" : ""}`}>
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <input type="checkbox" className="mt-1.5" checked={sel.selected.has(r.id)} onChange={() => sel.toggleOne(r.id)} aria-label="Select report" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{reporter?.name || reporter?.email || "Unknown"}</span>
                    <span className="text-muted-foreground"> reported </span>
                    <span className="font-medium">{target?.name || target?.email || "Unknown"}</span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">{r.reason}</p>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0 items-center">
                {r.resolved
                  ? <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Resolved</span>
                  : <Button size="sm" onClick={() => resolve(r.id)}>Resolve</Button>}
                <Button size="sm" variant="ghost" onClick={() => setViewing(r)}><Eye className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          );
        })}
        {reports.length === 0 && <p className="text-center text-muted-foreground py-8">No reports.</p>}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          {viewing && (
            <>
              <DialogHeader><DialogTitle>Report details</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <DetailRow label="Reporter" value={profiles[viewing.reporter_id]?.name || profiles[viewing.reporter_id]?.email || viewing.reporter_id} />
                <DetailRow label="Reported user" value={profiles[viewing.reported_user_id]?.name || profiles[viewing.reported_user_id]?.email || viewing.reported_user_id} />
                <DetailRow label="Submitted" value={new Date(viewing.created_at).toLocaleString()} />
                <DetailRow label="Status" value={viewing.resolved ? "Resolved" : "Open"} />
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Reason</Label>
                  <p className="mt-1 whitespace-pre-line">{viewing.reason}</p>
                </div>
              </div>
              <DialogFooter>
                {!viewing.resolved && <Button onClick={() => { resolve(viewing.id); setViewing(null); }}>Mark resolved</Button>}
                <Button variant="outline" onClick={() => { remove(viewing.id); setViewing(null); }}><Trash2 className="w-4 h-4 text-destructive" /> Delete</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// -------- Donations (advanced: bulk select, donor profile lookup, view detail) --------
const DonationsTab = () => {
  const [items, setItems] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string | null; email: string | null }>>({});
  const [viewing, setViewing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const sel = useBulkSelect(items);

  const load = async () => {
    const { data } = await supabase.from("donations").select("*").order("created_at", { ascending: false });
    const list = data ?? [];
    setItems(list);
    const ids = Array.from(new Set(list.map((d: any) => d.user_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", ids);
      const m: Record<string, { name: string | null; email: string | null }> = {};
      (ps ?? []).forEach((p: any) => { m[p.user_id] = { name: p.display_name, email: p.email }; });
      setProfiles(m);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await supabase.from("donations").update({ status }).eq("id", id);
    toast.success(`Marked ${status}`); load();
  };
  const remove = async (id: string) => { if (!confirm("Delete pledge?")) return; await supabase.from("donations").delete().eq("id", id); load(); };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;
  const total = items.reduce((s, i) => s + Number(i.amount), 0);
  const fulfilled = items.filter((i) => i.status === "fulfilled").reduce((s, i) => s + Number(i.amount), 0);
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Total pledges" value={items.length} />
        <Stat label="Pledged amount" value={total.toLocaleString()} />
        <Stat label="Fulfilled" value={fulfilled.toLocaleString()} />
      </div>
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          {sel.selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{sel.selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => bulkDelete("donations", Array.from(sel.selected), () => { sel.clear(); load(); })}><Trash2 className="w-4 h-4 text-destructive" /> Delete selected</Button>
            </>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => downloadCsv(`coou-donations-${Date.now()}`, items as any)}><Download className="w-4 h-4" /> Export</Button>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3 w-8"><input type="checkbox" checked={sel.allSelected} onChange={sel.toggleAll} aria-label="Select all" /></th>
              <th className="text-left p-3">Donor</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Purpose</th><th className="text-left p-3">Status</th><th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => {
              const donor = profiles[d.user_id];
              return (
                <tr key={d.id} className={`border-t border-border/60 ${sel.selected.has(d.id) ? "bg-muted/40" : ""}`}>
                  <td className="p-3"><input type="checkbox" checked={sel.selected.has(d.id)} onChange={() => sel.toggleOne(d.id)} aria-label="Select" /></td>
                  <td className="p-3 text-xs">
                    <div className="font-medium">{donor?.name || "Unknown"}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{donor?.email || d.user_id.slice(0, 8) + "…"}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="p-3 font-medium">{d.currency} {Number(d.amount).toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground truncate max-w-[200px]">{d.purpose || "—"}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${d.status === "fulfilled" ? "bg-green-100 text-green-800" : d.status === "cancelled" ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-800"}`}>{d.status}</span></td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setViewing(d)} title="View"><Eye className="w-4 h-4" /></Button>
                      {d.status !== "fulfilled" && <Button size="sm" variant="outline" onClick={() => setStatus(d.id, "fulfilled")}>Fulfill</Button>}
                      {d.status !== "cancelled" && <Button size="sm" variant="ghost" onClick={() => setStatus(d.id, "cancelled")}>Cancel</Button>}
                      <Button size="sm" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No pledges yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          {viewing && (
            <>
              <DialogHeader><DialogTitle>Pledge details</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow label="Donor" value={profiles[viewing.user_id]?.name || "Unknown"} />
                <DetailRow label="Email" value={profiles[viewing.user_id]?.email || "—"} />
                <DetailRow label="Amount" value={`${viewing.currency} ${Number(viewing.amount).toLocaleString()}`} />
                <DetailRow label="Status" value={viewing.status} />
                <DetailRow label="Purpose" value={viewing.purpose || "—"} />
                <DetailRow label="Created" value={new Date(viewing.created_at).toLocaleString()} />
              </div>
              {viewing.message && <div className="mt-3"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Message</Label><p className="mt-1 whitespace-pre-line text-sm">{viewing.message}</p></div>}
              <DialogFooter>
                {viewing.status !== "fulfilled" && <Button onClick={() => { setStatus(viewing.id, "fulfilled"); setViewing(null); }}>Mark fulfilled</Button>}
                <Button variant="outline" onClick={() => { remove(viewing.id); setViewing(null); }}><Trash2 className="w-4 h-4 text-destructive" /> Delete</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// -------- Mentorship (advanced: bulk select, request status, view profiles) --------
const MentorshipTab = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string | null; email: string | null }>>({});
  const [viewMentor, setViewMentor] = useState<any | null>(null);
  const [viewReq, setViewReq] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const mentorSel = useBulkSelect(mentors);
  const reqSel = useBulkSelect(requests);

  const load = async () => {
    const [m, r] = await Promise.all([
      supabase.from("mentor_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("mentorship_requests").select("*").order("created_at", { ascending: false }),
    ]);
    setMentors(m.data ?? []); setRequests(r.data ?? []);
    const ids = Array.from(new Set([
      ...((m.data ?? []).map((x: any) => x.user_id)),
      ...((r.data ?? []).map((x: any) => x.mentor_id)),
      ...((r.data ?? []).map((x: any) => x.mentee_id)),
    ]));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("user_id, display_name, email").in("user_id", ids);
      const map: Record<string, { name: string | null; email: string | null }> = {};
      (ps ?? []).forEach((p: any) => { map[p.user_id] = { name: p.display_name, email: p.email }; });
      setProfiles(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setReqStatus = async (id: string, status: string) => {
    await supabase.from("mentorship_requests").update({ status }).eq("id", id);
    toast.success(`Marked ${status}`); load();
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;
  const accepted = requests.filter((r) => r.status === "accepted").length;
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Mentors" value={mentors.length} />
        <Stat label="Requests" value={requests.length} />
        <Stat label="Active matches" value={accepted} />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => downloadCsv(`mentors-${Date.now()}`, mentors as any)}><Download className="w-4 h-4" /> Mentors</Button>
        <Button size="sm" variant="outline" onClick={() => downloadCsv(`mentorship-requests-${Date.now()}`, requests as any)}><Download className="w-4 h-4" /> Requests</Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Mentors ({mentors.length})</h3>
          {mentorSel.selected.size > 0 && (
            <Button size="sm" variant="outline" onClick={() => bulkDelete("mentor_profiles", Array.from(mentorSel.selected), () => { mentorSel.clear(); load(); })}><Trash2 className="w-4 h-4 text-destructive" /> Delete {mentorSel.selected.size}</Button>
          )}
        </div>
        <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 w-8"><input type="checkbox" checked={mentorSel.allSelected} onChange={mentorSel.toggleAll} aria-label="Select all mentors" /></th>
                <th className="text-left p-3">Mentor</th><th className="text-left p-3">Topics</th><th className="text-left p-3">Capacity</th><th className="text-left p-3">Available</th><th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mentors.map((m) => {
                const p = profiles[m.user_id];
                return (
                  <tr key={m.id} className={`border-t border-border/60 ${mentorSel.selected.has(m.id) ? "bg-muted/40" : ""}`}>
                    <td className="p-3"><input type="checkbox" checked={mentorSel.selected.has(m.id)} onChange={() => mentorSel.toggleOne(m.id)} aria-label="Select mentor" /></td>
                    <td className="p-3"><div className="font-medium">{p?.name || "Unknown"}</div><div className="text-[11px] text-muted-foreground truncate">{p?.email || m.user_id.slice(0, 8)}</div></td>
                    <td className="p-3 text-muted-foreground">{(m.topics ?? []).join(", ") || "—"}</td>
                    <td className="p-3">{m.capacity}</td>
                    <td className="p-3">{m.available ? <span className="text-green-700">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                    <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => setViewMentor(m)}><Eye className="w-4 h-4" /></Button></td>
                  </tr>
                );
              })}
              {mentors.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No mentors yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Requests ({requests.length})</h3>
          {reqSel.selected.size > 0 && (
            <Button size="sm" variant="outline" onClick={() => bulkDelete("mentorship_requests", Array.from(reqSel.selected), () => { reqSel.clear(); load(); })}><Trash2 className="w-4 h-4 text-destructive" /> Delete {reqSel.selected.size}</Button>
          )}
        </div>
        <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 w-8"><input type="checkbox" checked={reqSel.allSelected} onChange={reqSel.toggleAll} aria-label="Select all requests" /></th>
                <th className="text-left p-3">Mentee</th><th className="text-left p-3">Mentor</th><th className="text-left p-3">Status</th><th className="text-left p-3">When</th><th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className={`border-t border-border/60 ${reqSel.selected.has(r.id) ? "bg-muted/40" : ""}`}>
                  <td className="p-3"><input type="checkbox" checked={reqSel.selected.has(r.id)} onChange={() => reqSel.toggleOne(r.id)} aria-label="Select request" /></td>
                  <td className="p-3 text-xs">{profiles[r.mentee_id]?.name || r.mentee_id.slice(0, 8)}</td>
                  <td className="p-3 text-xs">{profiles[r.mentor_id]?.name || r.mentor_id.slice(0, 8)}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${r.status === "accepted" ? "bg-green-100 text-green-800" : r.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{r.status}</span></td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" onClick={() => setViewReq(r)}><Eye className="w-4 h-4" /></Button>
                      {r.status === "pending" && <Button size="sm" variant="outline" onClick={() => setReqStatus(r.id, "accepted")}>Accept</Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!viewMentor} onOpenChange={(o) => !o && setViewMentor(null)}>
        <DialogContent>
          {viewMentor && (
            <>
              <DialogHeader><DialogTitle>Mentor profile</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow label="Name" value={profiles[viewMentor.user_id]?.name || "Unknown"} />
                <DetailRow label="Email" value={profiles[viewMentor.user_id]?.email || "—"} />
                <DetailRow label="Capacity" value={viewMentor.capacity} />
                <DetailRow label="Available" value={viewMentor.available ? "Yes" : "No"} />
              </div>
              {viewMentor.bio && <div className="mt-3"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</Label><p className="mt-1 whitespace-pre-line text-sm">{viewMentor.bio}</p></div>}
              <div className="mt-3"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Topics</Label><p className="mt-1 text-sm">{(viewMentor.topics ?? []).join(", ") || "—"}</p></div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewReq} onOpenChange={(o) => !o && setViewReq(null)}>
        <DialogContent>
          {viewReq && (
            <>
              <DialogHeader><DialogTitle>Mentorship request</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailRow label="Mentee" value={profiles[viewReq.mentee_id]?.name || "Unknown"} />
                <DetailRow label="Mentor" value={profiles[viewReq.mentor_id]?.name || "Unknown"} />
                <DetailRow label="Status" value={viewReq.status} />
                <DetailRow label="Created" value={new Date(viewReq.created_at).toLocaleString()} />
              </div>
              {viewReq.message && <div className="mt-3"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Message</Label><p className="mt-1 whitespace-pre-line text-sm">{viewReq.message}</p></div>}
              <DialogFooter className="gap-2">
                {viewReq.status === "pending" && <>
                  <Button onClick={() => { setReqStatus(viewReq.id, "accepted"); setViewReq(null); }}>Accept</Button>
                  <Button variant="outline" onClick={() => { setReqStatus(viewReq.id, "rejected"); setViewReq(null); }}>Reject</Button>
                </>}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// -------- Resources (advanced: bulk select, view detail) --------
const ResourcesTab = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const sel = useBulkSelect(items);

  const load = async () => {
    const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    setItems(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const upload = async (file: File): Promise<string | null> => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("resources").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return null; }
    const { data: { publicUrl } } = supabase.storage.from("resources").getPublicUrl(path);
    setUploading(false); return publicUrl;
  };

  const save = async () => {
    if (!editing?.title) { toast.error("Title required"); return; }
    const payload = { title: editing.title, description: editing.description, category: editing.category, file_url: editing.file_url, external_url: editing.external_url };
    const { error } = editing.id
      ? await supabase.from("resources").update(payload).eq("id", editing.id)
      : await supabase.from("resources").insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id });
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setEditing(null); load(); }
  };
  const remove = async (id: string) => { if (!confirm("Delete resource?")) return; await supabase.from("resources").delete().eq("id", id); load(); };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Button onClick={() => setEditing({})}><Plus className="w-4 h-4" /> New resource</Button>
        <div className="flex gap-2 items-center">
          {sel.selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{sel.selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => bulkDelete("resources", Array.from(sel.selected), () => { sel.clear(); load(); })}><Trash2 className="w-4 h-4 text-destructive" /> Delete selected</Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => downloadCsv(`coou-resources-${Date.now()}`, items as any)}><Download className="w-4 h-4" /> Export ({items.length})</Button>
        </div>
      </div>
      <div className="flex items-center gap-2 px-2">
        <input type="checkbox" checked={sel.allSelected} onChange={sel.toggleAll} aria-label="Select all resources" />
        <span className="text-xs text-muted-foreground">Select all</span>
      </div>
      <div className="grid gap-3">
        {items.map((r) => (
          <div key={r.id} className={`rounded-2xl bg-card border border-border/60 p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3 ${sel.selected.has(r.id) ? "ring-2 ring-primary/40" : ""}`}>
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <input type="checkbox" className="mt-1.5" checked={sel.selected.has(r.id)} onChange={() => sel.toggleOne(r.id)} aria-label={`Select ${r.title}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap"><span className="font-display font-semibold text-primary">{r.title}</span>{r.category && <span className="px-2 py-0.5 rounded-full text-[11px] bg-muted">{r.category}</span>}</div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                <div className="text-xs text-muted-foreground mt-1 flex gap-3">{r.file_url && <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="underline">File</a>}{r.external_url && <a href={r.external_url} target="_blank" rel="noopener noreferrer" className="underline">Link</a>}</div>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={() => setViewing(r)}><Eye className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-muted-foreground py-8">No resources yet.</p>}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit resource" : "New resource"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Career, Academic, Forms..." /></div>
              <div><Label>Description</Label><Textarea rows={3} maxLength={1000} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div>
                <Label>Upload file (optional)</Label>
                <Input type="file" disabled={uploading} onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await upload(f); if (url) setEditing({ ...editing, file_url: url }); } }} />
                {editing.file_url && <a href={editing.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-1 inline-block">View uploaded file</a>}
              </div>
              <div><Label>External URL (optional)</Label><Input value={editing.external_url ?? ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} placeholder="https://..." /></div>
            </div>
          )}
          <DialogFooter><Button onClick={save} disabled={uploading}>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          {viewing && (
            <>
              <DialogHeader><DialogTitle>{viewing.title}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <DetailRow label="Category" value={viewing.category || "—"} />
                <DetailRow label="Created" value={new Date(viewing.created_at).toLocaleString()} />
                {viewing.description && <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label><p className="mt-1 whitespace-pre-line">{viewing.description}</p></div>}
                {viewing.file_url && <div><a href={viewing.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download file →</a></div>}
                {viewing.external_url && <div><a href={viewing.external_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open link →</a></div>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setEditing(viewing); setViewing(null); }}><Pencil className="w-4 h-4" /> Edit</Button>
                <Button variant="outline" onClick={() => { remove(viewing.id); setViewing(null); }}><Trash2 className="w-4 h-4 text-destructive" /> Delete</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl bg-card border border-border/60 p-5">
    <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="font-display text-3xl font-semibold text-primary mt-1">{value}</div>
  </div>
);

export default AdminPage;
