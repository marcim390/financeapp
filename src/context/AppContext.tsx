import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AppContextType {
  coupleMode: boolean;
  setCoupleMode: (mode: boolean) => void;
  partnerProfile: any;
  refreshPartnerProfile: () => Promise<void>;
  hasPartner: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [coupleMode, setCoupleMode] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [hasPartner, setHasPartner] = useState(false);
  const { user } = useAuth();

  const refreshPartnerProfile = async () => {
    if (!user) return;

    try {
      // Get current user's profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!currentProfile?.couple_id) {
        setPartnerProfile(null);
        setHasPartner(false);
        setCoupleMode(false);
        return;
      }

      // Get partner's profile
      const { data: partner } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_id', currentProfile.couple_id)
        .neq('id', user.id)
        .single();

      if (partner) {
        setPartnerProfile(partner);
        setHasPartner(true);
      } else {
        setPartnerProfile(null);
        setHasPartner(false);
        setCoupleMode(false);
      }
    } catch (error) {
      console.error('Error fetching partner profile:', error);
      setPartnerProfile(null);
      setHasPartner(false);
      setCoupleMode(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshPartnerProfile();
    } else {
      setPartnerProfile(null);
      setHasPartner(false);
      setCoupleMode(false);
    }
  }, [user]);

  const value = {
    coupleMode,
    setCoupleMode: (mode: boolean) => {
      if (mode && !hasPartner) {
        console.warn('Cannot enable couple mode without a partner');
        return;
      }
      setCoupleMode(mode);
    },
    partnerProfile,
    refreshPartnerProfile,
    hasPartner,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};