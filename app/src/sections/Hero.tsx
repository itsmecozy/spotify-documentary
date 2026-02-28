import { motion } from 'framer-motion';

interface HeroProps {
  userName: string;
  totalMinutes: number;
  totalSongs: number;
  archetype: string;
}

export function Hero({ userName, totalMinutes, totalSongs, archetype }: HeroProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  return (
    <section className="hero-section" id="hero">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="big-stat"
      >
        <div className="number">{formatNumber(totalMinutes)}</div>
        <div className="label">Minutes Consumed</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
        className="hero-eyebrow"
      >
        ● Your 2025 in Music · Presented as Documentary
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        viewport={{ once: true }}
        className="hero-title"
      >
        You listened to <em>{totalSongs.toLocaleString()} songs.</em>
        <br />
        You actually heard about <em>twelve.</em>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        viewport={{ once: true }}
        className="hero-meta"
      >
        <div className="meta-item">
          <label>Subject</label>
          <span>{userName}</span>
        </div>
        <div className="meta-item">
          <label>Period</label>
          <span>Jan – Dec 2025</span>
        </div>
        <div className="meta-item">
          <label>Chapters</label>
          <span>5</span>
        </div>
        <div className="meta-item">
          <label>Classified As</label>
          <span className="hl-red">{archetype}</span>
        </div>
      </motion.div>
    </section>
  );
}

