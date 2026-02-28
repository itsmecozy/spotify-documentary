export type ToneMode = 'brutal' | 'poetic' | 'analytical' | 'motivational';

export interface ToneContent {
  chapter1: { narrative: string[]; verdict: string };
  chapter2: { narrative: string[]; verdict: string };
  chapter3: { narrative: string[]; verdict: string };
  chapter4: { narrative: string[]; verdict: string };
  final: { headline: string; body: string };
}

export const toneData: Record<ToneMode, ToneContent> = {
  brutal: {
    chapter1: {
      narrative: [
        'You describe your taste as "eclectic." Your data disagrees.',
        'Of your top 100 tracks this year, <span class="hl">62 share the same key signature</span> — A minor. Your genre distribution clusters around three adjacent emotional states: melancholy pop, introspective indie, and what algorithms classify as "sad banger." This is not range. This is a theme.',
        'The artists you played publicly — in playlists shared with friends — skew 23% more obscure than your private listening. You perform taste. The 2AM sessions are where the truth lives.',
      ],
      verdict: "You claim you're experimental. Yet 61% of your streams could be the same song in different fonts.",
    },
    chapter2: {
      narrative: [
        'Your audio features tell a story you did not write intentionally — but wrote clearly.',
        'Average valence this year: <span class="hl-red">0.31 out of 1.0.</span> The scale calls anything below 0.4 "negative or emotionally heavy." You spent the year below that line. Not wallowing — moving — but always with weight in your step.',
        'Energy spikes in the morning — tempo-heavy, above 140 BPM. By 9PM, acousticness climbs, tempo drops. Your brain self-medicates through music on a cycle more reliable than your calendar.',
      ],
      verdict: "Your listening pattern suggests emotional oscillation. High-energy bursts followed by low-valence introspection. You weren't depressed. You were processing at volume.",
    },
    chapter3: {
      narrative: [
        "You don't listen to sad music randomly. You schedule it.",
        'Between <span class="hl">11PM and 3AM</span>, your listening activity shows a 340% spike compared to daytime averages. During these sessions, the average track completion rate climbs to 97%. You skip nothing. You need all of it.',
        'The most looped song this year: 73 plays. You know which one. You know exactly why.',
      ],
      verdict: "Three songs appeared in your late-night rotation more than 40 times each. That's not a playlist. That's a ritual.",
    },
    chapter4: {
      narrative: [
        'Something happened in August.',
        'Your BPM average climbed 22 points. Genre entropy jumped. Three artists who dominated your Q1 playlists disappeared entirely by Q3. This was not gradual evolution — the data shows a discontinuity. A break. Then a different configuration of the same person.',
        'By November, the acousticness dropped, energy returned, valence nudged upward to 0.41. Not healed. Recalibrated. There is a difference — and your music knew it before you named it.',
      ],
      verdict: "This wasn't evolution. This was coping. And then it was something closer to acceptance.",
    },
    final: {
      headline: "You weren't lost.<br>You were recalibrating.",
      body: "23,847 minutes of music. 847 unique tracks. One consistent thread: you use music the way some people use therapy — to feel what you haven't yet named, to rehearse emotions before you have to perform them in real life. That's not weakness. That's a specific kind of emotional intelligence.",
    },
  },

  poetic: {
    chapter1: {
      narrative: [
        'You speak of your taste in broad strokes — "a little of everything." But the data whispers a different story.',
        'Sixty-two of your most-played songs share the same key: A minor. It is the key of longing, of twilight, of things left unsaid. Your genres cluster like constellations — melancholy pop, introspective indie, the occasional sad banger that lets you dance through the ache.',
        'The music you share with others wears a different face than the music you keep for yourself. Public playlists hold your performance. Private sessions hold your prayer.',
      ],
      verdict: '"Your taste is not eclectic. It is a single song, sung in many voices, all of them asking the same question."',
    },
    chapter2: {
      narrative: [
        'Your year, measured in frequencies: a valence of 0.31. Below the threshold where joy begins.',
        'But look closer. Morning brings tempo — 140 BPM, the pace of purpose. Evening brings acousticness, the softness of surrender. Your music moves like breath: inhale, exhale. You are not stuck in sadness. You are learning its language.',
        'The algorithms call it "negative." You call it honest.',
      ],
      verdict: '"You did not wallow. You wandered — through high energy and low valence, through noise and silence — until you found the frequency that matched your heart."',
    },
    chapter3: {
      narrative: [
        'The night does not ask permission. It arrives, and with it, the truth.',
        'Between 11PM and 3AM, your listening multiplies. Track completion rates climb to 97%. You do not skip. You do not scroll. You stay. You let the song finish what you cannot say.',
        'Seventy-three times, you returned to the same melody. Not because you forgot it. Because you needed it to remember you.',
      ],
      verdict: '"Some songs are not for listening. They are for keeping company. For holding the parts of you that the daylight cannot reach."',
    },
    chapter4: {
      narrative: [
        'August arrived like a door swinging open.',
        'Your BPM climbed. Genre entropy surged. The artists who held you in winter fell silent by summer. The data shows a break — not a crack, but a chasm. Then, slowly, a new configuration. The same person, rearranged.',
        'By November, acousticness softened. Energy returned. Valence touched 0.41 — not joy, but its neighbor. Hope.',
      ],
      verdict: '"You were not lost. You were translating yourself into a new language, one song at a time."',
    },
    final: {
      headline: 'You were not broken.<br>You were becoming.',
      body: 'Twenty-three thousand minutes. Eight hundred forty-seven songs. Each one a step through a landscape only you could map. You used music not to escape your life, but to feel it more precisely — to name what had no name, to hold what had no hands. This is not weakness. This is the work of being alive.',
    },
  },

  analytical: {
    chapter1: {
      narrative: [
        'Self-reported taste descriptors: "eclectic," "varied," "open-minded." Empirical analysis suggests otherwise.',
        'Key signature analysis: 62% of top 100 tracks in A minor. Genre clustering: three primary categories with 0.87 cosine similarity. Public vs. private listening delta: 23% obscurity skew in shared playlists.',
        'Conclusion: Reported taste functions as social signaling. Actual consumption patterns reveal high thematic consistency.',
      ],
      verdict: '"Experimental claim unsupported by data. 61% of streams share harmonic, structural, and emotional characteristics consistent with a single archetype."',
    },
    chapter2: {
      narrative: [
        'Audio feature analysis across 12-month period reveals distinct patterns.',
        'Mean valence: 0.31 (SD: 0.18). Distribution skews negative relative to population baseline (μ = 0.55). Temporal analysis: morning sessions (06:00–10:00) show elevated energy (M = 0.74) and tempo (M = 142 BPM). Evening sessions show increased acousticness and decreased tempo.',
        'Pattern consistent with self-regulatory behavior: high-arousal activation followed by low-arousal recovery.',
      ],
      verdict: '"Emotional oscillation detected: high-energy peaks followed by low-valence troughs. Pattern suggests active processing rather than passive consumption."',
    },
    chapter3: {
      narrative: [
        'Temporal analysis of listening behavior: 340% increase in session frequency during 23:00–03:00 window.',
        'Track completion rate during nocturnal sessions: 97% (vs. 64% daytime baseline). Skip rate: negligible. Repeat-play incidents: three tracks exceeded 40 iterations each.',
        'Most looped track: 73 plays. Temporal clustering suggests intentional, ritualized consumption.',
      ],
      verdict: '"Nocturnal listening patterns indicate ritualized behavior. High completion rates and repeat plays suggest music functions as emotional regulation tool."',
    },
    chapter4: {
      narrative: [
        'Phase shift detected: August.',
        'BPM mean increase: +22 points. Genre entropy: +0.47 SD. Artist turnover: 3 of top 5 Q1 artists absent from Q3 data. Discontinuity analysis: non-gradual transition suggests external catalyst.',
        'Recovery indicators: November acousticness decrease, energy restoration, valence increase to 0.41. Pattern consistent with post-event recalibration.',
      ],
      verdict: '"Data indicates phase transition rather than gradual evolution. Post-August metrics suggest successful recalibration following discontinuity event."',
    },
    final: {
      headline: 'Pattern analysis complete.<br>Subject: Recalibrated.',
      body: 'Total consumption: 23,847 minutes. Unique tracks: 847. Behavioral pattern: music utilized as emotional processing tool, with high consistency in thematic selection and temporal regulation. No pathological indicators detected. Function: adaptive. Outcome: positive trajectory.',
    },
  },

  motivational: {
    chapter1: {
      narrative: [
        'You built a soundtrack this year. And it tells a story of someone who knows what they need.',
        'Yes — 62% of your tracks share A minor. But that\'s not limitation; that\'s mastery of a sound that speaks to you. You\'ve found your frequency. Most people never do. Your genre distribution is consistent because your <span class="hl">standards are consistent.</span>',
        'You play slightly different music in private than in public. That means you know the difference. You\'re not performing taste — you\'re protecting the music that actually matters.',
      ],
      verdict: "You didn't collect music this year. You curated an identity — and that takes more courage than it looks.",
    },
    chapter2: {
      narrative: [
        'A valence of 0.31. Some people see that as heavy. We see it as honest.',
        'You didn\'t reach for easy happiness this year. You chose music that met you where you were — in the complexity, in the weight, in the real. And then you used high-energy tracks to push through it. <span class="hl">Morning: 140 BPM. Evening: acousticness, breath, release.</span>',
        'That\'s not emotional instability. That\'s emotional intelligence. You know what you need and when you need it.',
      ],
      verdict: "You self-regulated through sound. Every oscillation between energy and introspection was intentional. You were your own therapist.",
    },
    chapter3: {
      narrative: [
        'The 2AM sessions were not weakness. They were dedication.',
        'A 340% spike in late-night listening — that\'s not insomnia. That\'s deep work. When the world quieted, you went inward. You needed those songs to complete something. And you <span class="hl-amber">stayed until it was done.</span>',
        '73 plays of a single track. Only someone who truly respects music does that. You weren\'t stuck — you were processing. And processing takes as long as it takes.',
      ],
      verdict: "The songs you looped were doing work. You trusted the process. That's rare.",
    },
    chapter4: {
      narrative: [
        'August changed you. And you let it.',
        'The BPM shift, the genre entropy, the artist turnover — these aren\'t signs of instability. They\'re signs of <span class="hl">adaptability.</span> When life shifted, your music shifted with it. You didn\'t cling to what no longer fit.',
        'By November, valence was rising. Energy was back. You moved through the hard part and came out recalibrated. That\'s not just resilience — that\'s growth you can measure in audio features.',
      ],
      verdict: "You didn't just survive the phase shift. You used it. That's the move.",
    },
    final: {
      headline: 'You showed up for yourself.<br>Every single day.',
      body: "23,847 minutes. 847 tracks. Every play was a choice — to feel, to process, to push through, to rest. You used music the way the best people use it: intentionally, personally, honestly. This wasn't a passive year. This was an active one. And your playlist proves it.",
    },
  },
};

export const chapterTitles = {
  chapter1: { label: 'Chapter One', title: 'The Sound of Who You Think You Are' },
  chapter2: { label: 'Chapter Two', title: 'The Emotional Underbelly' },
  chapter3: { label: 'Chapter Three', title: 'The 2AM Truth' },
  chapter4: { label: 'Chapter Four', title: 'The Phase Shift' },
};

export const archetypes: Record<ToneMode, string> = {
  brutal: 'The Recalibrator',
  poetic: 'The Seeker',
  analytical: 'The Pattern-Maker',
  motivational: 'The Survivor',
};
