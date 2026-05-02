import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Briefcase, ArrowRight, Lock, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Mini = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  department: string | null;
  graduation_year: number | null;
  verified: boolean;
};

const FALLBACK: Mini[] = [
  { user_id: "1", display_name: "Amara Okafor", avatar_url: null, city: "Lagos", state: null, department: "Computer Science", graduation_year: 2017, verified: true },
  { user_id: "2", display_name: "Daniel Reyes", avatar_url: null, city: "Abuja", state: null, department: "Business", graduation_year: 2014, verified: true },
  { user_id: "3", display_name: "Priya Natarajan", avatar_url: null, city: "Ibadan", state: null, department: "Data Science", graduation_year: 2019, verified: false },
  { user_id: "4", display_name: "Jordan Mensah", avatar_url: null, city: "Awka", state: null, department: "Design", graduation_year: 2016, verified: true },
  { user_id: "5", display_name: "Chinedu Eze", avatar_url: null, city: "Enugu", state: null, department: "Engineering", graduation_year: 2018, verified: true },
  { user_id: "6", display_name: "Funke Adeyemi", avatar_url: null, city: "Lagos", state: null, department: "Law", graduation_year: 2015, verified: false },
];

export const AlumniPreview = () => {
  const { user } = useAuth();
  const [people, setPeople] = useState<Mini[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, city, state, department, graduation_year, verified")
        .eq("suspended", false)
        .order("created_at", { ascending: false })
        .limit(6);
      const list = (data ?? []) as Mini[];
      setPeople(list.length ? list : FALLBACK);
      setLoading(false);
    })();
  }, []);

  const connectHref = user ? "/directory" : "/auth";

  return (
    <section className="py-20 lg:py-24">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-3">Directory</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary leading-tight">
              Meet the network you've been missing.
            </h2>
            <p className="text-muted-foreground mt-3 text-sm md:text-base">
              A peek at our verified COOU alumni. Connect to unlock full profiles, contact info & messaging.
            </p>
          </div>
          <Link
            to={connectHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-glow self-start md:self-end"
          >
            Browse full directory <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Compact carousel-style row, doesn't take all the page space */}
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {(loading ? FALLBACK : people).slice(0, 6).map((a) => {
              const initials = (a.display_name || "U").split(" ").map((p) => p[0]).slice(0, 2).join("");
              return (
                <article
                  key={a.user_id}
                  className="group rounded-xl border border-border/60 bg-card overflow-hidden hover:shadow-elegant transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="h-12 bg-gradient-hero relative grain" />
                  <div className="px-3 pb-3 -mt-7 relative">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt={a.display_name ?? "Alumni"} className="w-12 h-12 rounded-xl object-cover border-2 border-card shadow-card mb-2" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-card border-2 border-card grid place-items-center font-display text-sm font-semibold text-primary shadow-card mb-2">{initials}</div>
                    )}
                    <h3 className="font-display font-semibold text-sm text-primary flex items-center gap-1 truncate">
                      <span className="truncate">{a.display_name || "Alumni"}</span>
                      {a.verified && <BadgeCheck className="w-3.5 h-3.5 text-gold flex-shrink-0" />}
                    </h3>
                    {a.graduation_year && (
                      <p className="text-[10px] text-gold font-medium uppercase tracking-wider mt-0.5 truncate">
                        '{String(a.graduation_year).slice(-2)} · {a.department || "COOU"}
                      </p>
                    )}
                    <div className="mt-2 text-[11px] text-muted-foreground space-y-0.5">
                      {(a.city || a.state) && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{[a.city, a.state].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground/70">
                        <Lock className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">Connect to unlock</span>
                      </div>
                    </div>
                    <Link
                      to={connectHref}
                      className="mt-3 w-full inline-flex justify-center items-center gap-1 text-xs font-medium text-primary border border-primary/20 rounded-md py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                      aria-label={user ? `View ${a.display_name}` : "Sign in to connect"}
                    >
                      Connect
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
