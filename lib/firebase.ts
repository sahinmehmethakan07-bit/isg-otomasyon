import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDCCKqJLR7V_VN9n4NPM5_ZlPlc-O1alAk",
  authDomain: "isg-otomasyon.firebaseapp.com",
  projectId: "isg-otomasyon",
  storageBucket: "isg-otomasyon.firebasestorage.app",
  messagingSenderId: "664404617229",
  appId: "1:664404617229:web:12cba547e7cbebf46b4d44",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
