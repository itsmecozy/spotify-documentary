import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { Chapter } from '@/types/spotify-analysis';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DocumentaryChapterProps {
  chapter: Chapter;
  index: number;
}

export function DocumentaryChapter({ chapter, index }: DocumentaryChapterProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.9, 1, 1, 0.9]);
  
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-[#1DB954]" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-neutral-500" />;
    }
  };
  
  return (
    <motion.section
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 relative"
      style={{ opacity, y, scale }}
    >
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5"
          style={{
            background: `radial-gradient(circle, ${index % 2 === 0 ? '#1DB954' : '#ffffff'} 0%, transparent 70%)`
          }}
        />
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Chapter number */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <span className="cinema-subtitle text-[#1DB954]">
            Chapter {String(index + 1).padStart(2, '0')}
          </span>
        </motion.div>
        
        {/* Chapter title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="chapter-title mb-4"
        >
          {chapter.title}
        </motion.h2>
        
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-neutral-500 text-lg mb-12"
        >
          {chapter.subtitle}
        </motion.p>
        
        {/* Narrative text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="narrative-text mb-8">
            {chapter.narrative}
          </p>
          
          {/* Confrontation box */}
          <div className="glass-panel p-6 md:p-8 border-l-4 border-l-[#1DB954]">
            <p className="text-lg md:text-xl text-white italic leading-relaxed">
              "{chapter.confrontation}"
            </p>
          </div>
        </motion.div>
        
        {/* Data points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-3"
        >
          {chapter.dataPoints.map((point, i) => (
            <motion.div
              key={point.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              viewport={{ once: true }}
              className="data-pill group hover:bg-white/10 transition-colors"
            >
              <span className="text-neutral-400">{point.label}:</span>
              <span className="text-white font-semibold">{point.value}</span>
              {point.trend && getTrendIcon(point.trend)}
              {point.subtext && (
                <span className="text-neutral-500 text-xs hidden group-hover:inline transition-all">
                  ({point.subtext})
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
        
        {/* Visual decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 flex justify-center"
        >
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-[#1DB954]/30"
                style={{
                  height: `${20 + Math.random() * 40}px`,
                  animation: `pulse 2s ease-in-out ${i * 0.2}s infinite`
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
