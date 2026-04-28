import { Users, Briefcase, MessageCircle, Calendar, GraduationCap, Heart, Sparkles, BookOpen } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Alumni Directory",
    desc: "Search 48,000+ graduates by year, department, industry, and location.",
    span: "md:col-span-2",
    accent: true,
  },
  {
    icon: Sparkles,
    title: "AI Recommendations",
    desc: "Smart matches for mentors, peers, and roles based on your goals.",
  },
  {
    icon: Briefcase,
    title: "Career Board",
    desc: "Exclusive jobs, referrals, and applications tracked in one place.",
  },
  {
    icon: GraduationCap,
    title: "Mentorship",
    desc: "Get matched with mentors by skills and career interests.",
  },
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    desc: "DMs and group chats by department, cohort, and interest.",
  },
  {
    icon: Calendar,
    title: "Events & RSVPs",
    desc: "Reunions, talks, and virtual meetups with reminders.",
    span: "md:col-span-2",
  },
  {
    icon: Heart,
    title: "Donations",
    desc: "Run campaigns, track impact, celebrate donors.",
  },
  {
    icon: BookOpen,
    title: "Resource Hub",
    desc: "Career guides, scholarships, and shared resources.",
  },
];

export const Features = () => {
  return (
    <section id="network" className="py-24 lg:py-32 bg-gradient-cream">
      <div className="container">
        <div className="max-w-2xl mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-4">The platform</div>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-primary leading-tight text-balance">
            Everything alumni need, in one elegant place.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            From your first connection to your hundredth hire — AluminAI grows with your community.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className={`group relative rounded-2xl border border-border/60 bg-card p-7 hover:shadow-elegant transition-all duration-500 hover:-translate-y-1 ${f.span ?? ""} ${
                f.accent ? "bg-gradient-hero text-primary-foreground border-transparent" : ""
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl grid place-items-center mb-5 ${
                  f.accent ? "bg-gold/20 text-gold" : "bg-primary/5 text-primary"
                }`}
              >
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className={`font-display text-xl font-semibold mb-2 ${f.accent ? "text-primary-foreground" : "text-primary"}`}>
                {f.title}
              </h3>
              <p className={`text-sm leading-relaxed ${f.accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
