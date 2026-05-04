import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Heart, BookOpen, ShieldCheck, ArrowRight, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Campaign = {
  id: string;
  title: string;
  description: string;
  category: "student_support" | "academic_research" | "welfare";
  target_amount: number;
  current_amount: number;
  active: boolean;
};

const SupportPage = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [pledging, setPledging] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Student Support Initiatives — COOU Alumni Connect";
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("support_campaigns").select("*").eq("active", true);
    if (error) toast.error("Failed to load initiatives");
    else setCampaigns(data || []);
    setLoading(false);
  };

  const handlePledge = async (campaignId: string, amount: number) => {
    if (!user) { toast.error("Please sign in to pledge"); return; }
    setPledging(campaignId);
    const { error } = await supabase.from("support_pledges").insert({
      campaign_id: campaignId,
      user_id: user.id,
      amount,
      status: "pending"
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Thank you for your pledge! We will contact you with fulfillment details.");
      loadCampaigns();
    }
    setPledging(null);
  };

  const renderTrack = (category: string, icon: any, color: string) => {
    const items = campaigns.filter(c => c.category === category);
    const Icon = icon;

    return (
      <div className="space-y-6">
        <div className={`p-6 rounded-3xl bg-${color}/10 border border-${color}/20 flex items-start gap-4`}>
          <div className={`w-12 h-12 rounded-2xl bg-${color} text-white grid place-items-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-xl text-primary capitalize">{category.replace("_", " & ")} Support</h3>
            <p className="text-muted-foreground mt-1">Direct impact initiatives to empower our students and academic community.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {items.map((c) => {
            const progress = (c.current_amount / c.target_amount) * 100;
            return (
              <div key={c.id} className="rounded-3xl bg-card border border-border/60 p-6 shadow-card hover:shadow-elegant transition-all group">
                <h4 className="font-display font-semibold text-lg text-primary group-hover:text-gold transition-colors">{c.title}</h4>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{c.description}</p>
                
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-primary">Progress</span>
                    <span className="text-muted-foreground">{progress.toFixed(1)}% of ₦{c.target_amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full bg-${color} transition-all duration-1000`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[5000, 10000, 25000].map((amt) => (
                    <Button key={amt} size="sm" variant="outline" className="rounded-full" disabled={!!pledging} onClick={() => handlePledge(c.id, amt)}>
                      {pledging === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : `₦${amt.toLocaleString()}`}
                    </Button>
                  ))}
                  <Button size="sm" variant="hero" className="rounded-full ml-auto" onClick={() => toast.info("Custom amount feature coming soon!")}>
                    Custom Amount <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl border-border/40">
              <Info className="w-8 h-8 mx-auto text-muted-foreground mb-3 opacity-20" />
              <p className="text-muted-foreground">No active initiatives in this track at the moment.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <section className="container py-10">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Giving Back to COOU
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-primary">Student Support Initiatives</h1>
          <p className="text-muted-foreground mt-4 text-lg">Your contributions directly fund student scholarships, research grants, and welfare programs within our Alma Mater.</p>
        </div>

        <Tabs defaultValue="student_support" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-10 h-14 p-1 rounded-2xl bg-muted/50">
            <TabsTrigger value="student_support" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-elegant transition-all">Student</TabsTrigger>
            <TabsTrigger value="academic_research" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-elegant transition-all">Academic</TabsTrigger>
            <TabsTrigger value="welfare" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-elegant transition-all">Welfare</TabsTrigger>
          </TabsList>

          <TabsContent value="student_support">
            {renderTrack("student_support", GraduationCap, "primary")}
          </TabsContent>
          <TabsContent value="academic_research">
            {renderTrack("academic_research", BookOpen, "gold")}
          </TabsContent>
          <TabsContent value="welfare">
            {renderTrack("welfare", Heart, "red-500")}
          </TabsContent>
        </Tabs>
      </section>
    </AppShell>
  );
};

export default SupportPage;
