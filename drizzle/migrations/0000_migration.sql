CREATE TABLE public.media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  track text NOT NULL CHECK (track IN ('watch','read')),
  external_id text,
  title text NOT NULL,
  creator text,
  cover_url text,
  year int,
  media_type text NOT NULL DEFAULT 'movie',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX media_items_unique_ext ON public.media_items(user_id, track, external_id) WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX media_items_unique_manual ON public.media_items(user_id, track, lower(title), coalesce(year,0)) WHERE external_id IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_items TO authenticated;
GRANT ALL ON public.media_items TO service_role;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own items" ON public.media_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.monthly_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  media_id uuid NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  completed boolean NOT NULL DEFAULT false,
  completed_at date,
  rating int CHECK (rating BETWEEN 1 AND 10),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_id, year, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_entries TO authenticated;
GRANT ALL ON public.monthly_entries TO service_role;
ALTER TABLE public.monthly_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entries" ON public.monthly_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.media_items m WHERE m.id = media_id AND m.user_id = auth.uid()));