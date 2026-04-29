"use client";

export default function GlobalError({
  error,
  reset
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-start justify-center px-5 py-10">
      <p className="text-sm font-semibold uppercase text-zinc-500">RSG Translate</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-950">Ein Fehler ist aufgetreten</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">
        Bitte versuche es erneut. Wenn der Fehler bleibt, prüfe Netzwerk und API-Konfiguration.
      </p>
      <p className="mt-4 rounded bg-zinc-100 px-3 py-2 text-xs text-zinc-600">{error.message || "Unbekannter Fehler."}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Erneut laden
      </button>
    </main>
  );
}
