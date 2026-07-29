"use client";
import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <h1 className="text-4xl font-bold text-center">
          🌱 WordNest
        </h1>

        <p className="mt-3 mb-8 text-center text-gray-500">
          我的英文單字小窩
        </p>

        <div className="mb-6 rounded-2xl bg-blue-50 p-5">
          <h2 className="text-lg font-semibold">
            📚 今日複習
          </h2>

          <p className="mt-2 text-gray-500">
            尚未建立教材
          </p>
        </div>

        <div className="space-y-4">

          <button
  onClick={() => {
    window.location.href = "/practice";
  }}
  className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white"
>
  ▶ 開始練習
</button>
          <Link
  href="/library"
  className="block w-full rounded-2xl border py-4 text-center text-lg"
>
  📖 我的教材
</Link>

          <Link
  href="/favorite"
  className="mt-4 block w-full rounded-2xl border py-4 text-center font-semibold"
>
  ⭐ 收藏單字
</Link>

          <button className="w-full rounded-2xl border py-4 text-lg">
            ❌ 錯題
          </button>

          <button className="w-full rounded-2xl border py-4 text-lg">
            ⚙️ 設定
          </button>

        </div>

      </div>
    </main>
  );
}