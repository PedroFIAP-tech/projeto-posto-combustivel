import { FuelPumpIcon } from './FuelPumpIcon';
import { PumpOrder } from '../types';

type FinalizadosProps = {
  pedidos: PumpOrder[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatLiters = (value: number) => `${value.toFixed(2).replace('.', ',')} L`;

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date));

export function Finalizados({ pedidos }: FinalizadosProps) {
  return (
    <section className="routine-card">
      <div className="section-title-row">
        <h2>Abastecimentos finalizados</h2>
        <span className="count-pill count-pill-green">{pedidos.length}</span>
      </div>

      <div className="table-shell">
        <table className="routine-table">
          <thead>
            <tr>
              <th>Bomba</th>
              <th>Combustivel</th>
              <th>Litros</th>
              <th>Valor</th>
              <th>Termino</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>
                  <span className="pump-cell">
                    <span className="pump-icon pump-icon-green">
                      <FuelPumpIcon />
                    </span>
                    <strong className="pump-number pump-number-green">{pedido.pumpNumber}</strong>
                  </span>
                </td>
                <td>{pedido.fuel.name}</td>
                <td>{formatLiters(pedido.liters_delivered)}</td>
                <td>{formatCurrency(pedido.total_value)}</td>
                <td>{formatTime(pedido.created_at)}</td>
                <td>
                  <span className="status-badge status-green">Pago</span>
                </td>
              </tr>
            ))}
            {pedidos.length === 0 ? (
              <tr>
                <td className="empty-table" colSpan={6}>
                  Nenhum abastecimento finalizado hoje.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
