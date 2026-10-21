import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import watchHero from "@/assets/watch-collage.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — My Media Journal" },
      { name: "description", content: "Sign in to your private film, TV and reading journal." },
      { property: "og:title", content: "Sign in — My Media Journal" },
      { property: "og:description", content: "Sign in to your private film, TV and reading journal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && nav({ to: "/home" }));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => s && nav({ to: "/home" }));
    return () => data.subscription.unsubscribe();
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin + "/home" },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="theme-watch relative flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <img src={watchHero} alt="" width={1600} height={800} className="absolute inset-0 h-full w-full object-cover" />
      <div className="fade-up taped paper-surface relative w-full max-w-sm rounded-lg border bg-card p-6 shadow-card">
        <h1 className="font-display text-4xl">My Media <span className="text-primary">Journal</span></h1>
        <p className="mt-1 text-sm text-muted-foreground">Your private log of everything you watch and read.</p>
        {sent ? (
          <p className="mt-6 rounded-md bg-secondary p-4 text-sm">Check your email to confirm your account, then come back and sign in.</p>
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {mode === "in" ? "Sign in" : "Create account"}
              </Button>
            </form>
            <Button variant="secondary" className="mt-3 w-full" onClick={google}>Continue with Google</Button>
            <Button variant="link" className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
