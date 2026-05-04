import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, ArrowRight, ShieldCheck, ListChecks, Users } from "lucide-react";
import coouLogo from "@/assets/coou-logo.png";

const WelcomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Welcome to COOU Alumni Connect";
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-cream py-12 px-4 md:px-6 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-card rounded-3xl border border-border/60 shadow-elegant p-8 md:p-12">
        <div className="text-center mb-10">
          <img src={coouLogo} alt="COOU" className="w-20 h-20 mx-auto mb-6 object-contain drop-shadow-sm" />
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-primary">Welcome to the Network</h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-xl mx-auto">
            You're successfully registered! To ensure the integrity of our community, all alumni must complete their profile and be verified.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6 rounded-2xl bg-muted/40 border border-border/40">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <ListChecks className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-primary mb-2">1. Fill Biodata</h3>
            <p className="text-sm text-muted-foreground">Add your graduation details, matric number, and contact info.</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-muted/40 border border-border/40">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-primary mb-2">2. Get Verified</h3>
            <p className="text-sm text-muted-foreground">Upload your degree or certificate. An admin will review your profile.</p>
          </div>
          <div className="text-center p-6 rounded-2xl bg-muted/40 border border-border/40">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-primary mb-2">3. Join Directory</h3>
            <p className="text-sm text-muted-foreground">Once approved, you'll appear in the global directory and get a unique ID.</p>
          </div>
        </div>

        <div className="bg-gold/10 border border-gold/20 rounded-2xl p-6 mb-10 flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-primary">Why do we verify?</h4>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              We strictly moderate the platform to protect our alumni community from spam and impostors. Only fully verified and approved users can browse the directory, access premium support features, or vote in elections.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button size="lg" variant="hero" className="rounded-full px-8" asChild>
            <Link to="/dashboard">
              Proceed to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
