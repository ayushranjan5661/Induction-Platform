import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactElement, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LoginPortrait } from '../avatar/LoginPortrait';
import { api, errorMessage } from '../lib/api';
import { homeFor, useMe } from '../lib/auth';

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/**
 * The LevelShift wordmark from public/logo.svg, inlined so "LEVEL" can be drawn in white
 * on the dark background while the mark and "SHIFT" keep the brand cyan.
 */
function Logo(): ReactElement {
  return (
    <svg viewBox="0 78 541 60" role="img" aria-label="LevelShift" className="h-6 w-auto">
      <g fill="#ffffff">
        <path d="M2.6,134.3V81.3h9.2V125h35.6v9.2H2.6z" />
        <path d="M54.1,134.3V81.3h47.2v9.2H63.3V125h38.1v9.2H54.1z M70.1,111.3v-7.8h29.3v7.8H70.1z" />
        <path d="M186.9,134.3V81.3h47.2v9.2h-38.1V125h38.1v9.2H186.9z M202.9,111.3v-7.8h29.3v7.8H202.9z" />
        <path d="M242.2,134.3V81.3h9.2V125H287v9.2H242.2z" />
      </g>
      <g fill="#1BADE8">
        <path d="M293.7,134.3V125h39.7c5,0,7.7-2.8,7.7-6.9c0-4.5-2.8-6.8-7.7-6.8H309c-10,0-16.2-6.3-16.2-15.1c0-8.5,5.8-14.9,16.3-14.9h38v9.2h-38c-4.2,0-6.7,2.5-6.7,6.5s2.5,6.4,6.6,6.4h24.2c10.7,0,16.5,5,16.5,15.3c0,8.9-5.4,15.5-16.5,15.5H293.7z" />
        <path d="M357.7,134.5V81.3h9.2v53.1H357.7z M400.3,134.5v-23h-26.6v-8.2h26.6V81.3h9.2v53.1H400.3z" />
        <path d="M419.3,134.3V81.3h9.2v52.9H419.3z" />
        <path d="M438.2,134.3V81.3h44.9v9.2h-35.7v43.7H438.2z M454.1,112.3v-8.1h26.8v8.1H454.1z" />
        <path d="M509.5,134.3V90.6h-20.1v-9.2h49.4v9.2h-20.1v43.7H509.5z" />
        <polygon points="119.1,97.5 124.9,107 164.4,107 170.2,97.5" />
        <polygon points="137.2,127.4 152.1,127.4 155.6,121.7 133.8,121.7" />
        <polygon points="179.6,81.9 109.7,81.9 117.2,94.3 172.1,94.3" />
        <polygon points="131.8,118.5 157.5,118.5 162.5,110.2 126.8,110.2" />
        <path d="M140.7,133.1c1.8,3,6.2,3,8,0l1.5-2.5h-11L140.7,133.1z" />
      </g>
    </svg>
  );
}

const inputClass =
  'h-12 w-full rounded-xl border border-ink-700 bg-ink-950/70 pl-11 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-ink-600 focus:border-brand-cyan focus:ring-4 focus:ring-brand-cyan/15 [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#060b18]';

function IconField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}): ReactElement {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-medium text-slate-300">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 z-10 flex items-center text-slate-500">
          {icon}
        </span>
        {children}
      </span>
    </label>
  );
}

export function LoginPage(): ReactElement {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (me.data) return <Navigate to={homeFor(me.data.role)} replace />;

  const signIn = async (address: string, secret: string) => {
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/login', { email: address, password: secret });
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (email.trim() && password) void signIn(email.trim(), password);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink-950 px-6 py-6 sm:px-10 sm:py-8 xl:px-14">
      {/* Background: deep navy with two soft cyan glows and a faint grid that fades out */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_0%,rgba(0,154,218,0.18),transparent_60%),radial-gradient(ellipse_60%_70%_at_90%_100%,rgba(0,154,218,0.16),transparent_60%),linear-gradient(180deg,#0a1326_0%,#060b18_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      {/* Right third: the presenter stands on the bottom edge, with a soft spotlight behind */}
      <div className="pointer-events-none absolute bottom-0 right-0 hidden h-[72%] w-[calc(50%-15rem)] lg:block">
        <div className="absolute bottom-[-20%] left-1/2 h-[75%] w-[85%] -translate-x-1/2 rounded-full bg-brand-cyan/20 blur-3xl" />
        <LoginPortrait className="absolute inset-0 h-full w-full drop-shadow-2xl" />
      </div>

      <header className="relative z-10">
        <Logo />
      </header>

      {/* Three columns share one centre line: message | card | presenter */}
      <main className="relative z-10 grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1fr_28rem_1fr]">
        <div className="hidden text-white xl:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-medium tracking-wide text-brand-cyan-light">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan-light" />
            Admin &amp; HR workspace
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.12] tracking-tight 2xl:text-5xl">
            Great first days,
            <br />
            <span className="bg-gradient-to-r from-brand-cyan-light to-brand-cyan bg-clip-text text-transparent">
              built here.
            </span>
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-slate-400 2xl:text-lg">
            Shape the induction journey, welcome every new joiner and see exactly where each one
            stands.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:col-start-2">
          {/* Rotating blue and red light: a blurred halo behind, and a crisp 1.5px ring */}
          <div className="spin-ring spin-ring-halo pointer-events-none absolute -inset-1 rounded-2xl" />
          <div className="spin-ring rounded-2xl p-[1.5px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
            <div className="rounded-[calc(1rem-1.5px)] bg-ink-900 p-8 sm:p-10">
              <h2 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Sign in with the email and password you were given.
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-5">
                <IconField
                  label="Email"
                  icon={
                    <svg {...iconProps} className="h-[18px] w-[18px]">
                      <rect x="3" y="5" width="18" height="14" rx="2.5" />
                      <path d="M3.5 7.5l8.5 6 8.5-6" />
                    </svg>
                  }
                >
                  <input
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@levelshift.com"
                    required
                    className={`${inputClass} pr-3`}
                  />
                </IconField>

                <IconField
                  label="Password"
                  icon={
                    <svg {...iconProps} className="h-[18px] w-[18px]">
                      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
                      <path d="M8 10.5V8a4 4 0 018 0v2.5" />
                    </svg>
                  }
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 outline-none hover:bg-white/5 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-brand-cyan-light"
                  >
                    <svg {...iconProps} className="h-[18px] w-[18px]">
                      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                      <circle cx="12" cy="12" r="2.8" />
                      {showPassword && <path d="M4 4l16 16" />}
                    </svg>
                  </button>
                </IconField>

                {error && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/15 px-3.5 py-2.5 text-sm text-red-100"
                  >
                    <svg {...iconProps} className="mt-0.5 h-4 w-4 shrink-0 text-red-300">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7.5v5M12 16h.01" />
                    </svg>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#14b0ee] to-brand-cyan text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(0,154,218,0.55),inset_0_1px_0_rgba(255,255,255,0.2)] outline-none transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-brand-cyan/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:from-ink-700 disabled:to-ink-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  {busy ? (
                    <>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden>
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          opacity="0.3"
                        />
                        <path
                          d="M21 12a9 9 0 00-9-9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <svg {...iconProps} strokeWidth={2.2} className="h-4 w-4">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 border-t border-white/[0.06] pt-5 text-center text-xs text-slate-500">
                For Admin and HR employees only
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} LevelShift. Trouble signing in? Contact your administrator.
      </footer>
    </div>
  );
}
