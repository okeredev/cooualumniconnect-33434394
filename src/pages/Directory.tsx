import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ALUMNI, COOU_DEPARTMENTS, GRAD_YEARS, LOCATIONS } from "@/data/coou";
import { Search, MapPin, Briefcase, X } from "lucide-react";

const DirectoryPage = () => {
  const [q, setQ] = useState("");
  const [year, setYear] = useState<string>("all");
  const [dept, setDept] = useState<string>("all");
  const [loc, setLoc] = useState<string>("all");

  useEffect(() => {
    document.title = "Alumni Directory — COOU Alumni Connect";
  }, []);

  const results = useMemo(() => {
    return ALUMNI.filter((a) => {
      const matchesQ = !q || [a.name, a.role, a.company, a.department, a.skills.join(" ")].join(" ").toLowerCase().includes(q.toLowerCase());
      const matchesYear = year === "all" || a.year === Number(year);
      const matchesDept = dept === "all" || a.department === dept;
      const matchesLoc = loc === "all" || a.location === loc;
      return matchesQ && matchesYear && matchesDept && matchesLoc;
    });
  }, [q, year, dept, loc]);

  const reset = () => { setQ(""); setYear("all"); setDept("all"); setLoc("all"); };
  const hasFilters = q || year !== "all" || dept !== "all" || loc !== "all";

  return (
    <AppShell>
      <section className="container py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-2">COOU Network</div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary">Alumni Directory</h1>
            <p className="text-muted-foreground mt-2">Search 48,000+ COOU graduates by year, department, and location.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-card border border-border/60 p-4 md:p-5 shadow-card">
          <div className="grid md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, role, company, or skill…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select className="md:col-span-2" value={year} onChange={setYear} placeholder="Year">
              <option value="all">All years</option>
              {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
            <Select className="md:col-span-3" value={dept} onChange={setDept} placeholder="Department">
              <option value="all">All departments</option>
              {COOU_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Select className="md:col-span-2" value={loc} onChange={setLoc} placeholder="Location">
              <option value="all">All locations</option>
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </div>
          {hasFilters && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{results.length} matching alumni</span>
              <button onClick={reset} className="flex items-center gap-1 text-primary hover:text-primary-glow">
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
          {results.map((a) => (
            <div key={a.id} className="group rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-elegant transition-all duration-500 hover:-translate-y-1">
              <div className={`h-24 bg-gradient-to-br ${a.tone} relative grain`} />
              <div className="px-5 pb-5 -mt-10 relative">
                <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card grid place-items-center font-display text-lg font-semibold text-primary shadow-card mb-3">
                  {a.initials}
                </div>
                <h3 className="font-display font-semibold text-primary">{a.name}</h3>
                <p className="text-[11px] text-gold font-medium uppercase tracking-wider mt-0.5">Class of {a.year} · {a.department}</p>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{a.role} @ {a.company}</span></div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {a.location}</div>
                </div>
                <Button variant="hero" size="sm" className="mt-4 w-full">Connect</Button>
              </div>
            </div>
          ))}
          {results.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              No alumni match those filters. Try clearing some.
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
};

const Select = ({ value, onChange, children, className, placeholder }: { value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string; placeholder?: string }) => (
  <select
    aria-label={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${className ?? ""}`}
  >
    {children}
  </select>
);

export default DirectoryPage;
