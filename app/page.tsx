"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Download,
  FileText,
  Keyboard,
  Languages,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { LanguagePicker } from "@/components/LanguagePicker";
import { PushToTalkButton as SpeakerCard } from "@/components/PushToTalkButton";
import { TranscriptList } from "@/components/TranscriptList";
import {
  getLanguageFlag,
  getLanguageLabel,
  getSpeechTag,
  type LanguageCode
} from "@/lib/languages";
import type { Speaker, TranscriptEntry, TranslateResponse } from "@/lib/types";
import { getSpeechRecognitionConstructor, type SpeechRecognitionLike } from "@/lib/web-speech";

type AppMode = "setup" | "interview";
type TranscriptView = "translated" | "original";
type TranslationJob = {
  speaker: Speaker;
  text: string;
  langA: LanguageCode;
  langB: LanguageCode;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function speakerLabel(speaker: Speaker) {
  return speaker === "customer" ? "Kunde" : "Bewerber";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function Home() {
  const [mode, setMode] = useState<AppMode>("setup");
  const [languageA, setLanguageA] = useState<LanguageCode>("de");
  const [languageB, setLanguageB] = useState<LanguageCode>("fr");
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<Speaker | null>(null);
  const [translationsInFlight, setTranslationsInFlight] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [translationConsent, setTranslationConsent] = useState(false);
  const [speechConsent, setSpeechConsent] = useState(true);
  const [transcriptView, setTranscriptView] = useState<TranscriptView>("translated");
  const [interimText, setInterimText] = useState<Record<Speaker, string>>({
    customer: "",
    candidate: ""
  });
  const [manualText, setManualText] = useState<Record<Speaker, string>>({
    customer: "",
    candidate: ""
  });
  const [voicesReady, setVoicesReady] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sessionActiveRef = useRef(false);
  const speakerRef = useRef<Speaker | null>(null);
  const speechQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const speechActiveRef = useRef(false);
  const translationQueueRef = useRef<TranslationJob[]>([]);
  const isTranslatingRef = useRef(false);
  const activeSpeakerRef = useRef<Speaker | null>(null);

  activeSpeakerRef.current = activeSpeaker;

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const refresh = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesReady(true);
      }
    };

    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, []);

  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function startRecognitionInstance() {
    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      setError("Dieser Browser unterstützt Spracheingabe nicht. Bitte Chrome oder Edge nutzen.");
      sessionActiveRef.current = false;
      setActiveSpeaker(null);
      return;
    }

    const speaker = speakerRef.current;
    if (!speaker) {
      return;
    }

    const recognition = new Recognition();
    recognition.lang = getSpeechTag(speaker === "customer" ? languageA : languageB);
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0].transcript;
        if (result.isFinal) {
          const finalText = text.trim();
          if (finalText) {
            enqueueTranslation(speaker, finalText);
          }
        } else {
          interim += text;
        }
      }
      setInterimText((current) => ({ ...current, [speaker]: interim }));
    };

    recognition.onerror = (event) => {
      const code = event.error;
      if (code === "not-allowed" || code === "service-not-allowed") {
        setError("Mikrofonzugriff wurde blockiert. Bitte Berechtigung im Browser erteilen.");
        sessionActiveRef.current = false;
      } else if (code === "audio-capture") {
        setError("Kein Mikrofon erkannt. Bitte Eingabegerät prüfen.");
        sessionActiveRef.current = false;
      } else if (code === "language-not-supported") {
        setError("Diese Sprache wird vom Browser für die Spracherkennung nicht unterstützt.");
        sessionActiveRef.current = false;
      } else if (code !== "no-speech" && code !== "aborted") {
        setError(`Spracheingabe: ${code}`);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (sessionActiveRef.current) {
        window.setTimeout(() => {
          if (sessionActiveRef.current) {
            startRecognitionInstance();
          }
        }, 250);
      } else {
        speakerRef.current = null;
        setActiveSpeaker(null);
        setInterimText({ customer: "", candidate: "" });
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      // already started
    }
  }

  function startSession(speaker: Speaker) {
    if (activeSpeaker) {
      return;
    }

    if (!speechConsent) {
      setError("Spracheingabe ist deaktiviert. Bitte im Datenschutz-Bereich aktivieren.");
      return;
    }

    if (!translationConsent) {
      setError("Bitte zuerst die Übersetzungs-Zustimmung im Datenschutz-Bereich aktivieren.");
      return;
    }

    setError(null);
    speakerRef.current = speaker;
    sessionActiveRef.current = true;
    setActiveSpeaker(speaker);
    setInterimText({ customer: "", candidate: "" });
    startRecognitionInstance();
  }

  function stopSession() {
    sessionActiveRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    } else {
      speakerRef.current = null;
      setActiveSpeaker(null);
      setInterimText({ customer: "", candidate: "" });
    }
  }

  function toggleSession(speaker: Speaker) {
    if (activeSpeaker === speaker) {
      stopSession();
      return;
    }
    if (activeSpeaker) {
      return;
    }
    startSession(speaker);
  }

  function enqueueTranslation(speaker: Speaker, text: string) {
    if (!translationConsent) {
      setError("Bitte zuerst die Übersetzungs-Zustimmung aktivieren.");
      return;
    }

    translationQueueRef.current.push({
      speaker,
      text,
      langA: languageA,
      langB: languageB
    });
    setTranslationsInFlight((value) => value + 1);
    void processTranslationQueue();
  }

  async function processTranslationQueue() {
    if (isTranslatingRef.current) {
      return;
    }
    isTranslatingRef.current = true;

    while (translationQueueRef.current.length > 0) {
      const job = translationQueueRef.current.shift();
      if (job) {
        await translateChunk(job);
      }
      setTranslationsInFlight((value) => Math.max(0, value - 1));
    }

    isTranslatingRef.current = false;
  }

  async function readApiResponse(response: Response) {
    const raw = await response.text();

    if (!raw.trim()) {
      return {
        data: null,
        error: "Leere Antwort vom Server. Bitte Verbindung und API-Konfiguration prüfen."
      };
    }

    try {
      return {
        data: JSON.parse(raw) as TranslateResponse | { error?: string },
        error: null
      };
    } catch {
      return {
        data: null,
        error: raw.slice(0, 240) || "Serverantwort konnte nicht gelesen werden."
      };
    }
  }

  async function translateChunk(job: TranslationJob) {
    try {
      const response = await fetch("/api/interview-turn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          speaker: job.speaker,
          originalText: job.text,
          languageA: job.langA,
          languageB: job.langB
        })
      });

      const { data, error: parseError } = await readApiResponse(response);

      if (parseError || !data) {
        throw new Error(parseError ?? "Übersetzung fehlgeschlagen.");
      }

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Übersetzung fehlgeschlagen.");
      }

      const result = data as TranslateResponse;

      setEntries((current) => [
        {
          id: createId(),
          createdAt: new Date().toISOString(),
          turnNumber: current.length + 1,
          speaker: result.speaker,
          originalText: result.originalText,
          translatedText: result.translatedText,
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage
        },
        ...current
      ]);

      speak(result.translatedText, result.targetLanguage);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Übersetzung fehlgeschlagen.";
      setError(message);
    }
  }

  function submitManualTranscript(speaker: Speaker) {
    const text = manualText[speaker].trim();

    if (!text) {
      setError("Bitte zuerst Text eingeben.");
      return;
    }

    setManualText((current) => ({ ...current, [speaker]: "" }));
    enqueueTranslation(speaker, text);
  }

  function resolveSpeechVoice(language: LanguageCode) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return null;
    }

    const preferredTag = getSpeechTag(language).toLowerCase();
    const normalized = preferredTag.split("-")[0];
    const voices = window.speechSynthesis.getVoices();

    return (
      voices.find((voice) => voice.lang.toLowerCase() === preferredTag) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith(`${normalized}-`)) ??
      voices.find((voice) => voice.lang.toLowerCase() === normalized) ??
      null
    );
  }

  function flushSpeechQueue() {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || speechActiveRef.current) {
      return;
    }

    const next = speechQueueRef.current.shift();
    if (!next) {
      return;
    }

    speechActiveRef.current = true;
    next.onend = () => {
      speechActiveRef.current = false;
      flushSpeechQueue();
    };
    next.onerror = () => {
      speechActiveRef.current = false;
      flushSpeechQueue();
    };
    window.speechSynthesis.speak(next);
  }

  function speak(text: string, language: LanguageCode) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechTag(language);
    utterance.voice = resolveSpeechVoice(language);
    utterance.rate = 0.98;
    speechQueueRef.current.push(utterance);

    flushSpeechQueue();
  }

  function exitInterview() {
    sessionActiveRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    speakerRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speechQueueRef.current = [];
    speechActiveRef.current = false;
    translationQueueRef.current = [];
    setActiveSpeaker(null);
    setInterimText({ customer: "", candidate: "" });
    setMode("setup");
  }

  function exportTranscript() {
    const orderedEntries = entries.slice().reverse();
    const startedAt = orderedEntries[0]?.createdAt;
    const endedAt = orderedEntries.at(-1)?.createdAt;
    const customerTurns = orderedEntries.filter((entry) => entry.speaker === "customer").length;
    const candidateTurns = orderedEntries.filter((entry) => entry.speaker === "candidate").length;

    const header = [
      "RSG Translate – Interview-Transkript",
      `Kunde: ${getLanguageLabel(languageA)}`,
      `Bewerber: ${getLanguageLabel(languageB)}`,
      startedAt ? `Beginn: ${formatDateTime(startedAt)}` : "Beginn: –",
      endedAt ? `Letzter Beitrag: ${formatDateTime(endedAt)}` : "Letzter Beitrag: –",
      `Beiträge: ${orderedEntries.length} gesamt · ${customerTurns} Kunde · ${candidateTurns} Bewerber`,
      "Hinweis: Lokal im Browser erzeugt. Backend speichert keinen Verlauf."
    ].join("\n");

    const lines = orderedEntries
      .map((entry) =>
        [
          `[${formatDateTime(entry.createdAt)}] ${speakerLabel(entry.speaker)} #${entry.turnNumber}`,
          `Gesprochen (${getLanguageLabel(entry.sourceLanguage)}): ${entry.originalText}`,
          `Übersetzung (${getLanguageLabel(entry.targetLanguage)}): ${entry.translatedText}`
        ].join("\n")
      )
      .join("\n\n");

    const blob = new Blob([`${header}\n\n${lines || "Noch kein Interview-Transkript vorhanden."}`], {
      type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rsg-translate-transkript.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (mode === "setup") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6 sm:max-w-3xl sm:px-6 sm:py-12">
        <section className="flex flex-1 flex-col justify-center">
          <div className="mb-8">
            <div className="mb-5 inline-flex size-16 items-center justify-center rounded-3xl bg-zinc-950 text-white shadow-[0_20px_50px_-15px_rgba(15,23,42,0.55)]">
              <Languages className="size-8" aria-hidden="true" />
            </div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600 ring-1 ring-zinc-200 backdrop-blur">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Recruiting Live-Interpreter
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-6xl">
              RSG Translate
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600 sm:mt-5 sm:text-lg">
              Sprachen wählen, Live-Modus starten, sprechen. Übersetzung erscheint und wird vorgelesen, während gesprochen
              wird – keine Aufnahme-Tasten halten.
            </p>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <LanguagePicker id="language-a" label="Kunde spricht" hint="Sprache 1" value={languageA} onChange={setLanguageA} />
              <LanguagePicker id="language-b" label="Bewerber spricht" hint="Sprache 2" value={languageB} onChange={setLanguageB} />
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
              <div className="mb-3 flex items-center gap-2">
                <LockKeyhole className="size-5 text-zinc-700" aria-hidden="true" />
                <p className="text-sm font-semibold text-zinc-950">Datenschutz</p>
              </div>
              <label className="flex gap-3 text-sm leading-6 text-zinc-700">
                <input
                  type="checkbox"
                  checked={translationConsent}
                  onChange={(event) => setTranslationConsent(event.target.checked)}
                  className="mt-1 size-4 accent-zinc-950"
                />
                <span>
                  Ich habe die Teilnehmenden informiert und darf erkannten Interviewtext zur Übersetzung an OpenRouter
                  senden.
                </span>
              </label>
              <label className="mt-3 flex gap-3 text-sm leading-6 text-zinc-700">
                <input
                  type="checkbox"
                  checked={speechConsent}
                  onChange={(event) => setSpeechConsent(event.target.checked)}
                  className="mt-1 size-4 accent-zinc-950"
                />
                <span>
                  Spracheingabe aktivieren. Je nach Browser kann Audio zur Spracherkennung vom Browser-Anbieter verarbeitet
                  werden.
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!translationConsent) {
                  setError("Bitte zuerst die Übersetzungs-Zustimmung aktivieren.");
                  return;
                }
                setError(null);
                setMode("interview");
              }}
              disabled={!translationConsent}
              className="group mt-6 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-base font-semibold text-white shadow-[0_20px_50px_-15px_rgba(15,23,42,0.55)] transition hover:bg-zinc-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
            >
              Live-Interview starten
              <ArrowRight className="size-5 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
            {error ? (
              <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 text-sm leading-6 text-zinc-700">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-700" aria-hidden="true" />
              <p>
                Kein Audio an unseren Server. Nur erkannter oder eingegebener Text wird zur Übersetzung übertragen, kein
                Verlauf gespeichert.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 text-sm leading-6 text-zinc-700">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-zinc-700" aria-hidden="true" />
              <p>
                Acht Sprachen: Deutsch, Französisch, Englisch, Spanisch, Italienisch, Türkisch, Arabisch, Serbisch.
                Browser-Empfehlung: Chrome oder Edge.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const liveStatus = activeSpeaker
    ? `Live · ${speakerLabel(activeSpeaker)} (${getLanguageLabel(activeSpeaker === "customer" ? languageA : languageB)})`
    : translationsInFlight > 0
      ? `Übersetze ${translationsInFlight} Beitrag${translationsInFlight === 1 ? "" : "e"}…`
      : "Bereit – einen Sprecher antippen, um den Live-Modus zu starten.";

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-10 pt-4 sm:max-w-5xl sm:px-6 sm:pb-14 sm:pt-6">
      <header className="no-print sticky top-0 z-30 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-zinc-200/70 bg-white/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
            <Languages className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">RSG Translate</p>
            <p className="text-base font-semibold leading-tight text-zinc-950">
              {getLanguageFlag(languageA)} {getLanguageLabel(languageA)} ⇄ {getLanguageLabel(languageB)} {getLanguageFlag(languageB)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={exitInterview}
          className="flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white/95 px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          aria-label="Interview beenden"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Beenden
        </button>
      </header>

      <section className="no-print mb-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/85 px-4 py-3 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)] backdrop-blur">
        <div className="flex items-center gap-2.5">
          {activeSpeaker ? (
            <span className="live-dot" aria-hidden="true" />
          ) : translationsInFlight > 0 ? (
            <LoaderCircle className="size-4 animate-spin text-zinc-700" aria-hidden="true" />
          ) : (
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
          )}
          <p className="text-sm font-semibold text-zinc-800">{liveStatus}</p>
        </div>
        <p className="hidden text-xs font-medium text-zinc-500 sm:block">
          {voicesReady ? "Stimmen geladen" : "Stimmen werden geladen…"}
        </p>
      </section>

      {error ? (
        <div className="no-print mb-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="no-print grid gap-3 sm:grid-cols-2">
        <SpeakerCard
          speaker="customer"
          name={`Sprache ${getLanguageLabel(languageA)}`}
          sourceFlag={getLanguageFlag(languageA)}
          targetFlag={getLanguageFlag(languageB)}
          sourceLabel={getLanguageLabel(languageA)}
          targetLabel={getLanguageLabel(languageB)}
          active={activeSpeaker === "customer"}
          disabled={Boolean(activeSpeaker && activeSpeaker !== "customer")}
          interimText={interimText.customer}
          onToggle={() => toggleSession("customer")}
        />
        <SpeakerCard
          speaker="candidate"
          name={`Sprache ${getLanguageLabel(languageB)}`}
          sourceFlag={getLanguageFlag(languageB)}
          targetFlag={getLanguageFlag(languageA)}
          sourceLabel={getLanguageLabel(languageB)}
          targetLabel={getLanguageLabel(languageA)}
          active={activeSpeaker === "candidate"}
          disabled={Boolean(activeSpeaker && activeSpeaker !== "candidate")}
          interimText={interimText.candidate}
          onToggle={() => toggleSession("candidate")}
        />
      </section>

      <details className="no-print mt-4 rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.2)] backdrop-blur">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-zinc-950">
          <span className="flex items-center gap-2">
            <Keyboard className="size-5 text-zinc-500" aria-hidden="true" />
            Texteingabe als Backup
          </span>
          <ChevronDown className="size-5 text-zinc-500" aria-hidden="true" />
        </summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["customer", "candidate"] as Speaker[]).map((speaker) => {
            const language = speaker === "customer" ? languageA : languageB;
            return (
              <div key={speaker} className="rounded-2xl border border-zinc-200 bg-white p-3">
                <p className="mb-2 text-sm font-semibold text-zinc-950">
                  {speakerLabel(speaker)} · {getLanguageLabel(language)}
                </p>
                <textarea
                  value={manualText[speaker]}
                  onChange={(event) =>
                    setManualText((current) => ({ ...current, [speaker]: event.target.value }))
                  }
                  rows={2}
                  placeholder={`Text in ${getLanguageLabel(language)} eingeben`}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white/90 px-3 py-3 text-base text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/10"
                />
                <button
                  type="button"
                  onClick={() => submitManualTranscript(speaker)}
                  disabled={!translationConsent}
                  className="mt-3 h-11 w-full rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  Übersetzen
                </button>
              </div>
            );
          })}
        </div>
      </details>

      <section className="print-surface mt-5 rounded-3xl border border-white/80 bg-white/85 p-4 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.3)] backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <FileText className="size-5 text-zinc-500" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-zinc-950">Live-Transkript</h2>
            </div>
            <p className="text-sm font-medium text-zinc-500">
              {entries.length} Beiträge · neueste zuerst
            </p>
          </div>
          <div className="no-print flex gap-2">
            <button
              type="button"
              onClick={exportTranscript}
              className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white/90 px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40"
              disabled={entries.length === 0}
            >
              <Download className="size-4" aria-hidden="true" />
              TXT
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-40"
              disabled={entries.length === 0}
            >
              PDF
            </button>
          </div>
        </div>

        <div className="no-print mb-4 flex rounded-2xl border border-zinc-200 bg-white/95 p-1">
          <button
            type="button"
            onClick={() => setTranscriptView("translated")}
            className={[
              "flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition",
              transcriptView === "translated" ? "bg-zinc-950 text-white" : "text-zinc-600"
            ].join(" ")}
          >
            Mit Übersetzung
          </button>
          <button
            type="button"
            onClick={() => setTranscriptView("original")}
            className={[
              "flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition",
              transcriptView === "original" ? "bg-zinc-950 text-white" : "text-zinc-600"
            ].join(" ")}
          >
            Nur Gesprochenes
          </button>
        </div>

        <TranscriptList entries={entries.slice().reverse()} showTranslated={transcriptView === "translated"} />
      </section>
    </main>
  );
}
