'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [cases, setCases] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'hidden'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function loadDashboardCases() {
      let savedCases = [];
      try {
        const localData = localStorage.getItem('tracked_cases');
        if (localData) {
          savedCases = JSON.parse(localData);
        } else {
          savedCases = [
            {
              id: 'case_rt_101',
              title: 'PM-KISAN Withheld Installments & Redressal',
              domain: 'Right to Information',
              status: 'pending_response',
              created_at: '2026-07-23',
              days_remaining: 0,
              isExpired: true,
              isHidden: false,
            },
            {
              id: 'case_rt_102',
              title: 'Unauthorized Electronic Banking Debit Chargeback',
              domain: 'Cyber Crime',
              status: 'drafted',
              created_at: '2026-08-15',
              days_remaining: 22,
              isExpired: false,
              isHidden: false,
            }
          ];
          localStorage.setItem('tracked_cases', JSON.stringify(savedCases));
        }
      } catch (e) {
        console.error(e);
      }
      setCases(savedCases);
      setIsLoading(false);
    }

    loadDashboardCases();
  }, []);

  const updateStorage = (updatedList) => {
    setCases(updatedList);
    localStorage.setItem('tracked_cases', JSON.stringify(updatedList));
  };

  const handleToggleHide = (caseId) => {
    const updated = cases.map((c) => 
      c.id === caseId ? { ...c, isHidden: !c.isHidden } : c
    );
    updateStorage(updated);
  };

  const handleDeleteCase = (caseId) => {
    const confirmed = window.confirm('Are you sure you want to permanently delete this petition?');
    if (confirmed) {
      const filtered = cases.filter((c) => c.id !== caseId);
      updateStorage(filtered);
    }
  };

  const activeCases = cases.filter((c) => !c.isHidden);
  const hiddenCases = cases.filter((c) => c.isHidden);
  const currentList = activeTab === 'active' ? activeCases : hiddenCases;

  return (
    <div className="min-h-screen bg-[#EDE6D6] font-sans text-[#2C2416] p-4 sm:p-6 md:p-10 relative overflow-hidden selection:bg-[#1A3826] selection:text-white">
      
      {/* 🌟 Layer 1: Geometric Dot Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#1A3826 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* 🌟 Layer 2: Ambient Glowing Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-[#1A3826]/15 via-[#2C5E40]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[550px] h-[550px] bg-gradient-to-tl from-[#C89D56]/15 via-[#D6B575]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* 🌟 Layer 3: Frosted Floating Navigation Header */}
        <header className="flex justify-between items-center backdrop-blur-xl bg-[#F4EFE6]/85 p-3.5 sm:p-4 px-6 rounded-3xl border border-[#DCD1BC] shadow-[0_10px_30px_-5px_rgba(44,36,22,0.06)] ring-1 ring-white/60">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1A3826] to-[#0E2015] text-[#EDE6D6] flex items-center justify-center shadow-md shadow-[#1A3826]/20 group-hover:scale-105 transition-all ring-1 ring-white/30">
              <span className="material-symbols-outlined text-[22px]">shield</span>
            </div>
            <div>
              <span className="font-serif text-2xl font-black text-[#1A3826] tracking-tight block leading-none">RightsTrack</span>
              <span className="text-[10px] font-mono font-bold text-[#7A6D56] uppercase tracking-widest">Citizen Redressal Hub</span>
            </div>
          </Link>

          <Link
            href="/intake"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#1A3826] to-[#254A34] text-[#EDE6D6] text-xs font-bold shadow-lg shadow-[#1A3826]/20 hover:from-[#12281B] hover:to-[#1A3826] transition-all active:scale-95 ring-1 ring-white/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Grievance
          </Link>
        </header>

        {/* 🌟 Layer 4: Interactive Metric Overview Shelf */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#F8F4EC]/90 backdrop-blur-md rounded-2xl border border-[#DCD1BC] p-5 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A6D56] font-bold block mb-1">Active Petitions</span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-black text-[#1A3826]">{activeCases.length}</span>
              <span className="text-xs font-bold text-[#2E5E41]">Under Tracking</span>
            </div>
          </div>

          <div className="bg-[#F8F4EC]/90 backdrop-blur-md rounded-2xl border border-[#DCD1BC] p-5 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A6D56] font-bold block mb-1">Elapsed Deadlines</span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-black text-[#B3261E]">
                {cases.filter(c => c.isExpired && !c.isHidden).length}
              </span>
              <span className="text-xs font-bold text-[#B3261E]">First Appeal Ready</span>
            </div>
          </div>

          <div className="bg-[#F8F4EC]/90 backdrop-blur-md rounded-2xl border border-[#DCD1BC] p-5 shadow-sm">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#7A6D56] font-bold block mb-1">Hidden / Completed</span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-black text-[#5C4F3B]">{hiddenCases.length}</span>
              <span className="text-xs font-bold text-[#6B5E48]">Archived</span>
            </div>
          </div>
        </div>

        {/* 🌟 Layer 5: Tab Switcher Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="inline-flex items-center bg-[#E5DCBE]/60 p-1.5 rounded-2xl border border-[#D3C7AE] shadow-inner backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'active'
                  ? 'bg-[#1A3826] text-[#EDE6D6] shadow-md shadow-[#1A3826]/20'
                  : 'text-[#5C4F3B] hover:text-[#1A3826]'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">task_alt</span>
              Active Cases ({activeCases.length})
            </button>

            <button
              onClick={() => setActiveTab('hidden')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'hidden'
                  ? 'bg-[#1A3826] text-[#EDE6D6] shadow-md shadow-[#1A3826]/20'
                  : 'text-[#5C4F3B] hover:text-[#1A3826]'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">visibility_off</span>
              Hidden / Archive ({hiddenCases.length})
            </button>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F4EFE6] border border-[#DCD1BC] text-xs font-bold text-[#6B5E48]">
            <span className="w-2 h-2 rounded-full bg-[#1A3826]" />
            Live Sync Storage
          </div>
        </div>

        {/* 🌟 Layer 6: Multi-Layered Case Cards */}
        {isLoading ? (
          <div className="bg-[#F8F4EC]/95 rounded-3xl border border-[#DCD1BC] p-16 text-center text-[#6B5E48]">
            Loading tracked legal cases...
          </div>
        ) : currentList.length === 0 ? (
          <div className="bg-[#F8F4EC]/95 backdrop-blur-md rounded-3xl border border-[#DCD1BC] p-16 text-center space-y-3 shadow-sm ring-1 ring-white/70">
            <span className="material-symbols-outlined text-5xl text-[#8C7D6B]/70">
              {activeTab === 'active' ? 'inbox' : 'archive'}
            </span>
            <h3 className="font-serif text-lg font-bold text-[#2C2416]">
              {activeTab === 'active' ? 'No Active Petitions Found' : 'Archive is Currently Empty'}
            </h3>
            <p className="text-xs text-[#6B5E48] max-w-sm mx-auto">
              {activeTab === 'active' 
                ? 'Create a new grievance from the button above to begin generating statutory legal drafts.' 
                : 'Cases hidden from the active dashboard will be archived safely here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentList.map((c) => (
              <div
                key={c.id}
                className="bg-[#F8F4EC]/95 backdrop-blur-xl rounded-3xl border border-[#DCD1BC] p-6 sm:p-7 shadow-[0_12px_30px_-8px_rgba(44,36,22,0.08)] flex flex-col justify-between hover:border-[#1A3826]/40 hover:shadow-[0_20px_40px_-10px_rgba(44,36,22,0.12)] transition-all duration-200 group relative ring-1 ring-white/80"
              >
                {/* Accent Ribbon */}
                <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#1A3826]/20 to-transparent" />

                <div>
                  {/* Card Header Pills */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[11px] font-mono font-black uppercase tracking-wider text-[#133320] bg-[#DCE7DD] px-3 py-1 rounded-xl border border-[#B9D3BC] shadow-xs">
                      {c.domain}
                    </span>

                    {c.isExpired ? (
                      <span className="text-[11px] font-extrabold text-[#B3261E] bg-red-50 border border-red-200 px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B3261E] animate-pulse" />
                        Deadline Elapsed
                      </span>
                    ) : (
                      <span className="text-[11px] font-extrabold text-[#2E5E41] bg-[#E8F0E9] border border-[#C2D8C5] px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E5E41]" />
                        {c.days_remaining ? `${c.days_remaining} Days Left` : 'Active'}
                      </span>
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <h2 className="font-serif text-xl font-black text-[#1A3826] mb-2 leading-snug group-hover:text-[#2E5E41] transition-colors">
                    {c.title}
                  </h2>

                  <div className="bg-[#EFE8DA]/80 border border-[#DCD0BA] rounded-xl p-3 mb-6 flex items-center justify-between text-xs font-mono text-[#6B5E48]">
                    <span>REF: {c.id}</span>
                    <span>Date: {c.created_at || 'Aug 2026'}</span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-[#E5DBCA] flex items-center justify-between gap-2">
                  <Link
                    href={`/document/${c.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#D5C8B4] text-xs font-bold text-[#1A3826] hover:bg-[#F3ECE0] transition-all shadow-xs group-hover:border-[#1A3826]/40"
                  >
                    <span className="material-symbols-outlined text-[17px]">description</span>
                    View Petition
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleHide(c.id)}
                      className="p-2 px-3 rounded-xl bg-[#EFE8DA] hover:bg-[#E5DCBE] border border-[#DCD0BA] text-xs font-bold text-[#5C4F3B] flex items-center gap-1.5 transition-all shadow-xs"
                      title={c.isHidden ? 'Move to Active' : 'Hide from Dashboard'}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {c.isHidden ? 'visibility' : 'visibility_off'}
                      </span>
                      {c.isHidden ? 'Unhide' : 'Hide'}
                    </button>

                    <button
                      onClick={() => handleDeleteCase(c.id)}
                      className="p-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-[#B3261E] flex items-center gap-1.5 transition-all shadow-xs"
                      title="Permanently Delete Case"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Delete
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}