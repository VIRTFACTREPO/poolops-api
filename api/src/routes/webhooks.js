import { Router } from "express";
import express from "express";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { ok, fail } from "../utils/response.js";

const router = Router();

function getSupabaseAdmin() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sigHeader = req.headers["stripe-signature"];
  if (!sigHeader) return fail(res, 400, "MISSING_SIGNATURE", "Missing Stripe-Signature header");

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sigHeader, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return fail(res, 400, "INVALID_SIGNATURE", `Webhook signature verification failed: ${err.message}`);
  }

  const subscription = event?.data?.object;
  const companyId = subscription?.metadata?.company_id;

  if (!companyId) return ok(res, { received: true, skipped: true });

  const supabase = getSupabaseAdmin();

  if (event.type === "customer.subscription.updated") {
    const plan = subscription?.metadata?.plan || "solo";
    const validPlans = ["solo", "pro", "business"];
    const newPlan = validPlans.includes(plan) ? plan : "solo";
    await supabase.from("companies").update({ plan: newPlan }).eq("id", companyId);
    return ok(res, { received: true, event: event.type, plan: newPlan });
  }

  if (event.type === "customer.subscription.deleted") {
    await supabase.from("companies").update({ plan: "solo" }).eq("id", companyId);
    return ok(res, { received: true, event: event.type, plan: "solo" });
  }

  return ok(res, { received: true, skipped: true });
});

router.post("/resend", express.json(), (req, res) => {
  // stub — resend webhook events not yet implemented
  return ok(res, { received: true });
});

export default router;
