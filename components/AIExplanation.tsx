interface Sentence {
  english: string;
  chinese: string;
  cloze: string;
  explanation?: string;
}

interface Word {
  english: string;
}

interface AIExplanationProps {
  sentence: Sentence | null;
  word: Word | null;
  correct: boolean;
  onRetry: () => void;
  onNext: () => void;
}

export default function AIExplanation({
  sentence,
  word,
  correct,
  onRetry,
  onNext,
}: AIExplanationProps) {
  if (!sentence || !word) return null;

  const explanation =
    sentence.explanation?.trim() ?? "";

  const hasChineseExplanation =
    /[\u3400-\u9fff]/.test(explanation);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">
        {correct ? "✅ 答對！" : "❌ 答錯"}
      </h2>

      {!correct && (
        <p className="text-lg">
          正確答案：
          <span className="font-bold text-blue-600">
            {" "}
            {word.english}
          </span>
        </p>
      )}

      <div className="rounded-xl border p-4">
        <h3 className="mb-2 font-semibold">
          📖 英文原句
        </h3>

        <p>{sentence.english}</p>
      </div>

      <div className="rounded-xl border p-4">
        <h3 className="mb-2 font-semibold">
          🇹🇼 中文翻譯
        </h3>

        <p>{sentence.chinese}</p>
      </div>

      <div className="rounded-xl border p-4">
        <h3 className="mb-2 font-semibold">
          💡 AI 詳解
        </h3>

        {!explanation ? (
          <p className="text-gray-500">
            這是較早建立的例句，當時尚未儲存 AI
            詳解。重新建立此單字的 AI
            題庫後就會產生詳解。
          </p>
        ) : (
          <>
            <p>{explanation}</p>

            {!hasChineseExplanation && (
              <p className="mt-3 text-sm text-orange-600">
                ⚠️ 這筆詳解不是中文，之後需要重新產生題庫。
              </p>
            )}
          </>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full rounded-xl border border-blue-500 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          🔄 再出一題同單字
        </button>

        <button
          onClick={onNext}
          className="w-full rounded-xl bg-blue-600 py-3 text-white transition hover:bg-blue-700"
        >
          ➡ 下一題
        </button>
      </div>
    </div>
  );
}