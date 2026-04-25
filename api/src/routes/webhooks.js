import { Router } from "express";
import express from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { ok, fail } from "../utils/response.js";

const router = Router();

function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  const parts = sigHeader.split(",");
  let timestamp = null;
  const signatures = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === "t") timestamp = value;
    else if (key === "v1") signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;
  const payload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return signatures.some((sig) => {
    try {
      const sigBuf = Buffer.from(sig, "hex");
      const expBuf = Buffer.from(expected, "hex");
      if (sigBuf.length !== expBuf.length) return false;
      return timingSafeEqual(sigBuf, expBuf);
    } catch { return false; }
  });
}

function getSupabaseAdmin() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sigHeader = req.headers["stripe-signature"];
  if (!sigHeader) return fail(res, 400, "MISSING_SIGNATURE", "Missing Stripe-Signature header");

  const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : req.body;

  if (!verifyStripeSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET)) {
    return fail(res, 400, "INVALID_SIGNATURE", "Invalid Stripe webhook signature");
  }

  let event;
  try { event = JSON.parse(rawBody); } catch {
    return fail(res, 400, "INVALID_PAYLOAD", "Could not parse event body");
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
