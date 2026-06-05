// tests/unit/usePresupuesto.test.js
import { renderHook, act } from '@testing-library/react';
import usePresupuesto from '../../src/hooks/usePresupuesto';

test('inicia con presupuesto en 0', () => {
  const { result } = renderHook(() => usePresupuesto());
  expect(result.current.presupuesto).toBe(0);
});

test('actualiza presupuesto correctamente', () => {
  const { result } = renderHook(() => usePresupuesto());
  act(() => result.current.setPresupuesto(500000));
  expect(result.current.presupuesto).toBe(500000);
});

test('calcula disponible restando gastos', () => {
  const { result } = renderHook(() => usePresupuesto());
  act(() => {
    result.current.setPresupuesto(1000000);
    result.current.agregarGasto(300000);
  });
  expect(result.current.disponible).toBe(700000);
});