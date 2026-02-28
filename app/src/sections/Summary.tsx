import { motion } from 'framer-motion';
import type { BrutalSummary } from '@/types/spotify-analysis';
import { Share2, Download, RotateCcw } from 'lucide-react';

interface SummaryProps {
  summary: BrutalSummary;
  userName: string;
  onReset: () => void;
}

export function Summary({ summary, userName, onReset }: SummaryProps) {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-[#1DB954]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Final chapter label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <span className="cinema-subtitle text-[#1DB954]">The Final Chapter</span>
        </motion.div>
        
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          viewport={{ once: true }}
          className="cinema-title mb-4"
        >
          {summary.headline}
        </motion.h2>
        
        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl text-neutral-400 mb-12"
        >
          {summary.subheadline}
        </motion.p>
        
        {/* Key insight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="glass-panel p-8 mb-12 max-w-2xl mx-auto"
        >
          <p className="text-lg text-neutral-300 leading-relaxed">
            {summary.keyInsight}
          </p>
        </motion.div>
        
        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {summary.stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
              viewport={{ once: true }}
              className="glass-panel p-6 text-center"
            >
              <div className="stat-value mb-2">{stat.value}</div>
              <div className="text-sm text-neutral-500">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Confrontation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="glass-panel p-8 border-l-4 border-l-[#1DB954] max-w-2xl mx-auto">
            <p className="text-lg md:text-xl text-white italic leading-relaxed">
              "{summary.confrontation}"
            </p>
          </div>
        </motion.div>
        
        {/* Closing thought */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          viewport={{ once: true }}
          className="text-neutral-400 text-lg mb-12 max-w-xl mx-auto"
        >
          {summary.closingThought}
        </motion.p>
        
        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
          <button 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
            onClick={() => alert('Share feature coming soon!')}
          >
            <Share2 className="w-5 h-5" />
            Share Your Documentary
          </button>
          
          <button 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
            onClick={() => alert('Download feature coming soon!')}
          >
            <Download className="w-5 h-5" />
            Download Poster
          </button>
          
          <button 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1DB954] text-black font-medium hover:bg-[#1ed760] transition-colors"
            onClick={onReset}
          >
            <RotateCcw className="w-5 h-5" />
            Start Over
          </button>
        </motion.div>
        
        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          viewport={{ once: true }}
          className="mt-20 pt-8 border-t border-white/10"
        >
          <p className="text-neutral-600 text-sm">
            Generated for {userName} • {new Date().toLocaleDateString()}
          </p>
          <p className="text-neutral-700 text-xs mt-2">
            Spotify Data Documentary Generator • Not affiliated with Spotify
          </p>
        </motion.div>
      </div>
    </section>
  );
}
