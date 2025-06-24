'use client';

import { usePrayerTime } from '@/contexts/prayer-time-context';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const containerVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.2,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};


export function PrayerReminderOverlay() {
  const { activeOverlay, handleOverlayEnd } = usePrayerTime();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!activeOverlay) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, activeOverlay.endTime - now);
      
      if (remaining === 0) {
        handleOverlayEnd();
        return;
      }

      const minutes = Math.floor((remaining / 1000) / 60);
      const seconds = Math.floor((remaining / 1000) % 60);
      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [activeOverlay, handleOverlayEnd]);

  const messages = {
    live: {
      title: `حان وقت صلاة ${activeOverlay?.prayerName}`,
      subtitle: 'استعد وخذ لحظاتك للخشوع والتأمل.'
    },
    'catch-up': {
      title: 'لا تفوت الصلاة',
      subtitle: 'هذه فرصة للتوبة والتقرب إلى الله. استثمر هذه الدقائق.'
    }
  };
  
  const currentMessage = activeOverlay ? messages[activeOverlay.type] : { title: '', subtitle: '' };

  return (
    <AnimatePresence>
      {activeOverlay && (
        <motion.div
          key="prayer-overlay"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/50 backdrop-blur-md"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="text-center text-white p-8 rounded-lg max-w-lg"
            variants={containerVariants}
          >
            <motion.h2 variants={itemVariants} className="text-4xl lg:text-5xl font-bold mb-4">
              {currentMessage.title}
            </motion.h2>
            <motion.p variants={itemVariants} className="text-lg lg:text-xl mb-6 text-white/90">
              {currentMessage.subtitle}
            </motion.p>
            <motion.div variants={itemVariants} className="text-6xl lg:text-8xl font-mono bg-white/20 px-6 py-3 rounded-lg tabular-nums tracking-widest">
              {timeLeft}
            </motion.div>
            <motion.p variants={itemVariants} className="text-sm mt-4 text-white/70">
              سيكون التطبيق متاحًا بعد انتهاء العد التنازلي.
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
