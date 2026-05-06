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
import { BadgeCheck, Ban, Shield, ShieldOff, Trash2, Plus, Pencil, Users, Briefcase, Calendar, Flag, BarChart3, Loader2, Download, Check, X as XIcon, Clock, Heart, GraduationCap, BookOpen, Upload, KeyRound, Eye, FileCheck, Linkedin, Github, Twitter, Facebook, Instagram, Youtube, Globe, ShieldCheck, Vote, CalendarClock, ChevronRight } from "lucide-react";
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

const ADMIN_SECTIONS = [
  { group: "Overview", items: [
    { key: "analytics", label: "Analytics", icon: BarChart3, desc: "Platform statistics" },
  ]},
  { group: "People", items: [
    { key: "users", label: "Users", icon: Users, desc: "Manage members" },
    { key: "verifications", label: "Verifications", icon: ShieldCheck, desc: "Review certificates" },
  ]},
  { group: "Content", items: [
    { key: "jobs", label: "Jobs", icon: Briefcase, desc: "Job listings" },
    { key: "events", label: "Events", icon: Calendar, desc: "Event management" },
    { key: "resources", label: "Resources", icon: BookOpen, desc: "Learning materials" },
    { key: "newsletter", label: "Newsletter", icon: Check, desc: "Email broadcasts" },
  ]},
  { group: "Community", items: [
    { key: "donations", label: "Donations", icon: Heart, desc: "Financial contributions" },
    { key: "mentorship", label: "Mentorship", icon: GraduationCap, desc: "Mentor programs" },
    { key: "voting", label: "Elections", icon: Vote, desc: "Voting management" },
  ]},
  { group: "Moderation", items: [
    { key: "moderation", label: "Moderation", icon: Clock, desc: "Content approvals" },
    { key: "reports", label: "Reports", icon: Flag, desc: "User reports" },
  ]},
];


