import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DollarSign, Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, completeUserRegistration, loading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: searchParams.get('email') || '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  // Check if this is a completion flow (user invited)
  const isCompletionFlow = searchParams.has('email') && searchParams.has('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    // Validation
    if (!formData.fullName.trim()) {
      setError('Por favor, insira seu nome completo.');
      setFormLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Por favor, insira seu email.');
      setFormLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      setFormLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setFormLoading(false);
      return;
    }

    try {
      console.log('Submitting registration form...');
      
      let result;
      
      if (isCompletionFlow) {
        // Complete registration for invited user
        result = await completeUserRegistration(
          formData.email.trim(), 
          formData.password, 
          formData.fullName.trim()
        );
      } else {
        // Normal signup flow
        result = await signUp(formData.email.trim(), formData.password, formData.fullName.trim());
      }

      const { error } = result;

      if (error) {
        console.error('Registration error:', error);
        
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          setError('Este email já está cadastrado. Tente fazer login ou use outro email.');
        } else if (error.message.includes('email')) {
          setEmailConfirmationRequired(true);
        } else if (error.message.includes('Password')) {
          setError('A senha deve ter pelo menos 6 caracteres.');
        } else if (error.message.includes('Invalid email')) {
          setError('Por favor, insira um email válido.');
        } else {
          setError(error.message || 'Erro ao criar conta. Tente novamente.');
        }
      } else {
        console.log('Registration successful');
        setSuccess(true);
        setTimeout(() => {
          navigate('/app/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error during registration:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  const isLoading = loading || formLoading;

  if (emailConfirmationRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Verifique seu email</h1>
            <p className="text-gray-600 mb-6">
              Enviamos um link de confirmação para <strong>{formData.email}</strong>. 
              Clique no link para ativar sua conta.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Ir para Login
              </button>
              <button
                onClick={() => {
                  setEmailConfirmationRequired(false);
                  setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
                }}
                className="w-full text-gray-600 hover:text-gray-900 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {isCompletionFlow ? 'Cadastro finalizado com sucesso!' : 'Conta criada com sucesso!'}
            </h1>
            <p className="text-gray-600 mb-6">
              Bem-vindo ao FinanceApp! Você será redirecionado em instantes...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back to Home */}
        {!isCompletionFlow && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
            disabled={isLoading}
          >
            <ArrowLeft size={20} />
            <span>Voltar ao início</span>
          </button>
        )}

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold text-gray-900">FinanceApp</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isCompletionFlow ? 'Finalize seu cadastro' : 'Crie sua conta grátis'}
            </h1>
            <p className="text-gray-600">
              {isCompletionFlow 
                ? 'Defina sua senha para acessar sua conta' 
                : 'Comece a controlar suas finanças hoje mesmo'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome completo"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                  disabled={isLoading || isCompletionFlow}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar senha *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirme sua senha"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            {!isCompletionFlow && (
              <div className="text-sm text-gray-600">
                Ao criar uma conta, você concorda com nossos{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-700">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-700">
                  Política de Privacidade
                </Link>
                .
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{isCompletionFlow ? 'Finalizando...' : 'Criando conta...'}</span>
                </>
              ) : (
                <span>{isCompletionFlow ? 'Finalizar cadastro' : 'Criar conta grátis'}</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          {!isCompletionFlow && (
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Já tem uma conta?{' '}
                <Link
                  to="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Faça login
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}