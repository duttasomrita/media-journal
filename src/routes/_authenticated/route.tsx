import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { Film, BookOpen, Home, Star, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppLayout,
});

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/watch", label: "Watch", icon: Film },
  { to: "/read", label: "Read", icon: BookOpen },
  { to: "/reviews", label: "Reviews", icon: Star },
] as const;

function AppLayout() {
  const { pathname } = useLocation();
  const theme = pathname.startsWith("/read") ? "theme-read" : pathname.startsWith("/watch") ? "theme-watch" : "";
  return (
    <div className={cn("min-h-screen bg-background pb-20 text-foreground transition-colors duration-500 md:pb-0", theme)}>
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/home" className="font-display text-2xl text-foreground">
            My Media <span className="text-primary">Journal</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {n.label === "Watch" ? "Watch Track" : n.label === "Read" ? "Read Track" : n.label === "Reviews" ? "My Reviews" : n.label}
              </Link>
            ))}
          </nav>
            <Button variant="ghost" size="sm"
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-background/95 backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
          >
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
