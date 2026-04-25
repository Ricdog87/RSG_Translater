import type { LanguageCode } from "./languages";

export type Speaker = "customer" | "candidate";

export type TranscriptEntry = {
  id: string;
  speaker: Speaker;
  originalText: string;
  translatedText: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  createdAt: string;
  turnNumber: number;
};

export type TranslateResponse = Omit<TranscriptEntry, "id" | "createdAt" | "turnNumber"> & {
  provider: "openai";
};
