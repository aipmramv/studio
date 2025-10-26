/* Minimal MongoDB compatibility shim for this repo.
   This file is careful NOT to statically import the `mongodb` driver so it
   does not get bundled into client-side code. When running on the server
   (Node), it will lazily require `mongodb` and provide the real implementations.
   When running in the browser this module exposes lightweight fallbacks that
   either throw or return empty results — the recommended pattern is to call
   server API routes from the client instead of accessing Mongo directly.
*/

let MongoClient: any = null
let client: any = null
let db: any = null

function ensureServerDriverLoaded() {
  if (typeof window !== 'undefined') return false
  if (!MongoClient) {
    // Lazily require to avoid bundling in client bundles
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mongodb = require('mongodb')
    MongoClient = mongodb.MongoClient
  }
  return true
}

export async function initializeMongo(uri: string, dbName: string) {
  if (!ensureServerDriverLoaded()) {
    throw new Error('initializeMongo can only be used on the server')
  }

  if (!client) {
    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
  }

  return { client, db }
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
  if (!ensureServerDriverLoaded()) {
    // Running in the browser: prefer calling server API routes instead of
    // attempting a direct DB call. Return a helpful default.
    return { exists: false, data: null }
  }

  if (!db) throw new Error('Mongo not initialized')
  const col = db.collection(documentRef.collection)
  const item = await col.findOne({ $or: [{ _id: (documentRef.id as any) }, { id: documentRef.id }] } as any)
  if (!item) return { exists: false, data: null }
  return { exists: true, data: item }
}

export async function listCollection(collectionRef: CollectionReference) {
  if (!ensureServerDriverLoaded()) {
    return []
  }
  if (!db) throw new Error('Mongo not initialized')
  const col = db.collection(collectionRef.name)
  const items = await col.find({}).toArray()
  return items
}

// Write helpers compatible with Firestore-lite API
export async function setDoc(documentRef: DocumentReference, data: any, options?: any) {
  if (!ensureServerDriverLoaded()) {
    throw new Error('setDoc is server-only; call a server API route to persist data')
  }
  if (!db) throw new Error('Mongo not initialized')
  const col = db.collection(documentRef.collection)
  await col.replaceOne({ $or: [{ _id: (documentRef.id as any) }, { id: documentRef.id }] } as any, { ...data, _id: documentRef.id }, { upsert: true })
}

export async function addDoc(collectionRef: CollectionReference, data: any) {
  if (!ensureServerDriverLoaded()) {
    throw new Error('addDoc is server-only; call a server API route to persist data')
  }
  if (!db) throw new Error('Mongo not initialized')
  const col = db.collection(collectionRef.name)
  const res = await col.insertOne(data as any)
  return { id: (res.insertedId as any)?.toString?.() ?? String(res.insertedId) }
}

export async function updateDoc(documentRef: DocumentReference, data: any) {
  if (!ensureServerDriverLoaded()) {
    throw new Error('updateDoc is server-only; call a server API route to persist data')
  }
  if (!db) throw new Error('Mongo not initialized')
  const col = db.collection(documentRef.collection)
  await col.updateOne({ $or: [{ _id: (documentRef.id as any) }, { id: documentRef.id }] } as any, { $set: data })
}

export async function deleteDoc(documentRef: DocumentReference) {
  if (!ensureServerDriverLoaded()) {
    throw new Error('deleteDoc is server-only; call a server API route to persist data')
  }
  if (!db) throw new Error('Mongo not initialized')
  const col = db.collection(documentRef.collection)
  await col.deleteOne({ $or: [{ _id: (documentRef.id as any) }, { id: documentRef.id }] } as any)
}

// Simple polling-based onSnapshot for document or collection
export function onSnapshot(target: DocumentReference | CollectionReference, callback: (snapshot: any) => void, onError?: (err: any) => void) {
  // In browser we provide a polling-based implementation that queries server
  // via the `listCollection` / `getDoc` functions above (which currently
  // return empty results in browser). Real-time updates should be provided by
  // a websocket or server-sent events implementation instead.
  let mounted = true
  let lastData: any = null

  const poll = async () => {
    if (!mounted) return
    try {
      let data: any
      if ((target as DocumentReference).id !== undefined) {
        const docRef = target as DocumentReference
        const res = await getDoc(docRef)
        data = res.exists ? { id: docRef.id, ...res.data } : null
      } else {
        const colRef = target as CollectionReference
        const items = await listCollection(colRef)
        data = items.map((r: any) => ({ id: r._id, ...r }))
      }

      const json = JSON.stringify(data)
      if (json !== lastData) {
        lastData = json
        if (Array.isArray(data)) {
          callback({ docs: data })
        } else {
          callback({ docs: [data] })
        }
      }
    } catch (err) {
      if (onError) onError(err)
    }
  }

  poll()
  const id = setInterval(poll, 3000)

  return () => {
    mounted = false
    clearInterval(id)
  }
}
