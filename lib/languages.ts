export type LanguageCode = "de" | "fr" | "ar" | "en" | "es" | "it" | "tr";

export type LanguageOption = {
  code: LanguageCode;
  label: string;
  nativeName: string;
};

export const languages: LanguageOption[] = [
  { code: "de", label: "Deutsch", nativeName: "Deutsch" },
  { code: "fr", label: "Franzoesisch", nativeName: "Francais" },
  { code: "ar", label: "Arabisch", nativeName: "العربية" },
  { code: "en", label: "Englisch", nativeName: "English" },
  { code: "es", label: "Spanisch", nativeName: "Espanol" },
  { code: "it", label: "Italienisch", nativeName: "Italiano" },
  { code: "tr", label: "Tuerkisch", nativeName: "Turkce" }
];

export function getLanguageLabel(code: string) {
  return languages.find((language) => language.code === code)?.label ?? code;
}
