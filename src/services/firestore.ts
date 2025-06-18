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
  Timestamp,
} from 'firebase/firestore';

const ANALYSES_COLLECTION = 'analyses';

export async function addAnalysis(
  userId: string,
  imageUrl: string,
  extractedData: string | undefined,
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

export async function getAnalysesForUser(userId: string): Promise<Analysis[]> {
  try {
    const q = query(
      collection(db, ANALYSES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const analyses: Analysis[] = [];
    querySnapshot.forEach((doc) => {
      analyses.push({ id: doc.id, ...doc.data() } as Analysis);
    });
    return analyses;
  } catch (error) {
    console.error('Error fetching analyses from Firestore: ', error);
    return [];
  }
}
