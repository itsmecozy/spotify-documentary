import { motion } from 'framer-motion';

interface IntroProps {
  onStart: () => void;
  isVisible: boolean;
  onLogin: () => void;
  isAuthenticated: boolean;
}

export function Intro({ onStart, isVisible, onLogin, isAuthenticated }: IntroProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 1.1, ease: 'easeInOut' }}
      className="intro-screen"
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }} className="intro-tag"
      >
        A Documentary Film About Your Taste
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }} className="intro-title"
      >
        FREQUENCIES
        <span>2025</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.7 }} className="intro-sub"
      >
        The music you chose. The person it revealed.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.9 }}
        style={{ display: 'flex', gap: '16px', marginTop: '60px', flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {!isAuthenticated && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onLogin} className="intro-btn"
            style={{ background: 'var(--red)', borderColor: 'var(--red)', color: 'var(--off-white)' }}
          >
            ▶ Connect Spotify
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="intro-btn"
          style={isAuthenticated ? {} : {
            background: 'transparent', borderColor: '#333', color: 'var(--steel)'
          }}
        >
          {isAuthenticated ? '▶ View My Documentary' : 'View Demo'}
        </motion.button>
      </motion.div>

      {!isAuthenticated && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          style={{ marginTop: '24px', fontSize: '10px', color: 'var(--steel)', letterSpacing: '0.1em' }}
        >
          Requires a Spotify account · No data is stored
        </motion.p>
      )}
    </motion.div>
  );
}
