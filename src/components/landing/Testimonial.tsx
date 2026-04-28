import { Quote } from "lucide-react";

const quotes = [
  {
    text: "COOU Alumni Connect matched me with a mentor who became my co-founder two years later. The platform doesn't just connect — it builds futures.",
    name: "Chiamaka Nnamdi",
    role: "Co-founder, Halcyon Labs · Class of 2018",
  },
  {
    text: "We raised our scholarship goal in three weeks. The donor leaderboard turned giving into a community celebration.",
    name: "Dr. Emeka Nwosu",
    role: "Director of Advancement, COOU",
  },
];

export const Testimonial = () => {
  return (
    <section id="mentorship" className="py-24 lg:py-32">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
          {quotes.map((q, i) => (
            <figure
              key={i}
              className={`rounded-3xl p-8 lg:p-12 relative overflow-hidden ${
                i === 0 ? "bg-gradient-hero text-primary-foreground" : "bg-cream border border-border/60"
              }`}
            >
              <Quote className={`w-10 h-10 mb-6 ${i === 0 ? "text-gold" : "text-primary/30"}`} />
              <blockquote className={`font-display text-xl md:text-2xl leading-snug text-balance ${i === 0 ? "text-primary-foreground" : "text-primary"}`}>
                "{q.text}"
              </blockquote>
              <figcaption className="mt-8">
                <div className={`font-semibold ${i === 0 ? "text-primary-foreground" : "text-primary"}`}>{q.name}</div>
                <div className={`text-sm mt-0.5 ${i === 0 ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{q.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
