import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Expense, Category, User, RecurringExpense, NotificationSettings } from '../types';

interface AppContextType {
  expenses: Expense[];
  categories: Category[];
  users: User[];
  recurringExpenses: RecurringExpense[];
  notificationSettings: NotificationSettings;
  currentView: 'individual' | 'couple';
  currentUser: string;
  loading: boolean;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addRecurringExpense: (expense: RecurringExpense) => Promise<void>;
  updateRecurringExpense: (expense: RecurringExpense) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  setCurrentView: (view: 'individual' | 'couple') => void;
  setCurrentUser: (userId: string) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultUsers: User[] = [
  { id: 'person1', name: 'Você', avatar: '👤' },
  { id: 'person2', name: 'Parceiro(a)', avatar: '👤' },
];

const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  daysBeforeDue: 3,
  emailNotifications: false,
  browserNotifications: true,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, profile, couple } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [currentView, setCurrentView] = useState<'individual' | 'couple'>('individual');
  const [currentUser, setCurrentUser] = useState<string>('person1');
  const [loading, setLoading] = useState(false);

  // Update users based on profile and couple data
  const users = React.useMemo(() => {
    if (!profile) return defaultUsers;
    
    const updatedUsers = [
      { 
        id: 'person1', 
        name: profile.full_name || 'Você', 
        avatar: profile.gender === 'male' ? '👨' : profile.gender === 'female' ? '👩' : '👤' 
      },
      { 
        id: 'person2', 
        name: couple?.partner?.full_name || 'Parceiro(a)', 
        avatar: couple?.partner?.gender === 'male' ? '👨' : couple?.partner?.gender === 'female' ? '👩' : '👤' 
      },
    ];
    
    return updatedUsers;
  }, [profile, couple]);

  // Load data when user changes
  useEffect(() => {
    if (user && profile) {
      refreshData();
    } else {
      // Clear data when user logs out
      setExpenses([]);
      setCategories([]);
      setRecurringExpenses([]);
    }
  }, [user, profile]);

  // Set default view based on couple status
  useEffect(() => {
    if (couple) {
      setCurrentView('couple');
    } else {
      setCurrentView('individual');
    }
  }, [couple]);

  const refreshData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadExpenses(),
        loadCategories(),
        loadRecurringExpenses(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    if (!user) return;

    try {
      // Load expenses for current user and their couple if exists
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)

      // If user is in a couple, also load partner's expenses
      if (couple) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

        query = query.or(`user_id.eq.${user.id},user_id.eq.${couple.partner.id}`)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) {
        console.error('Error loading expenses:', error)
        return
      }

      const formattedExpenses: Expense[] = data.map(expense => ({
      if (error) {
        console.error('Error loading expenses:', error);
        return;
      }

      const formattedExpenses: Expense[] = data.map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: parseFloat(expense.amount),
        category: expense.category,
        date: expense.date,
        person: expense.person,
        type: expense.type,
      }));

      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } 
  };

  const loadCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      const formattedCategories: Category[] = data.map(category => ({
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
      }));

      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadRecurringExpenses = async () => {
    if (!user) return;

    try {
      // Load recurring expenses for current user and their couple if exists
      let query = supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', user.id)

      // If user is in a couple, also load partner's recurring expenses
      if (couple) {
    try {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date');

        query = query.or(`user_id.eq.${user.id},user_id.eq.${couple.partner.id}`)
      }

      const { data, error } = await query.order('next_due_date')

      if (error) {
        console.error('Error loading recurring expenses:', error)
        return
      }

      const formattedRecurringExpenses: RecurringExpense[] = data.map(expense => ({
      if (error) {
        console.error('Error loading recurring expenses:', error);
        return;
      }

      const formattedRecurringExpenses: RecurringExpense[] = data.map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: parseFloat(expense.amount),
        category: expense.category,
        person: expense.person,
        type: expense.type,
        frequency: expense.frequency,
        dueDay: expense.due_day,
        isActive: expense.is_active,
        nextDueDate: expense.next_due_date,
        lastPaidDate: expense.last_paid_date,
        notificationDays: expense.notification_days,
      }));

      setRecurringExpenses(formattedRecurringExpenses);
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
    } 
  };

  const addExpense = async (expense: Expense) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          person: expense.person,
          type: expense.type,
        });

      if (error) {
        console.error('Error adding expense:', error);
        throw error;
      }

      await loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const updateExpense = async (expense: Expense) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          person: expense.person,
          type: expense.type,
        })
        .eq('id', expense.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating expense:', error);
        throw error;
      }

      await loadExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting expense:', error);
        throw error;
      }

      await loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  const addCategory = async (category: Category) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: category.name,
          color: category.color,
          icon: category.icon,
        });

      if (error) {
        console.error('Error adding category:', error);
        throw error;
      }

      await loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (category: Category) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          color: category.color,
          icon: category.icon,
        })
        .eq('id', category.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }

      await loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }

      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const addRecurringExpense = async (expense: RecurringExpense) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .insert({
          user_id: user.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          person: expense.person,
          type: expense.type,
          frequency: expense.frequency,
          due_day: expense.dueDay,
          is_active: expense.isActive,
          next_due_date: expense.nextDueDate,
          last_paid_date: expense.lastPaidDate,
          notification_days: expense.notificationDays,
        });

      if (error) {
        console.error('Error adding recurring expense:', error);
        throw error;
      }

      await loadRecurringExpenses();
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      throw error;
    }
  };

  const updateRecurringExpense = async (expense: RecurringExpense) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          person: expense.person,
          type: expense.type,
          frequency: expense.frequency,
          due_day: expense.dueDay,
          is_active: expense.isActive,
          next_due_date: expense.nextDueDate,
          last_paid_date: expense.lastPaidDate,
          notification_days: expense.notificationDays,
        })
        .eq('id', expense.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating recurring expense:', error);
        throw error;
      }

      await loadRecurringExpenses();
    } catch (error) {
      console.error('Error updating recurring expense:', error);
      throw error;
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting recurring expense:', error);
        throw error;
      }

      await loadRecurringExpenses();
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      throw error;
    }
  };

  const updateNotificationSettings = (settings: NotificationSettings) => {
    setNotificationSettings(settings);
    // Save to localStorage for persistence
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  };

  // Load notification settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      try {
        setNotificationSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        expenses,
        categories,
        users,
        recurringExpenses,
        notificationSettings,
        currentView,
        currentUser,
        loading,
        addExpense,
        updateExpense,
        deleteExpense,
        addCategory,
        updateCategory,
        deleteCategory,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        updateNotificationSettings,
        setCurrentView,
        setCurrentUser,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}