import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// const firebaseConfig = {
//   apiKey: "AIzaSyAwDP21GlYLtYsfhA8rfWLhdYM3La08m4k",
//   authDomain: "eduhub-51682.firebaseapp.com",
//   projectId: "eduhub-51682",
//   storageBucket: "eduhub-51682.appspot.com",
//   messagingSenderId: "478655559211",
//   appId: "1:478655559211:web:1baaf63e46e75964fb1c6e",
//   measurementId: "G-N6H8TQH6QX"
// };

const firebaseConfig = {
  apiKey: "AIzaSyAnB-0u26pOsGDFzB-lWMw4fLRoac-W3Xg",
  authDomain: "salavirtual-aa697.firebaseapp.com",
  projectId: "salavirtual-aa697",
  storageBucket: "salavirtual-aa697.firebasestorage.app",
  messagingSenderId: "1004238284597",
  appId: "1:1004238284597:web:69a7343195704b99730e7c",
  measurementId: "G-Y0PK45VG5M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
