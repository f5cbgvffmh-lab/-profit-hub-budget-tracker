import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiGgFd11OGN7YBf_M225PAcfx1O4p6qjA",
  authDomain: "profit-metrics.firebaseapp.com",
  projectId: "profit-metrics",
  storageBucket: "profit-metrics.firebasestorage.app",
  messagingSenderId: "32356744021",
  appId: "1:32356744021:web:56a8286010b97b8a6b8ddc",
  measurementId: "G-KXH3PZPCC5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
