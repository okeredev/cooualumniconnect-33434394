import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type ProfilePreview = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  department: string | null;
  graduation_year: number | null;
  city: string | null;
  state: string | null;
  verified: boolean;
};

export const DirectoryPreview = () => {
  const [profiles, setProfiles] = useState<ProfilePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("directory_profiles")
        .select("user_id, display_name, avatar_url, department, graduation_year, city, state, verified")
        .eq("suspended", false)
        .order("created_at", { ascending: false })
        .limit(4);
      setProfiles((data ?? []) as ProfilePreview[]);
      setLoading(false);
    })();
  }, []);

  if (loading || profiles.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30 border-y border-border/40 overflow-hidden">
      <div className="container relative">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-3">Directory</div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-primary">Discover Alumni</h2>
          <p className="text-muted-foreground mt-4 text-sm md:text-base">
            Connect with verified graduates from Chukwuemeka Odumegwu Ojukwu University across the globe.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 relative z-10">
          {profiles.map((a) => {
            const initials = (a.display_name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("");
            return (
              <div key={a.user_id} className="group rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-elegant transition-all duration-500 hover:-translate-y-1">
                <div className="h-16 md:h-20 bg-gradient-hero relative grain" />
                <div className="px-4 pb-5 -mt-8 relative">
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover border-4 border-card shadow-card mb-2" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-card border-4 border-card grid place-items-center font-display text-base font-semibold text-primary shadow-card mb-2">{initials}</div>
                  )}
                  <h3 className="font-display text-sm font-semibold text-primary flex items-center gap-1.5 truncate">
                    <span className="truncate">{a.display_name || "Unnamed"}</span>
                    {a.verified && <BadgeCheck className="w-3.5 h-3.5 text-gold flex-shrink-0" />}
                  </h3>
                  {a.graduation_year && <p className="text-[10px] text-gold font-medium uppercase tracking-wider mt-0.5 truncate">Class of {a.graduation_year}</p>}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="truncate">{a.department || "—"}</div>
                    {(a.city || a.state) && <div className="truncate mt-0.5">{[a.city, a.state].filter(Boolean).join(", ")}</div>}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8" asChild>
                      <Link to="/auth">Connect</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center relative z-10">
          <Button size="lg" asChild>
            <Link to="/directory"><Search className="w-4 h-4 mr-2" /> Browse Full Directory</Link>
          </Button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      </div>
    </section>
  );
};
