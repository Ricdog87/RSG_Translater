"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FileText,
  Keyboard,
  Languages,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ShieldCheck
} from "lucide-react";
import { LanguagePicker } from "@/components/LanguagePicker";
import { PushToTalkButton } from "@/components/PushToTalkButton";
import { TranscriptList } from "@/components/TranscriptList";
import { getLanguageLabel, getSpeechTag, type LanguageCode } from "@/lib/languages";
import type { Speaker, TranslateResponse, TranscriptEntry } from "@/lib/types";
import { getSpeechRecognitionConstructor, type SpeechRecognitionLike } from "@/lib/web-speech";

type AppMode = "setup" | "interview";
type TranscriptView = "translated" | "original";

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
  const [processingSpeaker, setProcessingSpeaker] = useState<Speaker | null>(null);
  const [status, setStatus] = useState("Bereit für das Interview.");
  const [error, setError] = useState<string | null>(null);
  const [translationConsent, setTranslationConsent] = useState(false);
  const [speechConsent, setSpeechConsent] = useState(true);
  const [transcriptView, setTranscriptView] = useState<TranscriptView>("translated");
  const [interviewTitle, setInterviewTitle] = useState("Recruiting Interview");
  const [customerName, setCustomerName] = useState("Kunde");
  const [candidateName, setCandidateName] = useState("Bewerber");
  const [manualText, setManualText] = useState<Record<Speaker, string>>({
    customer: "",
    candidate: ""
  });

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const speechActiveRef = useRef(false);
  const transcriptRef = useRef("");
  const speakerRef = useRef<Speaker | null>(null);
  const shouldSubmitRef = useRef(false);
  const isSubmittingRef = useRef(false);

  function startRecording(speaker: Speaker) {
    if (activeSpeaker || processingSpeaker) {
      return;
    }

    setError(null);

    try {
      if (!speechConsent) {
        throw new Error("Spracheingabe ist deaktiviert. Bitte Datenschutz-Hinweis bestätigen oder Text manuell eingeben.");
      }

      const Recognition = getSpeechRecognitionConstructor();

      if (!Recognition) {
        throw new Error("Dieser Browser unterstützt Spracheingabe nicht. Bitte Chrome oder Edge verwenden.");
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
        setStatus("Bereit für das Interview.");
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
      setStatus(`${speakerLabel(speaker)} spricht. Nach dem Loslassen wird sofort übersetzt.`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Mikrofonzugriff ist nicht verfügbar.";
      setError(message);
      setStatus("Bereit für das Interview.");
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

  async function submitTranscript(speaker: Speaker, originalText: string) {
    if (isSubmittingRef.current) {
      return;
    }

    if (!originalText) {
      setStatus("Bereit für das Interview.");
      setError("Es wurde keine Sprache erkannt. Bitte Taste gedrückt halten und erneut sprechen.");
      return;
    }

    if (!translationConsent) {
      setStatus("Bereit für das Interview.");
      setError("Bitte zuerst bestätigen, dass erkannter Text zur Übersetzung an OpenRouter gesendet werden darf.");
      return;
    }

    isSubmittingRef.current = true;
    setProcessingSpeaker(speaker);
    setStatus("Übersetze und spiele die Antwort vor...");

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

      const { data, error: parseError } = await readApiResponse(response);

      if (parseError || !data) {
        throw new Error(parseError ?? "Übersetzung fehlgeschlagen.");
      }

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Übersetzung fehlgeschlagen.");
      }

      const result = data as TranslateResponse;
      const createdAt = new Date().toISOString();

      setEntries((current) => [
        {
          id: createId(),
          createdAt,
          turnNumber: current.length + 1,
          speaker: result.speaker,
          originalText: result.originalText,
          translatedText: result.translatedText,
          sourceLanguage: result.sourceLanguage,
          targetLanguage: result.targetLanguage
        },
        ...current
      ]);
      setStatus("Übersetzung wird abgespielt.");

      speak(result.translatedText, result.targetLanguage);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unbekannter Fehler.";
      setError(message);
      setStatus("Bereit für das Interview.");
    } finally {
      isSubmittingRef.current = false;
      setProcessingSpeaker(null);
    }
  }

  function submitManualTranscript(speaker: Speaker) {
    const text = manualText[speaker].trim();

    if (!text) {
      setError("Bitte zuerst Text eingeben.");
      return;
    }

    setManualText((current) => ({
      ...current,
      [speaker]: ""
    }));
    void submitTranscript(speaker, text);
  }

  function resolveSpeechVoice(language: LanguageCode) {
    if (!("speechSynthesis" in window)) {
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
    if (!("speechSynthesis" in window) || speechActiveRef.current) {
      return;
    }

    const next = speechQueueRef.current.shift();

    if (!next) {
      setStatus("Bereit für die nächste Antwort.");
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
    if (!("speechSynthesis" in window)) {
      setStatus("Bereit für die nächste Antwort.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechTag(language);
    utterance.voice = resolveSpeechVoice(language);
    utterance.rate = 0.96;
    speechQueueRef.current.push(utterance);

    setStatus("Übersetzung wird vorgelesen...");
    flushSpeechQueue();
  }

  function exportTranscript() {
    const orderedEntries = entries.slice().reverse();
    const startedAt = orderedEntries[0]?.createdAt;
    const endedAt = orderedEntries.at(-1)?.createdAt;
    const customerTurns = orderedEntries.filter((entry) => entry.speaker === "customer").length;
    const candidateTurns = orderedEntries.filter((entry) => entry.speaker === "candidate").length;

    const header = [
      "RSG Translate - Interview-Transkript",
      `Titel: ${interviewTitle}`,
      `Kunde: ${customerName} (${getLanguageLabel(languageA)})`,
      `Bewerber: ${candidateName} (${getLanguageLabel(languageB)})`,
      startedAt ? `Beginn: ${formatDateTime(startedAt)}` : "Beginn: -",
      endedAt ? `Letzter Beitrag: ${formatDateTime(endedAt)}` : "Letzter Beitrag: -",
      `Beiträge: ${orderedEntries.length} gesamt, ${customerTurns} Kunde, ${candidateTurns} Bewerber`,
      "Hinweis: Dieses Transkript wird lokal im Browser erzeugt. Das Backend speichert keinen Verlauf."
    ].join("\n");

    const lines = entries
      .slice()
      .reverse()
      .map((entry) => {
        return [
          `[${formatDateTime(entry.createdAt)}] ${speakerLabel(entry.speaker)} #${entry.turnNumber}`,
          `Gesprochen (${getLanguageLabel(entry.sourceLanguage)}): ${entry.originalText}`,
          `Übersetzung (${getLanguageLabel(entry.targetLanguage)}): ${entry.translatedText}`
        ].join("\n");
      })
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
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5 sm:max-w-3xl sm:px-5 sm:py-10">
        <section className="flex flex-1 flex-col justify-center">
          <div className="mb-7">
            <div className="mb-5 flex size-14 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-[0_16px_40px_rgba(24,24,27,0.16)]">
              <Languages className="size-7" aria-hidden="true" />
            </div>
            <p className="mb-3 text-sm font-semibold uppercase text-zinc-500">Recruiting Interpreter</p>
            <h1 className="text-4xl font-semibold leading-none text-zinc-950 sm:text-6xl">RSG Translate</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600 sm:mt-5 sm:text-lg">
              Zwei Sprachen wählen, Taste halten, sprechen. Die App übersetzt und liest die Antwort direkt vor.
            </p>
          </div>

          <div className="print-surface rounded-lg border border-white/80 bg-white/80 p-4 shadow-[0_24px_70px_rgba(24,24,27,0.10)] backdrop-blur-xl sm:p-6">
            <div className="grid gap-3 sm:gap-4">
              <LanguagePicker id="language-a" label="Sprache Kunde" value={languageA} onChange={setLanguageA} />
              <LanguagePicker id="language-b" label="Sprache Bewerber" value={languageB} onChange={setLanguageB} />
            </div>

            <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
              <div className="mb-3 flex items-center gap-2">
                <LockKeyhole className="size-5 text-zinc-700" aria-hidden="true" />
                <p className="text-sm font-semibold text-zinc-950">Datenschutzmodus</p>
              </div>
              <label className="flex gap-3 text-sm leading-6 text-zinc-700">
                <input
                  type="checkbox"
                  checked={translationConsent}
                  onChange={(event) => setTranslationConsent(event.target.checked)}
                  className="mt-1 size-4 accent-zinc-950"
                />
                <span>
                  Ich habe die Teilnehmenden informiert und darf erkannten Interviewtext zur Übersetzung an OpenRouter senden.
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
                  Spracheingabe aktivieren. Je nach Browser kann Audio zur Spracherkennung vom Browser-Anbieter verarbeitet werden.
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setMode("interview")}
              disabled={!translationConsent}
              className="mt-6 h-14 w-full rounded-lg bg-zinc-950 px-5 text-base font-semibold text-white shadow-[0_16px_42px_rgba(24,24,27,0.16)] transition hover:bg-zinc-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:text-lg"
            >
              Interview starten
            </button>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-200/70 bg-blue-50/70 p-4 text-sm leading-6 text-zinc-700">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>
              Es wird kein Audio an den App-Server gesendet und es wird nichts gespeichert. Zur Übersetzung wird nur erkannter oder
              eingegebener Text übertragen.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-4 sm:max-w-5xl sm:px-6 sm:py-7">
      <header className="no-print mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-zinc-500">RSG Translate</p>
          <h1 className="text-2xl font-semibold text-zinc-950 sm:text-3xl">Interview</h1>
          <p className="mt-1 text-sm font-medium leading-5 text-zinc-600">
            {interviewTitle} · {customerName}: {getLanguageLabel(languageA)} · {candidateName}: {getLanguageLabel(languageB)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMode("setup");
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            speechQueueRef.current = [];
            speechActiveRef.current = false;
            setStatus("Bereit für das Interview.");
          }}
          className="flex size-11 items-center justify-center rounded-lg border border-zinc-200 bg-white/90 text-zinc-700 shadow-[0_8px_24px_rgba(24,24,27,0.08)] backdrop-blur"
          aria-label="Sprachen ändern"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
        </button>
      </header>

      <section className="no-print mb-3 rounded-lg border border-zinc-200 bg-white/85 p-4 shadow-[0_10px_28px_rgba(24,24,27,0.06)] backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase text-zinc-400">Live-Modus</p>
        <h2 className="mt-1 text-xl font-semibold leading-tight text-zinc-950">Taste gedrückt halten und direkt sprechen.</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Loslassen übersetzt den Beitrag in die andere Sprache und liest ihn automatisch vor. Neue Antworten werden direkt in
          einer Audio-Warteschlange abgespielt.
        </p>
      </section>

      <section className="no-print grid gap-3 sm:grid-cols-2">
        <PushToTalkButton
          speaker="customer"
          label={`${customerName} spricht`}
          hint={`Hier in ${getLanguageLabel(languageA)} reinsprechen`}
          languageLine={`${getLanguageLabel(languageA)} → ${getLanguageLabel(languageB)}`}
          active={activeSpeaker === "customer"}
          disabled={Boolean(activeSpeaker || processingSpeaker) || !speechConsent}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <PushToTalkButton
          speaker="candidate"
          label={`${candidateName} spricht`}
          hint={`Hier in ${getLanguageLabel(languageB)} reinsprechen`}
          languageLine={`${getLanguageLabel(languageB)} → ${getLanguageLabel(languageA)}`}
          active={activeSpeaker === "candidate"}
          disabled={Boolean(activeSpeaker || processingSpeaker) || !speechConsent}
          onStart={startRecording}
          onStop={stopRecording}
        />
      </section>

      <section className="no-print mt-4 rounded-lg border border-white/80 bg-white/80 p-4 shadow-[0_12px_32px_rgba(24,24,27,0.07)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {processingSpeaker ? <LoaderCircle className="size-5 animate-spin text-zinc-700" aria-hidden="true" /> : null}
          <p className="text-sm font-semibold text-zinc-800">{status}</p>
        </div>
        {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          Keine Speicherung im Backend. Zur Übersetzung wird nur der angezeigte Text gesendet, kein Audio und kein Verlauf.
        </p>
      </section>

      <details className="no-print mt-4 rounded-lg border border-zinc-200 bg-white/80 p-4 shadow-[0_12px_32px_rgba(24,24,27,0.06)] backdrop-blur-xl">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-zinc-950">
          <span className="flex items-center gap-2">
            <Keyboard className="size-5 text-zinc-500" aria-hidden="true" />
            Texteingabe als Backup
          </span>
          <ChevronDown className="size-5 text-zinc-500" aria-hidden="true" />
        </summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["customer", "candidate"] as Speaker[]).map((speaker) => (
            <div key={speaker} className="rounded-lg border border-zinc-200 bg-white p-3">
              <p className="mb-2 text-sm font-semibold text-zinc-950">{speakerLabel(speaker)} Text</p>
              <textarea
                value={manualText[speaker]}
                onChange={(event) =>
                  setManualText((current) => ({
                    ...current,
                    [speaker]: event.target.value
                  }))
                }
                rows={2}
                placeholder={`Text in ${getLanguageLabel(speaker === "customer" ? languageA : languageB)} eingeben`}
                className="w-full resize-none rounded-lg border border-zinc-200 bg-white/90 px-3 py-3 text-base text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/10"
              />
              <button
                type="button"
                onClick={() => submitManualTranscript(speaker)}
                disabled={processingSpeaker !== null || !translationConsent}
                className="mt-3 h-11 w-full rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
              >
                Übersetzen
              </button>
            </div>
          ))}
        </div>
      </details>

      <section className="print-surface mt-5 rounded-lg border border-white/80 bg-white/80 p-4 shadow-[0_24px_70px_rgba(24,24,27,0.10)] backdrop-blur-xl sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <FileText className="size-5 text-zinc-500" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-zinc-950">Interview-Transkript</h2>
            </div>
            <p className="text-sm font-medium text-zinc-500">
              {entries.length} Beiträge · {customerName} / {candidateName}
            </p>
          </div>
          <div className="no-print grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={exportTranscript}
              className="flex h-11 min-w-0 items-center justify-center rounded-lg border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40 sm:size-11"
              aria-label="Verlauf als Text exportieren"
              disabled={entries.length === 0}
            >
              <Download className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="h-11 rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-40"
              disabled={entries.length === 0}
            >
              PDF
            </button>
          </div>
        </div>
        <div className="mb-4 grid gap-3 rounded-lg border border-zinc-200 bg-white/90 p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400">Titel</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950">{interviewTitle}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400">Kunde</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950">
              {customerName} · {getLanguageLabel(languageA)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400">Bewerber</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950">
              {candidateName} · {getLanguageLabel(languageB)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400">Status</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950">{entries.length ? "Transkript aktiv" : "Noch leer"}</p>
          </div>
        </div>

        <div className="no-print mb-4 flex rounded-lg border border-zinc-200 bg-white/90 p-1">
          <button
            type="button"
            onClick={() => setTranscriptView("translated")}
            className={[
              "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition",
              transcriptView === "translated" ? "bg-zinc-950 text-white" : "text-zinc-600"
            ].join(" ")}
          >
            Mit Übersetzung
          </button>
          <button
            type="button"
            onClick={() => setTranscriptView("original")}
            className={[
              "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition",
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
