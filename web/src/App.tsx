import React, { useState, useEffect } from 'react';
import api from './services/api';

function App() {
  // --- ESTADOS ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  // --- 1. FUNÇÃO DE LOGIN ---
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await api.post('/login', { email, password });
      localStorage.setItem('@PostoApp:token', response.data.token);
      setIsLogged(true);
      alert("Login realizado! Monitoramento de bombas ativo.");
    } catch (error) {
      alert('Erro no login! Verifique suas credenciais.');
    }
  }

  // --- 2. BUSCAR PEDIDOS PENDENTES (Vindo da Bomba) ---
  async function fetchPendingOrders() {
    try {
      // Importante: Você precisa criar essa rota GET /pedidos/pendentes no seu Back-end!
      const response = await api.get('/pedidos/pendentes');
      setPendingOrders(response.data);
    } catch (error) {
      console.log("Aguardando novos dados das bombas...");
    }
  }

  // --- 3. MONITORAMENTO AUTOMÁTICO (Polling) ---
  useEffect(() => {
    if (isLogged) {
      const interval = setInterval(() => {
        fetchPendingOrders();
      }, 3000); // Checa o banco a cada 3 segundos

      return () => clearInterval(interval); // Limpa o relógio se fechar a tela
    }
  }, [isLogged]);

  // --- 4. FINALIZAR PAGAMENTO ---
  async function handlePayment(orderId: number) {
    try {
      // Rota que muda o status de PENDENTE para PAGO
      await api.patch(`/pedidos/${orderId}/pagar`);
      alert("Pagamento confirmado! Bomba liberada.");
      fetchPendingOrders(); // Atualiza a tela na hora
    } catch (error) {
      alert("Erro ao processar pagamento.");
    }
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#1a365d' }}>⛽ Sistema de Monitoramento de Pista</h1>

      {!isLogged ? (
        /* TELA DE LOGIN */
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2>Acesso do Frentista</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
            <button type="submit" style={buttonStyle}>Entrar no Painel</button>
          </form>
        </div>
      ) : (
        /* PAINEL DE BOMBAS */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2>Status das Bombas em Tempo Real</h2>
            <span style={{ color: '#2ecc71' }}>● Conectado à Pista</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4].map(bombaNo => {
              // Lógica: Se o ID da bomba bater com o que veio do banco, mostra o alerta
              // Por enquanto, vamos simular que qualquer pedido pendente aparece na Bomba 1
              const order = bombaNo === 1 ? pendingOrders[0] : null;

              return (
                <div key={bombaNo} style={{
                  padding: '20px',
                  borderRadius: '15px',
                  backgroundColor: '#fff',
                  border: '3px solid',
                  borderColor: order ? '#e74c3c' : '#2ecc71',
                  transition: '0.3s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: '0' }}>BOMBA {bombaNo}</h3>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: order ? '#e74c3c' : '#2ecc71' }}>
                      {order ? 'OCUPADA' : 'LIVRE'}
                    </span>
                  </div>

                  {order ? (
                    <div style={{ marginTop: '20px' }}>
                      <p style={{ margin: '5px 0', color: '#666' }}>Aguardando fechamento:</p>
                      <h2 style={{ fontSize: '32px', margin: '10px 0', color: '#2d3748' }}>R$ {order.total_value.toFixed(2)}</h2>
                      <p style={{ fontSize: '14px' }}><b>Volume:</b> {order.liters_delivered.toFixed(2)} L</p>
                      
                      <button 
                        onClick={() => handlePayment(order.id)}
                        style={{ ...buttonStyle, backgroundColor: '#e67e22', marginTop: '15px' }}
                      >
                        RECEBER PAGAMENTO
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: '40px', textAlign: 'center', color: '#bdc3c7' }}>
                      <p>Pronta para abastecer</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos rápidos
const inputStyle = { display: 'block', width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' as const };
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#1a365d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' as const };

export default App;