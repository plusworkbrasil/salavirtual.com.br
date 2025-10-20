import { db, storage } from './firebase-config.js';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';



function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const RoomService = {
  async createRoom(professorNome) {
    const codigo = generateRoomCode();
    const roomRef = doc(db, 'salas', codigo);

    await setDoc(roomRef, {
      codigo,
      professorNome,
      alunosConectados: [],
      criadaEm: serverTimestamp(),
      ativa: true
    });

    return codigo;
  },

  async getRoom(codigo) {
    const roomRef = doc(db, 'salas', codigo);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      return { id: roomSnap.id, ...roomSnap.data() };
    }
    return null;
  },

  listenToRoom(codigo, callback) {
    const roomRef = doc(db, 'salas', codigo);
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  },

  async updateRoom(codigo, data) {
    const roomRef = doc(db, 'salas', codigo);
    await updateDoc(roomRef, data);
  },

  async addStudentToRoom(codigoSala, alunoId, alunoNome) {
    const roomRef = doc(db, 'salas', codigoSala);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      const alunosConectados = roomSnap.data().alunosConectados || [];
      if (!alunosConectados.find(a => a.id === alunoId)) {
        alunosConectados.push({ id: alunoId, nome: alunoNome, conectadoEm: new Date().toISOString() });
        await updateDoc(roomRef, { alunosConectados });
      }
    }
  },

  listenToStudents(codigoSala, callback) {
    const roomRef = doc(db, 'salas', codigoSala);
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data().alunosConectados || []);
      }
    });
  }
};

export const StudentService = {
  async createStudent(codigoSala, nome) {
    const studentRef = await addDoc(collection(db, 'alunos'), {
      codigoSala,
      nome,
      presenca: false,
      maoLevantada: false,
      fotoPresenca: null,
      criadoEm: serverTimestamp()
    });

    await RoomService.addStudentToRoom(codigoSala, studentRef.id, nome);

    return studentRef.id;
  },

  async getStudent(studentId) {
    const studentRef = doc(db, 'alunos', studentId);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      return { id: studentSnap.id, ...studentSnap.data() };
    }
    return null;
  },

  async updateStudent(studentId, data) {
    const studentRef = doc(db, 'alunos', studentId);
    await updateDoc(studentRef, data);
  },

  async raiseHand(studentId, levantada) {
    await this.updateStudent(studentId, {
      maoLevantada: levantada,
      maoLevantadaEm: levantada ? serverTimestamp() : null
    });
  },

  listenToStudent(studentId, callback) {
    const studentRef = doc(db, 'alunos', studentId);
    return onSnapshot(studentRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  },

  listenToStudentsInRoom(codigoSala, callback) {
    const q = query(collection(db, 'alunos'), where('codigoSala', '==', codigoSala));
    return onSnapshot(q, (snapshot) => {
      const students = [];
      snapshot.forEach((doc) => {
        students.push({ id: doc.id, ...doc.data() });
      });
      callback(students);
    });
  },

  listenToRaisedHands(codigoSala, callback) {
    const q = query(
      collection(db, 'alunos'),
      where('codigoSala', '==', codigoSala),
      where('maoLevantada', '==', true)
    );
    return onSnapshot(q, (snapshot) => {
      const raisedHands = [];
      snapshot.forEach((doc) => {
        raisedHands.push({ id: doc.id, ...doc.data() });
      });
      callback(raisedHands);
    });
  }
};



