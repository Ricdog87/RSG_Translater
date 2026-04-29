export const metadata = {
  title: "Datenschutz | RSG Translate"
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-semibold text-zinc-950">Datenschutzhinweis</h1>
      <p className="mt-4 text-sm leading-7 text-zinc-700">
        Diese App verarbeitet Spracheingaben lokal im Browser und sendet für die Übersetzung nur Text an den konfigurierten
        Übersetzungsanbieter. Es wird kein Audio an den App-Server gesendet.
      </p>
      <p className="mt-3 text-sm leading-7 text-zinc-700">
        Für den produktiven Einsatz müssen verantwortliche Stelle, Rechtsgrundlage, Aufbewahrung, Löschfristen und
        Auftragsverarbeitungsverträge verbindlich dokumentiert werden.
      </p>
    </main>
  );
}
