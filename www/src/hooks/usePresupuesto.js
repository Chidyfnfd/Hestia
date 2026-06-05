import { useState } from 'react';

export default function usePresupuesto() {
  const [presupuesto, setPresupuesto] = useState(0);
  const [gastos, setGastos] = useState([]);

  const agregarGasto = (monto) => {
    setGastos([...gastos, monto]);
  };

  const totalGastos = gastos.reduce((acc, curr) => acc + curr, 0);
  const disponible = presupuesto - totalGastos;

  return {
    presupuesto,
    setPresupuesto,
    agregarGasto,
    disponible
  };
}
