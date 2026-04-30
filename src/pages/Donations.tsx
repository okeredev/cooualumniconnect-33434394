import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Heart, Loader2, Plus } from "lucide-react";
import { z } from "zod";

type Donation = { id: string; amount: number; currency: string; purpose: string | null; message: string | null; status: string; created_at: string };

const schema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  currency: z.string().min(2).max(5),
  purpose: z.string().max(120).optional(),
  message: z.string().max(500).optional(),
});

const DonationsPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Donation[]>([]);
  const [totals, setTotals] = useState({ count: 0, total: 0, fulfilled: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", currency: "NGN", purpose: "", message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = "Donations — COOU Alumni Connect"; load(); }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [mine, all] = await Promise.all([
      supabase.from("donations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("donations").select("amount,status"),
    ]);
    setItems((mine.data ?? []) as Donation[]);
    const rows = (all.data ?? []) as { amount: number; status: string }[];
    setTotals({
      count: rows.length,
      total: rows.reduce((s, r) => s + Number(r.amount), 0),
      fulfilled: rows.filter((r) => r.status === "fulfilled").reduce((s, r) => s + Number(r.amount), 0),
    });
    setLoading(false);
  };

  const submit = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ ...form, amount: Number(form.amount) });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setSaving(true);
    const { error } = await supabase.from("donations").insert({
      user_id: user.id,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      purpose: parsed.data.purpose || null,
      message: parsed.data.message || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Pledge submitted — thank you!");
    setOpen(false); setForm({ amount: "", currency: "NGN", purpose: "", message: "" }); load();
  };

  const cancel = async (id: string) => {
    await supabase.from("donations").update({ status: "cancelled" }).eq("id", id);
    toast.success("Pledge cancelled"); load();
  };

  return (
    <AppShell>
      <section className="container py-10 space-y-6">
        <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-8 grain relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Give back</div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">Support COOU Alumni Initiatives</h1>
              <p className="text-primary-foreground/70 mt-2 max-w-2xl">Pledge to scholarships, campus projects or alumni programs. Pledges are tracked manually — our team will reach out with payment instructions.</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button variant="gold" aria-label="New pledge"><Heart className="w-4 h-4" /> Make a pledge</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New pledge</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><Label>Amount</Label><Input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                    <div><Label>Currency</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                        <option>NGN</option><option>USD</option><option>EUR</option><option>GBP</option>
                      </select>
                    </div>
                  </div>
                  <div><Label>Purpose</Label><Input maxLength={120} placeholder="Scholarship fund, library, etc." value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
                  <div><Label>Message (optional)</Label><Textarea rows={3} maxLength={500} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit pledge"}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[{ l: "Total pledges", v: totals.count }, { l: "Pledged amount", v: totals.total.toLocaleString() }, { l: "Fulfilled", v: totals.fulfilled.toLocaleString() }].map((c) => (
            <div key={c.l} className="rounded-2xl bg-card border border-border/60 p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.l}</div>
              <div className="font-display text-3xl font-semibold text-primary mt-1">{c.v}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold text-primary mb-3">Your pledges</h2>
          {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No pledges yet. Be the first to give back.</p>
          ) : (
            <div className="space-y-2">
              {items.map((d) => (
                <div key={d.id} className="rounded-xl bg-card border border-border/60 p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{d.currency} {Number(d.amount).toLocaleString()} · <span className="text-muted-foreground font-normal">{d.purpose || "General"}</span></div>
                    {d.message && <div className="text-sm text-muted-foreground line-clamp-1">{d.message}</div>}
                    <div className="text-xs text-muted-foreground mt-1">{new Date(d.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${d.status === "fulfilled" ? "bg-green-100 text-green-800" : d.status === "cancelled" ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-800"}`}>{d.status}</span>
                    {d.status === "pledged" && <Button size="sm" variant="ghost" onClick={() => cancel(d.id)}>Cancel</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
};

export default DonationsPage;
