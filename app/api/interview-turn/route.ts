import { NextResponse } from "next/server";
import { getLanguageLabel, languages, type LanguageCode } from "@/lib/languages";
import type { Speaker, TranslateResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const validLanguageCodes = new Set(languages.map((language) => language.code));

type TranslateRequest = {
  speaker?: Speaker;
  originalText?: string;
  languageA?: LanguageCode;
  languageB?: LanguageCode;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && validLanguageCodes.has(value as LanguageCode);
}

function isSpeaker(value: unknown): value is Speaker {
  return value === "customer" || value === "candidate";
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return jsonError("OPENROUTER_API_KEY ist nicht konfiguriert.", 500);
  }

  const body = (await request.json()) as TranslateRequest;
  const originalText = body.originalText?.trim();

  if (!isSpeaker(body.speaker) || !isLanguageCode(body.languageA) || !isLanguageCode(body.languageB)) {
    return jsonError("Ungueltige Sprecher- oder Sprachangaben.");
  }

  if (!originalText) {
    return jsonError("Es wurde kein erkannter Text uebergeben.");
  }

  const sourceLanguage = body.speaker === "customer" ? body.languageA : body.languageB;
  const targetLanguage = body.speaker === "customer" ? body.languageB : body.languageA;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://rsg-translater.vercel.app",
        "X-Title": "RSG Translate"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a professional recruiting interview interpreter. Translate faithfully, preserve names, job titles, dates, and numbers. Return only the translated text."
          },
          {
            role: "user",
            content: `Translate from ${getLanguageLabel(sourceLanguage)} to ${getLanguageLabel(targetLanguage)}:\n\n${originalText}`
          }
        ]
      })
    });

    const data = (await response.json()) as OpenRouterResponse;

    if (!response.ok) {
      return jsonError(data.error?.message ?? "OpenRouter konnte die Uebersetzung nicht erzeugen.", response.status);
    }

    const translatedText = data.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      return jsonError("Die Uebersetzung konnte nicht erzeugt werden.", 502);
    }

    const payload: TranslateResponse = {
      speaker: body.speaker,
      originalText,
      translatedText,
      sourceLanguage,
      targetLanguage,
      provider: "openrouter"
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return jsonError("Der Interview-Turn konnte nicht verarbeitet werden.", 500);
  }
}
