
'use client';

import type { User as FirebaseUser, IdTokenResult } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/config/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
} from 'firebase/auth';
import type { AuthFormData } from '@/types';
import { useRouter } from 'next/navigation';


interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signUp: (data: AuthFormData) => Promise<UserCredential | string>;
  logIn: (data: AuthFormData) => Promise<UserCredential | string>;
  logOut: () => Promise<void>;
  getToken: () => Promise<IdTokenResult | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (data: AuthFormData): Promise<UserCredential | string> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      return userCredential;
    } catch (error: any) {
      return error.message || "Failed to sign up.";
    }
  };

  const logIn = async (data: AuthFormData): Promise<UserCredential | string> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      return userCredential;
    } catch (error: any) {
      return error.message || "Failed to log in.";
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setUser(null); 
      router.push('/login'); 
    } catch (error: any) {
      console.error("Logout error:", error.message);
    }
  };
  
  const getToken = async (): Promise<IdTokenResult | null> => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdTokenResult();
    }
    return null;
  };


  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, getToken }}>
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
