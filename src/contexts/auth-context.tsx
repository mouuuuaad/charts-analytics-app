
'use client';

import type { User as FirebaseUser, IdTokenResult } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { auth } from '@/config/firebase'; // Firebase auth not used when disabled
// import {
//   onAuthStateChanged,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   UserCredential,
// } from 'firebase/auth';
import type { AuthFormData } from '@/types';
import { useRouter } from 'next/navigation';


interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signUp: (data: AuthFormData) => Promise<string>; // Simplified return type
  logIn: (data: AuthFormData) => Promise<string>; // Simplified return type
  logOut: () => Promise<void>;
  getToken: () => Promise<IdTokenResult | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(false); // Auth is disabled, so not loading
  const router = useRouter();

  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  //     setUser(currentUser);
  //     setLoading(false);
  //   });
  //   return () => unsubscribe();
  // }, []);

  const signUp = async (data: AuthFormData): Promise<string> => {
    console.log('Auth disabled: signUp called with', data);
    // Simulate successful signup without Firebase
    // setUser({ email: data.email, uid: 'mock-uid' } as FirebaseUser); // Or keep user null
    return "Signup successful (auth disabled).";
  };

  const logIn = async (data: AuthFormData): Promise<string> => {
    console.log('Auth disabled: logIn called with', data);
    // Simulate successful login without Firebase
    // setUser({ email: data.email, uid: 'mock-uid' } as FirebaseUser); // Or keep user null
    return "Login successful (auth disabled).";
  };

  const logOut = async () => {
    console.log('Auth disabled: logOut called');
    setUser(null); 
    // router.push('/login'); // No need to push to login if auth is off for the whole app
  };
  
  const getToken = async (): Promise<IdTokenResult | null> => {
    console.log('Auth disabled: getToken called');
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

