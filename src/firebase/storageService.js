import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { hasFirebaseConfig, storage } from "./config";

export async function uploadFile(path, file) {
  if (!hasFirebaseConfig) return "";
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
  