import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-start justify-center px-5 py-10">
      <p className="text-sm font-semibold uppercase text-zinc-500">RSG Translate</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-950">Seite nicht gefunden</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-600">Die gewünschte Seite existiert nicht oder wurde verschoben.</p>
      <Link href="/" className="mt-6 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
        Zur Startseite
      </Link>
    </main>
  );
}
