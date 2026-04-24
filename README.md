# RSG Translate

Mobile-first MVP fuer eine Push-to-talk Simultan-Uebersetzungs-App in Recruiting-Interviews.

## Funktionen

- Startscreen mit Auswahl der Kunden- und Kandidatensprache
- Interview-Screen mit zwei grossen Push-to-talk Buttons
- OpenAI Speech-to-Text pro Aufnahme
- Uebersetzung in die jeweils andere Sprache
- Text-to-Speech Wiedergabe der Uebersetzung
- Chat-artiger Gespraechsverlauf mit Original und Uebersetzung
- Export als Textdatei und PDF-Vorbereitung ueber Browser-Druckdialog
- PWA-Metadaten fuer Installation auf mobilen Geraeten

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Next.js API Route
- OpenAI API

## OpenAI Modelle

- Speech-to-Text: `gpt-4o-mini-transcribe`
- Translation: `gpt-4o-mini`
- Text-to-Speech: `gpt-4o-mini-tts`

## Setup

```bash
npm install
cp .env.example .env.local
```

Dann in `.env.local` den API-Key setzen:

```bash
OPENAI_API_KEY=sk-...
```

## Entwicklung starten

```bash
npm run dev
```

Die App laeuft danach unter:

```text
http://localhost:3000
```

Wichtig: Mikrofonzugriff funktioniert im Browser nur auf `localhost` oder ueber HTTPS.

## Build

```bash
npm run build
npm run start
```

## Deployment auf Vercel

1. Repository mit Vercel verbinden.
2. Environment Variable `OPENAI_API_KEY` in Vercel setzen.
3. Deploy starten.

Die API Route ist serverseitig, der OpenAI-Key wird nicht an den Browser ausgeliefert.

## Projektstruktur

```text
app/
  api/interview-turn/route.ts  # STT, Translation, TTS
  globals.css                  # Tailwind und globale Styles
  layout.tsx                   # Metadata und PWA Manifest
  page.tsx                     # Mobile Web-App
components/
  LanguagePicker.tsx
  PushToTalkButton.tsx
  TranscriptList.tsx
lib/
  languages.ts
  types.ts
public/
  icon.svg
  manifest.webmanifest
```

## Realtime Streaming spaeter

Das MVP trennt jeden Gespraechsbeitrag als einzelnen Turn. Fuer spaeteres Realtime Streaming ist die UI bereits nach Sprecherrollen getrennt; der API-Pfad kann durch eine Realtime-Session Route ergaenzt werden, ohne den Gespraechsverlauf neu zu modellieren.
