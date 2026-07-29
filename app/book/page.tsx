"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BookPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [book, setBook] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("books");

    if (!data || !id) return;

    const books = JSON.parse(data);

    const target = books.find(
      (item: any) => item.id === id
    );

    setBook(target);
  }, [id]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <h1 className="text-3xl font-bold">
          📖 {book ? book.name : "教材"}
        </h1>

        <p className="mt-4 text-gray-500">
          {book ? book.words.length : 0} 個單字
        </p>

        <button className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-white">
          ＋ 新增單字
        </button>

      </div>
    </main>
  );
}