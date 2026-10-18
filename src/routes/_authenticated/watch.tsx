import { createFileRoute } from "@tanstack/react-router";
import { TrackPage, itemsQuery } from "@/components/journal/TrackPage";
import hero from "@/assets/watch-hero.jpg";

export const Route = createFileRoute("/_authenticated/watch")({
  head: () => ({
    meta: [
      { title: "Watch Track — My Media Journal" },
      { name: "description", content: "Your movies, TV shows, series and documentaries, month by month." },
      { property: "og:title", content: "Watch Track — My Media Journal" },
      { property: "og:description", content: "Your movies, TV shows, series and documentaries, month by month." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(itemsQuery("watch")),
  component: () => <TrackPage track="watch" hero={hero} />,
});
