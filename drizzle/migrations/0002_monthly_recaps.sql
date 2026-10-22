CREATE TABLE public.monthly_recaps (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 year integer NOT NULL CHECK (year BETWEEN 1900 AND 2200),
 month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
 fingerprint text NOT NULL,
 remark text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (user_id, year, month)
);
GRANT SELECT ON public.monthly_recaps TO authenticated;
GRANT ALL ON public.monthly_recaps TO service_role;
ALTER TABLE public.monthly_recaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own recaps" ON public.monthly_recaps FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.recap_ai_state (
 user_id uuid PRIMARY KEY,
 blocked_message text NOT NULL,
 status integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recap_ai_state TO authenticated;
GRANT ALL ON public.recap_ai_state TO service_role;
ALTER TABLE public.recap_ai_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own AI state" ON public.recap_ai_state FOR SELECT TO authenticated USING (user_id = auth.uid());