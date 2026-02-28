import type { 
  ListeningProfile, 
  Chapter, 
  ChapterType, 
  DocumentaryScript, 
  DataPoint,
  BrutalSummary 
} from '@/types/spotify-analysis';
import { generateEmotionalConfrontation } from '@/lib/analytics/emotional-profile';
import { generateIdentityConfrontation, calculateIdentityDrift } from '@/lib/analytics/identity-profile';

// Generate data points for a chapter
function generateDataPoints(profile: ListeningProfile, type: ChapterType): DataPoint[] {
  const points: DataPoint[] = [];
  
  switch (type) {
    case 'identity':
      points.push(
        {
          label: 'Mainstream Exposure',
          value: `${(profile.identity.mainstreamPercentage * 100).toFixed(0)}%`,
          subtext: profile.identity.mainstreamPercentage > 0.5 ? 'You played it safe' : 'Certified obscurist',
          trend: profile.identity.mainstreamPercentage > 0.6 ? 'up' : 'down'
        },
        {
          label: 'Hipster Score',
          value: `${(profile.identity.hipsterScore * 100).toFixed(0)}`,
          subtext: 'Obscurity index out of 100'
        },
        {
          label: 'Artist Diversity',
          value: `${(profile.identity.artistDiversity * 100).toFixed(0)}%`,
          subtext: 'Unique artists in your rotation'
        }
      );
      break;
      
    case 'emotional':
      points.push(
        {
          label: 'Emotional Volatility',
          value: profile.emotional.valenceVolatility.toFixed(2),
          subtext: profile.emotional.valenceVolatility > 0.25 ? 'High variance' : 'Steady state',
          trend: profile.emotional.valenceVolatility > 0.3 ? 'up' : 'neutral'
        },
        {
          label: 'Average Valence',
          value: `${(profile.emotional.averageValence * 100).toFixed(0)}%`,
          subtext: 'Positivity rating'
        },
        {
          label: 'Coping Signals',
          value: profile.emotional.copingIndicators.length.toString(),
          subtext: 'Detected patterns'
        }
      );
      break;
      
    case 'nocturnal':
      const nightRatio = profile.behavioral.circadianPatterns.nightRatio;
      points.push(
        {
          label: 'Night Listening',
          value: `${(nightRatio * 100).toFixed(0)}%`,
          subtext: 'Midnight to 5am sessions',
          trend: nightRatio > 0.2 ? 'up' : 'neutral'
        },
        {
          label: 'Night Valence',
          value: `${(profile.behavioral.circadianPatterns.nightValence * 100).toFixed(0)}%`,
          subtext: 'Late-night mood'
        },
        {
          label: 'Late Loops',
          value: profile.behavioral.circadianPatterns.loops.length.toString(),
          subtext: 'Repeated night tracks'
        }
      );
      break;
      
    case 'phases':
      const drift = calculateIdentityDrift(profile.temporal.quarterlyBreakdown);
      points.push(
        {
          label: 'Phase Shifts',
          value: drift.shifts.length.toString(),
          subtext: 'Major taste changes'
        },
        {
          label: 'Stability Score',
          value: `${(drift.overallStability * 100).toFixed(0)}%`,
          subtext: 'Consistency rating'
        },
        {
          label: 'Genre Entropy',
          value: drift.shifts.length > 0 ? drift.shifts[0].afterEntropy.toFixed(2) : 'N/A',
          subtext: 'Diversity index'
        }
      );
      break;
  }
  
  return points;
}

