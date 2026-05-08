import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import logoWhite from '../assets/logos/logo-branca.png';
import logoMain from '../assets/logos/logo-principal.png';
import { AguardandoPagamento } from '../components/AguardandoPagamento';
import {
  ChartIcon,
  CashIcon,
  ClipboardIcon,
  DashboardIcon,
  FileIcon,
  HelpIcon,
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
import { PostoLoadingScreen } from '../components/PostoLoadingScreen';
import { criarAbastecimento, getCombustiveis, getHistorico, getPendentes, pagarPedido } from '../services/orders';
import { Fuel, Order, OrderMode, PumpOrder, User } from '../types';

type RotinaPostoProps = {
  user: User;
  onLogout: () => void;
  onSwitchUser: (credentials: SwitchUserCredentials) => Promise<void>;
};

type LoadOptions = {
  silent?: boolean;
};

type SwitchUserCredentials = {
  email: string;
  password: string;
};

type SimulatorForm = {
  pump_number: string;
  nozzle_number: string;
  fuel_id: string;
  liters: string;
  mode: OrderMode;
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
const AVATAR_KEY_PREFIX = '@PostoApp:avatar:';
const DEMO_USERS = [
  {
    email: 'frentista@posto.com',
    label: 'Frentista',
    role: 'frentista',
  },
  {
    email: 'admin@posto.com',
    label: 'Administrador',
    role: ADMIN_ROLE,
  },
] as const;

const getMenuSections = (role: string, activeView: 'rotina' | 'historico'): MenuSection[] => {
  if (role !== ADMIN_ROLE) {
    return [
      {
        items: [
          { label: 'Rotina Posto', icon: <FuelPumpIcon />, active: activeView === 'rotina', view: 'rotina' },
          { label: 'Historico de Abastecimentos', icon: <ClipboardIcon />, active: activeView === 'historico', view: 'historico' },
        ],
      },
    ];
  }

  return [
    {
      items: [
        { label: 'Rotina Posto', icon: <FuelPumpIcon />, active: activeView === 'rotina', view: 'rotina' },
        { label: 'Pedidos Pendentes', href: '#pendentes', icon: <ReceiptIcon /> },
        { label: 'Historico de Abastecimentos', icon: <ClipboardIcon />, active: activeView === 'historico', view: 'historico' },
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

const formatEquipmentNumber = (value: number) => String(value).padStart(2, '0');

const withPumpNumber = (order: Order): PumpOrder => {
  const fallbackPumpNumber = ((order.id - 1) % TOTAL_BOMBAS) + 1;
  const pumpNumber = order.pump_number || fallbackPumpNumber;

  return {
    ...order,
    pumpNumber: formatEquipmentNumber(pumpNumber),
    nozzleNumber: formatEquipmentNumber(order.nozzle_number || pumpNumber),
  };
};

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

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return fallback;
  }

  const response = (error as { response?: { data?: { message?: string }; status?: number } }).response;

  if (response?.data?.message) {
    return response.data.message;
  }

  if (response?.status) {
    return `${fallback} Codigo HTTP ${response.status}.`;
  }

  return fallback;
};

export function RotinaPosto({ user, onLogout, onSwitchUser }: RotinaPostoProps) {
  const [activeView, setActiveView] = useState<'rotina' | 'historico'>('rotina');
  const [pendentes, setPendentes] = useState<PumpOrder[]>([]);
  const [finalizados, setFinalizados] = useState<PumpOrder[]>([]);
  const [historicoFinalizados, setHistoricoFinalizados] = useState<PumpOrder[]>([]);
  const [fuels, setFuels] = useState<Fuel[]>([]);
  const emAndamento = pendentes;
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [payingId, setPayingId] = useState<number | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState('');
  const [simulatorForm, setSimulatorForm] = useState<SimulatorForm>({
    pump_number: '1',
    nozzle_number: '1',
    fuel_id: '',
    liters: '8.3',
    mode: 'AUTOMATICO',
  });
  const [now, setNow] = useState(() => new Date());
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('');
  const [switchEmail, setSwitchEmail] = useState('');
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

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
    let active = true;

    const carregarCombustiveis = async () => {
      try {
        const data = await getCombustiveis();

        if (!active) {
          return;
        }

        setFuels(data);
        setSimulatorForm((current) => ({
          ...current,
          fuel_id: current.fuel_id || String(data[0]?.id ?? ''),
        }));
      } catch (_error) {
        if (active) {
          setSimulationMessage('Nao foi possivel carregar os combustiveis para simulacao.');
        }
      }
    };

    void carregarCombustiveis();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    setAvatarUrl(localStorage.getItem(`${AVATAR_KEY_PREFIX}${user.email}`) ?? '');
    setAvatarMessage('');
    setAccountMenuOpen(false);
    setSwitchEmail('');
    setSwitchPassword('');
  }, [user.email]);

  useEffect(() => {
    if (!accountMenuOpen) {
      return undefined;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [accountMenuOpen]);

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

  const handleSimularAbastecimento = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const pumpNumber = Number(simulatorForm.pump_number);
    const nozzleNumber = Number(simulatorForm.nozzle_number);
    const fuelId = Number(simulatorForm.fuel_id);
    const liters = Number(simulatorForm.liters.replace(',', '.'));

    if (!Number.isInteger(pumpNumber) || pumpNumber < 1) {
      setSimulationMessage('Informe uma bomba valida.');
      return;
    }

    if (!Number.isInteger(nozzleNumber) || nozzleNumber < 1) {
      setSimulationMessage('Informe um bico valido.');
      return;
    }

    if (!fuelId) {
      setSimulationMessage('Selecione um combustivel.');
      return;
    }

    if (!Number.isFinite(liters) || liters <= 0) {
      setSimulationMessage('Informe uma quantidade de litros maior que zero.');
      return;
    }

    setSimulating(true);
    setSimulationMessage('');
    setMessage('');

    try {
      const createdOrder = withPumpNumber(
        await criarAbastecimento({
          pump_number: pumpNumber,
          nozzle_number: nozzleNumber,
          fuel_id: fuelId,
          liters,
          mode: simulatorForm.mode,
        })
      );
      setPendentes((current) => upsertOrder(current, createdOrder));
      setSimulationMessage(`Abastecimento registrado na bomba ${createdOrder.pumpNumber}, bico ${createdOrder.nozzleNumber}.`);
      await carregarPedidos({ silent: true });
    } catch (error) {
      setSimulationMessage(
        getApiErrorMessage(error, 'Nao foi possivel simular o abastecimento. Verifique a API e tente novamente.')
      );
    } finally {
      setSimulating(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setAvatarMessage('');

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarMessage('Escolha um arquivo de imagem.');
      return;
    }

    if (file.size > 1024 * 1024 * 2) {
      setAvatarMessage('Use uma imagem com ate 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setAvatarUrl(result);
      localStorage.setItem(`${AVATAR_KEY_PREFIX}${user.email}`, result);
    };
    reader.onerror = () => setAvatarMessage('Nao foi possivel carregar a imagem.');
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    localStorage.removeItem(`${AVATAR_KEY_PREFIX}${user.email}`);
    setAvatarUrl('');
    setAvatarMessage('');
  };

  const handleSelectSwitchUser = (email: string) => {
    setAvatarMessage('');

    if (email === user.email) {
      setSwitchEmail('');
      setSwitchPassword('');
      return;
    }

    setSwitchEmail(email);
  };

  const handleSwitchUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedUser = DEMO_USERS.find((option) => option.email === switchEmail);

    if (!selectedUser) {
      setAvatarMessage('Escolha o usuario para trocar.');
      return;
    }

    if (!switchPassword.trim()) {
      setAvatarMessage('Digite a senha do usuario selecionado.');
      return;
    }

    if (selectedUser.email === user.email) {
      setAvatarMessage('Este usuario ja esta ativo.');
      return;
    }

    setSwitchingRole(selectedUser.role);
    setMessage('');
    setAvatarMessage('');

    try {
      await onSwitchUser({ email: selectedUser.email, password: switchPassword });
      setActiveView('rotina');
      setSwitchEmail('');
      setSwitchPassword('');
    } catch (_error) {
      setAvatarMessage('Senha invalida ou usuario indisponivel.');
    } finally {
      setSwitchingRole(null);
    }
  };

  const firstName = useMemo(() => user.name.split(' ')[0] || 'Frentista', [user.name]);
  const menuSections = useMemo(() => getMenuSections(user.role, activeView), [user.role, activeView]);
  const isHistoricoView = activeView === 'historico';
  const roleLabel = user.role === ADMIN_ROLE ? 'Admin' : 'Frentista';
  const selectedSwitchUser = DEMO_USERS.find((option) => option.email === switchEmail);
  const canSwitchUser = Boolean(selectedSwitchUser && selectedSwitchUser.email !== user.email && switchPassword.trim());
  const selectedFuel = fuels.find((fuel) => fuel.id === Number(simulatorForm.fuel_id));
  const litersPreview = Number(simulatorForm.liters.replace(',', '.'));
  const estimatedValue =
    selectedFuel && Number.isFinite(litersPreview) && litersPreview > 0
      ? selectedFuel.price_per_liter * litersPreview
      : 0;

  return (
    <div className="routine-layout">
      {switchingRole ? (
        <PostoLoadingScreen
          message="Validando senha e carregando permissoes do usuario."
          title="Trocando operador"
        />
      ) : loading ? (
        <PostoLoadingScreen
          message="Buscando bombas, pagamentos e historico em tempo real."
          title="Preparando rotina"
        />
      ) : null}
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
              {isHistoricoView ? <ClipboardIcon /> : <FuelPumpIcon />}
            </span>
            <div>
              <h1>{isHistoricoView ? 'Historico de Abastecimentos' : 'Rotina do Posto'}</h1>
              <p>
                {isHistoricoView
                  ? 'Consulte vendas pagas, pendencias e desempenho por periodo'
                  : 'Acompanhe os abastecimentos em tempo real'}
              </p>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="clock-card">
              <strong>{formatHeaderTime(now)}</strong>
              <span>{formatHeaderDate(now)}</span>
            </div>
            <div className="account-menu" ref={accountMenuRef}>
              <button
                aria-expanded={accountMenuOpen}
                className="user-chip"
                onClick={() => setAccountMenuOpen((current) => !current)}
                type="button"
              >
                <span className="avatar">
                  {avatarUrl ? <img alt={`Foto de ${user.name}`} src={avatarUrl} /> : firstName.charAt(0).toUpperCase()}
                </span>
                <span>
                  <strong>{user.name}</strong>
                  <span>{roleLabel}</span>
                </span>
              </button>

              {accountMenuOpen ? (
                <div className="account-panel">
                  <div className="account-panel-header">
                    <span className="avatar avatar-large">
                      {avatarUrl ? <img alt={`Foto de ${user.name}`} src={avatarUrl} /> : firstName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>

                  <div className="account-actions-grid">
                    <label className="account-action-button">
                      Trocar foto
                      <input accept="image/*" onChange={handleAvatarChange} type="file" />
                    </label>
                    <button className="account-action-button" disabled={!avatarUrl} onClick={handleRemoveAvatar} type="button">
                      Remover foto
                    </button>
                  </div>
                  {avatarMessage ? <p className="account-alert">{avatarMessage}</p> : null}

                  <form className="account-section" onSubmit={handleSwitchUser}>
                    <span>Trocar usuario</span>
                    {DEMO_USERS.map((option) => (
                      <button
                        className={`account-user-option${option.email === user.email ? ' account-user-option-active' : ''}${
                          switchEmail === option.email && option.email !== user.email ? ' account-user-option-selected' : ''
                        }`}
                        disabled={switchingRole !== null}
                        key={option.email}
                        onClick={() => handleSelectSwitchUser(option.email)}
                        type="button"
                      >
                        <span>{option.label.charAt(0)}</span>
                        <div>
                          <strong>{option.label}</strong>
                          <small>{option.email}</small>
                        </div>
                        <b>
                          {switchingRole === option.role
                            ? 'Entrando...'
                            : option.email === user.email
                              ? 'Atual'
                              : switchEmail === option.email
                                ? 'Selecionado'
                                : 'Escolher'}
                        </b>
                      </button>
                    ))}

                    <label className="account-password-field">
                      Senha
                      <input
                        autoComplete="current-password"
                        disabled={switchingRole !== null}
                        onChange={(event) => setSwitchPassword(event.target.value)}
                        placeholder="Digite a senha"
                        type="password"
                        value={switchPassword}
                      />
                    </label>

                    <button className="account-switch-button" disabled={switchingRole !== null || !canSwitchUser} type="submit">
                      {switchingRole
                        ? 'Trocando usuario...'
                        : selectedSwitchUser?.email === user.email
                          ? 'Usuario atual'
                          : 'Trocar usuario'}
                    </button>
                  </form>

                  <button className="account-logout-button" onClick={onLogout} type="button">
                    Sair do sistema
                  </button>
                </div>
              ) : null}
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

        {!isHistoricoView ? (
          <section className="simulator-card" aria-label="Simulador de abastecimento">
            <div className="simulator-heading">
              <span className="welcome-icon">
                <FuelPumpIcon />
              </span>
              <div>
                <h2>Simular abastecimento</h2>
                <p>Registre uma venda pendente como se viesse da bomba.</p>
              </div>
            </div>

            <form className="simulator-form" onSubmit={handleSimularAbastecimento}>
              <label>
                Bomba
                <input
                  min="1"
                  onChange={(event) =>
                    setSimulatorForm((current) => ({ ...current, pump_number: event.target.value }))
                  }
                  type="number"
                  value={simulatorForm.pump_number}
                />
              </label>

              <label>
                Bico
                <input
                  min="1"
                  onChange={(event) =>
                    setSimulatorForm((current) => ({ ...current, nozzle_number: event.target.value }))
                  }
                  type="number"
                  value={simulatorForm.nozzle_number}
                />
              </label>

              <label>
                Combustivel
                <select
                  onChange={(event) =>
                    setSimulatorForm((current) => ({ ...current, fuel_id: event.target.value }))
                  }
                  value={simulatorForm.fuel_id}
                >
                  {fuels.map((fuel) => (
                    <option key={fuel.id} value={fuel.id}>
                      {fuel.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Litros
                <input
                  min="0.001"
                  onChange={(event) =>
                    setSimulatorForm((current) => ({ ...current, liters: event.target.value }))
                  }
                  step="0.001"
                  type="number"
                  value={simulatorForm.liters}
                />
              </label>

              <label>
                Modo
                <select
                  onChange={(event) =>
                    setSimulatorForm((current) => ({ ...current, mode: event.target.value as OrderMode }))
                  }
                  value={simulatorForm.mode}
                >
                  <option value="AUTOMATICO">Automatico</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </label>

              <div className="simulator-preview">
                <span>Valor previsto</span>
                <strong>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedValue)}
                </strong>
              </div>

              <button disabled={simulating || fuels.length === 0} type="submit">
                {simulating ? 'Registrando...' : 'Registrar abastecimento'}
              </button>
            </form>

            {simulationMessage ? <div className="simulator-message">{simulationMessage}</div> : null}
          </section>
        ) : null}

        {message ? <div className="routine-message">{message}</div> : null}

        {loading ? null : isHistoricoView ? (
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
