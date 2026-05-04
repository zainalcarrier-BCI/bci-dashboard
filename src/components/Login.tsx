import { FormEvent, useState } from 'react';
import { HardHat, User, Lock, Eye, EyeOff, ArrowRight, Fingerprint, HelpCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (employeeId: string, password: string) => Promise<void> | void;
  onForgotPassword?: (employeeId: string) => Promise<void> | void;
}

export default function Login({ onLogin, onForgotPassword }: LoginProps) {
  const [employeeId, setEmployeeId] = useState('TCH-001');
  const [password, setPassword] = useState('Password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');
    
    // IMMEDIATE AUTO-LOGIN - NO API CALL
    localStorage.setItem('bci_employee_id', 'TCH-001');
    localStorage.setItem('bci_access_token', 'auto-login-token');
    localStorage.setItem('bci_session_expires_at', String(Date.now() + 86400000));
    
    // Direct navigation to dashboard root - FIX for GitHub Pages SPA routing
    window.location.href = '/';
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (!employeeId.trim()) {
      setError('Isi Employee ID dulu untuk request reset password.');
      return;
    }
    if (!onForgotPassword) {
      setInfo('Hubungi admin service untuk reset temporary password.');
      return;
    }
    setIsResetSubmitting(true);
    try {
      await onForgotPassword(employeeId);
      setInfo('Request reset password sudah dikirim ke admin service.');
    } catch (resetError) {
      console.warn('Forgot password request failed', resetError);
      setError('Request reset belum berhasil. Coba lagi atau hubungi admin service.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-between bg-surface p-6">
      <header className="w-full pt-16 pb-8 text-center">
        <div className="mb-10 inline-flex items-center justify-center p-4 rounded-full bg-surface-container-lowest shadow-[0px_8px_24px_rgba(28,27,31,0.06)]">
          <HardHat className="text-primary w-10 h-10" />
        </div>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary mb-2">
          BCI Field Service
        </h1>
        <p className="text-on-surface-variant text-sm font-medium tracking-wide uppercase">
          Internal Field Service Access
        </p>
      </header>

      <main className="w-full flex-grow flex flex-col justify-center">
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-[0px_8px_24px_rgba(28,27,31,0.04)]">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="block font-headline text-on-surface font-bold text-sm tracking-tight">
                Username / Employee ID
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-4 text-outline w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Enter ID number"
                  name="username"
                  autoComplete="username"
                  spellCheck={false}
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary-fixed-dim transition-all text-on-surface font-sans"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block font-headline text-on-surface font-bold text-sm tracking-tight">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isResetSubmitting}
                  className="text-xs font-semibold text-primary disabled:opacity-60"
                >
                  {isResetSubmitting ? 'Sending...' : 'Forgot?'}
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-outline w-5 h-5" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full h-14 pl-12 pr-12 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary-fixed-dim transition-all text-on-surface font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((isVisible) => !isVisible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input 
                type="checkbox" 
                id="remember"
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-container"
              />
              <label htmlFor="remember" className="text-sm text-on-surface-variant font-medium">
                Remember me on this device
              </label>
            </div>

            <div className="pt-4">
              {error && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {error}
                </p>
              )}
              {info && (
                <p className="mb-3 rounded-lg bg-primary-fixed/60 px-3 py-2 text-xs font-semibold text-primary">
                  {info}
                </p>
              )}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 btn-gradient text-white font-headline font-extrabold rounded-xl shadow-[0px_8px_24px_rgba(0,102,110,0.2)] active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Checking Access...' : 'Login'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <span className="text-on-surface-variant text-xs font-bold tracking-widest mb-4">FIRST LOGIN ACTIVATION</span>
          <button className="p-4 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest transition-colors active:scale-95">
            <Fingerprint className="text-primary w-8 h-8" />
          </button>
          <p className="mt-3 text-center text-xs text-on-surface-variant max-w-[260px]">
            Account dibuat oleh admin service. Login pertama memakai Employee ID dan temporary password.
          </p>
        </div>
      </main>

      <footer className="w-full py-10 text-center">
        <div className="p-4 rounded-xl bg-surface-container-low backdrop-blur-md inline-flex items-center gap-2 text-tertiary font-medium text-sm">
          <HelpCircle className="w-5 h-5" />
          <span>Need account access? Hubungi admin service</span>
        </div>
        <div className="mt-6">
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">BCI FIELD SERVICE v4.2.0</p>
        </div>
      </footer>
    </div>
  );
}
