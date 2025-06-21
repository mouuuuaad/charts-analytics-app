
import { db } from '@/config/firebase';
import type { Feedback, UserLevel, UserProfileData } from '@/types';
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const FEEDBACK_COLLECTION = 'feedback';


// --- User Profile Functions ---

// Creates a user profile document, typically on first sign-up.
export async function createUserProfile(userId: string, email: string | null, displayName: string | null): Promise<void> {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  try {
    await setDoc(userDocRef, {
      email: email || '',
      displayName: displayName || 'Anonymous User',
      createdAt: serverTimestamp(),
      analysisAttempts: 0,
      isPremium: false,
      userLevel: null,
      subscriptionStartDate: null,
      subscriptionNextBillingDate: null,
    });
  } catch (error) {
    console.error("Error creating user profile in Firestore: ", error);
  }
}

// Fetches a user's profile data.
export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfileData;
    } else {
      console.log("No user profile found for user:", userId);
      // Optional: Could create a profile here if it's missing for an existing auth user
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile from Firestore: ", error);
    return null;
  }
}

// Sets or updates the user's trading level.
export async function setUserTradingLevel(userId: string, level: UserLevel): Promise<void> {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    try {
        await updateDoc(userDocRef, { userLevel: level });
    } catch (error) {
        console.error("Error updating user trading level in Firestore:", error);
    }
}

// Increments the analysis attempts for a user.
export async function incrementUserAnalysisAttempts(userId: string): Promise<void> {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    try {
        await updateDoc(userDocRef, { analysisAttempts: increment(1) });
    } catch (error) {
        console.error("Error incrementing user analysis attempts:", error);
    }
}

// Updates a user's premium status and subscription dates.
export async function updateUserPremiumStatus(userId: string, isPremium: boolean, startDate: string | null, nextBillingDate: string | null): Promise<void> {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    try {
        await updateDoc(userDocRef, {
            isPremium: isPremium,
            // Reset attempts if they become premium
            analysisAttempts: isPremium ? 0 : increment(0), // No change if not becoming premium
            subscriptionStartDate: startDate,
            subscriptionNextBillingDate: nextBillingDate,
        });
    } catch (error) {
        console.error("Error updating user premium status in Firestore:", error);
    }
}


// --- Feedback Functions ---

export async function addFeedback(
  userId: string,
  username: string,
  photoURL: string | null | undefined,
  text: string
): Promise<string | null> {
  if (!text.trim()) {
    console.error('Feedback text cannot be empty');
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, FEEDBACK_COLLECTION), {
      userId,
      username,
      photoURL: photoURL || null,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding feedback to Firestore: ', error);
    return null;
  }
}

export async function getAllFeedback(): Promise<Feedback[]> {
  try {
    const q = query(
      collection(db, FEEDBACK_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const feedbackList: Feedback[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      feedbackList.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(), // Keep as Date object
      } as Feedback);
    });
    return feedbackList;
  } catch (error) {
    console.error('Error fetching feedback from Firestore: ', error);
    return [];
  }
}
