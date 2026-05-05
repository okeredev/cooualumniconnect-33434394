import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GraduationCap, Heart, BookOpen, ShieldCheck, ArrowRight, Loader2, Info,
  Wallet, Truck, Briefcase, Users, Zap, Building2, Monitor, Award,
  Sparkles, CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Campaign = {
  id: string;
  title: string;
  description: string;
  category: string;
  target_amount: number | null;
  current_amount: number;
  active: boolean;
};

const SUPPORT_CATEGORIES = [
  {
    id: "financial",
    title: "Direct Financial Support",
    icon: Wallet,
    color: "emerald",
    items: [
      { name: "Tuition Fee Scholarships", desc: "Full/partial sponsorship for indigent or high-performing students." },
      { name: "Rent Assistance Fund", desc: "Monthly stipends or lump-sum grants for accommodation." },
      { name: "Feeding Grants", desc: "Meal tickets or monthly stipends via school cafeteria partnerships." },
      { name: "Emergency Relief Pool", desc: "Quick-access fund for medical bills or sudden financial crises." }
    ]
  },
  {
    id: "academic",
    title: "Academic & Research Support",
    icon: BookOpen,
    color: "blue",
    items: [
      { name: "Book & Materials Bank", desc: "Donate textbooks, lab coats, or fund a 'course pack subsidy'." },
      { name: "Research Grants", desc: "Small grants ₦20k-₦100k for final year projects and fieldwork." },
      { name: "Journal/Software Access", desc: "Pay for access to paid journals, Turnitin, SPSS, or AutoCAD." },
      { name: "Project Supervision", desc: "Alumni in industry/academia co-supervise projects or provide data." }
    ]
  },
  {
    id: "logistics",
    title: "Logistics & Welfare",
    icon: Truck,
    color: "amber",
    items: [
      { name: "Transport Subsidy", desc: "Monthly bus fares or transport allowance for commuting students." },
      { name: "Laptop/Device Loans", desc: "Revolving scheme where alumni donate laptops/tablets for loans." },
      { name: "Hostel Adoption", desc: "Renovate hostel blocks, improve water/electricity, and maintenance." },
      { name: "Internship Housing", desc: "Free/cheap accommodation for students on IT/SIWES in major cities." }
    ]
  },
  {
    id: "career",
    title: "Career & Skills Support",
    icon: Briefcase,
    color: "indigo",
    items: [
      { name: "Paid Internships", desc: "Create slots in your company specifically for COOU students." },
      { name: "Skill Sponsorships", desc: "Fund certifications like PMP, ICAN, NIPR or digital skills." },
      { name: "CV Clinics & Mock Interviews", desc: "Assist in physical or virtual sessions to prepare students." }
    ]
  },
  {
    id: "structured",
    title: "Structured Programs",
    icon: Sparkles,
    color: "gold",
    items: [
      { name: "Adopt-A-Student", desc: "One alumnus covers one student’s tuition + basic welfare for 4 years." },
      { name: "Class Set Legacy Project", desc: "Funding for high-impact items: solar for library, buses, or buildings." },
      { name: "Work-Study Scheme", desc: "Alumni businesses hire students for 10hrs/week paid roles." },
      { name: "Periodic Welfare Drive", desc: "COOU Alumni Giving Events targeting feeding, books, and rent." }
    ]
  }
];

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
      <div className="min-h-screen pb-20">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.1),transparent_50%)]" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in">
                <ShieldCheck className="w-4 h-4" /> Investing in the Future of COOU
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold text-primary mb-6 leading-tight tracking-tight">
                Student Support <span className="text-gold italic">Initiatives</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Empowering the next generation of COOU graduates through direct financial aid, academic resources, and career development programs driven by alumni excellence.
              </p>
            </div>
          </div>
        </section>

        {/* Support Framework Grid */}
        <section className="container mb-24">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="lg:col-span-2 mb-4">
              <h2 className="font-display text-3xl font-semibold text-primary">Strategic Support Framework</h2>
              <p className="text-muted-foreground mt-2">Comprehensive avenues through which alumni can make a lasting impact.</p>
            </div>
            
            {SUPPORT_CATEGORIES.map((cat, idx) => (
              <div key={cat.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-card to-muted/30 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative h-full p-8 rounded-[2rem] bg-card border border-border/60 shadow-elegant hover:border-gold/30 transition-all duration-300">
                  <div className="flex items-start gap-5 mb-8">
                    <div className={`w-16 h-16 rounded-2xl bg-${cat.color}-500/10 text-${cat.color}-600 grid place-items-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                      <cat.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-bold text-primary group-hover:text-gold transition-colors">{cat.title}</h3>
                      <div className="h-1.5 w-12 bg-gold/30 rounded-full mt-2" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {cat.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors group/item">
                        <div className="w-6 h-6 rounded-full bg-gold/10 text-gold grid place-items-center flex-shrink-0 mt-0.5 group-hover/item:bg-gold group-hover/item:text-white transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary text-sm group-hover/item:text-gold transition-colors">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Special Call to Action Card */}
            <div className="lg:col-span-2 p-10 rounded-[2.5rem] bg-primary text-primary-foreground relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/20 blur-[100px] -mr-32 -mt-32 rounded-full" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 blur-[100px] -ml-32 -mb-32 rounded-full" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-xl text-center md:text-left">
                  <h3 className="font-display text-3xl font-bold mb-4">Set up a Structured Program</h3>
                  <p className="text-primary-foreground/80 text-lg leading-relaxed">
                    Interested in starting a Class Set Legacy project or an Adopt-A-Student scheme? Our team is ready to help you structure your impact.
                  </p>
                </div>
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-primary font-bold rounded-2xl px-10 h-16 text-lg shadow-xl hover:scale-105 transition-all">
                  Contact Alumni Office <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Campaigns Section */}
        <section className="container">
          <div className="mb-12">
            <h2 className="font-display text-3xl font-semibold text-primary">Active Funding Needs</h2>
            <p className="text-muted-foreground mt-2">Contribute to specific ongoing campaigns that require immediate support.</p>
          </div>

          <Tabs defaultValue="student_support" className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-10 h-14 p-1 rounded-2xl bg-muted/50 border border-border/40">
              <TabsTrigger value="student_support" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-elegant data-[state=active]:text-primary transition-all font-medium">Student</TabsTrigger>
              <TabsTrigger value="academic_research" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-elegant data-[state=active]:text-primary transition-all font-medium">Academic</TabsTrigger>
              <TabsTrigger value="welfare" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-elegant data-[state=active]:text-primary transition-all font-medium">Welfare</TabsTrigger>
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
      </div>
    </AppShell>
  );
};

export default SupportPage;

