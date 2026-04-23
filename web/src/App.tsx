import React, { useEffect, useState } from 'react';
import api from './services/api';

type Fuel = {
  id: number;
  name: string;
  price_per_liter: number;
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Order = {
  id: number;
  total_value: number;
  liters_delivered: number;
  status: string;
  created_at: string;
  fuel: Fuel;
  user: User;
};

type LoginResponse = {
  token: string;
  user: User;
};

function App() {
  const [email, setEmail] = useState('admin@posto.com');
  const [password, setPassword] = useState('123456');
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [fuels, setFuels] = useState<Fuel[]>([]);
  const [selectedFuelId, setSelectedFuelId] = useState('');
  const [liters, setLiters] = useState('20');

  const loadDashboard = async () => {
    const [pendingResponse, historyResponse, fuelsResponse] = await Promise.all([
      api.get<Order[]>('/pedidos/pendentes'),
      api.get<Order[]>('/pedidos/historico'),
      api.get<Fuel[]>('/combustiveis'),
    ]);

    setPendingOrders(pendingResponse.data);
    setHistory(historyResponse.data);
    setFuels(fuelsResponse.data);

    setSelectedFuelId(current =>
      current || fuelsResponse.data.length === 0 ? current : String(fuelsResponse.data[0].id)
    );
  };

  useEffect(() => {
    const token = localStorage.getItem('@PostoApp:token');

    if (token) {
      setIsLogged(true);
    }
  }, []);

  useEffect(() => {
    if (!isLogged) {
      return;
    }

    void (async () => {
      try {
        const [pendingResponse, historyResponse, fuelsResponse] = await Promise.all([
          api.get<Order[]>('/pedidos/pendentes'),
          api.get<Order[]>('/pedidos/historico'),
          api.get<Fuel[]>('/combustiveis'),
        ]);

        setPendingOrders(pendingResponse.data);
        setHistory(historyResponse.data);
        setFuels(fuelsResponse.data);
        setSelectedFuelId(current =>
          current || fuelsResponse.data.length === 0 ? current : String(fuelsResponse.data[0].id)
        );
      } catch (_error) {
        setMessage('Nao foi possivel carregar o painel.');
      }
    })();

    const interval = window.setInterval(() => {
      void api
        .get<Order[]>('/pedidos/pendentes')
        .then(response => setPendingOrders(response.data))
        .catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isLogged]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post<LoginResponse>('/login', { email, password });
      localStorage.setItem('@PostoApp:token', response.data.token);
      setIsLogged(true);
      setMessage(`Painel conectado para ${response.data.user.name}.`);
    } catch (_error) {
      setMessage('Falha no login. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post('/bomba/abastecer', {
        fuelId: Number(selectedFuelId),
        liters: Number(liters),
      });

      await loadDashboard();
      setMessage('Abastecimento registrado com sucesso.');
    } catch (_error) {
      setMessage('Nao foi possivel registrar o abastecimento.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (orderId: number) => {
    setLoading(true);
    setMessage('');

    try {
      await api.patch(`/pedidos/${orderId}/pagar`);
      await loadDashboard();
      setMessage('Pagamento confirmado.');
    } catch (_error) {
      setMessage('Nao foi possivel confirmar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('@PostoApp:token');
    setIsLogged(false);
    setPendingOrders([]);
    setHistory([]);
    setFuels([]);
    setMessage('Sessao encerrada.');
  };

  const paidOrders = history.filter(order => order.status === 'PAGO');
  const totalPaid = paidOrders.reduce((sum, order) => sum + order.total_value, 0);

  return (
    <div style={pageStyle}>
      <div style={overlayStyle} />
      <main style={contentStyle}>
        <header style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>POSTO CONTROL CENTER</div>
            <h1 style={titleStyle}>Sistema de Gestao de Abastecimentos</h1>
            <p style={subtitleStyle}>
              Monitore pedidos, simule abastecimentos e conclua pagamentos em um unico painel.
            </p>
          </div>
          {isLogged ? (
            <button onClick={handleLogout} style={secondaryButtonStyle} type="button">
              Sair
            </button>
          ) : null}
        </header>

        {message ? <div style={messageStyle}>{message}</div> : null}

        {!isLogged ? (
          <section style={loginCardStyle}>
            <h2 style={sectionTitleStyle}>Acesso do Frentista</h2>
            <p style={sectionTextStyle}>
              Use o usuario padrao para testar: <strong>admin@posto.com</strong> /{' '}
              <strong>123456</strong>
            </p>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={event => setEmail(event.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={event => setPassword(event.target.value)}
                style={inputStyle}
              />
              <button disabled={loading} type="submit" style={primaryButtonStyle}>
                {loading ? 'Entrando...' : 'Entrar no painel'}
              </button>
            </form>
          </section>
        ) : (
          <section style={dashboardGridStyle}>
            <div style={leftColumnStyle}>
              <section style={cardStyle}>
                <h2 style={sectionTitleStyle}>Resumo</h2>
                <div style={statsGridStyle}>
                  <article style={statCardStyle}>
                    <span style={statLabelStyle}>Pendentes</span>
                    <strong style={statValueStyle}>{pendingOrders.length}</strong>
                  </article>
                  <article style={statCardStyle}>
                    <span style={statLabelStyle}>Pagos</span>
                    <strong style={statValueStyle}>{paidOrders.length}</strong>
                  </article>
                  <article style={statCardStyle}>
                    <span style={statLabelStyle}>Faturamento</span>
                    <strong style={statValueStyle}>R$ {totalPaid.toFixed(2)}</strong>
                  </article>
                </div>
              </section>

              <section style={cardStyle}>
                <h2 style={sectionTitleStyle}>Simular abastecimento</h2>
                <form onSubmit={handleCreateOrder}>
                  <select
                    value={selectedFuelId}
                    onChange={event => setSelectedFuelId(event.target.value)}
                    style={inputStyle}
                  >
                    {fuels.map(fuel => (
                      <option key={fuel.id} value={fuel.id}>
                        {fuel.name} - R$ {fuel.price_per_liter.toFixed(2)}/L
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={liters}
                    onChange={event => setLiters(event.target.value)}
                    style={inputStyle}
                  />

                  <button
                    disabled={loading || !selectedFuelId}
                    type="submit"
                    style={primaryButtonStyle}
                  >
                    {loading ? 'Salvando...' : 'Registrar abastecimento'}
                  </button>
                </form>
              </section>

              <section style={cardStyle}>
                <div style={sectionHeaderStyle}>
                  <h2 style={sectionTitleStyle}>Pedidos pendentes</h2>
                  <button
                    onClick={() => void loadDashboard()}
                    style={secondaryButtonStyle}
                    type="button"
                  >
                    Atualizar
                  </button>
                </div>

                {pendingOrders.length === 0 ? (
                  <p style={sectionTextStyle}>Nenhum pedido aguardando pagamento.</p>
                ) : (
                  <div style={listStyle}>
                    {pendingOrders.map(order => (
                      <article key={order.id} style={pendingCardStyle}>
                        <div style={rowBetweenStyle}>
                          <strong>Pedido #{order.id}</strong>
                          <span style={badgeStyle}>{order.status}</span>
                        </div>
                        <p style={orderTextStyle}>
                          {order.fuel.name} • {order.liters_delivered.toFixed(2)} L
                        </p>
                        <p style={orderValueStyle}>R$ {order.total_value.toFixed(2)}</p>
                        <p style={orderTextStyle}>Cliente: {order.user.name}</p>
                        <button
                          onClick={() => void handlePayment(order.id)}
                          style={primaryButtonStyle}
                          type="button"
                        >
                          Finalizar pagamento
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>Historico recente</h2>
              {history.length === 0 ? (
                <p style={sectionTextStyle}>Nenhum pedido registrado ainda.</p>
              ) : (
                <div style={historyListStyle}>
                  {history.slice(0, 10).map(order => (
                    <article key={order.id} style={historyItemStyle}>
                      <div style={rowBetweenStyle}>
                        <strong>Pedido #{order.id}</strong>
                        <span style={historyStatusStyle(order.status)}>{order.status}</span>
                      </div>
                      <p style={orderTextStyle}>
                        {order.user.name} • {order.fuel.name}
                      </p>
                      <p style={orderTextStyle}>
                        {new Date(order.created_at).toLocaleString('pt-BR')}
                      </p>
                      <p style={orderValueStyle}>R$ {order.total_value.toFixed(2)}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top, rgba(255,184,0,0.18), transparent 30%), linear-gradient(135deg, #0b1320 0%, #12243b 45%, #173a5e 100%)',
  color: '#f5f7fb',
  position: 'relative',
  overflow: 'hidden',
};

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
  opacity: 0.35,
  pointerEvents: 'none',
};

const contentStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  maxWidth: '1180px',
  margin: '0 auto',
  padding: '40px 20px 64px',
};

const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '24px',
  alignItems: 'flex-start',
  marginBottom: '24px',
  flexWrap: 'wrap',
};

const eyebrowStyle: React.CSSProperties = {
  letterSpacing: '0.24em',
  fontSize: '12px',
  fontWeight: 700,
  color: '#ffcd57',
  marginBottom: '12px',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(2rem, 5vw, 3.8rem)',
  lineHeight: 1.05,
};

const subtitleStyle: React.CSSProperties = {
  maxWidth: '720px',
  color: '#d0d9e6',
  fontSize: '1rem',
  lineHeight: 1.6,
};

const dashboardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
  gap: '24px',
};

const leftColumnStyle: React.CSSProperties = {
  display: 'grid',
  gap: '24px',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(8, 18, 31, 0.78)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '24px',
  padding: '24px',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.24)',
};

const loginCardStyle: React.CSSProperties = {
  ...cardStyle,
  maxWidth: '460px',
};

const messageStyle: React.CSSProperties = {
  ...cardStyle,
  padding: '16px 20px',
  marginBottom: '20px',
  color: '#f7d275',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  marginBottom: '12px',
  flexWrap: 'wrap',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: '1.35rem',
};

const sectionTextStyle: React.CSSProperties = {
  color: '#c8d1de',
  lineHeight: 1.6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  marginBottom: '12px',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#f5f7fb',
  boxSizing: 'border-box',
};

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '14px',
  border: 'none',
  background: 'linear-gradient(135deg, #ffb400 0%, #ff7a00 100%)',
  color: '#111827',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
  color: '#f5f7fb',
  fontWeight: 600,
  cursor: 'pointer',
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '16px',
};

const statCardStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: '18px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
  border: '1px solid rgba(255,255,255,0.08)',
};

const statLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.9rem',
  color: '#cdd6e4',
  marginBottom: '10px',
};

const statValueStyle: React.CSSProperties = {
  fontSize: '1.8rem',
};

const listStyle: React.CSSProperties = {
  display: 'grid',
  gap: '16px',
};

const pendingCardStyle: React.CSSProperties = {
  padding: '18px',
  borderRadius: '18px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const historyListStyle: React.CSSProperties = {
  display: 'grid',
  gap: '14px',
};

const historyItemStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const rowBetweenStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: '999px',
  background: 'rgba(255, 180, 0, 0.18)',
  color: '#ffd87f',
  fontWeight: 700,
  fontSize: '0.82rem',
};

const orderTextStyle: React.CSSProperties = {
  margin: '10px 0',
  color: '#cdd6e4',
};

const orderValueStyle: React.CSSProperties = {
  margin: '8px 0 16px',
  fontSize: '1.5rem',
  fontWeight: 700,
};

const historyStatusStyle = (status: string): React.CSSProperties => ({
  ...badgeStyle,
  background: status === 'PAGO' ? 'rgba(61, 207, 142, 0.18)' : 'rgba(255, 180, 0, 0.18)',
  color: status === 'PAGO' ? '#87f4bf' : '#ffd87f',
});

export default App;
