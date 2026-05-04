import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Impressum · RSG Translate",
  description: "Anbieterkennzeichnung gemäß § 5 DDG / § 5 TMG.",
  robots: { index: true, follow: true }
};

export default function ImpressumPage() {
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
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-950">Impressum</h1>
        <p className="mb-8 text-sm font-medium text-zinc-500">Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)</p>

        <section className="space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Anbieter</h2>
          <p>
            [Firmenname / Inhaber:in]
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ Ort]
            <br />
            [Land]
          </p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Kontakt</h2>
          <p>
            Telefon: [Telefonnummer]
            <br />
            E-Mail: [kontakt@example.com]
          </p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Vertretungsberechtigt</h2>
          <p>[Geschäftsführung / Inhaber:in]</p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Registereintrag</h2>
          <p>
            Eingetragen im [Handelsregister / Vereinsregister]
            <br />
            Registergericht: [Amtsgericht]
            <br />
            Registernummer: [HRB / VR]
          </p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Umsatzsteuer-ID</h2>
          <p>USt-IdNr. gemäß § 27 a UStG: [DE000000000]</p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>
            [Vor- und Nachname]
            <br />
            [Anschrift wie oben]
          </p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">EU-Streitschlichtung</h2>
          <p>
            Plattform der EU-Kommission zur Online-Streitbeilegung:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-zinc-950 underline"
            >
              ec.europa.eu/consumers/odr
            </a>
            . Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Hinweis vor Go-Live</p>
          <p className="mt-1">
            Die in eckigen Klammern stehenden Angaben müssen vor der Veröffentlichung durch den Betreiber gesetzt werden.
            Ohne korrekte Anbieterkennzeichnung ist der Betrieb in Deutschland abmahnfähig.
          </p>
        </section>
      </article>
    </main>
  );
}
