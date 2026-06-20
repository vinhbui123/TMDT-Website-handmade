// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBUy15qD4CMBC4T2bmCJLgKxEX_VzrYH-4",
    authDomain: "tmdt-309f2.firebaseapp.com",
    projectId: "tmdt-309f2",
    storageBucket: "tmdt-309f2.firebasestorage.app",
    messagingSenderId: "64149678851",
    appId: "1:64149678851:web:01e4420755a6c40ebb9736",
    measurementId: "G-FFSWT5ZW7W"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
