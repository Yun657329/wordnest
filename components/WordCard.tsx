"use client";

import {
  useState,
  type ReactNode,
} from "react";

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

interface EditableWordType {
  partOfSpeech: string;
  meanings: string;
}

interface WordCardProps {
  word: Word;
  onToggleFavorite: (wordId: string) => void;
  onEdit: (word: Word) => void;
  onDelete: (wordId: string) => void;
  onGenerateAI: (word: Word) => void | Promise<void>;
  isGenerating?: boolean;
  generatingWord?: string;

  isEditing: boolean;
  setEditingWordId: (wordId: string | null) => void;
  saveInlineWord: (updatedWord: Word) => void | Promise<void>;
  dragHandle?: React.ReactNode;
}

export default function WordCard({
  word,
  onToggleFavorite,
  onDelete,
  onGenerateAI,
  isGenerating,
  generatingWord,
  isEditing,
  setEditingWordId,
  saveInlineWord,
  dragHandle,
}: WordCardProps) {
  const [editEnglish, setEditEnglish] = useState(word.english);

  const [editTypes, setEditTypes] = useState<EditableWordType[]>(
    word.types.map((type) => ({
      partOfSpeech: type.partOfSpeech,
      meanings: type.meanings.join("\n"),
    }))
  );

  const [isSaving, setIsSaving] = useState(false);

  const sentenceCount = word.aiSentences?.length ?? 0;
  const hasAiSentences = sentenceCount > 0;

  function speakWord() {
  if (!("speechSynthesis" in window)) {
  console.error("這個瀏覽器不支援發音功能");
  return;
}

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word.english);
  utterance.lang = "en-US";
  utterance.rate = 0.9;

  const voices = window.speechSynthesis.getVoices();

  const americanVoice = voices.find(
    (voice) => voice.lang === "en-US"
  );

  if (americanVoice) {
    utterance.voice = americanVoice;
  }

  window.speechSynthesis.speak(utterance);
}
  function startEditing() {
    setEditEnglish(word.english);

    setEditTypes(
      word.types.map((type) => ({
        partOfSpeech: type.partOfSpeech,
        meanings: type.meanings.join("\n"),
      }))
    );

    setEditingWordId(word.id);
  }

  function cancelEditing() {
    setEditEnglish(word.english);

    setEditTypes(
      word.types.map((type) => ({
        partOfSpeech: type.partOfSpeech,
        meanings: type.meanings.join("\n"),
      }))
    );

    setEditingWordId(null);
  }

  function updatePartOfSpeech(index: number, value: string) {
    setEditTypes((currentTypes) =>
      currentTypes.map((type, typeIndex) =>
        typeIndex === index
          ? {
              ...type,
              partOfSpeech: value,
            }
          : type
      )
    );
  }

  function updateMeanings(index: number, value: string) {
    setEditTypes((currentTypes) =>
      currentTypes.map((type, typeIndex) =>
        typeIndex === index
          ? {
              ...type,
              meanings: value,
            }
          : type
      )
    );
  }

  function addType() {
    setEditTypes((currentTypes) => [
      ...currentTypes,
      {
        partOfSpeech: "",
        meanings: "",
      },
    ]);
  }

  function removeType(index: number) {
    if (editTypes.length === 1) {
      return;
    }

    setEditTypes((currentTypes) =>
      currentTypes.filter((_, typeIndex) => typeIndex !== index)
    );
  }

  async function handleSave() {
    const trimmedEnglish = editEnglish.trim();

    if (!trimmedEnglish) {
      window.alert("請輸入英文單字");
      return;
    }

    const hasEmptyPartOfSpeech = editTypes.some(
      (type) => !type.partOfSpeech.trim()
    );

    if (hasEmptyPartOfSpeech) {
      window.alert("請填寫每一個詞性");
      return;
    }

    const updatedTypes: WordType[] = editTypes.map((type) => ({
      partOfSpeech: type.partOfSpeech.trim(),
      meanings: type.meanings
        .split("\n")
        .map((meaning) => meaning.trim())
        .filter(Boolean),
    }));

    const updatedWord: Word = {
      ...word,
      english: trimmedEnglish,
      types: updatedTypes,
    };

    try {
      setIsSaving(true);
      await saveInlineWord(updatedWord);
    } catch (error) {
      console.error("儲存單字失敗：", error);
      window.alert("儲存失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <article className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            英文單字
          </label>

          <input
            type="text"
            value={editEnglish}
            onChange={(event) => setEditEnglish(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="輸入英文單字"
          />
        </div>

        <div className="mt-5 space-y-4">
          {editTypes.map((type, index) => (
            <div
              key={`${word.id}-edit-type-${index}`}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  詞性與意思 {index + 1}
                </p>

                {editTypes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeType(index)}
                    className="text-sm font-medium text-red-500 transition hover:text-red-600"
                  >
                    刪除這組
                  </button>
                )}
              </div>

              <label className="mb-2 mt-4 block text-sm text-slate-600">
                詞性
              </label>

              <input
                type="text"
                value={type.partOfSpeech}
                onChange={(event) =>
                  updatePartOfSpeech(index, event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="例如：v.、n.、adj."
              />

              <label className="mb-2 mt-4 block text-sm text-slate-600">
                中文意思
              </label>

              <textarea
                value={type.meanings}
                onChange={(event) => updateMeanings(index, event.target.value)}
                rows={3}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder={"每個意思輸入一行\n例如：管理\n處理"}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addType}
          className="mt-4 w-full rounded-xl border border-dashed border-blue-300 px-4 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
        >
          ＋ 新增詞性
        </button>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={cancelEditing}
            disabled={isSaving}
            className="rounded-xl bg-slate-100 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "儲存中..." : "儲存"}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {dragHandle}
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

          <div className="flex min-w-0 items-center gap-2">
  <h2 className="break-words text-xl font-bold text-slate-900">
  {word.english}
</h2>

  <button
    type="button"
    onClick={speakWord}
    className="shrink-0 text-lg transition hover:scale-110"
    title="播放美式發音"
    aria-label={`播放 ${word.english} 的美式發音`}
  >
    🔊
  </button>
</div>
        </div>

        <span
  className={`self-start shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
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
          onClick={startEditing}
          className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
        >
          ✏️ 編輯
        </button>

        <button
          type="button"
          disabled={isGenerating && generatingWord === word.english}
          onClick={() => onGenerateAI(word)}
          className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          🤖{" "}
          {isGenerating && generatingWord === word.english
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