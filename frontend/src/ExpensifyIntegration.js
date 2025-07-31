import React, { useState, useEffect } from 'react';
import { Upload, FileText, Eye, EyeOff, User, LogOut } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ExpensifyIntegration() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPassword, setShowPassword] = useState(false);

  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    partner_user_id: '',
    partner_user_secret: '',
    policy_id: ''
  });

  const [uploadForm, setUploadForm] = useState({
    file: null,
    employee_email: ''
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      checkAuth(storedToken);
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      const response = await fetch(`${API_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        setUploadForm(prev => ({ ...prev, employee_email: data.user.email }));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    }
  };

  const handleAuth = async () => {
    if (!authForm.email || !authForm.password) {
      setMessage({ type: 'error', text: 'Email e senha são obrigatórios' });
      return;
    }

    if (authMode === 'register' && (!authForm.partner_user_id || !authForm.partner_user_secret || !authForm.policy_id)) {
      setMessage({ type: 'error', text: 'Todos os campos são obrigatórios' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const body = authMode === 'login' 
        ? { email: authForm.email, password: authForm.password }
        : authForm;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        setIsAuthenticated(true);
        setUploadForm(prev => ({ ...prev, employee_email: data.user.email }));
        setMessage({ type: 'success', text: 'Autenticação realizada com sucesso!' });
        setAuthForm({ email: '', password: '', partner_user_id: '', partner_user_secret: '', policy_id: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro na autenticação' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setMessage({ type: 'success', text: 'Logout realizado com sucesso' });
  };

  const handleFileUpload = async () => {
    if (!uploadForm.file) {
      setMessage({ type: 'error', text: 'Selecione um arquivo' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('employee_email', uploadForm.employee_email);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `${data.expense_count} despesas processadas com sucesso!` 
        });
        setUploadForm(prev => ({ ...prev, file: null }));
        document.getElementById('fileInput').value = '';
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro no upload' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Expensify Integration</h1>
            <p className="text-blue-200">
              {authMode === 'login' ? 'Entre na sua conta' : 'Crie uma nova conta'}
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Email"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"
                placeholder="Senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {authMode === 'register' && (
              <>
                <input
                  type="text"
                  value={authForm.partner_user_id}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, partner_user_id: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Partner User ID"
                />
                <input
                  type="password"
                  value={authForm.partner_user_secret}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, partner_user_secret: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Partner User Secret"
                />
                <input
                  type="text"
                  value={authForm.policy_id}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, policy_id: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Policy ID"
                />
              </>
            )}

            {message.text && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-500/20 text-green-300' 
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Processando...' : (authMode === 'login' ? 'Entrar' : 'Criar Conta')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-blue-300 hover:text-blue-200 font-medium"
            >
              {authMode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-8 border border-white/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Expensify Integration</h1>
                <p className="text-blue-200">Bem-vindo, {user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Upload de Despesas</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Email do Funcionário
              </label>
              <input
                type="email"
                value={uploadForm.employee_email}
                onChange={(e) => setUploadForm(prev => ({ ...prev, employee_email: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Arquivo Excel (.xls, .xlsx)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/20 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-white/50" />
                  <div className="flex text-sm text-white/70">
                    <label className="relative cursor-pointer rounded-md font-medium text-blue-300 hover:text-blue-200">
                      <span>Upload arquivo</span>
                      <input
                        id="fileInput"
                        type="file"
                        className="sr-only"
                        accept=".xls,.xlsx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadForm(prev => ({ ...prev, file: e.target.files[0] }));
                          }
                        }}
                      />
                    </label>
                  </div>
                  {uploadForm.file && (
                    <p className="text-sm text-green-300 mt-2">
                      Selecionado: {uploadForm.file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {message.text && (
              <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                message.type === 'success' 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                <span>{message.text}</span>
              </div>
            )}

            <button
              onClick={handleFileUpload}
              disabled={loading || !uploadForm.file}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? 'Enviando...' : 'Fazer Upload'}
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Formato do Arquivo Excel</h3>
            <div className="space-y-2 text-sm text-blue-200">
              <p><strong className="text-white">Colunas esperadas:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code className="bg-white/10 px-2 py-1 rounded">Data</code> - Data da transação</li>
                <li><code className="bg-white/10 px-2 py-1 rounded">Movimentação</code> - Descrição/Merchant</li>
                <li><code className="bg-white/10 px-2 py-1 rounded">Valor em BRL</code> - Valor em reais</li>
                <li><code className="bg-white/10 px-2 py-1 rounded">Profissional</code> - Nome do funcionário</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
