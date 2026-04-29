import { useMemo, useState } from 'react';
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

type DailyPoint = {
  key: string;
  label: string;
  pedidos: number;
  litros: number;
  valor: number;
  ticket: number;
  forecast?: boolean;
};

type PeriodOption = '7' | '30' | '90' | 'all';
type MetricOption = 'valor' | 'litros' | 'pedidos';

const metricLabels: Record<MetricOption, string> = {
  valor: 'Faturamento',
  litros: 'Litros',
  pedidos: 'Pedidos',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    compactDisplay: 'short',
    maximumFractionDigits: 1,
    notation: 'compact',
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const formatLiters = (value: number) => `${value.toFixed(2).replace('.', ',')} L`;

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value);

const formatDay = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);

const formatIsoDay = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

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

const getDailySeries = (orders: PumpOrder[]): DailyPoint[] => {
  const grouped = new Map<string, DailyPoint>();

  orders.forEach((order) => {
    const date = new Date(order.created_at);
    const key = formatIsoDay(date);
    const current = grouped.get(key) ?? {
      key,
      label: formatDay(date),
      pedidos: 0,
      litros: 0,
      valor: 0,
      ticket: 0,
    };
    current.pedidos += 1;
    current.litros += order.liters_delivered;
    current.valor += order.total_value;
    current.ticket = current.valor / current.pedidos;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => a.key.localeCompare(b.key));
};

const getForecast = (series: DailyPoint[], days = 7): DailyPoint[] => {
  if (series.length === 0) {
    return [];
  }

  const recent = series.slice(-Math.min(7, series.length));
  const previous = series.slice(-Math.min(14, series.length), -recent.length);
  const recentAverage = {
    valor: sumByDaily(recent, 'valor') / recent.length,
    litros: sumByDaily(recent, 'litros') / recent.length,
    pedidos: sumByDaily(recent, 'pedidos') / recent.length,
  };
  const previousAverage = previous.length
    ? {
        valor: sumByDaily(previous, 'valor') / previous.length,
        litros: sumByDaily(previous, 'litros') / previous.length,
        pedidos: sumByDaily(previous, 'pedidos') / previous.length,
      }
    : recentAverage;

  const trend = {
    valor: clampTrend(recentAverage.valor - previousAverage.valor, recentAverage.valor),
    litros: clampTrend(recentAverage.litros - previousAverage.litros, recentAverage.litros),
    pedidos: clampTrend(recentAverage.pedidos - previousAverage.pedidos, recentAverage.pedidos),
  };
  const lastDay = parseLocalDate(series[series.length - 1].key);

  return Array.from({ length: days }, (_, index) => {
    const multiplier = index + 1;
    const valor = Math.max(recentAverage.valor + trend.valor * multiplier, 0);
    const pedidos = Math.max(Math.round(recentAverage.pedidos + trend.pedidos * multiplier), 0);
    const litros = Math.max(recentAverage.litros + trend.litros * multiplier, 0);
    const date = addDays(lastDay, multiplier);

    return {
      key: formatIsoDay(date),
      label: formatDay(date),
      pedidos,
      litros,
      valor,
      ticket: pedidos ? valor / pedidos : 0,
      forecast: true,
    };
  });
};

const sumByDaily = (points: DailyPoint[], key: MetricOption) =>
  points.reduce((total, point) => total + point[key], 0);

const clampTrend = (diff: number, base: number) => {
  const limit = Math.max(base * 0.18, 1);
  return Math.max(Math.min(diff / 7, limit), -limit);
};

const getMetricValue = (point: DailyPoint, metric: MetricOption) => point[metric];

const formatMetric = (value: number, metric: MetricOption) => {
  if (metric === 'valor') {
    return formatCurrency(value);
  }

  if (metric === 'litros') {
    return formatLiters(value);
  }

  return `${formatNumber(value)} pedidos`;
};

const getChange = (current: number, previous: number) => {
  if (!previous) {
    return current ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

export function HistoricoDiaDashboard({ finalizados, pendentes }: HistoricoDiaDashboardProps) {
  const [period, setPeriod] = useState<PeriodOption>('30');
  const [metric, setMetric] = useState<MetricOption>('valor');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const sortedOrders = useMemo(
    () => [...finalizados].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [finalizados]
  );
  const fullSeries = useMemo(() => getDailySeries(sortedOrders), [sortedOrders]);
  const forecast = useMemo(() => getForecast(fullSeries), [fullSeries]);
  const visibleSeries = useMemo(() => {
    if (period === 'all') {
      return fullSeries;
    }

    return fullSeries.slice(-Number(period));
  }, [fullSeries, period]);
  const chartSeries = useMemo(() => [...visibleSeries, ...forecast], [forecast, visibleSeries]);
  const selectedPoint = chartSeries.find((point) => point.key === selectedKey) ?? visibleSeries[visibleSeries.length - 1];

  const faturamentoPeriodo = sumByDaily(visibleSeries, 'valor');
  const litrosPeriodo = sumByDaily(visibleSeries, 'litros');
  const pedidosPeriodo = sumByDaily(visibleSeries, 'pedidos');
  const valorPendente = sumBy(pendentes, (order) => order.total_value);
  const ticketMedio = pedidosPeriodo ? faturamentoPeriodo / pedidosPeriodo : 0;
  const precoMedioLitro = litrosPeriodo ? faturamentoPeriodo / litrosPeriodo : 0;
  const previousWindow = fullSeries.slice(Math.max(fullSeries.length - visibleSeries.length * 2, 0), fullSeries.length - visibleSeries.length);
  const previousRevenue = sumByDaily(previousWindow, 'valor');
  const revenueChange = getChange(faturamentoPeriodo, previousRevenue);
  const forecastRevenue = sumByDaily(forecast, 'valor');
  const forecastLiters = sumByDaily(forecast, 'litros');
  const forecastOrders = sumByDaily(forecast, 'pedidos');
  const rankingCombustiveis = groupRanking(sortedOrders, (order) => order.fuel.name);
  const rankingFrentistas = groupRanking(sortedOrders, (order) => order.user.name);
  const maiorValorCombustivel = Math.max(...rankingCombustiveis.map((item) => item.valor), 1);
  const maxChartValue = Math.max(...chartSeries.map((point) => getMetricValue(point, metric)), 1);
  const bestDay = [...visibleSeries].sort((a, b) => b.valor - a.valor)[0];
  const lastSale = sortedOrders[sortedOrders.length - 1];

  return (
    <section className="day-dashboard analytics-dashboard" id="historico-dia">
      <div className="dashboard-header analytics-hero">
        <div>
          <span className="dashboard-kicker">Historico inteligente</span>
          <h2>Central de performance e previsao</h2>
          <p>Resultados de todos os dias, leitura do mix, ranking da equipe e previsao dos proximos 7 dias.</p>
        </div>
        <div className="dashboard-live">
          <span />
          Dados do Render
        </div>
      </div>

      <div className="analytics-toolbar" aria-label="Filtros do dashboard">
        <div className="segmented-control">
          {(['7', '30', '90', 'all'] as PeriodOption[]).map((option) => (
            <button
              className={period === option ? 'active' : ''}
              key={option}
              onClick={() => setPeriod(option)}
              type="button"
            >
              {option === 'all' ? 'Tudo' : `${option} dias`}
            </button>
          ))}
        </div>
        <div className="segmented-control">
          {(['valor', 'litros', 'pedidos'] as MetricOption[]).map((option) => (
            <button
              className={metric === option ? 'active' : ''}
              key={option}
              onClick={() => setMetric(option)}
              type="button"
            >
              {metricLabels[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-metrics-grid analytics-metrics">
        <article className="dashboard-metric dashboard-metric-primary">
          <span className="metric-card-icon">
            <WalletIcon />
          </span>
          <small>Faturamento no periodo</small>
          <strong>{formatCurrency(faturamentoPeriodo)}</strong>
          <p>{revenueChange >= 0 ? '+' : ''}{formatNumber(revenueChange)}% contra a janela anterior</p>
        </article>

        <article className="dashboard-metric">
          <span className="metric-card-icon metric-card-icon-green">
            <FuelPumpIcon />
          </span>
          <small>Volume vendido</small>
          <strong>{formatLiters(litrosPeriodo)}</strong>
          <p>Preco medio de {formatCurrency(precoMedioLitro)} por litro</p>
        </article>

        <article className="dashboard-metric">
          <span className="metric-card-icon metric-card-icon-yellow">
            <ChartIcon />
          </span>
          <small>Previsao 7 dias</small>
          <strong>{formatCurrency(forecastRevenue)}</strong>
          <p>{formatLiters(forecastLiters)} em {formatNumber(forecastOrders)} vendas estimadas</p>
        </article>

        <article className="dashboard-metric">
          <span className="metric-card-icon metric-card-icon-orange">
            <ClipboardIcon />
          </span>
          <small>Carteira em aberto</small>
          <strong>{formatCurrency(valorPendente)}</strong>
          <p>{pendentes.length} pagamentos ainda pendentes</p>
        </article>
      </div>

      <div className="analytics-grid">
        <article className="dashboard-panel analytics-main-panel">
          <div className="panel-title">
            <div>
              <span>Serie historica + previsao</span>
              <h3>{metricLabels[metric]} por dia</h3>
            </div>
            <DashboardIcon />
          </div>

          <div className="chart-shell">
            <svg aria-label={`Grafico de ${metricLabels[metric]}`} className="power-chart" viewBox="0 0 760 300">
              <defs>
                <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#006633" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#006633" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((line) => (
                <line className="chart-grid-line" key={line} x1="34" x2="738" y1={45 + line * 58} y2={45 + line * 58} />
              ))}
              {chartSeries.map((point, index) => {
                const chartWidth = 690;
                const barGap = 7;
                const barWidth = Math.max(chartWidth / Math.max(chartSeries.length, 1) - barGap, 8);
                const x = 44 + index * (chartWidth / Math.max(chartSeries.length, 1));
                const height = Math.max((getMetricValue(point, metric) / maxChartValue) * 190, point.forecast ? 10 : 6);
                const y = 242 - height;

                return (
                  <g className="chart-bar-group" key={point.key} onClick={() => setSelectedKey(point.key)}>
                    <rect
                      className={`chart-bar${point.forecast ? ' chart-bar-forecast' : ''}${selectedPoint?.key === point.key ? ' chart-bar-active' : ''}`}
                      height={height}
                      rx="4"
                      width={barWidth}
                      x={x}
                      y={y}
                    />
                    {index % Math.ceil(chartSeries.length / 8 || 1) === 0 ? (
                      <text className="chart-label" x={x + barWidth / 2} y="274">
                        {point.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>

            <div className="chart-detail">
              <span>{selectedPoint?.forecast ? 'Previsao selecionada' : 'Dia selecionado'}</span>
              <strong>{selectedPoint ? selectedPoint.label : 'Sem dados'}</strong>
              <div>
                <b>{selectedPoint ? formatMetric(getMetricValue(selectedPoint, metric), metric) : formatMetric(0, metric)}</b>
                <small>
                  {selectedPoint
                    ? `${formatCurrency(selectedPoint.valor)} | ${formatLiters(selectedPoint.litros)} | ${selectedPoint.pedidos} vendas`
                    : 'Nenhum movimento encontrado'}
                </small>
              </div>
            </div>
          </div>
        </article>

        <article className="dashboard-panel forecast-panel">
          <div className="panel-title">
            <div>
              <span>Previsao</span>
              <h3>Proximos dias</h3>
            </div>
            <ChartIcon />
          </div>

          <div className="forecast-list">
            {forecast.map((point) => (
              <button className="forecast-row" key={point.key} onClick={() => setSelectedKey(point.key)} type="button">
                <span>{point.label}</span>
                <strong>{formatCompactCurrency(point.valor)}</strong>
                <small>{formatNumber(point.pedidos)} vendas</small>
              </button>
            ))}
            {forecast.length === 0 ? <p className="dashboard-empty">Sem base historica para prever.</p> : null}
          </div>
        </article>

        <article className="dashboard-panel fuel-mix-panel">
          <div className="panel-title">
            <div>
              <span>Mix consolidado</span>
              <h3>Combustiveis por faturamento</h3>
            </div>
            <FuelPumpIcon />
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
              <p className="dashboard-empty">Ainda nao ha vendas pagas no historico.</p>
            ) : null}
          </div>
        </article>

        <article className="dashboard-panel manager-insights">
          <div className="panel-title">
            <div>
              <span>Leitura executiva</span>
              <h3>O que mudou</h3>
            </div>
            <WalletIcon />
          </div>

          <div className="insight-list">
            <div className="insight-item">
              <span>Ticket medio</span>
              <strong>{formatCurrency(ticketMedio)}</strong>
            </div>
            <div className="insight-item">
              <span>Melhor dia no periodo</span>
              <strong>{bestDay ? `${bestDay.label} - ${formatCurrency(bestDay.valor)}` : 'Sem dados'}</strong>
            </div>
            <div className="insight-item">
              <span>Combustivel lider</span>
              <strong>{rankingCombustiveis[0]?.label ?? 'Sem dados'}</strong>
            </div>
            <div className="insight-item">
              <span>Ultima venda paga</span>
              <strong>{lastSale ? `${formatDay(new Date(lastSale.created_at))} - ${formatCurrency(lastSale.total_value)}` : 'Sem dados'}</strong>
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
                      Nenhum frentista com venda paga no historico.
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
