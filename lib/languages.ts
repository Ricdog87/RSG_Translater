export type LanguageCode = "de" | "fr" | "ar" | "en" | "es" | "it" | "tr" | "sr";

export type LanguageOption = {
  code: LanguageCode;
  label: string;
  nativeName: string;
  speechTag: string;
};

export const languages: LanguageOption[] = [
  { code: "de", label: "Deutsch", nativeName: "Deutsch", speechTag: "de-DE" },
  { code: "fr", label: "Französisch", nativeName: "Français", speechTag: "fr-FR" },
  { code: "ar", label: "Arabisch", nativeName: "العربية", speechTag: "ar-SA" },
  { code: "en", label: "Englisch", nativeName: "English", speechTag: "en-US" },
  { code: "es", label: "Spanisch", nativeName: "Español", speechTag: "es-ES" },
  { code: "it", label: "Italienisch", nativeName: "Italiano", speechTag: "it-IT" },
  { code: "tr", label: "Türkisch", nativeName: "Türkçe", speechTag: "tr-TR" },
  { code: "sr", label: "Serbisch", nativeName: "Srpski", speechTag: "sr-RS" }
];

export function getLanguageLabel(code: string) {
  return languages.find((language) => language.code === code)?.label ?? code;
}

export function getSpeechTag(code: string) {
  return languages.find((language) => language.code === code)?.speechTag ?? code;
}
