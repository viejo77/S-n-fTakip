import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ClassGroup, SchoolInfo, ScheduleSlot, AssessmentCriterion } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with databaseId from config
export { firebaseConfig };
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'workspaces', 'connection-test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local cache.');
    }
    return false;
  }
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In failed:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Workspace Data Interface
export interface WorkspaceData {
  ownerId: string;
  schoolInfo: SchoolInfo;
  classes: ClassGroup[];
  scheduleSlots: ScheduleSlot[];
  criteria: AssessmentCriterion[];
  updatedAt: string;
}

// Save Workspace to Firestore
export async function saveWorkspaceToCloud(
  userId: string,
  data: Omit<WorkspaceData, 'ownerId' | 'updatedAt'>
): Promise<void> {
  const path = `workspaces/${userId}`;
  try {
    const payload: WorkspaceData = {
      ownerId: userId,
      schoolInfo: data.schoolInfo,
      classes: data.classes,
      scheduleSlots: data.scheduleSlots,
      criteria: data.criteria,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'workspaces', userId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch Workspace once
export async function fetchWorkspaceFromCloud(userId: string): Promise<WorkspaceData | null> {
  const path = `workspaces/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'workspaces', userId));
    if (snap.exists()) {
      return snap.data() as WorkspaceData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Subscribe to Workspace Realtime Changes
export function subscribeToWorkspace(
  userId: string,
  onData: (data: WorkspaceData) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `workspaces/${userId}`;
  const unsubscribe = onSnapshot(
    doc(db, 'workspaces', userId),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as WorkspaceData);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        if (onError && e instanceof Error) onError(e);
      }
    }
  );
  return unsubscribe;
}
