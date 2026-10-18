import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Film, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import watchHero from "@/assets/watch-hero.jpg";
import readHero from "@/assets/read-hero.jpg";

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
    <div className="grid min-h-screen md:grid-cols-2">
      <section className="theme-watch relative flex min-h-[50vh] items-end overflow-hidden bg-background p-8 text-foreground">
        <img src={watchHero} alt="Film reel and popcorn" width={1600} height={704} className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-fade" />
        <div className="relative fade-up">
          <Film className="h-8 w-8 text-primary" />
          <h2 className="font-display text-6xl">Watch Track</h2>
          <p className="text-muted-foreground">Movies, shows, series & documentaries.</p>
        </div>
      </section>
      <section className="theme-read relative flex min-h-[50vh] items-end overflow-hidden bg-background p-8 text-foreground">
        <img src={readHero} alt="Cozy bookshelf" width={1600} height={704} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-fade" />
        <div className="relative fade-up">
          <BookOpen className="h-8 w-8 text-primary" />
          <h2 className="font-display text-6xl font-semibold">Read Track</h2>
          <p className="text-muted-foreground">Every book, every month, every thought.</p>
        </div>
      </section>
      <div className="pointer-events-none fixed inset-x-0 top-0 flex justify-center p-6">
        <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border bg-card/90 px-6 py-4 shadow-card backdrop-blur">
          <h1 className="font-display text-4xl text-foreground">My Media <span className="text-primary">Journal</span></h1>
          <Link to="/auth" className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            Open my journal
          </Link>
        </div>
      </div>
    </div>
  );
}
