import { MapPin, Briefcase } from "lucide-react";

const alumni = [
  { name: "Amara Okafor", role: "Senior PM, Flutterwave", year: "Class of 2017", dept: "Computer Science", location: "Lagos", initials: "AO", tone: "from-emerald-700 to-emerald-900" },
  { name: "Daniel Reyes", role: "Founder, Northwind", year: "Class of 2014", dept: "Business", location: "Abuja", initials: "DR", tone: "from-amber-600 to-amber-800" },
  { name: "Priya Natarajan", role: "AI Researcher, Data Science Nigeria", year: "Class of 2019", dept: "Data Science", location: "Ibadan", initials: "PN", tone: "from-emerald-600 to-teal-800" },
  { name: "Jordan Mensah", role: "Design Lead, Andela", year: "Class of 2016", dept: "Design", location: "Awka", initials: "JM", tone: "from-yellow-600 to-amber-900" },
];

export const AlumniPreview = () => {
  return (
    <section className="py-24 lg:py-32">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-4">Directory</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-primary leading-tight">
              Meet the network you've been missing.
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm">
            Filter by graduation year, industry, or city. Reach out with a single click.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {alumni.map((a) => (
            <div key={a.name} className="group rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-elegant transition-all duration-500 hover:-translate-y-1">
              <div className={`h-28 bg-gradient-to-br ${a.tone} relative`}>
                <div className="absolute inset-0 grain opacity-50" />
              </div>
              <div className="px-5 pb-5 -mt-10 relative">
                <div className="w-20 h-20 rounded-2xl bg-card border-4 border-card grid place-items-center font-display text-xl font-semibold text-primary shadow-card mb-3">
                  {a.initials}
                </div>
                <h3 className="font-display font-semibold text-lg text-primary">{a.name}</h3>
                <p className="text-xs text-gold font-medium uppercase tracking-wider mt-0.5">{a.year}</p>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> {a.role}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {a.location} · {a.dept}</div>
                </div>
                <button className="mt-4 w-full text-sm font-medium text-primary border border-primary/20 rounded-lg py-2 hover:bg-primary hover:text-primary-foreground transition-colors">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
