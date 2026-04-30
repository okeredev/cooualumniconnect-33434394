import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";

type Resource = { id: string; title: string; description: string | null; category: string | null; file_url: string | null; external_url: string | null; created_at: string };

const ResourcesPage = () => {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  useEffect(() => { document.title = "Resource Hub — COOU Alumni Connect"; load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Resource[]); setLoading(false);
  };

  const categories = useMemo(() => ["all", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[]))], [items]);
  const filtered = items.filter((i) =>
    (cat === "all" || i.category === cat) &&
    (!q || (i.title + " " + (i.description ?? "")).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <AppShell>
      <section className="container py-10 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">Resource Hub</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary mt-1">Curated guides, docs & links</h1>
          <p className="text-muted-foreground mt-2">Resources shared by COOU alumni administrators.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <Input placeholder="Search resources..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search resources" />
          <select className="flex h-10 rounded-md border border-input bg-background px-3 text-sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
            {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
          </select>
        </div>

        {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No resources yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-2xl bg-card border border-border/60 p-5 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {r.category && <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted">{r.category}</span>}
                </div>
                <div className="font-display font-semibold text-primary">{r.title}</div>
                {r.description && <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>}
                <div className="flex gap-2 mt-auto pt-2">
                  {r.file_url && <a href={r.file_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline"><Download className="w-4 h-4" />Download</a>}
                  {r.external_url && <a href={r.external_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:underline"><ExternalLink className="w-4 h-4" />Open link</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default ResourcesPage;
