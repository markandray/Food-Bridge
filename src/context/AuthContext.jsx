import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { COLLECTIONS } from '../utils/constants';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser]   = useState(null);
  const [userProfile, setUserProfile]   = useState(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
          const userSnap   = await getDoc(userDocRef);

          if (userSnap.exists()) {
            setUserProfile(userSnap.data());
          } else {
            setUserProfile(null);
          }
          setCurrentUser(firebaseUser);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setCurrentUser(firebaseUser);
          setUserProfile(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const needsProfile = Boolean(currentUser && !userProfile);

  const value = {
    currentUser,
    userProfile,
    role:         userProfile?.role ?? null,
    loading,
    needsProfile,  
    refreshProfile: async () => {
      if (!currentUser) return;
      try {
        const userDocRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
        const userSnap   = await getDoc(userDocRef);
        if (userSnap.exists()) setUserProfile(userSnap.data());
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading FoodBridge...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};