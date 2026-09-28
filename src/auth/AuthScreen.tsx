import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, FileCheck2, FileText, Loader2, Mail, ReceiptText } from 'lucide-react';

interface AuthScreenProps {
  onSendOtp: (email: string) => Promise<{ error: string | null }>;
  onVerifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  onSignInWithGoogle: () => Promise<{ error: string | null }>;
}

function BrandMark() {
  return (
    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#0d9488] text-white shadow-lg shadow-blue-200/60">
      <FileCheck2 className="h-6 w-6" strokeWidth={2.2} />
    </div>
  );
}

function ProductIllustration() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto h-56 w-full max-w-[360px] overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-teal-50 shadow-inner">
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

      <motion.div
        className="absolute left-[14%] top-[22%] w-[58%] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70"
        initial={{ opacity: 0, y: 18, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="h-2 w-20 rounded-full bg-slate-200" />
            <div className="mt-2 h-1.5 w-12 rounded-full bg-slate-100" />
          </div>
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full bg-blue-100" />
          <div className="h-2 w-4/5 rounded-full bg-slate-100" />
          <div className="h-2 w-3/5 rounded-full bg-slate-100" />
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div className="h-5 w-16 rounded-md bg-teal-100" />
          <div className="h-3 w-14 rounded-full bg-slate-200" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-[13%] right-[9%] w-[42%] rounded-2xl border border-teal-100 bg-white/95 p-3 shadow-xl shadow-teal-100/70"
        initial={{ opacity: 0, y: 24, rotate: 7 }}
        animate={shouldReduceMotion ? { opacity: 1, y: 0, rotate: 7 } : { opacity: 1, y: [0, -7, 0], rotate: 7 }}
        transition={{
          opacity: { duration: 0.8, delay: 0.25 },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 },
          rotate: { duration: 0.8, delay: 0.25 },
        }}
      >
        <div className="flex items-center justify-between">
          <ReceiptText className="h-5 w-5 text-teal-600" />
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">PAYÉ</span>
        </div>
        <div className="mt-3 h-2 w-4/5 rounded-full bg-slate-200" />
        <div className="mt-2 h-2 w-3/5 rounded-full bg-slate-100" />
        <div className="mt-4 h-7 rounded-lg bg-gradient-to-r from-blue-100 to-teal-100" />
      </motion.div>

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
    <main className="min-h-screen overflow-hidden bg-[#f8fafc] px-5 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <motion.div
          className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-[0.95fr_1.05fr]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <section className="hidden flex-col justify-between bg-gradient-to-br from-[#eff6ff] via-white to-[#ecfeff] p-10 lg:flex xl:p-14">
            <div>
              <div className="flex items-center gap-3">
                <BrandMark />
                <span className="text-2xl font-bold tracking-tight text-slate-950">ArchiFact</span>
              </div>
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

          <section className="flex min-h-[680px] flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-10 flex items-center gap-3 lg:hidden">
                <BrandMark />
                <span className="text-2xl font-bold tracking-tight text-slate-950">ArchiFact</span>
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
                    <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-950">Bienvenue sur ArchiFact</h1>
                    <p className="mt-3 text-base leading-6 text-slate-500">
                      Connectez-vous pour gérer vos devis et factures.
                    </p>

                    <button
                      type="button"
                      onClick={handleGoogle}
                      disabled={isLoading}
                      className="mt-8 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-950 px-5 text-[15px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-bold text-[#4285f4]">G</span>
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
                          placeholder="vous@entreprise.com"
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

              <p className="mt-10 text-center text-xs leading-5 text-slate-400">
                En continuant, vous acceptez les <u>Conditions d’utilisation</u> et la <u>Politique de confidentialité</u> d’ArchiFact.
              </p>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}
