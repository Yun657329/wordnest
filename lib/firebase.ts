import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvJCf9BU7Y8CRCbd8R8k7W1ePEJH25CzY",
  authDomain: "wordnest-b4f0e.firebaseapp.com",
  projectId: "wordnest-b4f0e",
  storageBucket: "wordnest-b4f0e.firebasestorage.app",
  messagingSenderId: "229713081356",
  appId: "1:229713081356:web:b39051a42a849852406a29",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);

