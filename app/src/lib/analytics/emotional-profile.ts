import type { SpotifyAudioFeatures, TimeSeriesPoint, TimeRange, CopingSignal, EmotionalProfile } from '@/types/spotify-analysis';

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function detectEmotionalOscillation(tracks: SpotifyAudioFeatures[]): number {
  if (tracks.length < 3) return 0;
  let oscillations = 0;
  for (let i = 1; i < tracks.length - 1; i++) {
    const prev = tracks[i - 1], curr = tracks[i], next = tracks[i + 1];
    if (prev.energy > 0.7 && curr.valence < 0.4 && next.energy > 0.7) oscillations++;
    if (prev.valence > 0.7 && curr.valence < 0.3 && next.valence > 0.7) oscillations++;
  }
  return oscillations / tracks.length;
}

function findMelancholyLoops(tracks: SpotifyAudioFeatures[], timestamps: string[]): TimeRange[] {
  const clusters: TimeRange[] = [];
  const lowValenceThreshold = 0.35;
  const minClusterSize = 3;
  let currentCluster: SpotifyAudioFeatures[] = [];
  let currentTimestamps: string[] = [];

  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i].valence < lowValenceThreshold) {
      currentCluster.push(tracks[i]);
      currentTimestamps.push(timestamps[i]);
    } else {
      if (currentCluster.length >= minClusterSize) {
        clusters.push({
          start: currentTimestamps[0],
          end: currentTimestamps[currentTimestamps.length - 1],
          valence: average(currentCluster.map(t => t.valence)),
          repeatCount: currentCluster.length,
        });
      }
      currentCluster = [];
      currentTimestamps = [];
    }
  }
  if (currentCluster.length >= minClusterSize) {
    clusters.push({
      start: currentTimestamps[0],
      end: currentTimestamps[currentTimestamps.length - 1],
      valence: average(currentCluster.map(t => t.valence)),
      repeatCount: currentCluster.length,
    });
  }
  return clusters;
}

// FIX: accepts raw track IDs (with duplicates) from play history, not deduplicated audio features
function identifyCopingMechanisms(
  trackIds: string[],                          // raw from play history — may repeat
  featuresMap: Map<string, SpotifyAudioFeatures>, // deduplicated map
  melancholyClusters: TimeRange[]
): CopingSignal[] {
  const signals: CopingSignal[] = [];

  // Count repeats across raw play history
  const repeatCounts = new Map<string, number>();
  trackIds.forEach(id => repeatCounts.set(id, (repeatCounts.get(id) || 0) + 1));

  const repeatedLowValence = Array.from(repeatCounts.entries())
    .filter(([id, count]) => {
      const f = featuresMap.get(id);
      return count > 3 && f && f.valence < 0.4;
    })
    .sort((a, b) => b[1] - a[1]);

  if (repeatedLowValence.length > 0) {
    const [topId, topCount] = repeatedLowValence[0];
    const f = featuresMap.get(topId)!;
    signals.push({
      type: 'repeat_loop',
      severity: Math.min(topCount / 10, 1),
      description: `Repeated a low-valence track ${topCount} times`,
      evidence: [`Track valence: ${(f.valence * 100).toFixed(0)}%`, `Repeat count: ${topCount}`],
    });
  }

  // Energy crash detection — use deduplicated features array
  const features = Array.from(featuresMap.values());
  const energyStd = standardDeviation(features.map(f => f.energy));
  if (energyStd > 0.25) {
    signals.push({
      type: 'energy_crash',
      severity: Math.min(energyStd * 2, 1),
      description: 'High energy volatility detected',
      evidence: [`Energy standard deviation: ${energyStd.toFixed(3)}`],
    });
  }

  if (melancholyClusters.length > 0) {
    const total = melancholyClusters.reduce((s, c) => s + c.repeatCount, 0);
    signals.push({
      type: 'night_sadness',
      severity: Math.min(total / 50, 1),
      description: `${melancholyClusters.length} melancholy listening sessions detected`,
      evidence: melancholyClusters.map(c => `Session: ${c.repeatCount} tracks, avg valence ${(c.valence * 100).toFixed(0)}%`),
    });
  }

  return signals;
}

