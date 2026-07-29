"use client";
import { useEffect, useState } from "react";
import { generateSentences } from "@/lib/ai";
import WordCard from "@/components/WordCard";
import OcrImporter from "@/components/OcrImporter";

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
export default function BookPage() {
  const [book, setBook] = useState<Book | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
const [currentWord, setCurrentWord] = useState("");
const [progress, setProgress] = useState(0);
const [total, setTotal] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [english, setEnglish] = useState("");

  const [types, setTypes] = useState<
    {
      partOfSpeech: string;
      meanings: string;
    }[]
  >([
    {
      partOfSpeech: "",
      meanings: "",
    },
  ]);


  useEffect(() => {
    const savedBooks = localStorage.getItem("wordnest-books");

    if (!savedBooks) return;

    const books: Book[] = JSON.parse(savedBooks);

    const id = window.location.pathname.split("/").pop();

    const foundBook = books.find(
      (item) => item.id === id
    );

    if (foundBook) {
  foundBook.words = foundBook.words.map((word) => ({
    ...word,
    favorite: word.favorite ?? false,
  }));

  setBook(foundBook);
}
  }, []);
function addType() {
  setTypes([
    ...types,
    {
      partOfSpeech: "",
      meanings: "",
    },
  ]);
}
function removeType(index: number) {
  if (types.length <= 1) return;

  setTypes(
    types.filter((_, typeIndex) => typeIndex !== index)
  );
}
function editWord(word: Word) {
  setEditingId(word.id);

  setEnglish(word.english);

  setTypes(
    word.types.map((type) => ({
      partOfSpeech: type.partOfSpeech,
      meanings: type.meanings.join("\n"),
    }))
  );

  setShowForm(true);
}
function toggleFavorite(wordId: string) {
  if (!book) return;

  const savedBooks = localStorage.getItem(
    "wordnest-books"
  );

  if (!savedBooks) return;

  const books: Book[] = JSON.parse(savedBooks);

  const updatedBooks = books.map((item) => {
    if (item.id === book.id) {
      return {
        ...item,
        words: item.words.map((word) =>
          word.id === wordId
            ? {
                ...word,
                favorite: !word.favorite,
              }
            : word
        ),
      };
    }

    return item;
  });


  localStorage.setItem(
    "wordnest-books",
    JSON.stringify(updatedBooks)
  );


  setBook({
    ...book,
    words: book.words.map((word) =>
      word.id === wordId
        ? {
            ...word,
            favorite: !word.favorite,
          }
        : word
    ),
  });
}
function deleteWord(wordId: string) {
  if (!book) return;

  const savedBooks = localStorage.getItem(
    "wordnest-books"
  );

  if (!savedBooks) return;

  const books: Book[] = JSON.parse(savedBooks);

  const updatedBooks = books.map((item) => {
    if (item.id === book.id) {
      return {
        ...item,
        words: item.words.filter(
          (word) => word.id !== wordId
        ),
      };
    }

    return item;
  });

  localStorage.setItem(
    "wordnest-books",
    JSON.stringify(updatedBooks)
  );

  setBook({
    ...book,
    words: book.words.filter(
      (word) => word.id !== wordId
    ),
  });
}
  function saveWord() {
  if (!book) return;

  if (
    !english.trim() ||
    types.some(
      (type) =>
        !type.partOfSpeech.trim() ||
        !type.meanings.trim()
    )
  ) {
    return;
  }

  const newWord: Word = {
    id: editingId || crypto.randomUUID(),
    english: english.trim(),
    types: types.map((type) => ({
      partOfSpeech: type.partOfSpeech.trim(),
      meanings: type.meanings
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item !== ""),
    })),
    favorite: editingId
      ? book.words.find(
          (word) => word.id === editingId
        )?.favorite ?? false
      : false,
      aiSentences: editingId
  ? book.words.find((word) => word.id === editingId)?.aiSentences ?? []
  : [],
  };
  

  const savedBooks = localStorage.getItem(
    "wordnest-books"
  );

  if (!savedBooks) return;

  const books: Book[] = JSON.parse(savedBooks);

  const updatedBooks = books.map((item) => {
    if (item.id !== book.id) {
      return item;
    }

    return {
      ...item,
      words: editingId
        ? item.words.map((word) =>
            word.id === editingId
              ? newWord
              : word
          )
        : [...item.words, newWord],
    };
  });

  localStorage.setItem(
    "wordnest-books",
    JSON.stringify(updatedBooks)
  );

  setBook({
    ...book,
    words: editingId
      ? book.words.map((word) =>
          word.id === editingId
            ? newWord
            : word
        )
      : [...book.words, newWord],
  });

  setEnglish("");
  setTypes([
    {
      partOfSpeech: "",
      meanings: "",
    },
  ]);
  setEditingId(null);
  setShowForm(false);
}
async function generateAiForWord(word: Word) {
  if (!book) return;

  try {
    const meanings: string[] = [];

    word.types.forEach((type) => {
      meanings.push(...type.meanings);
    });

    const result = await generateSentences(
      word.english,
      meanings
    );

    const aiSentences: Sentence[] = JSON.parse(result);

    if (
      !Array.isArray(aiSentences) ||
      aiSentences.length === 0
    ) {
      throw new Error(`AI 回傳內容不完整：${result}`);
    }

    const updatedBook = {
      ...book,
      words: book.words.map((item) =>
        item.id === word.id
          ? {
              ...item,
              aiSentences,
            }
          : item
      ),
    };

    const savedBooks: Book[] = JSON.parse(
      localStorage.getItem("wordnest-books") || "[]"
    );

    const updatedBooks = savedBooks.map((item) =>
      item.id === book.id ? updatedBook : item
    );

    localStorage.setItem(
      "wordnest-books",
      JSON.stringify(updatedBooks)
    );

    setBook(updatedBook);

    alert(`✅ ${word.english} 的 AI 題庫建立完成！`);
  } catch (error) {
    console.error("建立 AI 題庫失敗：", error);

    const message =
      error instanceof Error
        ? error.message
        : "發生未知錯誤";

    alert(`建立 AI 題庫失敗：${message}`);
  }
}
async function generateAllAiSentences() {
     alert("generateAllAiSentences 開始");
  if (!book) return;
setIsGeneratingAll(true);
setCurrentWord("");
setProgress(0);
setTotal(book.words.length);
  let updatedBook = { ...book };
  let created = 0;
  let skipped = 0;

  let index = 0;

for (const word of updatedBook.words) {
  index++;

  setCurrentWord(word.english);
  setProgress(index);
    // 已有 AI 題庫就跳過
    if (word.aiSentences && word.aiSentences.length > 0) {
  skipped++;
  continue;
}

    try {
      const meanings: string[] = [];

      word.types.forEach((type) => {
        meanings.push(...type.meanings);
      });

      const result = await generateSentences(
        word.english,
        meanings
      );

      const aiSentences: Sentence[] =
        JSON.parse(result);

      if (!Array.isArray(aiSentences) || aiSentences.length === 0) {
        continue;
      }

      word.aiSentences = aiSentences;
      created++;
    } catch {
      // 失敗就跳過下一個
      continue;
    }
  }

  const savedBooks: Book[] = JSON.parse(
    localStorage.getItem("wordnest-books") || "[]"
  );

  const updatedBooks = savedBooks.map((item) =>
    item.id === updatedBook.id ? updatedBook : item
  );

  localStorage.setItem(
    "wordnest-books",
    JSON.stringify(updatedBooks)
  );

  setBook({ ...updatedBook });
setCurrentWord("");
setIsGeneratingAll(false);
  alert(
  `✅ AI 題庫檢查完成！\n新建立：${created} 個\n原本已有題庫：${skipped} 個`
);
}
function clearAllAiSentences() {
  if (!book) return;

  const ok = confirm(
    "確定要清空全部 AI 題庫嗎？\n\n教材、單字、收藏都會保留，只會刪除 AI 題庫。"
  );

  if (!ok) return;

  const updatedBook = {
    ...book,
    words: book.words.map((word) => ({
      ...word,
      aiSentences: [],
    })),
  };

  const savedBooks: Book[] = JSON.parse(
    localStorage.getItem("wordnest-books") || "[]"
  );

  const updatedBooks = savedBooks.map((item) =>
    item.id === updatedBook.id
      ? updatedBook
      : item
  );

  localStorage.setItem(
    "wordnest-books",
    JSON.stringify(updatedBooks)
  );

  setBook(updatedBook);

  alert("✅ 已清空全部 AI 題庫");
}
  if (!book) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8">
          載入中...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">

      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">
