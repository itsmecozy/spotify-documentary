import { motion } from 'framer-motion';
import type { ToneMode } from '@/lib/narrative/toneData';

interface ToneSwitcherProps {
  currentTone: ToneMode;
  onToneChange: (tone: ToneMode) => void;
}

const tones: { id: ToneMode; label: string }[] = [
  { id: 'brutal', label: 'Brutal' },
  { id: 'poetic', label: 'Poetic' },
  { id: 'analytical', label: 'Analytical' },
  { id: 'motivational', label: 'Motivational' },
];

export function ToneSwitcher({ currentTone, onToneChange }: ToneSwitcherProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 1 }}
      className="tone-switcher"
    >
      <div className="tone-label">Tone Mode</div>
      {tones.map(tone => (
        <motion.button
          key={tone.id}
          className={`tone-btn ${currentTone === tone.id ? 'active' : ''}`}
          onClick={() => onToneChange(tone.id)}
          whileHover={{ x: -3 }}
          transition={{ duration: 0.15 }}
        >
          {tone.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
