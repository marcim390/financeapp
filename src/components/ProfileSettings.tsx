import React, { useState } from 'react';
import { X, Save, User, Phone, MapPin, Mail, Users, UserPlus, UserMinus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileSettingsProps {
  onClose: () => void;
}

export function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { profile, couple, updateProfile, sendCoupleInvitation, removeCoupleRelationship } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    gender: profile?.gender || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateProfile(formData);

    if (error) {
      alert('Erro ao atualizar perfil. Tente novamente.');
    } else {
      alert('Perfil atualizado com sucesso!');
    }

    setLoading(false);
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await sendCoupleInvitation(inviteEmail);

    if (error) {
      alert(error.message || 'Erro ao enviar convite. Tente novamente.');
    } else {
      alert('Convite enviado com sucesso!');
      setInviteEmail('');
      setShowInviteForm(false);
    }

    setLoading(false);
  };

  const handleRemoveCouple = async () => {
    if (!window.confirm('Tem certeza que deseja desfazer a relação com seu parceiro(a)?')) {
      return;
    }

    setLoading(true);
    const { error } = await removeCoupleRelationship();

    if (error) {
      alert('Erro ao remover relação. Tente novamente.');
    } else {
      alert('Relação removida com sucesso!');
    }

    setLoading(false);
  };

  const getGenderEmoji = (gender: string | null) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      default: return '👤';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configurações do Perfil</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Informações Pessoais</h3>
            
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={profile?.email || ''}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  disabled
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu endereço completo"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sexo
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    formData.gender === 'male'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  👨 Masculino
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    formData.gender === 'female'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  👩 Feminino
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </form>

          {/* Couple Management */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Relacionamento</h3>
            
            {couple ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="text-green-600" size={24} />
                    <div>
                      <p className="font-medium text-green-800">
                        Conectado com {getGenderEmoji(couple.partner.gender)} {couple.partner.full_name}
                      </p>
                      <p className="text-sm text-green-600">{couple.partner.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCouple}
                    disabled={loading}
                    className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <UserMinus size={16} />
                    <span>Desfazer</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!showInviteForm ? (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <UserPlus size={16} />
                    <span>Convidar Parceiro(a)</span>
                  </button>
                ) : (
                  <form onSubmit={handleSendInvitation} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email do Parceiro(a)
                      </label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="email@exemplo.com"
                        required
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowInviteForm(false);
                          setInviteEmail('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Enviando...' : 'Enviar Convite'}
                      </button>
                    </div>
                  </form>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Como funciona o convite:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Envie um convite para o email do seu parceiro(a)</li>
                        <li>• Ele(a) precisará aceitar o convite para conectar os perfis</li>
                        <li>• Vocês poderão compartilhar despesas e ver relatórios conjuntos</li>
                        <li>• Se um de vocês tiver plano premium, ambos terão acesso</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Limit Info for Free Users */}
          {profile?.plan_type === 'free' && (
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Limite de Transações</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="text-yellow-600" size={20} />
                  <p className="font-medium text-yellow-800">Plano Gratuito</p>
                </div>
                <p className="text-sm text-yellow-700 mb-2">
                  Você usou <strong>{profile.monthly_transactions_used}/5</strong> transações este mês.
                </p>
                <p className="text-xs text-yellow-600">
                  Upgrade para Premium e tenha transações ilimitadas!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}