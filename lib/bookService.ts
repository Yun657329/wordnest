import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
const STORAGE_KEY = "wordnest-books";

export function getBooks<T>(): T[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveBooks<T>(books: T[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function getBook<T extends { id: string }>(
  id: string
): T | undefined {
  const books = getBooks<T>();

  return books.find((book) => book.id === id);
}

export function saveBook<T extends { id: string }>(
  updatedBook: T
) {
  const books = getBooks<T>();

  const updatedBooks = books.map((book) =>
    book.id === updatedBook.id ? updatedBook : book
  );

  saveBooks(updatedBooks);
}

export function deleteBook<T extends { id: string }>(
  id: string
) {
  const books = getBooks<T>();

  saveBooks(
    books.filter((book) => book.id !== id)
  );
}
export async function uploadLocalBooksToCloud<
  T extends { id: string }
>(): Promise<number> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("請先登入 Google");
  }

  const books = getBooks<T>();

  for (const book of books) {
    const bookRef = doc(
      collection(db, "users", user.uid, "books"),
      book.id
    );

    await setDoc(bookRef, book);
  }

  return books.length;
}
export async function getBooksFromCloud<T>(): Promise<T[]> {
  const user = auth.currentUser;

  if (!user) {
    return [];
  }

  const snapshot = await getDocs(
    collection(db, "users", user.uid, "books")
  );

  return snapshot.docs.map((doc) => doc.data() as T);
}
export async function saveBookToCloud<T extends { id: string }>(
  book: T
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("請先登入 Google");
  }

  const bookRef = doc(
    collection(db, "users", user.uid, "books"),
    book.id
  );

  await setDoc(bookRef, book);
}
export async function deleteBookFromCloud(bookId: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("請先登入 Google");
  }

  const bookRef = doc(db, "users", user.uid, "books", bookId);

  await deleteDoc(bookRef);
}