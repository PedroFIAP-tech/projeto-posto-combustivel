import {
  ChartIcon,
  ClipboardIcon,
  DashboardIcon,
  UsersIcon,
  WalletIcon,
} from './AppIcons';
import { FuelPumpIcon } from './FuelPumpIcon';
import { PumpOrder } from '../types';

type HistoricoDiaDashboardProps = {
  finalizados: PumpOrder[];
  pendentes: PumpOrder[];
};

type RankingItem = {
  label: string;
  pedidos: number;
  litros: number;
  valor: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatLiters = (value: number) => `${value.toFixed(2).replace('.', ',')} L`;

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value);

const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

const sumBy = (orders: PumpOrder[], selector: (order: PumpOrder) => number) =>
  orders.reduce((total, order) => total + selector(order), 0);

const groupRanking = (orders: PumpOrder[], getLabel: (order: PumpOrder) => string): RankingItem[] => {
  const grouped = new Map<string, RankingItem>();

  orders.forEach((order) => {
    const label = getLabel(order);
    const current = grouped.get(label) ?? { label, pedidos: 0, litros: 0, valor: 0 };
    current.pedidos += 1;
    current.litros += order.liters_delivered;
    current.valor += order.total_value;
    grouped.set(label, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.valor - a.valor);
};

const getPeakHour = (orders: PumpOrder[]) => {
  const hours = new Map<number, { hour: number; pedidos: number; valor: number }>();

  orders.forEach((order) => {
    const hour = new Date(order.created_at).getHours();
    const current = hours.get(hour) ?? { hour, pedidos: 0, valor: 0 };
    current.pedidos += 1;
    current.valor += order.total_value;
    hours.set(hour, current);
  });

  return Array.from(hours.values()).sort((a, b) => b.valor - a.valor)[0];
};

export function HistoricoDiaDashboard({ finalizados, pendentes }: HistoricoDiaDashboardProps) {
  const faturamentoPago = sumBy(finalizados, (order) => order.total_value);
  const litrosPagos = sumBy(finalizados, (order) => order.liters_delivered);
  const valorPendente = sumBy(pendentes, (order) => order.total_value);
  const litrosPendentes = sumBy(pendentes, (order) => order.liters_delivered);
  const ticketMedio = finalizados.length ? faturamentoPago / finalizados.length : 0;
  const precoMedioLitro = litrosPagos ? faturamentoPago / litrosPagos : 0;
  const maiorVenda = [...finalizados].sort((a, b) => b.total_value - a.total_value)[0];
  const ultimaVenda = [...finalizados].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
  const rankingCombustiveis = groupRanking(finalizados, (order) => order.fuel.name);
  const rankingFrentistas = groupRanking(finalizados, (order) => order.user.name);
  const pico = getPeakHour(finalizados);
  const maiorValorCombustivel = Math.max(...rankingCombustiveis.map((item) => item.valor), 1);

  return (
    <section className="day-dashboard" id="historico-dia">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-kicker">Historico do dia</span>
          <h2>Dashboard gerencial</h2>
          <p>Visao de faturamento, volume, eficiencia operacional e mix de combustiveis.</p>
        </div>
        <div className="dashboard-live">
          <span />
          Atualizado em tempo real
        </div>
      </div>

      <div className="dashboard-metrics-grid">
        <article className="dashboard-metric dashboard-metric-primary">
          <span className="metric-card-icon">
            <WalletIcon />
          </span>
          <small>Faturamento pago</small>
          <strong>{formatCurrency(faturamentoPago)}</strong>
          <p>{finalizados.length} abastecimentos finalizados hoje</p>
        </article>

        <article className="dashboard-metric">
          <span className="metric-card-icon metric-card-icon-green">
            <FuelPumpIcon />
          </span>
          <small>Litros vendidos</small>
          <strong>{formatLiters(litrosPagos)}</strong>
          <p>Preco medio de {formatCurrency(precoMedioLitro)} por litro</p>
        </article>

        <article className="dashboard-metric">
          <span className="metric-card-icon metric-card-icon-yellow">
            <ChartIcon />
          </span>
          <small>Ticket medio</small>
          <strong>{formatCurrency(ticketMedio)}</strong>
          <p>Maior venda: {maiorVenda ? formatCurrency(maiorVenda.total_value) : formatCurrency(0)}</p>
        </article>

        <article className="dashboard-metric">
          <span className="metric-card-icon metric-card-icon-orange">
            <ClipboardIcon />
          </span>
          <small>Em aberto</small>
          <strong>{formatCurrency(valorPendente)}</strong>
          <p>{pendentes.length} pendentes somando {formatLiters(litrosPendentes)}</p>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-panel fuel-mix-panel">
          <div className="panel-title">
            <div>
              <span>Mix do dia</span>
              <h3>Combustiveis por faturamento</h3>
            </div>
            <DashboardIcon />
          </div>

          <div className="fuel-mix-list">
            {rankingCombustiveis.map((item) => (
              <div className="fuel-mix-item" key={item.label}>
                <div className="fuel-mix-row">
                  <strong>{item.label}</strong>
                  <span>{formatCurrency(item.valor)}</span>
                </div>
                <div className="fuel-mix-track">
                  <span style={{ width: `${Math.max((item.valor / maiorValorCombustivel) * 100, 5)}%` }} />
                </div>
                <div className="fuel-mix-meta">
                  <span>{formatLiters(item.litros)}</span>
                  <span>{item.pedidos} vendas</span>
                </div>
              </div>
            ))}
            {rankingCombustiveis.length === 0 ? (
              <p className="dashboard-empty">Ainda nao ha vendas pagas hoje.</p>
            ) : null}
          </div>
        </article>

        <article className="dashboard-panel manager-insights">
          <div className="panel-title">
            <div>
              <span>Leitura rapida</span>
              <h3>Indicadores que importam</h3>
            </div>
            <ChartIcon />
          </div>

          <div className="insight-list">
            <div className="insight-item">
              <span>Projecao com pendentes</span>
              <strong>{formatCurrency(faturamentoPago + valorPendente)}</strong>
            </div>
            <div className="insight-item">
              <span>Horario mais forte</span>
              <strong>{pico ? `${formatHour(pico.hour)} - ${formatCurrency(pico.valor)}` : 'Sem dados'}</strong>
            </div>
            <div className="insight-item">
              <span>Combustivel lider</span>
              <strong>{rankingCombustiveis[0]?.label ?? 'Sem dados'}</strong>
            </div>
            <div className="insight-item">
              <span>Ultima venda paga</span>
              <strong>{ultimaVenda ? `${formatTime(ultimaVenda.created_at)} - ${formatCurrency(ultimaVenda.total_value)}` : 'Sem dados'}</strong>
            </div>
          </div>
        </article>

        <article className="dashboard-panel attendants-panel">
          <div className="panel-title">
            <div>
              <span>Equipe</span>
              <h3>Ranking por frentista</h3>
            </div>
            <UsersIcon />
          </div>

          <div className="ranking-table-shell">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Frentista</th>
                  <th>Vendas</th>
                  <th>Litros</th>
                  <th>Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {rankingFrentistas.map((item) => (
                  <tr key={item.label}>
                    <td>{item.label}</td>
                    <td>{item.pedidos}</td>
                    <td>{formatNumber(item.litros)}</td>
                    <td>{formatCurrency(item.valor)}</td>
                  </tr>
                ))}
                {rankingFrentistas.length === 0 ? (
                  <tr>
                    <td className="dashboard-empty" colSpan={4}>
                      Nenhum frentista com venda paga hoje.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
