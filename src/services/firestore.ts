
import { db } from '@/config/firebase';
import type { Analysis } from '@/types'; // UserProfileData type is removed
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  // doc, // No longer used for user profiles here
  // getDoc, // No longer used for user profiles here
  // setDoc, // No longer used for user profiles here
  // updateDoc, // No longer used for user profiles here
  // increment, // No longer used for user profiles here
} from 'firebase/firestore';

const ANALYSES_COLLECTION = 'analyses';
// const USER_PROFILES_COLLECTION = 'userProfiles'; // Removed
// const MAX_FREE_ATTEMPTS = 2; // Removed, managed in components with localStorage

// --- User Profile Functions ---
// All user profile related Firestore functions are removed as per request to revert.
// getUserProfile, updateUserProfile, incrementUserAnalysisAttempts,
// resetUserAnalysisAttempts, setUserPremiumStatus, setUserTradingLevel
// are all removed.

// --- Analysis History Functions (Kept for potential future use) ---

// This function is no longer used by the core analysis history feature with localStorage.
// It's kept here in case direct Firestore interaction is needed elsewhere or in the future.
export async function addAnalysisToFirestore( // Renamed to avoid confusion
  userId: string,
  imageUrl: string,
  extractedData: string | undefined | null,
  prediction: Analysis['prediction'],
  chartFileName?: string,
): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, ANALYSES_COLLECTION), {
      userId,
      imageUrl,
      extractedData: extractedData || null,
      prediction,
      chartFileName: chartFileName || 'N/A',
      createdAt: serverTimestamp(), 
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding analysis to Firestore: ', error);
    return null;
  }
}

// This function is no longer used by the core analysis history feature with localStorage.
// It's kept here in case direct Firestore interaction is needed elsewhere or in the future.
export async function getAnalysesForUserFromFirestore(userId: string): Promise<Analysis[]> { // Renamed
  try {
    const q = query(
      collection(db, ANALYSES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const analyses: Analysis[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      analyses.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      } as Analysis); 
    });
    return analyses;
  } catch (error) {
    console.error('Error fetching analyses from Firestore: ', error);
    return [];
  }
}


    