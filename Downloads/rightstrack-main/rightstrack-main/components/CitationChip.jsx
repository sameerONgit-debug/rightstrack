'use client';

export default function CitationChip({ index, onClick, isSelected }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold align-super ml-0.5 transition-all ${
        isSelected
          ? 'bg-primary text-white scale-110 ring-2 ring-primary/30'
          : 'bg-secondary-container text-primary hover:bg-secondary hover:text-white'
      }`}
      title={`Click to view source citation #${index}`}
    >
      {index}
    </button>
  );
}
