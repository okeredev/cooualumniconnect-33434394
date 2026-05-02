import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COOU_DEPARTMENTS, COOU_FACULTIES, GRAD_YEARS, NIGERIAN_SCHOOLS } from "@/data/coou";
import { Pencil, Check, Upload, Trash2, Plus, Loader2, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];

type Profile = {
  id?: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  website: string | null;
  graduation_year: number | null;
  department: string | null;
  verified: boolean;
  hide_phone: boolean;
};

type Education = { id: string; school: string; degree: string | null; field: string | null; start_year: number | null; end_year: number | null; _isNew?: boolean; _dirty?: boolean };
type Employment = { id: string; company: string; title: string | null; start_date: string | null; end_date: string | null; current: boolean; description: string | null; _isNew?: boolean; _dirty?: boolean };

const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  bio: z.string().max(500).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  state: z.string().max(80).optional().nullable(),
  linkedin: z.string().max(200).optional().nullable(),
  github: z.string().max(200).optional().nullable(),
  twitter: z.string().max(200).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
});

const DashboardPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [employment, setEmployment] = useState<Employment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Dashboard — COOU Alumni Connect";
    if (!user) return;
    load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [p, e, w] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("education").select("*").eq("user_id", user.id).order("start_year", { ascending: false }),
      supabase.from("employment").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
    ]);
    setProfile(p.data as Profile);
    setEducation((e.data ?? []) as Education[]);
    setEmployment((w.data ?? []) as Employment[]);
    setLoading(false);
  };

  const updateProfile = (patch: Partial<Profile>) => setProfile((p) => p ? { ...p, ...patch } : p);

  const saveProfile = async () => {
    if (!profile || !user) return;
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name,
      bio: profile.bio,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      country: profile.country || "Nigeria",
      linkedin: profile.linkedin,
      github: profile.github,
      twitter: profile.twitter,
      website: profile.website,
      graduation_year: profile.graduation_year,
      department: profile.department,
      hide_phone: profile.hide_phone,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setUploading(false);
    if (updErr) toast.error(updErr.message);
    else { updateProfile({ avatar_url: publicUrl }); toast.success("Avatar updated"); }
  };

  // --- Education: local draft + explicit save per row ---
  const addEducation = () => {
    if (education.some((e) => e._isNew)) {
      toast.error("Save the current education entry first");
      return;
    }
    const draft: Education = {
      id: `tmp-${Date.now()}`,
      school: "",
      degree: "",
      field: "",
      start_year: null,
      end_year: null,
      _isNew: true,
      _dirty: true,
    };
    setEducation([draft, ...education]);
  };

  const patchEducation = (id: string, patch: Partial<Education>) => {
    setEducation(education.map((e) => e.id === id ? { ...e, ...patch, _dirty: true } : e));
  };

  const saveEducation = async (id: string) => {
    if (!user) return;
    const row = education.find((e) => e.id === id);
    if (!row) return;
    if (!row.school.trim()) { toast.error("School is required"); return; }
    if (row._isNew) {
      const { data, error } = await supabase.from("education").insert({
        user_id: user.id,
        school: row.school,
        degree: row.degree,
        field: row.field,
        start_year: row.start_year,
        end_year: row.end_year,
      }).select().single();
      if (error) return toast.error(error.message);
      setEducation(education.map((e) => e.id === id ? { ...(data as Education) } : e));
      toast.success("Education saved");
    } else {
      const { error } = await supabase.from("education").update({
        school: row.school, degree: row.degree, field: row.field, start_year: row.start_year, end_year: row.end_year,
      }).eq("id", id);
      if (error) return toast.error(error.message);
      setEducation(education.map((e) => e.id === id ? { ...e, _dirty: false } : e));
      toast.success("Education updated");
    }
  };

  const deleteEducation = async (id: string) => {
    const row = education.find((e) => e.id === id);
    if (row?._isNew) {
      setEducation(education.filter((e) => e.id !== id));
      return;
    }
    if (!confirm("Delete this education entry?")) return;
    await supabase.from("education").delete().eq("id", id);
    setEducation(education.filter((e) => e.id !== id));
    toast.success("Removed");
  };

  // --- Employment: local draft + explicit save per row ---
  const addEmployment = () => {
    if (employment.some((e) => e._isNew)) {
      toast.error("Save the current employment entry first");
      return;
    }
    const draft: Employment = {
      id: `tmp-${Date.now()}`,
      company: "",
      title: "",
      start_date: null,
      end_date: null,
      current: true,
      description: "",
      _isNew: true,
      _dirty: true,
    };
    setEmployment([draft, ...employment]);
  };

  const patchEmployment = (id: string, patch: Partial<Employment>) => {
    setEmployment(employment.map((e) => e.id === id ? { ...e, ...patch, _dirty: true } : e));
  };

  const saveEmployment = async (id: string) => {
    if (!user) return;
    const row = employment.find((e) => e.id === id);
    if (!row) return;
    if (!row.company.trim()) { toast.error("Company is required"); return; }
    if (row._isNew) {
      const { data, error } = await supabase.from("employment").insert({
        user_id: user.id,
        company: row.company,
        title: row.title,
        start_date: row.start_date,
        end_date: row.current ? null : row.end_date,
        current: row.current,
        description: row.description,
      }).select().single();
      if (error) return toast.error(error.message);
      setEmployment(employment.map((e) => e.id === id ? { ...(data as Employment) } : e));
      toast.success("Experience saved");
    } else {
      const { error } = await supabase.from("employment").update({
        company: row.company, title: row.title, start_date: row.start_date,
        end_date: row.current ? null : row.end_date, current: row.current, description: row.description,
      }).eq("id", id);
      if (error) return toast.error(error.message);
      setEmployment(employment.map((e) => e.id === id ? { ...e, _dirty: false } : e));
      toast.success("Experience updated");
    }
  };

  const deleteEmployment = async (id: string) => {
    const row = employment.find((e) => e.id === id);
    if (row?._isNew) {
      setEmployment(employment.filter((e) => e.id !== id));
      return;
    }
    if (!confirm("Delete this experience entry?")) return;
    await supabase.from("employment").delete().eq("id", id);
    setEmployment(employment.filter((e) => e.id !== id));
    toast.success("Removed");
  };


  if (loading || !profile) {
    return <AppShell><div className="container py-20 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div></AppShell>;
  }

  const initials = (profile.display_name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <AppShell>
      <section className="container py-10">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-8 md:p-10 grain relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-end gap-6 justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-gold/40" />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gold/20 border-2 border-gold/40 grid place-items-center font-display text-3xl font-semibold text-gold">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gold text-primary grid place-items-center shadow-lg hover:scale-110 transition"
                  aria-label="Upload avatar"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold flex items-center gap-1.5">
                  Alumni · COOU {profile.verified && <BadgeCheck className="w-4 h-4" />}
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">{profile.display_name || "Your name"}</h1>
                <p className="text-primary-foreground/70 mt-1">{profile.email}</p>
              </div>
            </div>
            <Button variant="gold" size="sm" onClick={saveProfile} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="mt-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="rounded-2xl bg-card border border-border/60 p-6 md:p-8 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Display name"><Input value={profile.display_name ?? ""} onChange={(e) => updateProfile({ display_name: e.target.value })} maxLength={80} /></Field>
                <Field label="Phone (Nigerian)"><Input value={profile.phone ?? ""} onChange={(e) => updateProfile({ phone: e.target.value })} placeholder="+234 80X XXX XXXX" maxLength={20} /></Field>
                <Field label="WhatsApp"><Input value={profile.whatsapp ?? ""} onChange={(e) => updateProfile({ whatsapp: e.target.value })} placeholder="+234 80X XXX XXXX" maxLength={20} /></Field>
                <Field label="Graduation year">
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={profile.graduation_year ?? ""} onChange={(e) => updateProfile({ graduation_year: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">Select year</option>
                    {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </Field>
                <Field label="Department">
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={profile.department ?? ""} onChange={(e) => updateProfile({ department: e.target.value })}>
                    <option value="">Select department</option>
                    {COOU_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="State">
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={profile.state ?? ""} onChange={(e) => updateProfile({ state: e.target.value })}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="City"><Input value={profile.city ?? ""} onChange={(e) => updateProfile({ city: e.target.value })} maxLength={80} /></Field>
                <Field label="Address"><Input value={profile.address ?? ""} onChange={(e) => updateProfile({ address: e.target.value })} maxLength={200} /></Field>
              </div>
              <Field label="Bio">
                <Textarea rows={3} value={profile.bio ?? ""} onChange={(e) => updateProfile({ bio: e.target.value })} maxLength={500} placeholder="Tell the network about yourself..." />
              </Field>
              <div className="rounded-xl border border-border/60 p-4 flex items-start justify-between gap-3 bg-muted/30">
                <div>
                  <div className="font-medium text-sm">Hide my phone number from the directory</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Other alumni won't see your phone or WhatsApp on your public profile. Admins always see it.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input type="checkbox" className="sr-only peer" checked={!!profile.hide_phone} onChange={(e) => updateProfile({ hide_phone: e.target.checked })} />
                  <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-card after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border/60">
                <Field label="LinkedIn"><Input value={profile.linkedin ?? ""} onChange={(e) => updateProfile({ linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." /></Field>
                <Field label="GitHub"><Input value={profile.github ?? ""} onChange={(e) => updateProfile({ github: e.target.value })} placeholder="https://github.com/..." /></Field>
                <Field label="X / Twitter"><Input value={profile.twitter ?? ""} onChange={(e) => updateProfile({ twitter: e.target.value })} placeholder="https://x.com/..." /></Field>
                <Field label="Website"><Input value={profile.website ?? ""} onChange={(e) => updateProfile({ website: e.target.value })} placeholder="https://..." /></Field>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="education" className="mt-6 space-y-3">
            <Button variant="outline" onClick={addEducation}><Plus className="w-4 h-4" /> Add education</Button>
            {education.map((e) => (
              <div key={e.id} className="rounded-2xl bg-card border border-border/60 p-5 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input value={e.school} onChange={(ev) => patchEducation(e.id, { school: ev.target.value })} placeholder="School *" />
                  <Input value={e.degree ?? ""} onChange={(ev) => patchEducation(e.id, { degree: ev.target.value })} placeholder="Degree (e.g. B.Sc.)" />
                  <Input value={e.field ?? ""} onChange={(ev) => patchEducation(e.id, { field: ev.target.value })} placeholder="Field of study" />
                  <div className="flex gap-2">
                    <Input type="number" value={e.start_year ?? ""} onChange={(ev) => patchEducation(e.id, { start_year: ev.target.value ? Number(ev.target.value) : null })} placeholder="Start year" />
                    <Input type="number" value={e.end_year ?? ""} onChange={(ev) => patchEducation(e.id, { end_year: ev.target.value ? Number(ev.target.value) : null })} placeholder="End year" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="text-xs text-muted-foreground">
                    {e._isNew ? "New entry — not yet saved" : e._dirty ? "Unsaved changes" : "Saved"}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => deleteEducation(e.id)}><Trash2 className="w-4 h-4 text-destructive" /> {e._isNew ? "Cancel" : "Delete"}</Button>
                    <Button size="sm" variant="hero" onClick={() => saveEducation(e.id)} disabled={!e._dirty}><Check className="w-4 h-4" /> Save</Button>
                  </div>
                </div>
              </div>
            ))}
            {education.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No education added yet.</p>}
          </TabsContent>

          <TabsContent value="employment" className="mt-6 space-y-3">
            <Button variant="outline" onClick={addEmployment}><Plus className="w-4 h-4" /> Add experience</Button>
            {employment.map((w) => (
              <div key={w.id} className="rounded-2xl bg-card border border-border/60 p-5 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input value={w.company} onChange={(ev) => patchEmployment(w.id, { company: ev.target.value })} placeholder="Company *" />
                  <Input value={w.title ?? ""} onChange={(ev) => patchEmployment(w.id, { title: ev.target.value })} placeholder="Title" />
                  <Input type="date" value={w.start_date ?? ""} onChange={(ev) => patchEmployment(w.id, { start_date: ev.target.value })} />
                  <div className="flex gap-2 items-center">
                    <Input type="date" value={w.end_date ?? ""} onChange={(ev) => patchEmployment(w.id, { end_date: ev.target.value })} disabled={w.current} />
                    <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                      <input type="checkbox" checked={w.current} onChange={(ev) => patchEmployment(w.id, { current: ev.target.checked, end_date: ev.target.checked ? null : w.end_date })} />
                      Current
                    </label>
                  </div>
                </div>
                <Textarea rows={2} value={w.description ?? ""} onChange={(ev) => patchEmployment(w.id, { description: ev.target.value })} placeholder="What did you do?" maxLength={500} />
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="text-xs text-muted-foreground">
                    {w._isNew ? "New entry — not yet saved" : w._dirty ? "Unsaved changes" : "Saved"}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => deleteEmployment(w.id)}><Trash2 className="w-4 h-4 text-destructive" /> {w._isNew ? "Cancel" : "Delete"}</Button>
                    <Button size="sm" variant="hero" onClick={() => saveEmployment(w.id)} disabled={!w._dirty}><Check className="w-4 h-4" /> Save</Button>
                  </div>
                </div>
              </div>
            ))}
            {employment.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No experience added yet.</p>}
          </TabsContent>
        </Tabs>
      </section>
    </AppShell>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
    <div className="mt-1.5">{children}</div>
  </div>
);

export default DashboardPage;
