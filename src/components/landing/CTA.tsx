import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const CTA = () => {
  return (
    <section id="give" className="py-24 lg:py-32">
      <div className="container">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-hero p-12 md:p-20 text-center grain">
          <div className="absolute inset-0 bg-gradient-radial opacity-40" />
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gold/20 blur-3xl" />

          <div className="relative max-w-2xl mx-auto">
            <div className="inline-block text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-5">Join AluminAI</div>
            <h2 className="font-display text-4xl md:text-6xl font-semibold text-primary-foreground leading-[1.05] text-balance">
              Your network is waiting on the other side.
            </h2>
            <p className="mt-6 text-lg text-primary-foreground/70 max-w-xl mx-auto">
              Free to join for verified alumni and current students. Premium tools available for institutions.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button variant="gold" size="lg" className="text-base">
                Create your profile <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="glass" size="lg" className="text-base">
                For institutions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
