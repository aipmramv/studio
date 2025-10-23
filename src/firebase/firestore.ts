// Firestore compatibility shim that adapts legacy call signatures to the mongo shim.
import * as mongo from '@/mongo/mongo';

// Firestore-style collection(firestore, path) -> collection(path)
export function collection(_firestoreOrPath: any, maybePath?: string) {
	const path = typeof _firestoreOrPath === 'string' ? _firestoreOrPath : maybePath || _firestoreOrPath?.name;
	return mongo.collection(path);
}

// doc(firestore, collectionPath, id) or doc(collectionRef, id)
export function doc(arg1: any, arg2: any, arg3?: any) {
	if (typeof arg1 === 'string' && arg3 === undefined) {
		// doc(collectionPath, id)
		return mongo.doc(mongo.collection(arg1), arg2);
	}

	if (arg3 !== undefined) {
		// doc(firestore, collectionPath, id)
		return mongo.doc(mongo.collection(arg2), arg3);
	}

	// doc(collectionRef, id)
	return mongo.doc(arg1, arg2);
}

export const getDoc = mongo.getDoc;
export const listCollection = mongo.listCollection;
export const onSnapshot = mongo.onSnapshot;
export const setDoc = mongo.setDoc;
export const addDoc = mongo.addDoc;
export const updateDoc = mongo.updateDoc;
export const deleteDoc = mongo.deleteDoc;

// Export types as any to avoid widespread type changes here
export type DocumentReference = any;
export type CollectionReference = any;
export type Query = any;
export type DocumentData = any;
export type FirestoreError = any;
export type DocumentSnapshot = any;
export type QuerySnapshot = any;

export default {} as any;

// Minimal query/where shims to satisfy imports that expect Firestore query helpers.
export function query(collectionRef: any, ..._args: any[]) {
	// Unsupported: simply return the collectionRef so useCollection receives the ref
	return collectionRef;
}

export function where(..._args: any[]) {
	// Unsupported in shim; return a placeholder
	return {} as any;
}
