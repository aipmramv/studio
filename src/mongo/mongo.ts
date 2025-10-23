/* Minimal MongoDB compatibility shim for this repo.
   Provides a small subset of Firestore-like API used by the app:
   - initializeMongo(uri, dbName)
   - collection(name) -> CollectionReference
   - doc(collectionRef, id)
   - getDoc, listCollection
   - onSnapshot (polling)

   This shim uses the official `mongodb` driver.
*/

import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function initializeMongo(uri: string, dbName: string) {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return { client, db };
}

export type DocumentData = Record<string, any>;

export interface CollectionReference {
  name: string;
}

export interface DocumentReference {
  collection: string;
  id: string;
}

export function collection(name: string): CollectionReference {
  return { name };
}

export function doc(collectionRef: CollectionReference, id: string): DocumentReference {
  return { collection: collectionRef.name, id };
}

export async function getDoc(documentRef: DocumentReference) {
  if (!db) throw new Error('Mongo not initialized');
  const col = db.collection(documentRef.collection);
  // Mongo _id types may be ObjectId or string depending on how data was inserted.
  // Use a flexible filter that matches either _id or id fields.
  const item = await col.findOne({ $or: [{ _id: (documentRef.id as any) }, { id: documentRef.id }] } as any);
  if (!item) return { exists: false, data: null };
  return { exists: true, data: item };
}

export async function listCollection(collectionRef: CollectionReference) {
  if (!db) throw new Error('Mongo not initialized');
  const col = db.collection(collectionRef.name);
  const items = await col.find({}).toArray();
  return items;
}

// Write helpers compatible with Firestore-lite API
export async function setDoc(documentRef: DocumentReference, data: any, options?: any) {
  if (!db) throw new Error('Mongo not initialized');
  const col = db.collection(documentRef.collection);
  // Use _id as the document id
  await col.replaceOne({ $or: [{ _id: (documentRef.id as any) }, { id: documentRef.id }] } as any, { ...data, _id: documentRef.id }, { upsert: true });
}

export async function addDoc(collectionRef: CollectionReference, data: any) {
  if (!db) throw new Error('Mongo not initialized');
  const col = db.collection(collectionRef.name);
  const res = await col.insertOne(data as any);
  return { id: (res.insertedId as any)?.toString?.() ?? String(res.insertedId) };
}

export async function updateDoc(documentRef: DocumentReference, data: any) {
  if (!db) throw new Error('Mongo not initialized');
  const col = db.collection(documentRef.collection);
  await col.updateOne({ $or: [{ _id: (documentRef.id as any) }, { id: documentRef.id }] } as any, { $set: data });
}

export async function deleteDoc(documentRef: DocumentReference) {
  if (!db) throw new Error('Mongo not initialized');
  const col = db.collection(documentRef.collection);
  await col.deleteOne({ $or: [{ _id: (documentRef.id as any) }, { id: documentRef.id }] } as any);
}

// Simple polling-based onSnapshot for document or collection
export function onSnapshot(target: DocumentReference | CollectionReference, callback: (snapshot: any) => void, onError?: (err: any) => void) {
  let mounted = true;
  let lastData: any = null;

  const poll = async () => {
    if (!mounted) return;
    try {
      let data;
      if ((target as DocumentReference).id !== undefined) {
        const docRef = target as DocumentReference;
        const res = await getDoc(docRef);
        data = res.exists ? { id: docRef.id, ...res.data } : null;
      } else {
        const colRef = target as CollectionReference;
        const items = await listCollection(colRef);
        data = items.map((r: any) => ({ id: r._id, ...r }));
      }

      const json = JSON.stringify(data);
      if (json !== lastData) {
        lastData = json;
        // For collection snapshots emulate {docs: [{id, ...data}, ...]}
        if (Array.isArray(data)) {
          callback({ docs: data });
        } else {
          callback({ docs: [data] });
        }
      }
    } catch (err) {
      if (onError) onError(err);
    }
  };

  poll();
  const id = setInterval(poll, 3000);

  return () => {
    mounted = false;
    clearInterval(id);
  };
}
