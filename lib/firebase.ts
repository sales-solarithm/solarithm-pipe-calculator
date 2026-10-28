import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PipeProject } from './types';

// Replace with the following official Firebase configuration:
const firebaseConfig = {
  apiKey: "AIzaSyDnSrWcVt-eOKTm1_ncz5eYdIqeO4HKlsE",
  authDomain: "solarithm-tools-370ed.firebaseapp.com",
  projectId: "solarithm-tools-370ed",
  storageBucket: "solarithm-tools-370ed.firebasestorage.app",
  messagingSenderId: "76083145868",
  appId: "1:76083145868:web:2061d43078c6c9fc8cdfa9"
};

// Initialize Firebase App safely (singleton instance)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore using initializeFirestore with experimentalForceLongPolling: true,
// reusing the existing instance if already initialized to prevent duplicate initialization errors.
const globalForFirestore = globalThis as unknown as {
  __solarithmFirestoreDb?: ReturnType<typeof getFirestore>;
};

function getOrInitializeFirestore() {
  if (globalForFirestore.__solarithmFirestoreDb) {
    return globalForFirestore.__solarithmFirestoreDb;
  }
  try {
    const instance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
    globalForFirestore.__solarithmFirestoreDb = instance;
    return instance;
  } catch {
    const instance = getFirestore(app);
    globalForFirestore.__solarithmFirestoreDb = instance;
    return instance;
  }
}

export const db = getOrInitializeFirestore();
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export interface SaveProjectResult {
  success: boolean;
  target: 'cloud' | 'local';
  warning?: string;
}

/**
 * Wraps any promise with a strict 3000ms emergency timeout race.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number = 3000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('timeout'));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Helper to read all offline cached projects from localStorage synchronously
 */
export function getLocalCachedProjects(): PipeProject[] {
  if (typeof window === 'undefined') return [];
  const results: PipeProject[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('offline_proj_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id) {
            results.push(parsed as PipeProject);
          }
        }
      }
    }
  } catch {
    // ignore storage read errors
  }
  return results;
}

/**
 * Validate connection to Firestore on app startup with a 3s safe timeout
 */
export async function testConnection(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    await withTimeout(
      getDocFromServer(doc(db, 'pipe_calculator_projects', 'health_check')),
      3000
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Optimistic save: writes project snapshot synchronously to localStorage first,
 * then dispatches Firestore setDoc in the background with a 3-second timeout fallback.
 */
export async function saveProjectToFirestore(
  project: PipeProject,
  isNew: boolean = false
): Promise<SaveProjectResult> {
  if (typeof window === 'undefined') {
    return { success: true, target: 'cloud' };
  }

  const projectId = project.id || `proj_${Date.now()}`;
  const currentUser: User | null = auth.currentUser;
  const effectiveUserId = currentUser?.uid || project.userId || 'guest_user';
  const nowIso = new Date().toISOString();

  const baseData = {
    id: projectId,
    userId: effectiveUserId,
    userEmail: currentUser?.email || project.userEmail || '',
    projectName: project.projectName || 'Untitled Project',
    clientName: project.clientName || '',
    submissionDate: project.submissionDate || '',
    standardPipeLength: Number(project.standardPipeLength) || 20,
    pipeLengthUnit: project.pipeLengthUnit || 'ft',
    companyName: project.companyName || '',
    companyCity: project.companyCity || '',
    showBranding: Boolean(project.showBranding),
    noteText: project.noteText || '',
    logoUrl: project.logoUrl || '',
    clientLogoUrl: project.clientLogoUrl || '',
    pipeSizes: project.pipeSizes || [],
    components: project.components || [],
    componentItems: project.componentItems || [],
    rows: project.rows || [],
  };

  const localPayload = {
    ...baseData,
    updatedAt: nowIso,
    ...(isNew ? { createdAt: nowIso } : {}),
  };

  // 1. Immediate optimistic write to localStorage
  try {
    localStorage.setItem(`offline_proj_${projectId}`, JSON.stringify(localPayload));
  } catch {
    // ignore local storage quota errors
  }

  const payload: Record<string, any> = {
    ...baseData,
    updatedAt: serverTimestamp(),
  };

  if (isNew) {
    payload.createdAt = serverTimestamp();
  }

  // 2. Non-blocking background cloud sync with 3-second emergency timeout fallback
  void withTimeout(
    setDoc(doc(db, 'pipe_calculator_projects', projectId), payload, { merge: true }),
    3000
  ).catch(() => {
    // Emergency fallback already persisted in localStorage
  });

  return { success: true, target: 'cloud' };
}

/**
 * Query projects with a 3-second timeout race, merging with local cache
 * and refreshing localStorage when cloud documents arrive.
 */
export async function fetchUserProjectsFromFirestore(_userId?: string): Promise<PipeProject[]> {
  if (typeof window === 'undefined') {
    return [];
  }
  const path = 'pipe_calculator_projects';
  const localProjects = getLocalCachedProjects();
  try {
    const snapshot = await withTimeout(getDocs(collection(db, path)), 3000);
    const projectMap = new Map<string, PipeProject>();
    for (const lp of localProjects) {
      projectMap.set(lp.id, lp);
    }
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as PipeProject;
      if (data && data.id) {
        projectMap.set(data.id, data);
        try {
          localStorage.setItem(`offline_proj_${data.id}`, JSON.stringify(data));
        } catch {
          // ignore cache write issues
        }
      }
    });
    return Array.from(projectMap.values());
  } catch {
    return localProjects;
  }
}

/**
 * Delete a project document from local workspace cache immediately and Firestore in background (3s timeout)
 */
export async function deleteProjectFromFirestore(projectId: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(`offline_proj_${projectId}`);
  } catch {
    // ignore storage removal errors
  }
  void withTimeout(
    deleteDoc(doc(db, 'pipe_calculator_projects', projectId)),
    3000
  ).catch(() => {
    // Emergency fallback: already removed from localStorage
  });
}

/**
 * Upload logo file to Firebase Storage with 3s timeout and local data URL fallback
 */
export async function uploadLogoToStorage(file: File, pathPrefix: string = 'logos'): Promise<string> {
  if (typeof window === 'undefined') {
    return '';
  }
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storageRef = ref(storage, `${pathPrefix}/${timestamp}_${sanitizedName}`);
    const snapshot = await withTimeout(uploadBytes(storageRef, file), 3000);
    return await withTimeout(getDownloadURL(snapshot.ref), 3000);
  } catch (err) {
    console.warn('Storage upload error, generating local data url as fallback:', err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}