<button
  onClick={() => window.history.back()}
  className="mb-4 text-blue-600 hover:underline"
>
  ← 回教材列表
</button>
        <h1 className="mb-2 text-3xl font-bold">
          📚 {book.name}
        </h1>

        <p className="mb-6 text-gray-500">
          目前有 {book.words.length} 個單字
        </p>
        <OcrImporter
  book={book}
  setBook={setBook}
/>
{isGeneratingAll && (
  <div className="mb-6 rounded-2xl border bg-white p-4">
    <p className="font-semibold text-slate-700">
      🤖 正在建立 AI 題庫
    </p>

    <p className="mt-2 text-sm text-slate-500">
      {currentWord}
    </p>

    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-green-500 transition-all"
        style={{
          width: `${(progress / Math.max(total, 1)) * 100}%`,
        }}
      />
    </div>

    <p className="mt-2 text-right text-sm text-slate-600">
      {progress} / {total}
    </p>
  </div>
)}
        <button
  onClick={generateAllAiSentences}
  disabled={isGeneratingAll}
  className="mb-6 w-full rounded-xl bg-green-600 py-3 text-white disabled:opacity-50"
>
  🤖 一鍵建立全部 AI 題庫
</button>
<button
  onClick={clearAllAiSentences}
  className="mb-6 w-full rounded-xl bg-red-600 py-3 text-white"
