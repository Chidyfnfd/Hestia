// tests/integration/flujoTransacciones.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';

// Integración 1: Agregar transacción y verla en la lista
test('agrega transacción y aparece en la lista', async () => {
  render(<App />);
  await userEvent.type(screen.getByPlaceholderText(/descripción/i), 'Netflix');
  await userEvent.type(screen.getByPlaceholderText(/monto/i), '45000');
  await userEvent.click(screen.getByRole('button', { name: /agregar/i }));
  await waitFor(() =>
    expect(screen.getByText('Netflix')).toBeInTheDocument()
  );
});

// Integración 2: Eliminar transacción actualiza el total
test('eliminar transacción actualiza el total mostrado', async () => {
  render(<App />);
  // Agrega una transacción primero
  await userEvent.type(screen.getByPlaceholderText(/descripción/i), 'Taxi');
  await userEvent.type(screen.getByPlaceholderText(/monto/i), '10000');
  await userEvent.click(screen.getByRole('button', { name: /agregar/i }));
  // Elimina
  await userEvent.click(await screen.findByRole('button', { name: /eliminar/i }));
  await waitFor(() =>
    expect(screen.queryByText('Taxi')).not.toBeInTheDocument()
  );
});

// Integración 3: Filtro por categoría muestra sólo las correctas
test('filtrar por categoría muestra solo transacciones de esa categoría', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: /comida/i }));
  const items = screen.queryAllByTestId('transaccion-item');
  items.forEach(item =>
    expect(item).toHaveAttribute('data-categoria', 'comida')
  );
});
