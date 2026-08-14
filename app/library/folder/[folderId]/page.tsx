"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import BookCard from "@/components/BookCard";
import { auth } from "@/lib/firebase";
import {
  getBooks,
  getBooksFromCloud,
  saveBooks,
  saveBooksToCloud,
} from "@/lib/bookService";

interface Word {
  id: string;
  english: string;
}

interface Book {
  id: string;
  name: string;
  words: Word[];
  order: number;
  folderId?: string;
}

interface Folder {
  id: string;
  name: string;
  order: number;
}

export default function FolderPage() {
  const router = useRouter();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [name, setName] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [manageMode, setManageMode] = useState(false);

const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

const [showMoveDialog, setShowMoveDialog] = useState(false);

  useEffect(() => {
    const folderId =
      window.location.pathname.split("/").pop();

    if (!folderId) return;

    const savedFolders = localStorage.getItem(
      "wordnest-folders"
    );

    if (savedFolders) {
      try {
        const savedFolderList: Folder[] =
  JSON.parse(savedFolders);

setFolders(savedFolderList);

const foundFolder = savedFolderList.find(
  (item) => item.id === folderId
);

if (foundFolder) {
  setFolder(foundFolder);
}
      } catch {
        setFolder(null);
      }
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        let allBooks: Book[] = [];

        if (user) {
          allBooks =
            await getBooksFromCloud<Book>();
        } else {
          allBooks = getBooks<Book>();
        }

        const folderBooks = allBooks
          .filter(
            (book) =>
              book.folderId === folderId
          )
          .sort(
            (a, b) =>
              (a.order ?? 9999) -
              (b.order ?? 9999)
          );

        setBooks(folderBooks);
        setHasLoaded(true);
      }
    );

    return unsubscribe;
  }, []);
async function addBook() {
  const folderId =
    window.location.pathname.split("/").pop();

  if (!folderId) return;
  if (!name.trim()) return;

  const allBooks = getBooks<Book>();

  const newBook: Book = {
    id: crypto.randomUUID(),
    name: name.trim(),
    words: [],
    order: 0,
    folderId: folderId,
  };

  const updatedBooks = [
    newBook,
    ...allBooks,
  ].map((book, index) => ({
    ...book,
    order: index,
  }));

  setBooks(
    updatedBooks.filter(
      (book) => book.folderId === folderId
    )
  );

  saveBooks(updatedBooks);

  try {
    await saveBooksToCloud(updatedBooks);
  } catch (error) {
    console.error("新增教材同步失敗：", error);
  }

  setName("");
}
function toggleBookSelection(bookId: string) {
  setSelectedBookIds((current) =>
    current.includes(bookId)
      ? current.filter((id) => id !== bookId)
      : [...current, bookId]
  );
}
  if (!hasLoaded) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">
          載入中...
        </div>
      </main>
    );
  }
async function moveSelectedBooks(targetFolderId?: string) {
  const allBooks = getBooks<Book>();

  const updatedBooks = allBooks.map((book) => {
    if (!selectedBookIds.includes(book.id)) {
      return book;
    }

    return {
      ...book,
      folderId: targetFolderId,
    };
  });

  saveBooks(updatedBooks);

  try {
    await saveBooksToCloud(updatedBooks);
  } catch (error) {
    console.error("移動教材同步失敗：", error);
  }

  const currentFolderId =
    window.location.pathname.split("/").pop();

  setBooks(
    updatedBooks.filter(
      (book) => book.folderId === currentFolderId
    )
  );

  setSelectedBookIds([]);
  setManageMode(false);
  setShowMoveDialog(false);
}
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <button
          onClick={() => router.push("/library")}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← 回全部教材
        </button>

        <div className="mb-6 flex items-start justify-between">
  <div>
    <h1 className="mb-2 text-3xl font-bold">
      📁 {folder?.name ?? "資料夾"}
    </h1>

    <p className="text-gray-500">
      {books.length} 本教材
    </p>
  </div>

  <button
    onClick={() => setManageMode(!manageMode)}
    className="rounded-xl bg-slate-200 px-4 py-2"
  >
    {manageMode ? "完成" : "管理"}
  </button>
</div>
<div className="mb-6 flex gap-2">
  <input
    className="min-w-0 flex-1 rounded-xl border px-4 py-3"
    placeholder="新增教材..."
    value={name}
    onChange={(e) =>
      setName(e.target.value)
    }
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        addBook();
      }
    }}
  />

  <button
    onClick={addBook}
    className="shrink-0 rounded-xl bg-blue-600 px-5 text-white"
  >
    新增
  </button>
</div>
{manageMode && (
  <div className="mb-4 rounded-xl bg-blue-50 p-4">
    <p>
      已選取 {selectedBookIds.length} 本教材
    </p>

    {selectedBookIds.length > 0 && (
      <button
        onClick={() => setShowMoveDialog(true)}
        className="mt-3 rounded-xl bg-amber-500 px-4 py-2 text-white"
      >
        📁 移動教材
      </button>
    )}
  </div>
)}
        {books.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-500">
              這個資料夾目前沒有教材
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {books.map((book) => (
  <BookCard
    key={book.id}
    book={book}
  >
    {manageMode && (
      <div className="mb-3">
        <input
          type="checkbox"
          checked={selectedBookIds.includes(book.id)}
          onChange={() => toggleBookSelection(book.id)}
          className="h-5 w-5"
        />
      </div>
    )}
  </BookCard>
))}
          </div>
        )}

      </div>
      {showMoveDialog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="mb-4 text-xl font-bold">
        移動教材到
      </h2>

      <button
        onClick={() => moveSelectedBooks(undefined)}
        className="mb-2 w-full rounded-xl border p-3 text-left hover:bg-slate-50"
      >
        📂 第一層
      </button>

      {folders
        .filter((item) => item.id !== folder?.id)
        .map((item) => (
          <button
            key={item.id}
            onClick={() =>
              moveSelectedBooks(item.id)
            }
            className="mb-2 w-full rounded-xl border p-3 text-left hover:bg-slate-50"
          >
            📁 {item.name}
          </button>
        ))}

      <button
        onClick={() =>
          setShowMoveDialog(false)
        }
        className="mt-4 w-full rounded-xl bg-slate-200 py-3"
      >
        取消
      </button>
    </div>
  </div>
)}
    </main>
  );
}