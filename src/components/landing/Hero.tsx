import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Briefcase } from "lucide-react";
import heroImage from "@/assets/coou-campus-gate.jpg";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 rounded-full bg-gold/20 blur-3xl pointer-events-none" />

      <div className="container relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-primary mb-6">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Official COOU Alumni Platform</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] text-balance text-primary">
              Once a COOU graduate,{" "}
              <span className="italic font-light text-primary-glow">always</span>{" "}
              connected.
            </h1>

            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
              The official alumni network of Chukwuemeka Odumegwu Ojukwu University —
              uniting graduates, students and faculty across Igbariam, Uli and Awka campuses
              for mentorship, careers and lifelong impact.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" className="text-base">
                Join the network <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-base border-primary/20">
                Explore directory
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              {[
                { value: "48k+", label: "Alumni" },
                { value: "1.2k", label: "Mentors" },
                { value: "320+", label: "Companies" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl md:text-3xl font-semibold text-primary">{s.value}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant">
              <img
                src={heroImage}
                alt="The main entrance gate of Chukwuemeka Odumegwu Ojukwu University (COOU)"
                width={1280}
                height={1600}
                className="w-full h-auto object-cover aspect-[4/5]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-primary/10 to-transparent" />
            </div>

            {/* Floating cards */}
            <div className="hidden md:flex absolute -left-6 top-12 bg-card rounded-xl shadow-card border border-border/60 p-4 gap-3 items-center animate-float">
              <div className="w-10 h-10 rounded-lg bg-gold/20 grid place-items-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">New connection</div>
                <div className="text-sm font-semibold">Chinaza · Class of '18</div>
              </div>
            </div>
            <div className="hidden md:flex absolute -right-4 bottom-16 bg-card rounded-xl shadow-card border border-border/60 p-4 gap-3 items-center animate-float" style={{ animationDelay: "1.5s" }}>
              <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Referral match</div>
                <div className="text-sm font-semibold">Analyst @ Access Bank</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
