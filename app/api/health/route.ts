import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY?.trim());

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      translationProviderConfigured: hasOpenAI || hasOpenRouter,
      providerPreference: hasOpenAI ? "openai" : hasOpenRouter ? "openrouter" : "none"
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
