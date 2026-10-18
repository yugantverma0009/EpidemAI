import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type HealthProfile = {
  displayName: string;
  ageGroup: string;
  gender: string;
  preferredLanguage: string;
  state: string;
  district: string;
};

const emptyProfile: HealthProfile = {
  displayName: "",
  ageGroup: "",
  gender: "",
  preferredLanguage: "en",
  state: "",
  district: "",
};

const ProfileContext = createContext<{ profile: HealthProfile; setProfile: (profile: HealthProfile) => void; clearProfile: () => void } | null>(null);

export function HealthProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(emptyProfile);
  const value = useMemo(() => ({ profile, setProfile, clearProfile: () => setProfile(emptyProfile) }), [profile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useHealthProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useHealthProfile must be used within HealthProfileProvider");
  return context;
}