function inferPsychologicalState(valenceStd: number, oscillationScore: number, copingSignals: CopingSignal[]): string {
  const severity = copingSignals.reduce((s, c) => s + c.severity, 0) / Math.max(copingSignals.length, 1);
  if (severity > 0.7) return 'intense_processing';
  if (severity > 0.4) return 'active_coping';
  if (valenceStd > 0.25) return 'emotional_exploration';
  if (oscillationScore > 0.1) return 'emotional_oscillation';
  return 'emotional_stability';
}

function getPsychologicalStateDescription(state: string): string {
  const descriptions: Record<string, string> = {
    intense_processing: 'Your listening patterns suggest you were processing significant emotional experiences. The data shows concentrated periods of low-valence music, often repeated — a pattern consistent with emotional maintenance.',
    active_coping: 'Your music choices reveal active coping mechanisms. You gravitated toward specific emotional textures during challenging periods, using music as a processing tool.',
    emotional_exploration: 'You explored a wide emotional range this year, from high-energy peaks to introspective valleys. This suggests a period of emotional discovery and growth.',
    emotional_oscillation: 'Your listening shows a pattern of emotional oscillation — rapid shifts between high and low valence. This could indicate a dynamic emotional landscape or reactive listening patterns.',
    emotional_stability: 'Your emotional listening patterns remained relatively consistent, suggesting a period of stability or contentment.',
  };
  return descriptions[state] || descriptions.emotional_stability;
}

// FIX: now accepts trackIds (raw, with duplicates) separately from the features array
export function calculateEmotionalProfile(
  tracks: SpotifyAudioFeatures[],
  timestamps: string[],
  rawTrackIds?: string[],
  featuresMap?: Map<string, SpotifyAudioFeatures>,
): EmotionalProfile {
  const valences = tracks.map(t => t.valence);
  const energies = tracks.map(t => t.energy);
  const valenceStd = standardDeviation(valences);
  const avgValence = average(valences);
  const avgEnergy = average(energies);

  const oscillationScore = detectEmotionalOscillation(tracks);
  const melancholyClusters = findMelancholyLoops(tracks, timestamps);

  // Use raw track IDs if provided (correct), otherwise fall back to dedup features (legacy)
  const copingIndicators = identifyCopingMechanisms(
    rawTrackIds ?? tracks.map(t => t.id),
    featuresMap ?? new Map(tracks.map(t => [t.id, t])),
    melancholyClusters
  );

  const stabilityScore = 1 - Math.min((valenceStd + standardDeviation(energies)) / 2, 1);
  const psychologicalState = inferPsychologicalState(valenceStd, oscillationScore, copingIndicators);

  const energyArc: TimeSeriesPoint[] = tracks.map((track, i) => ({
    date: timestamps[i] || new Date().toISOString(),
    valence: track.valence,
    energy: track.energy,
    tempo: track.tempo,
    isCopingCluster: melancholyClusters.some(
      cluster => timestamps[i] >= cluster.start && timestamps[i] <= cluster.end
    ),
  }));

  return {
    valenceVolatility: valenceStd,
    energyArc,
    melancholyClusters,
    copingIndicators,
    stabilityScore,
    oscillationPattern: oscillationScore,
    psychologicalState: getPsychologicalStateDescription(psychologicalState),
    averageValence: avgValence,
    averageEnergy: avgEnergy,
  };
}

export function generateEmotionalConfrontation(profile: EmotionalProfile): string {
  const { valenceVolatility, melancholyClusters, copingIndicators, oscillationPattern } = profile;
  if (melancholyClusters.length >= 3 && copingIndicators.some(c => c.type === 'repeat_loop')) {
    return "You don't listen to sad music randomly. You loop it. These tracks aren't just songs — they're emotional pressure valves, played until the feeling exhausts itself.";
  }
  if (oscillationPattern > 0.15) {
    return "Your emotional listening pattern resembles a heartbeat monitor — peaks followed by crashes. High-energy bursts, then immediate retreat to introspection. This isn't random; it's regulation.";
  }
  if (valenceVolatility > 0.3) {
    return "Your music taste is a mood ring with commitment issues. One hour you're euphoric, the next you're excavating old wounds. The data doesn't lie: you feel deeply, and you feel often.";
  }
  if (copingIndicators.length > 2) {
    return "Your listening data reveals a sophisticated emotional maintenance system. You know exactly which frequencies soothe your nervous system — and you return to them like a ritual.";
  }
  return "Your emotional landscape this year was remarkably steady. Whether that's contentment or suppression, only you can know.";
}
