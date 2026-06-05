// tests/unit/utils.test.js
import { formatCurrency, calcularTotal, filtrarPorCategoria } from '../../src/utils/finanzas';

describe('formatCurrency', () => {
  test('formatea número a moneda colombiana', () => {
    expect(formatCurrency(1500000)).toBe('$1.500.000');
  });
  test('retorna $0 para valor cero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
  test('maneja valores negativos', () => {
    expect(formatCurrency(-500)).toBe('-$500');
  });
});

describe('calcularTotal', () => {
  test('suma correctamente un array de transacciones', () => {
    const txs = [{ monto: 100 }, { monto: 200 }, { monto: 50 }];
    expect(calcularTotal(txs)).toBe(350);
  });
  test('retorna 0 para array vacío', () => {
    expect(calcularTotal([])).toBe(0);
  });
});

describe('filtrarPorCategoria', () => {
  const datos = [
    { categoria: 'comida', monto: 30 },
    { categoria: 'transporte', monto: 10 },
    { categoria: 'comida', monto: 20 },
  ];
  test('filtra correctamente por categoría', () => {
    expect(filtrarPorCategoria(datos, 'comida')).toHaveLength(2);
  });
  test('retorna vacío si categoría no existe', () => {
    expect(filtrarPorCategoria(datos, 'salud')).toHaveLength(0);
  });
});