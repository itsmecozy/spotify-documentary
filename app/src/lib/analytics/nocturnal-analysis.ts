import type { SpotifyPlayHistory, SpotifyAudioFeatures, RepeatLoop, NocturnalProfile } from '@/types/spotify-analysis';

// Extract hour from ISO timestamp
function getHourFromTimestamp(timestamp: string): number {
  return new Date(timestamp).getHours();
}

// Check if timestamp is during night hours (0-5 AM)
function isNightTime(timestamp: string): boolean {
  const hour = getHourFromTimestamp(timestamp);
  return hour >= 0 && hour <= 5;
}

// Detect repeat loops in play history
function detectRepeatLoops(
  playHistory: SpotifyPlayHistory[],
  audioFeatures: Map<string, SpotifyAudioFeatures>
): RepeatLoop[] {
  const trackSequences = new Map<string, { count: number; timestamps: string[]; valences: number[] }>();
  
  // Group consecutive plays of the same track
  playHistory.forEach((play) => {
    const trackId = play.track.id;
    const timestamp = play.played_at;
    
    if (!trackSequences.has(trackId)) {
      trackSequences.set(trackId, { count: 0, timestamps: [], valences: [] });
    }
    
    const sequence = trackSequences.get(trackId)!;
    sequence.count++;
    sequence.timestamps.push(timestamp);
    
    const features = audioFeatures.get(trackId);
    if (features) {
      sequence.valences.push(features.valence);
    }
  });
  
  // Filter for tracks played more than twice
  const loops: RepeatLoop[] = [];
  
  trackSequences.forEach((data, trackId) => {
    if (data.count >= 2) {
      const avgValence = data.valences.length > 0 
        ? data.valences.reduce((a, b) => a + b, 0) / data.valences.length 
        : 0.5;
      
      // Find the track name
      const trackPlay = playHistory.find(p => p.track.id === trackId);
      
      loops.push({
        trackId,
        trackName: trackPlay?.track.name || 'Unknown Track',
        count: data.count,
        avgValence,
        timestamps: data.timestamps
      });
    }
  });
  
  // Sort by count descending
  return loops.sort((a, b) => b.count - a.count);
}

// Detect insomnia patterns (listening between 2-5 AM on multiple days)
function detectInsomniaPatterns(playHistory: SpotifyPlayHistory[]): {
  hasInsomniaPattern: boolean;
  lateNightDays: number;
  averageSessionLength: number;
} {
  const lateNightPlays = playHistory.filter(p => {
    const hour = getHourFromTimestamp(p.played_at);
    return hour >= 2 && hour <= 5;
  });
  
  // Group by date
  const playsByDate = new Map<string, number>();
  lateNightPlays.forEach(play => {
    const date = new Date(play.played_at).toDateString();
    playsByDate.set(date, (playsByDate.get(date) || 0) + 1);
  });
  
  const lateNightDays = playsByDate.size;
  const totalPlays = lateNightPlays.length;
  const averageSessionLength = lateNightDays > 0 ? totalPlays / lateNightDays : 0;
  
  // Consider it an insomnia pattern if there are 3+ different days with late-night listening
  const hasInsomniaPattern = lateNightDays >= 3;
  
  return {
    hasInsomniaPattern,
    lateNightDays,
    averageSessionLength
  };
}

// Generate confrontation text based on nocturnal patterns
function generateNightConfrontation(
  nightRatio: number,
  nightValence: number,
  loops: RepeatLoop[],
  insomniaPattern: { hasInsomniaPattern: boolean; lateNightDays: number }
): string {
  // High night listening with low valence
  if (nightRatio > 0.2 && nightValence < 0.35) {
    const sadLoops = loops.filter(l => l.avgValence < 0.4 && l.timestamps.some(t => isNightTime(t)));
    
    if (sadLoops.length > 0) {
      return `You don't listen to sad music at 2am randomly. You loop it. "${sadLoops[0].trackName}" wasn't background noise—it was maintenance. These tracks are emotional pressure valves, played until the feeling exhausts itself.`;
    }
    
    return "The hours between midnight and 5am tell a different story. While the world sleeps, your playlist becomes a confessional. Low-valence tracks, repeated. This isn't curation—it's processing.";
  }
  
  // Insomnia pattern detected
  if (insomniaPattern.hasInsomniaPattern) {
    return `On ${insomniaPattern.lateNightDays} different nights this period, you were awake when you probably didn't want to be. Your playlist kept you company through the quiet hours. The music knew what you needed before you did.`;
  }
  
  // High night listening overall
  if (nightRatio > 0.25) {
    return "You're a creature of the night—at least musically. A quarter of your listening happens when most people are asleep. There's something about the quiet hours that makes the music hit different.";
  }
  
  // Moderate night listening
  if (nightRatio > 0.1) {
    return "The night has its own soundtrack in your world. Those late-hour listens aren't accidents—they're when you let your guard down and listen to what you actually need to hear.";
  }
  
  // Low night listening
  return "You're disciplined about your sleep—or maybe the night just doesn't call to you musically. Your listening patterns suggest someone who keeps reasonable hours.";
}

// Main nocturnal analysis function
export function analyzeNocturnalBehavior(
  playHistory: SpotifyPlayHistory[],
  audioFeatures: Map<string, SpotifyAudioFeatures>
): NocturnalProfile {
  // Calculate night listening ratio
  const nightPlays = playHistory.filter(p => isNightTime(p.played_at));
  const nightRatio = playHistory.length > 0 ? nightPlays.length / playHistory.length : 0;
  
  // Calculate hourly distribution
  const hours = new Map<number, number>();
  playHistory.forEach(play => {
    const hour = getHourFromTimestamp(play.played_at);
    hours.set(hour, (hours.get(hour) || 0) + 1);
  });
  
  // Calculate average night valence
  const nightAudioFeatures = nightPlays
    .map(p => audioFeatures.get(p.track.id))
    .filter((f): f is SpotifyAudioFeatures => f !== undefined);
  
  const nightValence = nightAudioFeatures.length > 0
    ? nightAudioFeatures.reduce((sum, f) => sum + f.valence, 0) / nightAudioFeatures.length
    : 0.5;
  
  // Detect repeat loops
  const allLoops = detectRepeatLoops(playHistory, audioFeatures);
  
  // Filter for night loops
  const nightLoops = allLoops.filter(loop => 
    loop.timestamps.some(t => isNightTime(t))
  );
  
  // Detect insomnia patterns
  const insomniaPattern = detectInsomniaPatterns(playHistory);
  
  // Generate confrontation
  const confrontation = generateNightConfrontation(nightRatio, nightValence, nightLoops, insomniaPattern);
  
  return {
    nightOwlScore: nightRatio,
    nightRatio,
    nightValence,
    averageNightValence: nightValence,
    sadnessLoops: nightLoops.filter(l => l.avgValence < 0.4),
    loops: nightLoops,
    insomniaIndicators: insomniaPattern.hasInsomniaPattern,
    confrontation
  };
}

// Get peak listening hour
export function getPeakListeningHour(hours: Map<number, number>): number {
  let peakHour = 0;
  let peakCount = 0;
  
  hours.forEach((count, hour) => {
    if (count > peakCount) {
      peakCount = count;
      peakHour = hour;
    }
  });
  
  return peakHour;
}

// Format hour for display
export function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour} ${period}`;
}
