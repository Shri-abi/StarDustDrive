import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDk0xWrvSdrIV9BUM2Y0E6_9tfRG-iRVWo",
  authDomain: "stardustdrive-dfbfe.firebaseapp.com",
  projectId: "stardustdrive-dfbfe",
  storageBucket: "stardustdrive-dfbfe.firebasestorage.app",
  messagingSenderId: "1001042312857",
  appId: "1:1001042312857:web:4d6ce51d8ce7bc62898208",
  measurementId: "G-ZLSNQNHWEN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, collection, addDoc };