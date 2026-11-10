import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const catalog = {
  pro: { name: "KLYRO Pro", amount: 1200, mode: "subscription" as const },
  studio: { name: "KLYRO Studio", amount: 2900, mode: "subscription" as const },
  boost: { name: "KLYRO Boost", amount: 700, mode: "payment" as const },
  spotlight: { name: "KLYRO Spotlight", amount: 1900, mode: "payment" as const },
  launch: { name: "KLYRO Launch", amount: 4900, mode: "payment" as const }
};

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Payments are not configured yet" }, { status: 503 });

  const body = await request.json();
  const item = catalog[body.item as keyof typeof catalog];
  if (!item) return NextResponse.json({ error: "Unknown product" }, { status: 400 });

  const stripe = new Stripe(secret);
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: item.mode,
    success_url: origin + "/pricing?status=success",
    cancel_url: origin + "/pricing?status=cancelled",
    metadata: { item: body.item, project_id: body.projectId || "" },
    line_items: [{ price_data: { currency: "usd", product_data: { name: item.name }, unit_amount: item.amount, recurring: item.mode === "subscription" ? { interval: "month" } : undefined }, quantity: 1 }]
  });
  return NextResponse.json({ url: session.url });
}