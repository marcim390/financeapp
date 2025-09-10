import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Dashboard } from './Dashboard';
import { ExpenseList } from './ExpenseList';
import { ExpenseForm } from './ExpenseForm';
import { CategoryManager } from './CategoryManager';
import { RecurringExpenses } from './RecurringExpenses';
import { NotificationSettings } from './NotificationSettings';
import { SubscriptionModal } from './SubscriptionModal';
import ProfileSettings from './ProfileSettings';
import { AdminPanel } from './AdminPanel';
import { AppProvider } from '../context/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, List, Settings, Home, Clock, Bell, Users, Crown } from 'lucide-react';
import { Expense, Category } from '../types';
import { CategoryListPage } from './CategoryListPage';

function FinanceAppContent() {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { profile, checkTransactionLimit, incrementTransactionCount } = useAuth();
  const { deleteCategory } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAddExpense = async () => {
    // Check transaction limit for free users
    if (profile?.plan_type === 'free') {
      const canAdd = await checkTransactionLimit();
      if (!canAdd) {
        setShowLimitModal(true);
        return;
      }
    }
    setEditingExpense(undefined);
    setShowExpenseForm(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleCloseExpenseForm = () => {
    setShowExpenseForm(false);
    setEditingExpense(undefined);
  };

  const handleSettings = () => {
    setShowCategoryManager(true);
  };

  const handleProfileSettings = () => {
    setShowProfileSettings(true);
  };

  const handleNotificationSettings = () => {
    setShowNotificationSettings(true);
  };

  const handleUpgrade = () => {
    setShowSubscriptionModal(true);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'expenses', label: 'Transações', icon: List },
    { id: 'recurring', label: 'Despesas Fixas', icon: Clock, premium: true },
    { id: 'categories', label: 'Categorias', icon: Settings },
  ];

  // Add admin panel for admin users
  if (profile?.is_admin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: Crown });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onAddExpense={handleAddExpense} 
        onSettings={handleSettings}
        onProfileSettings={handleProfileSettings}
        onNotificationSettings={handleNotificationSettings}
        onUpgrade={handleUpgrade}
      />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isLocked = item.premium && profile?.plan_type !== 'premium';
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        if (isLocked) {
                          setShowSubscriptionModal(true);
                        } else {
                          navigate(`/app/${item.id}`);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors ${
                        location.pathname === `/app/${item.id}` && !isLocked
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : isLocked
                          ? 'text-gray-400 hover:bg-gray-50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {isLocked && (
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                          PRO
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expenses" element={<ExpenseList onEditExpense={handleEditExpense} />} />
            <Route 
              path="/recurring" 
              element={
                profile?.plan_type === 'premium' ? 
                <RecurringExpenses /> : 
                <Navigate to="dashboard" replace />
              } 
            />
            <Route path="/categories" element={
              <CategoryListPage
                onAddCategory={() => {
                  setEditingCategory(null);
                  setShowCategoryManager(true);
                }}
                onEditCategory={(cat) => {
                  setEditingCategory(cat);
                  setShowCategoryManager(true);
                }}
                onDeleteCategory={(id) => {
                  if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
                    deleteCategory(id);
                  }
                }}
              />
            } />
            {profile?.is_admin && (
              <Route path="/admin" element={<AdminPanel />} />
            )}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Modals */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <h2 className="text-lg font-bold text-gray-900">Limite Atingido</h2>
              <button onClick={() => setShowLimitModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="text-center mb-6">
              <p className="text-gray-700 text-base mb-2">Você atingiu o limite de <span className="font-bold text-blue-600">5 transações mensais</span> do plano gratuito.</p>
              <p className="text-gray-500 text-sm">Faça upgrade para o Premium e tenha transações ilimitadas!</p>
            </div>
            <button
              onClick={() => {
                setShowLimitModal(false);
                setShowSubscriptionModal(true);
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-2"
            >
              Ver Planos Premium
            </button>
            <button
              onClick={() => setShowLimitModal(false)}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showExpenseForm && (
        <ExpenseForm
          expense={editingExpense}
          onClose={handleCloseExpenseForm}
          onSave={incrementTransactionCount}
        />
      )}

      {showCategoryManager && (
        <CategoryManager
          onClose={() => setShowCategoryManager(false)}
          category={editingCategory}
        />
      )}

      {showProfileSettings && (
        <ProfileSettings onClose={() => setShowProfileSettings(false)} />
      )}

      {showNotificationSettings && (
        <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
      )}

      {showSubscriptionModal && (
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}
    </div>
  );
}

export function FinanceApp() {
  return (
    <AppProvider>
      <FinanceAppContent />
    </AppProvider>
  );
}