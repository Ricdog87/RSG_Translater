import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Datenschutz · RSG Translate",
  description: "Datenschutzhinweise zur Nutzung von RSG Translate.",
  robots: { index: true, follow: true }
};

export default function DatenschutzPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Zurück
      </Link>
      <article className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.25)] backdrop-blur sm:p-10">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-950">Datenschutzerklärung</h1>
        <p className="mb-8 text-sm font-medium text-zinc-500">
          Informationen zur Verarbeitung personenbezogener Daten gemäß Art. 13/14 DSGVO
        </p>

        <section className="space-y-3 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung ist:
            <br />
            [Firmenname / Inhaber:in]
            <br />
            [Anschrift], [E-Mail], [Telefon]
          </p>
        </section>

        <section className="mt-6 space-y-3 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">2. Art der erhobenen Daten</h2>
          <p>
            <strong>Server-Logs:</strong> Beim Aufruf der App werden technische Daten (IP-Adresse, User-Agent, Zeitstempel,
            angeforderte URL) durch unseren Hosting-Anbieter Vercel Inc. zur Bereitstellung und Sicherheit verarbeitet
            (Rechtsgrundlage Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse).
          </p>
          <p>
            <strong>Interview-Inhalte:</strong> Im Rahmen einer Übersetzung wird ausschließlich der erkannte oder manuell
            eingegebene Text an unseren Übersetzungs-Anbieter OpenRouter übertragen. Audio-Aufnahmen werden nicht an
            unsere Server übertragen.
          </p>
          <p>
            <strong>Kein Konto, keine Speicherung:</strong> Es werden keine Nutzerkonten geführt. Im Backend werden
            Interview-Texte nicht gespeichert. Das im Browser sichtbare Transkript wird ausschließlich lokal im
            Browser-Speicher der laufenden Sitzung gehalten und beim Schließen verworfen.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">3. Browser-Spracherkennung (Web Speech API)</h2>
          <p>
            Wenn Sie die Funktion „Spracheingabe“ aktivieren, nutzt die App die im Browser eingebaute Web Speech API. Je
            nach Browser kann das aufgenommene Audio an die Server des Browser-Anbieters (z. B. Google bei Chrome)
            übertragen und dort zu Text verarbeitet werden. RSG Translate hat darauf keinen Einfluss. Wir empfehlen,
            bevorzugt die Texteingabe als Backup zu verwenden, wenn dies vermieden werden soll.
          </p>
          <p>Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO – Einwilligung (per Checkbox vor Start).</p>
        </section>

        <section className="mt-6 space-y-3 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">4. Übersetzung über OpenRouter</h2>
          <p>
            Zur Übersetzung wird der erkannte Text über eine serverseitige Schnittstelle an OpenRouter Inc. (USA)
            übermittelt. Der API-Aufruf wird mit dem Parameter <code>provider.data_collection = &quot;deny&quot;</code> versehen,
            sodass nur Modell-Anbieter genutzt werden, die laut OpenRouter-Routing keine Nutzerdaten zu Trainings- oder
            Profilbildungszwecken speichern.
          </p>
          <p>
            Eine Übermittlung in Drittländer kann nicht ausgeschlossen werden. Sie erfolgt auf Grundlage der
            Standardvertragsklauseln (SCC) und Ihrer Einwilligung (Art. 49 Abs. 1 lit. a DSGVO).
          </p>
          <p>
            Anbieter:{" "}
            <a
              href="https://openrouter.ai/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-zinc-950 underline"
            >
              OpenRouter Datenschutzerklärung
            </a>
            .
          </p>
        </section>

        <section className="mt-6 space-y-3 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">5. Hosting</h2>
          <p>
            Die Anwendung wird auf Vercel Inc. gehostet. Die serverseitige Übersetzungs-Funktion ist auf die Region
            Frankfurt (fra1) ausgerichtet. Vercel verarbeitet IP-Adressen und technische Logs zur Bereitstellung des
            Dienstes.
          </p>
          <p>
            Anbieter:{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-zinc-950 underline"
            >
              Vercel Datenschutzerklärung
            </a>
            .
          </p>
        </section>

        <section className="mt-6 space-y-3 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">6. Speicherdauer</h2>
          <p>
            Inhalte des Interviews werden weder bei uns noch bei OpenRouter persistent gespeichert (siehe Konfiguration
            <em> data_collection: deny</em>). Server-Logs des Hosting-Anbieters werden im Rahmen der berechtigten
            Interessen für maximal 30 Tage vorgehalten.
          </p>
        </section>

        <section className="mt-6 space-y-3 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">7. Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der
            Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21) und Widerruf einer erteilten
            Einwilligung (Art. 7 Abs. 3) sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde.
          </p>
          <p>Kontakt für Datenschutzanfragen: [datenschutz@example.com]</p>
        </section>

        <section className="mt-6 space-y-3 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">8. Cookies und Tracking</h2>
          <p>
            Es werden keine Marketing-Cookies oder Tracker eingesetzt. Es werden ausschließlich technisch notwendige
            Browser-Speicherbereiche zur Bereitstellung der laufenden Sitzung verwendet.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Hinweis vor Go-Live</p>
          <p className="mt-1">
            Diese Datenschutzerklärung ist eine Vorlage. Vor Veröffentlichung sind die Platzhalter zu ersetzen, ein
            Auftragsverarbeitungsvertrag (AVV) mit OpenRouter und Vercel abzuschließen sowie die Hinweise vom
            Datenschutzbeauftragten freigeben zu lassen.
          </p>
        </section>
      </article>
    </main>
  );
}
