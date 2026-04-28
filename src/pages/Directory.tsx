import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { COOU_DEPARTMENTS, GRAD_YEARS } from "@/data/coou";
import { Search, MapPin, Briefcase, X, BadgeCheck, Flag, Linkedin, Github, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Profile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  department: string | null;
  graduation_year: number | null;
  verified: boolean;
  linkedin: string | null;
  github: string | null;
  website: string | null;
};

type Employment = { user_id: string; company: string; title: string | null; current: boolean };

const DirectoryPage = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [employmentMap, setEmploymentMap] = useState<Record<string, Employment | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [year, setYear] = useState<string>("all");
  const [dept, setDept] = useState<string>("all");
  const [reportTarget, setReportTarget] = useState<Profile | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    document.title = "Alumni Directory — COOU Alumni Connect";
    (async () => {
      const { data: ps } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, bio, city, state, department, graduation_year, verified, linkedin, github, website")
        .eq("suspended", false)
        .order("created_at", { ascending: false });
      const { data: emps } = await supabase
        .from("employment")
        .select("user_id, company, title, current")
        .eq("current", true);
      const m: Record<string, Employment> = {};
      (emps ?? []).forEach((e: any) => { m[e.user_id] = e; });
      setProfiles((ps ?? []) as Profile[]);
      setEmploymentMap(m);
      setLoading(false);
    })();
  }, []);

  const results = useMemo(() => profiles.filter((p) => {
    const job = employmentMap[p.user_id];
    const hay = [p.display_name, p.bio, p.department, p.city, p.state, job?.company, job?.title].filter(Boolean).join(" ").toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (year !== "all" && p.graduation_year !== Number(year)) return false;
    if (dept !== "all" && p.department !== dept) return false;
    return true;
  }), [profiles, employmentMap, q, year, dept]);

  const reset = () => { setQ(""); setYear("all"); setDept("all"); };
  const hasFilters = q || year !== "all" || dept !== "all";

  const submitReport = async () => {
    if (!reportTarget || !user || reason.trim().length < 10) {
      toast.error("Please describe the issue (10+ chars)");
      return;
    }
    const { error } = await supabase.from("directory_reports").insert({
      reporter_id: user.id, reported_user_id: reportTarget.user_id, reason: reason.trim(),
    });
    if (error) toast.error(error.message);
    else { toast.success("Report submitted to admins"); setReportTarget(null); setReason(""); }
  };

  return (
    <AppShell>
      <section className="container py-10">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-2">COOU Network</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary">Alumni Directory</h1>
          <p className="text-muted-foreground mt-2">Search verified COOU graduates by year and department.</p>
        </div>

        <div className="rounded-2xl bg-card border border-border/60 p-4 md:p-5 shadow-card">
          <div className="grid md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, company, role…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" aria-label="Search alumni" />
            </div>
            <select aria-label="Graduation year" className="md:col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="all">All years</option>
              {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select aria-label="Department" className="md:col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="all">All departments</option>
              {COOU_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {hasFilters && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{results.length} matching alumni</span>
              <button onClick={reset} className="flex items-center gap-1 text-primary hover:text-primary-glow"><X className="w-3.5 h-3.5" /> Clear filters</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
            {results.map((a) => {
              const job = employmentMap[a.user_id];
              const initials = (a.display_name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("");
              return (
                <article key={a.user_id} className="group rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-elegant transition-all duration-500 hover:-translate-y-1">
                  <div className="h-24 bg-gradient-hero relative grain" />
                  <div className="px-5 pb-5 -mt-10 relative">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt={a.display_name ?? "Alumni"} className="w-16 h-16 rounded-2xl object-cover border-4 border-card shadow-card mb-3" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card grid place-items-center font-display text-lg font-semibold text-primary shadow-card mb-3">{initials}</div>
                    )}
                    <h3 className="font-display font-semibold text-primary flex items-center gap-1.5">
                      {a.display_name || "Unnamed"}
                      {a.verified && <BadgeCheck className="w-4 h-4 text-gold" aria-label="Verified" />}
                    </h3>
                    {a.graduation_year && <p className="text-[11px] text-gold font-medium uppercase tracking-wider mt-0.5">Class of {a.graduation_year}{a.department ? ` · ${a.department}` : ""}</p>}
                    <div className="mt-3 space-y-1.5 text-sm text-muted-foreground min-h-[2.5rem]">
                      {job && <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{job.title} @ {job.company}</span></div>}
                      {(a.city || a.state) && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {[a.city, a.state].filter(Boolean).join(", ")}</div>}
                    </div>
                    <div className="mt-3 flex gap-2 items-center">
                      {a.linkedin && <a href={a.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary"><Linkedin className="w-4 h-4" /></a>}
                      {a.github && <a href={a.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-primary"><Github className="w-4 h-4" /></a>}
                      {a.website && <a href={a.website} target="_blank" rel="noreferrer" aria-label="Website" className="text-muted-foreground hover:text-primary"><Globe className="w-4 h-4" /></a>}
                      <div className="flex-1" />
                      {user && user.id !== a.user_id && (
                        <button onClick={() => setReportTarget(a)} aria-label="Report profile" className="text-muted-foreground hover:text-destructive">
                          <Flag className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
            {results.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                {profiles.length === 0 ? "No alumni have joined yet. Be the first!" : "No alumni match those filters."}
              </div>
            )}
          </div>
        )}
      </section>

      <Dialog open={!!reportTarget} onOpenChange={(o) => !o && setReportTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report {reportTarget?.display_name}</DialogTitle></DialogHeader>
          <div>
            <Label>Reason</Label>
            <Textarea className="mt-1.5" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Describe the issue..." />
          </div>
          <DialogFooter><Button onClick={submitReport}>Submit report</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default DirectoryPage;
