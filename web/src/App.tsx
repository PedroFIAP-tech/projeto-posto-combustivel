import React, { useEffect, useState } from 'react';
import logoMain from './assets/logos/logo-principal.png';
import { PostoLoadingScreen } from './components/PostoLoadingScreen';
import { RotinaPosto } from './pages/RotinaPosto';
import api, { clearAuthToken, setAuthToken } from './services/api';
import { LoginResponse, User } from './types';

const LEGACY_TOKEN_KEY = '@PostoApp:token';
const LEGACY_USER_KEY = '@PostoApp:user';

type LoginCredentials = {
  email: string;
  password: string;
};

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    clearAuthToken();
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
  }, []);

  const authenticate = async ({ email: nextEmail, password: nextPassword }: LoginCredentials) => {
    const response = await api.post<LoginResponse>('/login', { email: nextEmail, password: nextPassword });
    setAuthToken(response.data.token);
    setEmail(nextEmail);
    setPassword('');
    setUser(response.data.user);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await authenticate({ email, password });
    } catch (_error) {
      setMessage('Falha no login. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (credentials: LoginCredentials) => {
    setMessage('');
    await authenticate(credentials);
  };

  const handleLogout = () => {
    clearAuthToken();
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    setUser(null);
    setEmail('');
    setPassword('');
    setMessage('Sessao encerrada.');
  };

  if (user) {
    return <RotinaPosto onLogout={handleLogout} onSwitchUser={handleSwitchUser} user={user} />;
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="login-brand">
          <img alt="Posto BR Control Center" src={logoMain} />
        </div>

        <h1>Acesso do Frentista</h1>
        <p>
          Teste como <strong>frentista@posto.com</strong> ou <strong>admin@posto.com</strong> usando
          a senha <strong>123456</strong>.
        </p>

        {message ? <div className="login-message">{message}</div> : null}

        <form className="login-form" onSubmit={handleLogin}>
          <label>
            E-mail
            <input
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="frentista@posto.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Senha
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="123456"
              required
              type="password"
              value={password}
            />
          </label>

          <button disabled={loading || !email.trim() || !password.trim()} type="submit">
            {loading ? 'Entrando...' : 'Entrar no sistema'}
          </button>
        </form>
      </section>
      {loading ? (
        <PostoLoadingScreen
          message="Validando credenciais e preparando seu painel."
          title="Entrando no posto"
        />
      ) : null}
    </main>
  );
}

export default App;
