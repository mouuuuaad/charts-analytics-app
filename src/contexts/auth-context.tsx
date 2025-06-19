
'use client';

import type { User as FirebaseUser, IdTokenResult } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/config/firebase'; // Re-enable Firebase auth
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
} from 'firebase/auth';
import type { AuthFormData } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signUp: (data: AuthFormData) => Promise<UserCredential | string>;
  logIn: (data: AuthFormData) => Promise<UserCredential | string>;
  signInWithGoogle: () => Promise<UserCredential | string>;
  logOut: () => Promise<void>;
  getToken: () => Promise<IdTokenResult | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true); // Start as true until first auth check
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (data: AuthFormData): Promise<UserCredential | string> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      setUser(userCredential.user);
      return userCredential;
    } catch (error: any) {
      return error.message || 'Failed to sign up';
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (data: AuthFormData): Promise<UserCredential | string> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      setUser(userCredential.user);
      return userCredential;
    } catch (error: any) {
      return error.message || 'Failed to log in';
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<UserCredential | string> => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      return result;
    } catch (error: any) {
      // Handle specific Google sign-in errors if needed
      // const errorCode = error.code;
      // const errorMessage = error.message;
      // const email = error.customData?.email;
      // const credential = GoogleAuthProvider.credentialFromError(error);
      return error.message || 'Failed to sign in with Google';
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      router.push('/'); // Redirect to landing page after logout
    } catch (error: any) {
      console.error("Logout error:", error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const getToken = async (): Promise<IdTokenResult | null> => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdTokenResult();
    }
    return null;
  };


  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, signInWithGoogle, logOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
