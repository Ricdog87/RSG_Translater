export type LanguageCode = "de" | "fr" | "ar" | "en" | "es" | "it" | "tr" | "sr";

export type LanguageOption = {
  code: LanguageCode;
  label: string;
  nativeName: string;
  speechTag: string;
  translationName: string;
  flag: string;
};

export const languages: LanguageOption[] = [
  { code: "de", label: "Deutsch", nativeName: "Deutsch", speechTag: "de-DE", translationName: "German", flag: "🇩🇪" },
  { code: "fr", label: "Französisch", nativeName: "Français", speechTag: "fr-FR", translationName: "French", flag: "🇫🇷" },
  { code: "en", label: "Englisch", nativeName: "English", speechTag: "en-US", translationName: "English", flag: "🇬🇧" },
  { code: "es", label: "Spanisch", nativeName: "Español", speechTag: "es-ES", translationName: "Spanish", flag: "🇪🇸" },
  { code: "it", label: "Italienisch", nativeName: "Italiano", speechTag: "it-IT", translationName: "Italian", flag: "🇮🇹" },
  { code: "tr", label: "Türkisch", nativeName: "Türkçe", speechTag: "tr-TR", translationName: "Turkish", flag: "🇹🇷" },
  { code: "ar", label: "Arabisch", nativeName: "العربية", speechTag: "ar-SA", translationName: "Arabic", flag: "🇸🇦" },
  { code: "sr", label: "Serbisch", nativeName: "Srpski", speechTag: "sr-RS", translationName: "Serbian", flag: "🇷🇸" }
];

export function getLanguage(code: string) {
  return languages.find((language) => language.code === code);
}

export function getLanguageLabel(code: string) {
  return getLanguage(code)?.label ?? code;
}

export function getLanguageNative(code: string) {
  return getLanguage(code)?.nativeName ?? code;
}

export function getLanguageFlag(code: string) {
  return getLanguage(code)?.flag ?? "";
}

export function getSpeechTag(code: string) {
  return getLanguage(code)?.speechTag ?? code;
}

export function getTranslationLanguageName(code: string) {
  return getLanguage(code)?.translationName ?? code;
}
