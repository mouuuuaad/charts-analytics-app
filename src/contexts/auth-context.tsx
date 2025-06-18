
'use client';

import type { User as FirebaseUser, IdTokenResult } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { auth } from '@/config/firebase';
// import {
//   onAuthStateChanged,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   UserCredential,
// } from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import type { AuthFormData } from '@/types';
// import { useRouter } from 'next/navigation';


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
  const user = null; // User is always null
  const loading = false; // Loading is always false
  // const router = useRouter(); // Not needed if logout doesn't redirect globally

  // useEffect(() => {
  //   // const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  //   //   setUser(currentUser);
  //   //   setLoading(false);
  //   // });
  //   // return () => unsubscribe();
  //   // Authentication is disabled, so no listener needed.
  // }, []);

  const signUp = async (data: AuthFormData): Promise<UserCredential | string> => {
    console.log('Sign up disabled temporarily', data);
    // Simulate a delay if needed, then return a message
    // await new Promise(resolve => setTimeout(resolve, 500));
    return "Authentication is temporarily disabled.";
  };

  const logIn = async (data: AuthFormData): Promise<UserCredential | string> => {
    console.log('Log in disabled temporarily', data);
    // Simulate a delay if needed, then return a message
    // await new Promise(resolve => setTimeout(resolve, 500));
    return "Authentication is temporarily disabled.";
  };

  const logOut = async () => {
    console.log('Log out disabled temporarily');
    // setUser(null); // User is already always null
    // No global redirect from here, pages should handle their state
    return Promise.resolve();
  };
  
  const getToken = async (): Promise<IdTokenResult | null> => {
    console.log('Get token disabled temporarily');
    return Promise.resolve(null);
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
