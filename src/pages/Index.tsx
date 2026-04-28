import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Stats } from "@/components/landing/Stats";
import { AlumniPreview } from "@/components/landing/AlumniPreview";
import { Events } from "@/components/landing/Events";
import { Testimonial } from "@/components/landing/Testimonial";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "COOU Alumni Connect — Chukwuemeka Odumegwu Ojukwu University";
    const meta = document.querySelector('meta[name="description"]') || (() => {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
      return m;
    })();
    meta.setAttribute("content", "COOU Alumni Connect — the official alumni networking, mentorship and career platform of Chukwuemeka Odumegwu Ojukwu University.");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <AlumniPreview />
        <Events />
        <Testimonial />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
