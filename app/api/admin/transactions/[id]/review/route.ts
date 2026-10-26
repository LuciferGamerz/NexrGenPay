import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiError, requireSameOrigin } from "@/lib/http-security";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  decision: z.enum(["COMPLETE", "FAIL"]),
  note: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let admin: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    admin = await getCurrentUser();
  } catch (error) {
    console.error("Admin authentication lookup failed:", error);
    return apiError("Admin authentication service is unavailable.", 503);
  }
  if (!admin || admin.role !== "ADMIN") return apiError("Forbidden.", 403);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Choose a valid review decision.");
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return apiError("Sell request was not found.", 404);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("review_sell_request", {
      p_transaction_id: id,
      p_admin_id: admin.id,
      p_decision: parsed.data.decision,
      p_note: parsed.data.note ?? null,
    });
    if (error) {
      if (error.message.includes("sell_request_not_pending")) {
        return apiError("This sell request is no longer pending.", 409);
      }
      if (error.message.includes("forbidden")) return apiError("Forbidden.", 403);
      throw error;
    }

    return NextResponse.json({
      transaction: data,
      message: parsed.data.decision === "COMPLETE"
        ? "Sell marked complete. This action records your manual payout confirmation."
        : "Sell rejected and the reserved USDT was returned to the user.",
    });
  } catch (error) {
    console.error("Supabase sell review failed:", error);
    return apiError("Sell review could not be completed.", 503);
  }
}
