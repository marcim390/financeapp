import React, { useState } from 'react';
import { X, Crown, Check, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionModalProps {
  onClose: () => void;
}

export function SubscriptionModal({ onClose }: SubscriptionModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    
    // Cakto checkout URL - replace with your actual product URL
    const caktoUrl = 'https://pay.cakto.com.br/hxdqzva_438995';
    
    // Add user email as parameter for better UX
    const urlWithEmail = `${caktoUrl}?email=${encodeURIComponent(profile?.email || '')}`;
    
    // Open Cakto checkout in new window
    window.open(urlWithEmail, '_blank', 'width=800,height=600');
    
    setLoading(false);
    onClose();
  };

  const features = [
    'Transações ilimitadas',
    'Dashboard completo com gráficos avançados',
    'Categorias ilimitadas',
    'Despesas recorrentes',
    'Notificações inteligentes',
    'Controle para casais',
    'Relatórios detalhados',
    'Suporte prioritário',
    'Backup automático na nuvem'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Crown className="text-yellow-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Upgrade para Premium</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Current Plan Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Plano atual:</strong> {profile?.plan_type === 'premium' ? 'Premium' : 'Gratuito'}
            </p>
            {profile?.plan_type === 'free' && (
              <p className="text-sm text-blue-600 mt-1">
                Você está usando o plano gratuito com funcionalidades limitadas.
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">R$ 19,90</div>
            <p className="text-gray-600">por mês</p>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block mt-2">
              7 dias grátis
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">O que você terá acesso:</h3>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <Check className="text-green-500 flex-shrink-0" size={16} />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">🚀 Por que escolher o Premium?</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Controle financeiro completo sem limitações</li>
              <li>• Ideal para casais que querem organizar as finanças</li>
              <li>• Nunca mais esqueça um pagamento importante</li>
              <li>• Relatórios detalhados para tomar melhores decisões</li>
            </ul>
          </div>

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <CreditCard size={20} />
            <span>{loading ? 'Redirecionando...' : 'Assinar Premium'}</span>
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Pagamento seguro processado pela Hotmart. Cancele quando quiser.
          </p>
        </div>
      </div>
    </div>
  );
}