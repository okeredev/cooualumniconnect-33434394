import { NavLink, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, Bell, Search, Shield, LogOut, Heart, GraduationCap, MessageCircle, Calendar, BookOpen } from "lucide-react";
import coouLogo from "@/assets/coou-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  usePresence();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/directory", label: "Directory", icon: Users },
    { to: "/jobs", label: "Jobs", icon: Briefcase },
    { to: "/mentorship", label: "Mentorship", icon: GraduationCap },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/chat", label: "Chat", icon: MessageCircle },
    { to: "/resources", label: "Resources", icon: BookOpen },
    { to: "/donations", label: "Donate", icon: Heart },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const initials = (user?.user_metadata?.display_name || user?.email || "U")
    .split(/[ @]/)
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-cream">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/60">
        <div className="container flex items-center justify-between h-20">
          <NavLink to="/" className="flex items-center gap-3 group" aria-label="COOU Alumni Connect home">
            <img src={coouLogo} alt="COOU Alumni Connect" className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-[0_2px_8px_hsl(var(--primary)/0.25)] group-hover:scale-105 transition-transform" />
            <span className="font-display font-bold text-lg md:text-xl leading-none hidden sm:inline">
              COOU <span className="text-primary">Alumni Connect</span>
            </span>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-1 bg-muted/50 rounded-full p-1 max-w-[60vw] overflow-x-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
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
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-full bg-gradient-hero text-primary-foreground grid place-items-center text-xs font-semibold" aria-label="Account">
                    {initials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/dashboard">Dashboard</Link></DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem asChild><Link to="/admin">Admin Panel</Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" variant="hero" asChild><Link to="/auth">Sign in</Link></Button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="lg:hidden border-t border-border/60 bg-background/80">
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
