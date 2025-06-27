import React, { useState, useEffect } from 'react';
import { Users, User, Settings, Plus, Bell, Crown, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

interface HeaderProps {
  onAddExpense: () => void;
  onSettings: () => void;
  onNotificationSettings: () => void;
  onUpgrade: () => void;
  onProfileSettings: () => void;
}

export function Header({ onAddExpense, onSettings, onNotificationSettings, onUpgrade, onProfileSettings }: HeaderProps) {
  const { currentView, setCurrentView, users, currentUser, setCurrentUser } = useApp();
  const { profile, couple, signOut } = useAuth();
  const { notificationCount } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
  };

  const getGenderEmoji = (gender: string | null) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      default: return '👤';
    }
  };

  const getDisplayName = () => {
    if (currentView === 'individual') {
      return `${getGenderEmoji(profile?.gender)} ${profile?.full_name || 'Usuário'}`;
    }
    return couple ? `${getGenderEmoji(profile?.gender)} ${profile?.full_name} & ${getGenderEmoji(couple.partner.gender)} ${couple.partner.full_name}` : `${getGenderEmoji(profile?.gender)} ${profile?.full_name}`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">💰</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">FinanceApp</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Plan Badge */}
            {profile?.plan_type === 'premium' ? (
              <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                <Crown size={14} />
                <span>Premium</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500">
                  {profile?.monthly_transactions_used || 0}/5 transações
                </div>
                <button
                  onClick={onUpgrade}
                  className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <Crown size={14} />
                  <span>Upgrade</span>
                </button>
              </div>
            )}

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentView('individual')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'individual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User size={16} />
                <span>Individual</span>
              </button>
              <button
                onClick={() => setCurrentView('couple')}
                disabled={!couple}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'couple'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : couple 
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <Users size={16} />
                <span>Casal</span>
              </button>
            </div>

            {/* Current User Display */}
            <div className="text-sm font-medium text-gray-700">
              {getDisplayName()}
            </div>

            {/* Action Buttons */}
            <button
              onClick={onAddExpense}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Adicionar</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onNotificationSettings}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>

            <button
              onClick={onProfileSettings}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings size={20} />
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}