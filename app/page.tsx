'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ParticleCanvas } from '@/components/ParticleCanvas';

const sections = [
  'Track full pipeline in real time',
  'Forecast next-month and yearly revenue',
  'Detect risks before they impact cashflow',
];

export default function HomePage() {
  return (
    <main className="relative overflow-x-hidden">
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(-45deg,#05070f,#131a2f,#1a2040,#0b1020)] bg-[length:300%_300%] animate-gradient" />
        <div className="absolute inset-0 -z-10 opacity-60">
          <ParticleCanvas />
        </div>
        <div className="max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 text-5xl font-semibold tracking-tight md:text-7xl"
          >
            Revenue OS
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-8 text-lg text-slate-300"
          >
            Non un CRM. Il tuo sistema operativo per controllo, velocità e previsione del fatturato.
          </motion.p>
          <Link href="/dashboard" className="rounded-full bg-white px-8 py-3 font-medium text-black transition hover:scale-105">
            Enter Revenue OS
          </Link>
        </div>
      </section>

      {sections.map((item, idx) => (
        <motion.section
          key={item}
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex min-h-[60vh] max-w-5xl items-center px-6"
          style={{ transform: `translateY(${idx * 4}px)` }}
        >
          <div className="w-full rounded-2xl border border-white/10 bg-surface/80 p-10 backdrop-blur">
            <p className="text-2xl text-slate-100">{item}</p>
          </div>
        </motion.section>
      ))}
    </main>
  );
}
