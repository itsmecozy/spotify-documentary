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
      
      if (Date.now() >= this.tokenExpiry) {
        this.clearStorage();
        return false;
      }
      return true;
    }
    return false;
  }

  private storeTokens(tokens: SpotifyTokens): void {
    this.accessToken = tokens.access_token;
    this.tokenExpiry = Date.now() + (tokens.expires_in * 1000);
    localStorage.setItem('spotify_access_token', tokens.access_token);
    localStorage.setItem('spotify_refresh_token', tokens.refresh_token);
    localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
  }

  clearStorage(): void {
    this.accessToken = null;
    this.tokenExpiry = 0;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_code_verifier');
  }

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

  async handleCallback(code: string): Promise<boolean> {
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) throw new Error('Code verifier not found');
    
    const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken) throw new Error('Not authenticated');
    
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

  async getCurrentUser(): Promise<{ id: string; display_name: string; images: { url: string }[] }> {
    return this.request('/me');
  }

  async getTopTracks(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 50): Promise<SpotifyTrack[]> {
    const response = await this.request<{ items: SpotifyTrack[] }>(
      `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
    );
    return response.items;
  }

  async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', limit: number = 50): Promise<SpotifyArtist[]> {
    const response = await this.request<{ items: SpotifyArtist[] }>(
      `/me/top/artists?time_range=${timeRange}&limit=${limit}`
    );
    return response.items;
  }

  async getRecentlyPlayed(limit: number = 50): Promise<SpotifyPlayHistory[]> {
    const response = await this.request<{ items: SpotifyPlayHistory[] }>(
      `/me/player/recently-played?limit=${limit}`
    );
    return response.items;
  }

  async getAudioFeatures(trackIds: string[]): Promise<SpotifyAudioFeatures[]> {
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

  async getComprehensiveData(): Promise<{
    topTracks: SpotifyTrack[];
    topArtists: SpotifyArtist[];
    recentlyPlayed: SpotifyPlayHistory[];
    audioFeatures: Map<string, SpotifyAudioFeatures>;
  }> {
    const [topTracks, topArtists, recentlyPlayed] = await Promise.all([
      this.getTopTracks('medium_term', 50),
      this.getTopArtists('medium_term', 50),
      this.getRecentlyPlayed(50)
    ]);

    const allTrackIds = [...topTracks.map(t => t.id), ...recentlyPlayed.map(p => p.track.id)];
    const uniqueTrackIds = [...new Set(allTrackIds)];
    const audioFeaturesList = await this.getAudioFeatures(uniqueTrackIds);
    const audioFeatures = new Map(audioFeaturesList.map(f => [f.id, f]));

    return { topTracks, topArtists, recentlyPlayed, audioFeatures };
  }
}

// FIXED SERVICE INSTANCE
export const createSpotifyService = (): SpotifyService => {
  const clientId = '7f21fe736e1e4ae1afed15d3599bb01c';
  const redirectUri = 'https://fantastic-computing-machine-q9977vv49r39w5g-5173.app.github.dev/callback';
  
  return new SpotifyService(clientId, redirectUri);
};

// Mock data remains for fallback
export const generateMockData = () => {
  return {
    topTracks: [],
    topArtists: [],
    recentlyPlayed: [],
    audioFeatures: new Map()
  };
};
    
