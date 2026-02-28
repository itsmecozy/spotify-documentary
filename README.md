# 🎬 Spotify Documentary Generator — v2

> "Your Year in Music – Brutally Honest"

## What's New in v2

- **OAuth fully wired** — PKCE flow handles callback, restores sessions on reload
- **Analytics pipeline connected** — real Spotify data flows through the entire engine
- **`transformer.ts` added** — the missing bridge between API data and the UI
- **`EmotionalWave` renders real data** — actual valence arc with coping cluster dots
- **Identity Drift bars** — computed from genre entropy, not hardcoded heights
- **Motivational tone mode added** — 4 tones total: Brutal, Poetic, Analytical, Motivational
- **Scroll-spy bug fixed** — chapter IDs now match correctly
- **Loading & error states** — cinematic loading screen with animated stage labels
- **`FinalVerdict` string templating fixed** — body text uses real totals robustly
- **Coping loop detector bug fixed** — now uses raw play history for repeat detection
- **Chapter name transition** — animated header indicator when tone or chapter changes

## Setup

```bash
cd app
npm install
cp .env.example .env
# Add your Spotify Client ID to .env
npm run dev
```

## Spotify App Setup

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Set redirect URI to: `http://localhost:5173/callback` (dev) and your deployed URL (prod)
4. Copy the Client ID into `.env`

## Project Structure

```
src/
├── App.tsx                          # Root — OAuth + pipeline orchestration
├── sections/
│   ├── Intro.tsx                    # Login + demo entry screen
│   ├── Hero.tsx                     # Opening stats section
│   ├── Chapter.tsx                  # Reusable chapter template (ID bug fixed)
│   ├── FinalVerdict.tsx             # Closing chapter + share card
├── components/
│   ├── EmotionalWave.tsx            # Real-data SVG wave (NEW: data-driven)
│   ├── StatsRow.tsx                 # Audio feature stats grid
│   ├── ToneSwitcher.tsx             # 4-mode tone selector (NEW: motivational)
│   ├── Header.tsx                   # Fixed header with animated chapter name
│   ├── ProgressBar.tsx              # Scroll progress
├── lib/
│   ├── spotify/
│   │   ├── service.ts               # OAuth PKCE + Spotify API
│   │   └── transformer.ts           # NEW: API → analytics → UI bridge
│   ├── analytics/
│   │   ├── emotional-profile.ts     # FIXED: coping loop detector
│   │   ├── identity-profile.ts      # Genre entropy, mainstream %, hipster score
│   │   └── nocturnal-analysis.ts    # Circadian patterns, repeat loops
│   └── narrative/
│       ├── engine.ts                # Documentary script generator
│       └── toneData.ts              # NEW: 4 tone modes with full content
└── types/
    └── spotify-analysis.ts          # Complete type definitions
```

## Spotify API Constraints

The free Spotify API provides:
- Top tracks: 50 per time range (short/medium/long term) — **no timestamps**
- Recently played: 50 tracks with timestamps — **limited to recent days**
- Audio features: batch up to 100 IDs

**Quarterly data is approximated** using the three time ranges as proxies. This is documented in `transformer.ts`.

## Deployment

```bash
npm run build
# Deploy dist/ to Vercel, Netlify, etc.
# Set VITE_SPOTIFY_CLIENT_ID in your deployment environment
# Add your production URL as redirect URI in Spotify dashboard
```
