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

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type ProviderConfig = {
  name: "openai" | "openrouter";
  apiKey: string;
  url: string;
  model: string;
};

function firstConfiguredEnv(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

function looksLikeHtmlDocument(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("<!doctype html") || normalized.startsWith("<html");
}

function sanitizeProviderError(raw: string, fallbackMessage: string) {
  if (!raw.trim()) {
    return fallbackMessage;
  }

  if (looksLikeHtmlDocument(raw)) {
    return "Der konfigurierte Übersetzungs-Endpunkt liefert HTML statt JSON (z. B. Login/Auth-Seite). Bitte OPENAI_BASE_URL/OPENROUTER_BASE_URL prüfen.";
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

async function readProviderResponse(response: Response) {
  const raw = await response.text();

  if (!raw.trim()) {
    return {
      data: null,
      raw
    };
  }

  try {
    return {
      data: JSON.parse(raw) as OpenAIResponse,
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
  const openAIApiKey = firstConfiguredEnv([
    "OPENAI_API_KEY",
    "OPEN_AI_API_KEY",
    "OPENAI_KEY",
    "OPENAI_PAY_KEY",
    "NEXT_PUBLIC_OPENAI_API_KEY",
    "NEXT_PUBLIC_OPEN_AI_API_KEY"
  ]);
  const openRouterApiKey = firstConfiguredEnv([
    "OPENROUTER_API_KEY",
    "OPEN_ROUTER_API_KEY",
    "OPENROUTER_KEY",
    "OPENROUTER_PAY_KEY",
    "NEXT_PUBLIC_OPENROUTER_API_KEY",
    "NEXT_PUBLIC_OPEN_ROUTER_API_KEY"
  ]);

  const provider: ProviderConfig | null = openAIApiKey
    ? {
        name: "openai",
        apiKey: openAIApiKey,
        url: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1/chat/completions",
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini"
      }
    : openRouterApiKey
      ? {
          name: "openrouter",
          apiKey: openRouterApiKey,
          url: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1/chat/completions",
          model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini"
        }
      : null;

  if (!provider) {
    return jsonError(
      "Kein API-Key gefunden. Setze OPENAI_API_KEY oder OPENROUTER_API_KEY (auch erkannt: OPEN_AI_API_KEY, OPEN_ROUTER_API_KEY, NEXT_PUBLIC_OPENAI_API_KEY, NEXT_PUBLIC_OPENROUTER_API_KEY). Nach dem Setzen bitte neu deployen.",
      500
    );
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
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
        ...(provider.name === "openrouter"
          ? {
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://rsg-translater.vercel.app",
              "X-Title": "RSG Translate"
            }
          : {})
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.2,
        ...(provider.name === "openrouter"
          ? {
              provider: {
                data_collection: "deny"
              }
            }
          : {}),
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

    const { data, raw } = await readProviderResponse(response);

    if (!response.ok) {
      const providerMessage =
        data?.error?.message ??
        sanitizeProviderError(raw, `${provider.name === "openai" ? "OpenAI" : "OpenRouter"} konnte die Übersetzung nicht erzeugen.`);
      return jsonError(
        providerMessage || `${provider.name === "openai" ? "OpenAI" : "OpenRouter"} konnte die Übersetzung nicht erzeugen.`,
        response.status
      );
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
      provider: provider.name
    };

    return jsonSuccess(payload);
  } catch (error) {
    console.error("Interview turn failed", error instanceof Error ? error.message : "unknown error");
    return jsonError("Der Interview-Turn konnte nicht verarbeitet werden.", 500);
  }
}
