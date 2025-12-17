import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE (Extraída de tu captura) ---
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
// Está activado (true). La app se conectará automáticamente.
export const USE_CLOUD_DB = true; 

let app;
let db: any;

if (USE_CLOUD_DB) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("✅ Conectado a Firebase Cloud (Proyecto: sig-360)");
  } catch (error) {
    console.error("❌ Error conectando a Firebase.", error);
  }
} else {
  console.log("⚠️ Modo LocalStorage activo (Sin nube).");
}

export { db };