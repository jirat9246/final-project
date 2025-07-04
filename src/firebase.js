import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, doc, deleteDoc, collection, addDoc, getDocs , updateDoc  } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// กำหนดค่า Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCPeScxNJz6HKJKtCYGcekEiren9sYU1PY",
  authDomain: "tourism-commerce.firebaseapp.com",
  databaseURL: "https://tourism-commerce-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tourism-commerce",
  storageBucket: "tourism-commerce.appspot.com",
  messagingSenderId: "495053101942",
  appId: "1:495053101942:web:22d942fd38726837be7857"
}

// เริ่มการเชื่อมต่อกับ Firebase
const app = initializeApp(firebaseConfig)

// สร้างอินสแตนซ์สำหรับบริการต่าง ๆ
const db = getFirestore(app)
const auth = getAuth(app)
const rtdb = getDatabase(app)
const storage = getStorage(app)


// การเชื่อมต่อกับ Emulator ในโหมดพัฒนาเท่านั้น
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectDatabaseEmulator(rtdb, 'localhost', 9000)
  connectStorageEmulator(storage, 'localhost', 9199)
  console.log('Connected to Firebase Emulators')
}

// ส่งออกโมดูลต่าง ๆ สำหรับใช้งานในโปรเจค
export { db, auth, rtdb, storage, updateDoc,
  getDocs, collection, addDoc, doc, deleteDoc }
