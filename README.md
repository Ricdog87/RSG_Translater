# RSG Translate

Mobile-first MVP fuer eine Push-to-talk Simultan-Uebersetzungs-App in Recruiting-Interviews.

## Funktionen

- Startscreen mit Auswahl der Kunden- und Kandidatensprache
- Interview-Screen mit zwei grossen Push-to-talk Buttons
- Datenschutzmodus mit expliziter Zustimmung vor Uebersetzung und optionaler Spracheingabe
- Manuelle Texteingabe als datenschutzfreundlicher Standard ohne Browser-Spracherkennung
- Browser Speech-to-Text pro Aufnahme
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
- OpenRouter API

## OpenRouter

- Speech-to-Text: Browser Web Speech API
- Translation: OpenRouter Chat Completions API
- Text-to-Speech: Browser Speech Synthesis API
- Default model: `openai/gpt-4o-mini`

## Setup

```bash
npm install
cp .env.example .env.local
```

Dann in `.env.local` den API-Key setzen:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1/chat/completions
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
2. Environment Variable `OPENROUTER_API_KEY` in Vercel setzen.
3. Deploy starten.

Die API Route ist serverseitig, der OpenRouter-Key wird nicht an den Browser ausgeliefert.

## Datenschutz-MVP

- Das Backend speichert keine Interviewdaten.
- API-Antworten werden mit `Cache-Control: no-store` ausgeliefert.
- Die Vercel Serverless Function ist auf Frankfurt (`fra1`) ausgerichtet.
- Es wird kein Audio an den App-Server gesendet.
- Im Standard-Workflow kann Text manuell eingegeben werden.
- Push-to-talk ist optional und muss separat bestaetigt werden. Je nach Browser kann die Web Speech API Audio durch den Browser-Anbieter verarbeiten.
- Zur Uebersetzung wird nur der erkannte oder eingegebene Text an OpenRouter gesendet.
- OpenRouter wird mit `provider.data_collection = "deny"` eingeschraenkt, sodass nur Provider genutzt werden sollen, die keine Nutzerdaten sammeln.
- Der OpenRouter EU-Endpunkt kann ueber `OPENROUTER_BASE_URL=https://eu.openrouter.ai/api/v1/chat/completions` aktiviert werden, wenn er fuer den Account freigeschaltet ist.
- Fuer produktive DSGVO-Nutzung sollten AVV/DPA, Datenschutzhinweise, TOMs, Aufbewahrungsregeln und ein gepruefter EU-STT/LLM-Anbieter verbindlich geklaert werden.

## Hostinger / EU-Hosting

Hostinger mit EU-Server kann fuer das App-Hosting helfen. Fuer diese Next.js API Route brauchst du allerdings Node.js/Server-Hosting oder einen VPS. Reines statisches Webhosting reicht nicht fuer die serverseitige OpenRouter-Proxy-Route. Datenschutzrechtlich entscheidend ist ausserdem nicht nur der Serverstandort, sondern auch, welche Unterauftragsverarbeiter Text oder Audio verarbeiten.

## Projektstruktur

```text
app/
  api/interview-turn/route.ts  # OpenRouter Translation
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
  web-speech.ts
public/
  icon.svg
  manifest.webmanifest
```

## Realtime Streaming spaeter

Das MVP trennt jeden Gespraechsbeitrag als einzelnen Turn. Fuer spaeteres Realtime Streaming ist die UI bereits nach Sprecherrollen getrennt; der API-Pfad kann durch eine Realtime-Session Route ergaenzt werden, ohne den Gespraechsverlauf neu zu modellieren.

## Browser-Hinweis

Die OpenRouter-Version nutzt fuer Spracheingabe die Web Speech API. Fuer Kundentests funktionieren Chrome und Edge am zuverlaessigsten. Safari kann je nach Geraet und Sprache eingeschraenkt sein.
