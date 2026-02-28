/**
 * transformer.ts
 *
 * Bridges Spotify API data → analytics pipeline → UI shape.
 * This is the connector layer that was missing from the original codebase.
 */

import type {
  SpotifyTrack,
  SpotifyArtist,
  SpotifyAudioFeatures,
  SpotifyPlayHistory,
  ListeningProfile,
  ComfortZoneMetrics,
  QuarterlyListening,
  TemporalProfile,
  GenreWeight,
} from '@/types/spotify-analysis';
import { calculateIdentityProfile } from '@/lib/analytics/identity-profile';
import { calculateEmotionalProfile } from '@/lib/analytics/emotional-profile';
import { analyzeNocturnalBehavior } from '@/lib/analytics/nocturnal-analysis';

// ─── Statistical utils ────────────────────────────────────────────────────────

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map(v => Math.pow(v - mean, 2))));
}

function calculateGenreEntropy(genres: GenreWeight[]): number {
  if (genres.length === 0) return 0;
  const total = genres.reduce((s, g) => s + g.weight, 0);
  let entropy = 0;
  genres.forEach(g => {
    const p = g.weight / total;
    if (p > 0) entropy -= p * Math.log2(p);
  });
  return entropy;
}

// ─── Genre aggregation ────────────────────────────────────────────────────────

