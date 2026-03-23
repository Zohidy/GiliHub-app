import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileModalContextType {
  openProfile: (userId: string) => void;
  closeProfile: () => void;
  selectedUserId: string | null;
}

const ProfileModalContext = createContext<ProfileModalContextType | undefined>(undefined);

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const openProfile = (userId: string) => {
    setSelectedUserId(userId);
  };

  const closeProfile = () => {
    setSelectedUserId(null);
  };

  return (
    <ProfileModalContext.Provider value={{ openProfile, closeProfile, selectedUserId }}>
      {children}
    </ProfileModalContext.Provider>
  );
}

export function useProfileModal() {
  const context = useContext(ProfileModalContext);
  if (context === undefined) {
    throw new Error('useProfileModal must be used within a ProfileModalProvider');
  }
  return context;
}