const AdminPage = () => {
  const [activeSection, setActiveSection] = useState("analytics");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => { document.title = "Admin — COOU Alumni Connect"; }, []);

  const sectionMap: Record<string, React.FC> = {
    analytics: AnalyticsTab,
    users: UsersTab,
    moderation: ModerationTab,
    jobs: JobsTab,
    events: EventsTab,
    donations: DonationsTab,
    mentorship: MentorshipTab,
    resources: ResourcesTab,
    newsletter: NewsletterAdminTab,
    reports: ReportsTab,
    verifications: VerificationsTab,
    voting: ElectionsTab,
  };

  const ActiveComponent = sectionMap[activeSection];
  const activeItem = ADMIN_SECTIONS.flatMap(g => g.items).find(i => i.key === activeSection);

  return (
    <AppShell>
      <section className="container py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-border/60 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground p-5 md:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-gold font-semibold mb-1">Administration · Control Panel</div>
              <h1 className="font-display text-2xl md:text-3xl font-semibold">Admin Dashboard</h1>
              <p className="text-primary-foreground/70 mt-1 text-sm">Manage members, content, verifications, and platform analytics.</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Mobile section selector */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border/60 shadow-sm"
          >
            <div className="flex items-center gap-3">
              {activeItem && <activeItem.icon className="w-4 h-4 text-primary" />}
              <span className="font-semibold text-sm">{activeItem?.label || "Analytics"}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${mobileSidebarOpen ? "rotate-90" : ""}`} />
          </button>
          {mobileSidebarOpen && (
            <div className="mt-2 rounded-xl bg-card border border-border/60 shadow-lg p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {ADMIN_SECTIONS.map(group => (
                <div key={group.group}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1.5">{group.group}</div>
                  {group.items.map(item => (
                    <button
                      key={item.key}
                      onClick={() => { setActiveSection(item.key); setMobileSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeSection === item.key
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop layout: sidebar + content */}
        <div className="flex gap-6">
          {/* Sidebar navigation */}
          <aside className="hidden md:block w-56 lg:w-64 shrink-0">
            <div className="sticky top-24 space-y-5">
              {ADMIN_SECTIONS.map(group => (
                <div key={group.group}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-3 mb-2">{group.group}</div>
                  <div className="space-y-0.5">
                    {group.items.map(item => (
                      <button
                        key={item.key}
                        onClick={() => setActiveSection(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                          activeSection === item.key
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        }`}
                      >
                        <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                        <div className="text-left min-w-0">
                          <div className="truncate">{item.label}</div>
                          <div className={`text-[10px] truncate ${activeSection === item.key ? "text-primary-foreground/60" : "text-muted-foreground/50"}`}>{item.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Content panel */}
          <main className="flex-1 min-w-0">
            {ActiveComponent && <ActiveComponent />}
          </main>
        </div>
      </section>
    </AppShell>
  );
};


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
  const [filter, setFilter] = useState<"all" | "verified" | "suspended" | "admins" | "pending_directory">("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [resetTarget, setResetTarget] = useState<FullProfile | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [resetting, setResetting] = useState(false);
  const [detail, setDetail] = useState<FullProfile | null>(null);
  const [userCerts, setUserCerts] = useState<{ id: string; file_url: string; file_name: string; status: string; created_at: string; signed_url?: string }[]>([]);
  const [userDocs, setUserDocs] = useState<{ name: string; url: string; created_at?: string }[]>([]);
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
    // Generate signed URLs for certificates
    // file_url is either a storage path (new: "userId/cert-123.jpg") or a legacy public URL
    const certsWithSignedUrls = [];
    for (const cert of (c.data ?? [])) {
      const storagePath = cert.file_url.includes('/certificates/')
        ? cert.file_url.split('/certificates/')[1]  // legacy: extract path from public URL
        : cert.file_url;                              // new: already a clean path
      const { data: signed } = await supabase.storage.from("certificates").createSignedUrl(storagePath, 3600);
      certsWithSignedUrls.push({ ...cert, signed_url: signed?.signedUrl || "" });
    }

    setCounts((prev) => ({ ...prev, [p.user_id]: { jobs: j.count ?? 0, donations: d.count ?? 0, events: e.count ?? 0 } }));
    setUserCerts(certsWithSignedUrls);
    setUserEdu(edu.data ?? []);
    setUserEmp(emp.data ?? []);
    
    // Documents bucket (private; admins can list & sign)
    const { data: docs } = await supabase.storage.from("documents").list(p.user_id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    const filtered = (docs ?? []).filter((f: any) => f.name && f.name !== ".emptyFolderPlaceholder");
    const docList: { name: string; url: string; created_at?: string }[] = [];
    for (const f of filtered) {
      const { data: signed } = await supabase.storage.from("documents").createSignedUrl(`${p.user_id}/${f.name}`, 3600);
      if (signed?.signedUrl) docList.push({ name: f.name, url: signed.signedUrl, created_at: (f as any).created_at });
    }
    setUserDocs(docList);
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
                  <DetailRow label="COOU ID" value={
                    <span className="inline-flex items-center gap-2">
                      <span className="text-gold font-bold">{detail.coou_id || "Pending"}</span>
                      <button onClick={() => generateCoouId(detail)} className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/70 text-muted-foreground" title="Regenerate using graduation year">↻</button>
                    </span>
                  } />
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
                              <a href={c.signed_url || c.file_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline font-medium">View File ↗</a>
                            </div>
                            {(c.signed_url || c.file_url) && (c.signed_url || c.file_url).match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                              <img src={c.signed_url || c.file_url} alt="Certificate preview" className="mt-2 max-h-40 rounded-lg border border-border/40 object-contain" />
                            )}
                          </div>
                          {c.status === 'pending' && (
                            <div className="flex gap-1 flex-shrink-0">
                              <Button size="sm" variant="hero" className="h-7 text-[10px]" onClick={async () => {
                                const { error } = await supabase.from("certificate_uploads").update({ status: 'verified' } as any).eq("id", c.id);
                                if (!error) {
                                  await supabase.from("profiles").update({ verified: true }).eq("user_id", detail.user_id);
                                  if (!detail.coou_id) await generateCoouId(detail, true);
                                  toast.success("Verified and COOU ID generated");
                                  load();
                                  loadUserData(detail);
                                }
                              }}>✓ Verify</Button>
                              <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={async () => {
                                await supabase.from("certificate_uploads").update({ status: 'rejected' } as any).eq("id", c.id);
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

                {/* Uploaded Documents (passport, IDs, supporting files) */}
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2"><FileCheck className="w-3.5 h-3.5" /> Uploaded Documents</Label>
                  <div className="mt-1 space-y-2">
                    {userDocs.length > 0 ? userDocs.map((d) => (
                      <div key={d.name} className="rounded-xl border border-border/60 p-3 bg-muted/20 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{d.name}</div>
                          {d.created_at && <div className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</div>}
                          {d.url.match(/\.(jpg|jpeg|png|gif|webp)/i) && (
                            <img src={d.url} alt="" className="mt-2 max-h-40 rounded-lg border border-border/40 object-contain" />
                          )}
                        </div>
                        <a href={d.url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline font-medium flex-shrink-0">View / Download ↗</a>
                      </div>
                    )) : (
                      <div className="text-xs text-muted-foreground py-2 text-center border border-dashed rounded-xl">No documents uploaded.</div>
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
  const [profilesById, setProfilesById] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const { data } = await supabase.from("donations").select("*").order("created_at", { ascending: false });
    const list = data ?? [];
    setItems(list);
    const ids = Array.from(new Set(list.map((d: any) => d.user_id).filter(Boolean)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles")
        .select("user_id, display_name, email, phone, coou_id, graduation_year, avatar_url")
        .in("user_id", ids);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p; });
      setProfilesById(map);
    }
    setLoading(false);
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
                <td className="p-3 text-xs">
                  {(() => { const p = profilesById[d.user_id]; return (
                    <div className="flex items-center gap-2 min-w-[180px]">
                      {p?.avatar_url ? <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{(p?.display_name || "?").slice(0,1).toUpperCase()}</div>}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p?.display_name || "Unknown user"}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{p?.email || d.user_id.slice(0,8)+"…"}</div>
                        {p?.coou_id && <div className="text-[10px] text-gold font-mono">{p.coou_id}</div>}
                        <div className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ); })()}
                </td>
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
  const [profilesById, setProfilesById] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const load = async () => {
    const [m, r] = await Promise.all([
      supabase.from("mentor_profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("mentorship_requests").select("*").order("created_at", { ascending: false }),
    ]);
    const ms = m.data ?? []; const rs = r.data ?? [];
    setMentors(ms); setRequests(rs);
    const ids = Array.from(new Set([
      ...ms.map((x: any) => x.user_id),
      ...rs.map((x: any) => x.mentor_id),
      ...rs.map((x: any) => x.mentee_id),
    ].filter(Boolean)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles")
        .select("user_id, display_name, email, phone, coou_id, graduation_year, avatar_url, department")
        .in("user_id", ids);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p; });
      setProfilesById(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const UserCell = ({ id }: { id?: string | null }) => {
    if (!id) return <span className="text-muted-foreground">—</span>;
    const p = profilesById[id];
    return (
      <div className="flex items-center gap-2 min-w-[180px]">
        {p?.avatar_url ? <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">{(p?.display_name || "?").slice(0,1).toUpperCase()}</div>}
        <div className="min-w-0">
          <div className="text-xs font-medium truncate">{p?.display_name || "Unknown"}</div>
          <div className="text-[10px] text-muted-foreground truncate">{p?.email || id.slice(0,8)+"…"}</div>
          {p?.coou_id && <div className="text-[10px] text-gold font-mono">{p.coou_id}</div>}
        </div>
      </div>
    );
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
        <h3 className="font-semibold mb-2">Mentors</h3>
        <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="text-left p-3">Mentor</th><th className="text-left p-3">Topics</th><th className="text-left p-3">Capacity</th><th className="text-left p-3">Available</th></tr></thead>
            <tbody>
              {mentors.map((m) => (
                <tr key={m.id} className="border-t border-border/60">
                  <td className="p-3"><UserCell id={m.user_id} /></td>
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
      <div>
        <h3 className="font-semibold mb-2 mt-4">Mentorship Requests</h3>
        <div className="rounded-2xl border border-border/60 bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="text-left p-3">Mentee</th><th className="text-left p-3">Mentor</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-border/60">
                  <td className="p-3"><UserCell id={r.mentee_id} /></td>
                  <td className="p-3"><UserCell id={r.mentor_id} /></td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${r.status === "accepted" ? "bg-green-100 text-green-800" : r.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{r.status}</span></td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No requests yet.</td></tr>}
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

// -------- Verifications (Certificates) --------
const VerificationsTab = () => {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("certificate_uploads")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const list = data || [];
    const userIds = Array.from(new Set(list.map((c: any) => c.user_id)));
    const { data: profs } = userIds.length
      ? await supabase.from("profiles").select("user_id, display_name, email, department, graduation_year, avatar_url, coou_id").in("user_id", userIds)
      : { data: [] as any[] };
    const profMap: Record<string, any> = {};
    (profs ?? []).forEach((p: any) => { profMap[p.user_id] = p; });

    const withUrls: any[] = [];
    for (const c of list) {
      const storagePath = c.file_url.includes('/certificates/')
        ? c.file_url.split('/certificates/')[1]
        : c.file_url;
      const { data: signed } = await supabase.storage.from("certificates").createSignedUrl(storagePath, 3600);
      withUrls.push({ ...c, signed_url: signed?.signedUrl, profiles: profMap[c.user_id] || null });
    }
    setPending(withUrls);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, userId: string, status: 'verified' | 'rejected') => {
    const { error } = await supabase.from("certificate_uploads").update({ status } as any).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      if (status === 'verified') {
        await supabase.from("profiles").update({ verified: true }).eq("user_id", userId);
        toast.success("Certificate verified and user marked as verified");
      } else {
        toast.success("Certificate rejected");
      }
      load();
    }
  };

  const filtered = pending.filter(c => 
    !q || 
    (c.profiles?.display_name || "").toLowerCase().includes(q.toLowerCase()) ||
    (c.profiles?.email || "").toLowerCase().includes(q.toLowerCase()) ||
    (c.file_name || "").toLowerCase().includes(q.toLowerCase())
  );

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-primary">Pending Verifications</h3>
          <p className="text-sm text-muted-foreground mt-1">Review alumni certificates and graduation proofs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input placeholder="Search name or email..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs h-10 rounded-xl" />
          <Button variant="outline" size="sm" onClick={load} className="h-10 rounded-xl"><Clock className="w-4 h-4 mr-2" /> Refresh</Button>
        </div>
      </div>

      <div className="grid gap-6">
        {filtered.length > 0 ? filtered.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-lg">
                    {(c.profiles?.display_name || "U")[0]}
                  </div>
                  <div>
                    <div className="font-bold text-primary text-lg">{c.profiles?.display_name || "Unknown User"}</div>
                    <div className="text-sm text-muted-foreground">{c.profiles?.email}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Department</p>
                    <p className="text-sm font-medium">{c.profiles?.department || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Graduation Year</p>
                    <p className="text-sm font-medium">{c.profiles?.graduation_year || "—"}</p>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <Button variant="hero" size="sm" onClick={() => decide(c.id, c.user_id, 'verified')} className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-primary/20">
                    <Check className="w-4 h-4 mr-2" /> Approve & Verify
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => decide(c.id, c.user_id, 'rejected')} className="rounded-xl h-10 px-6 font-bold text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20">
                    <XIcon className="w-4 h-4 mr-2" /> Reject Submission
                  </Button>
                </div>
              </div>

              <div className="lg:w-[400px] flex-shrink-0">
                <div className="rounded-xl border border-border/40 overflow-hidden bg-muted/30 group relative">
                  {c.signed_url && c.signed_url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                    <img src={c.signed_url} alt="Certificate" className="w-full h-48 object-contain transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-48 grid place-items-center text-muted-foreground">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-medium">Non-image file type</p>
                        <p className="text-[10px] opacity-60">{c.file_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                    <a href={c.signed_url || c.file_url} target="_blank" rel="noreferrer" className="bg-white text-primary px-4 py-2 rounded-lg font-bold text-xs shadow-xl flex items-center gap-2">
                      <Eye className="w-4 h-4" /> View Full Document
                    </a>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-[10px] text-muted-foreground font-mono">Submitted: {new Date(c.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center border-2 border-dashed rounded-[2rem] bg-muted/10">
            <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h4 className="font-display text-xl font-semibold text-muted-foreground">All Caught Up!</h4>
            <p className="text-sm text-muted-foreground mt-1">No pending certificates waiting for verification.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// -------- Voting (Elections & Candidates) --------
const ElectionsTab = () => {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [managingCandidates, setManagingCandidates] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loadingCands, setLoadingCands] = useState(false);
  const [editingCand, setEditingCand] = useState<any | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  const loadElections = async () => {
    setLoading(true);
    const { data } = await supabase.from("elections").select("*").order("created_at", { ascending: false });
    setElections(data || []);
    setLoading(false);
  };

  const loadCandidates = async (electionId: string) => {
    setLoadingCands(true);
    const { data: cands } = await supabase.from("election_candidates").select("*").eq("election_id", electionId);
    const { data: votes } = await supabase.from("votes").select("candidate_id").eq("election_id", electionId);
    
    const counts: Record<string, number> = {};
    (votes || []).forEach(v => counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1);
    
    setVoteCounts(counts);
    setCandidates(cands || []);
    setLoadingCands(false);
  };

  useEffect(() => { loadElections(); }, []);

  const saveElection = async (e: any) => {
    const payload: any = { title: e.title, description: e.description, starts_at: e.starts_at, ends_at: e.ends_at, active: e.active ?? true };
    const { error } = e.id 
      ? await supabase.from("elections").update(payload).eq("id", e.id)
      : await supabase.from("elections").insert(payload);
    
    if (error) toast.error(error.message);
    else { toast.success("Election saved"); setEditing(null); loadElections(); }
  };

  const deleteElection = async (id: string) => {
    if (!confirm("Delete this election and all its votes/candidates?")) return;
    const { error } = await supabase.from("elections").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Election deleted"); loadElections(); }
  };

  const saveCandidate = async (c: any) => {
    const payload = { 
      election_id: managingCandidates.id, 
      name: c.name, 
      position: c.position, 
      manifesto: c.manifesto, 
      image_url: c.image_url,
      user_id: c.user_id || null
    };
    const { error } = c.id 
      ? await supabase.from("election_candidates").update(payload).eq("id", c.id)
      : await supabase.from("election_candidates").insert(payload);
    
    if (error) toast.error(error.message);
    else { toast.success("Candidate saved"); setEditingCand(null); loadCandidates(managingCandidates.id); }
  };

  const deleteCandidate = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    const { error } = await supabase.from("election_candidates").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Candidate removed"); loadCandidates(managingCandidates.id); }
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-display text-xl font-semibold text-primary">Election Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage platform-wide voting events.</p>
        </div>
        <Button onClick={() => setEditing({ title: "", description: "", starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + 7*86400000).toISOString(), status: "upcoming" })}>
          <Plus className="w-4 h-4 mr-2" /> New Election
        </Button>
      </div>

      <div className="grid gap-4">
        {elections.map((e) => (
          <div key={e.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-lg text-primary">{e.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    e.status === 'active' ? 'bg-green-100 text-green-700' : 
                    e.status === 'closed' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                  }`}>{e.status}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{e.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {new Date(e.starts_at).toLocaleDateString()} – {new Date(e.ends_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setManagingCandidates(e); loadCandidates(e.id); }}>
                  <Users className="w-4 h-4 mr-2" /> Candidates
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(e)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => deleteElection(e.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {elections.length === 0 && <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground">No elections created yet.</div>}
      </div>

      {/* Edit Election Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Election" : "New Election"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={editing?.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. 2026 National Executive Council" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={editing?.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Election details..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Starts At</Label>
                <Input type="datetime-local" value={editing?.starts_at ? new Date(editing.starts_at).toISOString().slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Ends At</Label>
                <Input type="datetime-local" value={editing?.ends_at ? new Date(editing.ends_at).toISOString().slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={editing?.status || "upcoming"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => saveElection(editing)}>Save Election</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Candidates Dialog */}
      <Dialog open={!!managingCandidates} onOpenChange={(o) => !o && setManagingCandidates(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Candidates: {managingCandidates?.title}</DialogTitle>
            <DialogDescription>Add and remove contestants for this election.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-center">
              <h5 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Current Contestants</h5>
              <Button size="sm" onClick={() => setEditingCand({ name: "", position: "", manifesto: "", image_url: "" })}>
                <Plus className="w-4 h-4 mr-2" /> Add Candidate
              </Button>
            </div>

            <div className="grid gap-3">
              {loadingCands ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : candidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center overflow-hidden">
                      {c.image_url ? <img src={c.image_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-primary/40" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.position}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{voteCounts[c.id] || 0}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Votes</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingCand(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCandidate(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
              {!loadingCands && candidates.length === 0 && <div className="text-center py-8 border border-dashed rounded-xl text-muted-foreground text-sm">No candidates added.</div>}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setManagingCandidates(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Candidate Dialog */}
      <Dialog open={!!editingCand} onOpenChange={(o) => !o && setEditingCand(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCand?.id ? "Edit Candidate" : "New Candidate"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={editingCand?.name || ""} onChange={(e) => setEditingCand({ ...editingCand, name: e.target.value })} placeholder="Candidate name" />
            </div>
            <div className="space-y-1">
              <Label>Position</Label>
              <Input value={editingCand?.position || ""} onChange={(e) => setEditingCand({ ...editingCand, position: e.target.value })} placeholder="e.g. President" />
            </div>
            <div className="space-y-1">
              <Label>User ID (Optional - for profile link)</Label>
              <Input value={editingCand?.user_id || ""} onChange={(e) => setEditingCand({ ...editingCand, user_id: e.target.value })} placeholder="UUID of the user" />
            </div>
            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input value={editingCand?.image_url || ""} onChange={(e) => setEditingCand({ ...editingCand, image_url: e.target.value })} placeholder="Photo URL" />
            </div>
            <div className="space-y-1">
              <Label>Manifesto</Label>
              <Textarea rows={4} value={editingCand?.manifesto || ""} onChange={(e) => setEditingCand({ ...editingCand, manifesto: e.target.value })} placeholder="Campaign promises..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCand(null)}>Cancel</Button>
            <Button onClick={() => saveCandidate(editingCand)}>Save Candidate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;

