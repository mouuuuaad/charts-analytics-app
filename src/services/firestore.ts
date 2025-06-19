
import { db } from '@/config/firebase';
import type { Analysis } from '@/types';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  // Timestamp, // No longer directly used in Analysis type for createdAt
} from 'firebase/firestore';

const ANALYSES_COLLECTION = 'analyses';

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
