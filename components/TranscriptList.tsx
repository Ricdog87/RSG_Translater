import { UserRound } from "lucide-react";
import { getLanguageLabel } from "@/lib/languages";
import type { TranscriptEntry } from "@/lib/types";

type TranscriptListProps = {
  entries: TranscriptEntry[];
};

export function TranscriptList({ entries }: TranscriptListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center text-sm font-medium text-slate-500">
        Der Gespraechsverlauf erscheint hier nach der ersten Aufnahme.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isCustomer = entry.speaker === "customer";

        return (
          <article
            key={entry.id}
            className={[
              "rounded-lg border bg-white p-4 shadow-sm",
              isCustomer ? "border-teal-100" : "border-slate-200"
            ].join(" ")}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "flex size-9 items-center justify-center rounded-full text-white",
                    isCustomer ? "bg-teal-700" : "bg-slate-950"
                  ].join(" ")}
                >
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-950">{isCustomer ? "Kunde" : "Kandidat"}</p>
                  <p className="text-xs font-medium text-slate-500">
                    {getLanguageLabel(entry.sourceLanguage)} nach {getLanguageLabel(entry.targetLanguage)}
                  </p>
                </div>
              </div>
              <time className="text-xs font-medium text-slate-400">
                {new Intl.DateTimeFormat("de-DE", {
                  hour: "2-digit",
                  minute: "2-digit"
                }).format(new Date(entry.createdAt))}
              </time>
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Original</p>
                <p className="text-base leading-relaxed text-slate-800">{entry.originalText}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-teal-700">Uebersetzung</p>
                <p className="text-lg font-semibold leading-relaxed text-slate-950">{entry.translatedText}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
