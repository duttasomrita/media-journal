import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Film, Sparkles, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cover } from "@/components/journal/Cover";
import { supabase } from "@/integrations/supabase/client";
import { fetchCompleted, MONTHS } from "@/lib/media";
import { monthlyRecap, recapFingerprint } from "@/lib/recap";
import { generateRecap } from "@/lib/recap.functions";
import watchArt from "@/assets/watch-collage.jpg";
import readArt from "@/assets/read-collage.jpg";

const entriesQuery = queryOptions({ queryKey: ["completed"], queryFn: fetchCompleted });
const remarksQuery = queryOptions({ queryKey: ["recap-remarks"], queryFn: async () => {
  const { data, error } = await supabase.from("monthly_recaps").select("year, month, remark, fingerprint");
  if (error) throw error;
  return data;
} });

export const Route = createFileRoute("/_authenticated/recap")({
  head: () => ({ meta: [
    { title: "Monthly Recap — My Media Journal" },
    { name: "description", content: "Your month in stories: watching, reading, favorites and a personalized AI reflection." },
    { property: "og:title", content: "Monthly Recap — My Media Journal" },
    { property: "og:description", content: "Celebrate your month in movies, shows and books." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(entriesQuery), context.queryClient.ensureQueryData(remarksQuery)]),
  component: RecapPage,
});

const STEPS = ["Your month", "The favorites", "Your mix", "The verdict"];

function RecapPage() {
  const { data: entries } = useSuspenseQuery(entriesQuery);
  const { data: saved } = useSuspenseQuery(remarksQuery);
  const qc = useQueryClient();
  const generate = useServerFn(generateRecap);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [fresh, setFresh] = useState<{ key: string; fingerprint: string; remark: string } | null>(null);
  const recap = monthlyRecap(entries, year, month);
  const fingerprint = recapFingerprint(recap.finished);
  const key = `${year}-${month}`;
  const cached = saved.find((r) => r.year === year && r.month === month);
  const remark = fresh?.key === key && fresh.fingerprint === fingerprint ? fresh.remark : cached?.fingerprint === fingerprint ? cached.remark : null;
  const years = [...new Set([now.getFullYear(), ...entries.map((e) => e.completed_at ? Number(e.completed_at.slice(0, 4)) : e.year)])].sort((a, b) => b - a);

  async function makeRemark() {
    setBusy(true); setFailure("");
    try {
      const result = await generate({ data: { year, month } });
      if (result.error) setFailure(result.error);
      else if (result.remark && result.fingerprint) {
        setFresh({ key, fingerprint: result.fingerprint, remark: result.remark });
        await qc.invalidateQueries({ queryKey: ["recap-remarks"] });
      }
    } catch (e) { setFailure(e instanceof Error ? e.message : "Your remark could not be generated."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="font-hand text-2xl text-primary">A month worth remembering</p><h1 className="font-display text-4xl sm:text-5xl">Monthly Recap</h1></div>
      <div className="flex gap-2">
        <Select value={String(month)} disabled={busy} onValueChange={(v) => { setMonth(Number(v)); setStep(0); setFailure(""); }}><SelectTrigger className="w-36" aria-label="Recap month"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent></Select>
        <Select value={String(year)} disabled={busy} onValueChange={(v) => { setYear(Number(v)); setStep(0); setFailure(""); }}><SelectTrigger className="w-24" aria-label="Recap year"><SelectValue /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
      </div>
    </header>
    <div className="flex gap-2" aria-label="Recap progress">{STEPS.map((name, i) => <Button key={name} variant="ghost" className={`h-2 flex-1 rounded-none p-0 ${i <= step ? "bg-primary hover:bg-primary" : "bg-muted"}`} aria-label={`Show ${name}`} aria-current={step === i ? "step" : undefined} onClick={() => setStep(i)} />)}</div>
    <section className={`relative isolate min-h-[460px] overflow-hidden border-y ${step === 0 ? "bg-cinema" : step === 1 ? "bg-secondary" : step === 2 ? "bg-library" : "bg-accent"}`} aria-label={STEPS[step]}>
      {step === 0 && <img src={watchArt} alt="Handmade movie tickets and popcorn" className="absolute inset-x-0 bottom-0 -z-10 h-52 w-full object-cover object-right opacity-40" />}
      {step === 3 && <img src={readArt} alt="Handmade books and bookmarks" className="absolute inset-x-0 bottom-0 -z-10 h-40 w-full object-cover opacity-25" />}
      <div key={`${key}-${step}`} className="fade-up flex min-h-[460px] flex-col items-center justify-center px-5 py-10 text-center sm:px-10">
        <p className="mb-4 text-xs font-semibold uppercase">{MONTHS[month - 1]} {year} · {String(step + 1).padStart(2, "0")} / 04</p>
        {step === 0 && <>
          <h2 className="font-display text-3xl sm:text-4xl">Your month in stories.</h2>
          <p className="font-display my-3 text-8xl text-primary sm:text-9xl">{recap.total}</p>
          <p className="font-hand text-3xl">{recap.total ? "stories finished. memories collected." : "The next story is still waiting."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 font-semibold"><span className="flex items-center gap-2"><Film className="h-5 w-5" />{recap.watch.length} watched</span><span className="flex items-center gap-2"><BookOpen className="h-5 w-5" />{recap.read.length} read</span></div>
          {recap.averageRating !== null && <p className="mt-3 text-sm">Your average rating: {recap.averageRating}/10</p>}
        </>}
        {step === 1 && <>
          <Trophy className="mb-3 h-8 w-8 text-primary" /><h2 className="font-display text-3xl sm:text-4xl">These stole the show.</h2>
          {recap.favorites.length ? <div className="mt-6 grid w-full max-w-lg grid-cols-3 gap-3 sm:gap-6">{recap.favorites.map((e, i) => <div key={e.id} className="min-w-0"><p className="font-hand mb-2 text-2xl">#{i + 1}</p><Cover src={e.media_items.cover_url} title={e.media_items.title} track={e.media_items.track} className="w-full" /><p className="mt-2 break-words text-sm font-semibold">{e.media_items.title}</p><p className="mt-1 flex items-center justify-center gap-1 text-sm text-primary"><Star className="h-3 w-3" />{e.rating}/10</p></div>)}</div> : <p className="font-hand mt-8 text-2xl">No rated favorites this month. Yet.</p>}
        </>}
        {step === 2 && <>
          <h2 className="font-display text-3xl sm:text-4xl">Your kind of story night.</h2>
          <div className="my-6 grid grid-cols-2 gap-8 sm:gap-16"><div><Film className="mx-auto h-6 w-6" /><p className="font-display mt-2 text-6xl text-primary">{recap.watch.length}</p><p className="font-hand text-2xl">on screen</p></div><div><BookOpen className="mx-auto h-6 w-6" /><p className="font-display mt-2 text-6xl text-primary">{recap.read.length}</p><p className="font-hand text-2xl">on the page</p></div></div>
          {recap.platforms.length > 0 ? <><p className="text-sm">Your most-used viewing platform</p><p className="font-display mt-2 break-words text-3xl">{recap.platforms[0]?.[0]}</p><p className="mt-3 text-sm text-muted-foreground">{recap.platforms.map(([name, count]) => `${name} · ${count}`).join(" / ")}</p></> : <p className="text-sm text-muted-foreground">No viewing platforms recorded this month.</p>}
        </>}
        {step === 3 && <>
          <Sparkles className="mb-3 h-8 w-8 text-primary" /><h2 className="font-display text-3xl sm:text-4xl">A little story about your stories.</h2><p className="mt-2 text-xs text-muted-foreground">Your AI reflection</p>
          {remark ? <p className="mt-6 max-w-2xl whitespace-pre-wrap text-lg leading-relaxed" aria-live="polite">{remark}</p> : <div className="mt-6 max-w-xl space-y-4"><p className="font-hand text-2xl">{recap.total ? "What a chapter this was." : "Finish a story to start your recap."}</p><Button disabled={busy || !recap.total} onClick={makeRemark}><Sparkles className={`h-4 w-4 ${busy ? "animate-pulse" : ""}`} />{busy ? "Writing your reflection…" : "Generate my AI reflection"}</Button></div>}
          {failure && <p role="alert" className="mt-5 max-w-xl text-sm text-destructive">{failure}</p>}
        </>}
      </div>
    </section>
    <div className="flex items-center justify-between"><Button variant="outline" size="icon" aria-label="Previous recap slide" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft /></Button><p className="font-hand text-2xl">{STEPS[step]}</p><Button variant="outline" size="icon" aria-label={step === 3 ? "Restart recap" : "Next recap slide"} onClick={() => setStep(step === 3 ? 0 : step + 1)}><ArrowRight /></Button></div>
    <section className="border-t pt-6"><h2 className="font-display text-2xl">The month's collection</h2>{recap.total ? <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-7">{recap.finished.map((e) => <div key={e.id} className="min-w-0"><Cover src={e.media_items.cover_url} title={e.media_items.title} track={e.media_items.track} className="w-full" /><p className="mt-2 break-words text-sm font-semibold">{e.media_items.title}</p><p className="text-xs text-muted-foreground">{e.rating ? `${e.rating}/10 · ` : ""}{e.media_items.track === "watch" ? e.watch_platform || "Watched" : "Read"}</p></div>)}</div> : <p className="mt-3 text-muted-foreground">Nothing finished in {MONTHS[month - 1]} {year}.</p>}</section>
  </div>;
}