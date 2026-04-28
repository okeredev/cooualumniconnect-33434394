import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { COOU_DEPARTMENTS, COOU_FACULTIES, GRAD_YEARS, LOCATIONS } from "@/data/coou";
import { Briefcase, MapPin, GraduationCap, Pencil, Check, Link2, Eye, Award } from "lucide-react";
import { toast } from "sonner";

type Profile = {
  fullName: string;
  role: "Alumni" | "Student";
  email: string;
  gradYear: number;
  faculty: string;
  department: string;
  location: string;
  jobTitle: string;
  company: string;
  bio: string;
  skills: string;
  publicProfile: boolean;
};

const DEFAULT_PROFILE: Profile = {
  fullName: "Chinaza Obi",
  role: "Alumni",
  email: "chinaza.obi@alumni.coou.edu.ng",
  gradYear: 2018,
  faculty: "Engineering",
  department: "Computer Science",
  location: "Lagos, Nigeria",
  jobTitle: "Senior Software Engineer",
  company: "Flutterwave",
  bio: "COOU Computer Science '18. Building payment infrastructure across Africa. Open to mentoring final-year students.",
  skills: "React, Node.js, TypeScript, AWS, System Design",
  publicProfile: true,
};

const DashboardPage = () => {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const stored = localStorage.getItem("coou_profile");
      return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });
  const [draft, setDraft] = useState<Profile>(profile);

  useEffect(() => {
    document.title = "Dashboard — COOU Alumni Connect";
  }, []);

  const initials = profile.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");

  const save = () => {
    setProfile(draft);
    localStorage.setItem("coou_profile", JSON.stringify(draft));
    setEditing(false);
    toast.success("Profile updated");
  };

  const cancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  return (
    <AppShell>
      <section className="container py-10">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-8 md:p-10 grain relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-end gap-6 justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gold/20 border-2 border-gold/40 grid place-items-center font-display text-3xl font-semibold text-gold">
                {initials}
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">{profile.role} · COOU</div>
                <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">{profile.fullName}</h1>
                <p className="text-primary-foreground/70 mt-1">{profile.jobTitle} · {profile.company}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="glass" size="sm">
                <Link2 className="w-4 h-4" /> Share profile
              </Button>
              {!editing ? (
                <Button variant="gold" size="sm" onClick={startEdit}>
                  <Pencil className="w-4 h-4" /> Edit profile
                </Button>
              ) : (
                <Button variant="gold" size="sm" onClick={save}>
                  <Check className="w-4 h-4" /> Save
                </Button>
              )}
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-3 gap-6 max-w-md">
            {[
              { v: "24", l: "Connections" },
              { v: "8", l: "Saved jobs" },
              { v: "3", l: "Mentees" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-2xl font-semibold text-gold">{s.v}</div>
                <div className="text-xs uppercase tracking-wider text-primary-foreground/60 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          {/* Profile editor */}
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border/60 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-semibold text-primary">Profile details</h2>
              {editing && (
                <button onClick={cancel} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              )}
            </div>

            {!editing ? (
              <div className="space-y-5">
                <Field label="Bio" value={profile.bio} multiline />
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field icon={<GraduationCap className="w-4 h-4" />} label="Faculty" value={profile.faculty} />
                  <Field icon={<GraduationCap className="w-4 h-4" />} label="Department" value={profile.department} />
                  <Field icon={<Award className="w-4 h-4" />} label="Graduation year" value={String(profile.gradYear)} />
                  <Field icon={<MapPin className="w-4 h-4" />} label="Location" value={profile.location} />
                  <Field icon={<Briefcase className="w-4 h-4" />} label="Role" value={profile.jobTitle} />
                  <Field icon={<Briefcase className="w-4 h-4" />} label="Company" value={profile.company} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.split(",").map((s) => (
                      <span key={s} className="px-3 py-1 rounded-full bg-primary/5 text-sm text-primary border border-primary/10">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/60">
                  <Eye className="w-4 h-4" />
                  Profile is {profile.publicProfile ? "public" : "private"}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Editable label="Full name" value={draft.fullName} onChange={(v) => setDraft({ ...draft, fullName: v })} />
                  <Editable label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
                  <Textarea
                    className="mt-2"
                    rows={3}
                    value={draft.bio}
                    onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <SelectField label="Role" value={draft.role} options={["Alumni", "Student"]} onChange={(v) => setDraft({ ...draft, role: v as "Alumni" | "Student" })} />
                  <SelectField label="Graduation year" value={String(draft.gradYear)} options={GRAD_YEARS.map(String)} onChange={(v) => setDraft({ ...draft, gradYear: Number(v) })} />
                  <SelectField label="Faculty" value={draft.faculty} options={COOU_FACULTIES} onChange={(v) => setDraft({ ...draft, faculty: v })} />
                  <SelectField label="Department" value={draft.department} options={COOU_DEPARTMENTS} onChange={(v) => setDraft({ ...draft, department: v })} />
                  <SelectField label="Location" value={draft.location} options={LOCATIONS} onChange={(v) => setDraft({ ...draft, location: v })} />
                  <Editable label="Job title" value={draft.jobTitle} onChange={(v) => setDraft({ ...draft, jobTitle: v })} />
                  <Editable label="Company" value={draft.company} onChange={(v) => setDraft({ ...draft, company: v })} />
                  <Editable label="Skills (comma separated)" value={draft.skills} onChange={(v) => setDraft({ ...draft, skills: v })} />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/60">
                  <div>
                    <div className="text-sm font-medium text-primary">Public profile</div>
                    <div className="text-xs text-muted-foreground">Allow others to view your profile via share link.</div>
                  </div>
                  <Switch checked={draft.publicProfile} onCheckedChange={(v) => setDraft({ ...draft, publicProfile: v })} />
                </div>
              </div>
            )}
          </div>

          {/* Side panel */}
          <aside className="space-y-6">
            <div className="rounded-2xl bg-card border border-border/60 p-6">
              <h3 className="font-display text-lg font-semibold text-primary">Profile strength</h3>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-gold w-[82%]" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">82% complete. Add a profile photo to reach 100%.</p>
            </div>

            <div className="rounded-2xl bg-card border border-border/60 p-6">
              <h3 className="font-display text-lg font-semibold text-primary mb-4">Recent activity</h3>
              <ul className="space-y-3 text-sm">
                {[
                  "Connected with Ifeoma Eze",
                  "Saved Frontend Engineer @ Flutterwave",
                  "Joined CS '18 group chat",
                ].map((a) => (
                  <li key={a} className="flex gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
};

const Field = ({ label, value, icon, multiline }: { label: string; value: string; icon?: React.ReactNode; multiline?: boolean }) => (
  <div>
    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">{icon}{label}</div>
    <div className={`text-sm text-foreground ${multiline ? "leading-relaxed" : "font-medium"}`}>{value}</div>
  </div>
);

const Editable = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
    <Input className="mt-2" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
    <select
      className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default DashboardPage;
