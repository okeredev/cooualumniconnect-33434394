import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { COOU_DEPARTMENTS, GRAD_YEARS } from "@/data/coou";
import { Search, MapPin, Briefcase, X, BadgeCheck, Flag, Linkedin, Github, Globe, Loader2, Mail, Phone, MessageCircle, GraduationCap, Building2, Twitter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { normalizeUrl } from "@/lib/url";

type Profile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  department: string | null;
  graduation_year: number | null;
  verified: boolean;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  website: string | null;
  phone: string | null;
  whatsapp: string | null;
  hide_phone: boolean;
};

type Employment = { user_id: string; company: string; title: string | null; start_date: string | null; end_date: string | null; current: boolean; description: string | null };
type Education = { user_id: string; school: string; degree: string | null; field: string | null; start_year: number | null; end_year: number | null };

const DirectoryPage = () => {
  const { user, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [employmentMap, setEmploymentMap] = useState<Record<string, Employment[]>>({});
  const [educationMap, setEducationMap] = useState<Record<string, Education[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [year, setYear] = useState<string>("all");
  const [dept, setDept] = useState<string>("all");
  const [reportTarget, setReportTarget] = useState<Profile | null>(null);
  const [reason, setReason] = useState("");
  const [active, setActive] = useState<Profile | null>(null);

  useEffect(() => {
    document.title = "Alumni Directory — COOU Alumni Connect";
    (async () => {
      const [{ data: ps }, { data: emps }, { data: edus }] = await Promise.all([
        // Use the privacy-aware view: phone & whatsapp are masked server-side
        // when the profile owner has hide_phone enabled and the viewer is not
        // the owner or an admin.
        (supabase as any)
          .from("profiles_public")
          .select("user_id, display_name, avatar_url, bio, email, city, state, country, department, graduation_year, verified, linkedin, github, twitter, website, phone, whatsapp, hide_phone")
          .eq("suspended", false)
          .order("created_at", { ascending: false }),
        supabase.from("employment").select("user_id, company, title, start_date, end_date, current, description").order("current", { ascending: false }),
        supabase.from("education").select("user_id, school, degree, field, start_year, end_year"),
      ]);
      const em: Record<string, Employment[]> = {};
      (emps ?? []).forEach((e: any) => { (em[e.user_id] ??= []).push(e); });
      const ed: Record<string, Education[]> = {};
      (edus ?? []).forEach((e: any) => { (ed[e.user_id] ??= []).push(e); });
      setProfiles((ps ?? []) as Profile[]);
      setEmploymentMap(em);
      setEducationMap(ed);
      setLoading(false);
    })();
  }, []);

  const results = useMemo(() => profiles.filter((p) => {
    const job = employmentMap[p.user_id]?.[0];
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
      <section className="container py-6 md:py-10">
        <div className="mb-6 md:mb-8">
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-2">COOU Network</div>
          <h1 className="font-display text-2xl md:text-4xl font-semibold text-primary">Alumni Directory</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Search verified COOU graduates by year and department.</p>
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
              <button onClick={reset} className="flex items-center gap-1 text-primary hover:text-primary-glow" aria-label="Clear filters"><X className="w-3.5 h-3.5" /> Clear filters</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mt-6">
            {results.map((a) => {
              const job = employmentMap[a.user_id]?.[0];
              const initials = (a.display_name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("");
              return (
                <article
                  key={a.user_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActive(a)}
                  onKeyDown={(e) => e.key === "Enter" && setActive(a)}
                  aria-label={`View profile of ${a.display_name ?? "alumni"}`}
                  className="group cursor-pointer rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-elegant transition-all duration-500 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="h-20 md:h-24 bg-gradient-hero relative grain" />
                  <div className="px-4 md:px-5 pb-5 -mt-10 relative">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt={a.display_name ?? "Alumni"} className="w-16 h-16 rounded-2xl object-cover border-4 border-card shadow-card mb-3" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card grid place-items-center font-display text-lg font-semibold text-primary shadow-card mb-3">{initials}</div>
                    )}
                    <h3 className="font-display font-semibold text-primary flex items-center gap-1.5 truncate">
                      <span className="truncate">{a.display_name || "Unnamed"}</span>
                      {a.verified && <BadgeCheck className="w-4 h-4 text-gold flex-shrink-0" aria-label="Verified" />}
                    </h3>
                    {a.graduation_year && <p className="text-[11px] text-gold font-medium uppercase tracking-wider mt-0.5">Class of {a.graduation_year}{a.department ? ` · ${a.department}` : ""}</p>}
                    <div className="mt-3 space-y-1.5 text-sm text-muted-foreground min-h-[2.5rem]">
                      {job && <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{job.title} @ {job.company}</span></div>}
                      {(a.city || a.state) && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{[a.city, a.state].filter(Boolean).join(", ")}</span></div>}
                    </div>
                    <div className="mt-3 flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                      {a.linkedin && <a href={normalizeUrl(a.linkedin)} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary"><Linkedin className="w-4 h-4" /></a>}
                      {a.github && <a href={normalizeUrl(a.github)} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-primary"><Github className="w-4 h-4" /></a>}
                      {a.website && <a href={normalizeUrl(a.website)} target="_blank" rel="noopener noreferrer" aria-label="Website" className="text-muted-foreground hover:text-primary"><Globe className="w-4 h-4" /></a>}
                      <div className="flex-1" />
                      <button onClick={() => setActive(a)} className="text-xs font-medium text-primary hover:text-primary-glow" aria-label={`View ${a.display_name ?? "profile"}`}>View →</button>
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

      {/* Detail dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {active && (() => {
            const initials = (active.display_name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("");
            const emps = employmentMap[active.user_id] ?? [];
            const edus = educationMap[active.user_id] ?? [];
            return (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    {active.avatar_url ? (
                      <img src={active.avatar_url} alt={active.display_name ?? "Alumni"} className="w-16 h-16 rounded-2xl object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-hero text-primary-foreground grid place-items-center font-display text-xl font-semibold">{initials}</div>
                    )}
                    <div className="min-w-0">
                      <DialogTitle className="font-display text-xl text-primary text-left flex items-center gap-2">
                        <span className="truncate">{active.display_name || "Unnamed"}</span>
                        {active.verified && <BadgeCheck className="w-5 h-5 text-gold flex-shrink-0" />}
                      </DialogTitle>
                      {active.graduation_year && <p className="text-xs text-gold font-medium uppercase tracking-wider mt-1">Class of {active.graduation_year}{active.department ? ` · ${active.department}` : ""}</p>}
                      {(active.city || active.state || active.country) && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {[active.city, active.state, active.country].filter(Boolean).join(", ")}</p>
                      )}
                    </div>
                  </div>
                </DialogHeader>

                {active.bio && <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{active.bio}</p>}

                {emps.length > 0 && (
                  <section>
                    <h4 className="font-display font-semibold text-primary mb-2 flex items-center gap-2"><Building2 className="w-4 h-4" /> Experience</h4>
                    <ul className="space-y-2">
                      {emps.map((e, i) => (
                        <li key={i} className="text-sm">
                          <div className="font-medium">{e.title || "—"} <span className="text-muted-foreground">@ {e.company}</span></div>
                          <div className="text-xs text-muted-foreground">
                            {e.start_date ? new Date(e.start_date).getFullYear() : "—"} – {e.current ? "Present" : e.end_date ? new Date(e.end_date).getFullYear() : "—"}
                          </div>
                          {e.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{e.description}</p>}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {edus.length > 0 && (
                  <section>
                    <h4 className="font-display font-semibold text-primary mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Education</h4>
                    <ul className="space-y-2">
                      {edus.map((e, i) => (
                        <li key={i} className="text-sm">
                          <div className="font-medium">{e.school}</div>
                          <div className="text-xs text-muted-foreground">{[e.degree, e.field].filter(Boolean).join(" · ")} {e.start_year ? `(${e.start_year}${e.end_year ? `–${e.end_year}` : ""})` : ""}</div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section>
                  <h4 className="font-display font-semibold text-primary mb-2">Contact & Social</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {active.email && <a className="flex items-center gap-2 text-muted-foreground hover:text-primary truncate" href={`mailto:${active.email}`}><Mail className="w-4 h-4 flex-shrink-0" /><span className="truncate">{active.email}</span></a>}
                    {active.phone && (!active.hide_phone || user?.id === active.user_id) && <a className="flex items-center gap-2 text-muted-foreground hover:text-primary" href={`tel:${active.phone}`}><Phone className="w-4 h-4 flex-shrink-0" />{active.phone}</a>}
                    {active.whatsapp && (!active.hide_phone || user?.id === active.user_id) && <a className="flex items-center gap-2 text-muted-foreground hover:text-primary" href={`https://wa.me/${active.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4 flex-shrink-0" />WhatsApp</a>}
                    {active.linkedin && <a className="flex items-center gap-2 text-muted-foreground hover:text-primary" href={normalizeUrl(active.linkedin)} target="_blank" rel="noopener noreferrer"><Linkedin className="w-4 h-4 flex-shrink-0" />LinkedIn</a>}
                    {active.github && <a className="flex items-center gap-2 text-muted-foreground hover:text-primary" href={normalizeUrl(active.github)} target="_blank" rel="noopener noreferrer"><Github className="w-4 h-4 flex-shrink-0" />GitHub</a>}
                    {active.twitter && <a className="flex items-center gap-2 text-muted-foreground hover:text-primary" href={normalizeUrl(active.twitter)} target="_blank" rel="noopener noreferrer"><Twitter className="w-4 h-4 flex-shrink-0" />X / Twitter</a>}
                    {active.website && <a className="flex items-center gap-2 text-muted-foreground hover:text-primary truncate" href={normalizeUrl(active.website)} target="_blank" rel="noopener noreferrer"><Globe className="w-4 h-4 flex-shrink-0" /><span className="truncate">Website</span></a>}
                  </div>
                </section>

                <DialogFooter className="gap-2 sm:gap-2">
                  {user && user.id !== active.user_id && (
                    <Button variant="outline" onClick={() => { setReportTarget(active); setActive(null); }} aria-label="Report profile"><Flag className="w-4 h-4" /> Report</Button>
                  )}
                  {active.email && (
                    <Button variant="hero" asChild><a href={`mailto:${active.email}`}><Mail className="w-4 h-4" /> Send email</a></Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

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
