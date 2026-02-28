import { motion } from 'framer-motion';

interface HeaderProps {
  chapterName: string;
}

export function Header({ chapterName }: HeaderProps) {
  return (
    <motion.header
      className="doc-header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="logo">FREQUENCIES</div>
      <motion.div
        key={chapterName}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="chapter-indicator"
        style={{ fontSize: '9px', letterSpacing: '0.45em', color: 'var(--steel)', textTransform: 'uppercase' }}
      >
        — {chapterName}
      </motion.div>
    </motion.header>
  );
}

