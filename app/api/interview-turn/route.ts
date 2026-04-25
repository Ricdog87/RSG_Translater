import { NextResponse } from "next/server";
import { getLanguageLabel, getTranslationLanguageName, languages, type LanguageCode } from "@/lib/languages";
import type { Speaker, TranslateResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;
export const preferredRegion = "fra1";

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

function looksLikeHtmlDocument(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("<!doctype html") || normalized.startsWith("<html");
}

function sanitizeProviderError(raw: string, fallbackMessage: string) {
  if (!raw.trim()) {
    return fallbackMessage;
  }

  if (looksLikeHtmlDocument(raw)) {
    return "Der konfigurierte Übersetzungs-Endpunkt liefert HTML statt JSON (z. B. Login/Auth-Seite). Bitte OPENROUTER_BASE_URL prüfen.";
  }

  return raw.slice(0, 240);
}

function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && validLanguageCodes.has(value as LanguageCode);
}

function isSpeaker(value: unknown): value is Speaker {
  return value === "customer" || value === "candidate";
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

function jsonSuccess(payload: TranslateResponse) {
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as TranslateRequest;
  } catch {
    return null;
  }
}

async function readOpenRouterResponse(response: Response) {
  const raw = await response.text();

  if (!raw.trim()) {
    return {
      data: null,
      raw
    };
  }

  try {
    return {
      data: JSON.parse(raw) as OpenRouterResponse,
      raw
    };
  } catch {
    return {
      data: null,
      raw
    };
  }
}

export async function POST(request: Request) {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;

  if (!openRouterApiKey) {
    return jsonError("OPENROUTER_API_KEY ist nicht konfiguriert. Ein OpenAI sk-proj Key funktioniert hier nicht.", 500);
  }

  if (!openRouterApiKey.startsWith("sk-or-")) {
    return jsonError("Ungültiger API-Key für OpenRouter. Bitte einen OpenRouter-Key (Prefix sk-or-) verwenden.", 500);
  }

  const body = await readJsonBody(request);

  if (!body) {
    return jsonError("Ungültige Anfrage. Bitte erneut versuchen.");
  }

  const originalText = body.originalText?.trim();

  if (!isSpeaker(body.speaker) || !isLanguageCode(body.languageA) || !isLanguageCode(body.languageB)) {
    return jsonError("Ungültige Sprecher- oder Sprachangaben.");
  }

  if (!originalText) {
    return jsonError("Es wurde kein erkannter Text übergeben.");
  }

  const sourceLanguage = body.speaker === "customer" ? body.languageA : body.languageB;
  const targetLanguage = body.speaker === "customer" ? body.languageB : body.languageA;

  try {
    const openRouterUrl = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1/chat/completions";
    const response = await fetch(openRouterUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://rsg-translater.vercel.app",
        "X-Title": "RSG Translate"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
        temperature: 0.2,
        provider: {
          data_collection: "deny"
        },
        messages: [
          {
            role: "system",
            content:
              "You are a professional recruiting interview interpreter. Translate faithfully, preserve names, job titles, dates, and numbers. Return only the translated text."
          },
          {
            role: "user",
            content: `Translate from ${getTranslationLanguageName(sourceLanguage)} (${getLanguageLabel(sourceLanguage)}) to ${getTranslationLanguageName(targetLanguage)} (${getLanguageLabel(targetLanguage)}). Return only translated text in ${getTranslationLanguageName(targetLanguage)}.\n\n${originalText}`
          }
        ]
      })
    });

    const { data, raw } = await readOpenRouterResponse(response);

    if (!response.ok) {
      const providerMessage = data?.error?.message ?? sanitizeProviderError(raw, "OpenRouter konnte die Übersetzung nicht erzeugen.");
      return jsonError(providerMessage || "OpenRouter konnte die Übersetzung nicht erzeugen.", response.status);
    }

    const translatedText = data?.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      return jsonError("Die Übersetzung konnte nicht erzeugt werden.", 502);
    }

    const payload: TranslateResponse = {
      speaker: body.speaker,
      originalText,
      translatedText,
      sourceLanguage,
      targetLanguage,
      provider: "openrouter"
    };

    return jsonSuccess(payload);
  } catch (error) {
    console.error("Interview turn failed", error instanceof Error ? error.message : "unknown error");
    return jsonError("Der Interview-Turn konnte nicht verarbeitet werden.", 500);
  }
}
