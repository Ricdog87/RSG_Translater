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
        "flex min-h-44 w-full touch-none select-none flex-col items-center justify-center gap-4 rounded-lg px-5 text-center shadow-[0_18px_45px_rgba(15,23,42,0.10)] transition duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55",
        active
          ? "bg-red-500 text-white shadow-red-900/15"
          : speaker === "customer"
            ? "bg-zinc-950 text-white"
            : "bg-white text-zinc-950 ring-1 ring-zinc-200"
      ].join(" ")}
    >
      <span
        className={[
          "flex size-16 items-center justify-center rounded-full",
          active ? "bg-white/20" : speaker === "customer" ? "bg-white/15" : "bg-zinc-100"
        ].join(" ")}
      >
        {active ? <Square className="size-8" aria-hidden="true" /> : <Mic className="size-8" aria-hidden="true" />}
      </span>
      <span className="text-2xl font-semibold leading-tight">{active ? "Loslassen zum Übersetzen" : label}</span>
      <span className={["text-sm font-medium", speaker === "customer" || active ? "text-white/75" : "text-zinc-500"].join(" ")}>
        {hint}
      </span>
    </button>
  );
}
