import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, Check, ShieldCheck, Clock, Users, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Election = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  status: "upcoming" | "active" | "closed";
};

type Candidate = {
  id: string;
  election_id: string;
  user_id: string;
  manifesto: string | null;
  name: string | null;
  position: string | null;
  image_url: string | null;
  votes_count?: number;
  profiles: { display_name: string | null; avatar_url: string | null; department: string | null } | null;
};

const VotingPage = () => {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingFor, setVotingFor] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Alumni Elections — COOU Alumni Connect";
    loadElections();
  }, [user]);

  const loadElections = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("elections").select("*").order("starts_at", { ascending: false });
    if (error) {
      // Table may not exist yet - show empty state instead of error
      console.warn("Elections table not available:", error.message);
    } else {
      setElections(data || []);
      const current = data?.find(e => e.status === 'active') || data?.[0];
      if (current) await selectElection(current);
    }
    setLoading(false);
  };

  const selectElection = async (e: Election) => {
    setActiveElection(e);
    const [cData, vData, voteCounts] = await Promise.all([
      supabase.from("election_candidates").select("*, profiles(display_name, avatar_url, department)").eq("election_id", e.id),
      user ? supabase.from("votes").select("candidate_id").eq("election_id", e.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      e.status === 'closed' ? supabase.from("votes").select("candidate_id").eq("election_id", e.id) : Promise.resolve({ data: [] }),
    ]);
    
    // Count votes per candidate
    const countMap: Record<string, number> = {};
    ((voteCounts.data as any[]) ?? []).forEach((v: any) => {
      countMap[v.candidate_id] = (countMap[v.candidate_id] ?? 0) + 1;
    });
    
    const candidatesWithCounts = ((cData.data as any[]) || []).map((c: any) => ({
      ...c,
      votes_count: countMap[c.id] ?? 0,
    }));
    
    setCandidates(candidatesWithCounts);
    setMyVote(vData.data?.candidate_id || null);
  };

  const handleVote = async (candidateId: string) => {
    if (!user) { toast.error("Please sign in to vote"); return; }
    if (activeElection?.status !== 'active') { toast.error("Voting is closed"); return; }
    if (myVote) { toast.error("You have already voted in this election"); return; }
    
    if (!confirm("Confirm your vote? This cannot be changed.")) return;
    
    setVotingFor(candidateId);
    const { error } = await supabase.from("votes").insert({
      election_id: activeElection.id,
      user_id: user.id,
      candidate_id: candidateId
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Vote cast successfully!");
      setMyVote(candidateId);
      // Refresh candidates to show updated counts (if public)
      selectElection(activeElection);
    }
    setVotingFor(null);
  };

  if (loading) return (
    <AppShell><div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div></AppShell>
  );

  return (
    <AppShell>
      <section className="container py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Governance
            </div>
            <h1 className="font-display text-4xl font-semibold text-primary">Alumni Governance</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">Participate in democratic elections for the COOU Alumni Association leadership.</p>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {elections.map((e) => (
              <button key={e.id} onClick={() => selectElection(e)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeElection?.id === e.id ? "bg-primary text-primary-foreground shadow-lg" : "bg-card border border-border/60 hover:border-primary/40"}`}>
                {e.title}
              </button>
            ))}
          </div>
        </div>

        {activeElection && (
          <div className="grid lg:grid-cols-[1fr_350px] gap-8">
            <div className="space-y-8">
              <div className="rounded-3xl bg-card border border-border/60 p-6 md:p-8 shadow-card relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6">
                  <Badge variant={activeElection.status === 'active' ? "hero" : "outline"} className="uppercase tracking-widest px-3 py-1">
                    {activeElection.status}
                  </Badge>
                </div>
                <h2 className="font-display text-2xl font-semibold text-primary">{activeElection.title}</h2>
                <p className="text-muted-foreground mt-4 leading-relaxed">{activeElection.description}</p>
                
                <div className="mt-8 grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border/40">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Deadline</div>
                      <div className="text-sm font-medium">{new Date(activeElection.ends_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border/40">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Total Candidates</div>
                      <div className="text-sm font-medium">{candidates.length} Alumni Running</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-display text-xl font-semibold text-primary mb-6 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold" /> Official Candidates
                </h3>
                <div className="grid gap-6">
                  {candidates.map((c) => (
                    <div key={c.id} className={`rounded-3xl border transition-all p-6 flex flex-col md:flex-row gap-6 ${myVote === c.id ? "bg-primary/5 border-primary shadow-elegant ring-1 ring-primary/20" : "bg-card border-border/60 shadow-card hover:border-primary/40"}`}>
                      <div className="flex-shrink-0 text-center md:text-left">
                        {c.profiles?.avatar_url || c.image_url ? (
                          <img src={c.profiles?.avatar_url || c.image_url || ""} className="w-20 h-20 rounded-2xl object-cover mx-auto md:mx-0 border-2 border-primary/10 shadow-lg" alt="" />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-muted grid place-items-center text-2xl font-bold text-primary mx-auto md:mx-0 border-2 border-primary/10 shadow-lg">
                            {(c.profiles?.display_name || c.name || "C")[0]}
                          </div>
                        )}
                        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-wider">
                          <Check className="w-3 h-3" /> Certified
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-semibold text-xl text-primary">{c.profiles?.display_name || c.name}</h4>
                        <p className="text-xs text-muted-foreground uppercase font-medium tracking-widest mb-3">{c.position || c.profiles?.department || "COOU Faculty"}</p>
                        <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
                          "{c.manifesto || "My vision is to build a stronger and more connected alumni community through transparency and digital innovation."}"
                        </p>
                      </div>

                      <div className="flex flex-col justify-center items-center md:items-end gap-3 flex-shrink-0">
                        {activeElection.status === 'closed' && (
                          <div className="text-center md:text-right px-4 py-2 rounded-2xl bg-muted/50 border border-border/40">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground">Votes Received</div>
                            <div className="text-2xl font-display font-bold text-primary">{c.votes_count ?? 0}</div>
                          </div>
                        )}
                        
                        <Button
                          disabled={!!votingFor || !!myVote || activeElection.status !== 'active'}
                          onClick={() => handleVote(c.id)}
                          variant={myVote === c.id ? "hero" : "outline"}
                          className={`rounded-2xl h-14 px-8 min-w-[140px] transition-all ${myVote === c.id ? "bg-primary text-white scale-105" : "hover:border-primary hover:text-primary"}`}
                        >
                          {votingFor === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : myVote === c.id ? <><Check className="w-4 h-4 mr-2" /> Voted</> : <><Vote className="w-4 h-4 mr-2" /> Cast Vote</>}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl bg-gold/5 border border-gold/20 p-6 shadow-sm">
                <h4 className="font-semibold text-primary flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-gold" /> Voting Policy
                </h4>
                <ul className="text-xs text-muted-foreground space-y-3 leading-relaxed">
                  <li className="flex gap-2"><span className="text-gold">•</span> You must be a verified alumnus to participate in any association election.</li>
                  <li className="flex gap-2"><span className="text-gold">•</span> Each member is strictly limited to one vote per election track.</li>
                  <li className="flex gap-2"><span className="text-gold">•</span> Once a vote is cast, it is encrypted and cannot be altered or retracted.</li>
                  <li className="flex gap-2"><span className="text-gold">•</span> Tampering with the voting process is grounds for immediate suspension from the platform.</li>
                </ul>
              </div>

              <div className="rounded-3xl bg-primary/5 border border-primary/10 p-6 shadow-sm">
                <h4 className="font-semibold text-primary mb-2">Need Help?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If you encounter any issues with the voting system, please contact the Electoral Committee or technical support immediately.
                </p>
                <Button variant="link" className="text-xs p-0 h-auto mt-2 text-primary font-bold">Contact Support →</Button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default VotingPage;
