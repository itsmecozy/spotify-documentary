import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Intro } from '@/sections/Intro';
import { Hero } from '@/sections/Hero';
import { Chapter } from '@/sections/Chapter';
import { FinalVerdict } from '@/sections/FinalVerdict';
import { StatsRow } from '@/components/StatsRow';
import { EmotionalWave } from '@/components/EmotionalWave';
import { ToneSwitcher } from '@/components/ToneSwitcher';
import { ProgressBar } from '@/components/ProgressBar';
import { Header } from '@/components/Header';
import { toneData, chapterTitles, archetypes, type ToneMode } from '@/lib/narrative/toneData';
import { createSpotifyService } from '@/lib/spotify/service';
import { buildListeningProfile, mapProfileToUIData, type UIData } from '@/lib/spotify/transformer';
import type { ListeningProfile } from '@/types/spotify-analysis';
import './App.css';

const spotifyService = createSpotifyService();

const DEMO_DATA: UIData = {
  userName: 'Alex Reyes',
  totalMinutes: 23847,
  totalSongs: 847,
  topArtists: [
    { rank: '01', title: 'Mitski', subtitle: 'Indie / Art Rock', barWidth: '95%' },
    { rank: '02', title: 'boygenius', subtitle: 'Indie Folk', barWidth: '78%' },
    { rank: '03', title: 'Hozier', subtitle: 'Alt Folk', barWidth: '63%' },
    { rank: '04', title: 'Cigarettes After Sex', subtitle: 'Dream Pop', barWidth: '56%' },
  ],
  genreDistribution: [
    { label: 'Indie', height: 72 },
    { label: 'Alt Pop', height: 58 },
    { label: 'Dream Pop', height: 44 },
    { label: 'Folk', height: 31 },
    { label: 'R&B', height: 22 },
    { label: 'Electronic', height: 14 },
    { label: 'Other', height: 8 },
  ],
  emotionalStats: [
    { value: '0.31', label: 'Avg Valence', pct: '31%' },
    { value: '0.74', label: 'Avg Energy', pct: '74%' },
    { value: '0.62', label: 'Acousticness', pct: '62%' },
    { value: '128', label: 'Avg BPM', pct: '60%' },
    { value: '0.19', label: 'Danceability', pct: '19%' },
  ],
  loopedTracks: [
    { rank: '', title: 'Washing Machine Heart', subtitle: 'Mitski · 73 plays · 11:47 PM avg', barWidth: '100%' },
    { rank: '', title: 'Motion Sickness', subtitle: 'Phoebe Bridgers · 51 plays', barWidth: '70%' },
    { rank: '', title: 'Savior Complex', subtitle: 'Phoebe Bridgers · 44 plays', barWidth: '60%' },
  ],
  identityDrift: [
    { label: 'Jan', height: 20 }, { label: 'Feb', height: 22 },
    { label: 'Mar', height: 18 }, { label: 'Apr', height: 25 },
    { label: 'May', height: 30 }, { label: 'Jun', height: 35 },
    { label: 'Jul', height: 45 }, { label: 'Aug', height: 88 },
    { label: 'Sep', height: 72 }, { label: 'Oct', height: 58 },
    { label: 'Nov', height: 42 }, { label: 'Dec', height: 38 },
  ],
  emotionalArc: [],
};

