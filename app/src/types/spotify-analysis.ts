// Spotify API Response Types
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  preview_url: string | null;
  external_urls: { spotify: string };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyAudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  time_signature: number;
}

export interface SpotifyPlayHistory {
  track: SpotifyTrack;
  played_at: string;
  context: {
    type: string;
    href: string;
    external_urls: { spotify: string };
    uri: string;
  } | null;
}

// Analysis Types
export interface GenreWeight {
  name: string;
  weight: number;
  percentage: number;
}

export interface TimeSeriesPoint {
  date: string;
  valence: number;
  energy: number;
  tempo: number;
  isCopingCluster?: boolean;
}

export interface TimeRange {
  start: string;
  end: string;
  valence: number;
  repeatCount: number;
}

export interface ObsessionEvent {
  trackId: string;
  trackName: string;
  artistName: string;
  playCount: number;
  timeRange: TimeRange;
  isNightTime: boolean;
}

export interface PhaseTransition {
  quarter: string;
  beforeEntropy: number;
  afterEntropy: number;
  topGenreBefore: string;
  topGenreAfter: string;
  trigger: string;
  psychologicalReading: string;
}

export interface HourlyDistribution {
  hours: Map<number, number>;
  nightRatio: number;
  nightValence: number;
  loops: RepeatLoop[];
}

export interface NocturnalProfile {
  nightOwlScore: number;
  nightRatio: number;
  nightValence: number;
  averageNightValence: number;
  sadnessLoops: RepeatLoop[];
  loops: RepeatLoop[];
  insomniaIndicators: boolean;
  confrontation: string;
}

export interface RepeatLoop {
  trackId: string;
  trackName: string;
  count: number;
  avgValence: number;
  timestamps: string[];
}

export interface CopingSignal {
  type: 'repeat_loop' | 'night_sadness' | 'energy_crash' | 'genre_retreat';
  severity: number;
  description: string;
  evidence: string[];
}

// Core Profile Types
export interface ListeningProfile {
  identity: IdentityProfile;
  emotional: EmotionalProfile;
  behavioral: BehavioralProfile;
  temporal: TemporalProfile;
}

export interface IdentityProfile {
  claimedGenres: string[];
  actualTopGenres: GenreWeight[];
  mainstreamPercentage: number;
  hipsterScore: number;
  topArtists: SpotifyArtist[];
  artistDiversity: number;
}

export interface EmotionalProfile {
  valenceVolatility: number;
  energyArc: TimeSeriesPoint[];
  melancholyClusters: TimeRange[];
  copingIndicators: CopingSignal[];
  stabilityScore: number;
  oscillationPattern: number;
  psychologicalState: string;
  averageValence: number;
  averageEnergy: number;
}

export interface BehavioralProfile {
  circadianPatterns: NocturnalProfile;
  obsessionLoops: ObsessionEvent[];
  phaseShifts: PhaseTransition[];
  comfortZoneMetrics: ComfortZoneMetrics;
}

export interface ComfortZoneMetrics {
  bpmVariance: number;
  genreEntropy: number;
  artistLoyalty: number;
  bpmRange: { min: number; max: number };
}

export interface TemporalProfile {
  totalListeningTime: number;
  activeDays: number;
  peakListeningHour: number;
  quarterlyBreakdown: QuarterlyListening[];
}

export interface QuarterlyListening {
  period: string;
  topGenres: GenreWeight[];
  mainstreamPercentage: number;
  averageValence: number;
  averageEnergy: number;
  topTracks: SpotifyTrack[];
}

// Narrative Types
export type ChapterType = 'identity' | 'emotional' | 'nocturnal' | 'phases' | 'summary';
export type ToneMode = 'brutal' | 'poetic' | 'analytical' | 'motivational';

export interface Chapter {
  id: string;
  type: ChapterType;
  title: string;
  subtitle: string;
  narrative: string;
  confrontation: string;
  dataPoints: DataPoint[];
  visualCue: AnimationConfig;
  duration: number;
}

export interface DataPoint {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface AnimationConfig {
  type: 'graph' | 'chart' | 'timeline' | 'particles';
  data?: unknown;
  colors?: string[];
}

export interface DocumentaryScript {
  chapters: Chapter[];
  summary: BrutalSummary;
  totalDuration: number;
  userName: string;
  generatedAt: string;
}

export interface BrutalSummary {
  headline: string;
  subheadline: string;
  keyInsight: string;
  confrontation: string;
  closingThought: string;
  stats: DataPoint[];
}

// UI State Types
export interface AppState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  profile: ListeningProfile | null;
  script: DocumentaryScript | null;
  currentChapter: number;
}

// Viral Content Types
export interface ReelContent {
  script: string;
  visualSuggestions: string[];
  audioSuggestion: string;
  hashtags: string[];
  estimatedEngagement: number;
}

export interface PosterData {
  headline: string;
  stats: DataPoint[];
  userName: string;
  generatedAt: string;
}

// Spotify OAuth Types
export interface SpotifyAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

