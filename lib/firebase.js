// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIuDe7pmf0TRgHOXL3fg50dZNhhh3J_kE",
  authDomain: "trackmycash-41c66.firebaseapp.com",
  projectId: "trackmycash-41c66",
  storageBucket: "trackmycash-41c66.firebasestorage.app",
  messagingSenderId: "311791964852",
  appId: "1:311791964852:web:f3874f8b8333f52081fde1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
