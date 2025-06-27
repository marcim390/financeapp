import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// import { supabase } from '../../lib/supabase';
import { Mail, Lock, Save } from 'lucide-react';

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('E-mail não encontrado no link.');
      return;
    }
    if (!password || password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    // Chama apenas a Edge Function para definir a senha do usuário já existente
    try {
      const response = await fetch('https://inzvsgfsxgdyxoirketi.supabase.co/functions/v1/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || 'Erro ao definir senha.');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('Erro inesperado ao definir senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-blue-700">Definir Nova Senha</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite a nova senha"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirme a nova senha"
                required
              />
            </div>
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">Senha definida com sucesso! Redirecionando...</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            <span>{loading ? 'Salvando...' : 'Definir Senha'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
