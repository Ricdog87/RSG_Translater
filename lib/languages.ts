export type LanguageCode = "de" | "fr" | "ar" | "en" | "es" | "it" | "tr" | "sr";

export type LanguageOption = {
  code: LanguageCode;
  label: string;
  nativeName: string;
  speechTag: string;
  translationName: string;
};

export const languages: LanguageOption[] = [
  { code: "de", label: "Deutsch", nativeName: "Deutsch", speechTag: "de-DE", translationName: "German" },
  { code: "fr", label: "Französisch", nativeName: "Français", speechTag: "fr-FR", translationName: "French" },
  { code: "ar", label: "Arabisch", nativeName: "العربية", speechTag: "ar-SA", translationName: "Arabic" },
  { code: "en", label: "Englisch", nativeName: "English", speechTag: "en-US", translationName: "English" },
  { code: "es", label: "Spanisch", nativeName: "Español", speechTag: "es-ES", translationName: "Spanish" },
  { code: "it", label: "Italienisch", nativeName: "Italiano", speechTag: "it-IT", translationName: "Italian" },
  { code: "tr", label: "Türkisch", nativeName: "Türkçe", speechTag: "tr-TR", translationName: "Turkish" },
  { code: "sr", label: "Serbisch", nativeName: "Srpski", speechTag: "sr", translationName: "Serbian" }
];

export function getLanguageLabel(code: string) {
  return languages.find((language) => language.code === code)?.label ?? code;
}

export function getSpeechTag(code: string) {
  return languages.find((language) => language.code === code)?.speechTag ?? code;
}

export function getTranslationLanguageName(code: string) {
  return languages.find((language) => language.code === code)?.translationName ?? code;
}
