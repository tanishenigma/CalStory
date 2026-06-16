import type {
  UserCredential,
  User,
  Unsubscribe} from "firebase/auth";
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "@/app/lib/firebase";

export const signInWithGoogle = (): Promise<UserCredential> =>
  signInWithPopup(auth, googleProvider);

export const signOut = (): Promise<void> => fbSignOut(auth);

export const onAuthChange = (cb: (user: User | null) => void): Unsubscribe =>
  onAuthStateChanged(auth, cb);
