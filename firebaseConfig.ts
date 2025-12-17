import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
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

// --- NOMBRE DE LA BASE DE DATOS ---
// Déjalo vacío o '(default)' para la base principal.
// Si quieres usar tu base 'sig360', cambia esto a: "sig360"
export const DATABASE_ID = "(default)"; 

// --- ACTIVACIÓN DE NUBE ---
export const USE_CLOUD_DB = true; 

let app;
let db: any;
let auth: any;
let storage: any;

if (USE_CLOUD_DB) {
  try {
    app = initializeApp(firebaseConfig);
    
    // Inicializamos Firestore apuntando explícitamente a la base de datos configurada
    if (DATABASE_ID && DATABASE_ID !== '(default)') {
       db = initializeFirestore(app, {
         style: 'http', // necesario para bases de datos nombradas en algunas versiones
       }, DATABASE_ID);
    } else {
       db = getFirestore(app);
    }

    auth = getAuth(app);
    storage = getStorage(app);
    console.log(`✅ Conectado a Firebase Cloud: ${firebaseConfig.projectId} [DB: ${DATABASE_ID}]`);
  } catch (error) {
    console.error("❌ Error conectando a Firebase.", error);
  }
} else {
  console.log("⚠️ Modo LocalStorage activo (Sin nube).");
}

export { db, auth, storage };