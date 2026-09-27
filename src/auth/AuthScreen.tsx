import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Mail, Sparkles } from 'lucide-react';

interface AuthScreenProps {
  onSendOtp: (email: string) => Promise<{ error: string | null }>;
  onVerifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  onSignInWithGoogle: () => Promise<{ error: string | null }>;
}

export function AuthScreen({ onSendOtp, onVerifyOtp, onSignInWithGoogle }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (event?: React.FormEvent | React.MouseEvent) => {
    event?.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
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
    <main className="min-h-screen bg-[#fafaf8] text-[#171717] flex items-center justify-center px-6 py-10 font-sans">
      <div className="w-full max-w-[476px]">
        <div className="text-center">
          <div className="mb-8 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 fill-[#d97757] text-[#d97757]" strokeWidth={1.5} />
            <span className="font-serif text-[32px] tracking-[-0.06em]">ArchiFact</span>
          </div>

          <div className="mx-auto mb-8 flex h-36 w-48 items-center justify-center">
            <div className="relative h-28 w-32">
              <div className="absolute left-7 top-6 h-16 w-14 rounded-[50%] border-[5px] border-[#161616] rotate-[-18deg]" />
              <div className="absolute left-16 top-1 h-20 w-12 rounded-[50%] border-[5px] border-[#161616] border-l-transparent rotate-[25deg]" />
              <div className="absolute left-12 top-2 h-8 w-8 rounded-full bg-[#d97757]" />
              <div className="absolute left-2 top-16 h-4 w-16 rounded-full border-t-[5px] border-[#161616] rotate-[-25deg]" />
            </div>
          </div>

          <h1 className="font-serif text-[27px] leading-tight tracking-[-0.04em]">
            L’IA de ceux qui résolvent
            <br />
            les problèmes
          </h1>
        </div>

        <section className="mt-16">
          {step === 'email' ? (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={isLoading}
                className="flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-[#171717] px-5 text-[16px] font-medium text-white transition hover:bg-black disabled:opacity-60"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-bold text-[#4285f4]">G</span>
                Continuer avec Google
              </button>

              <div className="my-7 flex items-center gap-4 text-[#8d8d88]">
                <span className="h-px flex-1 bg-[#d9d9d4]" />
                <span className="text-sm">OU</span>
                <span className="h-px flex-1 bg-[#d9d9d4]" />
              </div>

              <form onSubmit={handleSendCode}>
                <label className="sr-only" htmlFor="auth-email">Adresse e-mail</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#999995]" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Saisissez votre e-mail."
                    autoComplete="email"
                    disabled={isLoading}
                    className="min-h-16 w-full rounded-2xl border border-[#d9d9d4] bg-white px-14 pr-16 text-[17px] outline-none transition placeholder:text-[#999995] focus:border-[#c66d4e] focus:ring-2 focus:ring-[#d97757]/20"
                  />
                  <button
                    type="submit"
                    aria-label="Envoyer le code"
                    disabled={isLoading}
                    className="absolute right-2 top-2 grid h-12 w-12 place-items-center rounded-xl bg-[#171717] text-white transition hover:bg-black disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError(null); }}
                className="mb-6 flex items-center gap-2 text-sm text-[#6f6f6b] hover:text-[#171717]"
              >
                <ArrowLeft className="h-4 w-4" />
                Modifier l’adresse e-mail
              </button>
              <p className="mb-3 text-center text-[15px] font-medium">
                Saisissez le code envoyé à
                <br />
                <strong>{email}</strong>
              </p>
              <input
                aria-label="Code de vérification"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                placeholder="Code"
                autoFocus
                className="min-h-16 w-full rounded-2xl border border-[#c66d4e] bg-white px-5 text-center text-2xl tracking-[0.45em] outline-none focus:ring-2 focus:ring-[#d97757]/20"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#171717] text-white transition hover:bg-black disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Valider le code'}
              </button>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isLoading}
                className="mt-4 w-full text-center text-sm text-[#6f6f6b] underline underline-offset-4"
              >
                Renvoyer le code
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-[#fff0eb] px-4 py-3 text-center text-sm text-[#a54d35]">
              {error}
            </p>
          )}

          <p className="mt-7 text-center text-sm leading-6 text-[#777773]">
            En continuant, vous acceptez les <u>Conditions d’utilisation</u> et la <u>Politique d’utilisation</u> d’ArchiFact.
          </p>
        </section>
      </div>
    </main>
  );
}
