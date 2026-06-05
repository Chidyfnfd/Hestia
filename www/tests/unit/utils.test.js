const { formatCurrency, calcularTotal, filtrarPorCategoria } = require('../../src/utils/finanzas');

describe('formatCurrency', () => {
  test('retorna $0 para valor cero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
  test('retorna string para valor positivo', () => {
    expect(typeof formatCurrency(1500000)).toBe('string');
  });
  test('maneja valores negativos', () => {
    expect(formatCurrency(-500)).toContain('-');
  });
});

describe('calcularTotal', () => {
  test('suma correctamente un array de transacciones', () => {
    expect(calcularTotal([{ monto: 100 }, { monto: 200 }])).toBe(300);
  });
  test('retorna 0 para array vacio', () => {
    expect(calcularTotal([])).toBe(0);
  });
  test('suma tres valores', () => {
    expect(calcularTotal([{ monto: 50 }, { monto: 50 }, { monto: 50 }])).toBe(150);
  });
});

describe('filtrarPorCategoria', () => {
  const datos = [
    { categoria: 'comida', monto: 30 },
    { categoria: 'transporte', monto: 10 },
    { categoria: 'comida', monto: 20 },
  ];
  test('filtra correctamente dos resultados', () => {
    expect(filtrarPorCategoria(datos, 'comida')).toHaveLength(2);
  });
  test('retorna vacio si no existe categoria', () => {
    expect(filtrarPorCategoria(datos, 'salud')).toHaveLength(0);
  });
  test('filtra categoria con un resultado', () => {
    expect(filtrarPorCategoria(datos, 'transporte')).toHaveLength(1);
  });
});
