import { motion, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface CardData {
  rank: string;
  title: string;
  subtitle: string;
  barWidth: string;
}

interface BarData {
  label: string;
  height: number;
}

interface ChapterProps {
  number: string;
  label: string;
  title: string;
  narrative: string[];
  verdict: string;
  cards?: CardData[];
  bars?: BarData[];
  chartTitle?: string;
  onReveal?: () => void;
  children?: React.ReactNode;
}

export function Chapter({
  number,
  label,
  title,
  narrative,
  verdict,
  cards,
  bars,
  chartTitle,
  onReveal,
  children,
}: ChapterProps) {
  const ref = useRef<HTMLElement>(null);
  // id uses number directly: '1','2','3','4' → matches scroll-spy in App.tsx
  const id = `ch${number}`;
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (isInView && onReveal) onReveal();
  }, [isInView, onReveal]);

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="chapter-section"
    >
      <div className="chapter-number">{number.padStart(2, '0')}</div>
      <div className="chapter-label">{label}</div>
      <h2 className="chapter-title">{title}</h2>

      <div className="narrative">
        {narrative.map((paragraph, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: paragraph }} />
        ))}
        <div className="verdict">"{verdict}"</div>
      </div>

      {cards && cards.length > 0 && (
        <div className="cards-grid">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="data-card"
            >
              <div className="card-rank">{card.rank}</div>
              <div className="card-title">{card.title}</div>
              <div className="card-sub">{card.subtitle}</div>
              <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width: card.barWidth } : {}}
                transition={{ duration: 1.1, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                className="card-bar"
              />
            </motion.div>
          ))}
        </div>
      )}

      {bars && bars.length > 0 && chartTitle && (
        <div className="chart-container">
          <div className="chart-title">{chartTitle}</div>
          <div className="bar-chart">
            {bars.map((bar, i) => (
              <div key={i} className="bar-wrap">
                <div className="bar">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={isInView ? { height: `${bar.height}%` } : {}}
                    transition={{ duration: 1.3, delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="bar-fill"
                  />
                </div>
                <div className="bar-label">{bar.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {children}
    </motion.section>
  );
}
