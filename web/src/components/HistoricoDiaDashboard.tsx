import { type ReactNode, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartIcon, ReceiptIcon, UsersIcon, WalletIcon } from './AppIcons';
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
  share: number;
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

type ChartFrameProps = {
  children: ReactNode;
  emptyText: string;
  emptyTitle: string;
  isEmpty: boolean;
  large?: boolean;
};

const COLORS = ['#0f766e', '#d97706', '#2563eb', '#7c3aed', '#64748b', '#dc2626'];

const periodLabels: Record<PeriodOption, string> = {
  '7': 'Ultimos 7 dias',
  '30': 'Ultimos 30 dias',
  '90': 'Ultimos 90 dias',
  all: 'Todo historico',
};

const metricLabels: Record<MetricOption, string> = {
  valor: 'Faturamento',
  litros: 'Litros',
  pedidos: 'Pedidos',
};

const asNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asNumber(value));

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    compactDisplay: 'short',
    maximumFractionDigits: 1,
    notation: 'compact',
    style: 'currency',
    currency: 'BRL',
  }).format(asNumber(value));

const formatLiters = (value: number) =>
  `${new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(asNumber(value))} L`;

const formatNumber = (value: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(asNumber(value));

const formatDay = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);

const formatDateTime = (date: string) => {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return 'Data invalida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(value);
};

const formatIsoDay = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const sumBy = (orders: PumpOrder[], selector: (order: PumpOrder) => number) =>
  orders.reduce((total, order) => total + asNumber(selector(order)), 0);

const sumByDaily = (points: DailyPoint[], key: MetricOption) =>
  points.reduce((total, point) => total + asNumber(point[key]), 0);

const getFuelName = (order: PumpOrder) => order.fuel?.name || 'Combustivel nao informado';
const getUserName = (order: PumpOrder) => order.user?.name || 'Frentista nao informado';
const getOrderValue = (order: PumpOrder) => asNumber(order.total_value);
const getOrderLiters = (order: PumpOrder) => asNumber(order.liters_delivered);

const getOrderDate = (order: PumpOrder) => {
  const date = new Date(order.created_at);
  return Number.isNaN(date.getTime()) ? null : date;
};

const groupRanking = (orders: PumpOrder[], getLabel: (order: PumpOrder) => string): RankingItem[] => {
  const grouped = new Map<string, RankingItem>();
  const total = sumBy(orders, getOrderValue);

  orders.forEach((order) => {
    const label = getLabel(order);
    const current = grouped.get(label) ?? { label, pedidos: 0, litros: 0, valor: 0, share: 0 };
    current.pedidos += 1;
    current.litros += getOrderLiters(order);
    current.valor += getOrderValue(order);
    current.share = total ? (current.valor / total) * 100 : 0;
    grouped.set(label, current);
  });

  return Array.from(grouped.values()).sort((a, b) => b.valor - a.valor);
};

const getDailySeries = (orders: PumpOrder[]): DailyPoint[] => {
  const grouped = new Map<string, DailyPoint>();

  orders.forEach((order) => {
    const date = getOrderDate(order);

    if (!date) {
      return;
    }

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
    current.litros += getOrderLiters(order);
    current.valor += getOrderValue(order);
    current.ticket = current.pedidos ? current.valor / current.pedidos : 0;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((a, b) => a.key.localeCompare(b.key));
};

const getCalendarSeries = (series: DailyPoint[], days: number, endDate: Date) => {
  const byKey = new Map(series.map((point) => [point.key, point]));
  const end = startOfDay(endDate);

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(end, index - days + 1);
    const key = formatIsoDay(date);

    return (
      byKey.get(key) ?? {
        key,
        label: formatDay(date),
        pedidos: 0,
        litros: 0,
        valor: 0,
        ticket: 0,
      }
    );
  });
};

const clampTrend = (diff: number, base: number) => {
  const limit = Math.max(base * 0.18, 1);
  return Math.max(Math.min(diff / 7, limit), -limit);
};

