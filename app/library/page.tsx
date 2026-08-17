"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBookFromCloud,
  getBooks,
  getBooksFromCloud,
  saveBooks,
  saveBooksToCloud,
  getFoldersFromCloud,
saveFoldersToCloud,
} from "@/lib/bookService";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";



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
  order: number;

  folderId?: string;
}
interface Folder {
  id: string;
  name: string;
  order: number;
}
function SortableBook({
  book,
  children,
  manageMode,
}: {
  book: Book;
  children: React.ReactNode;
  manageMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: book.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative"
    >
      {!manageMode && (
  <button
    type="button"
    {...attributes}
    {...listeners}
    className="absolute left-3 top-4 z-10 cursor-grab touch-none text-slate-400 active:cursor-grabbing"
    aria-label={`拖曳 ${book.name}`}
    title="拖曳排序"
  >
    ⋮⋮
  </button>
)}

      {children}
    </div>
  );
}
export default function LibraryPage() {
    const router = useRouter();
  const [books, setBooks] = useState<any[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoaded, setFoldersLoaded] = useState(false);
const [folderName, setFolderName] = useState("");
  const [highlightedBookId, setHighlightedBookId] = useState<string | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
const [editingBookName, setEditingBookName] = useState("");
  const [selectedBook, setSelectedBook] = useState<any>(null);
const [english, setEnglish] = useState("");
const [partOfSpeech, setPartOfSpeech] = useState("");
const [meaning, setMeaning] = useState("");
const [showAddWord, setShowAddWord] = useState(false);
const [selectedFolderId, setSelectedFolderId] =
  useState<string | null>(null);
  const [manageMode, setManageMode] = useState(false);
const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
const [showMoveDialog, setShowMoveDialog] = useState(false);
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  }),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  })
);
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      if (!user) {
        setIsLoggedIn(false);
        setBooks([]);

        const localFolderText =
          localStorage.getItem("wordnest-folders");

        if (localFolderText) {
          try {
            setFolders(JSON.parse(localFolderText));
          } catch {
            setFolders([]);
          }
        } else {
          setFolders([]);
        }

        setFoldersLoaded(true);
        setHasLoaded(true);
        return;
      }

      setIsLoggedIn(true);

      // 讀取教材
      const cloudBooks =
        await getBooksFromCloud<Book>();

      if (cloudBooks.length > 0) {
        setBooks(cloudBooks);
      } else {
        setBooks(getBooks<Book>());
      }

      // 讀取這台裝置原本的資料夾
      const localFolderText =
        localStorage.getItem("wordnest-folders");

      let localFolders: Folder[] = [];

      if (localFolderText) {
        try {
          localFolders =
            JSON.parse(localFolderText);
        } catch {
          localFolders = [];
        }
      }

      // 讀取 Firebase 資料夾
      const cloudFolders =
        await getFoldersFromCloud<Folder>();

      if (cloudFolders.length > 0) {
        // Firebase 已有資料，以 Firebase 為準
        setFolders(cloudFolders);

        localStorage.setItem(
          "wordnest-folders",
          JSON.stringify(cloudFolders)
        );
      } else if (localFolders.length > 0) {
        // Firebase 還沒有資料，
        // 第一次把這台裝置現有資料夾上傳
        setFolders(localFolders);

        await saveFoldersToCloud(
          localFolders
        );
      } else {
        setFolders([]);
      }

      setFoldersLoaded(true);
      setHasLoaded(true);
    }
  );

  return unsubscribe;
}, []);