// Generate chapter narrative based on type
function generateChapterNarrative(profile: ListeningProfile, type: ChapterType): { narrative: string; confrontation: string } {
  switch (type) {
    case 'identity': {
      const confrontation = generateIdentityConfrontation(profile.identity);
      const { mainstreamPercentage, hipsterScore, actualTopGenres } = profile.identity;
      
      let narrative = '';
      
      if (mainstreamPercentage > 0.6) {
        narrative = `Your top genres this year were ${actualTopGenres.slice(0, 3).map(g => g.name).join(', ')}. These aren't niche discoveries—they're the dominant frequencies of modern culture.`;
      } else if (hipsterScore > 0.6) {
        narrative = `You gravitated toward ${actualTopGenres.slice(0, 3).map(g => g.name).join(', ')}. These sounds exist at the edges of the mainstream, waiting for others to catch up.`;
      } else {
        narrative = `Your musical identity spans ${actualTopGenres.slice(0, 3).map(g => g.name).join(', ')}. It's a balanced palette—familiar enough to sing along, unique enough to feel personal.`;
      }
      
      return { narrative, confrontation };
    }
    
    case 'emotional': {
      const confrontation = generateEmotionalConfrontation(profile.emotional);
      const { averageValence, valenceVolatility } = profile.emotional;
      
      let narrative = '';
      
      if (averageValence < 0.4) {
        narrative = `Your year had a weighted average of ${(averageValence * 100).toFixed(0)}% positivity. That's not pessimism—that's depth. You chose music that matched the complexity of your experiences.`;
      } else if (averageValence > 0.7) {
        narrative = `Your listening averaged ${(averageValence * 100).toFixed(0)}% positivity. You gravitated toward uplift, toward energy, toward the light side of the emotional spectrum.`;
      } else {
        narrative = `Your emotional range was balanced—${(averageValence * 100).toFixed(0)}% average valence with ${valenceVolatility > 0.25 ? 'significant' : 'moderate'} variance. You experienced the full spectrum.`;
      }
      
      return { narrative, confrontation };
    }
    
    case 'nocturnal': {
      const { nightOwlScore, averageNightValence, sadnessLoops } = profile.behavioral.circadianPatterns;
      const confrontation = profile.behavioral.circadianPatterns.loops.length > 0 
        ? profile.behavioral.circadianPatterns.loops[0].trackName 
          ? `You don't listen to sad music at 2am randomly. You loop it. "${profile.behavioral.circadianPatterns.loops[0].trackName}" wasn't background noise—it was maintenance.`
          : "The night has its own playlist in your world, and it's more honest than the daytime one."
        : "Your listening patterns suggest someone who keeps reasonable hours. The night doesn't call to you musically.";
      
      let narrative = '';
      
      if (nightOwlScore > 0.2) {
        narrative = `${(nightOwlScore * 100).toFixed(0)}% of your listening happened between midnight and 5am. The night has its own soundtrack in your world.`;
        if (averageNightValence < 0.4) {
          narrative += ` And that soundtrack skews melancholy—${(averageNightValence * 100).toFixed(0)}% positivity. The quiet hours bring out the truth.`;
        }
      } else {
        narrative = `You're a daytime listener. Only ${(nightOwlScore * 100).toFixed(0)}% of your plays happened in the deep night. Your music accompanies your waking hours.`;
      }
      
      if (sadnessLoops.length > 0) {
        narrative += ` You had ${sadnessLoops.length} late-night coping sessions—tracks repeated until the feeling passed.`;
      }
      
      return { narrative, confrontation };
    }
    
    case 'phases': {
      const drift = calculateIdentityDrift(profile.temporal.quarterlyBreakdown);
      
      let narrative = '';
      let confrontation = '';
      
      if (drift.shifts.length === 0) {
        narrative = 'Your taste remained remarkably consistent throughout the year. No dramatic pivots, no identity crises—just steady, reliable preferences.';
        confrontation = 'Consistency can be comfort, or it can be a cage. The data sees someone who knows what they like. The question is: are you still discovering, or have you stopped looking?';
      } else if (drift.shifts.length === 1) {
        const shift = drift.shifts[0];
        narrative = drift.narrative;
        
        const confrontations: Record<string, string> = {
          retreat_to_comfort: 'This wasn\'t evolution. This was coping. When the world got too loud, you turned the volume down on your taste and sought the familiar.',
          exploratory_escape: 'You ran toward new sounds when the old ones stopped working. That\'s not growth—that\'s survival through novelty.',
          emotional_processing: 'The soundtrack changed because the story changed. You weren\'t just listening differently—you were feeling differently.',
          genuine_evolution: 'Some people stay the same. You didn\'t. Your taste evolved, shifted, grew. That\'s rare. That\'s real.'
        };
        
        confrontation = confrontations[shift.psychologicalReading] || confrontations.genuine_evolution;
      } else {
        narrative = drift.narrative;
        confrontation = `You had ${drift.shifts.length} distinct phases this year. Each shift tells a story of adaptation, of response, of a person who doesn't stay static. You weren't lost—you were recalibrating.`;
      }
      
      return { narrative, confrontation };
    }
    
    default:
      return { narrative: '', confrontation: '' };
  }
}

