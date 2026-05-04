import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, Bell, Search, Shield, LogOut, Heart, GraduationCap, MessageCircle, Calendar, BookOpen, Vote, Menu, X, ChevronRight, User } from "lucide-react";
import coouLogo from "@/assets/coou-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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

import { useState, useEffect } from "react";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ avatar_url: string | null; display_name: string | null } | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  usePresence();

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("avatar_url, display_name").eq("user_id", user.id).single()
        .then(({ data }) => setProfile(data));
    } else {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/directory", label: "Directory", icon: Users },
    { to: "/jobs", label: "Jobs", icon: Briefcase },
    { to: "/mentorship", label: "Mentorship", icon: GraduationCap },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/chat", label: "Chat", icon: MessageCircle },
    { to: "/support", label: "Support", icon: Heart },
    { to: "/voting", label: "Voting", icon: Vote },
    { to: "/resources", label: "Resources", icon: BookOpen },
    { to: "/donations", label: "Donate", icon: Heart },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const initials = (profile?.display_name || user?.email || "U")
    .split(/[ @]/)
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarContent = ({ isMobile = false }) => (
    <div className={`flex flex-col h-full bg-card border-r border-border/60 transition-all duration-300 ${collapsed && !isMobile ? "w-20" : "w-72"}`}>
      <div className={`p-6 flex items-center justify-between ${collapsed && !isMobile ? "px-5" : ""}`}>
        <Link to="/" className="flex items-center gap-3 group overflow-hidden">
          <img src={coouLogo} alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform shrink-0" />
          {(!collapsed || isMobile) && (
            <div className="flex flex-col transition-opacity duration-300">
              <span className="font-display font-bold text-base leading-tight">COOU</span>
              <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">Alumni Connect</span>
            </div>
          )}
        </Link>
      </div>

      <nav className={`flex-1 px-3 py-4 space-y-1.5 overflow-y-auto no-scrollbar`}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            title={collapsed && !isMobile ? l.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-elegant" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              } ${collapsed && !isMobile ? "justify-center" : "justify-between"}`
            }
          >
            <div className="flex items-center gap-3">
              <l.icon className={`w-4.5 h-4.5 transition-transform group-hover:scale-110 shrink-0`} />
              {(!collapsed || isMobile) && <span className="whitespace-nowrap transition-opacity duration-300">{l.label}</span>}
            </div>
            {(!collapsed || isMobile) && <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-50 transition-all`} />}
          </NavLink>
        ))}
      </nav>

      <div className={`p-4 mt-auto border-t border-border/40 ${collapsed && !isMobile ? "px-2" : ""}`}>
        {user ? (
          <div className={`bg-muted/40 rounded-2xl border border-border/40 overflow-hidden ${collapsed && !isMobile ? "p-2" : "p-4"}`}>
            <div className={`flex items-center gap-3 ${collapsed && !isMobile ? "justify-center mb-0" : "mb-4"}`}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-10 h-10 rounded-full object-cover shrink-0 shadow-sm" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : null}
              {(!profile?.avatar_url) && (
                <div className="w-10 h-10 rounded-full bg-gradient-hero text-primary-foreground grid place-items-center text-xs font-semibold shrink-0 shadow-sm">
                  {initials}
                </div>
              )}
              {(!collapsed || isMobile) && (
                <div className="min-w-0 flex-1 transition-opacity duration-300">
                  <p className="text-sm font-semibold truncate text-primary">{profile?.display_name || "Alumnus"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </div>
            {(!collapsed || isMobile) && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="outline" size="sm" className="text-[11px] h-8" asChild>
                  <Link to="/dashboard"><User className="w-3 h-3 mr-1" /> Profile</Link>
                </Button>
                <Button variant="ghost" size="sm" className="text-[11px] h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={async () => { await signOut(); navigate("/"); }}>
                  <LogOut className="w-3 h-3 mr-1" /> Exit
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button variant="hero" className="w-full" asChild>
            {collapsed && !isMobile ? <User className="w-4 h-4" /> : <Link to="/auth">Sign In</Link>}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-cream flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block h-screen sticky top-0 shrink-0 transition-all duration-300 ${collapsed ? "w-20" : "w-72"}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:hidden transition-transform duration-300 shadow-2xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent isMobile />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 md:h-20 sticky top-0 z-40 bg-background/60 backdrop-blur-md border-b border-border/40 flex items-center px-4 md:px-8 justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={() => setCollapsed(!collapsed)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="font-display font-semibold text-lg hidden md:block text-primary capitalize">
              {location.pathname.split("/")[1] || "Home"}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-border/40 text-muted-foreground focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-3.5 h-3.5" />
              <input type="text" placeholder="Global search..." className="bg-transparent border-none text-xs focus:ring-0 w-32 md:w-48" />
            </div>
            
            <button className="grid place-items-center w-10 h-10 rounded-full hover:bg-muted transition-colors relative" aria-label="Notifications">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-gold border-2 border-background shadow-sm" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border/40">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : null}
                  {(!profile?.avatar_url) && (
                    <div className="w-8 h-8 rounded-full bg-gradient-hero text-primary-foreground grid place-items-center text-[10px] font-bold shadow-sm">
                      {initials}
                    </div>
                  )}
                  <ChevronRight className="w-3 h-3 text-muted-foreground rotate-90" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/dashboard">Dashboard</Link></DropdownMenuItem>
                {isAdmin && <DropdownMenuItem asChild><Link to="/admin">Admin Panel</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={async () => { await signOut(); navigate("/"); }}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
