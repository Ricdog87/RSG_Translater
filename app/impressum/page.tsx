import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Impressum · RSG Translate",
  description: "Anbieterkennzeichnung der RSG Recruiting Solutions Group GmbH.",
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
        <p className="mb-8 text-sm font-medium text-zinc-500">Angaben gemäß § 5 TMG</p>

        <section className="space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Anbieter</h2>
          <p>
            RSG Recruiting Solutions Group GmbH
            <br />
            Am Heiligenhaus 9
            <br />
            65207 Wiesbaden
            <br />
            Deutschland
          </p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Marke</h2>
          <p>RSG Translator ist eine Marke der RSG Recruiting Solutions Group GmbH.</p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Vertreten durch</h2>
          <p>Ricardo Serrano, Geschäftsführer</p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Kontakt</h2>
          <p>
            Telefon:{" "}
            <a href="tel:+4917660772556" className="font-semibold text-zinc-950 underline">
              +49 176 60772556
            </a>
            <br />
            E-Mail:{" "}
            <a href="mailto:info@recruiting-sg.de" className="font-semibold text-zinc-950 underline">
              info@recruiting-sg.de
            </a>
          </p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Registereintrag</h2>
          <p>
            Registergericht: Amtsgericht Wiesbaden
            <br />
            Registernummer: HRB 35951
          </p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Umsatzsteuer-ID</h2>
          <p>USt-IdNr. gemäß § 27 a UStG: DE458027073</p>
        </section>

        <section className="mt-6 space-y-2 text-sm leading-7 text-zinc-700">
          <h2 className="text-base font-semibold text-zinc-950">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>
            Ricardo Serrano
            <br />
            Am Heiligenhaus 9
            <br />
            65207 Wiesbaden
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
      </article>
    </main>
  );
}
