import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBesVOVBX1f_swH7ysIDfv4W8gLVkkqY88",
  authDomain: "sig-360.firebaseapp.com",
  projectId: "sig-360",
  storageBucket: "sig-360.firebasestorage.app",
  messagingSenderId: "914792559996",
  appId: "1:914792559996:web:dc34438316f3ff140060f9",
  measurementId: "G-Q1LDXFYEHD"
};

// --- ACTIVACIÓN DE NUBE ---
// CAMBIO IMPORTANTE: Se establece en TRUE para conectar a la base de datos real.
// Ahora que index.html está limpio, esto funcionará correctamente en Netlify.
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
    console.log("✅ Conectado a Firebase Cloud (DB + Storage)");
  } catch (error) {
    console.error("❌ Error conectando a Firebase.", error);
  }
} else {
  console.log("⚠️ Modo LocalStorage activo (Sin nube).");
}

export { db, auth, storage };