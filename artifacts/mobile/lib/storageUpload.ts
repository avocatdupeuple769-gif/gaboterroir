import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadFileToStorage(
  localUri: string,
  path: string
): Promise<string> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, blob);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (e) {
    console.warn("Storage upload failed, using local URI:", e);
    return localUri;
  }
}

export async function uploadPhoto(
  localUri: string,
  folder: string,
  filename?: string
): Promise<string> {
  if (!localUri || localUri.startsWith("http")) return localUri;
  const name = filename ?? `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
  return uploadFileToStorage(localUri, `${folder}/${name}`);
}

export async function uploadVideo(
  localUri: string,
  folder: string,
  filename?: string
): Promise<string> {
  if (!localUri || localUri.startsWith("http")) return localUri;
  const name = filename ?? `${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`;
  return uploadFileToStorage(localUri, `${folder}/${name}`);
}

export async function uploadMultiplePhotos(
  localUris: string[],
  folder: string
): Promise<string[]> {
  const results: string[] = [];
  for (let i = 0; i < localUris.length; i++) {
    const uri = localUris[i];
    if (!uri || uri.startsWith("http")) {
      results.push(uri);
    } else {
      const name = `photo_${i}_${Date.now()}.jpg`;
      const url = await uploadFileToStorage(uri, `${folder}/${name}`);
      results.push(url);
    }
  }
  return results;
}