>
  🗑 清空全部 AI 題庫
</button>

        <div className="mb-6 space-y-4">
          {book.words.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-slate-500">
                這本教材目前還沒有單字
              </p>
            </div>
          ) : (
            book.words.map((word) => (
              <WordCard
                key={word.id}
                word={word}
                onToggleFavorite={toggleFavorite}
                onEdit={editWord}
                onDelete={deleteWord}
                onGenerateAI={generateAiForWord}
              />
            ))
          )}
        </div>


        {showForm && (
          <div className="mb-6 space-y-3">

            <input
              className="w-full rounded-xl border p-3"
              placeholder="英文"
              value={english}
              onChange={(e) =>
                setEnglish(e.target.value)
              }
            />

            {types.map((type, index) => (
  <div
    key={index}
    className="space-y-3 rounded-xl border p-3"
  >
    <input
      className="w-full rounded-xl border p-3"
      placeholder="詞性，例如 vt."
      value={type.partOfSpeech}
      onChange={(e) => {
        const newTypes = [...types];

        newTypes[index] = {
          ...newTypes[index],
          partOfSpeech: e.target.value,
        };

        setTypes(newTypes);
      }}
    />

    <textarea
      className="w-full rounded-xl border p-3"
      placeholder="中文意思（一行一個）"
      value={type.meanings}
      onChange={(e) => {
        const newTypes = [...types];

        newTypes[index] = {
          ...newTypes[index],
          meanings: e.target.value,
        };

        setTypes(newTypes);
      }}
    />

    {types.length > 1 && (
      <button
        type="button"
        onClick={() => removeType(index)}
        className="w-full rounded-lg border border-red-200 py-2 text-sm text-red-500 hover:bg-red-50"
      >
        🗑️ 刪除此詞性
      </button>
    )}
  </div>
))}


<button
  onClick={addType}
  className="w-full rounded-xl border py-3"
>
  ＋ 新增詞性
</button>

            <button
              onClick={saveWord}
              className="w-full rounded-xl bg-blue-600 py-3 text-white"
            >
              儲存單字
            </button>

          </div>
        )}


        <button
          onClick={() =>
            setShowForm(!showForm)
          }
          className="w-full rounded-2xl bg-blue-600 py-4 font-semibold text-white"
        >
          ＋ 新增單字
        </button>


      </div>

    </main>
  );
}
        