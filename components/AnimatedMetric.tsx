'use client';

import { motion } from 'framer-motion';

export function AnimatedMetric({ label, value }: { label: string; value: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/10 bg-surface p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </motion.div>
  );
}
