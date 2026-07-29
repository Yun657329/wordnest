"use client";

import { useEffect, useState } from "react";

interface WordType {
  partOfSpeech: string;
  meanings: string[];
}

interface Word {
  id: string;
  english: string;
  types: WordType[];
  favorite: boolean;
  aiSentences?: {id?:string}[];
}

interface Book {
  id: string;
  name: string;
  words: Word[];
}

interface FavoriteWord extends Word {
  bookId: string;
  bookName: string;
}

export default function FavoritePage() {
  const [favoriteWords, setFavoriteWords] = useState<FavoriteWord[]>([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    loadFavorites();
  }, []);

  function loadFavorites() {
    const savedBooks = localStorage.getItem("wordnest-books");

    if (!savedBooks) {
      setFavoriteWords([]);
      return;
    }

    const books: Book[] = JSON.parse(savedBooks);

    const favorites = books.flatMap((book) =>
      book.words
        .filter((word) => word.favorite)
        .map((word) => ({
          ...word,
          bookId: book.id,
          bookName: book.name,
        }))
    );

    setFavoriteWords(favorites);
  }

  function removeFavorite(bookId: string, wordId: string) {
    const savedBooks = localStorage.getItem("wordnest-books");

    if (!savedBooks) return;

    const books: Book[] = JSON.parse(savedBooks);

    const updatedBooks = books.map((book) => {
      if (book.id !== bookId) return book;

      return {
        ...book,
        words: book.words.map((word) =>
          word.id === wordId
            ? {
                ...word,
                favorite: false,
              }
            : word
        ),
      };
    });

    localStorage.setItem(
      "wordnest-books",
      JSON.stringify(updatedBooks)
    );

    loadFavorites();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← 回首頁
        </button>

        <h1 className="text-3xl font-bold">⭐ 收藏單字</h1>

        <p className="mt-2 text-slate-500">
          共收藏 {favoriteWords.length} 個
        </p>

        <input
          value={keyword}
          onChange={(e)=>setKeyword(e.target.value)}
          placeholder="🔍 搜尋英文、中文或詞性..."
          className="mt-5 w-full rounded-xl border p-3"
        />

        {favoriteWords.length === 0 ? (
          <p className="mt-4 text-gray-500">
            目前還沒有收藏的單字
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {favoriteWords
.filter((word)=>{
 const k=keyword.toLowerCase().trim();
 if(!k) return true;
 return word.english.toLowerCase().includes(k)
 || word.types.some(t=>t.partOfSpeech.toLowerCase().includes(k))
 || word.types.some(t=>t.meanings.some(m=>m.includes(keyword)));
})
.map((word) => (
              <div
                key={`${word.bookId}-${word.id}`}
                className="rounded-2xl border p-4"
              >
                <p className="mb-2 text-sm text-gray-500">
                  📚 {word.bookName}
                </p>

                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">⭐ {word.english}</h2>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                    AI：{word.aiSentences?.length ?? 0} 題
                  </span>
                </div>

                {word.types.map((type, typeIndex) => (
                  <div
                    key={typeIndex}
                    className="mt-2"
                  >
                    <p className="text-gray-500">
                      {type.partOfSpeech}
                    </p>

                    {type.meanings.map((meaning, meaningIndex) => (
                      <p key={meaningIndex}>
                        {meaningIndex + 1}. {meaning}
                      </p>
                    ))}
                  </div>
                ))}

                <button
                  onClick={() =>
                    removeFavorite(word.bookId, word.id)
                  }
                  className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm text-white"
                >
                  ★ 取消收藏
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}