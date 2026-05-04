import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { COOU_DEPARTMENTS, COOU_FACULTIES, GRAD_YEARS, NIGERIAN_UNIVERSITIES } from "@/data/coou";
import { COUNTRY_NAMES, getStatesForCountry } from "@/data/countries";
import { Pencil, Check, Upload, Trash2, Plus, Loader2, BadgeCheck, AlertCircle, FileCheck, Clock, XCircle, Facebook, Instagram, Youtube, Users, Briefcase, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Newsletter } from "@/components/app/Newsletter";

type CertUpload = { id: string; file_url: string; file_name: string | null; status: string; admin_notes: string | null; created_at: string };

type Profile = {
  id?: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  alt_email: string | null;
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
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  graduation_year: number | null;
  department: string | null;
  date_of_birth: string | null;
  verified: boolean;
  hide_phone: boolean;
  matric_number?: string | null;
  state_of_origin?: string | null;
  nationality?: string | null;
  coou_id?: string | null;
  welcome_seen?: boolean;
};

// Profile completeness calculation
const PROFILE_FIELDS: { key: keyof Profile; label: string; weight: number }[] = [
  { key: "display_name", label: "Display name", weight: 15 },
  { key: "avatar_url", label: "Profile photo", weight: 10 },
  { key: "bio", label: "Bio", weight: 10 },
  { key: "phone", label: "Phone number", weight: 5 },
  { key: "department", label: "Department", weight: 10 },
  { key: "graduation_year", label: "Graduation year", weight: 10 },
  { key: "date_of_birth", label: "Date of birth", weight: 5 },
  { key: "address", label: "Current address", weight: 5 },
  { key: "state", label: "State", weight: 5 },
  { key: "country", label: "Country", weight: 5 },
  { key: "city", label: "City", weight: 5 },
  { key: "linkedin", label: "LinkedIn", weight: 5 },
  { key: "alt_email", label: "Alternative email", weight: 5 },
  { key: "matric_number", label: "Matriculation Number", weight: 5 },
  { key: "state_of_origin", label: "State of Origin", weight: 5 },
  { key: "nationality", label: "Nationality", weight: 5 },
];
const EDU_WEIGHT = 5;
const EMP_WEIGHT = 5;

