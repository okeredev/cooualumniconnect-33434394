import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import coouLogo from "@/assets/coou-logo.png";

const links = [
  { label: "Directory", href: "/directory" },
  { label: "Jobs", href: "/jobs" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Mentorship", href: "#mentorship" },
  { label: "Events", href: "#events" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <nav className="container flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3 group" aria-label="COOU Alumni Connect home">
          <img src={coouLogo} alt="COOU Alumni Connect" className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-[0_2px_8px_hsl(var(--primary)/0.25)] group-hover:scale-105 transition-transform" />
          <span className="font-display font-bold text-lg sm:text-xl md:text-2xl tracking-tight leading-none">
            COOU <span className="text-primary">Alumni Connect</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            l.href.startsWith("/") ? (
              <Link key={l.href} to={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link>
            ) : (
              <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            )
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign in</Link></Button>
          <Button variant="hero" size="sm" asChild><Link to="/dashboard">Open dashboard</Link></Button>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="py-2 text-sm font-medium" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" className="flex-1" asChild><Link to="/auth">Sign in</Link></Button>
              <Button variant="hero" size="sm" className="flex-1" asChild><Link to="/auth">Join</Link></Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