useEffect(() => {
  if (!foldersLoaded) return;

  localStorage.setItem(
    "wordnest-folders",
    JSON.stringify(folders)
  );

  if (auth.currentUser) {
    saveFoldersToCloud(folders).catch(
      (error) => {
        console.error(
          "資料夾同步失敗：",
          error
        );
      }
    );
  }
}, [folders, foldersLoaded]);
  useEffect(() => {
  if (!hasLoaded) return;

  saveBooks(books);
}, [books, hasLoaded]);

  async function addBook() {
  if (!name.trim()) return;

  const newBook: Book = {
  id: crypto.randomUUID(),
  name: name.trim(),
  words: [],
  order: 0,
  folderId: selectedFolderId ?? undefined,
};

  const updatedBooks = [newBook, ...books].map(
    (book, index) => ({
      ...book,
      order: index,
    })
  );

  setBooks(updatedBooks);

  saveBooks(updatedBooks);

  try {
    await saveBooksToCloud(updatedBooks);
  } catch (error) {
    console.error("新增教材同步失敗：", error);
  }

  setName("");
}
function addFolder() {
  if (!folderName.trim()) return;

  const newFolder: Folder = {
    id: crypto.randomUUID(),
    name: folderName.trim(),
    order: 0,
  };

  const updatedFolders = [
    newFolder,
    ...folders,
  ].map((folder, index) => ({
    ...folder,
    order: index,
  }));

  setFolders(updatedFolders);

setFolderName("");
}
function deleteFolder(folderId: string) {
  const hasBooks = books.some(
    (book) => book.folderId === folderId
  );

  if (hasBooks) {
    alert("請先將資料夾內的教材移出，再刪除資料夾。");
    return;
  }

  const updatedFolders = folders.filter(
    (folder) => folder.id !== folderId
  );

  setFolders(updatedFolders);
}
async function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const oldIndex = books.findIndex(
    (book) => book.id === active.id
  );

  const newIndex = books.findIndex(
    (book) => book.id === over.id
  );

  if (oldIndex === -1 || newIndex === -1) return;

  const reorderedBooks = arrayMove(
  books,
  oldIndex,
  newIndex
).map((book, index) => ({
  ...book,
  order: index,
}));

  setBooks(reorderedBooks);

  saveBooks(reorderedBooks);

  try {
    await saveBooksToCloud(reorderedBooks);
  } catch (error) {
    console.error("教材順序同步失敗：", error);
  }
}
  async function deleteBook(id: string) {
  const updatedBooks = books.filter(
    (book) => book.id !== id
  );

  setBooks(updatedBooks);

  await deleteBookFromCloud(id);
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
async function moveSelectedBooks(folderId?: string) {
  const updatedBooks = books.map((book) => {
    if (!selectedBookIds.includes(book.id)) {
      return book;
    }

    return {
      ...book,
      folderId,
    };
  });

  setBooks(updatedBooks);

  saveBooks(updatedBooks);

  try {
    await saveBooksToCloud(updatedBooks);
  } catch (error) {
    console.error(error);
  }

  localStorage.setItem(
    "wordnest-books",
    JSON.stringify(updatedBooks)
  );

  setSelectedBookIds([]);
  setManageMode(false);
  setShowMoveDialog(false);
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

<div className="mb-4 flex items-center justify-between">
  <h1 className="text-3xl font-bold">
    📚 我的教材
  </h1>

  <button
    onClick={() => {
      if (manageMode) {
        setSelectedBookIds([]);
      }
      setManageMode(!manageMode);
    }}
    className="rounded-xl bg-slate-100 px-4 py-2"
  >
    {manageMode ? "取消" : "管理"}
  </button>
</div>
{selectedFolderId && (
  <button
    onClick={() => setSelectedFolderId(null)}
    className="mb-4 rounded-lg bg-slate-100 px-4 py-2"
  >
    ← 返回全部教材
  </button>
)}
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
        <div className="mb-6 flex gap-2">
  <input
    className="flex-1 rounded-xl border px-4 py-3"
    placeholder="例如：字根字首"
    value={folderName}
    onChange={(e) => setFolderName(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        addFolder();
      }
    }}
  />

  <button
    onClick={addFolder}
    className="rounded-xl bg-amber-500 px-5 text-white"
  >
    新增資料夾
  </button>
</div>
        <div className="mb-6">
  <input
    type="text"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="🔍 搜尋教材..."
    className="w-full rounded-xl border px-4 py-3"
  />
</div>

{manageMode && (
  <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
    已選取 {selectedBookIds.length} 本教材
  </div>
)}
{manageMode && selectedBookIds.length > 0 && (
  <div className="mb-6 flex gap-3">
    <button
      onClick={() => setShowMoveDialog(true)}
      className="rounded-xl bg-amber-500 px-5 py-2 text-white"
    >
      📁 移入資料夾
    </button>
  </div>
)}

{folders.length > 0 && (
  <div className="mb-6 space-y-3">
    {folders.map((folder) => (
  <div
  key={folder.id}
  onClick={() => {
    setSelectedFolderId(folder.id);
    router.push(`/library/folder/${folder.id}`);
  }}
  className="cursor-pointer rounded-2xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100"
>
        <div className="flex items-center justify-between">

  <div className="flex items-center gap-2">
    <span className="text-xl">📁</span>

    <h2 className="font-semibold">
      {folder.name}
    </h2>
  </div>

  <button
    onClick={(e) => {
      e.stopPropagation();
      deleteFolder(folder.id);
    }}
    className="text-red-500 hover:text-red-700"
  >
    刪除
  </button>

</div>

        <p className="mt-1 text-sm text-slate-500">
  {
    books.filter(
      (book) => book.folderId === folder.id
    ).length
  } 本教材
</p>
      </div>
    ))}
  </div>
)}
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
  <div className="text-center py-10">
    {isLoggedIn ? (
      <p className="text-gray-500">
        尚未建立教材
      </p>
    ) : (
      <p className="text-gray-500">
        請先登入 Google 後查看教材
      </p>
    )}
  </div>
) : (
  
          <DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext
    items={books.map((book) => book.id)}
    strategy={verticalListSortingStrategy}
  >
    <div className="space-y-4">
      {books
  .filter((book) => !book.folderId)
  .map((book) => (
        <SortableBook
  key={book.id}
  book={book}
  manageMode={manageMode}
>
  <div
  id={`book-${book.id}`}
  className={`rounded-2xl border p-4 transition-all duration-300 ${
    highlightedBookId === book.id
      ? "border-yellow-400 bg-yellow-50 ring-2 ring-yellow-200"
      : ""
  }`}
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
      <div className={`flex items-center justify-between gap-3 ${
  manageMode ? "pl-3" : "pl-10"
}`}>
        <div className="flex items-center gap-2">
  {manageMode && (
    <input
      type="checkbox"
      checked={selectedBookIds.includes(book.id)}
      onChange={(e) => {
        e.stopPropagation();

        if (e.target.checked) {
          setSelectedBookIds((current) => [
            ...current,
            book.id,
          ]);
        } else {
          setSelectedBookIds((current) =>
            current.filter((id) => id !== book.id)
          );
        }
      }}
      className="h-5 w-5"
    />
  )}

  <h2 className="text-lg font-semibold">
    📚 {book.name}
  </h2>
</div>

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
          </SortableBook>
      ))}
    </div>
  </SortableContext>
</DndContext>
        )}

      </div>
      {showMoveDialog && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-80 rounded-2xl bg-white p-6">

      <h2 className="mb-4 text-xl font-bold">
        選擇資料夾
      </h2>

      <button
  onClick={() => moveSelectedBooks(undefined)}
  className="mb-2 w-full rounded-xl border p-3 text-left"
>
  📂 第一層
</button>

      {folders.map((folder) => (
  <button
    key={folder.id}
    onClick={() => moveSelectedBooks(folder.id)}
    className="mb-2 w-full rounded-xl border p-3 text-left"
  >
    📁 {folder.name}
     <p className="mt-2 text-gray-500">
  {
    books.filter(
      (book) => book.folderId === folder.id
    ).length
  }
  本教材
</p>
  </button>
 
))}

      <button
        onClick={() => setShowMoveDialog(false)}
        className="mt-4 w-full rounded-xl bg-gray-200 py-2"
      >
        取消
      </button>

    </div>
  </div>
)}
    </main>
  );
}