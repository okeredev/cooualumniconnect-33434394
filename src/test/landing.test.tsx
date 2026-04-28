import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Hero } from "@/components/landing/Hero";
import { CTA } from "@/components/landing/CTA";
import { Navbar } from "@/components/landing/Navbar";

// Mock supabase client to avoid network calls
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }), getSession: () => Promise.resolve({ data: { session: null } }) },
    from: () => ({ select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [] }) }) }) }),
  },
}));

describe("Landing page smoke tests", () => {
  it("Hero renders headline and primary CTAs link to auth/directory", () => {
    render(<MemoryRouter><Hero /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    const join = screen.getByRole("link", { name: /join the coou alumni network/i });
    expect(join).toHaveAttribute("href", "/auth");
    const explore = screen.getByRole("link", { name: /explore alumni directory/i });
    expect(explore).toHaveAttribute("href", "/directory");
  });

  it("CTA links Create profile to /auth and Institutions to mailto", () => {
    render(<MemoryRouter><CTA /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /create your alumni profile/i })).toHaveAttribute("href", "/auth");
    expect(screen.getByRole("link", { name: /institutional partnerships/i })).toHaveAttribute("href", expect.stringContaining("mailto:"));
  });

  it("Navbar Sign in routes to /auth and Open dashboard to /dashboard", () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    const signIn = screen.getAllByRole("link", { name: /sign in/i })[0];
    expect(signIn).toHaveAttribute("href", "/auth");
    expect(screen.getByRole("link", { name: /open dashboard/i })).toHaveAttribute("href", "/dashboard");
  });
});
