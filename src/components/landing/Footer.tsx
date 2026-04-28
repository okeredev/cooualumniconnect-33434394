import coouLogo from "@/assets/coou-logo.png";

export const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-card">
      <div className="container py-14">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src={coouLogo} alt="COOU Alumni Connect" className="w-14 h-14 object-contain drop-shadow-lg" />
              <span className="font-display font-semibold text-base leading-tight">
                COOU <span className="text-primary">Alumni Connect</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              The official alumni networking, mentorship and career platform of Chukwuemeka Odumegwu Ojukwu University.
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
          <div>© 2026 Chukwuemeka Odumegwu Ojukwu University. All rights reserved.</div>
          <div>Igbariam · Uli · Awka Campuses</div>
        </div>
      </div>
    </footer>
  );
};
