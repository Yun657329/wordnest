"use client";

export interface WordType {
  partOfSpeech: string;
  meanings: string[];
}

export interface Sentence {
  english: string;
  chinese: string;
  cloze: string;
  explanation: string;
}

export interface Word {
  id: string;
  english: string;
  types: WordType[];
  favorite: boolean;
  aiSentences: Sentence[];
}

interface WordCardProps {
  word: Word;
  onToggleFavorite: (wordId: string) => void;
  onEdit: (word: Word) => void;
  onDelete: (wordId: string) => void;
  onGenerateAI: (word: Word) => void | Promise<void>;
    isGenerating?: boolean;
  generatingWord?: string;
}

export default function WordCard({
  word,
  onToggleFavorite,
  onEdit,
  onDelete,
  onGenerateAI,
  isGenerating,
  generatingWord,
}: WordCardProps) {
  const sentenceCount = word.aiSentences?.length ?? 0;
  const hasAiSentences = sentenceCount > 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleFavorite(word.id)}
            className={`shrink-0 text-2xl transition hover:scale-110 ${
              word.favorite
                ? "text-amber-500"
                : "text-slate-300 hover:text-amber-400"
            }`}
            title={word.favorite ? "取消收藏" : "加入收藏"}
            aria-label={word.favorite ? "取消收藏" : "加入收藏"}
          >
            {word.favorite ? "★" : "☆"}
          </button>

          <h2 className="truncate text-xl font-bold text-slate-900">
            {word.english}
          </h2>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            hasAiSentences
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {hasAiSentences
            ? `● AI 已建立（${sentenceCount}）`
            : "○ 尚未建立 AI"}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {word.types.map((type, typeIndex) => (
          <div key={`${word.id}-type-${typeIndex}`}>
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
              {type.partOfSpeech}
            </span>

            <div className="mt-2 space-y-1 text-slate-700">
              {type.meanings.map((meaning, meaningIndex) => (
                <p key={`${word.id}-meaning-${typeIndex}-${meaningIndex}`}>
                  {meaningIndex + 1}. {meaning}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onEdit(word)}
          className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
        >
          ✏️ 編輯
        </button>

        <button
  type="button"
  disabled={
    isGenerating &&
    generatingWord === word.english
  }
  onClick={() => onGenerateAI(word)}
  className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
>
  🤖
  {isGenerating &&
  generatingWord === word.english
    ? "建立中..."
    : hasAiSentences
      ? "重建 AI"
      : "建立 AI"}
</button>

        <button
          type="button"
          onClick={() => {
            const confirmed = window.confirm(
              `確定要刪除「${word.english}」嗎？`
            );

            if (confirmed) {
              onDelete(word.id);
            }
          }}
          className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
        >
          🗑 刪除
        </button>
      </div>
    </article>
  );
}