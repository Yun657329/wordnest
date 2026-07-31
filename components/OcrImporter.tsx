"use client";

import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { createWorker } from "tesseract.js";
import { parseOcr } from "@/lib/parser";
import { saveBookToCloud } from "@/lib/bookService";

interface WordType {
  partOfSpeech: string;
  meanings: string[];
}

interface Sentence {
  english: string;
  chinese: string;
  cloze: string;
  explanation: string;
}

interface Word {
  id: string;
  english: string;
  types: WordType[];
  favorite: boolean;
  aiSentences: Sentence[];
}

interface Book {
  id: string;
  name: string;
  words: Word[];
}

interface OcrImporterProps {
  book: Book;
  setBook: Dispatch<SetStateAction<Book | null>>;
}

interface ParsedWordPreview {
  id: string;
  english: string;
  types: WordType[];
  warnings: string[];
}

function normalizeMeanings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((meaning): meaning is string => typeof meaning === "string")
    .map((meaning) => meaning.trim())
    .filter(Boolean);
}

function normalizeTypes(value: unknown): WordType[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;
      const partOfSpeech =
        typeof record.partOfSpeech === "string"
          ? record.partOfSpeech.trim()
          : "";

      const meanings = normalizeMeanings(record.meanings);

      if (!partOfSpeech && meanings.length === 0) return null;

      return {
        partOfSpeech: partOfSpeech || "待確認",
        meanings: meanings.length > 0 ? meanings : ["待確認"],
      };
    })
    .filter((item): item is WordType => item !== null);
}

function normalizeWarnings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (warning): warning is string => typeof warning === "string"
  );
}

function normalizeParsedWords(value: unknown): ParsedWordPreview[] {
  if (!Array.isArray(value)) return [];

  const results: ParsedWordPreview[] = [];

  value.forEach((item, index) => {
    if (!item || typeof item !== "object") return;

    const outer = item as Record<string, unknown>;

    const possibleWord =
      outer.type === "word" && outer.word && typeof outer.word === "object"
        ? (outer.word as Record<string, unknown>)
        : outer.kind === "word" && outer.word && typeof outer.word === "object"
          ? (outer.word as Record<string, unknown>)
          : typeof outer.english === "string"
            ? outer
            : null;

    if (!possibleWord) return;

    const english =
      typeof possibleWord.english === "string"
        ? possibleWord.english.trim()
        : "";

    if (!english) return;

    const types = normalizeTypes(possibleWord.types);
    const warnings = [
      ...normalizeWarnings(outer.warnings),
      ...normalizeWarnings(possibleWord.warnings),
    ];

    results.push({
      id: `${english.toLowerCase()}-${index}`,
      english,
      types:
        types.length > 0
          ? types
          : [
              {
                partOfSpeech: "待確認",
                meanings: ["待確認"],
              },
            ],
      warnings,
    });
  });

  return results;
}