function LoadingScreen({ stage }: { stage: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'var(--black)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '1.5rem', zIndex: 600,
      }}
    >
      <div style={{ fontSize: '9px', letterSpacing: '0.5em', color: 'var(--steel)', textTransform: 'uppercase' }}>
        Compiling Your Documentary
      </div>
      <div style={{ fontSize: '15px', color: 'var(--off-white)', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
        {stage}
      </div>
      <div style={{ width: 200, height: 1, background: 'var(--dim)', overflow: 'hidden', position: 'relative' }}>
        <motion.div
          style={{ position: 'absolute', inset: 0, background: 'var(--red)' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--black)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '1rem',
    }}>
      <div style={{ color: 'var(--red)', fontSize: '9px', letterSpacing: '0.4em', textTransform: 'uppercase' }}>Error</div>
      <div style={{ fontSize: '15px', maxWidth: 420, textAlign: 'center', lineHeight: 1.7, color: 'var(--off-white)' }}>{message}</div>
      <button onClick={onRetry} style={{
        marginTop: '1.5rem', padding: '14px 40px', background: 'transparent',
        border: '1px solid var(--steel)', color: 'var(--off-white)',
        fontFamily: "'DM Mono', monospace", fontSize: '10px',
        letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer',
      }}>
        Try Again
      </button>
    </div>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [tone, setTone] = useState<ToneMode>('brutal');
  const [currentChapter, setCurrentChapter] = useState('PROLOGUE');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('Connecting to Spotify...');
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uiData, setUiData] = useState<UIData>(DEMO_DATA);
  const [_profile, setProfile] = useState<ListeningProfile | null>(null);

  const content = useMemo(() => toneData[tone], [tone]);
  const archetype = archetypes[tone];

  const fetchAndProcess = useCallback(async () => {
    setLoadingStage('Fetching your listening history...');
    const [comprehensive, user, shortTerm, mediumTerm, longTerm] = await Promise.all([
      spotifyService.getComprehensiveData(),
      spotifyService.getCurrentUser(),
      spotifyService.getTopTracks('short_term', 50),
      spotifyService.getTopTracks('medium_term', 50),
      spotifyService.getTopTracks('long_term', 50),
    ]);
    setLoadingStage('Analyzing your emotional arc...');
    const listeningProfile = buildListeningProfile(
      comprehensive,
      { short: shortTerm, medium: mediumTerm, long: longTerm }
    );
    setLoadingStage('Writing your documentary...');
    const computed = mapProfileToUIData(listeningProfile, user);
    setProfile(listeningProfile);
    setUiData(computed);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const authError = params.get('error');

    if (authError) {
      setError(`Spotify authorization was denied: ${authError}`);
      return;
    }

    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoading(true);
      spotifyService.handleCallback(code)
        .then(() => { setIsAuthenticated(true); return fetchAndProcess(); })
        .catch(err => { setError(`Authentication failed: ${err.message}`); setIsLoading(false); });
      return;
    }

    const hasToken = spotifyService.initializeFromStorage();
    if (hasToken) {
      setIsAuthenticated(true);
      setIsLoading(true);
      fetchAndProcess().catch(() => {
        spotifyService.clearStorage();
        setIsAuthenticated(false);
        setIsLoading(false);
      });
    }
  }, [fetchAndProcess]);

  const handleLogin = useCallback(() => { spotifyService.initiateAuth(); }, []);
  const handleStart = useCallback(() => { setShowIntro(false); }, []);
  const handleChapterReveal = useCallback((id: string) => { setCurrentChapter(id); }, []);

  // Scroll spy — IDs match Chapter's `number` prop: '1','2','3','4' and 'ch5' for verdict
  useEffect(() => {
    if (showIntro) return;
    const handleScroll = () => {
      const chapters = ['hero', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5'];
      const names = ['PROLOGUE', 'CHAPTER ONE', 'CHAPTER TWO', 'CHAPTER THREE', 'CHAPTER FOUR', 'FINAL CHAPTER'];
      for (let i = chapters.length - 1; i >= 0; i--) {
        const el = document.getElementById(chapters[i]);
        if (el && el.getBoundingClientRect().top <= window.innerHeight / 2) {
          setCurrentChapter(names[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showIntro]);

  if (error) return <ErrorScreen message={error} onRetry={() => { setError(null); window.location.href = '/'; }} />;

  return (
    <div className="min-h-screen" style={{ background: 'var(--black)' }}>
      <AnimatePresence>{isLoading && <LoadingScreen stage={loadingStage} />}</AnimatePresence>

      <AnimatePresence>
        {showIntro && !isLoading && (
          <Intro onStart={handleStart} isVisible={showIntro} onLogin={handleLogin} isAuthenticated={isAuthenticated} />
        )}
      </AnimatePresence>

      {!showIntro && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}>
          <ProgressBar />
          <Header chapterName={currentChapter} />
          <ToneSwitcher currentTone={tone} onToneChange={setTone} />

          <main id="main">
            <Hero userName={uiData.userName} totalMinutes={uiData.totalMinutes} totalSongs={uiData.totalSongs} archetype={archetype} />

            <Chapter number="1" label={chapterTitles.chapter1.label} title={chapterTitles.chapter1.title}
              narrative={content.chapter1.narrative} verdict={content.chapter1.verdict}
              cards={uiData.topArtists} bars={uiData.genreDistribution}
              chartTitle="Genre Distribution — Full Year" onReveal={() => handleChapterReveal('CHAPTER ONE')} />

            <Chapter number="2" label={chapterTitles.chapter2.label} title={chapterTitles.chapter2.title}
              narrative={content.chapter2.narrative} verdict={content.chapter2.verdict}
              onReveal={() => handleChapterReveal('CHAPTER TWO')}>
              <StatsRow stats={uiData.emotionalStats} />
              <EmotionalWave title="Emotional Volatility Index — Jan to Dec 2025" dataPoints={uiData.emotionalArc} />
            </Chapter>

            <Chapter number="3" label={chapterTitles.chapter3.label} title={chapterTitles.chapter3.title}
              narrative={content.chapter3.narrative} verdict={content.chapter3.verdict}
              cards={uiData.loopedTracks} onReveal={() => handleChapterReveal('CHAPTER THREE')} />

            <Chapter number="4" label={chapterTitles.chapter4.label} title={chapterTitles.chapter4.title}
              narrative={content.chapter4.narrative} verdict={content.chapter4.verdict}
              bars={uiData.identityDrift} chartTitle="Identity Drift Score — Genre Entropy Month-to-Month"
              onReveal={() => handleChapterReveal('CHAPTER FOUR')} />

            <FinalVerdict headline={content.final.headline} body={content.final.body}
              archetype={archetype} totalMinutes={uiData.totalMinutes} totalSongs={uiData.totalSongs} />
          </main>
        </motion.div>
      )}
    </div>
  );
}

export default App;
