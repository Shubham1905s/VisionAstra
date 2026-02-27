import { addDoc, collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db, hasFirebaseConfig } from "./config";

export async function upsertDocument(path, id, payload) {
  if (!hasFirebaseConfig) return;
  await setDoc(doc(db, path, id), payload, { merge: true });
}

export async function addDocument(path, payload) {
  if (!hasFirebaseConfig) return null;
  return addDoc(collection(db, path), payload);
}
 
export async function listDocuments(path) {
  if (!hasFirebaseConfig) return [];
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
