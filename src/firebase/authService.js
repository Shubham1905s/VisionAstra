import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, hasFirebaseConfig } from "./config";

export async function firebaseRegister(email, password) {
  if (!hasFirebaseConfig) return null;
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function firebaseLogin(email, password) {
  if (!hasFirebaseConfig) return null;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function firebaseLogout() {
  if (!hasFirebaseConfig) return;
  await signOut(auth);
}
