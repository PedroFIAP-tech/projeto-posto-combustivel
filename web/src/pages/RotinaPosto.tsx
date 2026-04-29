import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import logoWhite from '../assets/logos/logo-branca.png';
import logoMain from '../assets/logos/logo-principal.png';
import { AguardandoPagamento } from '../components/AguardandoPagamento';
import {
  ChartIcon,
  CashIcon,
  DashboardIcon,
  FileIcon,
  HelpIcon,
  HistoryIcon,
  LogOutIcon,
  ReceiptIcon,
  ShieldIcon,
  StockIcon,
  UsersIcon,
  WalletIcon,
} from '../components/AppIcons';
import { BombasEmAndamento } from '../components/BombasEmAndamento';
import { FuelPumpIcon } from '../components/FuelPumpIcon';
import { Finalizados } from '../components/Finalizados';
import { HistoricoDiaDashboard } from '../components/HistoricoDiaDashboard';
import { getHistorico, getPendentes, pagarPedido } from '../services/orders';
import { Order, PumpOrder, User } from '../types';

type RotinaPostoProps = {
  user: User;
  onLogout: () => void;
};

type LoadOptions = {
  silent?: boolean;
};

type MenuItem = {
  label: string;
  href?: string;
  icon?: ReactNode;
  active?: boolean;
  view?: 'rotina' | 'historico';
};

type MenuSection = {
  title?: string;
  items: MenuItem[];
};

const TOTAL_BOMBAS = 8;
const ADMIN_ROLE = 'admin';

const getMenuSections = (role: string, activeView: 'rotina' | 'historico'): MenuSection[] => {
  if (role !== ADMIN_ROLE) {
    return [
      {
        items: [
          { label: 'Rotina Posto', icon: <FuelPumpIcon />, active: activeView === 'rotina', view: 'rotina' },
          { label: 'Historico de Abastecimentos', icon: <HistoryIcon />, active: activeView === 'historico', view: 'historico' },
        ],
      },
    ];
  }

  return [
    {
      items: [
        { label: 'Rotina Posto', icon: <FuelPumpIcon />, active: activeView === 'rotina', view: 'rotina' },
        { label: 'Pedidos Pendentes', href: '#pendentes', icon: <ReceiptIcon /> },
        { label: 'Historico de Abastecimentos', icon: <HistoryIcon />, active: activeView === 'historico', view: 'historico' },
      ],
    },
    {
      title: 'Financeiro',
      items: [
        { label: 'Pagamentos', icon: <CashIcon /> },
        { label: 'Faturamento', icon: <ChartIcon /> },
        { label: 'Recebimentos', icon: <WalletIcon /> },
      ],
    },
    {
      title: 'Cadastros',
      items: [
        { label: 'Clientes', icon: <UsersIcon /> },
        { label: 'Combustiveis', icon: <FuelPumpIcon /> },
        { label: 'Frentistas', icon: <UsersIcon /> },
        { label: 'Bombas', icon: <FuelPumpIcon /> },
      ],
    },
    {
      title: 'Relatorios',
      items: [
        { label: 'Vendas', icon: <ChartIcon /> },
        { label: 'Estoque', icon: <StockIcon /> },
        { label: 'Desempenho', icon: <DashboardIcon /> },
      ],
    },
    {
      title: 'Configuracoes',
      items: [
        { label: 'Usuarios', icon: <UsersIcon /> },
        { label: 'Permissoes', icon: <ShieldIcon /> },
        { label: 'Logs', icon: <FileIcon /> },
      ],
    },
  ];
};

const withPumpNumber = (order: Order): PumpOrder => ({
  ...order,
  pumpNumber: String(((order.id - 1) % TOTAL_BOMBAS) + 1).padStart(2, '0'),
});

const upsertOrder = (orders: PumpOrder[], order: PumpOrder) => [
  order,
  ...orders.filter((current) => current.id !== order.id),
];

const isToday = (date: string) => {
  const value = new Date(date);
  const today = new Date();

  return (
    value.getFullYear() === today.getFullYear() &&
    value.getMonth() === today.getMonth() &&
    value.getDate() === today.getDate()
  );
};

const formatHeaderDate = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

const formatHeaderTime = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

