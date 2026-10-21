ALTER TABLE public.media_items ADD COLUMN cast_names text, ADD COLUMN watch_platform text;
ALTER TABLE public.monthly_entries ADD COLUMN watch_platform text;
UPDATE public.media_items SET cast_names = creator WHERE track = 'watch' AND external_id LIKE 'imdb:%';
COMMENT ON COLUMN public.media_items.cast_names IS 'Actor names only; never a streaming service or network.';
COMMENT ON COLUMN public.media_items.watch_platform IS 'User-selected default watch platform for future monthly entries.';
COMMENT ON COLUMN public.monthly_entries.watch_platform IS 'User-selected platform for this viewing; independent across months.';