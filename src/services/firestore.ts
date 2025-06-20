
import { db } from '@/config/firebase';
import type { Analysis, UserProfileData, UserLevel } from '@/types';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  // Timestamp, // No longer directly used in Analysis type for createdAt
} from 'firebase/firestore';

const ANALYSES_COLLECTION = 'analyses';
const USER_PROFILES_COLLECTION = 'userProfiles';
const MAX_FREE_ATTEMPTS = 2; // Define it here as well for consistency if needed by service

// --- User Profile Functions ---

/**
 * Retrieves a user's profile data from Firestore.
 * If the profile doesn't exist, it creates a default one and returns it.
 * @param userId The ID of the user.
 * @returns A promise that resolves to the UserProfileData.
 */
export async function getUserProfile(userId: string): Promise<UserProfileData> {
  const userProfileRef = doc(db, USER_PROFILES_COLLECTION, userId);
  const userProfileSnap = await getDoc(userProfileRef);

  if (userProfileSnap.exists()) {
    return userProfileSnap.data() as UserProfileData;
  } else {
    // Profile doesn't exist, create a default one
    const defaultProfile: UserProfileData = {
      analysisAttempts: 0,
      isPremium: false,
      userLevel: null,
      subscriptionStartDate: null,
      subscriptionNextBillingDate: null,
    };
    await setDoc(userProfileRef, defaultProfile);
    return defaultProfile;
  }
}

/**
 * Updates a user's profile data in Firestore.
 * @param userId The ID of the user.
 * @param data An object containing the fields to update.
 * @returns A promise that resolves when the update is complete.
 */
export async function updateUserProfile(userId: string, data: Partial<UserProfileData>): Promise<void> {
  const userProfileRef = doc(db, USER_PROFILES_COLLECTION, userId);
  // Ensure the document exists before attempting an update, or use setDoc with merge if you want to create if not exists
  const userProfileSnap = await getDoc(userProfileRef);
  if (!userProfileSnap.exists()) {
    // If for some reason getUserProfile wasn't called first or failed,
    // we might want to create it here with the partial data merged into a default.
    // For simplicity now, we assume getUserProfile was called and doc exists or was created.
    // Or, more robustly:
    const defaultProfile: UserProfileData = {
      analysisAttempts: 0,
      isPremium: false,
      userLevel: null,
      subscriptionStartDate: null,
      subscriptionNextBillingDate: null,
      ...data, // Merge partial data with defaults
    };
    await setDoc(userProfileRef, defaultProfile);
  } else {
    await updateDoc(userProfileRef, data);
  }
}

/**
 * Increments the analysis attempts for a user.
 * @param userId The ID of the user.
 * @returns A promise that resolves when the attempts are incremented.
 */
export async function incrementUserAnalysisAttempts(userId: string): Promise<void> {
  const userProfileRef = doc(db, USER_PROFILES_COLLECTION, userId);
  // Ensure profile exists (should be handled by initial getUserProfile call on app load/login)
  await updateDoc(userProfileRef, {
    analysisAttempts: increment(1),
  });
}

/**
 * Resets the analysis attempts for a user to 0.
 * Typically used when a user upgrades to premium or for administrative purposes.
 * @param userId The ID of the user.
 * @returns A promise that resolves when the attempts are reset.
 */
export async function resetUserAnalysisAttempts(userId: string): Promise<void> {
  await updateUserProfile(userId, { analysisAttempts: 0 });
}

/**
 * Sets the user's premium status and subscription dates.
 * @param userId The ID of the user.
 * @param isPremium Boolean indicating premium status.
 * @param startDate Optional ISO string for subscription start date.
 * @param nextBillingDate Optional ISO string for next billing date.
 * @returns A promise that resolves when the status is updated.
 */
export async function setUserPremiumStatus(
  userId: string,
  isPremium: boolean,
  startDate?: string | null, // Allow null
  nextBillingDate?: string | null // Allow null
): Promise<void> {
  const profileUpdate: Partial<UserProfileData> = { isPremium };
  if (isPremium) {
    profileUpdate.subscriptionStartDate = startDate || new Date().toISOString();
    profileUpdate.subscriptionNextBillingDate = nextBillingDate || null; // Can be null if managed externally
    profileUpdate.analysisAttempts = 0; // Reset attempts when going premium
  } else {
    // When downgrading, clear subscription dates
    profileUpdate.subscriptionStartDate = null;
    profileUpdate.subscriptionNextBillingDate = null;
    // Optionally, reset attempts or leave as is depending on business logic
    // profileUpdate.analysisAttempts = 0; // Or keep current attempts
  }
  await updateUserProfile(userId, profileUpdate);
}

/**
 * Sets the user's trading level.
 * @param userId The ID of the user.
 * @param level The trading level ('beginner', 'intermediate', 'advanced').
 * @returns A promise that resolves when the level is updated.
 */
export async function setUserTradingLevel(userId: string, level: UserLevel | null): Promise<void> {
  await updateUserProfile(userId, { userLevel: level });
}


// --- Analysis History Functions (Kept for potential future use, currently localStorage based) ---

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
      createdAt: serverTimestamp(), // Firestore serverTimestamp is fine here
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
      // When fetching from Firestore, createdAt will be a Firebase Timestamp.
      // For consistency with localStorage version, convert to ISO string if needed by consuming code.
      // However, the Analysis type now expects string for createdAt.
      // So, we need to convert Firestore Timestamp to ISO string here.
      analyses.push({ 
        id: doc.id, 
        ...data,
        // Ensure createdAt is string if it's a Firebase Timestamp from Firestore
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      } as Analysis); // Cast might be needed if firestore data structure differs slightly
    });
    return analyses;
  } catch (error) {
    console.error('Error fetching analyses from Firestore: ', error);
    return [];
  }
}
