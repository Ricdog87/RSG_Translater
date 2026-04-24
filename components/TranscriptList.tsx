import { Clock3, UserRound } from "lucide-react";
import { getLanguageLabel } from "@/lib/languages";
import type { TranscriptEntry } from "@/lib/types";

type TranscriptListProps = {
  entries: TranscriptEntry[];
  showTranslated?: boolean;
};

function speakerName(entry: TranscriptEntry) {
  return entry.speaker === "customer" ? "Kunde" : "Bewerber";
}

export function TranscriptList({ entries, showTranslated = true }: TranscriptListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center text-sm font-medium text-slate-500">
        Das Interview-Transkript erscheint hier nach dem ersten Beitrag.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, index) => {
        const isCustomer = entry.speaker === "customer";

        return (
          <article
            key={entry.id}
            className={[
              "relative border-l-2 bg-white py-4 pl-4 pr-3",
              index === 0 ? "rounded-t-lg border-t border-r" : "border-t border-r",
              index === entries.length - 1 ? "rounded-b-lg border-b" : "",
              isCustomer ? "border-l-teal-600 border-slate-200" : "border-l-slate-900 border-slate-200"
            ].join(" ")}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
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
                  <p className="text-sm font-black text-slate-950">
                    {speakerName(entry)} <span className="font-semibold text-slate-400">#{entry.turnNumber}</span>
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {getLanguageLabel(entry.sourceLanguage)} nach {getLanguageLabel(entry.targetLanguage)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-slate-400">
                <Clock3 className="size-3.5" aria-hidden="true" />
                <time>
                  {new Intl.DateTimeFormat("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  }).format(new Date(entry.createdAt))}
                </time>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Gesprochen ({getLanguageLabel(entry.sourceLanguage)})
                </p>
                <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-850">{entry.originalText}</p>
              </div>
              {showTranslated ? (
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-teal-700">
                    Uebersetzung ({getLanguageLabel(entry.targetLanguage)})
                  </p>
                  <p className="whitespace-pre-wrap text-base font-semibold leading-relaxed text-slate-950">{entry.translatedText}</p>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
