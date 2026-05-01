import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Compass, Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/directory", label: "Alumni Directory" },
  { to: "/jobs", label: "Career Board" },
  { to: "/events", label: "Events" },
  { to: "/resources", label: "Resources" },
];

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
          <Compass className="h-10 w-10" aria-hidden="true" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Error 404
        </p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          This page wandered off
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
          We couldn't find{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
            {location.pathname}
          </code>
          . It may have been moved, renamed, or never existed.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to Home
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Go Back
          </Button>
        </div>

        <div className="mt-12">
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <Search className="h-4 w-4" aria-hidden="true" />
            Try one of these instead
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
