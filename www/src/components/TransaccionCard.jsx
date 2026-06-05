import React from 'react';

export default function TransaccionCard({ transaccion, onEliminar }) {
  // Formateador rápido para cumplir con el test de "15.000"
  const montoFormateado = transaccion.monto.toLocaleString('es-CO');

  return (
    <div className="transaccion-card">
      <p>{transaccion.descripcion}</p>
      <span>{montoFormateado}</span>
      <button onClick={() => onEliminar?.(transaccion.id)}>
        Eliminar
      </button>
    </div>
  );
}