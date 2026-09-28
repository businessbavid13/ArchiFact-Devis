import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Camera,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  ReceiptText,
  ScanLine,
  Send,
  Sparkles,
} from 'lucide-react';

const ONBOARDING_STORAGE_KEY = 'archifact-onboarding-seen';

interface OnboardingScreenProps {
  onFinish: () => void;
}

const slides = [
  {
    title: 'Créez vos devis simplement',
    description: 'Des documents professionnels en quelques secondes.',
    type: 'quote',
    image: '/branding/onboarding-quote.webp',
  },
  {
    title: 'Une photo suffit',
    description: 'Photographiez vos informations et laissez l’IA créer votre devis ou votre facture.',
    type: 'scan',
    image: '/branding/onboarding-scan.webp',
  },
  {
    title: 'Vos documents, comme vous les voulez',
    description: 'Téléchargez vos devis et factures en PDF ou en Excel modifiable.',
    type: 'export',
    image: '/branding/onboarding-export.webp',
  },
] as const;

function QuoteIllustration() {
  return (
    <div className="relative h-72 w-full max-w-sm">
      <motion.div
        className="absolute left-1/2 top-4 h-48 w-64 -translate-x-1/2 rotate-[-6deg] rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-2xl shadow-blue-200/70"
        initial={{ opacity: 0, y: 18, rotate: -12 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ duration: 0.55 }}
      >
        <div className="flex items-center justify-between">
          <ReceiptText className="h-7 w-7 text-blue-600" />
          <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-blue-700">
            Devis
          </span>
        </div>
        <div className="mt-5 h-2 w-4/5 rounded-full bg-slate-200" />
        <div className="mt-2 h-2 w-3/5 rounded-full bg-slate-100" />
        <div className="mt-5 space-y-2">
          <div className="flex justify-between">
            <span className="h-2 w-2/5 rounded-full bg-slate-200" />
            <span className="h-2 w-1/5 rounded-full bg-blue-100" />
          </div>
          <div className="flex justify-between">
            <span className="h-2 w-1/2 rounded-full bg-slate-100" />
            <span className="h-2 w-1/6 rounded-full bg-blue-100" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
          <span className="text-[10px] font-bold text-slate-600">Total TTC</span>
          <span className="text-xs font-black text-blue-700">93 810 FCFA</span>
        </div>
      </motion.div>
      <motion.div
        className="absolute bottom-5 left-7 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-xl shadow-blue-300/70"
        animate={{ y: [0, -8, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FileText className="h-8 w-8" />
      </motion.div>
      <motion.div
        className="absolute bottom-2 right-8 grid h-14 w-14 place-items-center rounded-full bg-teal-500 text-white shadow-xl shadow-teal-200"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 250 }}
      >
        <Check className="h-7 w-7" strokeWidth={3} />
      </motion.div>
    </div>
  );
}

function ScanIllustration() {
  return (
    <div className="relative h-72 w-full max-w-sm">
      <motion.div
        className="absolute left-1/2 top-5 h-52 w-32 -translate-x-1/2 rotate-[-8deg] rounded-[2rem] border-[6px] border-slate-800 bg-slate-950 p-2 shadow-2xl shadow-blue-200"
        initial={{ opacity: 0, y: 18, rotate: -14 }}
        animate={{ opacity: 1, y: 0, rotate: -8 }}
        transition={{ duration: 0.55 }}
      >
        <div className="relative h-full overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-slate-500 to-slate-800 p-3">
          <div className="absolute left-3 right-3 top-4 h-28 rounded-xl border-2 border-cyan-300/90 bg-white/10 p-3">
            <div className="h-2 w-4/5 rounded-full bg-white/90" />
            <div className="mt-3 h-2 w-3/5 rounded-full bg-white/60" />
            <div className="mt-3 h-2 w-4/5 rounded-full bg-white/60" />
            <motion.span
              className="absolute left-0 right-0 top-0 h-0.5 bg-cyan-300 shadow-[0_0_12px_#67e8f9]"
              animate={{ y: [0, 104, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <Camera className="absolute bottom-5 left-1/2 h-8 w-8 -translate-x-1/2 text-white" />
        </div>
      </motion.div>
      <motion.div
        className="absolute right-4 top-14 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-xl shadow-blue-300/70"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 3, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles className="h-8 w-8" />
      </motion.div>
      <motion.div
        className="absolute bottom-6 left-8 flex items-center gap-2 rounded-2xl border border-teal-100 bg-white px-3 py-2 shadow-xl shadow-teal-100"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ScanLine className="h-5 w-5 text-teal-600" />
        <span className="text-xs font-extrabold text-slate-700">Analyse en cours</span>
      </motion.div>
    </div>
  );
}

function ExportIllustration() {
  return (
    <div className="relative h-72 w-full max-w-sm">
      <motion.div
        className="absolute left-1/2 top-5 w-60 -translate-x-1/2 rotate-[-5deg] rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl shadow-blue-200/70"
        initial={{ opacity: 0, y: 18, rotate: -12 }}
        animate={{ opacity: 1, y: 0, rotate: -5 }}
        transition={{ duration: 0.55 }}
      >
        <div className="flex items-center justify-between">
          <FileText className="h-6 w-6 text-blue-600" />
          <span className="text-[10px] font-black text-blue-700">DEVIS</span>
        </div>
        <div className="mt-4 h-2 w-4/5 rounded-full bg-slate-200" />
        <div className="mt-2 h-2 w-3/5 rounded-full bg-slate-100" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          <span className="h-2 rounded-full bg-blue-100" />
          <span className="h-2 rounded-full bg-blue-100" />
          <span className="h-2 rounded-full bg-blue-100" />
          <span className="h-2 rounded-full bg-slate-100" />
          <span className="h-2 rounded-full bg-slate-100" />
          <span className="h-2 rounded-full bg-slate-100" />
        </div>
      </motion.div>
      <motion.div
        className="absolute bottom-5 left-2 flex items-center gap-2 rounded-2xl border border-red-100 bg-white px-3 py-2 text-red-600 shadow-xl shadow-red-100"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Download className="h-6 w-6" />
        <span className="text-xs font-black">PDF</span>
      </motion.div>
      <motion.div
        className="absolute bottom-0 right-1 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-emerald-600 shadow-xl shadow-emerald-100"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FileSpreadsheet className="h-6 w-6" />
        <span className="text-xs font-black">Excel</span>
      </motion.div>
      <motion.div
        className="absolute right-2 top-4 grid h-14 w-14 place-items-center rounded-full bg-teal-600 text-white shadow-xl shadow-teal-200"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Send className="h-6 w-6" />
      </motion.div>
    </div>
  );
}

function Illustration({ type }: { type: (typeof slides)[number]['type'] }) {
  if (type === 'quote') return <QuoteIllustration />;
  if (type === 'scan') return <ScanIllustration />;
  return <ExportIllustration />;
}

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const slide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  const finish = () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    onFinish();
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    setCurrentIndex((index) => index + 1);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-[#f8fbff] via-white to-[#eef8ff] px-5 py-6 text-slate-950 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col">
        <header className="flex items-center justify-between">
          <img
            src="/branding/archifact-horizontal.png"
            alt="ArchiFact — devis et factures"
            className="h-14 w-auto max-w-[230px] object-contain object-left"
          />
          <button
            type="button"
            onClick={finish}
            className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-blue-700"
          >
            Passer
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.section
            key={slide.type}
            className="flex flex-1 flex-col justify-center"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <motion.div
              className="mb-3 flex justify-center"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <motion.img
                src={slide.image}
                alt=""
                className="h-72 w-full max-w-sm object-contain"
                animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            <div className="text-center">
              <h1 className="text-[2.1rem] font-bold leading-[1.08] tracking-[-0.045em] text-[#0b1f3b]">
                {slide.title}
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-lg leading-7 text-slate-500">{slide.description}</p>
            </div>
          </motion.section>
        </AnimatePresence>

        <footer className="pb-2 pt-6">
          <div className="mb-5 flex items-center justify-center gap-2">
            {slides.map((item, index) => (
              <motion.span
                key={item.type}
                className="h-2 rounded-full bg-blue-600"
                animate={{ width: index === currentIndex ? 28 : 8, opacity: index === currentIndex ? 1 : 0.2 }}
                transition={{ duration: 0.25 }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">
              {currentIndex + 1} / {slides.length}
            </span>
            <motion.button
              type="button"
              onClick={next}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              className="flex min-h-14 items-center gap-3 rounded-2xl bg-gradient-to-r from-[#007bff] to-[#00bfe8] px-7 text-base font-bold text-white shadow-xl shadow-blue-200 transition hover:shadow-2xl"
            >
              {isLast ? 'Commencer' : 'Suivant'}
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </div>
        </footer>
      </div>
    </main>
  );
}

export function hasSeenOnboarding() {
  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}
