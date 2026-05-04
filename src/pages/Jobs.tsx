import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, MapPin, Briefcase, Building2, Clock, X, Loader2, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  type: string | null;
  description: string | null;
  apply_url: string | null;
  created_at: string;
  status?: string;
};

const JobsPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [myPending, setMyPending] = useState<Job[]>([]);

  useEffect(() => {
    document.title = "Job Board — COOU Alumni Connect";
    load();
  }, [user?.id]);

  const load = async () => {
    setLoading(true);
    const { data: js } = await supabase.from("jobs").select("*").eq("status", "approved").order("created_at", { ascending: false });
    setJobs((js ?? []) as Job[]);
    if (user) {
      const { data: apps } = await supabase.from("applications").select("job_id").eq("user_id", user.id);
      setAppliedIds(new Set((apps ?? []).map((a: any) => a.job_id)));
      const { data: mine } = await supabase.from("jobs").select("*").eq("posted_by", user.id).neq("status", "approved").order("created_at", { ascending: false });
      setMyPending((mine ?? []) as Job[]);
    } else {
      setMyPending([]);
    }
    setLoading(false);
  };

  const results = useMemo(() => jobs.filter((j) => {
    const matchesQ = !q || [j.title, j.company, j.location].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase());
    const matchesType = type === "all" || j.type === type;
    return matchesQ && matchesType;
  }), [jobs, q, type]);

  const submitApplication = async (job: Job, letter: string) => {
    if (!user) { toast.error("Sign in to apply"); return; }
    const { error } = await supabase.from("applications").insert({ user_id: user.id, job_id: job.id, cover_letter: letter });
    if (error) toast.error(error.message);
    else {
      setAppliedIds(new Set([...appliedIds, job.id]));
      setApplyJob(null); setActiveJob(null);
      toast.success(`Application submitted to ${job.company}`);
    }
  };

  return (
    <AppShell>
      <section className="container py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-2">Opportunities</div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary">Job & Opportunity Board</h1>
            <p className="text-muted-foreground mt-2">Curated roles posted by COOU alumni and partner companies.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Stat label="Open roles" value={jobs.length} />
            <Stat label="Applied" value={appliedIds.size} />
            {user ? (
              <Button variant="hero" onClick={() => setPostOpen(true)} aria-label="Post a job">
                <Plus className="w-4 h-4" /> Post a job
              </Button>
            ) : (
              <Button variant="hero" asChild aria-label="Sign in to post a job">
                <Link to="/auth">Sign in to post</Link>
              </Button>
            )}
          </div>
        </div>

        {user && myPending.length > 0 && (
          <div className="mb-6 rounded-2xl border border-gold/40 bg-gold/5 p-4">
            <div className="text-xs uppercase tracking-wider font-semibold text-gold mb-2">Your submissions awaiting review</div>
            <ul className="space-y-1 text-sm">
              {myPending.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-2">
                  <span className="truncate"><span className="font-medium">{j.title}</span> — {j.company}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${j.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{j.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-2xl bg-card border border-border/60 p-4 md:p-5 shadow-card">
          <div className="grid md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search title, company, or location…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" aria-label="Search jobs" />
            </div>
            <select aria-label="Job type" className="md:col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All types</option>
              {["Full-time", "Part-time", "Contract", "Internship"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select aria-label="Location" className="md:col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" onChange={(e) => {
              const loc = e.target.value;
              setJobs(prev => [...prev]); // Trigger re-filter
              setQ(loc === "all" ? "" : loc); // Quick hack to filter by location using the existing search logic
            }}>
              <option value="all">All locations</option>
              {Array.from(new Set(jobs.map(j => j.location).filter(Boolean))).sort().map((l) => <option key={l} value={l!}>{l}</option>)}
            </select>
          </div>
          {(q || type !== "all") && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{results.length} matching roles</span>
              <button onClick={() => { setQ(""); setType("all"); }} className="flex items-center gap-1 text-primary hover:text-primary-glow"><X className="w-3.5 h-3.5" /> Clear</button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4 mt-6">
            {results.map((j) => {
              const applied = appliedIds.has(j.id);
              return (
                <article
                  key={j.id}
                  onClick={() => setActiveJob(j)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setActiveJob(j)}
                  className="group cursor-pointer rounded-2xl border border-border/60 bg-card p-6 hover:shadow-elegant hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-hero text-gold grid place-items-center flex-shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold text-primary truncate">{j.title}</h3>
                      <p className="text-sm text-muted-foreground">{j.company}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {j.location && <Tag><MapPin className="w-3 h-3" /> {j.location}</Tag>}
                    {j.type && <Tag><Briefcase className="w-3 h-3" /> {j.type}</Tag>}
                  </div>
                  {j.description && <p className="mt-4 text-sm text-muted-foreground line-clamp-2">{j.description}</p>}
                  <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(j.created_at).toLocaleDateString()}</span>
                    {applied && <span className="px-2 py-0.5 rounded-full bg-gold/20 text-primary font-medium">✓ Applied</span>}
                  </div>
                </article>
              );
            })}
            {results.length === 0 && (
              <div className="lg:col-span-2 text-center py-16 text-muted-foreground">
                {jobs.length === 0 ? "No jobs posted yet. Check back soon!" : "No roles match those filters."}
              </div>
            )}
          </div>
        )}
      </section>

      <Dialog open={!!activeJob} onOpenChange={(o) => !o && setActiveJob(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {activeJob && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-hero text-gold grid place-items-center"><Building2 className="w-5 h-5" /></div>
                  <div>
                    <DialogTitle className="font-display text-xl text-primary text-left">{activeJob.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground text-left">{activeJob.company}{activeJob.location ? ` · ${activeJob.location}` : ""}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 text-xs">
                {activeJob.type && <Tag>{activeJob.type}</Tag>}
              </div>
              {activeJob.description && (
                <div>
                  <h4 className="font-display font-semibold text-primary mb-2">About the role</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{activeJob.description}</p>
                </div>
              )}
              <DialogFooter className="gap-2 sm:gap-2">
                {activeJob.apply_url && (
                  <Button variant="outline" asChild>
                    <a href={activeJob.apply_url} target="_blank" rel="noreferrer">External link <ExternalLink className="w-4 h-4" /></a>
                  </Button>
                )}
                {!user ? (
                  <Button variant="hero" asChild><Link to="/auth">Sign in to apply</Link></Button>
                ) : appliedIds.has(activeJob.id) ? (
                  <Button variant="hero" disabled>Already applied</Button>
                ) : (
                  <Button variant="hero" onClick={() => setApplyJob(activeJob)}>Apply now</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!applyJob} onOpenChange={(o) => !o && setApplyJob(null)}>
        <DialogContent>
          {applyJob && <ApplyForm job={applyJob} onSubmit={(letter) => submitApplication(applyJob, letter)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <PostJobForm
            onSubmit={async (payload) => {
              if (!user) return;
              const { error } = await supabase.from("jobs").insert({ ...payload, posted_by: user.id });
              if (error) { toast.error(error.message); return; }
              toast.success("Submitted! Awaiting admin approval.");
              setPostOpen(false);
              load();
            }}
          />
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

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium bg-muted text-muted-foreground">{children}</span>
);

const ApplyForm = ({ job, onSubmit }: { job: Job; onSubmit: (letter: string) => void }) => {
  const [letter, setLetter] = useState("");
  const valid = letter.trim().length >= 30;
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-primary">Apply to {job.title}</DialogTitle>
        <p className="text-sm text-muted-foreground">{job.company}{job.location ? ` · ${job.location}` : ""}</p>
      </DialogHeader>
      <div>
        <Label>Cover note <span className="text-muted-foreground text-xs">(min 30 chars)</span></Label>
        <Textarea className="mt-1.5" rows={5} value={letter} onChange={(e) => setLetter(e.target.value)} maxLength={1500}
          placeholder={`Hi ${job.company} team — I'm a COOU graduate excited about this role because…`} />
        <div className="text-xs text-muted-foreground mt-1 text-right">{letter.length}/1500</div>
      </div>
      <DialogFooter><Button variant="hero" disabled={!valid} onClick={() => onSubmit(letter)}>Submit application</Button></DialogFooter>
    </>
  );
};

type JobPayload = { title: string; company: string; location: string; type: string; description: string; apply_url: string };

const PostJobForm = ({ onSubmit }: { onSubmit: (p: JobPayload) => Promise<void> | void }) => {
  const [form, setForm] = useState<JobPayload>({ title: "", company: "", location: "", type: "Full-time", description: "", apply_url: "" });
  const [busy, setBusy] = useState(false);
  const valid = form.title.trim().length >= 3 && form.company.trim().length >= 2 && form.description.trim().length >= 30;
  const update = (k: keyof JobPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-primary">Post a job</DialogTitle>
        <p className="text-sm text-muted-foreground">Submissions are reviewed by admins before going live.</p>
      </DialogHeader>
      <div className="space-y-3">
        <div><Label>Title *</Label><Input value={form.title} onChange={update("title")} maxLength={120} placeholder="Senior Frontend Engineer" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Company *</Label><Input value={form.company} onChange={update("company")} maxLength={120} /></div>
          <div><Label>Location</Label><Input value={form.location} onChange={update("location")} maxLength={120} placeholder="Lagos, Nigeria / Remote" /></div>
        </div>
        <div><Label>Type</Label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={update("type")} aria-label="Type">
            <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
          </select>
        </div>
        <div><Label>Description * <span className="text-xs text-muted-foreground">(min 30 chars)</span></Label>
          <Textarea rows={5} value={form.description} onChange={update("description")} maxLength={3000} />
        </div>
        <div><Label>Apply URL</Label><Input value={form.apply_url} onChange={update("apply_url")} placeholder="https://…" maxLength={500} /></div>
      </div>
      <DialogFooter>
        <Button variant="hero" disabled={!valid || busy} onClick={async () => { setBusy(true); await onSubmit(form); setBusy(false); }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit for review
        </Button>
      </DialogFooter>
    </>
  );
};

export default JobsPage;
