import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan_type: 'free' | 'premium';
          subscription_status: 'active' | 'inactive' | 'cancelled';
          subscription_expires_at: string | null;
          hotmart_subscriber_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan_type?: 'free' | 'premium';
          subscription_status?: 'active' | 'inactive' | 'cancelled';
          subscription_expires_at?: string | null;
          hotmart_subscriber_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan_type?: 'free' | 'premium';
          subscription_status?: 'active' | 'inactive' | 'cancelled';
          subscription_expires_at?: string | null;
          hotmart_subscriber_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          category: string;
          date: string;
          person: 'person1' | 'person2' | 'shared';
          type: 'expense' | 'income';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          amount: number;
          category: string;
          date: string;
          person: 'person1' | 'person2' | 'shared';
          type: 'expense' | 'income';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          amount?: number;
          category?: string;
          date?: string;
          person?: 'person1' | 'person2' | 'shared';
          type?: 'expense' | 'income';
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          icon: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          icon: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      recurring_expenses: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          amount: number;
          category: string;
          person: 'person1' | 'person2' | 'shared';
          type: 'expense' | 'income';
          frequency: 'monthly' | 'weekly' | 'yearly';
          due_day: number;
          is_active: boolean;
          next_due_date: string;
          last_paid_date: string | null;
          notification_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          amount: number;
          category: string;
          person: 'person1' | 'person2' | 'shared';
          type: 'expense' | 'income';
          frequency: 'monthly' | 'weekly' | 'yearly';
          due_day: number;
          is_active?: boolean;
          next_due_date: string;
          last_paid_date?: string | null;
          notification_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          description?: string;
          amount?: number;
          category?: string;
          person?: 'person1' | 'person2' | 'shared';
          type?: 'expense' | 'income';
          frequency?: 'monthly' | 'weekly' | 'yearly';
          due_day?: number;
          is_active?: boolean;
          next_due_date?: string;
          last_paid_date?: string | null;
          notification_days?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};