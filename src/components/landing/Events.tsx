import { Calendar, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

const events = [
  { date: "Nov 14", title: "Class of 2015 — 10 Year Reunion", location: "Campus · Main Hall", type: "In-person", tag: "Reunion" },
  { date: "Nov 22", title: "AI in Finance — Alumni Panel", location: "Virtual · Zoom", type: "Virtual", tag: "Panel" },
  { date: "Dec 03", title: "Year-End Mentor Mixer", location: "London · The Ned", type: "In-person", tag: "Networking" },
];

export const Events = () => {
  return (
    <section id="events" className="py-24 lg:py-32 bg-gradient-cream">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-4">Upcoming</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-primary leading-tight">
              Events worth showing up for.
            </h2>
          </div>
          <Button variant="outline" className="border-primary/20 self-start md:self-end">View all events</Button>
        </div>

        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.title} className="group flex flex-col md:flex-row md:items-center gap-5 rounded-2xl border border-border/60 bg-card p-5 hover:shadow-card hover:border-primary/30 transition-all duration-300">
              <div className="flex items-center gap-4 md:w-48">
                <div className="w-16 h-16 rounded-xl bg-gradient-hero text-primary-foreground grid place-items-center flex-shrink-0">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-widest text-gold">{e.date.split(" ")[0]}</div>
                    <div className="font-display text-xl font-semibold">{e.date.split(" ")[1]}</div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gold/15 text-primary font-medium">{e.tag}</span>
              </div>

              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-primary">{e.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    {e.type === "Virtual" ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    {e.location}
                  </span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />2026</span>
                </div>
              </div>

              <Button variant="hero" size="sm">RSVP</Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
