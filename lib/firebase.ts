import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCZyjCkZCSfZTi9puaSf1hbicN08jNbmOk",
  authDomain: "paket-track.firebaseapp.com",
  projectId: "paket-track",
  storageBucket: "paket-track.appspot.com",
  messagingSenderId: "133120311842",
  appId: "1:133120311842:web:bad3bb1b5c20605ae6007b",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
