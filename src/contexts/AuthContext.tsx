import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  gender: 'male' | 'female' | null;
  plan_type: 'free' | 'premium';
  subscription_status: 'active' | 'inactive' | 'cancelled';
  subscription_expires_at: string | null;
  hotmart_subscriber_code: string | null;
  cakto_subscriber_id: string | null;
  monthly_transactions_used: number;
  last_transaction_reset: string | null;
  is_admin: boolean;
  notification_settings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    budgetAlerts: boolean;
    recurringReminders: boolean;
  };
}

interface Couple {
  id: string;
  user1_id: string;
  user2_id: string;
  partner: Profile;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  couple: Couple | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  sendCoupleInvitation: (email: string) => Promise<{ error: any }>;
  acceptCoupleInvitation: (invitationId: string) => Promise<{ error: any }>;
  removeCoupleRelationship: () => Promise<{ error: any }>;
  checkTransactionLimit: () => Promise<boolean>;
  incrementTransactionCount: () => Promise<void>;
  completeUserRegistration: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('[AuthProvider] Inicializando auth...');
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthProvider] Erro ao obter sessão:', error);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }
        console.log('[AuthProvider] Sessão inicial:', session?.user?.id, session);
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('[AuthProvider] Erro no initializeAuth:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', event, session?.user?.id, session);
      if (!mounted || !initialized) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setCouple(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Se o perfil não existir, cria automaticamente
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating profile...');
          // Buscar email do usuário autenticado
          const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
          const email = user?.email || null;
          // Cria perfil mínimo (adicione outros campos obrigatórios se necessário)
          const { error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                email,
                is_admin: false,
                plan_type: 'free',
                subscription_status: 'inactive',
                updated_at: new Date().toISOString(),
              },
            ]);
          if (createError) {
            console.error('Error creating profile:', createError);
            setLoading(false);
            return;
          }
          // Buscar novamente o perfil
          return await fetchProfile(userId);
        }
        setLoading(false);
        throw error;
      }

      if (data) {
        console.log('Profile fetched successfully:', data);
        // Set admin status for the specific email
        if (data.email === 'marciojunior1993@gmail.com' && !data.is_admin) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ is_admin: true, plan_type: 'premium', subscription_status: 'active' })
            .eq('id', userId);
          if (!updateError) {
            data.is_admin = true;
            data.plan_type = 'premium';
            data.subscription_status = 'active';
          }
        }
        setProfile(data);
        await fetchCouple(userId);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const fetchCouple = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('couples')
        .select(`
          id,
          user1_id,
          user2_id,
          user1:user1_id(id, email, full_name, gender, avatar_url, phone, address, plan_type, subscription_status, subscription_expires_at, hotmart_subscriber_code, cakto_subscriber_id, monthly_transactions_used, last_transaction_reset, is_admin),
          user2:user2_id(id, email, full_name, gender, avatar_url, phone, address, plan_type, subscription_status, subscription_expires_at, hotmart_subscriber_code, cakto_subscriber_id, monthly_transactions_used, last_transaction_reset, is_admin)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .maybeSingle();

      if (error) {
        console.error('Error fetching couple:', error);
        return;
      }

      if (data) {
        // Garante que partner seja um objeto Profile ou null
        let partner: Profile | null = null;
        // Corrige acesso: user1 e user2 podem ser array ou objeto
        const user1 = Array.isArray(data.user1) ? data.user1[0] : data.user1;
        const user2 = Array.isArray(data.user2) ? data.user2[0] : data.user2;
        if (data.user1_id === userId && user2) {
          partner = {
            ...user2,
            avatar_url: user2.avatar_url || null,
            phone: user2.phone || null,
            address: user2.address || null,
            plan_type: user2.plan_type || 'free',
            subscription_status: user2.subscription_status || 'inactive',
            subscription_expires_at: user2.subscription_expires_at || null,
            hotmart_subscriber_code: user2.hotmart_subscriber_code || null,
            cakto_subscriber_id: user2.cakto_subscriber_id || null,
            monthly_transactions_used: user2.monthly_transactions_used || 0,
            last_transaction_reset: user2.last_transaction_reset || null,
            is_admin: user2.is_admin || false,
            gender: user2.gender || null,
            full_name: user2.full_name || null,
            email: user2.email || '',
            id: user2.id
          };
        } else if (data.user2_id === userId && user1) {
          partner = {
            ...user1,
            avatar_url: user1.avatar_url || null,
            phone: user1.phone || null,
            address: user1.address || null,
            plan_type: user1.plan_type || 'free',
            subscription_status: user1.subscription_status || 'inactive',
            subscription_expires_at: user1.subscription_expires_at || null,
            hotmart_subscriber_code: user1.hotmart_subscriber_code || null,
            cakto_subscriber_id: user1.cakto_subscriber_id || null,
            monthly_transactions_used: user1.monthly_transactions_used || 0,
            last_transaction_reset: user1.last_transaction_reset || null,
            is_admin: user1.is_admin || false,
            gender: user1.gender || null,
            full_name: user1.full_name || null,
            email: user1.email || '',
            id: user1.id
          };
        }
        setCouple({
          id: data.id,
          user1_id: data.user1_id,
          user2_id: data.user2_id,
          partner: partner as Profile // partner pode ser null, mas tipagem exige Profile
        });
      }
    } catch (error) {
      console.error('Error fetching couple:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Starting signup process for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        setLoading(false);
        return { error };
      }

      if (data.user && !data.session) {
        setLoading(false);
        return { 
          error: { 
            message: 'Por favor, verifique seu email para confirmar sua conta.' 
          } 
        };
      }

      return { error: null };
    } catch (error) {
      console.error('Signup catch error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Starting signin process for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Signin response:', { data, error });

      if (error) {
        console.error('Signin error:', error);
        setLoading(false);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Signin catch error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out...');
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
      } else {
        setProfile(null);
        setCouple(null);
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Signout catch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    try {
      console.log('Updating profile:', updates);
      
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        console.error('Update profile error:', error);
        return { error };
      } else {
        await fetchProfile(user.id);
        return { error: null };
      }
    } catch (error) {
      console.error('Update profile catch error:', error);
      return { error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const sendCoupleInvitation = async (email: string) => {
    try {
      // Chama a Edge Function invite-user
      console.log('Sending couple invitation to:', email)
      // Obtém o access_token da sessão atual (Supabase v2)
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || '';
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email,
            invitedById: user?.id
          }),
        }
      );
      
      let result: any = null;
      try {
        result = await response.json();
      } catch (e) {
        console.error('Error parsing JSON response:', e)
        return { error: 'Erro ao interpretar resposta da função.' }
      }
      
      if (!response.ok) {
        console.error('Error sending invitation:', result?.error)
        return { error: result?.error || 'Erro ao convidar usuário' }
      }
      
      // Refresh profile data to get updated invitations
      await refreshProfile()
      
      return { error: null, data: result }
    } catch (error) {
      console.error('Error sending invitation (catch):', error)
      return { error: 'Erro inesperado ao enviar convite' }
    }
  }

  const cancelCoupleInvitation = async (invitationId: string, recipientEmail: string) => {
    try {
      // Delete the invitation
      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)
        .eq('sender_id', user?.id)

      if (deleteError) {
        console.error('Error deleting invitation:', deleteError)
        return { error: 'Erro ao cancelar convite' }
      }

      // Try to cleanup orphaned user (only if they have no accepted invitations or expenses)
      try {
        await supabase.rpc('cleanup_orphaned_user', {
          _user_email: recipientEmail
        })
      } catch (cleanupError) {
        console.warn('Could not cleanup orphaned user:', cleanupError)
        // Don't fail the cancellation if cleanup fails
      }

      // Refresh profile data
      await refreshProfile()
      
      return { error: null }
    } catch (error) {
      console.error('Error canceling invitation:', error)
      return { error: 'Erro inesperado ao cancelar convite' }
    }
  };

  const acceptCoupleInvitation = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_couple_invitation', {
        invitation_id: invitationId
      })

      if (error) {
        console.error('Error accepting invitation:', error);
        return { error: { message: error.message || 'Erro ao aceitar convite' } };
      }

      if (data && data.error) {
        return { error: { message: data.error } };
      }

      await refreshProfile();
      return { error: null }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      return { error: { message: 'Erro inesperado ao aceitar convite' } }
    } 
  };

  const removeCoupleRelationship = async () => {
    if (!couple) return { error: new Error('No couple relationship found') };

    try {
      const { error } = await supabase
        .from('couples')
        .delete()
        .eq('id', couple.id);

      if (error) {
        console.error('Error removing couple relationship:', error);
        return { error };
      }

      setCouple(null);
      return { error: null };
    } catch (error) {
      console.error('Error removing couple relationship:', error);
      return { error };
    }
  };

  const checkTransactionLimit = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_transaction_limit');
      
      if (error) {
        console.error('Error checking transaction limit:', error)
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error checking transaction limit:', error);
      return false;
    }
  };

  const incrementTransactionCount = async () => {
    try {
      const { error } = await supabase.rpc('increment_transaction_count');
      
      if (error) {
        console.error('Error incrementing transaction count:', error)
      } else {
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error incrementing transaction count:', error);
    }
  };

  const completeUserRegistration = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Completing user registration for:', email)
      
      const { data, error } = await supabase.rpc('complete_user_registration_improved', {
        user_email: email,
        user_password: password,
        full_name: fullName
      })

      console.log('Registration completion response:', { data, error })

      if (error) {
        console.error('Error completing registration:', error)
        return { error: { message: error.message || 'Erro ao finalizar cadastro' } }
      }

      if (data && !data.success) {
        return { error: { message: data.error } }
      }

      return { error: null };
    } catch (error) {
      console.error('Error completing registration:', error);
      return { error: { message: 'Erro inesperado ao finalizar cadastro' } };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        couple,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
        sendCoupleInvitation,
        acceptCoupleInvitation,
        cancelCoupleInvitation,
        removeCoupleRelationship,
        checkTransactionLimit,
        incrementTransactionCount,
        completeUserRegistration,
      }}
    >
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