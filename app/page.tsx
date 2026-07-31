"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createUserIfNotExists } from "@/lib/userService";
import { uploadLocalBooksToCloud } from "@/lib/bookService";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";

import {
  auth,
  googleProvider,
} from "@/lib/firebase";
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    }
  );

  return unsubscribe;
}, []);

async function handleGoogleLogin() {
  try {
    const result = await signInWithPopup(
      auth,
      googleProvider
    );

    const loggedInUser = result.user;

    console.log("UID:", loggedInUser.uid);
console.log("Email:", loggedInUser.email);
console.log("Current User:", auth.currentUser);

    await createUserIfNotExists(
      loggedInUser.uid,
      loggedInUser.displayName ?? "WordNest 使用者",
      loggedInUser.email ?? ""
    );

  await uploadLocalBooksToCloud();

    setUser(loggedInUser);
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert("登入失敗");
    }
  }
}
async function handleLogout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
    alert("登出失敗");
  }
}
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

        <h1 className="text-4xl font-bold text-center">
          🌱 WordNest
        </h1>

        <p className="mt-3 mb-8 text-center text-gray-500">
          我的英文單字小窩
        </p>
        <div className="mb-6 flex justify-center">
  {authLoading ? (
  <div className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-600">
    正在確認登入狀態...
  </div>
) : user ? (
  <div className="flex items-center gap-3">
    <div className="rounded-xl bg-green-100 px-4 py-2 text-sm">
      👋 {user.displayName}
    </div>

    <button
      onClick={handleLogout}
      className="rounded-xl bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
    >
      登出
    </button>
  </div>
) : (
  <button
    onClick={handleGoogleLogin}
    className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
  >
    使用 Google 登入
  </button>
)}
</div>

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