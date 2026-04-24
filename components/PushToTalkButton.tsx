import { Mic, Square } from "lucide-react";
import type { Speaker } from "@/lib/types";

type PushToTalkButtonProps = {
  speaker: Speaker;
  label: string;
  hint: string;
  active: boolean;
  disabled: boolean;
  onStart: (speaker: Speaker) => void;
  onStop: () => void;
};

export function PushToTalkButton({
  speaker,
  label,
  hint,
  active,
  disabled,
  onStart,
  onStop
}: PushToTalkButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled && !active}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onStart(speaker);
      }}
      onPointerUp={onStop}
      onPointerCancel={onStop}
      className={[
        "flex min-h-44 w-full touch-none select-none flex-col items-center justify-center gap-4 rounded-lg px-5 text-center shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
        active
          ? "bg-rose-600 text-white shadow-rose-900/20"
          : speaker === "customer"
            ? "bg-teal-700 text-white shadow-teal-900/20"
            : "bg-slate-950 text-white shadow-slate-900/20"
      ].join(" ")}
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-white/15">
        {active ? <Square className="size-8" aria-hidden="true" /> : <Mic className="size-8" aria-hidden="true" />}
      </span>
      <span className="text-2xl font-bold leading-tight">{active ? "Loslassen zum Uebersetzen" : label}</span>
      <span className="text-sm font-medium text-white/78">{hint}</span>
    </button>
  );
}