const calcCompleteness = (p: Profile, hasEdu: boolean, hasEmp: boolean) => {
  let filled = 0, total = 0;
  const missing: string[] = [];
  PROFILE_FIELDS.forEach(f => {
    total += f.weight;
    const v = p[f.key];
    if (v && String(v).trim()) filled += f.weight; else missing.push(f.label);
  });
  total += EDU_WEIGHT + EMP_WEIGHT;
  if (hasEdu) filled += EDU_WEIGHT; else missing.push("Education history");
  if (hasEmp) filled += EMP_WEIGHT; else missing.push("Work experience");
  return { score: Math.round((filled / total) * 100), missing };
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
  const [certificates, setCertificates] = useState<CertUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [certUploading, setCertUploading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Dashboard — COOU Alumni Connect";
    if (!user) return;
    load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [p, e, w, c] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("education").select("*").eq("user_id", user.id).order("start_year", { ascending: false }),
      supabase.from("employment").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
      supabase.from("certificate_uploads").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    // Sort education so COOU entry is always first
    const eduData = (e.data ?? []) as Education[];
    const coouEntry = eduData.find(ed => ed.school.toLowerCase().includes('chukwuemeka') || ed.school.toLowerCase().includes('coou'));
    if (coouEntry) {
      // Move COOU to first position
      const rest = eduData.filter(ed => ed.id !== coouEntry.id);
      setEducation([coouEntry, ...rest]);
    } else {
      // Auto-create a COOU draft as the first entry
      const prof = p.data as any;
      const coouDraft: Education = {
        id: `tmp-coou-${Date.now()}`,
        school: "Chukwuemeka Odumegwu Ojukwu University (COOU)",
        degree: "",
        field: prof?.department || "",
        start_year: prof?.graduation_year ? prof.graduation_year - 4 : null,
        end_year: prof?.graduation_year || null,
        _isNew: true,
        _dirty: true,
      };
      setEducation([coouDraft, ...eduData]);
    }
    setEmployment((w.data ?? []) as Employment[]);
    setCertificates((c.data ?? []) as CertUpload[]);
    
    if (p.error) toast.error("Error loading profile");
    if (!p.data) {
       setProfile({ user_id: user.id } as any);
    } else {
       setProfile(p.data as Profile);
       if (!(p.data as any).welcome_seen) {
         setShowWelcome(true);
       }
    }
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
      alt_email: profile.alt_email,
      linkedin: profile.linkedin,
      github: profile.github,
      twitter: profile.twitter,
      website: profile.website,
      facebook: profile.facebook,
      instagram: profile.instagram,
      youtube: profile.youtube,
      tiktok: profile.tiktok,
       graduation_year: profile.graduation_year,
      department: profile.department,
      date_of_birth: profile.date_of_birth || null,
      hide_phone: profile.hide_phone,
      matric_number: profile.matric_number,
      state_of_origin: profile.state_of_origin,
      nationality: profile.nationality,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  const uploadCertificate = async (file: File) => {
    if (!user) return;
    if (file.size > 1 * 1024 * 1024) { toast.error("Max 1MB for certificates"); return; }
    setCertUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/cert-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("certificates").upload(path, file);
    if (upErr) { toast.error(upErr.message); setCertUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("certificates").getPublicUrl(path);
    const { error: insErr } = await supabase.from("certificate_uploads").insert({
      user_id: user.id, file_url: publicUrl, file_name: file.name,
    });
    setCertUploading(false);
    if (insErr) toast.error(insErr.message);
    else { toast.success("Certificate uploaded — pending review"); load(); }
  };

  const deleteCert = async (id: string) => {
    if (!confirm("Delete this certificate?")) return;
    await supabase.from("certificate_uploads").delete().eq("id", id);
    toast.success("Removed"); load();
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 500 * 1024) { toast.error("Max 500KB for passport photograph"); return; }
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
  const completeness = calcCompleteness(profile, education.length > 0, employment.length > 0);
  const statesForCountry = getStatesForCountry(profile.country || "Nigeria");

  return (
    <AppShell>
      <section className="container py-6 md:py-10 animate-fade-up">
        <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} profile={profile} onComplete={async () => {
          if (!user) return;
          await supabase.from("profiles").update({ welcome_seen: true }).eq("user_id", user.id);
          setShowWelcome(false);
        }} />
        {/* Header */}
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-8 md:p-10 grain relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-end gap-6 justify-between">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group overflow-hidden rounded-3xl">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'grid';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white/10 backdrop-blur-md border-4 border-white/20 place-items-center font-display text-4xl font-bold text-white shadow-2xl"
                    style={{ display: profile.avatar_url ? 'none' : 'grid' }}
                  >
                    {initials}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl grid place-items-center cursor-pointer" onClick={() => fileRef.current?.click()}>
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <Button variant="outline" size="xs" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-8 px-4 rounded-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Upload className="w-3 h-3 mr-2" />}
                  {profile.avatar_url ? "Change Photo" : "Upload Photo"}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </div>
              <div className="text-center md:text-left flex-1 min-w-0">
                <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-gold font-semibold flex items-center justify-center md:justify-start gap-1.5">
                  Alumni · COOU {profile.verified && <BadgeCheck className="w-4 h-4" />}
                  {profile.coou_id && <span className="ml-2 text-primary-foreground/80 bg-primary-foreground/10 px-2 py-0.5 rounded">ID: {profile.coou_id}</span>}
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">{profile.display_name || "Your name"}</h1>
                <p className="text-primary-foreground/70 mt-1">{profile.email}</p>
                <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm w-full">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gold/20 text-gold grid place-items-center shrink-0">
                      <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gold">Profile Verification</p>
                      <p className="text-[11px] text-primary-foreground/70 leading-relaxed mt-1">
                        Please upload a clear, professional passport photograph for alumni identity verification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="gold" size="sm" className="w-full md:w-auto shadow-lg shadow-gold/20" onClick={saveProfile} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save changes
            </Button>
          </div>
        </div>

        {/* Profile Completeness Card */}
        <div className="mt-6 rounded-2xl bg-card border border-border/60 p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display font-semibold text-primary">Profile completeness</div>
            <span className={`text-sm font-bold ${completeness.score >= 80 ? 'text-green-600' : completeness.score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{completeness.score}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${completeness.score >= 80 ? 'bg-green-500' : completeness.score >= 50 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${completeness.score}%` }} />
          </div>
          {completeness.missing.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <span>Still needed: {completeness.missing.join(", ")}</span>
            </div>
          )}
        </div>

        <div className="mt-8">

          <div className="mt-6 space-y-8">
            <div className="rounded-2xl bg-card border border-border/60 p-6 md:p-8 space-y-6 shadow-card animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-display font-semibold text-lg text-primary border-b border-border/60 pb-3">Biodata & Contact</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Display name"><Input value={profile.display_name ?? ""} onChange={(e) => updateProfile({ display_name: e.target.value })} maxLength={80} /></Field>
                <Field label="Alternative email"><Input type="email" value={profile.alt_email ?? ""} onChange={(e) => updateProfile({ alt_email: e.target.value })} placeholder="backup@example.com" maxLength={120} /></Field>
                <Field label="Phone"><Input value={profile.phone ?? ""} onChange={(e) => updateProfile({ phone: e.target.value })} placeholder="+234 80X XXX XXXX" maxLength={20} /></Field>
                <Field label="WhatsApp"><Input value={profile.whatsapp ?? ""} onChange={(e) => updateProfile({ whatsapp: e.target.value })} placeholder="+234 80X XXX XXXX" maxLength={20} /></Field>
                <Field label="Date of birth"><Input type="date" value={profile.date_of_birth ?? ""} onChange={(e) => updateProfile({ date_of_birth: e.target.value })} /></Field>
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
                <Field label="Country">
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={profile.country ?? "Nigeria"} onChange={(e) => updateProfile({ country: e.target.value, state: "" })}>
                    {COUNTRY_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="State / Province">
                  {statesForCountry.length > 0 ? (
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={profile.state ?? ""} onChange={(e) => updateProfile({ state: e.target.value })}>
                      <option value="">Select state</option>
                      {statesForCountry.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <Input value={profile.state ?? ""} onChange={(e) => updateProfile({ state: e.target.value })} placeholder="State or province" maxLength={80} />
                  )}
                </Field>
                <Field label="City"><Input value={profile.city ?? ""} onChange={(e) => updateProfile({ city: e.target.value })} maxLength={80} /></Field>
                <Field label="Address"><Input value={profile.address ?? ""} onChange={(e) => updateProfile({ address: e.target.value })} maxLength={200} /></Field>
                <Field label="Nationality"><Input value={profile.nationality ?? ""} onChange={(e) => updateProfile({ nationality: e.target.value })} placeholder="e.g. Nigerian" maxLength={80} /></Field>
                <Field label="State of Origin"><Input value={profile.state_of_origin ?? ""} onChange={(e) => updateProfile({ state_of_origin: e.target.value })} placeholder="e.g. Anambra" maxLength={80} /></Field>
                <Field label="Matriculation Number"><Input value={profile.matric_number ?? ""} onChange={(e) => updateProfile({ matric_number: e.target.value })} placeholder="e.g. 2018/123456" maxLength={30} /></Field>
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
                <Field label="Facebook"><Input value={profile.facebook ?? ""} onChange={(e) => updateProfile({ facebook: e.target.value })} placeholder="https://facebook.com/..." /></Field>
                <Field label="Instagram"><Input value={profile.instagram ?? ""} onChange={(e) => updateProfile({ instagram: e.target.value })} placeholder="https://instagram.com/..." /></Field>
                <Field label="YouTube"><Input value={profile.youtube ?? ""} onChange={(e) => updateProfile({ youtube: e.target.value })} placeholder="https://youtube.com/@..." /></Field>
                <Field label="TikTok"><Input value={profile.tiktok ?? ""} onChange={(e) => updateProfile({ tiktok: e.target.value })} placeholder="https://tiktok.com/@..." /></Field>
                <Field label="Personal Website"><Input value={profile.website ?? ""} onChange={(e) => updateProfile({ website: e.target.value })} placeholder="https://..." /></Field>
              </div>
              <div className="pt-6 border-t border-border/60 flex justify-end">
                <Button variant="hero" onClick={saveProfile} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Save Information
                </Button>
              </div>
            </div>

            {/* Education Section */}
            <div className="rounded-2xl bg-card border border-border/60 p-6 md:p-8 space-y-5 shadow-card animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="font-display font-semibold text-lg text-primary">Education History</h3>
                <Button variant="outline" size="sm" onClick={addEducation}><Plus className="w-4 h-4 mr-1.5" /> Add education</Button>
              </div>
              <div className="space-y-4">
                {education.map((e, idx) => {
                  const isCoou = e.school.toLowerCase().includes('chukwuemeka') || e.school.toLowerCase().includes('coou');
                  return (
                  <div key={e.id} className={`rounded-xl border p-5 space-y-3 ${isCoou ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/10' : 'border-border/60 bg-muted/20'}`}>
                    {isCoou && (
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-2">
                        <BadgeCheck className="w-4 h-4 text-gold" /> COOU Education (Primary)
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {isCoou ? (
                        <div className="flex h-10 w-full rounded-md border border-primary/30 bg-primary/5 px-3 items-center text-sm font-medium text-primary">
                          Chukwuemeka Odumegwu Ojukwu University (COOU)
                        </div>
                      ) : (
                        <Input list="unis" value={e.school} onChange={(ev) => patchEducation(e.id, { school: ev.target.value })} placeholder="School *" />
                      )}
                      <datalist id="unis">
                        {NIGERIAN_UNIVERSITIES.map(u => <option key={u} value={u} />)}
                      </datalist>
                      <Input value={e.degree ?? ""} onChange={(ev) => patchEducation(e.id, { degree: ev.target.value })} placeholder="Degree (e.g. B.Sc.)" />
                      <Input value={e.field ?? ""} onChange={(ev) => patchEducation(e.id, { field: ev.target.value })} placeholder={isCoou ? "Department / Field" : "Field of study"} />
                      <div className="flex gap-2">
                        <Input type="number" value={e.start_year ?? ""} onChange={(ev) => patchEducation(e.id, { start_year: ev.target.value ? Number(ev.target.value) : null })} placeholder="Start year" />
                        <Input type="number" value={e.end_year ?? ""} onChange={(ev) => patchEducation(e.id, { end_year: ev.target.value ? Number(ev.target.value) : null })} placeholder="End year" />
                      </div>
                    </div>
                    {/* Certificate upload per education entry */}
                    {!e._isNew && (
                      <div className={`border-t pt-4 mt-4 ${isCoou ? 'border-gold/30' : 'border-border/40'}`}>
                        {isCoou ? (
                          /* Big prominent upload area for COOU */
                          <div className="rounded-2xl border-2 border-dashed border-gold/40 bg-gold/5 p-6 text-center">
                            <div className="w-14 h-14 rounded-full bg-gold/10 text-gold grid place-items-center mx-auto mb-3">
                              <Upload className="w-7 h-7" />
                            </div>
                            <h4 className="font-display font-semibold text-primary text-base">Upload Your COOU Certificate</h4>
                            <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                              Upload a clear photo or scan of your degree certificate, statement of result, or any proof of graduation from COOU. This is required for verification.
                            </p>
                            <label className="cursor-pointer inline-block mt-4">
                              <input type="file" accept="image/*,.pdf" hidden onChange={async (ev) => {
                                const file = ev.target.files?.[0];
                                if (!file || !user) return;
                                if (file.size > 1 * 1024 * 1024) { toast.error("File too large. Maximum size is 1MB"); return; }
                                setCertUploading(true);
                                const ext = file.name.split(".").pop();
                                const path = `${user.id}/cert-${Date.now()}.${ext}`;
                                const { error: upErr } = await supabase.storage.from("certificates").upload(path, file);
                                if (upErr) { toast.error(upErr.message); setCertUploading(false); return; }
                                const { data: { publicUrl } } = supabase.storage.from("certificates").getPublicUrl(path);
                                await supabase.from("certificate_uploads").insert({ user_id: user.id, file_url: publicUrl, file_name: file.name });
                                setCertUploading(false);
                                toast.success("Certificate uploaded successfully! It will be reviewed by an admin.");
                                load();
                              }} />
                              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-primary font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
                                {certUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {certUploading ? "Uploading..." : "Choose File to Upload"}
                              </span>
                            </label>
                            <p className="text-[11px] text-muted-foreground mt-3">Accepted: Images (JPG, PNG) or PDF · Max 1MB</p>
                          </div>
                        ) : (
                          /* Compact upload for other schools */
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5" /> Certificate / Proof (Max 1MB)</div>
                            <label className="cursor-pointer">
                              <input type="file" accept="image/*,.pdf" hidden onChange={async (ev) => {
                                const file = ev.target.files?.[0];
                                if (!file || !user) return;
                                if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
                                setCertUploading(true);
                                const ext = file.name.split(".").pop();
                                const path = `${user.id}/cert-${Date.now()}.${ext}`;
                                const { error: upErr } = await supabase.storage.from("certificates").upload(path, file);
                                if (upErr) { toast.error(upErr.message); setCertUploading(false); return; }
                                const { data: { publicUrl } } = supabase.storage.from("certificates").getPublicUrl(path);
                                await supabase.from("certificate_uploads").insert({ user_id: user.id, file_url: publicUrl, file_name: file.name });
                                setCertUploading(false);
                                toast.success("Certificate uploaded — pending review");
                                load();
                              }} />
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer">
                                {certUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                {certUploading ? "Uploading..." : "Upload Certificate"}
                              </span>
                            </label>
                          </div>
                        )}

                        {/* Show uploaded certificates */}
                        {certificates.length > 0 && (
                          <div className={`space-y-2 ${isCoou ? 'mt-4' : 'mt-2'}`}>
                            <div className="text-xs font-medium text-muted-foreground">Your uploaded documents:</div>
                            {certificates.map(cert => (
                              <div key={cert.id} className="flex items-center justify-between text-sm bg-card rounded-xl px-4 py-3 border border-border/60">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg grid place-items-center flex-shrink-0 ${cert.status === 'verified' ? 'bg-green-100 text-green-700' : cert.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {cert.status === 'verified' ? <BadgeCheck className="w-4 h-4" /> : cert.status === 'rejected' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-medium truncate">{cert.file_name || "Document"}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(cert.created_at).toLocaleDateString()}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${cert.status === 'verified' ? 'bg-green-100 text-green-800' : cert.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {cert.status === 'verified' ? '✓ Verified' : cert.status === 'rejected' ? '✗ Rejected' : '⏳ Pending Review'}
                                  </span>
                                  {cert.status === 'pending' && <button onClick={() => deleteCert(cert.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-3">
                      <div className="text-xs text-muted-foreground">
                        {e._isNew ? "New entry — not yet saved" : e._dirty ? "Unsaved changes" : "Saved"}
                      </div>
                      <div className="flex gap-2">
                        {!(isCoou && !e._isNew) && <Button variant="ghost" size="sm" onClick={() => deleteEducation(e.id)}><Trash2 className="w-4 h-4 text-destructive" /> {e._isNew ? "Cancel" : "Delete"}</Button>}
                        <Button size="sm" variant="hero" onClick={() => saveEducation(e.id)} disabled={!e._dirty}><Check className="w-4 h-4 mr-1.5" /> Save</Button>
                      </div>
                    </div>
                  </div>
                  );
                })}
                {education.length === 0 && <p className="text-sm text-muted-foreground py-4 border border-dashed rounded-xl text-center">No education added yet. Please add your educational background.</p>}
              </div>
            </div>

            {/* Employment Section */}
            <div className="rounded-2xl bg-card border border-border/60 p-6 md:p-8 space-y-6 shadow-card animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="font-display font-semibold text-lg text-primary">Employment & Experience</h3>
                <Button variant="outline" size="sm" onClick={addEmployment}><Plus className="w-4 h-4 mr-1.5" /> Add experience</Button>
              </div>
              <div className="space-y-4">
                {employment.map((w) => (
                  <div key={w.id} className="rounded-xl border border-border/60 p-5 bg-muted/20 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input value={w.company} onChange={(ev) => patchEmployment(w.id, { company: ev.target.value })} placeholder="Company *" />
                      <Input value={w.title ?? ""} onChange={(ev) => patchEmployment(w.id, { title: ev.target.value })} placeholder="Title" />
                      <div className="space-y-1"><Label className="text-[10px]">Start Date</Label><Input type="date" value={w.start_date ?? ""} onChange={(ev) => patchEmployment(w.id, { start_date: ev.target.value })} /></div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">End Date</Label>
                        <div className="flex gap-2 items-center">
                          <Input type="date" value={w.end_date ?? ""} onChange={(ev) => patchEmployment(w.id, { end_date: ev.target.value })} disabled={w.current} className="flex-1" />
                          <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                            <input type="checkbox" checked={w.current} onChange={(ev) => patchEmployment(w.id, { current: ev.target.checked, end_date: ev.target.checked ? null : w.end_date })} />
                            Current
                          </label>
                        </div>
                      </div>
                    </div>
                    <Textarea rows={2} value={w.description ?? ""} onChange={(ev) => patchEmployment(w.id, { description: ev.target.value })} placeholder="What did you do?" maxLength={500} />
                    <div className="flex items-center justify-between gap-2 pt-3">
                      <div className="text-xs text-muted-foreground">
                        {w._isNew ? "New entry — not yet saved" : w._dirty ? "Unsaved changes" : "Saved"}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => deleteEmployment(w.id)}><Trash2 className="w-4 h-4 text-destructive" /> {w._isNew ? "Cancel" : "Delete"}</Button>
                        <Button size="sm" variant="hero" onClick={() => saveEmployment(w.id)} disabled={!w._dirty}><Check className="w-4 h-4 mr-1.5" /> Save</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {employment.length === 0 && <p className="text-sm text-muted-foreground py-4 border border-dashed rounded-xl text-center">No employment added yet. Please add your professional experience.</p>}
              </div>
            </div>

            {/* Supporting Documents Section */}
            <DocumentsSection />
          </div>
        </div>
        <div className="mt-12">
          <Newsletter />
        </div>
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

const WelcomeModal = ({ open, onOpenChange, profile, onComplete }: { open: boolean; onOpenChange: (o: boolean) => void; profile: Profile; onComplete: () => void }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Welcome to COOU Alumni Connect</DialogTitle>
          <DialogDescription>Getting started with your alumni account</DialogDescription>
        </DialogHeader>
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-gold/10 text-gold rounded-full grid place-items-center mx-auto mb-4">
            <Check className="w-10 h-10" />
          </div>
          <h2 className="font-display text-2xl font-bold text-primary">Welcome to COOU Alumni Connect!</h2>
          <p className="text-muted-foreground mt-2">
            Congratulations {profile.display_name?.split(' ')[0] || "Alumnus"}! You are now part of our global network of Chukwuemeka Odumegwu Ojukwu University graduates.
          </p>
        </div>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center flex-shrink-0 mt-0.5">
              <BadgeCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">{profile.verified ? "Account Verified" : "Get Verified"}</div>
              <p className="text-xs text-muted-foreground">
                {profile.coou_id 
                  ? `Your official COOU ID is ${profile.coou_id}. Use it for all alumni transactions.` 
                  : "Upload your certificate to get the official Alumni Badge and your unique COOU ID."}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center flex-shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Join the Conversation</div>
              <p className="text-xs text-muted-foreground">Access community channels and direct messaging to connect with fellow alumni.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center flex-shrink-0 mt-0.5">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Explore Opportunities</div>
              <p className="text-xs text-muted-foreground">Browse curated jobs and mentorship opportunities from our network.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="hero" className="w-full" onClick={onComplete}>
            Get Started →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DashboardPage;
