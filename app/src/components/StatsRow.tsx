import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface Stat {
  value: string;
  label: string;
  pct: string;
}

interface StatsRowProps {
  stats: Stat[];
}

export function StatsRow({ stats }: StatsRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className="stats-row">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: i * 0.08 }}
          className="stat-cell"
        >
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
          <div className="stat-bar" style={{ '--pct': stat.pct } as React.CSSProperties} />
        </motion.div>
      ))}
    </div>
  );
}
