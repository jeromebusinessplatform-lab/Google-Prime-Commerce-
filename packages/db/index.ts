import { env } from "../config/env.js";
import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, 
  getDocs, query, where, limit as fLimit, addDoc, writeBatch, orderBy
} from "firebase/firestore";

let databaseId = undefined;
let firebaseConfig = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    databaseId = (firebaseConfig as any).firestoreDatabaseId;
  }
} catch (e) {
  console.error("Failed to read firebase config", e);
}

const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app, databaseId);

class ClientSDKQuery {
  constructor(private q: any) {}
  
  where(field: string, op: any, val: any) {
    return new ClientSDKQuery(query(this.q, where(field, op, val)));
  }
  
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return new ClientSDKQuery(query(this.q, orderBy(field, direction)));
  }
  
  limit(n: number) {
    return new ClientSDKQuery(query(this.q, fLimit(n)));
  }
  
  async get() {
    const snapshot = await getDocs(this.q);
    return {
      empty: snapshot.empty,
      docs: snapshot.docs.map(d => ({
        id: d.id,
        exists: d.exists(),
        data: () => d.data(),
        ref: d.ref
      }))
    };
  }
}

class ClientSDKCollection {
  constructor(private collPath: string) {}

  doc(id?: string) {
    const ref = id ? doc(firestoreDb, this.collPath, id) : doc(collection(firestoreDb, this.collPath));
    const docId = ref.id;
    return {
      id: docId,
      set: async (data: any, options?: any) => {
        await setDoc(ref, data, options || {});
      },
      get: async () => {
        const snap = await getDoc(ref);
        return {
          id: snap.id,
          exists: snap.exists(),
          data: () => snap.data()
        };
      },
      update: async (data: any) => {
        await updateDoc(ref, data);
      },
      delete: async () => {
        await deleteDoc(ref);
      },
      ref 
    };
  }

  async add(data: any) {
    const ref = await addDoc(collection(firestoreDb, this.collPath), data);
    return this.doc(ref.id);
  }

  where(field: string, op: any, val: any) {
    return new ClientSDKQuery(collection(firestoreDb, this.collPath)).where(field, op, val);
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return new ClientSDKQuery(collection(firestoreDb, this.collPath)).orderBy(field, direction);
  }
  
  limit(n: number) {
    return new ClientSDKQuery(collection(firestoreDb, this.collPath)).limit(n);
  }

  async get() {
    return new ClientSDKQuery(collection(firestoreDb, this.collPath)).get();
  }
}

class ClientSDKFirestore {
  collection(path: string) {
    return new ClientSDKCollection(path);
  }

  batch() {
    const b = writeBatch(firestoreDb);
    return {
      set: (wrapper: any, data: any, options?: any) => {
        const ref = wrapper?.ref || wrapper;
        if (!ref) throw new Error("Invalid reference passed to batch.set");
        b.set(ref, data, options || {});
      },
      update: (wrapper: any, data: any) => {
        const ref = wrapper?.ref || wrapper;
        if (!ref) throw new Error("Invalid reference passed to batch.update");
        b.update(ref, data);
      },
      commit: async () => b.commit()
    };
  }
}

export const db = new ClientSDKFirestore();
export const storage = null;

