import React, { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import logoMain from './assets/logos/logo-principal.png';
import { RotinaPosto } from './pages/RotinaPosto';
import api from './services/api';
import { LoginResponse, User } from './types';

const TOKEN_KEY = '@PostoApp:token';
const USER_KEY = '@PostoApp:user';

function App() {
  const [email, setEmail] = useState('frentista@posto.com');
  const [password, setPassword] = useState('123456');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (token && storedUser) {
      setUser(JSON.parse(storedUser) as User);
    }
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post<LoginResponse>('/login', { email, password });
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      setUser(response.data.user);
    } catch (_error) {
      setMessage('Falha no login. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setEmail('frentista@posto.com');
    setPassword('123456');
    setMessage('Sessao encerrada.');
  };

  if (user) {
    return (
      <>
        <RotinaPosto onLogout={handleLogout} user={user} />
        <Analytics />
      </>
    );
  }

  return (
    <>
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
                onChange={(event) => setEmail(event.target.value)}
                placeholder="frentista@posto.com"
                type="email"
                value={email}
              />
            </label>

            <label>
              Senha
              <input
                onChange={(event) => setPassword(event.target.value)}
                placeholder="123456"
                type="password"
                value={password}
              />
            </label>

            <button disabled={loading} type="submit">
              {loading ? 'Entrando...' : 'Entrar no sistema'}
            </button>
          </form>
        </section>
      </main>
      <Analytics />
    </>
  );
}

export default App;
