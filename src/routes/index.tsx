import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Film, BookOpen, ArrowUpRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import watchHero from "@/assets/watch-collage.jpg";
import readHero from "@/assets/read-collage.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Media Journal — track films, shows & books" },
      { name: "description", content: "A personal journal for the movies, TV shows and books you finish each month, with ratings and reviews." },
      { property: "og:title", content: "My Media Journal" },
      { property: "og:description", content: "Track films, shows and books month by month, with ratings and reviews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const nav = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && nav({ to: "/home" }));
  }, [nav]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="paper-surface border-b px-5 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl sm:text-4xl">My Media <span className="text-primary">Journal<span className="font-hand">!</span></span></h1>
          <span className="font-hand flex items-center gap-2 text-xl text-muted-foreground"><Sparkles className="h-4 w-4 text-primary" /> For the love of stories</span>
        </div>
      </header>
      <section className="theme-watch relative overflow-hidden border-b bg-cinema text-foreground">
        <img src={watchHero} alt="Paper-craft popcorn, film and movie tickets" width={1600} height={800} className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-fade" />
        <div className="relative mx-auto flex min-h-[400px] max-w-6xl flex-col justify-center px-5 py-10 sm:min-h-[470px] sm:px-10">
          <div className="fade-up max-w-[62%] sm:max-w-md">
            <p className="font-hand mb-3 text-2xl text-primary sm:text-3xl">Pass the popcorn!</p>
            <Film className="mb-3 h-7 w-7" />
            <h2 className="font-display text-4xl leading-tight sm:text-6xl">Watch Track</h2>
            <p className="mt-3 max-w-xs text-sm sm:text-base">Movies, shows & all those “just one more episode” nights.</p>
            <Button asChild className="mt-6 h-11 px-4"><Link to="/auth">Open my journal <ArrowUpRight /></Link></Button>
          </div>
        </div>
      </section>
      <section className="theme-read relative overflow-hidden border-b bg-library text-foreground">
        <img src={readHero} alt="Paper-craft books, bookmarks and a daisy" loading="lazy" width={1600} height={800} className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-fade" />
        <div className="relative mx-auto flex min-h-[360px] max-w-6xl flex-col justify-center px-5 py-10 sm:min-h-[420px] sm:px-10">
          <div className="max-w-[62%] sm:max-w-md">
            <p className="font-hand mb-3 text-2xl text-primary sm:text-3xl">Just one more chapter…</p>
            <BookOpen className="mb-3 h-7 w-7" />
            <h2 className="font-display text-4xl leading-tight sm:text-6xl">Read Track</h2>
            <p className="mt-3 max-w-xs text-sm sm:text-base">Every book, every month, every thought.</p>
            <Button asChild variant="outline" className="mt-6 h-11"><Link to="/auth">My reading journal <ArrowUpRight /></Link></Button>
          </div>
        </div>
      </section>
      <footer className="paper-surface px-5 py-6 text-center font-hand text-2xl text-muted-foreground">The stories end. The memories stay.</footer>
    </div>
  );
}
