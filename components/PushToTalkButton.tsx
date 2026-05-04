import { Mic, Square } from "lucide-react";
import type { Speaker } from "@/lib/types";

type SpeakerCardProps = {
  speaker: Speaker;
  name: string;
  sourceFlag: string;
  targetFlag: string;
  sourceLabel: string;
  targetLabel: string;
  active: boolean;
  disabled: boolean;
  interimText: string;
  onToggle: () => void;
};

export function PushToTalkButton({
  speaker,
  name,
  sourceFlag,
  targetFlag,
  sourceLabel,
  targetLabel,
  active,
  disabled,
  interimText,
  onToggle
}: SpeakerCardProps) {
  const isCustomer = speaker === "customer";
  const cardClasses = active
    ? "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50 shadow-[0_24px_70px_-20px_rgba(244,63,94,0.45)]"
    : isCustomer
      ? "border-zinc-900/90 bg-zinc-950 text-white shadow-[0_24px_60px_-22px_rgba(15,23,42,0.55)]"
      : "border-zinc-200 bg-white shadow-[0_18px_50px_-22px_rgba(15,23,42,0.18)]";

  const subtitleColor = active
    ? "text-rose-700"
    : isCustomer
      ? "text-white/65"
      : "text-zinc-500";

  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl border p-5 transition-colors duration-200 sm:p-6",
        cardClasses
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={[
              "flex size-11 items-center justify-center rounded-2xl text-xl",
              active
                ? "bg-rose-100 text-rose-600"
                : isCustomer
                  ? "bg-white/10 text-white"
                  : "bg-zinc-100 text-zinc-700"
            ].join(" ")}
            aria-hidden="true"
          >
            {sourceFlag}
          </span>
          <div>
            <p
              className={[
                "text-xs font-semibold uppercase tracking-[0.16em]",
                active ? "text-rose-500" : isCustomer ? "text-white/55" : "text-zinc-400"
              ].join(" ")}
            >
              {isCustomer ? "Kunde" : "Bewerber"}
            </p>
            <p className={["text-lg font-semibold leading-tight", active ? "text-zinc-950" : ""].join(" ")}>{name}</p>
          </div>
        </div>
        {active ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
            <span className="size-1.5 rounded-full bg-white animate-pulse" /> Live
          </span>
        ) : null}
      </div>

      <div className={["mt-4 text-sm font-medium", subtitleColor].join(" ")}>
        {sourceLabel} <span aria-hidden="true">→</span> {targetLabel} <span aria-hidden="true">{targetFlag}</span>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        aria-pressed={active}
        className={[
          "relative mt-5 flex w-full select-none items-center justify-center gap-3 rounded-2xl px-5 py-5 text-base font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45",
          active
            ? "bg-rose-600 text-white shadow-[0_18px_40px_-15px_rgba(244,63,94,0.6)]"
            : isCustomer
              ? "bg-white text-zinc-950 hover:bg-zinc-100"
              : "bg-zinc-950 text-white hover:bg-zinc-800"
        ].join(" ")}
      >
        {active ? <span aria-hidden="true" className="mic-pulse-ring" /> : null}
        <span
          className={[
            "relative flex size-10 items-center justify-center rounded-full",
            active ? "bg-white/20 text-white" : isCustomer ? "bg-zinc-100 text-zinc-950" : "bg-white/15 text-white"
          ].join(" ")}
          aria-hidden="true"
        >
          {active ? <Square className="size-5" /> : <Mic className="size-5" />}
        </span>
        <span className="relative">
          {active ? "Stoppen" : "Sprachübersetzung starten"}
        </span>
      </button>

      <div
        className={[
          "mt-4 min-h-14 rounded-2xl px-4 py-3 text-sm leading-relaxed transition-colors",
          active
            ? "bg-white/85 text-zinc-700 ring-1 ring-rose-100"
            : isCustomer
              ? "bg-white/5 text-white/70 ring-1 ring-white/10"
              : "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100"
        ].join(" ")}
      >
        {active ? (
          interimText ? (
            <span>
              <span className="opacity-70">Höre: </span>
              {interimText}
            </span>
          ) : (
            <span className="italic opacity-70">Mikrofon offen – jetzt sprechen…</span>
          )
        ) : (
          <span className="opacity-80">
            Tippen, um den Live-Modus zu starten. Übersetzungen erscheinen automatisch.
          </span>
        )}
      </div>
    </div>
  );
}
