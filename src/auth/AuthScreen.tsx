import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Camera, Check, Download, FileText, Loader2, Mail, ReceiptText, Send, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onSendOtp: (email: string) => Promise<{ error: string | null }>;
  onVerifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  onSignInWithGoogle: () => Promise<{ error: string | null }>;
}

function BrandMark() {
  return (
    <img
      src="/branding/archifact-icon-dark.png"
      alt=""
      className="h-11 w-11 rounded-2xl object-cover shadow-lg shadow-blue-200/60"
    />
  );
}

function BrandLogo() {
  return (
    <img
      src="/branding/archifact-horizontal.png"
      alt="ArchiFact — devis et factures"
      className="h-14 w-auto max-w-[290px] object-contain object-left"
    />
  );
}

function ProductIllustration() {
  const shouldReduceMotion = useReducedMotion();
  const [documentType, setDocumentType] = useState<'Devis' | 'Facture'>('Devis');

  useEffect(() => {
    if (shouldReduceMotion) return;
    const interval = window.setInterval(() => {
      setDocumentType((current) => current === 'Devis' ? 'Facture' : 'Devis');
    }, 4200);
    return () => window.clearInterval(interval);
  }, [shouldReduceMotion]);

  return (
    <motion.div
      className="relative mx-auto flex h-36 w-full max-w-[390px] items-center justify-center sm:h-48 lg:h-64"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <motion.div
        className="relative flex h-24 w-20 flex-col justify-between rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 p-3 text-white shadow-xl shadow-blue-200/70 sm:h-28 sm:w-24 lg:h-36 lg:w-28 lg:p-4"
        animate={shouldReduceMotion ? undefined : { y: [0, -7, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="h-2 w-10 rounded-full bg-white/90" />
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-white/75" />
          <div className="h-1.5 w-4/5 rounded-full bg-white/55" />
          <div className="h-1.5 w-3/5 rounded-full bg-white/55" />
        </div>
        <FileText className="absolute -bottom-2 -left-3 h-8 w-8 rounded-xl bg-white p-1.5 text-blue-600 shadow-lg" />
      </motion.div>
      <motion.div
        className="absolute ml-24 grid h-11 w-11 place-items-center rounded-full bg-teal-500 text-white shadow-lg shadow-teal-200/80 sm:ml-28 lg:ml-36 lg:h-14 lg:w-14"
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.1, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Check className="h-6 w-6" strokeWidth={3} />
      </motion.div>
    </motion.div>
  );

  return (
    <div className="relative mx-auto h-52 w-full max-w-[390px] overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-teal-50 p-4 shadow-inner sm:h-56 lg:h-64 lg:p-5">
      <motion.img
        src="/branding/onboarding-documents.webp"
        alt="Documents ArchiFact prêts à être envoyés"
        className="absolute inset-0 z-10 h-full w-full object-contain p-2"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-blue-200/40 blur-2xl"
        animate={shouldReduceMotion ? { opacity: 0.5 } : { scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 -left-8 h-44 w-44 rounded-full bg-teal-200/40 blur-2xl"
        animate={shouldReduceMotion ? { opacity: 0.45 } : { scale: [1.08, 1, 1.08], opacity: [0.55, 0.35, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-x-3 bottom-4 top-4 flex items-center justify-between gap-1">
        <motion.div
          className="flex w-[22%] flex-col items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="relative grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-300/70">
            <FileText className="h-6 w-6 text-teal-300" />
            <Camera className="absolute -bottom-1 -right-2 h-5 w-5 rounded-md bg-blue-600 p-1 text-white" />
          </div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600">Photo</span>
        </motion.div>

        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="h-0.5 w-[7%] rounded-full bg-gradient-to-r from-blue-300 to-teal-300"
            animate={shouldReduceMotion ? { opacity: 0.7 } : { opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.35, ease: 'easeInOut' }}
          />
        ))}

        <motion.div
          className="flex w-[22%] flex-col items-center gap-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          <motion.div
            className="grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-300/70"
            animate={shouldReduceMotion ? { scale: 1 } : { scale: [1, 1.12, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-6 w-6" />
          </motion.div>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700">IA</span>
        </motion.div>

        <motion.div
          className="flex w-[26%] flex-col items-center gap-2"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={documentType}
              className="w-full rounded-xl border-2 border-teal-100 bg-white p-2 shadow-lg shadow-teal-100/70"
              initial={{ opacity: 0, y: 6, rotate: 3 }}
              animate={{ opacity: 1, y: 0, rotate: 3 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <ReceiptText className="h-4 w-4 text-teal-600" />
                <span className="text-[8px] font-black text-emerald-600">PRÊT</span>
              </div>
              <div className="mt-2 h-1.5 w-4/5 rounded-full bg-slate-300" />
              <div className="mt-1.5 h-1.5 w-3/5 rounded-full bg-slate-200" />
              <div className="mt-2 rounded bg-teal-50 px-1 py-1 text-center text-[8px] font-black text-slate-700">
                {documentType}
              </div>
            </motion.div>
          </AnimatePresence>
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-teal-700">Prêt</span>
        </motion.div>

        <motion.div
          className="flex w-[18%] flex-col items-center gap-2"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.45 }}
        >
          <div className="grid h-11 w-11 place-items-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-200/80">
            <Send className="h-5 w-5" />
          </div>
          <div className="flex gap-1 text-teal-700">
            <Download className="h-3.5 w-3.5" />
            <Send className="h-3.5 w-3.5" />
          </div>
        </motion.div>
      </div>

      {[{ left: '9%', top: '15%' }, { left: '82%', top: '54%' }, { left: '26%', top: '83%' }].map((dot, index) => (
        <motion.span
          key={`${dot.left}-${dot.top}`}
          className="absolute h-2.5 w-2.5 rounded-full bg-blue-500"
          style={dot}
          animate={shouldReduceMotion ? { opacity: 0.75 } : { scale: [1, 1.7, 1], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.7, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export function AuthScreen({ onSendOtp, onVerifyOtp, onSignInWithGoogle }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasTypedEmail = email.trim().length > 0;
  const isValidEmail = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  const handleSendCode = async (event?: React.FormEvent | React.MouseEvent) => {
    event?.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Saisissez une adresse e-mail valide.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await onSendOtp(normalizedEmail);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEmail(normalizedEmail);
    setStep('code');
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Saisissez le code à 6 chiffres reçu par e-mail.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const result = await onVerifyOtp(email, code);
    setIsLoading(false);
    if (result.error) setError(result.error);
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setError(null);
    const result = await onSignInWithGoogle();
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fafc] px-2 py-2 text-slate-900 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <motion.div
          className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-[0.95fr_1.05fr]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <section className="hidden flex-col justify-between bg-gradient-to-br from-[#eff6ff] via-white to-[#ecfeff] p-10 lg:flex xl:p-14">
            <div>
              <BrandLogo />
              <p className="mt-16 max-w-sm text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950">
                Vos devis.
                <br />
                Votre activité.
                <br />
                <span className="text-blue-600">Plus simple.</span>
              </p>
              <p className="mt-6 max-w-sm text-base leading-7 text-slate-600">
                Créez des documents professionnels, suivez vos paiements et gagnez du temps au quotidien.
              </p>
            </div>
            <ProductIllustration />
          </section>

          <section className="flex min-h-[calc(100vh-1rem)] flex-col justify-center px-6 py-7 sm:min-h-[680px] sm:px-12 sm:py-10 lg:px-16">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-7 flex justify-center lg:hidden">
                <BrandLogo />
              </div>
              <div className="mb-8 lg:hidden">
                <ProductIllustration />
              </div>

              <AnimatePresence mode="wait">
                {step === 'email' ? (
                  <motion.div
                    key="email-step"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <h1 className="text-center text-3xl font-bold leading-[1.1] tracking-[-0.04em] text-slate-950 lg:text-left">
                      Vos documents en toute simplicité
                    </h1>
                    <p className="mt-3 text-center text-base leading-6 text-slate-500 lg:text-left">
                      Connectez-vous pour créer, gérer et exporter vos devis et factures.
                    </p>

                    <button
                      type="button"
                      onClick={handleGoogle}
                      disabled={isLoading}
                      className="mt-8 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-950 px-5 text-[15px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white">
                        <img src="/branding/google.png" alt="" className="h-5 w-5 object-contain" />
                      </span>
                      Continuer avec Google
                    </button>

                    <div className="my-7 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      <span className="h-px flex-1 bg-slate-200" />
                      <span>ou</span>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>

                    <form onSubmit={handleSendCode}>
                      <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="auth-email">
                        Adresse e-mail
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          id="auth-email"
                          type="email"
                          value={email}
                          onChange={(event) => { setEmail(event.target.value); setError(null); }}
                          placeholder="Votre adresse email"
                          autoComplete="email"
                          disabled={isLoading}
                          className={`min-h-14 w-full rounded-2xl border bg-slate-50 pl-12 text-[16px] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-blue-100 ${
                            hasTypedEmail ? 'border-blue-500' : 'border-slate-200'
                          } ${hasTypedEmail ? 'pr-16' : 'pr-5'}`}
                        />
                        <AnimatePresence>
                          {hasTypedEmail && (
                            <motion.button
                              type="submit"
                              aria-label="Envoyer le code"
                              disabled={isLoading || !isValidEmail}
                              initial={{ opacity: 0, scale: 0.75, x: 8 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.75, x: 8 }}
                              transition={{ duration: 0.18 }}
                              className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                            >
                              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        Un code à 6 chiffres vous sera envoyé par e-mail.
                      </p>
                    </form>
                  </motion.div>
                ) : (
                  <motion.form
                    key="code-step"
                    onSubmit={handleVerifyCode}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <button
                      type="button"
                      onClick={() => { setStep('email'); setCode(''); setError(null); }}
                      className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Modifier l’adresse e-mail
                    </button>
                    <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-950">Vérifiez votre e-mail</h1>
                    <p className="mt-3 text-base leading-6 text-slate-500">
                      Saisissez le code envoyé à <strong className="text-slate-700">{email}</strong>.
                    </p>
                    <input
                      aria-label="Code de vérification"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      autoFocus
                      className="mt-8 min-h-16 w-full rounded-2xl border border-blue-500 bg-blue-50/40 px-5 text-center text-3xl font-bold tracking-[0.42em] text-slate-900 outline-none focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Valider le code'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={isLoading}
                      className="mt-5 w-full text-center text-sm font-semibold text-blue-600 underline-offset-4 hover:underline"
                    >
                      Renvoyer le code
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700"
                >
                  {error}
                </motion.p>
              )}

            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