export default function OcrImporter({
  book,
  setBook,
}: OcrImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsedWords, setParsedWords] = useState<ParsedWordPreview[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearResults() {
    setRawText("");
    setParsedWords([]);
    setSelectedIds(new Set());
    setProgress(0);
    setStatus("");
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("請選擇圖片檔案。");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const nextPreviewUrl = URL.createObjectURL(file);

    setImageFile(file);
    setPreviewUrl(nextPreviewUrl);
    clearResults();
  }

  function parseAndShow(text: string) {
    const parsed = parseOcr(text);
    const normalizedWords = normalizeParsedWords(parsed);

    setParsedWords(normalizedWords);
    setSelectedIds(new Set(normalizedWords.map((word) => word.id)));

    return normalizedWords;
  }

  async function recognizeImage() {
    if (!imageFile || isRecognizing) return;

    setIsRecognizing(true);
    setProgress(0);
    setStatus("正在準備 OCR…");

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

    try {
      worker = await createWorker(["eng", "chi_tra"], 1, {
        logger: (message) => {
          if (typeof message.progress === "number") {
            setProgress(Math.round(message.progress * 100));
          }

          if (message.status) {
            setStatus(message.status);
          }
        },
      });

      const result = await worker.recognize(imageFile);
      const text = result.data.text ?? "";
      const normalizedWords = parseAndShow(text);

      setRawText(text);

      if (normalizedWords.length === 0) {
        alert(
          "沒有解析出完整單字資料。你可以先修改 OCR 原始文字，再按「重新解析內容」。"
        );
      }
    } catch (error) {
      console.error("OCR 辨識失敗：", error);
      alert("OCR 辨識失敗，請確認網路連線後再試一次。");
    } finally {
      if (worker) {
        await worker.terminate();
      }

      setIsRecognizing(false);
      setStatus("");
    }
  }

  function rebuildParsedWords() {
    const normalizedWords = parseAndShow(rawText);

    if (normalizedWords.length === 0) {
      alert("目前文字無法解析出完整單字資料，請再檢查內容格式。");
    }
  }

  function toggleWord(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  async function importSelectedWords() {
    const existingWords = new Set(
      book.words.map((word) => word.english.toLowerCase())
    );

    const wordsToAdd = parsedWords.filter(
      (word) =>
        selectedIds.has(word.id) &&
        !existingWords.has(word.english.toLowerCase())
    );

    if (wordsToAdd.length === 0) {
      alert("沒有可加入的新單字。");
      return;
    }

    const newWords: Word[] = wordsToAdd.map((word) => ({
      id: crypto.randomUUID(),
      english: word.english,
      types: word.types,
      favorite: false,
      aiSentences: [],
    }));

    const updatedBook: Book = {
      ...book,
      words: [...book.words, ...newWords],
    };

    const savedBooks: Book[] = JSON.parse(
      localStorage.getItem("wordnest-books") || "[]"
    );

    const updatedBooks = savedBooks.map((item) =>
      item.id === book.id ? updatedBook : item
    );

    localStorage.setItem("wordnest-books", JSON.stringify(updatedBooks));
    setBook(updatedBook);
    localStorage.setItem("wordnest-books", JSON.stringify(updatedBooks));

setBook(updatedBook);

await saveBookToCloud(updatedBook);

alert(`✅ 已加入 ${newWords.length} 個單字。`);

    alert(`✅ 已加入 ${newWords.length} 個單字。`);

    setImageFile(null);
    clearResults();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    setIsOpen(false);
  }

  const existingCount = parsedWords.filter((word) =>
    book.words.some(
      (savedWord) =>
        savedWord.english.toLowerCase() === word.english.toLowerCase()
    )
  ).length;

  const selectedCount = parsedWords.filter((word) => {
    const alreadyExists = book.words.some(
      (savedWord) =>
        savedWord.english.toLowerCase() === word.english.toLowerCase()
    );

    return selectedIds.has(word.id) && !alreadyExists;
  }).length;

  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white"
      >
        📷 OCR 匯入圖片
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div>
            <p className="font-semibold text-slate-800">選擇單字表圖片</p>
            <p className="mt-1 text-sm text-slate-500">
              建議文字清楚、畫面平整，避免陰影和反光。
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="block w-full text-sm"
          />

          {previewUrl && (
            <img
              src={previewUrl}
              alt="OCR 圖片預覽"
              className="max-h-72 w-full rounded-xl border bg-white object-contain"
            />
          )}

          <button
            type="button"
            onClick={recognizeImage}
            disabled={!imageFile || isRecognizing}
            className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRecognizing ? `辨識中 ${progress}%` : "🔍 開始辨識"}
          </button>

          {isRecognizing && (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-violet-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-slate-500">
                {status || "正在辨識…"}
              </p>
            </div>
          )}

          {rawText && (
            <>
              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  OCR 原始文字
                </label>
                <textarea
                  value={rawText}
                  onChange={(event) => setRawText(event.target.value)}
                  className="min-h-36 w-full rounded-xl border bg-white p-3"
                />
                <button
                  type="button"
                  onClick={rebuildParsedWords}
                  className="mt-2 w-full rounded-xl border border-violet-300 bg-white py-2 font-medium text-violet-700"
                >
                  🧹 重新解析內容
                </button>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-800">
                    解析結果：{parsedWords.length} 個
                  </p>

                  <div className="text-right text-xs text-slate-500">
                    {existingCount > 0 && <p>已存在 {existingCount} 個</p>}
                    <p>已選擇 {selectedCount} 個</p>
                  </div>
                </div>

                {parsedWords.length > 0 ? (
                  <div className="max-h-96 space-y-3 overflow-y-auto rounded-xl border bg-white p-3">
                    {parsedWords.map((word, index) => {

                      const alreadyExists = book.words.some(
                        (savedWord) =>
                          savedWord.english.toLowerCase() ===
                          word.english.toLowerCase()
                      );

                      return (
                        <label
                          key={word.id}
                          className={`block rounded-xl border p-3 ${
                            alreadyExists
                              ? "border-slate-200 bg-slate-100 text-slate-400"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={
                                selectedIds.has(word.id) && !alreadyExists
                              }
                              disabled={alreadyExists}
                              onChange={() => toggleWord(word.id)}
                              className="mt-1"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <input
  value={word.english}
  onChange={(e) => {
    const next = [...parsedWords];
    next[index].english = e.target.value;
    setParsedWords(next);
  }}
  className="w-full rounded-lg border px-3 py-2 text-lg font-semibold"
/>

                                {alreadyExists && (
                                  <span className="shrink-0 text-xs">
                                    已存在
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 space-y-2">
                                {word.types.map((type, typeIndex) => (
                                  <div
                                    key={`${word.id}-${typeIndex}`}
                                    className="rounded-lg bg-slate-50 px-3 py-2"
                                  >
                                    <input
  value={type.partOfSpeech}
  onChange={(e) => {
    const next = [...parsedWords];
    next[index].types[typeIndex].partOfSpeech = e.target.value;
    setParsedWords(next);
  }}
  className="w-full rounded border px-2 py-1 text-sm font-semibold text-violet-700"
/>
                                    <textarea
  value={type.meanings.join("；")}
  onChange={(e) => {
    const next = [...parsedWords];
    next[index].types[typeIndex].meanings = e.target.value
      .split("；")
      .map((item) => item.trim())
      .filter(Boolean);

    setParsedWords(next);
  }}
  className="mt-2 w-full rounded border p-2 text-sm"
/>
                                  </div>
                                ))}
                              </div>

                              {word.warnings.length > 0 && (
                                <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                                  {word.warnings.join("、")}
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border bg-white p-4 text-sm text-slate-500">
                    尚未解析出完整單字資料。你可以修改上方 OCR
                    原始文字後重新解析。
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={importSelectedWords}
                disabled={selectedCount === 0}
                className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ➕ 加入已勾選單字（{selectedCount}）
              </button>

              <p className="text-xs leading-5 text-slate-500">
                匯入前請確認英文、詞性與中文意思。系統只會加入已勾選且教材中尚未存在的單字。
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}