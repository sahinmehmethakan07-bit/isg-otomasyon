import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCCKqJLR7V_VN9n4NPM5_ZlPlc-O1alAk",
  authDomain: "isg-otomasyon.firebaseapp.com",
  projectId: "isg-otomasyon",
  storageBucket: "isg-otomasyon.firebasestorage.app",
  messagingSenderId: "664404617229",
  appId: "1:664404617229:web:12cba547e7cbebf46b4d44",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