// Generate the brutal summary
function generateBrutalSummary(profile: ListeningProfile): BrutalSummary {
  const { mainstreamPercentage, hipsterScore } = profile.identity;
  const { valenceVolatility, copingIndicators } = profile.emotional;
  const { nightRatio } = profile.behavioral.circadianPatterns;
  
  // Determine headline based on profile
  let headline = '';
  let subheadline = '';
  let keyInsight = '';
  
  if (copingIndicators.length >= 2 && nightRatio > 0.15) {
    headline = 'Your Year Was a Survival Arc';
    subheadline = 'And your playlist knew it before you did';
    keyInsight = 'Your listening patterns reveal a sophisticated emotional maintenance system. You used music to process, to cope, to survive.';
  } else if (mainstreamPercentage > 0.7) {
    headline = 'You Like What Everyone Likes';
    subheadline = 'And that says more than you think';
    keyInsight = 'Mainstream appeal exists because it works. Your brain responds to the same frequencies as millions of others. That\'s not basic—that\'s biology.';
  } else if (hipsterScore > 0.7) {
    headline = 'You\'re a Musical Early Adopter';
    subheadline = 'But what are you running from?';
    keyInsight = 'You seek out the undiscovered, the underground, the obscure. Is it about the music, or is it about differentiation?';
  } else if (valenceVolatility > 0.3) {
    headline = 'You Feel Everything';
    subheadline = 'And you have the playlist to prove it';
    keyInsight = 'Your emotional range is vast. You don\'t shy away from the depths or the heights. Your music is a mood ring with commitment issues.';
  } else {
    headline = 'You Know Exactly What You Like';
    subheadline = 'And you\'re not apologizing for it';
    keyInsight = 'Your taste is defined, consistent, and unapologetic. You\'ve done the work of knowing yourself. That\'s rare.';
  }
  
  // Generate closing thought
  const closingThoughts = [
    'The data doesn\'t judge. It just reveals. And what it reveals is someone who uses music the way humans have always used it: to feel, to process, to survive.',
    'Your playlist is a diary written in frequencies. This year, you wrote more than you knew.',
    'Music is the closest thing we have to time travel. Your 2024 playlist is a portal back to who you were in every moment.',
    'You are what you listen to. And this year, you listened like someone who was fully, messily, beautifully alive.'
  ];
  
  const closingThought = closingThoughts[Math.floor(Math.random() * closingThoughts.length)];
  
  // Generate confrontation
  const confrontation = `Here's the truth: ${mainstreamPercentage > 0.5 ? 'you\'re more mainstream than you admit' : 'you\'re more unique than you realize'}. ${copingIndicators.length > 0 ? 'You used music to cope, and that\'s not weakness—that\'s wisdom.' : 'Your listening was steady, consistent, almost serene.'} ${nightRatio > 0.2 ? 'The night knows your secrets. The data just wrote them down.' : ''}`;
  
  // Generate stats
  const stats: DataPoint[] = [
    {
      label: 'Mainstream Exposure',
      value: `${(mainstreamPercentage * 100).toFixed(0)}%`
    },
    {
      label: 'Emotional Volatility',
      value: valenceVolatility.toFixed(2)
    },
    {
      label: 'Night Listening',
      value: `${(nightRatio * 100).toFixed(0)}%`
    },
    {
      label: 'Coping Signals',
      value: copingIndicators.length.toString()
    }
  ];
  
  return {
    headline,
    subheadline,
    keyInsight,
    confrontation,
    closingThought,
    stats
  };
}

