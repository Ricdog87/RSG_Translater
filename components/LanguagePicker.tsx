import { ChevronDown } from "lucide-react";
import { languages, type LanguageCode } from "@/lib/languages";

type LanguagePickerProps = {
  id: string;
  label: string;
  value: LanguageCode;
  onChange: (value: LanguageCode) => void;
};

export function LanguagePicker({ id, label, value, onChange }: LanguagePickerProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-zinc-700">{label}</span>
      <span className="relative block">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as LanguageCode)}
          className="h-14 w-full appearance-none rounded-lg border border-zinc-200 bg-white/90 px-4 pr-11 text-base font-semibold text-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/10"
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label} - {language.nativeName}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500"
        />
      </span>
    </label>
  );
}
