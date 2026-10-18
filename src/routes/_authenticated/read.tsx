import { createFileRoute } from "@tanstack/react-router";
import { TrackPage, itemsQuery } from "@/components/journal/TrackPage";
import hero from "@/assets/read-hero.jpg";

export const Route = createFileRoute("/_authenticated/read")({
  head: () => ({
    meta: [
      { title: "Read Track — My Media Journal" },
      { name: "description", content: "Your books and reading journal, month by month." },
      { property: "og:title", content: "Read Track — My Media Journal" },
      { property: "og:description", content: "Your books and reading journal, month by month." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(itemsQuery("read")),
  component: () => <TrackPage track="read" hero={hero} />,
});
