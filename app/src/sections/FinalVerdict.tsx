import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';

interface FinalVerdictProps {
  headline: string;
  body: string;
  archetype: string;
  totalMinutes: number;
  totalSongs: number;
}

export function FinalVerdict({ headline, body, archetype, totalMinutes, totalSongs }: FinalVerdictProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [copied, setCopied] = useState(false);
  const [reelCopied, setReelCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReel = () => {
    const script = `${headline.replace(/<br\s*\/?>/gi, ' ')} — ${totalMinutes.toLocaleString()} minutes. ${totalSongs} songs. My year in music, brutally analyzed. #Frequencies2025 #SpotifyData`;
    navigator.clipboard.writeText(script).catch(() => {});
    setReelCopied(true);
    setTimeout(() => setReelCopied(false), 2000);
  };

  // body uses literal minute/song counts from toneData — replace with real values
  const resolvedBody = body
    .replace(/23[,.]?847/g, totalMinutes.toLocaleString())
    .replace(/\b847\b/g, totalSongs.toLocaleString())
    .replace(/Twenty-three thousand/gi, `${Math.round(totalMinutes / 1000)}K`)
    .replace(/Eight hundred forty-seven/gi, `${totalSongs}`);

  return (
    <motion.section
      ref={ref}
      id="ch5"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="verdict-section chapter-section"
    >
      <div className="verdict-year">2025</div>
      <div className="verdict-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="chapter-label"
          style={{ fontSize: '10px', letterSpacing: '0.5em' }}
        >
          Final Chapter · The Verdict
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="verdict-headline"
          dangerouslySetInnerHTML={{ __html: headline }}
        />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="verdict-body"
        >
          {resolvedBody}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="archetype-badge"
        >
          Archetype: {archetype}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="share-card"
        >
          <h3>Share Your Documentary</h3>
          <p>
            Your 2025 Frequencies report. A psychological portrait built from{' '}
            {totalSongs.toLocaleString()} songs and {totalMinutes.toLocaleString()} minutes of honest listening.
          </p>
          <div className="share-btns">
            <button className="share-btn" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button className="share-btn primary" onClick={handleReel}>
              {reelCopied ? 'Script Copied ✓' : 'Generate Reel ↗'}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
