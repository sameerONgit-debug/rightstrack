'use client';

export default function LoadingState({ message = 'Reading your situation...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm animate-pulse">{message}</p>
    </div>
  );
}