const getForecast = (series: DailyPoint[], days = 7, fromDate = new Date()): DailyPoint[] => {
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
  const lastDay = startOfDay(fromDate);

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

const getChange = (current: number, previous: number) => {
  if (!previous) {
    return current ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

const formatMetric = (value: number, metric: MetricOption) => {
  if (metric === 'valor') {
    return formatCurrency(value);
  }

  if (metric === 'litros') {
    return formatLiters(value);
  }

  return `${formatNumber(value, 0)} pedidos`;
};

const getMetricValue = (point: DailyPoint, metric: MetricOption) => point[metric];

const tooltipFormatter = (value: unknown, name: unknown): [string, string] => {
  const label = String(name);

  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return ['-', label];
  }

  const numeric = asNumber(value);

  if (label.toLowerCase().includes('litro')) {
    return [formatLiters(numeric), label];
  }

  if (label.toLowerCase().includes('pedido')) {
    return [formatNumber(numeric, 0), label];
  }

  return [formatCurrency(numeric), label];
};

function ChartFrame({ children, emptyText, emptyTitle, isEmpty, large }: ChartFrameProps) {
  return (
    <div className={`history-chart${large ? ' history-chart-large' : ''}`}>
      {isEmpty ? (
        <div className="history-empty-state">
          <strong>{emptyTitle}</strong>
          <span>{emptyText}</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function HistoricoDiaDashboard({ finalizados, pendentes }: HistoricoDiaDashboardProps) {
  const [period, setPeriod] = useState<PeriodOption>('30');
  const [metric, setMetric] = useState<MetricOption>('valor');
  const [activeFuelLabel, setActiveFuelLabel] = useState('');

  const sortedOrders = useMemo(
    () =>
      [...finalizados].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [finalizados]
  );
  const fullSeries = useMemo(() => getDailySeries(sortedOrders), [sortedOrders]);
  const visibleSeries = useMemo(() => {
    if (period === 'all') {
      return fullSeries;
    }

    return getCalendarSeries(fullSeries, Number(period), new Date());
  }, [fullSeries, period]);
  const previousSeries = useMemo(() => {
    if (period === 'all') {
      return [];
    }

    const previousEndDate = addDays(new Date(), -Number(period));
    return getCalendarSeries(fullSeries, Number(period), previousEndDate);
  }, [fullSeries, period]);
  const forecast = useMemo(() => getForecast(fullSeries, 7, new Date()), [fullSeries]);
  const visibleKeys = useMemo(() => new Set(visibleSeries.map((point) => point.key)), [visibleSeries]);
  const periodOrders = useMemo(() => {
    if (period === 'all') {
      return [...sortedOrders].reverse();
    }

    return [...sortedOrders]
      .reverse()
      .filter((order) => {
        const date = getOrderDate(order);
        return date ? visibleKeys.has(formatIsoDay(date)) : false;
      });
  }, [period, sortedOrders, visibleKeys]);
  const forecastKeys = useMemo(() => new Set(forecast.map((point) => point.key)), [forecast]);
  const chartSeries = useMemo(
    () =>
      [...visibleSeries, ...forecast].map((point) => ({
        ...point,
        forecastMetric: point.forecast ? getMetricValue(point, metric) : null,
        realMetric: point.forecast ? null : getMetricValue(point, metric),
        tipo: forecastKeys.has(point.key) ? 'Previsao' : 'Real',
      })),
    [forecast, forecastKeys, metric, visibleSeries]
  );
  const faturamentoPeriodo = sumByDaily(visibleSeries, 'valor');
  const litrosPeriodo = sumByDaily(visibleSeries, 'litros');
  const pedidosPeriodo = sumByDaily(visibleSeries, 'pedidos');
  const previousRevenue = sumByDaily(previousSeries, 'valor');
  const valorPendente = sumBy(pendentes, getOrderValue);
  const ticketMedio = pedidosPeriodo ? faturamentoPeriodo / pedidosPeriodo : 0;
  const revenueChange = period === 'all' ? 0 : getChange(faturamentoPeriodo, previousRevenue);
  const forecastRevenue = sumByDaily(forecast, 'valor');
  const forecastOrders = sumByDaily(forecast, 'pedidos');
  const rankingCombustiveis = groupRanking(periodOrders, getFuelName).slice(0, 6);
  const rankingFrentistas = groupRanking(periodOrders, getUserName).slice(0, 6);
  const bestFuel = rankingCombustiveis[0];
  const maxFuelRevenue = Math.max(...rankingCombustiveis.map((item) => item.valor), 0);
  const selectedFuel = rankingCombustiveis.find((item) => item.label === activeFuelLabel) ?? bestFuel;
  const bestAttendant = rankingFrentistas[0];
  const activeDays = visibleSeries.filter((point) => point.pedidos > 0 || point.valor > 0 || point.litros > 0);
  const bestDay = [...visibleSeries].filter((point) => point.valor > 0).sort((a, b) => b.valor - a.valor)[0];
  const averageActiveRevenue = activeDays.length ? faturamentoPeriodo / activeDays.length : 0;
  const operationHighlights = [...activeDays].sort((a, b) => b.valor - a.valor).slice(0, 4);
  const recentOrders = periodOrders.slice(0, 12);
  const hasVisibleData = pedidosPeriodo > 0 || faturamentoPeriodo > 0 || litrosPeriodo > 0;
  const hasForecast = forecast.length > 0;
  const trendWidth = `${Math.min(Math.abs(revenueChange), 100)}%`;
  const trendLabel =
    period === 'all'
      ? 'Comparativo indisponivel'
      : revenueChange > 8
        ? 'Periodo acima da media'
        : revenueChange < -8
          ? 'Periodo abaixo da media'
          : 'Periodo estavel';

  return (
    <section className="history-page" id="historico-dia">
      <div className="history-toolbar">
        <div className="history-heading">
          <span className="history-eyebrow">Historico de abastecimentos</span>
          <h2>Vendas pagas, pendencias e desempenho por periodo</h2>
          <p>Dados consolidados por dia, combustivel, frentista e valor recebido.</p>
        </div>

        <div className="history-controls" aria-label="Filtros do historico">
          <div className="history-control-group">
            <span>Periodo</span>
            <div className="history-segmented">
              {(['7', '30', '90', 'all'] as PeriodOption[]).map((option) => (
                <button
                  aria-pressed={period === option}
                  className={period === option ? 'active' : ''}
                  key={option}
                  onClick={() => setPeriod(option)}
                  type="button"
                >
                  {option === 'all' ? 'Tudo' : `${option} dias`}
                </button>
              ))}
            </div>
          </div>

          <div className="history-control-group">
            <span>Grafico principal</span>
            <div className="history-segmented">
              {(['valor', 'litros', 'pedidos'] as MetricOption[]).map((option) => (
                <button
                  aria-pressed={metric === option}
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
        </div>
      </div>

      <div className="history-kpi-grid">
        <article className="history-kpi history-kpi-primary">
          <span className="history-kpi-icon">
            <WalletIcon />
          </span>
          <small>Recebido no periodo</small>
          <strong>{formatCurrency(faturamentoPeriodo)}</strong>
          <p>{periodLabels[period]}</p>
        </article>

        <article className="history-kpi">
          <span className="history-kpi-icon history-kpi-icon-fuel">
            <FuelPumpIcon />
          </span>
          <small>Volume entregue</small>
          <strong>{formatLiters(litrosPeriodo)}</strong>
          <p>{formatNumber(pedidosPeriodo, 0)} abastecimentos pagos</p>
        </article>

        <article className="history-kpi">
          <span className="history-kpi-icon history-kpi-icon-chart">
            <ChartIcon />
          </span>
          <small>Ticket medio</small>
          <strong>{formatCurrency(ticketMedio)}</strong>
          <p>{bestDay ? `Melhor dia: ${bestDay.label}` : 'Sem venda paga no periodo'}</p>
        </article>

        <article className="history-kpi">
          <span className="history-kpi-icon history-kpi-icon-pending">
            <ReceiptIcon />
          </span>
          <small>Aguardando pagamento</small>
          <strong>{formatCurrency(valorPendente)}</strong>
          <p>{pendentes.length} pedidos pendentes agora</p>
        </article>
      </div>

      <div className="history-grid">
        <article className="history-panel history-panel-wide">
          <div className="history-panel-header">
            <div>
              <span>Serie temporal</span>
              <h3>{metricLabels[metric]} real e previsao curta</h3>
            </div>
            <strong>{formatMetric(sumByDaily(visibleSeries, metric), metric)}</strong>
          </div>

          <ChartFrame
            emptyText="Assim que houver abastecimentos pagos, a serie aparece aqui."
            emptyTitle="Sem dados no periodo"
            isEmpty={!hasVisibleData && !hasForecast}
            large
          >
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={chartSeries} margin={{ bottom: 0, left: 0, right: 12, top: 14 }}>
                <defs>
                  <linearGradient id="historyRealMetricFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.26} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="historyForecastMetricFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="label" minTickGap={18} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) =>
                    metric === 'valor' ? formatCompactCurrency(asNumber(value)) : formatNumber(asNumber(value), 0)
                  }
                  tickLine={false}
                  width={72}
                />
                <Tooltip formatter={tooltipFormatter} labelClassName="history-tooltip-label" wrapperClassName="history-tooltip" />
                <Area
                  dataKey="realMetric"
                  fill="url(#historyRealMetricFill)"
                  isAnimationActive={false}
                  name={metricLabels[metric]}
                  stroke="#0f766e"
                  strokeWidth={3}
                  type="monotone"
                />
                <Area
                  dataKey="forecastMetric"
                  fill="url(#historyForecastMetricFill)"
                  isAnimationActive={false}
                  name={`${metricLabels[metric]} previsto`}
                  stroke="#d97706"
                  strokeDasharray="7 5"
                  strokeWidth={3}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartFrame>
        </article>

        <article className="history-panel">
          <div className="history-panel-header">
            <div>
              <span>Ritmo do periodo</span>
              <h3>{trendLabel}</h3>
            </div>
          </div>

          <div className="history-trend-card">
            <strong className={revenueChange >= 0 ? 'history-trend-positive' : 'history-trend-negative'}>
              {period === 'all' ? '-' : `${revenueChange >= 0 ? '+' : ''}${formatNumber(revenueChange, 1)}%`}
            </strong>
            <span>{period === 'all' ? 'Selecione um periodo fechado para comparar.' : 'Comparado com a janela anterior.'}</span>
            <div className="history-trend-track">
              <i
                className={revenueChange >= 0 ? 'history-trend-fill-positive' : 'history-trend-fill-negative'}
                style={{ width: period === 'all' ? '0%' : trendWidth }}
              />
            </div>
          </div>

          <div className="history-mini-list">
            <div>
              <span>Prox. 7 dias</span>
              <strong>{hasForecast ? formatCurrency(forecastRevenue) : 'Sem base'}</strong>
            </div>
            <div>
              <span>Pedidos previstos</span>
              <strong>{hasForecast ? formatNumber(forecastOrders, 0) : 'Sem base'}</strong>
            </div>
          </div>
        </article>

        <article className="history-panel">
          <div className="history-panel-header">
            <div>
              <span>Mix de combustiveis</span>
              <h3>Participacao por receita</h3>
            </div>
          </div>

          <ChartFrame
            emptyText="Nenhum combustivel vendido neste periodo."
            emptyTitle="Sem mix para exibir"
            isEmpty={rankingCombustiveis.length === 0}
          >
            <div className="history-donut-layout">
              <ResponsiveContainer height={210} width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={rankingCombustiveis}
                    dataKey="valor"
                    endAngle={-270}
                    innerRadius={54}
                    nameKey="label"
                    outerRadius={82}
                    paddingAngle={3}
                    startAngle={90}
                  >
                    {rankingCombustiveis.map((item, index) => (
                      <Cell fill={COLORS[index % COLORS.length]} key={item.label} />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipFormatter} wrapperClassName="history-tooltip" />
                </PieChart>
              </ResponsiveContainer>
              <div className="history-legend">
                {rankingCombustiveis.map((item, index) => (
                  <div key={item.label}>
                    <i style={{ background: COLORS[index % COLORS.length] }} />
                    <span>{item.label}</span>
                    <strong>{formatNumber(item.share, 1)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </ChartFrame>
        </article>

        <article className="history-panel">
          <div className="history-panel-header">
            <div>
              <span>Top combustiveis</span>
              <h3>Receita por produto</h3>
            </div>
          </div>

          <ChartFrame
            emptyText="Quando houver venda paga, o ranking aparece aqui."
            emptyTitle="Ranking indisponivel"
            isEmpty={rankingCombustiveis.length === 0}
          >
            <div className="history-product-chart">
              <div className="history-product-inspector">
                <span>Produto selecionado</span>
                <strong>{selectedFuel?.label ?? 'Sem dados'}</strong>
                <small>
                  {selectedFuel
                    ? `${formatCurrency(selectedFuel.valor)} | ${formatNumber(selectedFuel.share, 1)}% da receita | ${formatLiters(selectedFuel.litros)}`
                    : 'Passe o mouse em uma barra para ver detalhes.'}
                </small>
              </div>

              <div className="history-product-bars">
                {rankingCombustiveis.map((item, index) => {
                  const width = maxFuelRevenue ? (item.valor / maxFuelRevenue) * 100 : 0;
                  const isSelected = selectedFuel?.label === item.label;

                  return (
                    <button
                      className={`history-product-row${isSelected ? ' history-product-row-active' : ''}`}
                      key={item.label}
                      onFocus={() => setActiveFuelLabel(item.label)}
                      onMouseEnter={() => setActiveFuelLabel(item.label)}
                      type="button"
                    >
                      <span className="history-product-name">{item.label}</span>
                      <span className="history-product-track">
                        <i
                          style={{
                            background: COLORS[index % COLORS.length],
                            width: `${Math.max(width, item.valor > 0 ? 5 : 0)}%`,
                          }}
                        />
                      </span>
                      <strong>{formatCompactCurrency(item.valor)}</strong>
                    </button>
                  );
                })}
              </div>
            </div>
          </ChartFrame>
        </article>

        <article className="history-panel history-panel-wide">
          <div className="history-panel-header">
            <div>
              <span>Operacao diaria</span>
              <h3>Faturamento por dia</h3>
            </div>
            <strong>{formatNumber(activeDays.length, 0)} dias com venda</strong>
          </div>

          <div className="history-operation-layout">
            <ChartFrame
              emptyText="Nao ha vendas pagas para montar a leitura diaria."
              emptyTitle="Sem movimento no periodo"
              isEmpty={!hasVisibleData}
            >
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={visibleSeries} margin={{ bottom: 0, left: 0, right: 12, top: 14 }}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                  <XAxis axisLine={false} dataKey="label" minTickGap={18} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => formatCompactCurrency(asNumber(value))}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip formatter={tooltipFormatter} wrapperClassName="history-tooltip" />
                  <Bar dataKey="valor" isAnimationActive={false} name="Faturamento" radius={[8, 8, 0, 0]}>
                    {visibleSeries.map((point) => (
                      <Cell fill={point.valor > 0 ? '#0f766e' : '#dbe4ea'} key={point.key} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>

            <aside className="history-operation-summary" aria-label="Resumo da operacao diaria">
              <div className="history-operation-total">
                <span>Total recebido</span>
                <strong>{formatCurrency(faturamentoPeriodo)}</strong>
                <small>{formatNumber(pedidosPeriodo, 0)} pedidos pagos no periodo</small>
              </div>

              <div className="history-operation-stats">
                <div>
                  <span>Litros</span>
                  <strong>{formatLiters(litrosPeriodo)}</strong>
                </div>
                <div>
                  <span>Media por dia ativo</span>
                  <strong>{formatCurrency(averageActiveRevenue)}</strong>
                </div>
                <div>
                  <span>Maior dia</span>
                  <strong>{bestDay ? `${bestDay.label} - ${formatCompactCurrency(bestDay.valor)}` : 'Sem dados'}</strong>
                </div>
              </div>

              <div className="history-operation-days">
                <span>Maiores movimentos</span>
                {operationHighlights.map((point) => (
                  <div key={point.key}>
                    <strong>{point.label}</strong>
                    <small>{formatCurrency(point.valor)} | {formatNumber(point.pedidos, 0)} pedidos</small>
                  </div>
                ))}
                {operationHighlights.length === 0 ? <p>Sem movimento pago no periodo.</p> : null}
              </div>
            </aside>
          </div>
        </article>

        <article className="history-panel">
          <div className="history-panel-header">
            <div>
              <span>Equipe</span>
              <h3>Ranking de frentistas</h3>
            </div>
            <UsersIcon />
          </div>

          <div className="history-ranking">
            {rankingFrentistas.map((item, index) => (
              <div className="history-ranking-row" key={item.label}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.pedidos} vendas | {formatLiters(item.litros)}</small>
                  <i style={{ width: `${Math.max(item.share, 6)}%` }} />
                </div>
                <b>{formatCompactCurrency(item.valor)}</b>
              </div>
            ))}
            {rankingFrentistas.length === 0 ? (
              <div className="history-empty-state history-empty-state-compact">
                <strong>Sem ranking no periodo</strong>
                <span>O ranking depende de abastecimentos pagos.</span>
              </div>
            ) : null}
          </div>
        </article>
      </div>

      <div className="history-insight-strip">
        <article>
          <span>Combustivel lider</span>
          <strong>{bestFuel?.label ?? 'Sem dados'}</strong>
          <p>{bestFuel ? `${formatNumber(bestFuel.share, 1)}% da receita no periodo` : 'Aguardando vendas pagas'}</p>
        </article>
        <article>
          <span>Frentista destaque</span>
          <strong>{bestAttendant?.label ?? 'Sem dados'}</strong>
          <p>{bestAttendant ? `${formatCompactCurrency(bestAttendant.valor)} em vendas` : 'Aguardando vendas pagas'}</p>
        </article>
        <article>
          <span>Projecao operacional</span>
          <strong>{hasForecast ? formatCurrency(forecastRevenue + valorPendente) : formatCurrency(valorPendente)}</strong>
          <p>Previsao somada aos pedidos pendentes atuais</p>
        </article>
      </div>

      <article className="history-panel history-table-panel">
        <div className="history-panel-header">
          <div>
            <span>Ultimos registros</span>
            <h3>Abastecimentos pagos do periodo</h3>
          </div>
          <strong>{recentOrders.length} exibidos</strong>
        </div>

        <div className="history-table-shell">
          <table className="history-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Bomba</th>
                <th>Combustivel</th>
                <th>Frentista</th>
                <th>Litros</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{formatDateTime(pedido.created_at)}</td>
                  <td>
                    <span className="history-pump">Bomba {pedido.pumpNumber}</span>
                  </td>
                  <td>{getFuelName(pedido)}</td>
                  <td>{getUserName(pedido)}</td>
                  <td>{formatLiters(getOrderLiters(pedido))}</td>
                  <td>{formatCurrency(getOrderValue(pedido))}</td>
                  <td>
                    <span className="history-status-paid">Pago</span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 ? (
                <tr>
                  <td className="history-table-empty" colSpan={7}>
                    Nenhum abastecimento pago encontrado para o periodo selecionado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
