'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = (e) => {
    e.preventDefault();
    router.push('/intake');
  };

  const handleGuest = () => {
    router.push('/intake');
  };

  return (
    <div className="flex w-full min-h-screen bg-[#EDE6DA] text-on-background selection:bg-primary-container selection:text-white">
      {/* Split Screen Container */}
      <div className="flex w-full min-h-screen">
        {/* Left Side: Hero / Brand / Context (60%) */}
        <div className="hidden lg:flex flex-col justify-between w-3/5 p-12 relative overflow-hidden bg-surface-container-low border-r border-outline-variant/20">
          <div className="relative z-10 flex flex-col h-full max-w-2xl mx-auto w-full">
            {/* Header / Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-[28px]">shield</span>
              </div>
              <span className="font-serif text-3xl font-bold text-primary tracking-tight">RightsTrack</span>
            </div>

            {/* Main Hero Typography */}
            <div className="mb-8">
              <h1 className="font-serif text-4xl xl:text-5xl font-bold text-primary mb-4 leading-tight">
                Turn a civic problem into an{' '}
                <span className="block mt-1 text-secondary italic font-normal">action you can track.</span>
              </h1>
              <p className="font-sans text-lg text-on-surface-variant max-w-lg leading-relaxed">
                Empowering citizens and legislators with transparent, reliable tools for monitoring human rights and legislative progress.
              </p>
            </div>

            {/* Hero Image */}
            <div className="mb-8 rounded-2xl overflow-hidden border border-outline-variant/30 shadow-md">
              <img
                alt="Constitution of India held in front of Parliament"
                className="w-full h-64 object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuATwg7cqEqj4Sv9sW5X6Malbya4tQBj2bBGUcFJ2n9jHRftij0IddDcsazs0kmbkibml58u-wyRzqR8IS1X3-mcgUDjr0ok9HNZ7NIUsjwam-UjB9AwYio79F_qX3KBt7V-PnDSfJRrt-hIjDpN13vTXI5Sau7sxrmujBH7Q_0lluPGwWCF8hvqarf3FtU4HG2lxK6gjh4RQFxYbMMPwJaiEdnmGrt-s6SZ3E42f_0Hy_hCb9vWhIbFg3Am28Bg2xw6QuM"
              />
            </div>

            {/* Trust Card */}
            <div className="mt-auto bg-surface-container-lowest/70 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-secondary/20 max-w-md flex items-start gap-4">
              <span className="material-symbols-outlined text-secondary text-[32px] mt-0.5">shield_locked</span>
              <div>
                <h3 className="font-sans font-semibold text-sm text-primary mb-1">Your information is private</h3>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  We employ government-grade encryption to ensure your data and civic actions remain secure and confidential.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form (40%) */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-6 md:p-12 bg-[#EDE6DA] relative">
          {/* Card Container */}
          <div className="w-full max-w-md bg-surface/95 backdrop-blur-md rounded-[24px] shadow-[0_20px_50px_rgba(27,67,50,0.15)] p-8 relative z-10 border border-white/60">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[24px]">shield</span>
              </div>
              <span className="font-serif text-2xl font-bold text-primary">RightsTrack</span>
            </div>

            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="font-serif text-3xl font-bold text-primary mb-2">Welcome back</h2>
              <p className="font-sans text-sm text-on-surface-variant">Continue managing your cases and tracking legislation.</p>
            </div>

            {/* The Form */}
            <form onSubmit={handleSignIn} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block font-sans text-xs font-semibold text-on-surface" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">mail</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-outline-variant/60 rounded-xl text-on-surface text-sm bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline/60 outline-none"
                    id="email"
                    name="email"
                    placeholder="citizen@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block font-sans text-xs font-semibold text-on-surface" htmlFor="password">
                    Password
                  </label>
                  <a className="font-sans text-xs text-secondary hover:text-primary transition-colors underline-offset-4 hover:underline" href="#">
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px]">lock</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-10 py-3 border border-outline-variant/60 rounded-xl text-on-surface text-sm bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      aria-label="Toggle password visibility"
                      className="text-outline hover:text-primary focus:outline-none transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Primary Action */}
              <button
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm font-sans font-semibold text-sm text-on-primary bg-primary-container hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
                type="submit"
              >
                Sign in
              </button>

              {/* Divider */}
              <div className="relative py-2">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/40"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-surface text-on-surface-variant font-medium">or</span>
                </div>
              </div>

              {/* Secondary Action */}
              <button
                className="w-full flex justify-center items-center py-3.5 px-4 border border-secondary/40 rounded-xl shadow-sm font-sans font-semibold text-sm text-primary bg-surface hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all duration-200 group hover:border-secondary"
                type="button"
                onClick={handleGuest}
              >
                <span className="material-symbols-outlined text-[20px] mr-2 group-hover:scale-110 transition-transform">person_outline</span>
                Describe your problem as Guest
              </button>
            </form>

            {/* Footer Link */}
            <p className="mt-8 text-center font-sans text-sm text-on-surface-variant">
              Don't have an account?{' '}
              <a className="font-semibold text-primary hover:text-secondary hover:underline transition-colors" href="#" onClick={handleGuest}>
                Sign up
              </a>
            </p>
          </div>

          {/* Decorative Background Accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-container/30 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}
