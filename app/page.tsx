"use client";

import { useRef, useState } from "react";
import { Download, Languages, LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { LanguagePicker } from "@/components/LanguagePicker";
import { PushToTalkButton } from "@/components/PushToTalkButton";
import { TranscriptList } from "@/components/TranscriptList";
import { getLanguageLabel, type LanguageCode } from "@/lib/languages";
import type { Speaker, TranslateResponse, TranscriptEntry } from "@/lib/types";

type AppMode = "setup" | "interview";

const audioMimeType = "audio/webm";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function speakerLabel(speaker: Speaker) {
  return speaker === "customer" ? "Kunde" : "Kandidat";
}

export default function Home() {
  const [mode, setMode] = useState<AppMode>("setup");
  const [languageA, setLanguageA] = useState<LanguageCode>("de");
  const [languageB, setLanguageB] = useState<LanguageCode>("fr");
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<Speaker | null>(null);
  const [processingSpeaker, setProcessingSpeaker] = useState<Speaker | null>(null);
  const [status, setStatus] = useState("Bereit fuer das Interview.");
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const speakerRef = useRef<Speaker | null>(null);

  async function startRecording(speaker: Speaker) {
    if (activeSpeaker || processingSpeaker) {
      return;
    }

    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mimeType = MediaRecorder.isTypeSupported(audioMimeType) ? audioMimeType : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      speakerRef.current = speaker;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        void submitRecording();
      };

      recorder.start();
      setActiveSpeaker(speaker);
      setStatus(`${speakerLabel(speaker)} spricht...`);
    } catch {
      setError("Mikrofonzugriff wurde verweigert oder ist nicht verfuegbar.");
      setStatus("Bereit fuer das Interview.");
      stopStream();
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;

    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function submitRecording() {
    const speaker = speakerRef.current;
    const blob = new Blob(chunksRef.current, {
      type: recorderRef.current?.mimeType || audioMimeType
    });

    setActiveSpeaker(null);
    stopStream();
    recorderRef.current = null;
    speakerRef.current = null;
    chunksRef.current = [];

    if (!speaker || blob.size < 1200) {
      setStatus("Bereit fuer das Interview.");
      setError("Die Aufnahme war zu kurz. Bitte Taste gedrueckt halten und erneut sprechen.");
      return;
    }

    setProcessingSpeaker(speaker);
    setStatus("Transkribiere, uebersetze und spiele Audio ab...");

    try {
      const formData = new FormData();
      formData.append("audio", new File([blob], "interview-turn.webm", { type: blob.type || audioMimeType }));
      formData.append("speaker", speaker);
      formData.append("languageA", languageA);
      formData.append("languageB", languageB);

      const response = await fetch("/api/interview-turn", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Uebersetzung fehlgeschlagen.");
      }

      const result = data as TranslateResponse;

      const entry: TranscriptEntry = {
        id: createId(),
        createdAt: new Date().toISOString(),
        speaker: result.speaker,
        originalText: result.originalText,
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage
      };

      setEntries((current) => [entry, ...current]);
      setStatus("Uebersetzung wird abgespielt.");

      const audio = new Audio(`data:${result.audioMimeType};base64,${result.audioBase64}`);
      audio.onended = () => setStatus("Bereit fuer die naechste Antwort.");
      await audio.play();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unbekannter Fehler.";
      setError(message);
      setStatus("Bereit fuer das Interview.");
    } finally {
      setProcessingSpeaker(null);
    }
  }

  function exportTranscript() {
    const lines = entries
      .slice()
      .reverse()
      .map((entry) => {
        return [
          `[${new Date(entry.createdAt).toLocaleString("de-DE")}] ${speakerLabel(entry.speaker)}`,
          `Original (${getLanguageLabel(entry.sourceLanguage)}): ${entry.originalText}`,
          `Uebersetzung (${getLanguageLabel(entry.targetLanguage)}): ${entry.translatedText}`
        ].join("\n");
      })
      .join("\n\n");

    const blob = new Blob([lines || "Noch kein Gespraechsverlauf vorhanden."], {
      type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rsg-translate-interview.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (mode === "setup") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-6 sm:py-10">
        <section className="flex flex-1 flex-col justify-center">
          <div className="mb-8">
            <div className="mb-5 flex size-14 items-center justify-center rounded-lg bg-teal-700 text-white shadow-lg shadow-teal-900/20">
              <Languages className="size-7" aria-hidden="true" />
            </div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-teal-800">Recruiting Interpreter</p>
            <h1 className="text-5xl font-black leading-none text-slate-950 sm:text-6xl">RSG Translate</h1>
            <p className="mt-5 max-w-xl text-lg leading-7 text-slate-600">
              Push-to-talk Uebersetzung fuer Interviews zwischen Kunden und internationalen Kandidaten.
            </p>
          </div>

          <div className="print-surface rounded-lg border border-white/70 bg-white/82 p-4 shadow-xl shadow-slate-900/8 backdrop-blur sm:p-6">
            <div className="grid gap-4">
              <LanguagePicker id="language-a" label="Sprache Kunde" value={languageA} onChange={setLanguageA} />
              <LanguagePicker id="language-b" label="Sprache Kandidat" value={languageB} onChange={setLanguageB} />
            </div>

            <button
              type="button"
              onClick={() => setMode("interview")}
              className="mt-6 h-16 w-full rounded-lg bg-slate-950 px-5 text-lg font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 active:scale-[0.99]"
            >
              Interview starten
            </button>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-lg border border-teal-900/10 bg-teal-50/80 p-4 text-sm leading-6 text-teal-950">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>Audio wird nur fuer den jeweiligen Turn an die API gesendet. Es gibt kein Dauer-Streaming im MVP.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-4 sm:px-6 sm:py-7">
      <header className="no-print mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-800">RSG Translate</p>
          <h1 className="text-2xl font-black text-slate-950">Interview</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Kunde: {getLanguageLabel(languageA)} · Kandidat: {getLanguageLabel(languageB)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode("setup")}
          className="flex size-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm"
          aria-label="Sprachen aendern"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
        </button>
      </header>

      <section className="no-print grid gap-3 sm:grid-cols-2">
        <PushToTalkButton
          speaker="customer"
          label="Kunde spricht"
          hint={`Aufnehmen in ${getLanguageLabel(languageA)}`}
          active={activeSpeaker === "customer"}
          disabled={Boolean(activeSpeaker || processingSpeaker)}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <PushToTalkButton
          speaker="candidate"
          label="Kandidat spricht"
          hint={`Aufnehmen in ${getLanguageLabel(languageB)}`}
          active={activeSpeaker === "candidate"}
          disabled={Boolean(activeSpeaker || processingSpeaker)}
          onStart={startRecording}
          onStop={stopRecording}
        />
      </section>

      <section className="no-print mt-4 rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {processingSpeaker ? <LoaderCircle className="size-5 animate-spin text-teal-700" aria-hidden="true" /> : null}
          <p className="text-sm font-bold text-slate-800">{status}</p>
        </div>
        {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
      </section>

      <section className="print-surface mt-5 rounded-lg border border-white/80 bg-white/72 p-4 shadow-xl shadow-slate-900/8 backdrop-blur sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Gespraechsverlauf</h2>
            <p className="text-sm font-medium text-slate-500">{entries.length} Eintraege</p>
          </div>
          <div className="no-print flex gap-2">
            <button
              type="button"
              onClick={exportTranscript}
              className="flex size-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-40"
              aria-label="Verlauf als Text exportieren"
              disabled={entries.length === 0}
            >
              <Download className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-11 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white shadow-sm disabled:opacity-40"
              disabled={entries.length === 0}
            >
              PDF
            </button>
          </div>
        </div>
        <TranscriptList entries={entries} />
      </section>
    </main>
  );
}
