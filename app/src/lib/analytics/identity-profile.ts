import type { SpotifyArtist, SpotifyTrack, GenreWeight, IdentityProfile, QuarterlyListening, PhaseTransition } from '@/types/spotify-analysis';

// Mainstream genre keywords
const MAINSTREAM_GENRES = [
  'pop', 'dance pop', 'electropop', 'synthpop', 'indie pop',
  'hip hop', 'rap', 'trap', 'pop rap',
  'rock', 'alternative rock', 'indie rock', 'pop rock',
  'edm', 'electronic', 'house', 'techno',
  'r&b', 'contemporary r&b', 'soul',
  'country', 'pop country'
];

// Calculate Shannon entropy for genre diversity
function calculateGenreEntropy(genres: GenreWeight[]): number {
  if (genres.length === 0) return 0;
  
  const totalWeight = genres.reduce((sum, g) => sum + g.weight, 0);
  
  let entropy = 0;
  genres.forEach(genre => {
    const probability = genre.weight / totalWeight;
    if (probability > 0) {
      entropy -= probability * Math.log2(probability);
    }
  });
  
  return entropy;
}

// Check if genre is mainstream
function isMainstreamGenre(genre: string): boolean {
  const normalizedGenre = genre.toLowerCase();
  return MAINSTREAM_GENRES.some(mg => normalizedGenre.includes(mg));
}

// Calculate mainstream percentage
function calculateMainstreamPercentage(genres: GenreWeight[]): number {
  if (genres.length === 0) return 0;
  
  const totalWeight = genres.reduce((sum, g) => sum + g.weight, 0);
  const mainstreamWeight = genres
    .filter(g => isMainstreamGenre(g.name))
    .reduce((sum, g) => sum + g.weight, 0);
  
  return mainstreamWeight / totalWeight;
}

// Calculate hipster score (obscurity index)
function calculateHipsterScore(
  artists: SpotifyArtist[],
  mainstreamPercentage: number
): number {
  // Average popularity of top artists (0-100)
  const avgPopularity = artists.length > 0
    ? artists.reduce((sum, a) => sum + a.popularity, 0) / artists.length
    : 50;
  
  // Lower popularity = higher hipster score
  const popularityComponent = 1 - (avgPopularity / 100);
  
  // Lower mainstream percentage = higher hipster score
  const mainstreamComponent = 1 - mainstreamPercentage;
  
  // Combine factors
  return (popularityComponent * 0.6 + mainstreamComponent * 0.4);
}

// Calculate artist diversity (unique artists / total plays)
function calculateArtistDiversity(tracks: SpotifyTrack[]): number {
  if (tracks.length === 0) return 0;
  
  const uniqueArtists = new Set(tracks.map(t => t.artists[0]?.id)).size;
  return uniqueArtists / tracks.length;
}

