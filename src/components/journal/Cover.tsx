import { Film, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Track } from "@/lib/media";

export function Cover({ src, title, track, className }: { src: string | null; title: string; track: Track; className?: string }) {
  if (src)
    return <img src={src} alt={title} loading="lazy" className={cn("aspect-[2/3] rounded-md bg-muted object-cover", className)} />;
  const Icon = track === "watch" ? Film : BookOpen;
  return (
    <div className={cn("flex aspect-[2/3] flex-col items-center justify-center gap-1 rounded-md bg-secondary p-1 text-center text-muted-foreground", className)}>
      <Icon className="h-5 w-5" />
      <span className="line-clamp-3 text-[10px] leading-tight">{title}</span>
    </div>
  );
}
