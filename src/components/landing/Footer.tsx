import { GraduationCap } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-card">
      <div className="container py-14">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-gradient-hero">
                <GraduationCap className="w-5 h-5 text-gold" />
              </span>
              <span className="font-display font-semibold text-lg">
                Alumin<span className="text-primary">AI</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Smart alumni networking, mentorship, and giving — designed for institutions that care.
            </p>
          </div>

          {[
            { title: "Platform", links: ["Directory", "Careers", "Mentorship", "Events"] },
            { title: "Institutions", links: ["For schools", "Pricing", "API", "Security"] },
            { title: "Company", links: ["About", "Blog", "Privacy", "Contact"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-sm text-primary mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-border/60 flex flex-col md:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <div>© 2026 AluminAI. Crafted for graduates everywhere.</div>
          <div>Made with intention · Stockholm</div>
        </div>
      </div>
    </footer>
  );
};
