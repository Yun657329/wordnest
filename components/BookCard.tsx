"use client";

import { useRouter } from "next/navigation";

interface Word {
  id: string;
}

interface Book {
  id: string;
  name: string;
  words: Word[];
}

interface BookCardProps {
  book: Book;
  children?: React.ReactNode;
}

export default function BookCard({
  book,
  children,
}: BookCardProps) {
const router = useRouter();

  return (
    <div className="rounded-2xl border p-4">

      <h2 className="text-lg font-semibold">
        📚 {book.name}
      </h2>

      <p className="mt-1 text-gray-500">
        {book.words.length} 個單字
      </p>

      {children ?? (
  <button
    onClick={() =>
      router.push(`/library/${book.id}`)
    }
    className="mt-3 block w-full rounded-xl bg-blue-600 py-2 text-white"
  >
    進入教材
  </button>
)}

    </div>
  );
}