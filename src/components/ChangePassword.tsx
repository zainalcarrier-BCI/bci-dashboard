import { FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, HardHat, Lock, ShieldCheck } from 'lucide-react';

interface ChangePasswordProps {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void> | void;
  onBackToLogin: () => void;
}

export default function ChangePassword({ onSubmit, onBackToLogin }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('Password');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password belum sama.');
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Password baru minimal 8 karakter dan wajib punya huruf serta angka.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(currentPassword, newPassword);
    } catch (changeError) {
      console.warn('Change password failed', changeError);
      setError('Password belum bisa diganti. Cek current password atau koneksi API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-surface p-6">
      <header className="pt-16 text-center">
        <div className="mb-8 inline-flex items-center justify-center rounded-full bg-surface-container-lowest p-4 shadow-[0px_8px_24px_rgba(28,27,31,0.06)]">
          <HardHat className="h-10 w-10 text-primary" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">First Login Activation</p>
        <h1 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-primary">
          Change Password
        </h1>
        <p className="mx-auto mt-3 max-w-[280px] text-sm font-medium text-on-surface-variant">
          Account sudah dibuat admin. Ganti temporary password sebelum masuk aplikasi.
        </p>
      </header>

      <main className="flex flex-grow flex-col justify-center">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-[2rem] bg-surface-container-lowest p-8 shadow-[0px_8px_24px_rgba(28,27,31,0.04)]">
          <div className="rounded-2xl bg-primary-fixed/60 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-xs font-semibold text-on-surface-variant">
                Gunakan password pribadi. Admin hanya melihat status aktivasi, bukan password baru.
              </p>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-on-surface">Current Password</span>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 h-5 w-5 text-outline" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                className="h-14 w-full rounded-xl border-none bg-surface-container-low pl-12 pr-12 font-sans text-on-surface transition-all focus:ring-2 focus:ring-primary-fixed-dim"
              />
              <button type="button" onClick={() => setShowCurrent((value) => !value)} className="absolute right-4 text-outline">
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-on-surface">New Password</span>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 h-5 w-5 text-outline" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Minimal 8 chars, include number"
                className="h-14 w-full rounded-xl border-none bg-surface-container-low pl-12 pr-12 font-sans text-on-surface transition-all focus:ring-2 focus:ring-primary-fixed-dim"
              />
              <button type="button" onClick={() => setShowNew((value) => !value)} className="absolute right-4 text-outline">
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-on-surface">Confirm New Password</span>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 h-5 w-5 text-outline" />
              <input
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                className="h-14 w-full rounded-xl border-none bg-surface-container-low pl-12 pr-4 font-sans text-on-surface transition-all focus:ring-2 focus:ring-primary-fixed-dim"
              />
            </div>
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-headline font-extrabold text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Saving...' : 'Save Password'}</span>
            <ArrowRight className="h-5 w-5" />
          </button>

          <button type="button" onClick={onBackToLogin} className="w-full text-center text-xs font-bold text-primary">
            Back to login
          </button>
        </form>
      </main>
    </div>
  );
}
