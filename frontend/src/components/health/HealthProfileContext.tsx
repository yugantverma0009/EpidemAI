import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type HealthProfile = {
  displayName: string;
  ageGroup: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
  chronicConditions: string[];
  allergies: string;
  preferredLanguage: string;
};

export const emptyProfile: HealthProfile = {
  displayName: "",
  ageGroup: "",
  gender: "",
  bloodGroup: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  district: "",
  pincode: "",
  chronicConditions: [],
  allergies: "",
  preferredLanguage: "en",
};

const STORAGE_KEY = "epidemai_health_profile_v2";

export function calculateProfileCompletion(profile: HealthProfile): number {
  const weightedFields = [
    Boolean(profile.displayName.trim()),
    Boolean(profile.ageGroup),
    Boolean(profile.gender),
    Boolean(profile.state.trim()),
    Boolean(profile.district.trim()),
    Boolean(profile.address.trim()),
    Boolean(profile.bloodGroup),
    Boolean(profile.pincode.trim()),
  ];
  const filled = weightedFields.filter(Boolean).length;
  return Math.round((filled / weightedFields.length) * 100);
}

function loadInitialProfile(): HealthProfile {
  if (typeof window === "undefined") return emptyProfile;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProfile;
    const parsed = JSON.parse(raw);
    return {
      ...emptyProfile,
      ...parsed,
      chronicConditions: Array.isArray(parsed.chronicConditions) ? parsed.chronicConditions : [],
    };
  } catch {
    return emptyProfile;
  }
}

type ProfileContextType = {
  profile: HealthProfile;
  completion: number;
  setProfile: (profile: HealthProfile) => void;
  updateField: <K extends keyof HealthProfile>(key: K, value: HealthProfile[K]) => void;
  clearProfile: () => void;
};

const ProfileContext = createContext<ProfileContextType | null>(null);

export function HealthProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<HealthProfile>(loadInitialProfile);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // LocalStorage may be blocked; in-memory state will persist for active session
    }
  }, [profile]);

  const completion = useMemo(() => calculateProfileCompletion(profile), [profile]);

  const updateField = <K extends keyof HealthProfile>(key: K, value: HealthProfile[K]) => {
    setProfileState((prev) => ({ ...prev, [key]: value }));
  };

  const setProfile = (newProfile: HealthProfile) => {
    setProfileState(newProfile);
  };

  const clearProfile = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setProfileState(emptyProfile);
  };

  const value = useMemo(
    () => ({
      profile,
      completion,
      setProfile,
      updateField,
      clearProfile,
    }),
    [profile, completion]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useHealthProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useHealthProfile must be used within HealthProfileProvider");
  return context;
}
