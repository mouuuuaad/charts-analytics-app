
import { db } from '@/config/firebase';
import type { Feedback, FeedbackReply, ReactionType, UserLevel, UserProfileData } from '@/types';
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
  runTransaction,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const FEEDBACK_COLLECTION = 'feedback';
const REPLIES_SUBCOLLECTION = 'replies';


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
            analysisAttempts: isPremium ? 0 : increment(0),
            subscriptionStartDate: startDate,
            subscriptionNextBillingDate: nextBillingDate,
        });
    } catch (error) {
        console.error("Error updating user premium status in Firestore:", error);
    }
}

// Saves a user's FCM token to their profile if it's not already there.
export async function saveUserFCMToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) return;
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  try {
    // arrayUnion adds an element to an array but only if it's not already present.
    await updateDoc(userDocRef, {
      fcmTokens: arrayUnion(token)
    });
  } catch (error) {
    console.error("Error saving FCM token to user profile:", error);
    throw error; // Re-throw to let the caller handle it, e.g., show a toast.
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
      reactions: { like: [], love: [] }, // Initialize with empty reactions map
      replyCount: 0,
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
        reactions: data.reactions || { like: [], love: [] }, // Fix: Ensure reactions object always exists.
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as Feedback);
    });
    return feedbackList;
  } catch (error) {
    console.error('Error fetching feedback from Firestore: ', error);
    return [];
  }
}

export async function toggleFeedbackReaction(feedbackId: string, userId: string, reactionType: ReactionType): Promise<void> {
    const feedbackDocRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    try {
        await runTransaction(db, async (transaction) => {
            const feedbackDoc = await transaction.get(feedbackDocRef);
            if (!feedbackDoc.exists()) {
                throw "Document does not exist!";
            }
            const currentReactions = feedbackDoc.data().reactions || {};
            const userReactionList = currentReactions[reactionType] || [];
            const reactionField = `reactions.${reactionType}`;

            if (userReactionList.includes(userId)) {
                // User has already reacted, so remove the reaction
                transaction.update(feedbackDocRef, { [reactionField]: arrayRemove(userId) });
            } else {
                // User has not reacted, so add the reaction
                transaction.update(feedbackDocRef, { [reactionField]: arrayUnion(userId) });
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error("Could not update reaction.");
    }
}

export async function addReplyToFeedback(
    feedbackId: string,
    userId: string,
    username: string,
    photoURL: string | null | undefined,
    text: string,
    isAdmin: boolean
): Promise<string | null> {
    if (!text.trim()) return null;
    const feedbackDocRef = doc(db, FEEDBACK_COLLECTION, feedbackId);
    const repliesCollectionRef = collection(feedbackDocRef, REPLIES_SUBCOLLECTION);
    try {
        const replyDocRef = await addDoc(repliesCollectionRef, {
            userId,
            username,
            photoURL: photoURL || null,
            text: text.trim(),
            isAdmin,
            createdAt: serverTimestamp(),
        });
        await updateDoc(feedbackDocRef, { replyCount: increment(1) });
        return replyDocRef.id;
    } catch (e) {
        console.error("Error adding reply:", e);
        return null;
    }
}

export async function getRepliesForFeedback(feedbackId: string): Promise<FeedbackReply[]> {
    const repliesCollectionRef = collection(db, FEEDBACK_COLLECTION, feedbackId, REPLIES_SUBCOLLECTION);
    const q = query(repliesCollectionRef, orderBy('createdAt', 'asc'));
    try {
        const querySnapshot = await getDocs(q);
        const replies: FeedbackReply[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            replies.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() ? data.createdAt.toDate() : new Date(),
            } as FeedbackReply);
        });
        return replies;
    } catch (e) {
        console.error("Error fetching replies:", e);
        return [];
    }
}