// Aggregate genres from artists with weights
function aggregateGenres(artists: SpotifyArtist[]): GenreWeight[] {
  const genreCounts = new Map<string, number>();
  
  artists.forEach((artist, index) => {
    // Weight by position (higher position = more weight)
    const positionWeight = 1 / (index + 1);
    
    artist.genres.forEach(genre => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + positionWeight);
    });
  });
  
  // Convert to array and calculate percentages
  const totalWeight = Array.from(genreCounts.values()).reduce((a, b) => a + b, 0);
  
  const genres: GenreWeight[] = Array.from(genreCounts.entries())
    .map(([name, weight]) => ({
      name,
      weight,
      percentage: weight / totalWeight
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10); // Top 10 genres
  
  return genres;
}

// Detect significant phase shifts between quarters
function detectPhaseShifts(quarterlyData: QuarterlyListening[]): PhaseTransition[] {
  const shifts: PhaseTransition[] = [];
  
  for (let i = 1; i < quarterlyData.length; i++) {
    const current = quarterlyData[i];
    const previous = quarterlyData[i - 1];
    
    const entropyBefore = calculateGenreEntropy(previous.topGenres);
    const entropyAfter = calculateGenreEntropy(current.topGenres);
    const entropyChange = Math.abs(entropyAfter - entropyBefore);
    
    const topGenreBefore = previous.topGenres[0]?.name || 'unknown';
    const topGenreAfter = current.topGenres[0]?.name || 'unknown';
    
    // Detect significant shift (> 0.5 entropy change or genre change)
    const isSignificantShift = entropyChange > 0.5 || topGenreBefore !== topGenreAfter;
    
    if (isSignificantShift) {
      const trigger = identifyShiftTrigger(previous, current);
      const psychologicalReading = interpretShift(previous, current);
      
      shifts.push({
        quarter: current.period,
        beforeEntropy: entropyBefore,
        afterEntropy: entropyAfter,
        topGenreBefore,
        topGenreAfter,
        trigger,
        psychologicalReading
      });
    }
  }
  
  return shifts;
}

// Identify what triggered a shift
function identifyShiftTrigger(before: QuarterlyListening, after: QuarterlyListening): string {
  const valenceChange = after.averageValence - before.averageValence;
  const energyChange = after.averageEnergy - before.averageEnergy;
  const mainstreamChange = after.mainstreamPercentage - before.mainstreamPercentage;
  
  if (mainstreamChange > 0.2) {
    return 'comfort_seeking';
  }
  
  if (mainstreamChange < -0.2) {
    return 'exploration';
  }
  
  if (valenceChange < -0.15 && energyChange < -0.15) {
    return 'emotional_shift';
  }
  
  if (valenceChange > 0.15 && energyChange > 0.15) {
    return 'positive_change';
  }
  
  return 'natural_evolution';
}

// Interpret the psychological meaning of a shift
function interpretShift(before: QuarterlyListening, after: QuarterlyListening): string {
  const entropyBefore = calculateGenreEntropy(before.topGenres);
  const entropyAfter = calculateGenreEntropy(after.topGenres);
  
  // Retreat to comfort (lower entropy, more mainstream)
  if (entropyAfter < entropyBefore && after.mainstreamPercentage > before.mainstreamPercentage + 0.1) {
    return 'retreat_to_comfort';
  }
  
  // Exploratory escape (higher entropy, different top genre)
  if (entropyAfter > entropyBefore + 0.3 && after.topGenres[0]?.name !== before.topGenres[0]?.name) {
    return 'exploratory_escape';
  }
  
  // Emotional processing (lower valence, lower energy)
  if (after.averageValence < before.averageValence - 0.1 && after.averageEnergy < before.averageEnergy - 0.1) {
    return 'emotional_processing';
  }
  
  // Genuine evolution (gradual change in taste)
  return 'genuine_evolution';
}

// Generate identity confrontation text
export function generateIdentityConfrontation(profile: IdentityProfile): string {
  const { mainstreamPercentage, hipsterScore, claimedGenres, actualTopGenres } = profile;
  
  // Check for claimed vs actual mismatch
  const claimedSet = new Set(claimedGenres.map(g => g.toLowerCase()));
  const actualSet = new Set(actualTopGenres.slice(0, 3).map(g => g.name.toLowerCase()));
  
  const hasMismatch = !Array.from(claimedSet).some(c => 
    Array.from(actualSet).some(a => a.includes(c) || c.includes(a))
  );
  
  if (hasMismatch && claimedGenres.length > 0) {
    return `You claim you're into ${claimedGenres.slice(0, 2).join(' and ')}. Yet your most-played genres are ${actualTopGenres.slice(0, 2).map(g => g.name).join(' and ')}. The playlist you curate for others isn't the one you actually live in.`;
  }
  
  // High mainstream percentage
  if (mainstreamPercentage > 0.6) {
    return `${(mainstreamPercentage * 100).toFixed(0)}% of your listening is mainstream. You can call it "guilty pleasure" or "ironic enjoyment," but the algorithm knows: you like what everyone else likes. And that's okay.`;
  }
  
  // High hipster score
  if (hipsterScore > 0.7) {
    return `Your average artist popularity is in the bottom third. You actively seek out what others haven't found yet. Is it discovery, or is it differentiation? The data doesn't judge—it just notices.`;
  }
  
  // Moderate diversity
  if (profile.artistDiversity > 0.5) {
    return "Your taste is genuinely eclectic. You don't commit to one sound—you sample widely. This suggests curiosity, openness, maybe even a fear of missing out on the next great thing.";
  }
  
  // Low diversity (loyal listener)
  if (profile.artistDiversity < 0.2) {
    return "You're loyal to your favorites. When you find something you love, you stay with it. Your top artists aren't just preferences—they're companions.";
  }
  
  return "Your musical identity is a work in progress. The genres you gravitate toward tell a story you're still writing.";
}

// Main identity profile calculation
export function calculateIdentityProfile(
  topArtists: SpotifyArtist[],
  topTracks: SpotifyTrack[],
  claimedGenres: string[] = []
): IdentityProfile {
  // Aggregate genres from artists
  const actualTopGenres = aggregateGenres(topArtists);
  
  // Calculate mainstream percentage
  const mainstreamPercentage = calculateMainstreamPercentage(actualTopGenres);
  
  // Calculate hipster score
  const hipsterScore = calculateHipsterScore(topArtists, mainstreamPercentage);
  
  // Calculate artist diversity
  const artistDiversity = calculateArtistDiversity(topTracks);
  
  return {
    claimedGenres,
    actualTopGenres,
    mainstreamPercentage,
    hipsterScore,
    topArtists,
    artistDiversity
  };
}

// Calculate overall identity drift from quarterly data
export function calculateIdentityDrift(quarterlyData: QuarterlyListening[]): {
  shifts: PhaseTransition[];
  overallStability: number;
  narrative: string;
} {
  const shifts = detectPhaseShifts(quarterlyData);
  
  // Calculate overall stability
  const entropyValues = quarterlyData.map(q => calculateGenreEntropy(q.topGenres));
  const entropyVariance = entropyValues.length > 1
    ? entropyValues.reduce((sum, e, i) => {
        if (i === 0) return 0;
        return sum + Math.abs(e - entropyValues[i - 1]);
      }, 0) / (entropyValues.length - 1)
    : 0;
  
  const overallStability = 1 - Math.min(entropyVariance, 1);
  
  // Generate narrative
  let narrative = '';
  
  if (shifts.length === 0) {
    narrative = "Your taste remained remarkably consistent. No dramatic pivots, no identity crises—just steady, reliable preferences. There's comfort in knowing what you like.";
  } else if (shifts.length === 1) {
    const shift = shifts[0];
    const readings: Record<string, string> = {
      retreat_to_comfort: `You had a moment. Something shifted in ${shift.quarter}, and you retreated to familiar sounds. The data sees it: you sought comfort when you needed it most.`,
      exploratory_escape: `${shift.quarter} was your exploration phase. You broke from ${shift.topGenreBefore} and ventured into ${shift.topGenreAfter}. New territory, new feelings.`,
      emotional_processing: `Something happened in ${shift.quarter}. Your music became more introspective, more raw. The soundtrack changed because the story changed.`,
      genuine_evolution: `Your taste evolved naturally. ${shift.quarter} marked a shift from ${shift.topGenreBefore} to ${shift.topGenreAfter}—not a reaction, just growth.`
    };
    narrative = readings[shift.psychologicalReading] || readings.genuine_evolution;
  } else {
    narrative = `Your year had ${shifts.length} distinct phases. Each shift tells a story: ${shifts.map(s => s.psychologicalReading.replace(/_/g, ' ')).join(', ')}. You weren't lost—you were adapting.`;
  }
  
  return {
    shifts,
    overallStability,
    narrative
  };
}
