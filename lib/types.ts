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
};

export type TranslateResponse = Omit<TranscriptEntry, "id" | "createdAt"> & {
  audioBase64: string;
  audioMimeType: "audio/mpeg";
};
