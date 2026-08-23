'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmation) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setStatus({ type: 'error', message: error.message });
    else setStatus({ type: 'success', message: 'Password updated successfully.' });
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#EDE6DA] flex items-center justify-center px-4 py-6 md:px-8">
      <section className="w-full max-w-md mx-auto bg-surface rounded-[24px] shadow-[0_20px_50px_rgba(27,67,50,0.15)] p-6 md:p-8 border border-white/60">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white"><span className="material-symbols-outlined">shield</span></div>
          <span className="font-serif text-2xl font-bold text-primary">RightsTrack</span>
        </Link>
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-primary mb-2">Set a new password</h1>
          <p className="text-sm text-on-surface-variant">Choose a new password for your RightsTrack account.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="password">New password
            <input id="password" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="block text-xs font-semibold text-on-surface" htmlFor="confirmation">Confirm password
            <input id="confirmation" type="password" required minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          {status.message && <p role="status" className={`text-sm ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{status.message}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary-container px-4 py-3.5 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Updating password...' : 'Update password'}
          </button>
        </form>
        <Link href="/" className="mt-6 block text-center text-sm font-semibold text-secondary hover:underline">Back to sign in</Link>
      </section>
    </main>
  );
}
