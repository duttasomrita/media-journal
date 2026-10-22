import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { monthlyRecap, recapFingerprint } from "./recap";
import { MONTHS, type EntryWithItem } from "./media";

export const generateRecap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ year: z.number().int().min(1900).max(2200), month: z.number().int().min(1).max(12) }))
  .handler(async ({ data, context }): Promise<{ remark?: string; fingerprint?: string; error?: string; status?: number }> => {
    const { data: blocked, error: stateError } = await context.supabase.from("recap_ai_state").select("blocked_message, status").eq("user_id", context.userId).maybeSingle();
    if (stateError) throw stateError;
    if (blocked) return { error: blocked.blocked_message, status: blocked.status };
    const { data: rows, error } = await context.supabase.from("monthly_entries").select("*, media_items(*)").eq("completed", true);
    if (error) throw error;
    const recap = monthlyRecap(rows as unknown as EntryWithItem[], data.year, data.month);
    if (!recap.total) return { error: "No finished stories in this month yet." };
    const fingerprint = recapFingerprint(recap.finished);
    const { data: cached, error: cacheError } = await context.supabase.from("monthly_recaps").select("remark, fingerprint").eq("year", data.year).eq("month", data.month).maybeSingle();
    if (cacheError) throw cacheError;
    if (cached?.fingerprint === fingerprint) return { remark: cached.remark, fingerprint };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "AI remarks are not configured yet.", status: 401 };
    const { writeRecapRemark, RecapAIError } = await import("./recap.server");
    try {
      const remark = await writeRecapRemark(getRequest(), key, `${MONTHS[data.month - 1]} ${data.year}`, recap.finished);
      // Generated output is server-owned; clients can only read their own cached remarks.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error: saveError } = await supabaseAdmin.from("monthly_recaps").upsert({ user_id: context.userId, ...data, fingerprint, remark }, { onConflict: "user_id,year,month" });
      if (saveError) throw saveError;
      return { remark, fingerprint };
    } catch (e) {
      if (e instanceof RecapAIError) {
        if (e.providerDenied) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error: blockError } = await supabaseAdmin.from("recap_ai_state").upsert({ user_id: context.userId, blocked_message: e.message, status: e.status });
          if (blockError) throw blockError;
        }
        return { error: e.message, status: e.status };
      }
      console.error("Recap generation failed", e);
      return { error: "Your AI remark could not be completed. Your recap and journal are still saved." };
    }
  });