import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const preferredRegion = "fra1";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      time: new Date().toISOString(),
      hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY)
    },
    {
      headers: { "Cache-Control": "no-store" }
    }
  );
}
