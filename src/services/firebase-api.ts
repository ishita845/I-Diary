// Firebase API Service
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage
} from 'firebase/storage';
import { auth, db, storage, isFirebaseConfigured } from '../config/firebase';

// Helper to check if Firebase is available
const ensureFirebase = () => {
  if (!isFirebaseConfigured || !auth || !db || !storage) {
    throw new Error('Firebase is not configured. Please add Firebase credentials to .env file.');
  }
};

// ==================== AUTH ====================

export const firebaseAuth = {
  // Sign up new user
  signUp: async (email: string, password: string, username: string) => {
    try {
      ensureFirebase();
      const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db!, 'users', user.uid), {
        email,
        username,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return { user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },

  // Sign in existing user
  signIn: async (email: string, password: string) => {
    try {
      ensureFirebase();
      const userCredential = await signInWithEmailAndPassword(auth!, email, password);
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      return { user: null, error: error.message };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      ensureFirebase();
      await signOut(auth!);
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    if (!isFirebaseConfigured || !auth) return null;
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    if (!isFirebaseConfigured || !auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }
};

// ==================== DATABASE ====================

export const firebaseDB = {
  // Generic create
  create: async (collectionName: string, data: any) => {
    try {
      ensureFirebase();
      const user = auth!.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const docRef = await addDoc(collection(db!, 'users', user.uid, collectionName), {
        ...data,
        userId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return { id: docRef.id, error: null };
    } catch (error: any) {
      return { id: null, error: error.message };
    }
  },

  // Generic read all
  readAll: async (collectionName: string) => {
    try {
      ensureFirebase();
      const user = auth!.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const q = query(
        collection(db!, 'users', user.uid, collectionName),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { data, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  },

  // Generic read one
  readOne: async (collectionName: string, docId: string) => {
    try {
      ensureFirebase();
      const user = auth!.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const docRef = doc(db!, 'users', user.uid, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
      } else {
        return { data: null, error: 'Document not found' };
      }
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  },

  // Generic update
  update: async (collectionName: string, docId: string, data: any) => {
    try {
      ensureFirebase();
      const user = auth!.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const docRef = doc(db!, 'users', user.uid, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
      
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  // Generic delete
  delete: async (collectionName: string, docId: string) => {
    try {
      ensureFirebase();
      const user = auth!.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const docRef = doc(db!, 'users', user.uid, collectionName, docId);
      await deleteDoc(docRef);
      
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  // Custom query
  query: async (collectionName: string, field: string, operator: any, value: any) => {
    try {
      ensureFirebase();
      const user = auth!.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const q = query(
        collection(db!, 'users', user.uid, collectionName),
        where(field, operator, value)
      );
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { data, error: null };
    } catch (error: any) {
      return { data: [], error: error.message };
    }
  }
};

// ==================== STORAGE ====================

export const firebaseStorage = {
  // Upload file
  upload: async (path: string, file: File) => {
    try {
      ensureFirebase();
      const user = auth!.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const storageRef = ref(storage!, `users/${user.uid}/${path}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      return { url, error: null };
    } catch (error: any) {
      return { url: null, error: error.message };
    }
  },

  // Delete file
  delete: async (path: string) => {
    try {
      ensureFirebase();
      const user = auth!.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const storageRef = ref(storage!, `users/${user.uid}/${path}`);
      await deleteObject(storageRef);
      
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  // Get download URL
  getURL: async (path: string) => {
    try {
      ensureFirebase();
      const user = auth!.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const storageRef = ref(storage!, `users/${user.uid}/${path}`);
      const url = await getDownloadURL(storageRef);
      
      return { url, error: null };
    } catch (error: any) {
      return { url: null, error: error.message };
    }
  }
};

// ==================== SPECIFIC OPERATIONS ====================

// Daily Entries
export const dailyEntriesAPI = {
  create: (data: any) => firebaseDB.create('dailyEntries', data),
  getAll: () => firebaseDB.readAll('dailyEntries'),
  getOne: (id: string) => firebaseDB.readOne('dailyEntries', id),
  update: (id: string, data: any) => firebaseDB.update('dailyEntries', id, data),
  delete: (id: string) => firebaseDB.delete('dailyEntries', id),
  getByDate: (date: string) => firebaseDB.query('dailyEntries', 'date', '==', date)
};

// Free Pages
export const freePagesAPI = {
  create: (data: any) => firebaseDB.create('freePages', data),
  getAll: () => firebaseDB.readAll('freePages'),
  getOne: (id: string) => firebaseDB.readOne('freePages', id),
  update: (id: string, data: any) => firebaseDB.update('freePages', id, data),
  delete: (id: string) => firebaseDB.delete('freePages', id)
};

// Wishlist
export const wishlistAPI = {
  create: (data: any) => firebaseDB.create('wishlist', data),
  getAll: () => firebaseDB.readAll('wishlist'),
  getOne: (id: string) => firebaseDB.readOne('wishlist', id),
  update: (id: string, data: any) => firebaseDB.update('wishlist', id, data),
  delete: (id: string) => firebaseDB.delete('wishlist', id)
};

// Letters
export const lettersAPI = {
  create: (data: any) => firebaseDB.create('letters', data),
  getAll: () => firebaseDB.readAll('letters'),
  getOne: (id: string) => firebaseDB.readOne('letters', id),
  update: (id: string, data: any) => firebaseDB.update('letters', id, data),
  delete: (id: string) => firebaseDB.delete('letters', id)
};

// Expenses
export const expensesAPI = {
  create: (data: any) => firebaseDB.create('expenses', data),
  getAll: () => firebaseDB.readAll('expenses'),
  getOne: (id: string) => firebaseDB.readOne('expenses', id),
  update: (id: string, data: any) => firebaseDB.update('expenses', id, data),
  delete: (id: string) => firebaseDB.delete('expenses', id),
  getByDateRange: async (startDate: string, endDate: string) => {
    const { data, error } = await firebaseDB.readAll('expenses');
    if (error) return { data: [], error };
    
    const filtered = data.filter((item: any) => 
      item.date >= startDate && item.date <= endDate
    );
    
    return { data: filtered, error: null };
  }
};

// Food Tracking
export const foodTrackingAPI = {
  create: (data: any) => firebaseDB.create('foodTracking', data),
  getAll: () => firebaseDB.readAll('foodTracking'),
  getOne: (id: string) => firebaseDB.readOne('foodTracking', id),
  update: (id: string, data: any) => firebaseDB.update('foodTracking', id, data),
  delete: (id: string) => firebaseDB.delete('foodTracking', id)
};

// Exercise Tracking
export const exerciseTrackingAPI = {
  create: (data: any) => firebaseDB.create('exerciseTracking', data),
  getAll: () => firebaseDB.readAll('exerciseTracking'),
  getOne: (id: string) => firebaseDB.readOne('exerciseTracking', id),
  update: (id: string, data: any) => firebaseDB.update('exerciseTracking', id, data),
  delete: (id: string) => firebaseDB.delete('exerciseTracking', id),
  getByDate: (date: string) => firebaseDB.query('exerciseTracking', 'date', '==', date)
};

// Shows
export const showsAPI = {
  create: (data: any) => firebaseDB.create('shows', data),
  getAll: () => firebaseDB.readAll('shows'),
  getOne: (id: string) => firebaseDB.readOne('shows', id),
  update: (id: string, data: any) => firebaseDB.update('shows', id, data),
  delete: (id: string) => firebaseDB.delete('shows', id)
};

// Movies
export const moviesAPI = {
  create: (data: any) => firebaseDB.create('movies', data),
  getAll: () => firebaseDB.readAll('movies'),
  getOne: (id: string) => firebaseDB.readOne('movies', id),
  update: (id: string, data: any) => firebaseDB.update('movies', id, data),
  delete: (id: string) => firebaseDB.delete('movies', id)
};

// People
export const peopleAPI = {
  create: (data: any) => firebaseDB.create('people', data),
  getAll: () => firebaseDB.readAll('people'),
  getOne: (id: string) => firebaseDB.readOne('people', id),
  update: (id: string, data: any) => firebaseDB.update('people', id, data),
  delete: (id: string) => firebaseDB.delete('people', id)
};

// Favorites
export const favoritesAPI = {
  create: (data: any) => firebaseDB.create('favorites', data),
  getAll: () => firebaseDB.readAll('favorites'),
  getOne: (id: string) => firebaseDB.readOne('favorites', id),
  update: (id: string, data: any) => firebaseDB.update('favorites', id, data),
  delete: (id: string) => firebaseDB.delete('favorites', id)
};

// About Me
export const aboutMeAPI = {
  create: (data: any) => firebaseDB.create('aboutMe', data),
  getAll: () => firebaseDB.readAll('aboutMe'),
  getOne: (id: string) => firebaseDB.readOne('aboutMe', id),
  update: (id: string, data: any) => firebaseDB.update('aboutMe', id, data),
  delete: (id: string) => firebaseDB.delete('aboutMe', id)
};

// Export all APIs
export const firebaseAPI = {
  auth: firebaseAuth,
  db: firebaseDB,
  storage: firebaseStorage,
  dailyEntries: dailyEntriesAPI,
  freePages: freePagesAPI,
  wishlist: wishlistAPI,
  letters: lettersAPI,
  expenses: expensesAPI,
  foodTracking: foodTrackingAPI,
  exerciseTracking: exerciseTrackingAPI,
  shows: showsAPI,
  movies: moviesAPI,
  people: peopleAPI,
  favorites: favoritesAPI,
  aboutMe: aboutMeAPI
};

export default firebaseAPI;