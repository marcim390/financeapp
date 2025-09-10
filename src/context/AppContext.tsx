import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Expense, Category, RecurringExpense, NotificationSettings } from '../types';

interface AppContextType {
  coupleMode: boolean;
  setCoupleMode: (mode: boolean) => void;
  partnerProfile: any;
  refreshPartnerProfile: () => Promise<void>;
  hasPartner: boolean;
  expenses: Expense[];
  categories: Category[];
  recurringExpenses: RecurringExpense[];
  notificationSettings: NotificationSettings;
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: any;
  users: any[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    budgetAlerts: true,
    recurringReminders: true,
  });
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const { user, profile } = useAuth();

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

  const fetchExpenses = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false });

      if (coupleMode && partnerProfile) {
        query = query.in('user_id', [user.id, partnerProfile.id]);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching expenses:', error);
        return;
      }

      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchRecurringExpenses = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('recurring_expenses')
        .select(`
          *,
          category:categories(*)
        `)
        .order('name');

      if (coupleMode && partnerProfile) {
        query = query.in('user_id', [user.id, partnerProfile.id]);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recurring expenses:', error);
        return;
      }

      setRecurringExpenses(data || []);
    } catch (error) {
      console.error('Error fetching recurring expenses:', error);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchExpenses(),
      fetchCategories(),
      fetchRecurringExpenses(),
    ]);
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: user.id }]);

      if (error) {
        console.error('Error adding expense:', error);
        throw error;
      }

      await fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update(expense)
        .eq('id', id);

      if (error) {
        console.error('Error updating expense:', error);
        throw error;
      }

      await fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting expense:', error);
        throw error;
      }

      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ ...category, user_id: user.id }]);

      if (error) {
        console.error('Error adding category:', error);
        throw error;
      }

      await fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id);

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }

      await fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }

      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      refreshPartnerProfile();
      setCurrentUser(profile);
    } else {
      setPartnerProfile(null);
      setHasPartner(false);
      setCoupleMode(false);
      setExpenses([]);
      setCategories([]);
      setRecurringExpenses([]);
      setCurrentUser(null);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, coupleMode, partnerProfile]);

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
    expenses,
    categories,
    recurringExpenses,
    notificationSettings,
    currentView,
    setCurrentView,
    currentUser,
    users,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};