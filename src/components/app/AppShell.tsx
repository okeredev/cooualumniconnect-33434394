import { NavLink } from "react-router-dom";
import { GraduationCap, LayoutDashboard, Users, Briefcase, Bell, Search } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/directory", label: "Directory", icon: Users },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-cream">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-gradient-hero">
              <GraduationCap className="w-5 h-5 text-gold" />
            </span>
            <span className="font-display font-semibold text-lg">
              Alumin<span className="text-primary">AI</span>
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-full p-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive ? "bg-card shadow-card text-primary" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="hidden sm:grid place-items-center w-9 h-9 rounded-full hover:bg-muted transition-colors" aria-label="Search">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="grid place-items-center w-9 h-9 rounded-full hover:bg-muted transition-colors relative" aria-label="Notifications">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gold" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-hero text-primary-foreground grid place-items-center text-xs font-semibold">
              CO
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t border-border/60 bg-background/80">
          <div className="container flex items-center gap-1 py-2 overflow-x-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`
                }
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
};