export function RotinaPosto({ user, onLogout }: RotinaPostoProps) {
  const [activeView, setActiveView] = useState<'rotina' | 'historico'>('rotina');
  const [pendentes, setPendentes] = useState<PumpOrder[]>([]);
  const [finalizados, setFinalizados] = useState<PumpOrder[]>([]);
  const [historicoFinalizados, setHistoricoFinalizados] = useState<PumpOrder[]>([]);
  const emAndamento = pendentes;
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());

  const carregarPedidos = useCallback(async (options: LoadOptions = {}) => {
    if (!options.silent) {
      setMessage('');
    }

    const [pendentesResult, historicoResult] = await Promise.allSettled([getPendentes(), getHistorico()]);

    if (pendentesResult.status === 'fulfilled') {
      const pendentesData = pendentesResult.value;
      setPendentes(pendentesData.map(withPumpNumber));
    } else if (!options.silent) {
      setMessage('Nao foi possivel carregar os pedidos pendentes.');
    }

    if (historicoResult.status === 'fulfilled') {
      const historicoData = historicoResult.value;
      const pagos = historicoData.filter((pedido) => pedido.status === 'PAGO').map(withPumpNumber);
      setHistoricoFinalizados(pagos);
      setFinalizados(pagos.filter((pedido) => isToday(pedido.created_at)));
    } else if (!options.silent && pendentesResult.status !== 'fulfilled') {
      setMessage('Nao foi possivel carregar a rotina do posto.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void carregarPedidos();

    const polling = window.setInterval(() => {
      void carregarPedidos({ silent: true });
    }, 3000);

    return () => window.clearInterval(polling);
  }, [carregarPedidos]);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(clock);
  }, []);

  const handlePagar = async (id: number) => {
    setPayingId(id);
    setMessage('');

    try {
      const paidOrder = withPumpNumber(await pagarPedido(id));
      setPendentes((current) => current.filter((pedido) => pedido.id !== id));
      setHistoricoFinalizados((current) => upsertOrder(current, paidOrder));
      if (isToday(paidOrder.created_at)) {
        setFinalizados((current) => upsertOrder(current, paidOrder));
      }
      await carregarPedidos({ silent: true });
      setHistoricoFinalizados((current) => upsertOrder(current, paidOrder));
      if (isToday(paidOrder.created_at)) {
        setFinalizados((current) => upsertOrder(current, paidOrder));
      }
      setMessage('Pagamento finalizado com sucesso.');
    } catch (_error) {
      setMessage('Nao foi possivel finalizar o pagamento.');
    } finally {
      setPayingId(null);
    }
  };

  const firstName = useMemo(() => user.name.split(' ')[0] || 'Frentista', [user.name]);
  const menuSections = useMemo(() => getMenuSections(user.role, activeView), [user.role, activeView]);
  const isHistoricoView = activeView === 'historico';

  return (
    <div className="routine-layout">
      <aside className="routine-sidebar">
        <div className="brand-block">
          <img alt="Posto BR" className="brand-icon" src={logoWhite} />
          <div>
            <strong>POSTO BR</strong>
            <span>ROTINA POSTO</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Principal">
          {menuSections.map((section, sectionIndex) => (
            <div className="menu-section" key={section.title ?? sectionIndex}>
              {section.title ? <span className="menu-section-title">{section.title}</span> : null}
              {section.items.map((item) =>
                item.href ? (
                  <a
                    className={`sidebar-link${item.active ? ' sidebar-link-active' : ''}`}
                    href={item.href}
                    key={item.label}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                  </a>
                ) : (
                  <button
                    className={`sidebar-link${item.active ? ' sidebar-link-active' : ''}`}
                    key={item.label}
                    onClick={() => {
                      if (item.view) {
                        setActiveView(item.view);
                      }
                    }}
                    type="button"
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                )
              )}
            </div>
          ))}
          <button className="sidebar-link sidebar-button" onClick={onLogout} type="button">
            <span className="nav-icon">
              <LogOutIcon />
            </span>
            Sair do Sistema
          </button>
        </nav>

        <div className="support-card">
          <span className="support-icon">
            <HelpIcon />
          </span>
          <div>
            <strong>Precisa de ajuda?</strong>
            <span>Fale com o suporte</span>
          </div>
        </div>
      </aside>

      <main className="routine-main" id="rotina">
        <header className="routine-topbar">
          <div className="page-title">
            <span className="title-icon">
              {isHistoricoView ? <HistoryIcon /> : <FuelPumpIcon />}
            </span>
            <div>
              <h1>{isHistoricoView ? 'Historico de Abastecimentos' : 'Rotina do Posto'}</h1>
              <p>
                {isHistoricoView
                  ? 'Analise resultados passados e projecoes futuras'
                  : 'Acompanhe os abastecimentos em tempo real'}
              </p>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="clock-card">
              <strong>{formatHeaderTime(now)}</strong>
              <span>{formatHeaderDate(now)}</span>
            </div>
            <div className="user-chip">
              <div className="avatar">{firstName.charAt(0).toUpperCase()}</div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.role === ADMIN_ROLE ? 'Admin' : 'Frentista'}</span>
              </div>
            </div>
          </div>
        </header>

        {!isHistoricoView ? (
          <section className="summary-card">
            <div className="welcome-block">
              <span className="welcome-icon">
                <FuelPumpIcon />
              </span>
              <div>
                <h2>Ola, {firstName}!</h2>
                <p>Aqui voce acompanha os abastecimentos das bombas.</p>
              </div>
            </div>

            <div className="summary-metrics">
              <div className="metric-item">
                <span>Total de bombas</span>
                <strong>{TOTAL_BOMBAS}</strong>
              </div>
              <div className="metric-item">
                <span>Em abastecimento</span>
                <strong className="metric-orange">{emAndamento.length}</strong>
              </div>
              <div className="metric-item">
                <span>Aguardando pagamento</span>
                <strong className="metric-yellow">{pendentes.length}</strong>
              </div>
              <div className="metric-item">
                <span>Finalizados</span>
                <strong className="metric-green">{finalizados.length}</strong>
              </div>
            </div>
          </section>
        ) : null}

        {message ? <div className="routine-message">{message}</div> : null}

        {loading ? (
          <section className="routine-card">
            <p className="empty-table">Carregando rotina do posto...</p>
          </section>
        ) : isHistoricoView ? (
          <HistoricoDiaDashboard finalizados={historicoFinalizados} pendentes={pendentes} />
        ) : (
          <>
            <BombasEmAndamento pedidos={emAndamento} />
            <div id="pendentes">
              <AguardandoPagamento pedidos={pendentes} onPagar={handlePagar} payingId={payingId} />
            </div>
            <div id="finalizados">
              <Finalizados pedidos={finalizados} />
            </div>
          </>
        )}

        <footer className="routine-footer">
          <span>
            POSTO BR - Sistema de Gestao de Abastecimentos
            <br />
            Versao 2.0.0
          </span>
          <img alt="Posto BR Control Center" className="footer-logo" src={logoMain} />
        </footer>
      </main>
    </div>
  );
}
