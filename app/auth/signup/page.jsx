'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSigningUp) return;
    if (!email.trim() || !password || !confirmation) {
      setStatus({ type: 'error', message: 'Email, password, and password confirmation are required.' });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirmation) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsSigningUp(true);
    setStatus({ type: '', message: '' });
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) {
        setStatus({ type: 'error', message: error.message });
      } else if (data?.session) {
        router.push('/dashboard');
        return;
      } else {
        setStatus({ type: 'success', message: 'Verification link sent! Please check your email inbox.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to create your account.' });
    } finally {
      setIsSigningUp(false);
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
          <h1 className="font-serif text-3xl font-bold text-primary mb-2">Create your account</h1>
          <p className="text-sm text-on-surface-variant">Securely track your civic and legal cases.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="email">Email address
            <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="citizen@example.com" />
          </label>
          <label className="block text-xs font-semibold text-on-surface" htmlFor="password">Password
            <input id="password" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <label className="block text-xs font-semibold text-on-surface" htmlFor="confirmation">Confirm password
            <input id="confirmation" type="password" required minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-outline-variant/60 bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          {status.message && <p role="alert" className={`text-sm ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{status.message}</p>}
          <button type="submit" disabled={isSigningUp} className="w-full rounded-xl bg-primary-container px-4 py-3.5 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60">
            {isSigningUp ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-on-surface-variant">Already have an account? <Link href="/" className="font-semibold text-secondary hover:underline">Sign in</Link></p>
      </section>
    </main>
  );
}
