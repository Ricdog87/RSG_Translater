# RSG Translate

Mobile-first MVP für eine Push-to-talk Simultan-Übersetzungs-App in Recruiting-Interviews.

## Funktionen

- Startscreen mit Auswahl der Kunden- und Bewerbersprache
- Interview-Screen mit zwei grossen Push-to-talk Buttons
- Datenschutzmodus mit expliziter Zustimmung vor Übersetzung und optionaler Spracheingabe
- Manuelle Texteingabe als datenschutzfreundlicher Standard ohne Browser-Spracherkennung
- Browser Speech-to-Text pro Aufnahme
- Übersetzung in die jeweils andere Sprache
- Text-to-Speech Wiedergabe der Übersetzung
- Laufendes Transkript mit Original und Übersetzung
- Meeting-artiges Interview-Transkript mit Zeitstempeln, Sprecherrollen und Interview-Metadaten
- Nachgang-Export als Transkript-Datei und PDF über Browser-Druckdialog
- PWA-Metadaten für Installation auf mobilen Geräten

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Next.js API Route
- OpenAI API (Fallback: OpenRouter)

## OpenAI

- Speech-to-Text: Browser Web Speech API
- Translation: OpenAI Chat Completions API
- Text-to-Speech: Browser Speech Synthesis API
- Default model: `gpt-4o-mini`

## Setup

```bash
npm install
cp .env.example .env.local
```

Dann in `.env.local` den API-Key setzen:

```bash
# Primär: OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1/chat/completions

# Optionaler Fallback: OpenRouter (falls OPENAI_API_KEY fehlt)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1/chat/completions
```

Priorität: Wenn `OPENAI_API_KEY` gesetzt ist, wird OpenAI verwendet.  
Wenn `OPENAI_API_KEY` fehlt und `OPENROUTER_API_KEY` gesetzt ist, nutzt die App OpenRouter.

Kompatibilitäts-Aliasse werden ebenfalls gelesen: `OPEN_AI_API_KEY`, `OPEN_ROUTER_API_KEY`, `OPENAI_KEY`, `OPENROUTER_KEY`, `NEXT_PUBLIC_OPENAI_API_KEY`, `NEXT_PUBLIC_OPENROUTER_API_KEY`.
Nach Änderungen an Environment-Variablen auf Vercel immer neu deployen, damit sie in der Function verfügbar sind.
Als Notfall-Fallback kann im Setup-Screen ein API-Key direkt eingegeben werden (nur im Browser-State, nicht persistent).

## Entwicklung starten

```bash
npm run dev
```

Die App läuft danach unter:

```text
http://localhost:3000
```

Wichtig: Mikrofonzugriff funktioniert im Browser nur auf `localhost` oder über HTTPS.

## Build

```bash
npm run build
npm run start
```

## Deployment auf Vercel

1. Repository mit Vercel verbinden.
2. Environment Variable `OPENAI_API_KEY` setzen (oder alternativ `OPENROUTER_API_KEY` als Fallback).
3. Deploy starten.

Die API Route ist serverseitig, API-Keys werden nicht an den Browser ausgeliefert.

## Datenschutz-MVP

- Das Backend speichert keine Interviewdaten.
- Das Transkript liegt nur im Browser-State und wird erst beim lokalen Export als Datei erzeugt.
- API-Antworten werden mit `Cache-Control: no-store` ausgeliefert.
- Die Vercel Serverless Function ist auf Frankfurt (`fra1`) ausgerichtet.
- Es wird kein Audio an den App-Server gesendet.
- Im Standard-Workflow kann Text manuell eingegeben werden.
- Push-to-talk ist optional und muss separat bestätigt werden. Je nach Browser kann die Web Speech API Audio durch den Browser-Anbieter verarbeiten.
- Zur Übersetzung wird nur der erkannte oder eingegebene Text an OpenAI gesendet.
- Für produktive DSGVO-Nutzung sollten AVV/DPA, Datenschutzhinweise, TOMs, Aufbewahrungsregeln und ein geprüfter EU-STT/LLM-Anbieter verbindlich geklärt werden.

## Hostinger / EU-Hosting

Hostinger mit EU-Server kann für das App-Hosting helfen. Für diese Next.js API Route brauchst du allerdings Node.js/Server-Hosting oder einen VPS. Reines statisches Webhosting reicht nicht für die serverseitige API-Proxy-Route. Datenschutzrechtlich entscheidend ist außerdem nicht nur der Serverstandort, sondern auch, welche Unterauftragsverarbeiter Text oder Audio verarbeiten.

## Projektstruktur

```text
app/
  api/interview-turn/route.ts  # OpenAI Translation
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

## Realtime Streaming später

Das MVP trennt jeden Gesprächsbeitrag als einzelnen Turn. Für späteres Realtime Streaming ist die UI bereits nach Sprecherrollen getrennt; der API-Pfad kann durch eine Realtime-Session Route ergänzt werden, ohne den Gesprächsverlauf neu zu modellieren.

## Browser-Hinweis

Die OpenAI-Version nutzt für Spracheingabe die Web Speech API. Für Kundentests funktionieren Chrome und Edge am zuverlässigsten. Safari kann je nach Gerät und Sprache eingeschränkt sein.
