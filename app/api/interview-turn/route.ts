import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getLanguageLabel, languages, type LanguageCode } from "@/lib/languages";
import type { Speaker, TranslateResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const validLanguageCodes = new Set(languages.map((language) => language.code));

function isLanguageCode(value: FormDataEntryValue | null): value is LanguageCode {
  return typeof value === "string" && validLanguageCodes.has(value as LanguageCode);
}

function isSpeaker(value: FormDataEntryValue | null): value is Speaker {
  return value === "customer" || value === "candidate";
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonError("OPENAI_API_KEY ist nicht konfiguriert.", 500);
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const formData = await request.formData();
  const audio = formData.get("audio");
  const speaker = formData.get("speaker");
  const languageA = formData.get("languageA");
  const languageB = formData.get("languageB");

  if (!(audio instanceof File) || audio.size === 0) {
    return jsonError("Es wurde keine Audioaufnahme uebergeben.");
  }

  if (!isSpeaker(speaker) || !isLanguageCode(languageA) || !isLanguageCode(languageB)) {
    return jsonError("Ungueltige Sprecher- oder Sprachangaben.");
  }

  const sourceLanguage = speaker === "customer" ? languageA : languageB;
  const targetLanguage = speaker === "customer" ? languageB : languageA;

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "gpt-4o-mini-transcribe",
      language: sourceLanguage,
      prompt: `Recruiting interview. Transcribe clearly in ${getLanguageLabel(sourceLanguage)}.`
    });

    const originalText = transcription.text?.trim();

    if (!originalText) {
      return jsonError("Keine Sprache erkannt. Bitte erneut aufnehmen.");
    }

    const translation = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You are a professional recruiting interview interpreter. Translate faithfully, preserve names, job titles, dates, and numbers. Return only the translated text."
        },
        {
          role: "user",
          content: `Translate from ${getLanguageLabel(sourceLanguage)} to ${getLanguageLabel(targetLanguage)}:\n\n${originalText}`
        }
      ],
      temperature: 0.2
    });

    const translatedText = translation.output_text.trim();

    if (!translatedText) {
      return jsonError("Die Uebersetzung konnte nicht erzeugt werden.", 502);
    }

    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: speaker === "customer" ? "marin" : "cedar",
      input: translatedText,
      instructions: `Speak naturally and clearly in ${getLanguageLabel(targetLanguage)} for a recruiting interview.`
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    const payload: TranslateResponse = {
      speaker,
      originalText,
      translatedText,
      sourceLanguage,
      targetLanguage,
      audioBase64: audioBuffer.toString("base64"),
      audioMimeType: "audio/mpeg"
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return jsonError("Der Interview-Turn konnte nicht verarbeitet werden.", 500);
  }
}
