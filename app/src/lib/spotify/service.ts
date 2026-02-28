import type { 
  SpotifyTrack, 
  SpotifyArtist, 
  SpotifyAudioFeatures, 
  SpotifyPlayHistory,
  SpotifyTokens 
} from '@/types/spotify-analysis';

// Spotify API Configuration
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Required scopes for the app
const REQUIRED_SCOPES = [
  'user-top-read',
  'user-read-recently-played',
  'user-read-private',
  'user-read-email'
];

// Generate PKCE code verifier
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate PKCE code challenge
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Spotify Service Class
export class SpotifyService {
  private clientId: string;
  private redirectUri: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(clientId: string, redirectUri: string) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }

  // Initialize from stored tokens
  initializeFromStorage(): boolean {
    const accessToken = localStorage.getItem('spotify_access_token');
    const expiry = localStorage.getItem('spotify_token_expiry');

    if (accessToken && expiry) {
      this.accessToken = accessToken;
      this.tokenExpiry = parseInt(expiry, 10);
      
      // Check if token is expired
      if (Date.now() >= this.tokenExpiry) {
        this.clearStorage();
        return false;
      }
      
      return true;
    }
    
    return false;
  }

  // Store tokens
  private storeTokens(tokens: SpotifyTokens): void {
    this.accessToken = tokens.access_token;
    this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);
    
    localStorage.setItem('spotify_access_token', tokens.access_token);
    localStorage.setItem('spotify_refresh_token', tokens.refresh_token);
    localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
  }

  // Clear stored tokens
  clearStorage(): void {
    this.accessToken = null;
    this.tokenExpiry = 0;
    
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_code_verifier');
  }

  // Initiate OAuth flow
  async initiateAuth(): Promise<void> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: REQUIRED_SCOPES.join(' ')
    });
    
    window.location.href = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
  }

  // Handle OAuth callback
  async handleCallback(code: string): Promise<boolean> {
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }
    
    const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: codeVerifier
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }
    
    const tokens: SpotifyTokens = await response.json();
    this.storeTokens(tokens);
    
    return true;
  }

  // Make authenticated API request
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (response.status === 401) {
      this.clearStorage();
      throw new Error('Token expired');
    }
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }
    
    return response.json();
  }

  // Get current user profile
  async getCurrentUser(): Promise<{ id: string; display_name: string; images: { url: string }[] }> {
    return this.request('/me');
  }

  // Get top tracks
  async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 50): Promise<SpotifyTrack[]> {
    const response = await this.request<{ items: SpotifyTrack[] }>(
      `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
    );
    return response.items;
  }

  // Get top artists
  async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 50): Promise<SpotifyArtist[]> {
    const response = await this.request<{ items: SpotifyArtist[] }>(
      `/me/top/artists?time_range=${timeRange}&limit=${limit}`
    );
    return response.items;
  }

  // Get recently played tracks
  async getRecentlyPlayed(limit: number = 50): Promise<SpotifyPlayHistory[]> {
    const response = await this.request<{ items: SpotifyPlayHistory[] }>(
      `/me/player/recently-played?limit=${limit}`
    );
    return response.items;
  }

  // Get audio features for tracks
  async getAudioFeatures(trackIds: string[]): Promise<SpotifyAudioFeatures[]> {
    // Spotify API allows max 100 IDs per request
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 100) {
      chunks.push(trackIds.slice(i, i + 100));
    }
    
    const allFeatures: SpotifyAudioFeatures[] = [];
    
    for (const chunk of chunks) {
      const response = await this.request<{ audio_features: SpotifyAudioFeatures[] }>(
        `/audio-features?ids=${chunk.join(',')}`
      );
      allFeatures.push(...response.audio_features.filter(f => f !== null));
    }
    
    return allFeatures;
  }

  // Get comprehensive listening data
  async getComprehensiveData(): Promise<{
    topTracks: SpotifyTrack[];
    topArtists: SpotifyArtist[];
    recentlyPlayed: SpotifyPlayHistory[];
    audioFeatures: Map<string, SpotifyAudioFeatures>;
  }> {
    // Fetch all data in parallel
    const [topTracks, topArtists, recentlyPlayed] = await Promise.all([
      this.getTopTracks('medium_term', 50),
      this.getTopArtists('medium_term', 50),
      this.getRecentlyPlayed(50)
    ]);

    // Get audio features for all unique tracks
    const allTrackIds = [
      ...topTracks.map(t => t.id),
      ...recentlyPlayed.map(p => p.track.id)
    ];
    const uniqueTrackIds = [...new Set(allTrackIds)];
    
    const audioFeaturesList = await this.getAudioFeatures(uniqueTrackIds);
    const audioFeatures = new Map(
      audioFeaturesList.map(f => [f.id, f])
    );

    return {
      topTracks,
      topArtists,
      recentlyPlayed,
      audioFeatures
    };
  }
}

// Create singleton instance
export const createSpotifyService = (): SpotifyService => {
  // For demo purposes, we'll use a placeholder client ID
  // In production, this should come from environment variables
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'demo-client-id';
  const redirectUri = typeof window !== 'undefined' 
    ? `${window.location.origin}/callback`
    : 'http://localhost:5173/callback';
  
  return new SpotifyService(clientId, redirectUri);
};

// Mock data for demo mode
export const generateMockData = () => {
  const mockArtists: SpotifyArtist[] = [
    {
      id: '1',
      name: 'The Weeknd',
      genres: ['canadian contemporary r&b', 'pop', 'r&b'],
      popularity: 95,
      images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb9e528e2009601d874c5f8c31', height: 640, width: 640 }],
      external_urls: { spotify: 'https://open.spotify.com/artist/1Xyo4u8uXC1ZmMpatF05PJ' }
    },
    {
      id: '2',
      name: 'Taylor Swift',
      genres: ['pop', 'country pop'],
      popularity: 98,
      images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb9e528e2009601d874c5f8c31', height: 640, width: 640 }],
      external_urls: { spotify: 'https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02' }
    },
    {
      id: '3',
      name: 'Drake',
      genres: ['canadian hip hop', 'hip hop', 'pop rap', 'r&b'],
      popularity: 94,
      images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb9e528e2009601d874c5f8c31', height: 640, width: 640 }],
      external_urls: { spotify: 'https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4' }
    },
    {
      id: '4',
      name: 'Billie Eilish',
      genres: ['art pop', 'electropop', 'pop'],
      popularity: 91,
      images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb9e528e2009601d874c5f8c31', height: 640, width: 640 }],
      external_urls: { spotify: 'https://open.spotify.com/artist/6qqNVTkY8uBg9cP3Jd7DAH' }
    },
    {
      id: '5',
      name: 'Arctic Monkeys',
      genres: ['garage rock', 'indie rock', 'permanent wave', 'rock', 'sheffield indie'],
      popularity: 85,
      images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb9e528e2009601d874c5f8c31', height: 640, width: 640 }],
      external_urls: { spotify: 'https://open.spotify.com/artist/7Ln80lUS6He07XqHI8baHH' }
    }
  ];

  const mockTracks: SpotifyTrack[] = [
    {
      id: 't1',
      name: 'Blinding Lights',
      artists: [mockArtists[0]],
      album: { id: 'a1', name: 'After Hours', images: [], release_date: '2020-03-20' },
      duration_ms: 200000,
      explicit: false,
      popularity: 95,
      preview_url: null,
      external_urls: { spotify: 'https://open.spotify.com/track/0VjIjW4GlUfm5Mv8vyyLtU' }
    },
    {
      id: 't2',
      name: 'Cruel Summer',
      artists: [mockArtists[1]],
      album: { id: 'a2', name: 'Lover', images: [], release_date: '2019-08-23' },
      duration_ms: 178000,
      explicit: false,
      popularity: 96,
      preview_url: null,
      external_urls: { spotify: 'https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr' }
    },
    {
      id: 't3',
      name: 'God\'s Plan',
      artists: [mockArtists[2]],
      album: { id: 'a3', name: 'Scorpion', images: [], release_date: '2018-06-29' },
      duration_ms: 198000,
      explicit: true,
      popularity: 92,
      preview_url: null,
      external_urls: { spotify: 'https://open.spotify.com/track/6DCZcSspjsKoFjzjrWoCdn' }
    },
    {
      id: 't4',
      name: 'What Was I Made For?',
      artists: [mockArtists[3]],
      album: { id: 'a4', name: 'Barbie The Album', images: [], release_date: '2023-07-21' },
      duration_ms: 222000,
      explicit: false,
      popularity: 94,
      preview_url: null,
      external_urls: { spotify: 'https://open.spotify.com/track/7qEHsqek33rTcFNT9PFqLf' }
    },
    {
      id: 't5',
      name: 'Do I Wanna Know?',
      artists: [mockArtists[4]],
      album: { id: 'a5', name: 'AM', images: [], release_date: '2013-09-09' },
      duration_ms: 272000,
      explicit: false,
      popularity: 88,
      preview_url: null,
      external_urls: { spotify: 'https://open.spotify.com/track/5FVd6KXrgO9B3JPmC8OPst' }
    }
  ];

  const mockAudioFeatures: SpotifyAudioFeatures[] = [
    { id: 't1', danceability: 0.73, energy: 0.73, key: 1, loudness: -5.5, mode: 0, speechiness: 0.03, acousticness: 0.14, instrumentalness: 0.0001, liveness: 0.09, valence: 0.33, tempo: 171, duration_ms: 200000, time_signature: 4 },
    { id: 't2', danceability: 0.69, energy: 0.74, key: 9, loudness: -5.4, mode: 1, speechiness: 0.07, acousticness: 0.20, instrumentalness: 0.0001, liveness: 0.11, valence: 0.56, tempo: 170, duration_ms: 178000, time_signature: 4 },
    { id: 't3', danceability: 0.75, energy: 0.45, key: 7, loudness: -9.2, mode: 1, speechiness: 0.14, acousticness: 0.30, instrumentalness: 0.0001, liveness: 0.35, valence: 0.36, tempo: 77, duration_ms: 198000, time_signature: 4 },
    { id: 't4', danceability: 0.44, energy: 0.23, key: 0, loudness: -14.5, mode: 1, speechiness: 0.05, acousticness: 0.95, instrumentalness: 0.0001, liveness: 0.10, valence: 0.14, tempo: 78, duration_ms: 222000, time_signature: 4 },
    { id: 't5', danceability: 0.55, energy: 0.54, key: 5, loudness: -7.2, mode: 0, speechiness: 0.04, acousticness: 0.20, instrumentalness: 0.01, liveness: 0.15, valence: 0.28, tempo: 85, duration_ms: 272000, time_signature: 4 }
  ];

  const mockPlayHistory: SpotifyPlayHistory[] = mockTracks.map((track, i) => ({
    track,
    played_at: new Date(Date.now() - i * 3600000).toISOString(),
    context: null
  }));

  return {
    topTracks: mockTracks,
    topArtists: mockArtists,
    recentlyPlayed: mockPlayHistory,
    audioFeatures: new Map(mockAudioFeatures.map(f => [f.id, f]))
  };
};
      
