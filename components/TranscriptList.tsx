import { Clock3 } from "lucide-react";
import { getLanguageFlag, getLanguageLabel } from "@/lib/languages";
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
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 px-5 py-12 text-center text-sm font-medium text-zinc-500">
        Noch keine Beiträge. Sobald gesprochen wird, erscheinen Übersetzungen hier.
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => {
        const isCustomer = entry.speaker === "customer";

        return (
          <li
            key={entry.id}
            className={[
              "rounded-2xl border bg-white/95 p-4 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur",
              isCustomer ? "border-zinc-200" : "border-emerald-100"
            ].join(" ")}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={[
                    "flex size-9 items-center justify-center rounded-xl text-base",
                    isCustomer ? "bg-zinc-950 text-white" : "bg-emerald-100 text-emerald-700"
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {getLanguageFlag(entry.sourceLanguage)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    {speakerName(entry)} <span className="font-medium text-zinc-400">#{entry.turnNumber}</span>
                  </p>
                  <p className="text-xs font-medium text-zinc-500">
                    {getLanguageLabel(entry.sourceLanguage)} → {getLanguageLabel(entry.targetLanguage)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-400">
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

            <div className="space-y-2.5">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Gesprochen · {getLanguageLabel(entry.sourceLanguage)}
                </p>
                <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-800">{entry.originalText}</p>
              </div>
              {showTranslated ? (
                <div
                  className={[
                    "rounded-xl p-3",
                    isCustomer ? "bg-zinc-50" : "bg-emerald-50/70"
                  ].join(" ")}
                >
                  <p
                    className={[
                      "mb-1 text-[11px] font-semibold uppercase tracking-wider",
                      isCustomer ? "text-zinc-500" : "text-emerald-700"
                    ].join(" ")}
                  >
                    Übersetzung · {getLanguageLabel(entry.targetLanguage)} {getLanguageFlag(entry.targetLanguage)}
                  </p>
                  <p className="whitespace-pre-wrap text-base font-semibold leading-relaxed text-zinc-950">
                    {entry.translatedText}
                  </p>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
