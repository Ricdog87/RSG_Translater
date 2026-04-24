"use client";

import { useRef, useState } from "react";
import { Download, Languages, LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { LanguagePicker } from "@/components/LanguagePicker";
import { PushToTalkButton } from "@/components/PushToTalkButton";
import { TranscriptList } from "@/components/TranscriptList";
import { getLanguageLabel, getSpeechTag, type LanguageCode } from "@/lib/languages";
import type { Speaker, TranslateResponse, TranscriptEntry } from "@/lib/types";
import { getSpeechRecognitionConstructor, type SpeechRecognitionLike } from "@/lib/web-speech";

type AppMode = "setup" | "interview";

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

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const speakerRef = useRef<Speaker | null>(null);
  const shouldSubmitRef = useRef(false);

  function startRecording(speaker: Speaker) {
    if (activeSpeaker || processingSpeaker) {
      return;
    }

    setError(null);

    try {
      const Recognition = getSpeechRecognitionConstructor();

      if (!Recognition) {
        throw new Error("Dieser Browser unterstuetzt Spracheingabe nicht. Bitte Chrome oder Edge verwenden.");
      }

      const recognition = new Recognition();
      const sourceLanguage = speaker === "customer" ? languageA : languageB;

      transcriptRef.current = "";
      recognitionRef.current = recognition;
      speakerRef.current = speaker;
      shouldSubmitRef.current = false;

      recognition.lang = getSpeechTag(sourceLanguage);
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let finalText = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];

          if (result.isFinal) {
            finalText += result[0].transcript;
          }
        }

        if (finalText.trim()) {
          transcriptRef.current = `${transcriptRef.current} ${finalText}`.trim();
        }
      };

      recognition.onerror = (event) => {
        setError(`Spracheingabe fehlgeschlagen: ${event.error}`);
        setStatus("Bereit fuer das Interview.");
        setActiveSpeaker(null);
        setProcessingSpeaker(null);
      };

      recognition.onend = () => {
        const shouldSubmit = shouldSubmitRef.current;
        const text = transcriptRef.current.trim();
        const currentSpeaker = speakerRef.current;

        recognitionRef.current = null;
        speakerRef.current = null;
        shouldSubmitRef.current = false;
        setActiveSpeaker(null);

        if (shouldSubmit && currentSpeaker) {
          void submitTranscript(currentSpeaker, text);
        }
      };

      recognition.start();
      setActiveSpeaker(speaker);
      setStatus(`${speakerLabel(speaker)} spricht...`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Mikrofonzugriff ist nicht verfuegbar.";
      setError(message);
      setStatus("Bereit fuer das Interview.");
    }
  }

  function stopRecording() {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

    shouldSubmitRef.current = true;
    recognition.stop();
  }

  async function submitTranscript(speaker: Speaker, originalText: string) {
    if (!originalText) {
      setStatus("Bereit fuer das Interview.");
      setError("Es wurde keine Sprache erkannt. Bitte Taste gedrueckt halten und erneut sprechen.");
      return;
    }

    setProcessingSpeaker(speaker);
    setStatus("Uebersetze mit OpenRouter und spiele Audio ab...");

    try {
      const response = await fetch("/api/interview-turn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          speaker,
          originalText,
          languageA,
          languageB
        })
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

      speak(result.translatedText, result.targetLanguage);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unbekannter Fehler.";
      setError(message);
      setStatus("Bereit fuer das Interview.");
    } finally {
      setProcessingSpeaker(null);
    }
  }

  function speak(text: string, language: LanguageCode) {
    if (!("speechSynthesis" in window)) {
      setStatus("Bereit fuer die naechste Antwort.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechTag(language);
    utterance.rate = 0.96;
    utterance.onend = () => setStatus("Bereit fuer die naechste Antwort.");
    utterance.onerror = () => setStatus("Bereit fuer die naechste Antwort.");

    window.speechSynthesis.speak(utterance);
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
            <p>Spracheingabe und Audioausgabe laufen im Browser. An die API wird nur erkannter Text zur Uebersetzung gesendet.</p>
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
