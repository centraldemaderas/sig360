import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// --- CONFIGURACIÓN DE FIREBASE ---
// Actualizado con los datos del proyecto sig360-35d17
export const firebaseConfig = {
  apiKey: "AIzaSyAW1PT30nPjdn5SqN2o2TX_O0CXkCFHxwg",
  authDomain: "sig360-35d17.firebaseapp.com",
  projectId: "sig360-35d17",
  storageBucket: "sig360-35d17.firebasestorage.app",
  messagingSenderId: "625926676036",
  appId: "1:625926676036:web:ac1cd4d96b3fe5ec85e611",
  measurementId: "G-P2QLX4QXKQ"
};

// --- ACTIVACIÓN DE NUBE ---
export const USE_CLOUD_DB = true; 

let app;
let db: any;
let auth: any;
let storage: any;

if (USE_CLOUD_DB) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.log(`✅ Conectado a Firebase Cloud: ${firebaseConfig.projectId}`);
  } catch (error) {
    console.error("❌ Error conectando a Firebase.", error);
  }
} else {
  console.log("⚠️ Modo LocalStorage activo (Sin nube).");
}

export { db, auth, storage };