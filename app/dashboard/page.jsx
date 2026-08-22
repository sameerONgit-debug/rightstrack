'use client';

import { useState } from 'react';
import Link from 'next/link';
import CaseCard from '@/components/CaseCard';
import { mockCasesList } from '@/lib/mockData';

export default function DashboardPage() {
  const [cases] = useState(mockCasesList.cases);
  const [filter, setFilter] = useState('all');

  const filteredCases = cases.filter((c) => {
    if (filter === 'urgent') return c.status === 'overdue' || (c.days_remaining && c.days_remaining <= 0);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#EDE6DA] font-sans text-on-surface flex flex-col lg:flex-row">
      {/* SideNavBar (Desktop Only) */}
      <aside className="bg-surface border-r border-outline-variant/20 w-64 hidden lg:flex flex-col h-screen fixed left-0 top-0 py-6 px-4 z-20">
        <div className="px-3 mb-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary tracking-tight">RightsTrack</h1>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Civic Platform</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <Link
            href="/dashboard"
            className="bg-secondary-container/60 text-primary rounded-xl flex items-center gap-3 px-4 py-3 font-semibold text-sm transition-all"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              dashboard
            </span>
            <span>Dashboard</span>
          </Link>
          <Link
            href="/intake"
            className="text-on-surface-variant hover:bg-surface-container-low rounded-xl flex items-center gap-3 px-4 py-3 font-medium text-sm transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>New Case Intake</span>
          </Link>
        </nav>

        <div className="pt-4 border-t border-outline-variant/20 px-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">
            RT
          </div>
          <div>
            <p className="font-semibold text-xs text-primary">Citizen Account</p>
            <p className="text-[10px] text-on-surface-variant">Active Session</p>
          </div>
        </div>
      </aside>

      {/* Header (Mobile Only) */}
      <header className="bg-surface border-b border-outline-variant/20 flex justify-between items-center px-6 h-16 lg:hidden fixed top-0 left-0 right-0 z-30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <span className="font-serif text-xl font-bold text-primary">RightsTrack</span>
        </Link>
        <Link href="/intake" className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium">
          + New Case
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-10 px-6 md:px-10 max-w-6xl w-full pb-16">
        {/* Top Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">Your Cases</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Track statutory deadlines, inspect grounding citations, and trigger automated appeals.
            </p>
          </div>
          <Link
            href="/intake"
            className="bg-primary text-on-primary font-semibold text-sm px-6 py-3 rounded-xl shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Case</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-3">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`font-semibold text-sm pb-2 border-b-2 transition-all ${
                filter === 'all' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              All Active ({cases.length})
            </button>
            <button
              onClick={() => setFilter('urgent')}
              className={`font-semibold text-sm pb-2 border-b-2 transition-all ${
                filter === 'urgent' ? 'border-red-600 text-red-600' : 'border-transparent text-on-surface-variant hover:text-red-600'
              }`}
            >
              Needs Action / Overdue (1)
            </button>
          </div>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((item) => (
            <CaseCard key={item.id} caseItem={item} />
          ))}
        </div>
      </main>
    </div>
  );
}
