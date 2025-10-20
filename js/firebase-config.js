import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyAwDP21GlYLtYsfhA8rfWLhdYM3La08m4k",
  authDomain: "eduhub-51682.firebaseapp.com",
  projectId: "eduhub-51682",
  storageBucket: "eduhub-51682.appspot.com",
  messagingSenderId: "478655559211",
  appId: "1:478655559211:web:1baaf63e46e75964fb1c6e",
  measurementId: "G-N6H8TQH6QX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
