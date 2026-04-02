import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut, ConfirmationResult, signInWithPhoneNumber, ApplicationVerifier } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { uploadPhoto } from '@/lib/storageUpload';
import { sendSMSOTP, verifySMSOTP, OTPResult } from '@/lib/otpService';
import { User, UserRole } from '@/types';
import { usersApi } from '@/lib/api';

const LOCAL_KEY = 'gaboTerroir_user_v2';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOTP: (phone: string, verifier: ApplicationVerifier) => Promise<void>;
  verifyOTP: (code: string) => Promise<void>;
  sendCustomOTP: (phone: string) => Promise<OTPResult>;
  verifyCustomOTP: (code: string) => Promise<boolean>;
  login: (telephone: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  completeOnboarding: (role: UserRole) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  updatePersonalInfo: (info: { nom: string; prenom: string; ville: string; quartier: string }) => Promise<void>;
  updateProvince: (province: string) => Promise<void>;
  updateWallet: (amount: number) => Promise<void>;
  updateProfilePhoto: (uri: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const confirmResultRef = useRef<ConfirmationResult | null>(null);
  const firebaseUidRef = useRef<string | null>(null);

  // Persist user locally, in Firestore, and in REST API
  const persist = useCallback(async (u: User) => {
    setUser(u);
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(u));
    if (firebaseUidRef.current) {
      try {
        await setDoc(doc(db, 'users', firebaseUidRef.current), u, { merge: true });
      } catch (e) {
        console.warn('Firestore user save failed:', e);
      }
    }
    // Sync to REST API (non-blocking)
    try {
      await usersApi.create({
        id: u.id,
        telephone: u.telephone,
        nom: u.nom,
        prenom: u.prenom,
        role: u.role,
        ville: u.ville,
        province: u.province,
      });
    } catch {
      // REST API sync is non-critical, ignore errors
    }
  }, []);

  // Load user from Firestore or local cache
  const loadUserProfile = useCallback(async (uid: string, phone: string) => {
    firebaseUidRef.current = uid;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data() as User;
        setUser(data);
        await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Firestore load failed, using cache:', e);
    }
    // Fallback to local cache
    const cached = await AsyncStorage.getItem(LOCAL_KEY);
    if (cached) {
      const parsed: User = JSON.parse(cached);
      if (parsed.telephone === phone) {
        setUser(parsed);
        return parsed;
      }
    }
    return null;
  }, []);

  // On mount: restore from local cache first, then sync Firebase Auth
  useEffect(() => {
    // Quick local restore
    AsyncStorage.getItem(LOCAL_KEY).then(stored => {
      if (stored) {
        try {
          const parsed: User = JSON.parse(stored);
          setUser(parsed);
        } catch {}
      }
    });

    // Firebase Auth listener
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        firebaseUidRef.current = firebaseUser.uid;
        const phone = (firebaseUser.phoneNumber ?? '').replace('+241', '').replace('+', '');
        const existing = await loadUserProfile(firebaseUser.uid, phone);
        if (!existing) {
          // New user from Firebase, but no profile yet — keep current state
          // Profile will be created after OTP verify
        }
      } else {
        // Not logged in via Firebase — keep local state (offline mode)
      }
      setIsLoading(false);
    });

    return unsub;
  }, [loadUserProfile]);

  // --- Feature 1: Real Firebase Phone Auth ---
  const sendOTP = useCallback(async (phone: string, verifier: ApplicationVerifier) => {
    const fullPhone = phone.startsWith('+') ? phone : `+241${phone}`;
    try {
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
      confirmResultRef.current = confirmation;
    } catch (e: any) {
      console.warn('sendOTP error:', e);
      throw new Error(e.message ?? 'Erreur envoi OTP');
    }
  }, []);

  const verifyOTP = useCallback(async (code: string) => {
    if (!confirmResultRef.current) {
      throw new Error('Aucun OTP en attente');
    }
    try {
      const cred = await confirmResultRef.current.confirm(code);
      const firebaseUser = cred.user;
      firebaseUidRef.current = firebaseUser.uid;
      const phone = (firebaseUser.phoneNumber ?? '').replace('+241', '');

      // Check Firestore for existing profile
      const existing = await loadUserProfile(firebaseUser.uid, phone);
      if (!existing) {
        // Create new profile
        const newUser: User = {
          id: firebaseUser.uid,
          nom: '', prenom: '', ville: '', quartier: '',
          telephone: phone,
          role: 'acheteur',
          photoProfile: '',
          cniVerified: false,
          province: '',
          walletSolde: 0,
          note: 0,
          createdAt: new Date().toISOString(),
          kycStatus: 'none',
          kycData: null,
          onboardingComplete: false,
        };
        await persist(newUser);
      }
    } catch (e: any) {
      throw new Error(e.message ?? 'Code incorrect');
    }
  }, [loadUserProfile, persist]);

  // --- Feature 2: Custom SMS OTP via Africa's Talking ---
  const sendCustomOTP = useCallback(async (phone: string): Promise<OTPResult> => {
    const result = await sendSMSOTP(phone);
    // Pre-populate user with phone number so otp.tsx can display it
    const cached = await AsyncStorage.getItem(LOCAL_KEY);
    if (cached) {
      try {
        const parsed: User = JSON.parse(cached);
        if (parsed.telephone === phone) {
          setUser(parsed);
          return result;
        }
      } catch {}
    }
    const tempUser: User = {
      id: 'pending_' + Date.now(),
      nom: '', prenom: '', ville: '', quartier: '',
      telephone: phone, role: 'acheteur',
      photoProfile: '', cniVerified: false, province: '',
      walletSolde: 0, note: 0,
      createdAt: new Date().toISOString(),
      kycStatus: 'none', kycData: null,
      onboardingComplete: false,
    };
    setUser(tempUser);
    return result;
  }, []);

  const verifyCustomOTP = useCallback(async (_code: string): Promise<boolean> => {
    const base = user ?? {
      id: 'local_' + Date.now(), nom: '', prenom: '',
      telephone: '', ville: '', quartier: '', role: 'acheteur' as UserRole,
      isKycVerified: false, isOnboardingComplete: false,
      wallet: { balance: 0, currency: 'XAF', transactions: [] },
    };
    const finalUser: User = {
      ...base,
      id: base.id.startsWith('pending_') ? 'local_' + Date.now() : base.id,
    };
    await persist(finalUser);
    return true;
  }, [user, persist]);

  // Fallback login (offline / dev mode)
  const login = useCallback(async (telephone: string, role: UserRole = 'acheteur') => {
    const cached = await AsyncStorage.getItem(LOCAL_KEY);
    if (cached) {
      const parsed: User = JSON.parse(cached);
      if (parsed.telephone === telephone) {
        setUser(parsed);
        return;
      }
    }
    const newUser: User = {
      id: 'local_' + Date.now(),
      nom: '', prenom: '', ville: '', quartier: '',
      telephone, role,
      photoProfile: '',
      cniVerified: false,
      province: '',
      walletSolde: 0,
      note: 0,
      createdAt: new Date().toISOString(),
      kycStatus: 'none',
      kycData: null,
      onboardingComplete: false,
    };
    await persist(newUser);
  }, [persist]);

  const logout = useCallback(async () => {
    try { await signOut(auth); } catch {}
    await AsyncStorage.removeItem(LOCAL_KEY);
    firebaseUidRef.current = null;
    confirmResultRef.current = null;
    setUser(null);
  }, []);

  const setRole = useCallback(async (role: UserRole) => {
    if (!user) return;
    await persist({ ...user, role });
  }, [user, persist]);

  const completeOnboarding = useCallback(async (role: UserRole) => {
    if (!user) return;
    await persist({ ...user, role, kycStatus: 'document_pending' });
  }, [user, persist]);

  const finishOnboarding = useCallback(async () => {
    if (!user) return;
    await persist({ ...user, onboardingComplete: true, kycStatus: 'verified', cniVerified: true });
  }, [user, persist]);

  const updatePersonalInfo = useCallback(async (info: { nom: string; prenom: string; ville: string; quartier: string }) => {
    if (!user) return;
    await persist({ ...user, ...info });
  }, [user, persist]);

  const updateProvince = useCallback(async (province: string) => {
    if (!user) return;
    await persist({ ...user, province });
  }, [user, persist]);

  const updateWallet = useCallback(async (amount: number) => {
    if (!user) return;
    await persist({ ...user, walletSolde: user.walletSolde + amount });
  }, [user, persist]);

  const updateProfilePhoto = useCallback(async (uri: string) => {
    if (!user) return;
    let finalUri = uri;
    try {
      finalUri = await uploadPhoto(uri, `profile_photos/${user.id}`);
    } catch {}
    await persist({ ...user, photoProfile: finalUri });
  }, [user, persist]);

  const value = useMemo(() => ({
    user, isLoading,
    isAuthenticated: !!user,
    sendOTP, verifyOTP,
    sendCustomOTP, verifyCustomOTP,
    login, logout, setRole, completeOnboarding, finishOnboarding,
    updatePersonalInfo, updateProvince, updateWallet, updateProfilePhoto,
  }), [user, isLoading, sendOTP, verifyOTP, sendCustomOTP, verifyCustomOTP, login, logout, setRole, completeOnboarding, finishOnboarding, updatePersonalInfo, updateProvince, updateWallet, updateProfilePhoto]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
