import { type ComponentType, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
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

const COLORS = ['#006633', '#ffcc00', '#f26a21', '#2563eb', '#7c3aed', '#0891b2'];
const GaugePolarAngleAxis = PolarAngleAxis as unknown as ComponentType<any>;

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

const sumByDaily = (points: DailyPoint[], key: MetricOption) =>
  points.reduce((total, point) => total + point[key], 0);

const groupRanking = (orders: PumpOrder[], getLabel: (order: PumpOrder) => string): RankingItem[] => {
  const grouped = new Map<string, RankingItem>();
  const total = sumBy(orders, (order) => order.total_value);

  orders.forEach((order) => {
    const label = getLabel(order);
    const current = grouped.get(label) ?? { label, pedidos: 0, litros: 0, valor: 0, share: 0 };
    current.pedidos += 1;
    current.litros += order.liters_delivered;
    current.valor += order.total_value;
    current.share = total ? (current.valor / total) * 100 : 0;
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

const clampTrend = (diff: number, base: number) => {
  const limit = Math.max(base * 0.18, 1);
  return Math.max(Math.min(diff / 7, limit), -limit);
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

  return `${formatNumber(value)} pedidos`;
};

const getMetricValue = (point: DailyPoint, metric: MetricOption) => point[metric];

const tooltipFormatter = (value: any, name: any): [string, string] => {
  const numeric = Number(value);
  const label = String(name);

  if (label.toLowerCase().includes('litro')) {
    return [formatLiters(numeric), label];
  }

  if (label.toLowerCase().includes('pedido')) {
    return [formatNumber(numeric), label];
  }

  return [formatCurrency(numeric), label];
};

export function HistoricoDiaDashboard({ finalizados, pendentes }: HistoricoDiaDashboardProps) {
  const [period, setPeriod] = useState<PeriodOption>('30');
  const [metric, setMetric] = useState<MetricOption>('valor');

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
  const forecastKeys = new Set(forecast.map((point) => point.key));
  const chartSeries = [...visibleSeries, ...forecast].map((point) => ({
    ...point,
    realValor: point.forecast ? null : point.valor,
    forecastValor: point.forecast ? point.valor : null,
    realMetric: point.forecast ? null : getMetricValue(point, metric),
    forecastMetric: point.forecast ? getMetricValue(point, metric) : null,
    tipo: forecastKeys.has(point.key) ? 'Previsao' : 'Real',
  }));

  const faturamentoPeriodo = sumByDaily(visibleSeries, 'valor');
  const litrosPeriodo = sumByDaily(visibleSeries, 'litros');
  const pedidosPeriodo = sumByDaily(visibleSeries, 'pedidos');
  const valorPendente = sumBy(pendentes, (order) => order.total_value);
  const ticketMedio = pedidosPeriodo ? faturamentoPeriodo / pedidosPeriodo : 0;
  const previousWindow = fullSeries.slice(Math.max(fullSeries.length - visibleSeries.length * 2, 0), fullSeries.length - visibleSeries.length);
  const revenueChange = getChange(faturamentoPeriodo, sumByDaily(previousWindow, 'valor'));
  const forecastRevenue = sumByDaily(forecast, 'valor');
  const forecastOrders = sumByDaily(forecast, 'pedidos');
  const rankingCombustiveis = groupRanking(sortedOrders, (order) => order.fuel.name).slice(0, 6);
  const rankingFrentistas = groupRanking(sortedOrders, (order) => order.user.name).slice(0, 6);
  const bestFuel = rankingCombustiveis[0];
  const bestAttendant = rankingFrentistas[0];
  const bestDay = [...visibleSeries].sort((a, b) => b.valor - a.valor)[0];
  const gaugeValue = Math.min(Math.max(revenueChange + 50, 0), 100);
  const radialData = [{ name: 'Performance', value: gaugeValue, fill: revenueChange >= 0 ? '#006633' : '#f26a21' }];

  return (
    <section className="day-dashboard analytics-dashboard analytics-dashboard-pro" id="historico-dia">
      <div className="analytics-command-center">
        <div>
          <span className="dashboard-kicker">Historico do dia</span>
          <h2>Graficos e estatisticas do posto</h2>
          <p>Uma leitura visual de faturamento, volume, mix de combustiveis, equipe e previsao.</p>
        </div>
        <div className="analytics-filter-stack">
          <div className="segmented-control segmented-control-dark">
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
          <div className="segmented-control segmented-control-dark">
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
      </div>

      <div className="analytics-scoreboard">
        <article className="analytics-kpi analytics-kpi-hero">
          <span className="analytics-kpi-icon">
            <WalletIcon />
          </span>
          <small>Faturamento do periodo</small>
          <strong>{formatCurrency(faturamentoPeriodo)}</strong>
          <p className={revenueChange >= 0 ? 'trend-positive' : 'trend-negative'}>
            {revenueChange >= 0 ? '+' : ''}{formatNumber(revenueChange)}% vs janela anterior
          </p>
        </article>

        <article className="analytics-kpi">
          <span className="analytics-kpi-icon analytics-kpi-green">
            <FuelPumpIcon />
          </span>
          <small>Litros vendidos</small>
          <strong>{formatLiters(litrosPeriodo)}</strong>
          <p>{formatNumber(pedidosPeriodo)} vendas pagas</p>
        </article>

        <article className="analytics-kpi">
          <span className="analytics-kpi-icon analytics-kpi-yellow">
            <ChartIcon />
          </span>
          <small>Previsao 7 dias</small>
          <strong>{formatCurrency(forecastRevenue)}</strong>
          <p>{formatNumber(forecastOrders)} vendas estimadas</p>
        </article>

        <article className="analytics-kpi">
          <span className="analytics-kpi-icon analytics-kpi-orange">
            <ReceiptIcon />
          </span>
          <small>Aguardando pagamento</small>
          <strong>{formatCurrency(valorPendente)}</strong>
          <p>{pendentes.length} pedidos abertos</p>
        </article>
      </div>

      <div className="analytics-pro-grid">
        <article className="analytics-card analytics-card-xl">
          <div className="analytics-card-header">
            <div>
              <span>Serie temporal</span>
              <h3>{metricLabels[metric]} real e previsto</h3>
            </div>
            <strong>{formatMetric(sumByDaily(visibleSeries, metric), metric)}</strong>
          </div>
          <div className="analytics-chart analytics-chart-large">
            <ResponsiveContainer height="100%" width="100%">
              <AreaChart data={chartSeries} margin={{ bottom: 0, left: 0, right: 12, top: 14 }}>
                <defs>
                  <linearGradient id="realMetricFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#006633" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#006633" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="forecastMetricFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f26a21" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#f26a21" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e8edf2" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="label" minTickGap={18} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
                <YAxis axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => metric === 'valor' ? formatCompactCurrency(Number(value)) : formatNumber(Number(value))} tickLine={false} width={72} />
                <Tooltip formatter={tooltipFormatter} labelClassName="analytics-tooltip-label" wrapperClassName="analytics-tooltip" />
                <Area dataKey="realMetric" fill="url(#realMetricFill)" name={metricLabels[metric]} stroke="#006633" strokeWidth={3} type="monotone" />
                <Area dataKey="forecastMetric" fill="url(#forecastMetricFill)" name={`${metricLabels[metric]} previsto`} stroke="#f26a21" strokeDasharray="7 5" strokeWidth={3} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-card analytics-card-gauge">
          <div className="analytics-card-header">
            <div>
              <span>Ritmo comercial</span>
              <h3>Performance</h3>
            </div>
          </div>
          <div className="analytics-gauge">
            <ResponsiveContainer height={210} width="100%">
              <RadialBarChart data={radialData} endAngle={0} innerRadius="72%" outerRadius="100%" startAngle={180}>
                <GaugePolarAngleAxis domain={[0, 100]} tick={false} type="number" />
                <RadialBar background cornerRadius={12} dataKey="value" />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="analytics-gauge-value">
              <strong>{revenueChange >= 0 ? '+' : ''}{formatNumber(revenueChange)}%</strong>
              <span>comparativo</span>
            </div>
          </div>
          <div className="analytics-mini-list">
            <div>
              <span>Ticket medio</span>
              <strong>{formatCurrency(ticketMedio)}</strong>
            </div>
            <div>
              <span>Melhor dia</span>
              <strong>{bestDay ? `${bestDay.label} - ${formatCompactCurrency(bestDay.valor)}` : 'Sem dados'}</strong>
            </div>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <span>Mix de combustiveis</span>
              <h3>Participacao por receita</h3>
            </div>
          </div>
          <div className="analytics-donut-layout">
            <ResponsiveContainer height={230} width="100%">
              <PieChart>
                <Pie data={rankingCombustiveis} dataKey="valor" innerRadius={62} outerRadius={92} paddingAngle={3}>
                  {rankingCombustiveis.map((item, index) => (
                    <Cell fill={COLORS[index % COLORS.length]} key={item.label} />
                  ))}
                </Pie>
                <Tooltip formatter={tooltipFormatter} wrapperClassName="analytics-tooltip" />
              </PieChart>
            </ResponsiveContainer>
            <div className="analytics-legend">
              {rankingCombustiveis.map((item, index) => (
                <div key={item.label}>
                  <i style={{ background: COLORS[index % COLORS.length] }} />
                  <span>{item.label}</span>
                  <strong>{formatNumber(item.share)}%</strong>
                </div>
              ))}
              {rankingCombustiveis.length === 0 ? <p className="dashboard-empty">Sem vendas pagas.</p> : null}
            </div>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <span>Top combustiveis</span>
              <h3>Receita e volume</h3>
            </div>
          </div>
          <div className="analytics-chart">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={rankingCombustiveis} layout="vertical" margin={{ bottom: 0, left: 8, right: 18, top: 4 }}>
                <CartesianGrid horizontal={false} stroke="#e8edf2" />
                <XAxis axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatCompactCurrency(Number(value))} tickLine={false} type="number" />
                <YAxis axisLine={false} dataKey="label" tick={{ fill: '#334155', fontSize: 12 }} tickLine={false} type="category" width={94} />
                <Tooltip formatter={tooltipFormatter} wrapperClassName="analytics-tooltip" />
                <Bar dataKey="valor" name="Faturamento" radius={[0, 8, 8, 0]}>
                  {rankingCombustiveis.map((item, index) => (
                    <Cell fill={COLORS[index % COLORS.length]} key={item.label} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-card analytics-card-xl">
          <div className="analytics-card-header">
            <div>
              <span>Operacao diaria</span>
              <h3>Faturamento, litros e pedidos</h3>
            </div>
          </div>
          <div className="analytics-chart">
            <ResponsiveContainer height="100%" width="100%">
              <ComposedChart data={visibleSeries} margin={{ bottom: 0, left: 0, right: 12, top: 14 }}>
                <CartesianGrid stroke="#e8edf2" strokeDasharray="4 4" vertical={false} />
                <XAxis axisLine={false} dataKey="label" minTickGap={18} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
                <YAxis axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => formatCompactCurrency(Number(value))} tickLine={false} width={72} />
                <Tooltip formatter={tooltipFormatter} wrapperClassName="analytics-tooltip" />
                <Bar dataKey="valor" fill="#006633" name="Faturamento" radius={[8, 8, 0, 0]} />
                <Line dataKey="ticket" dot={false} name="Ticket medio" stroke="#f26a21" strokeWidth={3} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <span>Equipe</span>
              <h3>Ranking visual</h3>
            </div>
            <UsersIcon />
          </div>
          <div className="analytics-ranking">
            {rankingFrentistas.map((item, index) => (
              <div className="analytics-ranking-row" key={item.label}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.pedidos} vendas | {formatLiters(item.litros)}</small>
                  <i style={{ width: `${Math.max(item.share, 6)}%` }} />
                </div>
                <b>{formatCompactCurrency(item.valor)}</b>
              </div>
            ))}
            {rankingFrentistas.length === 0 ? <p className="dashboard-empty">Sem ranking de equipe.</p> : null}
          </div>
        </article>
      </div>

      <div className="analytics-insight-strip">
        <article>
          <span>Combustivel lider</span>
          <strong>{bestFuel?.label ?? 'Sem dados'}</strong>
          <p>{bestFuel ? `${formatNumber(bestFuel.share)}% da receita historica` : 'Aguardando vendas pagas'}</p>
        </article>
        <article>
          <span>Frentista destaque</span>
          <strong>{bestAttendant?.label ?? 'Sem dados'}</strong>
          <p>{bestAttendant ? `${formatCompactCurrency(bestAttendant.valor)} em vendas` : 'Aguardando vendas pagas'}</p>
        </article>
        <article>
          <span>Projecao operacional</span>
          <strong>{formatCurrency(forecastRevenue + valorPendente)}</strong>
          <p>Previsao somada aos pendentes atuais</p>
        </article>
      </div>
    </section>
  );
}