// Main narrative generation function
export function generateDocumentaryScript(
  profile: ListeningProfile,
  userName: string = 'Listener'
): DocumentaryScript {
  const chapters: Chapter[] = [];
  const chapterTypes: ChapterType[] = ['identity', 'emotional', 'nocturnal', 'phases'];
  
  const chapterTitles: Record<ChapterType, string> = {
    identity: 'The Sound of Who You Think You Are',
    emotional: 'The Emotional Underbelly',
    nocturnal: 'The 2AM Truth',
    phases: 'The Phase Shift',
    summary: 'The Brutally Honest Summary'
  };
  
  const chapterSubtitles: Record<ChapterType, string> = {
    identity: 'Your claimed identity vs. your actual data',
    emotional: 'What your valence patterns reveal',
    nocturnal: 'What happens when the world sleeps',
    phases: 'How your taste evolved (or coped)',
    summary: 'The data-driven conclusion'
  };
  
  chapterTypes.forEach((type, index) => {
    const { narrative, confrontation } = generateChapterNarrative(profile, type);
    const dataPoints = generateDataPoints(profile, type);
    
    chapters.push({
      id: `chapter-${index + 1}`,
      type,
      title: chapterTitles[type],
      subtitle: chapterSubtitles[type],
      narrative,
      confrontation,
      dataPoints,
      visualCue: {
        type: type === 'emotional' ? 'graph' : type === 'phases' ? 'timeline' : 'chart',
        colors: ['#1DB954', '#1ed760', '#ffffff']
      },
      duration: 15 + Math.random() * 10
    });
  });
  
  const summary = generateBrutalSummary(profile);
  
  return {
    chapters,
    summary,
    totalDuration: chapters.reduce((sum, c) => sum + c.duration, 0),
    userName,
    generatedAt: new Date().toISOString()
  };
}

// Generate reel script for viral sharing
export function generateReelScript(profile: ListeningProfile): {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
} {
  const { mainstreamPercentage, hipsterScore } = profile.identity;
  const { valenceVolatility } = profile.emotional;
  const { nightRatio } = profile.behavioral.circadianPatterns;
  
  // Select hook based on profile
  let hook = '';
  
  if (mainstreamPercentage > 0.6) {
    hook = "POV: You say you have diverse music taste but your Spotify data disagrees";
  } else if (valenceVolatility > 0.35) {
    hook = "My Spotify data just exposed my mental health journey";
  } else if (nightRatio > 0.25) {
    hook = "My 2am Spotify history is a cry for help";
  } else if (hipsterScore > 0.7) {
    hook = "My Spotify data called me a hipster and I'm not mad about it";
  } else {
    hook = "I thought I knew my music taste until I saw these stats";
  }
  
  const body = `According to my Spotify Documentary: I'm ${(mainstreamPercentage * 100).toFixed(0)}% mainstream, my emotional volatility is ${valenceVolatility.toFixed(2)}, and ${(nightRatio * 100).toFixed(0)}% of my listening happens after midnight. The algorithm knows me better than I know myself.`;
  
  const cta = "Link in bio to generate your own brutally honest music documentary";
  
  const hashtags = [
    '#SpotifyWrapped',
    '#MusicDocumentary',
    '#SpotifyData',
    '#MusicTaste',
    '#BrutallyHonest',
    '#Playlist',
    '#MusicStats',
    '#Viral'
  ];
  
  return { hook, body, cta, hashtags };
    }

