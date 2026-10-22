<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- One `media_items` row per user+title (dedup via external_id or title+year); monthly lists are `monthly_entries` rows referencing it — master "completed" status is derived from entries (`masterStatus` in src/lib/media.ts), never stored, so lists cannot drift.
- Ratings/remarks/completion date live on the monthly entry (the completion record), so re-watches keep separate reviews.
- Actor metadata belongs in media_items.cast_names; user-selected platforms belong on each monthly entry, with a master-item default for titles saved without a month, so original networks never masquerade as viewing choices.
- Metadata search runs in an authenticated server function (src/lib/search.functions.ts); uses TMDB/Google Books keys from server env if present, otherwise keyless fallbacks — keys never reach the browser.
- App pages live under `_authenticated/`; data reads go through the browser client with owner-only RLS.
- Journal visual themes share global semantic paper-and-ink tokens and reusable handmade utilities; route artwork uses bundled assets so private data flows remain unchanged by presentation updates.
- Recaps group completed entries by completion date (list month only when undated); metrics are deterministic and AI remarks use server-fetched owner-only journal data, so generated text cannot alter counts.
- AI recap output is cached server-side per user/month and journal fingerprint; clients have read-only access, and provider denial state persists server-side to prevent repeat blocked calls.
