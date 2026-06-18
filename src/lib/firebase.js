import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDutcI-zmPVi1_gNxnH8O-eX1ae0IYXW_s",
  authDomain: "bludwear-c03c1.firebaseapp.com",
  projectId: "bludwear-c03c1",
  storageBucket: "bludwear-c03c1.firebasestorage.app",
  messagingSenderId: "249412629790",
  appId: "1:249412629790:web:9521a4827744ed3aa7050f",
  measurementId: "G-SZZPL982E0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
