const { formatCurrency, calcularTotal, filtrarPorCategoria } = require('../../src/utils/finanzas');

describe('Integracion: flujo completo', () => {
  test('calcula total y lo formatea', () => {
    const txs = [
      { monto: 50000, categoria: 'comida' },
      { monto: 30000, categoria: 'transporte' },
      { monto: 20000, categoria: 'comida' },
    ];
    const total = calcularTotal(txs);
    expect(total).toBe(100000);
    expect(typeof formatCurrency(total)).toBe('string');
  });

  test('filtra por categoria y calcula subtotal', () => {
    const txs = [
      { monto: 50000, categoria: 'comida' },
      { monto: 30000, categoria: 'transporte' },
      { monto: 20000, categoria: 'comida' },
    ];
    const soloComida = filtrarPorCategoria(txs, 'comida');
    expect(calcularTotal(soloComida)).toBe(70000);
  });

  test('pipeline completo: filtrar sumar y formatear', () => {
    const txs = [
      { monto: 15000, categoria: 'ocio' },
      { monto: 85000, categoria: 'comida' },
    ];
    const filtradas = filtrarPorCategoria(txs, 'ocio');
    const total = calcularTotal(filtradas);
    expect(total).toBe(15000);
    expect(formatCurrency(total)).toBeDefined();
  });
});
