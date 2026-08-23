'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Please enter your email address.' });
      return;
    }
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) setStatus({ type: 'error', message: error.message });
      else setStatus({ type: 'success', message: 'Password reset instructions have been sent to your email inbox.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to send password reset instructions.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EDE6DA] flex items-center justify-center px-4 py-6 md:px-8">
      <section className="w-full max-w-md mx-auto bg-surface rounded-[24px] shadow-[0_20px_50px_rgba(27,67,50,0.15)] p-6 md:p-8 border border-white/60">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white"><span className="material-symbols-outlined">shield</span></div>
          <span className="font-serif text-2xl font-bold text-primary">RightsTrack</span>
        </Link>
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-primary mb-2">Forgot password?</h1>
          <p className="text-sm text-on-surface-variant">Enter your email and we&apos;ll send a secure reset link.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="email">Email address
            <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="citizen@example.com" />
          </label>
          {status.message && <p role="status" className={`text-sm ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{status.message}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary-container px-4 py-3.5 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>
        <Link href="/" className="mt-6 block text-center text-sm font-semibold text-secondary hover:underline">Back to sign in</Link>
      </section>
    </main>
  );
}
