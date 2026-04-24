"use client";

import { useRef, useState } from "react";
import {
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
  const [status, setStatus] = useState("Bereit fuer das Interview.");
  const [error, setError] = useState<string | null>(null);
  const [translationConsent, setTranslationConsent] = useState(false);
  const [speechConsent, setSpeechConsent] = useState(false);
  const [transcriptView, setTranscriptView] = useState<TranscriptView>("translated");
  const [interviewTitle, setInterviewTitle] = useState("Recruiting Interview");
  const [customerName, setCustomerName] = useState("Kunde");
  const [candidateName, setCandidateName] = useState("Bewerber");
  const [manualText, setManualText] = useState<Record<Speaker, string>>({
    customer: "",
    candidate: ""
  });

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
      if (!speechConsent) {
        throw new Error("Spracheingabe ist deaktiviert. Bitte Datenschutz-Hinweis bestaetigen oder Text manuell eingeben.");
      }

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

  async function readApiResponse(response: Response) {
    const raw = await response.text();

    if (!raw.trim()) {
      return {
        data: null,
        error: "Leere Antwort vom Server. Bitte Verbindung und API-Konfiguration pruefen."
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
    if (!originalText) {
      setStatus("Bereit fuer das Interview.");
      setError("Es wurde keine Sprache erkannt. Bitte Taste gedrueckt halten und erneut sprechen.");
      return;
    }

    if (!translationConsent) {
      setStatus("Bereit fuer das Interview.");
      setError("Bitte zuerst bestaetigen, dass erkannter Text zur Uebersetzung an OpenRouter gesendet werden darf.");
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

      const { data, error: parseError } = await readApiResponse(response);

      if (parseError || !data) {
        throw new Error(parseError ?? "Uebersetzung fehlgeschlagen.");
      }

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Uebersetzung fehlgeschlagen.");
      }

      const result = data as TranslateResponse;
      const createdAt = new Date().toISOString();

      const entry: TranscriptEntry = {
        id: createId(),
        createdAt,
        turnNumber: entries.length + 1,
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
      `Beitraege: ${orderedEntries.length} gesamt, ${customerTurns} Kunde, ${candidateTurns} Bewerber`,
      "Hinweis: Dieses Transkript wird lokal im Browser erzeugt. Das Backend speichert keinen Verlauf."
    ].join("\n");

    const lines = entries
      .slice()
      .reverse()
      .map((entry) => {
        return [
          `[${formatDateTime(entry.createdAt)}] ${speakerLabel(entry.speaker)} #${entry.turnNumber}`,
          `Gesprochen (${getLanguageLabel(entry.sourceLanguage)}): ${entry.originalText}`,
          `Uebersetzung (${getLanguageLabel(entry.targetLanguage)}): ${entry.translatedText}`
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
            <div className="mb-5 grid gap-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Interview-Titel</span>
                <input
                  value={interviewTitle}
                  onChange={(event) => setInterviewTitle(event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Kunde</span>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Bewerber</span>
                  <input
                    value={candidateName}
                    onChange={(event) => setCandidateName(event.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-semibold text-slate-950 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4">
              <LanguagePicker id="language-a" label="Sprache Kunde" value={languageA} onChange={setLanguageA} />
              <LanguagePicker id="language-b" label="Sprache Bewerber" value={languageB} onChange={setLanguageB} />
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <LockKeyhole className="size-5 text-teal-700" aria-hidden="true" />
                <p className="text-sm font-black text-slate-950">Datenschutzmodus</p>
              </div>
              <label className="flex gap-3 text-sm leading-6 text-slate-700">
                <input
                  type="checkbox"
                  checked={translationConsent}
                  onChange={(event) => setTranslationConsent(event.target.checked)}
                  className="mt-1 size-4 accent-teal-700"
                />
                <span>
                  Ich habe die Teilnehmenden informiert und darf erkannten Interviewtext zur Uebersetzung an OpenRouter senden.
                </span>
              </label>
              <label className="mt-3 flex gap-3 text-sm leading-6 text-slate-700">
                <input
                  type="checkbox"
                  checked={speechConsent}
                  onChange={(event) => setSpeechConsent(event.target.checked)}
                  className="mt-1 size-4 accent-teal-700"
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
              className="mt-6 h-16 w-full rounded-lg bg-slate-950 px-5 text-lg font-bold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Interview starten
            </button>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-lg border border-teal-900/10 bg-teal-50/80 p-4 text-sm leading-6 text-teal-950">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>
              Standardmaessig wird kein Audio an den App-Server gesendet und es wird nichts gespeichert. Fuer DSGVO-Tests am saubersten:
              manuelle Texteingabe nutzen oder einen geprueften EU-STT-Anbieter anbinden.
            </p>
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
            {interviewTitle} · {customerName}: {getLanguageLabel(languageA)} · {candidateName}: {getLanguageLabel(languageB)}
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
          disabled={Boolean(activeSpeaker || processingSpeaker) || !speechConsent}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <PushToTalkButton
          speaker="candidate"
          label="Bewerber spricht"
          hint={`Aufnehmen in ${getLanguageLabel(languageB)}`}
          active={activeSpeaker === "candidate"}
          disabled={Boolean(activeSpeaker || processingSpeaker) || !speechConsent}
          onStart={startRecording}
          onStop={stopRecording}
        />
      </section>

      <section className="no-print mt-4 grid gap-3 sm:grid-cols-2">
        {(["customer", "candidate"] as Speaker[]).map((speaker) => (
          <div key={speaker} className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Keyboard className="size-5 text-teal-700" aria-hidden="true" />
              <p className="text-sm font-black text-slate-950">{speakerLabel(speaker)} Text</p>
            </div>
            <textarea
              value={manualText[speaker]}
              onChange={(event) =>
                setManualText((current) => ({
                  ...current,
                  [speaker]: event.target.value
                }))
              }
              rows={3}
              placeholder={`Text in ${getLanguageLabel(speaker === "customer" ? languageA : languageB)} eingeben`}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15"
            />
            <button
              type="button"
              onClick={() => submitManualTranscript(speaker)}
              disabled={processingSpeaker !== null || !translationConsent}
              className="mt-3 h-11 w-full rounded-lg bg-slate-950 px-4 text-sm font-bold text-white shadow-sm disabled:opacity-50"
            >
              Uebersetzen
            </button>
          </div>
        ))}
      </section>

      <section className="no-print mt-4 rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {processingSpeaker ? <LoaderCircle className="size-5 animate-spin text-teal-700" aria-hidden="true" /> : null}
          <p className="text-sm font-bold text-slate-800">{status}</p>
        </div>
        {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Keine Speicherung im Backend. Zur Uebersetzung wird nur der angezeigte Text gesendet, kein Audio und kein Verlauf.
        </p>
      </section>

      <section className="print-surface mt-5 rounded-lg border border-white/80 bg-white/72 p-4 shadow-xl shadow-slate-900/8 backdrop-blur sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Interview-Transkript</h2>
            <p className="text-sm font-medium text-slate-500">
              {entries.length} Beitraege · {customerName} / {candidateName}
            </p>
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
        <div className="mb-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Titel</p>
            <p className="mt-1 text-sm font-bold text-slate-950">{interviewTitle}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Kunde</p>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {customerName} · {getLanguageLabel(languageA)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Bewerber</p>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {candidateName} · {getLanguageLabel(languageB)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Status</p>
            <p className="mt-1 text-sm font-bold text-slate-950">{entries.length ? "Transkript aktiv" : "Noch leer"}</p>
          </div>
        </div>

        <div className="no-print mb-4 flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTranscriptView("translated")}
            className={[
              "flex-1 rounded-md px-3 py-2 text-sm font-bold transition",
              transcriptView === "translated" ? "bg-teal-700 text-white" : "text-slate-600"
            ].join(" ")}
          >
            Mit Uebersetzung
          </button>
          <button
            type="button"
            onClick={() => setTranscriptView("original")}
            className={[
              "flex-1 rounded-md px-3 py-2 text-sm font-bold transition",
              transcriptView === "original" ? "bg-teal-700 text-white" : "text-slate-600"
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
