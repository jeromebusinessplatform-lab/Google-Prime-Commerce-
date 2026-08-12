import { env } from "../config/env.js";
import crypto from "crypto";

// Simple in-memory mock for Preview Mode to avoid requiring Firebase credentials
class MockQuery {
  constructor(public docs: any[]) {}
  where(field: string, op: string, val: any) {
    return new MockQuery(
      this.docs.filter((d) => {
        if (op === "==") return d.data[field] === val;
        return true;
      })
    );
  }
  limit(n: number) {
    return new MockQuery(this.docs.slice(0, n));
  }
  async get() {
    return {
      empty: this.docs.length === 0,
      docs: this.docs.map(d => ({
        id: d.id,
        exists: true,
        data: () => d.data,
      }))
    };
  }
}

class MockCollection {
  public records = new Map<string, any>();
  constructor(public path: string) {}

  doc(id?: string) {
    const docId = id || crypto.randomBytes(10).toString('hex');
    return {
      id: docId,
      set: async (data: any, options?: any) => { 
        if (options?.merge && this.records.has(docId)) {
          this.records.set(docId, { ...this.records.get(docId), ...data });
        } else {
          this.records.set(docId, data);
        }
      },
      get: async () => {
        const exists = this.records.has(docId);
        return {
          id: docId,
          exists,
          data: () => this.records.get(docId)
        };
      },
      update: async (data: any) => {
        if (!this.records.has(docId)) throw new Error("Document not found");
        this.records.set(docId, { ...this.records.get(docId), ...data });
      },
      delete: async () => {
        this.records.delete(docId);
      }
    };
  }

  async add(data: any) {
    const ref = this.doc();
    await ref.set(data);
    return ref;
  }

  where(field: string, op: string, val: any) {
    const allDocs = Array.from(this.records.entries()).map(([id, data]) => ({ id, data }));
    return new MockQuery(allDocs).where(field, op, val);
  }
  
  limit(n: number) {
    const allDocs = Array.from(this.records.entries()).map(([id, data]) => ({ id, data }));
    return new MockQuery(allDocs).limit(n);
  }

  async get() {
    const allDocs = Array.from(this.records.entries()).map(([id, data]) => ({ id, data }));
    return new MockQuery(allDocs).get();
  }
}

class MockFirestore {
  private collections = new Map<string, MockCollection>();
  collection(path: string) {
    if (!this.collections.has(path)) {
      this.collections.set(path, new MockCollection(path));
    }
    return this.collections.get(path)!;
  }
  batch() {
    return {
      set: (ref: any, data: any, options?: any) => ref.set(data, options),
      update: (ref: any, data: any) => ref.update(data),
      commit: async () => {}
    };
  }
}

let firestoreDb: any;
let cloudStorage: any;

if (env.IS_PREVIEW) {
  firestoreDb = new MockFirestore();
  cloudStorage = {
    bucket: () => ({
      file: () => ({
        getSignedUrl: async () => ["https://mock-storage.url/file"],
        save: async () => {}
      })
    })
  };
} else {
  // Production initialization
  const { initializeApp, getApps, applicationDefault } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  const { getStorage } = require('firebase-admin/storage');
  
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
    });
  }
  firestoreDb = getFirestore();
  cloudStorage = getStorage();
}

export const db = firestoreDb;
export const storage = cloudStorage;
