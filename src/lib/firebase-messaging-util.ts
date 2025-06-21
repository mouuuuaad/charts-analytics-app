
// NOTE: This file should only be imported and used on the client-side.
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from '@/config/firebase';
import { saveUserFCMToken } from '@/services/firestore';

type InitializationResult = 'success' | 'permission-denied' | 'unsupported-browser' | 'vapid-key-missing' | 'no-token' | 'error';

/**
 * Initializes the Firebase Cloud Messaging client.
 * Requests permission from the user and saves their token to Firestore.
 * @param userId - The UID of the currently logged-in user.
 * @returns A string indicating the result of the operation.
 */
export const initializeFirebaseMessaging = async (userId: string): Promise<InitializationResult> => {
  if (typeof window === 'undefined' || !isSupported()) {
    console.log("Firebase Messaging is not supported in this browser or environment.");
    return 'unsupported-browser';
  }

  try {
    const messaging = getMessaging(app);

    // 1. Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission was not granted.');
      return 'permission-denied';
    }

    // 2. Get VAPID key from environment variables
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey || vapidKey === 'YOUR_KEY_HERE') {
      console.error('No VAPID key found in .env.local. Please set NEXT_PUBLIC_FIREBASE_VAPID_KEY.');
      return 'vapid-key-missing';
    }

    // 3. Get Device Token
    const currentToken = await getToken(messaging, { vapidKey });

    if (currentToken) {
      console.log('FCM Token received: ', currentToken);
      // 4. Save token to Firestore
      await saveUserFCMToken(userId, currentToken);
      return 'success';
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return 'no-token';
    }
  } catch (err) {
    console.error('An error occurred while initializing Firebase Messaging: ', err);
    return 'error';
  }
};
