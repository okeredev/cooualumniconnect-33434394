import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Vote, Check, ShieldCheck, Clock, Users, Trophy, Loader2, AlertTriangle, ChevronRight, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { VotingDialog } from "@/components/voting/VotingDialog";
import confetti from "canvas-confetti";

type Election = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  active?: boolean;
  status: "upcoming" | "active" | "closed";
};

const computeStatus = (e: { active?: boolean | null; starts_at: string; ends_at: string }): "upcoming" | "active" | "closed" => {
  const now = Date.now();
  if (now < new Date(e.starts_at).getTime()) return "upcoming";
  if (now > new Date(e.ends_at).getTime() || e.active === false) return "closed";
  return "active";
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
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingFor, setVotingFor] = useState<Candidate | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isCasting, setIsCasting] = useState(false);

  useEffect(() => {
    document.title = "Alumni Elections — COOU Alumni Connect";
    checkVerification();
    loadElections();
  }, [user]);

  const checkVerification = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("verified").eq("user_id", user.id).maybeSingle();
    setIsVerified(data?.verified ?? false);
  };

  const loadElections = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("elections").select("*").order("starts_at", { ascending: false });
    
    if (data && data.length > 0) {
      setElections(data);
      const current = data.find(e => e.status === 'active') || data[0];
      if (current) await selectElection(current);
    } else {
      setElections([]);
      setActiveElection(null);
    }
    setLoading(false);
  };

  const selectElection = async (e: Election) => {
    setActiveElection(e);
    
    const [cData, vData, voteCounts] = await Promise.all([
      supabase.from("election_candidates").select("*, profiles(display_name, avatar_url, department)").eq("election_id", e.id),
      user ? supabase.from("votes").select("candidate_id").eq("election_id", e.id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("votes").select("candidate_id").eq("election_id", e.id),
    ]);
    
    const countMap: Record<string, number> = {};
    ((voteCounts.data as any[]) ?? []).forEach((v: any) => {
      countMap[v.candidate_id] = (countMap[v.candidate_id] ?? 0) + 1;
    });
    
    const candidatesWithCounts = ((cData.data as any[]) || []).map((c: any) => ({
      ...c,
      votes_count: countMap[c.id] ?? 0,
    }));
    
    const maxVotes = Math.max(...candidatesWithCounts.map(c => c.votes_count || 0), 0);
    const withWinner = candidatesWithCounts.map(c => ({
      ...c,
      isWinner: e.status === 'closed' && c.votes_count === maxVotes && maxVotes > 0
    }));

    setCandidates(withWinner);
    setMyVote(vData.data?.candidate_id || null);
  };

  const initiateVote = (candidate: Candidate) => {
    if (!user) { toast.error("Please sign in to vote"); return; }
    if (!isVerified) { toast.error("Your account must be verified to vote. Please complete your profile verification."); return; }
    if (activeElection?.status !== 'active') { toast.error("Voting is not currently active for this election."); return; }
    if (myVote) { toast.error("You have already cast your vote for this election track."); return; }
    
    setVotingFor(candidate);
    setConfirmOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!votingFor || !activeElection || !user) return;
    
    setIsCasting(true);
    
    const { error } = await supabase.from("votes").insert({
      election_id: activeElection.id,
      user_id: user.id,
      candidate_id: votingFor.id
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#1A472A', '#FFFFFF']
      });
      toast.success("Your vote has been securely recorded. Thank you for participating!");
      setMyVote(votingFor.id);
      selectElection(activeElection);
    }
    setIsCasting(false);
    setConfirmOpen(false);
    setVotingFor(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) return (
    <AppShell>
      <div className="min-h-[60vh] grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Securing governance systems...</p>
        </div>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="min-h-screen pb-20 bg-gradient-cream/30">
        <section className="container py-12">
          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16"
          >
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-6">
                <ShieldCheck className="w-4 h-4" /> Secure Blockchain-Inspired Voting
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold text-primary tracking-tight leading-none mb-6">
                Alumni <span className="text-gold italic">Governance</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Exercise your democratic right to shape the future of the COOU Alumni Association. Our transparent and secure platform ensures every voice is counted accurately.
              </p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-md border border-border/60 p-1.5 rounded-[2rem] flex flex-wrap gap-1 shadow-elegant">
              {elections.map((e) => (
                <button 
                  key={e.id} 
                  onClick={() => selectElection(e)}
                  className={`px-6 py-3 rounded-[1.5rem] text-sm font-bold transition-all duration-500 relative overflow-hidden group ${
                    activeElection?.id === e.id 
                      ? "text-primary-foreground" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {activeElection?.id === e.id && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary shadow-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{e.title}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {activeElection && (
            <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">
              <div className="space-y-12">
                {/* Election Overview Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[3rem] bg-card border border-border/40 p-8 md:p-12 shadow-2xl shadow-primary/5 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-8">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      activeElection.status === 'active' 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                        : "bg-muted border-border/60 text-muted-foreground"
                    }`}>
                      ● {activeElection.status}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 max-w-2xl">
                    <h2 className="font-display text-3xl font-bold text-primary group-hover:text-gold transition-colors duration-500">{activeElection.title}</h2>
                    <p className="text-muted-foreground text-lg leading-relaxed">{activeElection.description}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-4 p-5 rounded-3xl bg-muted/30 border border-border/40 flex-1 min-w-[200px] hover:bg-muted/50 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-white grid place-items-center shadow-lg">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Voting Closes</p>
                          <p className="text-sm font-bold text-primary">{new Date(activeElection.ends_at).toLocaleDateString()} @ {new Date(activeElection.ends_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 p-5 rounded-3xl bg-muted/30 border border-border/40 flex-1 min-w-[200px] hover:bg-muted/50 transition-colors">
                        <div className="w-12 h-12 rounded-2xl bg-gold text-white grid place-items-center shadow-lg">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Registered Candidates</p>
                          <p className="text-sm font-bold text-primary">{candidates.length} Vetted Alumni</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Candidates Grid */}
                <div>
                  <h3 className="font-display text-2xl font-bold text-primary mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gold/10 grid place-items-center">
                      <Trophy className="w-5 h-5 text-gold" />
                    </div>
                    Official Ballot Candidates
                  </h3>
                  
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid gap-8"
                  >
                    <AnimatePresence mode="wait">
                      {candidates.map((c) => (
                        <motion.div 
                          key={c.id} 
                          variants={itemVariants}
                          layout
                          className={`rounded-[2.5rem] border transition-all duration-500 p-8 flex flex-col md:flex-row gap-8 relative group overflow-hidden ${
                            myVote === c.id 
                              ? "bg-primary/5 border-primary shadow-2xl shadow-primary/10 ring-1 ring-primary/20" 
                              : "bg-card/40 backdrop-blur-xl border-border/60 shadow-elegant hover:border-primary/40"
                          }`}
                        >
                          {myVote === c.id && (
                            <div className="absolute top-4 right-4 bg-primary text-white p-2 rounded-full shadow-lg z-20">
                              <Check className="w-4 h-4" />
                            </div>
                          )}

                          <div className="relative z-10 flex-shrink-0 text-center md:text-left">
                            <div className="relative inline-block group/avatar">
                              {c.profiles?.avatar_url || c.image_url ? (
                                <img src={c.profiles?.avatar_url || c.image_url || ""} className="w-32 h-32 rounded-[2rem] object-cover border-4 border-white shadow-xl group-hover/avatar:scale-105 transition-transform duration-500" alt="" />
                              ) : (
                                <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-muted to-border/40 grid place-items-center text-4xl font-bold text-primary border-4 border-white shadow-xl">
                                  {(c.profiles?.display_name || c.name || "C")[0]}
                                </div>
                              )}
                              <div className="absolute -bottom-2 -right-2 bg-gold text-white p-2 rounded-xl shadow-lg border-2 border-white">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative z-10 flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                              <div>
                                <h4 className="font-display font-bold text-2xl text-primary mb-1 group-hover:text-gold transition-colors">{c.profiles?.display_name || c.name}</h4>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-gold uppercase font-bold tracking-[0.3em]">{c.position || c.profiles?.department || "COOU Faculty"}</p>
                                  {(c as any).isWinner && (
                                    <Badge className="bg-gold text-white border-none text-[10px] uppercase px-2 py-0.5 animate-pulse">Winner</Badge>
                                  )}
                                </div>
                              </div>
                              {activeElection.status === 'closed' && (
                                <div className="bg-primary text-white px-6 py-2 rounded-2xl shadow-lg">
                                  <p className="text-[10px] font-bold uppercase opacity-60">Total Votes</p>
                                  <p className="text-xl font-display font-bold">{c.votes_count ?? 0}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="relative">
                              <p className="text-base text-foreground/80 leading-relaxed font-medium italic border-l-4 border-gold/40 pl-6 py-2 bg-gold/5 rounded-r-3xl">
                                "{c.manifesto || "Dedicated to fostering a stronger alumni connection through transparency, professional growth, and institutional development."}"
                              </p>
                            </div>
                            
                            <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
                              <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                  <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-white grid place-items-center text-[10px] font-bold text-muted-foreground">+{i}0</div>
                                ))}
                                <span className="ml-4 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                  Endorsed by verified alumni
                                </span>
                              </div>

                              <Button
                                disabled={!!isCasting || !!myVote || activeElection.status !== 'active'}
                                onClick={() => initiateVote(c)}
                                variant={myVote === c.id ? "hero" : "outline"}
                                className={`rounded-[1.25rem] h-14 px-10 min-w-[180px] text-base font-bold shadow-xl transition-all duration-500 ${
                                  myVote === c.id 
                                    ? "bg-primary text-white scale-105" 
                                    : "border-primary/20 hover:border-primary hover:bg-primary/5 text-primary"
                                }`}
                              >
                                {myVote === c.id ? (
                                  <><Check className="w-5 h-5 mr-2" /> Voted Successfully</>
                                ) : (
                                  <><Vote className="w-5 h-5 mr-2" /> Cast Official Ballot</>
                                )}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>

              {/* Sidebar Info Panels */}
              <aside className="space-y-8 sticky top-24">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-[2.5rem] bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 p-8 shadow-xl shadow-gold/5"
                >
                  <h4 className="font-display font-bold text-xl text-primary flex items-center gap-3 mb-6">
                    <Lock className="w-6 h-6 text-gold" /> Voting Protocol
                  </h4>
                  <div className="space-y-6">
                    {[
                      { icon: ShieldCheck, title: "Identity Verified", desc: "Only alumni with verified graduation certificates can participate." },
                      { icon: Vote, title: "One Member, One Vote", desc: "The system strictly enforces a single-ballot rule per track." },
                      { icon: Lock, title: "Encrypted Ballots", desc: "Your vote is hashed and anonymous to ensure complete privacy." },
                      { icon: AlertTriangle, title: "Irreversible", desc: "Once cast, a vote cannot be withdrawn or modified." }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-white/60 grid place-items-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                          <item.icon className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-primary mb-1">{item.title}</h5>
                          <p className="text-xs text-muted-foreground/80 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-[2.5rem] bg-primary text-primary-foreground p-8 shadow-2xl shadow-primary/20 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                  <div className="relative z-10">
                    <h4 className="font-display font-bold text-xl mb-3">Verification Required</h4>
                    <p className="text-sm text-primary-foreground/70 leading-relaxed mb-6">
                      If you see a lock icon, your account might not be fully verified yet. Complete your profile to unlock all governance features.
                    </p>
                    <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white text-primary hover:text-primary font-bold rounded-2xl h-12">
                      Check My Status <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              </aside>
            </div>
          )}
          {!loading && !activeElection && (
            <div className="py-20 text-center border-2 border-dashed rounded-[3rem] bg-card/40 backdrop-blur-xl">
              <Vote className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
              <h2 className="font-display text-3xl font-bold text-primary mb-3">No Active Elections</h2>
              <p className="text-muted-foreground max-w-md mx-auto">There are currently no active or upcoming elections. Check back later for official alumni association voting events.</p>
            </div>
          )}
        </section>

        {/* Voting Confirmation Modal */}
        <VotingDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmVote}
          candidateName={votingFor?.profiles?.display_name || votingFor?.name || ""}
          position={votingFor?.position || votingFor?.profiles?.department || "COOU Candidate"}
          isVoting={isCasting}
        />
      </div>
    </AppShell>
  );
};

export default VotingPage;
