import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function createUserIfNotExists(
  uid: string,
  name: string,
  email: string
) {
  const ref = doc(db, "users", uid);

  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    return;
  }

  await setDoc(ref, {
    name,
    email,
    createdAt: Date.now(),
  });
}