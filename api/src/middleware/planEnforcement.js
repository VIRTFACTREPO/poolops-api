import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { fail } from "../utils/response.js";

const PLAN_LIMITS = {
  solo: { technicians: 1, pools: 50 },
  pro: { technicians: 3, pools: Infinity },
  business: { technicians: Infinity, pools: Infinity },
};

function getSupabaseAdmin() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function planLimitCheck(resource) {
  return async (req, res, next) => {
    const companyId = req.user?.companyId;
    if (!companyId) return fail(res, 403, "FORBIDDEN", "No company associated with this account");

    const supabase = getSupabaseAdmin();

    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .select("plan")
      .eq("id", companyId)
      .maybeSingle();

    if (companyErr || !company) return fail(res, 403, "FORBIDDEN", "Company not found");

    const plan = company.plan || "solo";
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.solo;
    const limit = limits[resource];

    if (limit === Infinity) return next();

    let count = 0;
    if (resource === "technicians") {
      const { count: c, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("role", "technician");
      if (error) return fail(res, 500, "INTERNAL_ERROR", "Failed to check plan limits");
      count = c ?? 0;
    } else if (resource === "pools") {
      const { count: c, error } = await supabase
        .from("pools")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId);
      if (error) return fail(res, 500, "INTERNAL_ERROR", "Failed to check plan limits");
      count = c ?? 0;
    }

    if (count >= limit) {
      return fail(
        res,
        403,
        "PLAN_LIMIT_EXCEEDED",
        `Your ${plan} plan allows a maximum of ${limit} ${resource}. Upgrade your plan to add more.`,
      );
    }

    return next();
  };
}

export const checkTechnicianLimit = planLimitCheck("technicians");
export const checkPoolLimit = planLimitCheck("pools");
