'use client';

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="bg-red-950/30 border border-red-500/30 text-red-200 p-6 rounded-xl text-center space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-red-300">{message || "We couldn't process that — try rephrasing, or describe just the core issue in one sentence."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
