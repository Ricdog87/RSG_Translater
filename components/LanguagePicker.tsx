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
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative block">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as LanguageCode)}
          className="h-14 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 pr-11 text-base font-semibold text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label} - {language.nativeName}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-500"
        />
      </span>
    </label>
  );
}
