import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold shadow-sm">
              RT
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">RightsTrack</span>
              <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                Civic AI
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/intake" className="hover:text-emerald-700 transition">
            New Case
          </Link>
          <Link href="/dashboard" className="hover:text-emerald-700 transition">
            Case Dashboard
          </Link>
          <Link
            href="/intake"
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            Start Intake
          </Link>
        </nav>
      </div>
    </header>
  );
}
