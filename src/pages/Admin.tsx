import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BadgeCheck, Ban, Shield, ShieldOff, Trash2, Plus, Pencil, Users, Briefcase, Calendar, Flag, BarChart3, Loader2, Download, Check, X as XIcon, Clock, Heart, GraduationCap, BookOpen, Upload, KeyRound, Eye, FileCheck, Linkedin, Github, Twitter, Facebook, Instagram, Youtube, Globe } from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { COUNTRY_NAMES, getStatesForCountry } from "@/data/countries";

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
            <TabsTrigger value="newsletter"><Check className="w-4 h-4 mr-1.5" />Newsletter</TabsTrigger>
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
          <TabsContent value="newsletter" className="mt-6"><NewsletterAdminTab /></TabsContent>
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
  const [birthdays, setBirthdays] = useState<{ user_id: string; display_name: string | null; date_of_birth: string; diff: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [u, v, s, j, pj, e, r, a, recent, bdays] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verified", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("suspended", true),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("directory_reports").select("id", { count: "exact", head: true }).eq("resolved", false),
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("created_at").gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
      supabase.from("profiles").select("user_id, display_name, date_of_birth").not("date_of_birth", "is", null),
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = (bdays.data ?? []).map(p => {
      const dob = new Date(p.date_of_birth!);
      const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
      return { ...p, diff: Math.floor((nextBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24)) };
    }).filter(p => p.diff <= 30).sort((a, b) => a.diff - b.diff).slice(0, 10);
    setBirthdays(upcoming as any);
    
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
      <div className="grid md:grid-cols-2 gap-4">
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

        <div className="rounded-2xl bg-card border border-border/60 p-5 overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-gold" /> Upcoming Birthdays (Next 30 Days)</div>
          {birthdays.length > 0 ? (
            <div className="space-y-3">
              {birthdays.map(b => (
                <div key={b.user_id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div>
                    <div className="font-medium text-sm">{b.display_name || "Alumni"}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(b.date_of_birth).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</div>
                  </div>
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full ${b.diff === 0 ? 'bg-gold text-primary animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                    {b.diff === 0 ? "Today!" : `In ${b.diff} day${b.diff > 1 ? 's' : ''}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm border border-dashed rounded-xl">No birthdays coming up in the next 30 days.</div>
          )}
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
  const [q, setQ] = useState("");

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

  const filtered = pending.filter(j => 
    !q || j.title.toLowerCase().includes(q.toLowerCase()) || j.company.toLowerCase().includes(q.toLowerCase())
  );

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center gap-4 mb-4">
        <p className="text-sm text-muted-foreground">{filtered.length} job submission{filtered.length !== 1 ? "s" : ""} found.</p>
        <Input placeholder="Filter jobs..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>
      {filtered.map((j) => {
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
  country: string | null; address: string | null; linkedin: string | null; github: string | null; twitter: string | null;
  facebook: string | null; instagram: string | null; youtube: string | null; tiktok: string | null;
  website: string | null; hide_phone: boolean; last_seen_at: string | null;
  matric_number: string | null; state_of_origin: string | null; nationality: string | null;
  coou_id: string | null; directory_approved: boolean;
};

const UsersTab = () => {
  const [profiles, setProfiles] = useState<FullProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, Role[]>>({});
  const [counts, setCounts] = useState<Record<string, { jobs: number; donations: number; events: number }>>({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "suspended" | "admins">("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [resetTarget, setResetTarget] = useState<FullProfile | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [resetting, setResetting] = useState(false);
  const [detail, setDetail] = useState<FullProfile | null>(null);
  const [userCerts, setUserCerts] = useState<any[]>([]);
  const [userEdu, setUserEdu] = useState<any[]>([]);
  const [userEmp, setUserEmp] = useState<any[]>([]);
  const [sort, setSort] = useState<{ key: keyof FullProfile; dir: 'asc' | 'desc' }>({ key: 'created_at', dir: 'desc' });

  const load = async () => {
    setLoading(true);
    const { data: ps } = await supabase.from("profiles").select("*");
    const { data: rs } = await supabase.from("user_roles").select("user_id, role");
    const map: Record<string, Role[]> = {};
    (rs ?? []).forEach((r: any) => { (map[r.user_id] ??= []).push(r.role); });
    setProfiles((ps ?? []) as FullProfile[]);
    setRoles(map);
    setSelected(new Set());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const loadUserData = async (p: FullProfile) => {
    setDetail(p);
    const [j, d, e, c, edu, emp] = await Promise.all([
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("user_id", p.user_id),
      supabase.from("donations").select("id", { count: "exact", head: true }).eq("user_id", p.user_id),
      supabase.from("event_rsvps").select("id", { count: "exact", head: true }).eq("user_id", p.user_id),
      supabase.from("certificate_uploads").select("*").eq("user_id", p.user_id).order("created_at", { ascending: false }),
      supabase.from("education").select("*").eq("user_id", p.user_id).order("start_year", { ascending: false }),
      supabase.from("employment").select("*").eq("user_id", p.user_id).order("current", { ascending: false }),
    ]);
    setCounts((prev) => ({ ...prev, [p.user_id]: { jobs: j.count ?? 0, donations: d.count ?? 0, events: e.count ?? 0 } }));
    setUserCerts(c.data ?? []);
    setUserEdu(edu.data ?? []);
    setUserEmp(emp.data ?? []);
  };

  const toggleVerify = async (p: FullProfile) => {
    const isVerifying = !p.verified;
    await supabase.from("profiles").update({ verified: isVerifying }).eq("user_id", p.user_id);
    if (isVerifying && !p.coou_id) {
      await generateCoouId(p, true);
    }
    toast.success(p.verified ? "Unverified" : "Verified");
    load();
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

  const toggleDirectoryApproval = async (p: FullProfile) => {
    const { error } = await supabase.from("profiles").update({ directory_approved: !p.directory_approved }).eq("user_id", p.user_id);
    if (error) toast.error(error.message);
    else { toast.success(p.directory_approved ? "Removed from directory" : "Approved for directory"); load(); }
  };

  const generateCoouId = async (p: FullProfile, silent = false) => {
    if (p.coou_id && !silent) {
      if (!confirm("Overwrite existing COOU ID?")) return;
    }
    const year = p.graduation_year || new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newId = `COOU-ALUM-${year}-${rand}`;
    const { error } = await supabase.from("profiles").update({ coou_id: newId }).eq("user_id", p.user_id);
    if (error) {
      if (!silent) toast.error(error.message);
    } else {
      if (!silent) toast.success(`Generated ID: ${newId}`);
      load();
    }
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
    if (q && !((p.display_name || "") + " " + (p.email || "") + " " + (p.matric_number || "")).toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "verified" && !p.verified) return false;
    if (filter === "suspended" && !p.suspended) return false;
    if (filter === "admins" && !(roles[p.user_id] ?? []).includes("admin")) return false;
    if (filter === "pending_directory" && p.directory_approved) return false;
    if (countryFilter !== "all" && p.country !== countryFilter) return false;
    if (stateFilter !== "all" && p.state !== stateFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sort.key] ?? "";
    const bVal = b[sort.key] ?? "";
    if (aVal === bVal) return 0;
    const res = aVal > bVal ? 1 : -1;
    return sort.dir === "asc" ? res : -res;
  });

  const toggleSort = (key: keyof FullProfile) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
  };

  const allSelected = sorted.length > 0 && sorted.every((p) => selected.has(p.user_id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sorted.map((p) => p.user_id)));
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
            <option value="pending_directory">Pending Directory Approval</option>
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setStateFilter("all"); }} aria-label="Filter by country">
            <option value="all">All countries</option>
            {COUNTRY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} aria-label="Filter by state">
            <option value="all">All states</option>
            {(countryFilter !== "all" ? getStatesForCountry(countryFilter) : Array.from(new Set(profiles.map(p => p.state).filter(Boolean))).sort()).map((s) => <option key={s!} value={s!}>{s}</option>)}
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
              <th className="text-left p-3 cursor-pointer hover:text-primary" onClick={() => toggleSort("display_name")}>User</th>
              <th className="text-left p-3">Roles</th>
              <th className="text-left p-3 cursor-pointer hover:text-primary" onClick={() => toggleSort("matric_number")}>Matric</th>
              <th className="text-left p-3 cursor-pointer hover:text-primary" onClick={() => toggleSort("coou_id")}>COOU ID</th>
              <th className="text-left p-3 cursor-pointer hover:text-primary" onClick={() => toggleSort("country")}>Location</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3 cursor-pointer hover:text-primary" onClick={() => toggleSort("created_at")}>Joined</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
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
                  <td className="p-3 font-mono text-[10px] text-muted-foreground">{p.matric_number || "—"}</td>
                  <td className="p-3 font-mono text-[10px] text-gold font-bold">{p.coou_id || "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {p.country && <div>{p.country}</div>}
                    {p.state && <div className="opacity-70">{p.state}</div>}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {p.verified && <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">Verified</span>}
                      {p.suspended && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">Suspended</span>}
                      {p.directory_approved && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">Directory</span>}
                      {!p.verified && !p.suspended && !p.directory_approved && <span className="text-xs text-muted-foreground">Active</span>}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end flex-wrap">
                      <Button size="sm" variant="ghost" onClick={() => loadUserData(p)} title="View details"><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleVerify(p)} title={p.verified ? "Unverify" : "Verify"}>
                        <BadgeCheck className={`w-4 h-4 ${p.verified ? "text-green-600" : ""}`} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleSuspend(p)} title={p.suspended ? "Reinstate" : "Suspend"}>
                        {p.suspended ? <ShieldOff className="w-4 h-4 text-red-600" /> : <Ban className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setResetTarget(p); setNewPwd(""); }} title="Reset password">
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleDirectoryApproval(p)} title={p.directory_approved ? "Remove from directory" : "Approve for directory"}>
                        <Users className={`w-4 h-4 ${p.directory_approved ? "text-blue-600" : ""}`} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => generateCoouId(p)} title="Generate COOU ID">
                        <FileCheck className={`w-4 h-4 ${p.coou_id ? "text-gold" : ""}`} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteUsers([p.user_id])} title="Delete user">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) { setResetTarget(null); setNewPwd(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password — {resetTarget?.display_name || resetTarget?.email}</DialogTitle>
            <DialogDescription>Set a new temporary password for this user account.</DialogDescription>
          </DialogHeader>
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
                <DialogDescription>Full profile details and verification status.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <DetailRow label="Department" value={detail.department} />
                  <DetailRow label="Graduation year" value={detail.graduation_year} />
                  <DetailRow label="COOU ID" value={<span className="text-gold font-bold">{detail.coou_id || "Pending"}</span>} />
                  <DetailRow label="Matric Number" value={detail.matric_number || "—"} />
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
                <div className="pt-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Social Links</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {detail.linkedin && <a href={detail.linkedin} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-muted hover:bg-muted/80" title="LinkedIn"><Linkedin className="w-3.5 h-3.5" /></a>}
                    {detail.github && <a href={detail.github} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-muted hover:bg-muted/80" title="GitHub"><Github className="w-3.5 h-3.5" /></a>}
                    {detail.twitter && <a href={detail.twitter} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-muted hover:bg-muted/80" title="Twitter"><Twitter className="w-3.5 h-3.5" /></a>}
                    {detail.facebook && <a href={detail.facebook} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-muted hover:bg-muted/80" title="Facebook"><Facebook className="w-3.5 h-3.5" /></a>}
                    {detail.instagram && <a href={detail.instagram} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-muted hover:bg-muted/80" title="Instagram"><Instagram className="w-3.5 h-3.5" /></a>}
                    {detail.youtube && <a href={detail.youtube} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-muted hover:bg-muted/80" title="YouTube"><Youtube className="w-3.5 h-3.5" /></a>}
                    {detail.tiktok && <a href={detail.tiktok} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-muted hover:bg-muted/80" title="TikTok"><span className="text-[10px] font-bold">TT</span></a>}
                    {detail.website && <a href={detail.website} target="_blank" rel="noreferrer" className="p-1.5 rounded-md bg-muted hover:bg-muted/80" title="Website"><Globe className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Activity</Label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <Stat label="Job apps" value={counts[detail.user_id]?.jobs ?? "…"} />
                    <Stat label="Donations" value={counts[detail.user_id]?.donations ?? "…"} />
                    <Stat label="Event RSVPs" value={counts[detail.user_id]?.events ?? "…"} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><FileCheck className="w-3.5 h-3.5" /> Academic Verification</Label>
                  <div className="mt-1 space-y-2">
                    {userCerts.length > 0 ? (
                      userCerts.map((c) => (
                        <div key={c.id} className="rounded-xl border border-border/60 p-3 flex items-center justify-between bg-muted/20">
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{c.file_name || "Certificate"}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${c.status === 'verified' ? 'bg-green-100 text-green-800' : c.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{c.status}</span>
                              <a href={c.file_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline font-medium">View File ↗</a>
                            </div>
                            {c.file_url && c.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                              <img src={c.file_url} alt="Certificate preview" className="mt-2 max-h-40 rounded-lg border border-border/40 object-contain" />
                            )}
                          </div>
                          {c.status === 'pending' && (
                            <div className="flex gap-1 flex-shrink-0">
                              <Button size="sm" variant="hero" className="h-7 text-[10px]" onClick={async () => {
                                const { error } = await supabase.from("certificate_uploads").update({ status: 'verified', reviewed_at: new Date().toISOString() }).eq("id", c.id);
                                if (!error) {
                                  await supabase.from("profiles").update({ verified: true }).eq("user_id", detail.user_id);
                                  if (!detail.coou_id) await generateCoouId(detail, true);
                                  toast.success("Verified and COOU ID generated");
                                  load();
                                  loadUserData(detail);
                                }
                              }}>✓ Verify</Button>
                              <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={async () => {
                                await supabase.from("certificate_uploads").update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq("id", c.id);
                                toast.success("Rejected");
                                load();
                                loadUserData(detail);
                              }}>✗ Reject</Button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded-xl">No certificates uploaded by this user.</div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  User ID: <code className="text-[10px]">{detail.user_id}</code>
                </div>

                {/* Education History */}
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5" /> Education History</Label>
                  <div className="mt-1 space-y-2">
                    {userEdu.length > 0 ? userEdu.map((e: any) => (
                      <div key={e.id} className="rounded-xl border border-border/60 p-3 bg-muted/20">
                        <div className="font-medium text-xs">{e.school}</div>
                        <div className="text-[11px] text-muted-foreground">{[e.degree, e.field].filter(Boolean).join(" — ")} {e.start_year && e.end_year ? `(${e.start_year}–${e.end_year})` : ''}</div>
                      </div>
                    )) : (
                      <div className="text-xs text-muted-foreground py-2 text-center border border-dashed rounded-xl">No education records.</div>
                    )}
                  </div>
                </div>

                {/* Employment History */}
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Employment History</Label>
                  <div className="mt-1 space-y-2">
                    {userEmp.length > 0 ? userEmp.map((w: any) => (
                      <div key={w.id} className="rounded-xl border border-border/60 p-3 bg-muted/20">
                        <div className="font-medium text-xs">{w.title || "Role"} at {w.company}</div>
                        <div className="text-[11px] text-muted-foreground">{w.current ? "Current" : w.end_date ? `Until ${new Date(w.end_date).getFullYear()}` : ""}</div>
                      </div>
                    )) : (
                      <div className="text-xs text-muted-foreground py-2 text-center border border-dashed rounded-xl">No employment records.</div>
                    )}
                  </div>
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
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const filtered = jobs.filter(j => statusFilter === "all" || j.status === statusFilter);

  return <JobsTabInner jobs={filtered} statusFilter={statusFilter} setStatusFilter={setStatusFilter} editing={editing} setEditing={setEditing} load={load} save={save} remove={remove} setStatus={setStatus} />;
};

const JobsTabInner = ({ jobs, statusFilter, setStatusFilter, editing, setEditing, load, save, remove, setStatus }: any) => {
  const sel = useBulkSelect(jobs);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setEditing({})} aria-label="Create new job"><Plus className="w-4 h-4" /> New job</Button>
          <select aria-label="Status filter" className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
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

  const sel = useBulkSelect(events);

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <Button onClick={() => setEditing({})}><Plus className="w-4 h-4" /> New event</Button>
        <div className="flex gap-2 items-center">
          {sel.selected.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{sel.selected.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => bulkDelete("events", Array.from(sel.selected), () => { sel.clear(); load(); })}><Trash2 className="w-4 h-4 text-destructive" /> Delete selected</Button>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 px-2">
        <input type="checkbox" checked={sel.allSelected} onChange={sel.toggleAll} /> <span className="text-xs text-muted-foreground">Select all</span>
      </div>
      <div className="grid gap-3">
        {events.map((e) => (
          <div key={e.id} className={`rounded-2xl bg-card border border-border/60 p-5 flex items-start justify-between gap-4 ${sel.selected.has(e.id) ? "ring-2 ring-primary/40" : ""}`}>
            <div className="flex gap-3">
              <input type="checkbox" className="mt-1" checked={sel.selected.has(e.id)} onChange={() => sel.toggleOne(e.id)} />
              <div>
                <div className="font-display font-semibold text-primary">{e.title}</div>
                <div className="text-sm text-muted-foreground">{new Date(e.starts_at).toLocaleString()} · {e.location}</div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{e.description}</p>
              </div>
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
  const remove = async (id: string) => {
    if (!confirm("Delete report?")) return;
    await supabase.from("directory_reports").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const sel = useBulkSelect(reports);

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-3">
      {sel.selected.size > 0 && (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">{sel.selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => bulkDelete("directory_reports", Array.from(sel.selected), () => { sel.clear(); load(); })}><Trash2 className="w-4 h-4 text-destructive" /> Delete selected</Button>
        </div>
      )}
      <div className="flex items-center gap-2 px-2">
        <input type="checkbox" checked={sel.allSelected} onChange={sel.toggleAll} /> <span className="text-xs text-muted-foreground">Select all</span>
      </div>
      {reports.map((r) => (
        <div key={r.id} className="rounded-2xl bg-card border border-border/60 p-5 flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <input type="checkbox" className="mt-1" checked={sel.selected.has(r.id)} onChange={() => sel.toggleOne(r.id)} />
            <div>
              <div className="text-sm">Reported user: <code className="text-xs">{r.reported_user_id}</code></div>
              <p className="mt-1">{r.reason}</p>
              <div className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</div>
            </div>
          </div>
          <div className="flex gap-1 flex-col items-end">
            {!r.resolved ? (
              <Button size="sm" onClick={() => resolve(r.id)}>Resolve</Button>
            ) : (
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Resolved</span>
            )}
            <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </div>
        </div>
      ))}
      {reports.length === 0 && <p className="text-center text-muted-foreground py-8">No reports.</p>}
    </div>
  );
};

// -------- Donations --------
const DonationsTab = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const { data } = await supabase.from("donations").select("*").order("created_at", { ascending: false });
    setItems(data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await supabase.from("donations").update({ status }).eq("id", id);
    toast.success(`Marked ${status}`); load();
  };
  const remove = async (id: string) => { if (!confirm("Delete pledge?")) return; await supabase.from("donations").delete().eq("id", id); load(); };

  const sel = useBulkSelect(items);

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
        <div className="flex gap-2 items-center">
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
            <tr><th className="p-3 w-8"><input type="checkbox" checked={sel.allSelected} onChange={sel.toggleAll} /></th><th className="text-left p-3">Donor</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Purpose</th><th className="text-left p-3">Status</th><th className="text-right p-3">Actions</th></tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className={`border-t border-border/60 ${sel.selected.has(d.id) ? "bg-muted/40" : ""}`}>
                <td className="p-3"><input type="checkbox" checked={sel.selected.has(d.id)} onChange={() => sel.toggleOne(d.id)} /></td>
                <td className="p-3 text-xs"><code>{d.user_id.slice(0, 8)}…</code><div className="text-[11px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</div></td>
                <td className="p-3 font-medium">{d.currency} {Number(d.amount).toLocaleString()}</td>
                <td className="p-3 text-muted-foreground">{d.purpose || "—"}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${d.status === "fulfilled" ? "bg-green-100 text-green-800" : d.status === "cancelled" ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-800"}`}>{d.status}</span></td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    {d.status !== "fulfilled" && <Button size="sm" variant="outline" onClick={() => setStatus(d.id, "fulfilled")}>Mark fulfilled</Button>}
                    {d.status !== "cancelled" && <Button size="sm" variant="ghost" onClick={() => setStatus(d.id, "cancelled")}>Cancel</Button>}
                    <Button size="sm" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No pledges yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------- Mentorship --------
const MentorshipTab = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const [m, r] = await Promise.all([
      supabase.from("mentor_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("mentorship_requests").select("*").order("created_at", { ascending: false }),
    ]);
    setMentors(m.data ?? []); setRequests(r.data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

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
        <h3 className="font-semibold mb-2">Mentors</h3>
        <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="text-left p-3">User</th><th className="text-left p-3">Topics</th><th className="text-left p-3">Capacity</th><th className="text-left p-3">Available</th></tr></thead>
            <tbody>
              {mentors.map((m) => (
                <tr key={m.id} className="border-t border-border/60">
                  <td className="p-3 text-xs"><code>{m.user_id.slice(0, 8)}…</code></td>
                  <td className="p-3 text-muted-foreground">{(m.topics ?? []).join(", ") || "—"}</td>
                  <td className="p-3">{m.capacity}</td>
                  <td className="p-3">{m.available ? "Yes" : "No"}</td>
                </tr>
              ))}
              {mentors.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No mentors yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -------- Resources --------
const ResourcesTab = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);

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
      <Button onClick={() => setEditing({})}><Plus className="w-4 h-4" /> New resource</Button>
      <div className="grid gap-3">
        {items.map((r) => (
          <div key={r.id} className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap"><span className="font-display font-semibold text-primary">{r.title}</span>{r.category && <span className="px-2 py-0.5 rounded-full text-[11px] bg-muted">{r.category}</span>}</div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
              <div className="text-xs text-muted-foreground mt-1 flex gap-3">{r.file_url && <a href={r.file_url} target="_blank" rel="noreferrer" className="underline">File</a>}{r.external_url && <a href={r.external_url} target="_blank" rel="noreferrer" className="underline">Link</a>}</div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
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
                {editing.file_url && <a href={editing.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-1 inline-block">View uploaded file</a>}
              </div>
              <div><Label>External URL (optional)</Label><Input value={editing.external_url ?? ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} placeholder="https://..." /></div>
            </div>
          )}
          <DialogFooter><Button onClick={save} disabled={uploading}>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button></DialogFooter>
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



// -------- Newsletter Admin --------
const NewsletterAdminTab = () => {
  const [subs, setSubs] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState({ subject: "", content: "" });

  const load = async () => {
    const [s, b] = await Promise.all([
      supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
      supabase.from("newsletter_broadcasts").select("*").order("created_at", { ascending: false }),
    ]);
    setSubs(s.data ?? []);
    setBroadcasts(b.data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!msg.subject || !msg.content) { toast.error("Subject and content required"); return; }
    setSending(true);
    const { error } = await supabase.from("newsletter_broadcasts").insert({
      subject: msg.subject,
      content: msg.content,
      created_by: (await supabase.auth.getUser()).data.user?.id
    });
    setSending(false);
    if (error) toast.error(error.message);
    else {
      toast.success(`Broadcast sent to ${subs.length} subscribers!`);
      setMsg({ subject: "", content: "" });
      load();
    }
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Check className="w-5 h-5 text-gold" /> Compose Broadcast</h3>
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
          <div>
            <Label>Subject</Label>
            <Input value={msg.subject} onChange={e => setMsg({ ...msg, subject: e.target.value })} placeholder="Platform Update: Phase 3 Live" />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea rows={6} value={msg.content} onChange={e => setMsg({ ...msg, content: e.target.value })} placeholder="Dear Alumni, we are excited to announce..." />
          </div>
          <Button className="w-full" variant="hero" onClick={send} disabled={sending || subs.length === 0}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Send Broadcast
          </Button>
          <p className="text-[10px] text-center text-muted-foreground italic">Note: This will be saved as a broadcast record and visible to all {subs.length} active subscribers.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-muted-foreground" /> Sent History</h3>
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {broadcasts.map(b => (
            <div key={b.id} className="rounded-xl border border-border/60 p-4 bg-muted/20">
              <div className="font-medium text-sm">{b.subject}</div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.content}</p>
              <div className="text-[10px] text-muted-foreground mt-2">{new Date(b.created_at).toLocaleString()}</div>
            </div>
          ))}
          {broadcasts.length === 0 && <p className="text-center text-muted-foreground py-8">No broadcasts sent yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
