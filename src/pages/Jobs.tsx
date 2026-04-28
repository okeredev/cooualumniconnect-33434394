import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { JOBS, JOB_CATEGORIES, type Job } from "@/data/coou";
import { Search, MapPin, Briefcase, Bookmark, BookmarkCheck, Sparkles, Building2, Clock, X } from "lucide-react";
import { toast } from "sonner";

const STORAGE_SAVED = "coou_saved_jobs";
const STORAGE_APPS = "coou_applications";

const JobsPage = () => {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [type, setType] = useState("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_SAVED) || "[]"); } catch { return []; }
  });
  const [applications, setApplications] = useState<Record<string, { status: string; appliedAt: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_APPS) || "{}"); } catch { return {}; }
  });
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  useEffect(() => { document.title = "Job Board — COOU Alumni Connect"; }, []);
  useEffect(() => { localStorage.setItem(STORAGE_SAVED, JSON.stringify(saved)); }, [saved]);
  useEffect(() => { localStorage.setItem(STORAGE_APPS, JSON.stringify(applications)); }, [applications]);

  const results = useMemo(() => JOBS.filter((j) => {
    const matchesQ = !q || [j.title, j.company, j.location, j.category].join(" ").toLowerCase().includes(q.toLowerCase());
    const matchesCat = cat === "all" || j.category === cat;
    const matchesType = type === "all" || j.type === type;
    const matchesRemote = !remoteOnly || j.remote;
    return matchesQ && matchesCat && matchesType && matchesRemote;
  }), [q, cat, type, remoteOnly]);

  const toggleSave = (id: string) => {
    setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const submitApplication = (job: Job, coverLetter: string) => {
    setApplications({ ...applications, [job.id]: { status: "Submitted", appliedAt: new Date().toISOString() } });
    setApplyJob(null);
    setActiveJob(null);
    toast.success(`Application submitted to ${job.company}`);
  };

  const reset = () => { setQ(""); setCat("all"); setType("all"); setRemoteOnly(false); };

  const appCount = Object.keys(applications).length;

  return (
    <AppShell>
      <section className="container py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-2">Opportunities</div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary">Job & Opportunity Board</h1>
            <p className="text-muted-foreground mt-2">Curated roles posted by COOU alumni and partner companies.</p>
          </div>
          <div className="flex gap-3 text-sm">
            <Stat label="Open roles" value={JOBS.length} />
            <Stat label="Saved" value={saved.length} />
            <Stat label="Applied" value={appCount} />
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-card border border-border/60 p-4 md:p-5 shadow-card">
          <div className="grid md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search title, company, or location…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select className="md:col-span-3" value={cat} onChange={setCat}>
              <option value="all">All categories</option>
              {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select className="md:col-span-2" value={type} onChange={setType}>
              <option value="all">All types</option>
              {["Full-time", "Part-time", "Internship", "Contract"].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <label className="md:col-span-2 flex items-center gap-2 px-3 rounded-md border border-input bg-background cursor-pointer text-sm">
              <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} className="accent-primary" />
              Remote only
            </label>
          </div>
          {(q || cat !== "all" || type !== "all" || remoteOnly) && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{results.length} matching roles</span>
              <button onClick={reset} className="flex items-center gap-1 text-primary hover:text-primary-glow">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* Job list */}
        <div className="grid lg:grid-cols-2 gap-4 mt-6">
          {results.map((j) => {
            const isSaved = saved.includes(j.id);
            const application = applications[j.id];
            return (
              <article
                key={j.id}
                onClick={() => setActiveJob(j)}
                className={`group cursor-pointer rounded-2xl border bg-card p-6 hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300 ${
                  j.featured ? "border-gold/40 ring-1 ring-gold/20" : "border-border/60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-hero text-gold grid place-items-center flex-shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-primary truncate">{j.title}</h3>
                      <p className="text-sm text-muted-foreground">{j.company}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSave(j.id); }}
                    className="p-2 -m-2 text-muted-foreground hover:text-primary"
                    aria-label="Save job"
                  >
                    {isSaved ? <BookmarkCheck className="w-5 h-5 text-gold fill-gold" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Tag><MapPin className="w-3 h-3" /> {j.location}</Tag>
                  <Tag><Briefcase className="w-3 h-3" /> {j.type}</Tag>
                  <Tag>{j.category}</Tag>
                  {j.featured && <Tag highlight><Sparkles className="w-3 h-3" /> Featured</Tag>}
                  {j.referralAvailable && <Tag highlight>Referral available</Tag>}
                </div>

                <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{j.description}</p>

                <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {j.posted} · by {j.postedBy}</span>
                  <span className="font-medium text-primary">{j.salary}</span>
                </div>

                {application && (
                  <div className="mt-3 text-xs px-3 py-2 rounded-lg bg-gold/15 text-primary font-medium">
                    ✓ Application {application.status}
                  </div>
                )}
              </article>
            );
          })}
          {results.length === 0 && (
            <div className="lg:col-span-2 text-center py-16 text-muted-foreground">No roles match those filters.</div>
          )}
        </div>
      </section>

      {/* Job detail dialog */}
      <Dialog open={!!activeJob} onOpenChange={(o) => !o && setActiveJob(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {activeJob && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero text-gold grid place-items-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="font-display text-xl text-primary text-left">{activeJob.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground text-left">{activeJob.company} · {activeJob.location}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-wrap gap-2 text-xs">
                <Tag>{activeJob.type}</Tag>
                <Tag>{activeJob.category}</Tag>
                <Tag>{activeJob.salary}</Tag>
                {activeJob.remote && <Tag>Remote</Tag>}
                {activeJob.referralAvailable && <Tag highlight>Referral available</Tag>}
              </div>

              <div>
                <h4 className="font-display font-semibold text-primary mb-2">About the role</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{activeJob.description}</p>
              </div>

              <div>
                <h4 className="font-display font-semibold text-primary mb-2">Requirements</h4>
                <ul className="space-y-1.5">
                  {activeJob.requirements.map((r) => (
                    <li key={r} className="text-sm text-muted-foreground flex gap-2">
                      <span className="w-1 h-1 rounded-full bg-gold mt-2 flex-shrink-0" />{r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs text-muted-foreground border-t border-border/60 pt-4">
                Posted {activeJob.posted} by <span className="text-primary font-medium">{activeJob.postedBy}</span>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => toggleSave(activeJob.id)}>
                  {saved.includes(activeJob.id) ? <><BookmarkCheck className="w-4 h-4" /> Saved</> : <><Bookmark className="w-4 h-4" /> Save</>}
                </Button>
                {applications[activeJob.id] ? (
                  <Button variant="hero" disabled>Already applied</Button>
                ) : (
                  <Button variant="hero" onClick={() => setApplyJob(activeJob)}>Apply now</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply dialog */}
      <Dialog open={!!applyJob} onOpenChange={(o) => !o && setApplyJob(null)}>
        <DialogContent>
          {applyJob && (
            <ApplyForm job={applyJob} onSubmit={(letter) => submitApplication(applyJob, letter)} />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="px-4 py-2 rounded-xl bg-card border border-border/60 text-center">
    <div className="font-display text-lg font-semibold text-primary">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);

const Tag = ({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
    highlight ? "bg-gold/20 text-primary" : "bg-muted text-muted-foreground"
  }`}>{children}</span>
);

const Select = ({ value, onChange, children, className }: { value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${className ?? ""}`}>
    {children}
  </select>
);

const ApplyForm = ({ job, onSubmit }: { job: Job; onSubmit: (letter: string) => void }) => {
  const [name, setName] = useState("Chinaza Obi");
  const [email, setEmail] = useState("chinaza.obi@alumni.coou.edu.ng");
  const [letter, setLetter] = useState("");
  const valid = name.trim() && email.trim() && letter.trim().length >= 30;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-primary">Apply to {job.title}</DialogTitle>
        <p className="text-sm text-muted-foreground">{job.company} · {job.location}</p>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Full name</Label>
          <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </div>
        <div>
          <Label>Email</Label>
          <Input className="mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
        </div>
        <div>
          <Label>Cover note <span className="text-muted-foreground text-xs">(min 30 chars)</span></Label>
          <Textarea className="mt-1.5" rows={5} value={letter} onChange={(e) => setLetter(e.target.value)} maxLength={1500}
            placeholder={`Hi ${job.company} team — I'm a COOU graduate excited about this role because…`} />
          <div className="text-xs text-muted-foreground mt-1 text-right">{letter.length}/1500</div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="hero" disabled={!valid} onClick={() => onSubmit(letter)}>Submit application</Button>
      </DialogFooter>
    </>
  );
};

export default JobsPage;
