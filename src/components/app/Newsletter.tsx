import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    
    if (error) {
      if (error.code === "23505") {
        toast.info("You're already subscribed!");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Subscribed! Stay tuned for alumni updates.");
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 relative overflow-hidden grain">
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
      
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm grid place-items-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-gold" />
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">Stay Connected with COOU</h2>
        <p className="text-primary-foreground/70 mb-8 text-lg">
          Subscribe to our monthly newsletter for campus news, alumni spotlights, career opportunities, and event invitations.
        </p>
        
        <form onSubmit={subscribe} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/40" />
            <Input
              type="email"
              placeholder="Your email address"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-14 pl-11 rounded-2xl focus:bg-white/20 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" variant="hero" className="h-14 rounded-2xl px-8 shadow-lg" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Subscribe</>}
          </Button>
        </form>
        <p className="mt-6 text-xs text-primary-foreground/50 italic">
          By subscribing, you agree to receive alumni-related communications. You can unsubscribe at any time.
        </p>
      </div>
    </div>
  );
};