function aggregateGenresFromArtists(artists: SpotifyArtist[]): GenreWeight[] {
  const counts = new Map<string, number>();
  artists.forEach((artist, idx) => {
    const weight = 1 / (idx + 1);
    artist.genres.forEach(g => {
      counts.set(g, (counts.get(g) || 0) + weight);
    });
  });
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return Array.from(counts.entries())
    .map(([name, weight]) => ({ name, weight, percentage: total > 0 ? weight / total : 0 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);
}

// ─── Quarterly proxy from three Spotify time ranges ───────────────────────────
//
// Spotify free API doesn't provide timestamps for top tracks — only recently-played
// (50 track limit). We approximate quarterly breakdown using three time_range
// values: short_term (~4 weeks), medium_term (~6 months), long_term (~1 year).
//
// Interpretation:
//   long_term   → Full Year baseline
//   medium_term → Mid-Year (~H1)
//   short_term  → Recent / Q4 snapshot

const MAINSTREAM_KEYWORDS = [
  'pop', 'dance pop', 'hip hop', 'rap', 'rock', 'r&b', 'country', 'edm', 'house',
];

function calcMainstreamPct(genres: GenreWeight[]): number {
  const total = genres.reduce((s, g) => s + g.weight, 0);
  if (!total) return 0;
  const mw = genres
    .filter(g => MAINSTREAM_KEYWORDS.some(k => g.name.toLowerCase().includes(k)))
    .reduce((s, g) => s + g.weight, 0);
  return mw / total;
}

function buildQuarterlyProxy(
  byRange: { short: SpotifyTrack[]; medium: SpotifyTrack[]; long: SpotifyTrack[] },
  audioFeatures: Map<string, SpotifyAudioFeatures>
): QuarterlyListening[] {
  const makeQuarter = (tracks: SpotifyTrack[], period: string): QuarterlyListening => {
    const artistMap = new Map<string, SpotifyArtist>();
    tracks.flatMap(t => t.artists).forEach(a => artistMap.set(a.id, a));
    const uniqueArtists = Array.from(artistMap.values());
    const genres = aggregateGenresFromArtists(uniqueArtists);

    const feats = tracks
      .map(t => audioFeatures.get(t.id))
      .filter((f): f is SpotifyAudioFeatures => !!f);

    return {
      period,
      topGenres: genres,
      mainstreamPercentage: calcMainstreamPct(genres),
      averageValence: average(feats.map(f => f.valence)) || 0.5,
      averageEnergy: average(feats.map(f => f.energy)) || 0.5,
      topTracks: tracks.slice(0, 5),
    };
  };

  return [
    makeQuarter(byRange.long, 'Full Year'),
    makeQuarter(byRange.medium, 'Mid-Year'),
    makeQuarter(byRange.short, 'Recent'),
  ];
}

// ─── Temporal profile ─────────────────────────────────────────────────────────

function buildTemporalProfile(
  recentlyPlayed: SpotifyPlayHistory[],
  byRange: { short: SpotifyTrack[]; medium: SpotifyTrack[]; long: SpotifyTrack[] },
  audioFeatures: Map<string, SpotifyAudioFeatures>
): TemporalProfile {
  const hourCounts = new Map<number, number>();
  recentlyPlayed.forEach(p => {
    const h = new Date(p.played_at).getHours();
    hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
  });

  let peakHour = 0, peakCount = 0;
  hourCounts.forEach((count, hour) => {
    if (count > peakCount) { peakCount = count; peakHour = hour; }
  });

  const totalMs = recentlyPlayed.reduce((s, p) => s + p.track.duration_ms, 0);
  const activeDays = new Set(recentlyPlayed.map(p => new Date(p.played_at).toDateString())).size;

  return {
    totalListeningTime: Math.round(totalMs / 60000),
    activeDays,
    peakListeningHour: peakHour,
    quarterlyBreakdown: buildQuarterlyProxy(byRange, audioFeatures),
  };
}

// ─── Comfort zone metrics ─────────────────────────────────────────────────────

function buildComfortZoneMetrics(
  topTracks: SpotifyTrack[],
  audioFeatures: Map<string, SpotifyAudioFeatures>,
  genreEntropy: number,
  artistDiversity: number
): ComfortZoneMetrics {
  const feats = topTracks
    .map(t => audioFeatures.get(t.id))
    .filter((f): f is SpotifyAudioFeatures => !!f);

  const bpms = feats.map(f => f.tempo);
  return {
    bpmVariance: standardDeviation(bpms),
    genreEntropy,
    artistLoyalty: 1 - artistDiversity,
    bpmRange: {
      min: bpms.length ? Math.min(...bpms) : 60,
      max: bpms.length ? Math.max(...bpms) : 180,
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ComprehensiveSpotifyData {
  topTracks: SpotifyTrack[];
  topArtists: SpotifyArtist[];
  recentlyPlayed: SpotifyPlayHistory[];
  audioFeatures: Map<string, SpotifyAudioFeatures>;
}

export interface RangedTrackData {
  short: SpotifyTrack[];
  medium: SpotifyTrack[];
  long: SpotifyTrack[];
}

export function buildListeningProfile(
  data: ComprehensiveSpotifyData,
  rangedTracks: RangedTrackData
): ListeningProfile {
  const { topTracks, topArtists, recentlyPlayed, audioFeatures } = data;

  // 1. Identity
  const identity = calculateIdentityProfile(topArtists, topTracks, []);

  // 2. Emotional — use recently-played for timestamps + audio features for signal
  const recentFeats = recentlyPlayed
    .map(p => audioFeatures.get(p.track.id))
    .filter((f): f is SpotifyAudioFeatures => !!f);
  const timestamps = recentlyPlayed.map(p => p.played_at);
  const rawTrackIds = recentlyPlayed.map(p => p.track.id);
  const emotional = calculateEmotionalProfile(recentFeats, timestamps, rawTrackIds, data.audioFeatures);

  // 3. Nocturnal
  const nocturnal = analyzeNocturnalBehavior(recentlyPlayed, audioFeatures);

  // 4. Temporal
  const temporal = buildTemporalProfile(recentlyPlayed, rangedTracks, audioFeatures);

  // 5. Comfort zone
  const comfortZone = buildComfortZoneMetrics(
    topTracks, audioFeatures,
    calculateGenreEntropy(identity.actualTopGenres),
    identity.artistDiversity
  );

  return {
    identity,
    emotional,
    behavioral: {
      circadianPatterns: nocturnal,
      obsessionLoops: [],
      phaseShifts: [],
      comfortZoneMetrics: comfortZone,
    },
    temporal,
  };
}

// ─── UI data mapper ────────────────────────────────────────────────────────────
// Maps ListeningProfile to the shape App.tsx chapters consume.

export interface UIData {
  userName: string;
  totalMinutes: number;
  totalSongs: number;
  topArtists: { rank: string; title: string; subtitle: string; barWidth: string }[];
  genreDistribution: { label: string; height: number }[];
  emotionalStats: { value: string; label: string; pct: string }[];
  loopedTracks: { rank: string; title: string; subtitle: string; barWidth: string }[];
  identityDrift: { label: string; height: number }[];
  emotionalArc: import('@/types/spotify-analysis').TimeSeriesPoint[];
}

export function mapProfileToUIData(
  profile: ListeningProfile,
  user: { display_name: string },
): UIData {
  const { identity, emotional, behavioral, temporal } = profile;

  const topArtists = identity.topArtists.slice(0, 4).map((a, i) => ({
    rank: String(i + 1).padStart(2, '0'),
    title: a.name,
    subtitle: `${a.genres.slice(0, 2).join(' / ') || 'Unknown genre'}`,
    barWidth: `${100 - i * 18}%`,
  }));

  const maxWeight = Math.max(...identity.actualTopGenres.map(g => g.weight), 1);
  const genreDistribution = identity.actualTopGenres.slice(0, 7).map(g => ({
    label: g.name.split(' ').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' '),
    height: Math.round((g.weight / maxWeight) * 90) + 5,
  }));

  const genreEntropy = identity.actualTopGenres.length > 0
    ? (() => {
        const total = identity.actualTopGenres.reduce((s, g) => s + g.weight, 0);
        return -identity.actualTopGenres.reduce((e, g) => {
          const p = g.weight / total;
          return p > 0 ? e + p * Math.log2(p) : e;
        }, 0);
      })()
    : 0;

  const emotionalStats = [
    { value: emotional.averageValence.toFixed(2), label: 'Avg Valence', pct: `${Math.round(emotional.averageValence * 100)}%` },
    { value: emotional.averageEnergy.toFixed(2), label: 'Avg Energy', pct: `${Math.round(emotional.averageEnergy * 100)}%` },
    { value: (1 - emotional.stabilityScore).toFixed(2), label: 'Volatility', pct: `${Math.round((1 - emotional.stabilityScore) * 100)}%` },
    { value: behavioral.comfortZoneMetrics.bpmVariance.toFixed(0), label: 'BPM Variance', pct: `${Math.min(Math.round(behavioral.comfortZoneMetrics.bpmVariance / 60 * 100), 100)}%` },
    { value: genreEntropy.toFixed(2), label: 'Genre Entropy', pct: `${Math.min(Math.round(genreEntropy / 3 * 100), 100)}%` },
  ];

  const loopedTracks = behavioral.circadianPatterns.loops.slice(0, 3).map((loop, i) => ({
    rank: '',
    title: loop.trackName,
    subtitle: `${loop.count} plays · avg valence ${(loop.avgValence * 100).toFixed(0)}%`,
    barWidth: `${100 - i * 25}%`,
  }));

  const entropyValues = temporal.quarterlyBreakdown.map(q => {
    if (!q.topGenres.length) return 0;
    const tot = q.topGenres.reduce((s, g) => s + g.weight, 0);
    return -q.topGenres.reduce((e, g) => {
      const p = g.weight / tot;
      return p > 0 ? e + p * Math.log2(p) : e;
    }, 0);
  });
  const maxEntropy = Math.max(...entropyValues, 1);
  // Expand 3 quarters into 12 months for the bar chart
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const identityDrift = MONTH_LABELS.map((label, i) => {
    const qIdx = i < 4 ? 0 : i < 8 ? 1 : 2;
    return {
      label,
      height: Math.round((entropyValues[qIdx] / maxEntropy) * 85) + 5,
    };
  });

  // Estimate year total from sample data
  const daysWithData = temporal.activeDays || 1;
  const projectedMinutes = Math.round((temporal.totalListeningTime / daysWithData) * 365);

  const uniqueRecentIds = new Set(behavioral.circadianPatterns.loops.map(l => l.trackId));
  const totalSongs = Math.max(identity.topArtists.length * 10 + uniqueRecentIds.size, 50);

  return {
    userName: user.display_name,
    totalMinutes: projectedMinutes || temporal.totalListeningTime,
    totalSongs,
    topArtists,
    genreDistribution,
    emotionalStats,
    loopedTracks,
    identityDrift,
    emotionalArc: emotional.energyArc,
  };
}
