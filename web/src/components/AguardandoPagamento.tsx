import { FuelPumpIcon } from './FuelPumpIcon';
import { PumpOrder } from '../types';

type AguardandoPagamentoProps = {
  pedidos: PumpOrder[];
  onPagar: (id: number) => void;
  payingId: number | null;
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

export function AguardandoPagamento({ pedidos, onPagar, payingId }: AguardandoPagamentoProps) {
  return (
    <section className="routine-card">
      <div className="section-title-row">
        <h2>Aguardando pagamento</h2>
        <span className="count-pill count-pill-yellow">{pedidos.length}</span>
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
              <th>Acao</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>
                  <span className="pump-cell">
                    <span className="pump-icon pump-icon-yellow">
                      <FuelPumpIcon />
                    </span>
                    <strong className="pump-number pump-number-yellow">{pedido.pumpNumber}</strong>
                  </span>
                </td>
                <td>{pedido.fuel.name}</td>
                <td>{formatLiters(pedido.liters_delivered)}</td>
                <td>{formatCurrency(pedido.total_value)}</td>
                <td>{formatTime(pedido.created_at)}</td>
                <td>
                  <button
                    className="pay-button"
                    disabled={payingId === pedido.id}
                    onClick={() => onPagar(pedido.id)}
                    type="button"
                  >
                    <span aria-hidden="true">R$</span>
                    {payingId === pedido.id ? 'Finalizando...' : 'Finalizar e Pagar'}
                  </button>
                </td>
              </tr>
            ))}
            {pedidos.length === 0 ? (
              <tr>
                <td className="empty-table" colSpan={6}>
                  Nenhum pedido aguardando pagamento.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
