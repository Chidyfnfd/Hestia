// tests/unit/TransaccionCard.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransaccionCard from '../../src/components/TransaccionCard';

const mockTx = {
  id: 1,
  descripcion: 'Almuerzo',
  monto: 15000,
  categoria: 'comida',
  fecha: '2025-06-01',
};

test('renderiza descripción y monto', () => {
  render(<TransaccionCard transaccion={mockTx} />);
  expect(screen.getByText('Almuerzo')).toBeInTheDocument();
  expect(screen.getByText(/15.000/)).toBeInTheDocument();
});

test('llama onEliminar al hacer click en botón eliminar', async () => {
  const onEliminar = jest.fn();
  render(<TransaccionCard transaccion={mockTx} onEliminar={onEliminar} />);
  await userEvent.click(screen.getByRole('button', { name: /eliminar/i }));
  expect(onEliminar).toHaveBeenCalledWith(1);
});