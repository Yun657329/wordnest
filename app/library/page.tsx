"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";




interface Word {
  id: string;
  english: string;
  partOfSpeech: string;
  meanings: string[];
  favorite: boolean;
  wrongCount: number;
  correctCount: number;
}

interface Book {
  id: string;
  name: string;
  words: Word[];
}

export default function LibraryPage() {
    const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [name, setName] = useState("");
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
const [editingBookName, setEditingBookName] = useState("");
  const [selectedBook, setSelectedBook] = useState<any>(null);
const [english, setEnglish] = useState("");
const [partOfSpeech, setPartOfSpeech] = useState("");
const [meaning, setMeaning] = useState("");
const [showAddWord, setShowAddWord] = useState(false);
  useEffect(() => {
  const savedBooks = localStorage.getItem("wordnest-books");

  if (savedBooks) {
    try {
      setBooks(JSON.parse(savedBooks));
    } catch {
      setBooks([]);
    }
  }

  setHasLoaded(true);
}, []);

  useEffect(() => {
  if (!hasLoaded) return;

  localStorage.setItem(
    "wordnest-books",
    JSON.stringify(books)
  );
}, [books, hasLoaded]);

  function addBook() {
    if (!name.trim()) return;

    const newBook: Book = {
      id: crypto.randomUUID(),
      name: name.trim(),
      words: [],
    };

    setBooks([...books, newBook]);
    setName("");
  }

  function deleteBook(id: string) {
    setBooks(
      books.filter((book) => book.id !== id)
    );
  }
  function startRenameBook(book: Book) {
  setEditingBookId(book.id);
  setEditingBookName(book.name);
}

function saveBookName() {
  if (!editingBookId) return;
  if (!editingBookName.trim()) return;

  setBooks(
    books.map((book) =>
      book.id === editingBookId
        ? {
            ...book,
            name: editingBookName.trim(),
          }
        : book
    )
  );

  setEditingBookId(null);
  setEditingBookName("");
}

function cancelRenameBook() {
  setEditingBookId(null);
  setEditingBookName("");
}
function addWord() {
  if (!selectedBook) return;

  const newWord = {
    id: Date.now().toString(),
    english,
    partOfSpeech,
    meanings: [meaning],
    favorite: false,
    wrongCount: 0,
    correctCount: 0,
  };

  const updatedBooks = books.map((book) => {
    if (book.id === selectedBook.id) {
      return {
        ...book,
        words: [...book.words, newWord as Word],
      };
    }

    return book;
  });

  setBooks(updatedBooks);

  const updatedBook = updatedBooks.find(
  (book) => book.id === selectedBook.id
);

if (updatedBook !== undefined) {
  setSelectedBook(updatedBook);
}

  setEnglish("");
  setPartOfSpeech("");
  setMeaning("");
}
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <button
  onClick={() => router.push("/")}
  className="mb-4 text-blue-600 hover:underline"
>
  ← 回首頁
</button>

<h1 className="mb-6 text-3xl font-bold">
  📖 我的教材
</h1>

        <div className="mb-6 flex gap-2">
          <input
            className="flex-1 rounded-xl border px-4 py-3"
            placeholder="例如：Week 1"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <button
            onClick={addBook}
            className="rounded-xl bg-blue-600 px-5 text-white"
          >
            新增
          </button>
        </div>

{selectedBook && (
  <div className="mb-6 rounded-2xl bg-blue-50 p-5">
    <h2 className="text-xl font-bold">
      📖 {selectedBook.name}
    </h2>

    <p className="mt-2 text-gray-500">
      {selectedBook.words.length} 個單字
    </p>

    <button
  onClick={() => setShowAddWord(true)}
  className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-white"
>
  ＋ 新增單字
</button>
  </div>
)}
        {books.length === 0 ? (
          <p className="text-gray-500">
            尚未建立教材
          </p>
        ) : (
          <div className="space-y-4">
            {books.map((book) => (
  <div
    key={book.id}
    className="rounded-2xl border p-4"
  >
    {editingBookId === book.id ? (
      <div className="space-y-2">
        <input
          className="w-full rounded-xl border px-3 py-2"
          value={editingBookName}
          onChange={(e) =>
            setEditingBookName(e.target.value)
          }
          autoFocus
        />

        <div className="flex gap-2">
          <button
            onClick={saveBookName}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
          >
            儲存
          </button>

          <button
            onClick={cancelRenameBook}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            取消
          </button>
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          📚 {book.name}
        </h2>

        <button
          onClick={() => startRenameBook(book)}
          className="shrink-0 text-sm text-blue-600 hover:underline"
        >
          ✏️ 重新命名
        </button>
      </div>
    )}

    <p className="mt-1 text-gray-500">
      {book.words.length} 個單字
    </p>

    <button
      onClick={() =>
        router.push(`/library/${book.id}`)
      }
      className="mt-3 block w-full rounded-xl bg-blue-600 py-2 text-center text-white"
    >
      進入教材
    </button>

    <button
      onClick={() => deleteBook(book.id)}
      className="mt-3 text-sm text-red-500"
    >
      刪除
    </button>
  </div>
))}
          </div>
        )}

      </div>
    </main>
  );
}