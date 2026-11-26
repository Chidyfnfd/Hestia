const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN INICIAL
// ============================================================================
const APP_VERSION = '2.0.0';
const DEVELOPERS = 'Erika Milena Bernal Miranda y Juan Diego Quintero Zambrano';

const DEFAULT_CATEGORIES = ['Servicios', 'Transporte', 'Comida', 'Hogar'];
const DEFAULT_METHODS = ['Crédito', 'Efectivo', 'Ahorros', 'Débito', 'Transferencia'];
const DEFAULT_RESPONSIBLES = ['Yo', 'Madre', 'Padre', 'Hijo', 'Abuelo'];

// Fuentes de ingreso predeterminadas vinculadas a cuentas iniciales
function buildDefaultIncomeSources(availableMethods) {
  const list = Array.isArray(availableMethods) && availableMethods.length > 0
    ? availableMethods
    : DEFAULT_METHODS;
  const primaryAccount = list.includes('Transferencia') ? 'Transferencia' : list[0];
  const secondaryAccount = list.includes('Efectivo') ? 'Efectivo' : list[0];

  return [
    { id: 'src-salario', name: 'Salario', defaultAccount: primaryAccount },
    { id: 'src-pago', name: 'Pago', defaultAccount: secondaryAccount }
  ];
}

// ============================================================================
// UTILIDADES DE FECHA, MIGRACIÓN Y ALMACENAMIENTO LOCAL (OFFLINE-FIRST)
// ============================================================================

// Parsea una fecha 'YYYY-MM-DD' en hora local evitando desfases UTC
function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  if (typeof dateStr === 'string' && dateStr.indexOf('T') !== -1) {
    return new Date(dateStr);
  }
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }
  return new Date(dateStr);
}

// Obtiene la fecha actual local en formato YYYY-MM-DD
function getTodayLocalISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Migra suavemente registros antiguos asegurando createdAt y updatedAt
function migrateTransactionRecord(item, fallbackType) {
  const safeItem = item && typeof item === 'object' ? item : {};
  const fallbackCreated = safeItem.createdAt
    ? safeItem.createdAt
    : safeItem.timestamp
    ? new Date(safeItem.timestamp).toISOString()
    : safeItem.date
    ? parseLocalDate(safeItem.date).toISOString()
    : new Date().toISOString();

  const fallbackUpdated = safeItem.updatedAt
    ? safeItem.updatedAt
    : safeItem.lastModified
    ? new Date(safeItem.lastModified).toISOString()
    : fallbackCreated;

  const base = Object.assign({}, safeItem, {
    id: safeItem.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    amount: Number(safeItem.amount) || 0,
    description: safeItem.description || 'Sin descripción',
    date: safeItem.date || getTodayLocalISO(),
    method: safeItem.method || 'Efectivo',
    responsible: safeItem.responsible || 'Yo',
    createdAt: fallbackCreated,
    updatedAt: fallbackUpdated,
    timestamp: safeItem.timestamp || new Date(fallbackCreated).getTime(),
    lastModified: safeItem.lastModified || new Date(fallbackUpdated).getTime()
  });

  if (fallbackType === 'income') {
    base.source = safeItem.source || safeItem.category || 'Salario';
    return base;
  }

  base.category = safeItem.category || 'General';
  return base;
}

// Migra fuentes de ingreso desde formato antiguo o estructura incompleta
function migrateIncomeSources(rawSources, availableMethods) {
  const list = Array.isArray(availableMethods) && availableMethods.length > 0
    ? availableMethods
    : DEFAULT_METHODS;
  if (!Array.isArray(rawSources) || rawSources.length === 0) {
    return buildDefaultIncomeSources(list);
  }
  const fallbackAcc = list[0] || 'Efectivo';
  return rawSources.map((src, idx) => {
    if (typeof src === 'string') {
      return {
        id: `src-migrated-${idx}-${src.toLowerCase().replace(/\s+/g, '-')}`,
        name: src,
        defaultAccount: fallbackAcc
      };
    }
    return {
      id: (src && src.id) || `src-${idx}-${Date.now()}`,
      name: (src && src.name) || 'Ingreso',
      defaultAccount: src && list.includes(src.defaultAccount) ? src.defaultAccount : fallbackAcc
    };
  });
}

// Hook personalizado para persistencia reactiva en localStorage con migración opcional
function useLocalDB(key, initialValue, migrateFn) {
  const [data, setData] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        const resolvedInit = typeof initialValue === 'function' ? initialValue() : initialValue;
        return migrateFn ? migrateFn(resolvedInit) : resolvedInit;
      }
      const parsed = JSON.parse(item);
      return migrateFn ? migrateFn(parsed) : parsed;
    } catch (error) {
      const resolvedInit = typeof initialValue === 'function' ? initialValue() : initialValue;
      return migrateFn ? migrateFn(resolvedInit) : resolvedInit;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error guardando en localStorage:', key, error);
    }
  }, [key, data]);

  return [data, setData];
}

// ============================================================================
// SISTEMA DE ICONOS SVG AUTOCONTENIDOS (100% OFFLINE SIN DEPENDENCIAS EXTERNAS)
// ============================================================================
function SvgIcon(props) {
  const size = props.size || 20;
  const className = props.className || '';
  const style = props.style || {};
  return React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: `shrink-0 ${className}`,
      style: style
    },
    props.children
  );
}

const Home = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('path', { d: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
    React.createElement('polyline', { points: '9 22 9 12 15 12 15 22' })
  );

const PieChart = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('path', { d: 'M21.21 15.89A10 10 0 1 1 8 2.83' }),
    React.createElement('path', { d: 'M22 12A10 10 0 0 0 12 2v10z' })
  );

const Wallet = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('path', {
      d: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1'
    }),
    React.createElement('path', { d: 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' })
  );

const Settings = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('circle', { cx: '12', cy: '12', r: '3' }),
    React.createElement('path', {
      d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'
    })
  );

const Info = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
    React.createElement('line', { x1: '12', y1: '16', x2: '12', y2: '12' }),
    React.createElement('line', { x1: '12', y1: '8', x2: '12.01', y2: '8' })
  );

const Plus = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
    React.createElement('line', { x1: '5', y1: '12', x2: '19', y2: '12' })
  );

const Calculator = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('rect', { x: '4', y: '2', width: '16', height: '20', rx: '2' }),
    React.createElement('line', { x1: '8', y1: '6', x2: '16', y2: '6' }),
    React.createElement('line', { x1: '16', y1: '14', x2: '16', y2: '18' }),
    React.createElement('path', { d: 'M16 10h.01' }),
    React.createElement('path', { d: 'M12 10h.01' }),
    React.createElement('path', { d: 'M8 10h.01' }),
    React.createElement('path', { d: 'M12 14h.01' }),
    React.createElement('path', { d: 'M8 14h.01' }),
    React.createElement('path', { d: 'M12 18h.01' }),
    React.createElement('path', { d: 'M8 18h.01' })
  );

const Moon = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('path', { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' })
  );

const Sun = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('circle', { cx: '12', cy: '12', r: '4' }),
    React.createElement('path', { d: 'M12 2v2' }),
    React.createElement('path', { d: 'M12 20v2' }),
    React.createElement('path', { d: 'm4.93 4.93 1.41 1.41' }),
    React.createElement('path', { d: 'm17.66 17.66 1.41 1.41' }),
    React.createElement('path', { d: 'M2 12h2' }),
    React.createElement('path', { d: 'M20 12h2' }),
    React.createElement('path', { d: 'm6.34 17.66-1.41 1.41' }),
    React.createElement('path', { d: 'm19.07 4.93-1.41 1.41' })
  );

const Edit2 = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('path', { d: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' })
  );

const Trash2 = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('polyline', { points: '3 6 5 6 21 6' }),
    React.createElement('path', {
      d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'
    }),
    React.createElement('line', { x1: '10', y1: '11', x2: '10', y2: '17' }),
    React.createElement('line', { x1: '14', y1: '11', x2: '14', y2: '17' })
  );

const X = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    React.createElement('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
  );

const Check = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('polyline', { points: '20 6 9 17 4 12' })
  );

const Filter = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('polygon', { points: '22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3' })
  );

const BarChart2 = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('line', { x1: '18', y1: '20', x2: '18', y2: '10' }),
    React.createElement('line', { x1: '12', y1: '20', x2: '12', y2: '4' }),
    React.createElement('line', { x1: '6', y1: '20', x2: '6', y2: '14' })
  );

const TrendingUp = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('polyline', { points: '23 6 13.5 15.5 8.5 10.5 1 18' }),
    React.createElement('polyline', { points: '17 6 23 6 23 12' })
  );

const ArrowDownLeft = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('line', { x1: '17', y1: '7', x2: '7', y2: '17' }),
    React.createElement('polyline', { points: '17 17 7 17 7 7' })
  );

const ArrowUpRight = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('line', { x1: '7', y1: '17', x2: '17', y2: '7' }),
    React.createElement('polyline', { points: '7 7 17 7 17 17' })
  );

const ChevronDown = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('polyline', { points: '6 9 12 15 18 9' })
  );

const Tag = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('path', {
      d: 'M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z'
    }),
    React.createElement('path', { d: 'M7 7h.01' })
  );

const CreditCard = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('rect', { x: '1', y: '4', width: '22', height: '16', rx: '2', ry: '2' }),
    React.createElement('line', { x1: '1', y1: '10', x2: '23', y2: '10' })
  );

const User = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
    React.createElement('circle', { cx: '12', cy: '7', r: '4' })
  );

const Calendar = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }),
    React.createElement('line', { x1: '16', y1: '2', x2: '16', y2: '6' }),
    React.createElement('line', { x1: '8', y1: '2', x2: '8', y2: '6' }),
    React.createElement('line', { x1: '3', y1: '10', x2: '21', y2: '10' })
  );

const DollarSign = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('line', { x1: '12', y1: '1', x2: '12', y2: '23' }),
    React.createElement('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' })
  );

const Maximize2 = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('polyline', { points: '15 3 21 3 21 9' }),
    React.createElement('polyline', { points: '9 21 3 21 3 15' }),
    React.createElement('line', { x1: '21', y1: '3', x2: '14', y2: '10' }),
    React.createElement('line', { x1: '3', y1: '21', x2: '10', y2: '14' })
  );

const Minimize2 = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('polyline', { points: '4 14 10 14 10 20' }),
    React.createElement('polyline', { points: '20 10 14 10 14 4' }),
    React.createElement('line', { x1: '14', y1: '10', x2: '21', y2: '3' }),
    React.createElement('line', { x1: '3', y1: '21', x2: '10', y2: '14' })
  );

const Download = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
    React.createElement('polyline', { points: '7 10 12 15 17 10' }),
    React.createElement('line', { x1: '12', y1: '15', x2: '12', y2: '3' })
  );

const Upload = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
    React.createElement('polyline', { points: '17 8 12 3 7 8' }),
    React.createElement('line', { x1: '12', y1: '3', x2: '12', y2: '15' })
  );

const Layers = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('polygon', { points: '12 2 2 7 12 12 22 7 12 2' }),
    React.createElement('polyline', { points: '2 17 12 22 22 17' }),
    React.createElement('polyline', { points: '2 12 12 17 22 12' })
  );

const AlertTriangle = (p) =>
  React.createElement(
    SvgIcon,
    p,
    React.createElement('path', {
      d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z'
    }),
    React.createElement('line', { x1: '12', y1: '9', x2: '12', y2: '13' }),
    React.createElement('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
  );

// Estilos complementarios para asegurar compatibilidad total con vendor/tailwind.css estático
const OFFLINE_EXTRA_CSS = `
  .hidden { display: none !important; }
  .sticky { position: sticky; }
  .inset-x-0 { left: 0; right: 0; }
  .inset-y-0 { top: 0; bottom: 0; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .ml-auto { margin-left: auto; }
  .self-start { align-self: flex-start; }
  .flex-wrap { flex-wrap: wrap; }
  .items-start { align-items: flex-start; }
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .col-span-2 { grid-column: span 2 / span 2; }
  .col-span-4 { grid-column: span 4 / span 4; }
  .row-span-2 { grid-row: span 2 / span 2; }
  .max-w-2xl { max-width: 42rem; }
  .max-w-7xl { max-width: 80rem; }
  .max-h-\\[85vh\\] { max-height: 85vh; }
  .max-h-\\[90vh\\] { max-height: 90vh; }
  .pb-24 { padding-bottom: 6rem; }
  .border-r { border-right-width: 1px; border-right-style: solid; }
  .leading-tight { line-height: 1.25; }
  .leading-relaxed { line-height: 1.625; }
  .underline { text-decoration: underline; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .shrink-0 { flex-shrink: 0; }
  .select-none { user-select: none; }
  .select-all { user-select: all; }
  .gap-1\\.5 { gap: 0.375rem; }
  .gap-2\\.5 { gap: 0.625rem; }
  .gap-3\\.5 { gap: 0.875rem; }
  .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
  .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
  .py-3\\.5 { padding-top: 0.875rem; padding-bottom: 0.875rem; }
  .px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
  .px-3\\.5 { padding-left: 0.875rem; padding-right: 0.875rem; }
  .pt-2\\.5 { padding-top: 0.625rem; }
  .mb-1\\.5 { margin-bottom: 0.375rem; }
  .mt-0\\.5 { margin-top: 0.125rem; }
  .mt-1\\.5 { margin-top: 0.375rem; }
  .w-14 { width: 3.5rem; }
  .h-14 { height: 3.5rem; }
  .w-20 { width: 5rem; }
  .h-20 { height: 5rem; }
  .w-28 { width: 7rem; }
  .h-28 { height: 7rem; }
  .w-40 { width: 10rem; }
  .h-1\\.5 { height: 0.375rem; }
  .pl-8 { padding-left: 2rem; }
  .pl-9 { padding-left: 2.25rem; }
  .opacity-40 { opacity: 0.4; }
  .cursor-not-allowed { cursor: not-allowed; }
  .min-w-\\[3\\.2rem\\] { min-width: 3.2rem; }
  .min-h-\\[420px\\] { min-height: 420px; }
  .max-w-\\[26px\\] { max-width: 26px; }
  .z-\\[60\\] { z-index: 60; }
  .z-\\[70\\] { z-index: 70; }
  .z-\\[75\\] { z-index: 75; }
  .z-\\[80\\] { z-index: 80; }
  .border-red-500\\/30 { border-color: rgba(239, 68, 68, 0.3); }
  .hover\\:bg-\\[\\#E32636\\]:hover { background-color: #E32636; }

  /* Slider personalizado para Tamaño de Interfaz */
  input[type="range"].hestia-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 9999px;
    outline: none;
    cursor: pointer;
  }
  input[type="range"].hestia-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    background: #E32636;
    border: 3px solid #ffffff;
    box-shadow: 0 2px 8px rgba(227, 38, 54, 0.55);
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  input[type="range"].hestia-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }
  input[type="range"].hestia-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    background: #E32636;
    border: 3px solid #ffffff;
    box-shadow: 0 2px 8px rgba(227, 38, 54, 0.55);
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  /* Colores verdes y acentos nuevos */
  .bg-green-600 { background-color: #16a34a; }
  .hover\\:bg-green-700:hover { background-color: #15803d; }
  .text-green-400 { color: #4ade80; }
  .text-green-500 { color: #22c55e; }
  .hover\\:text-green-500:hover { color: #22c55e; }
  .focus\\:border-green-500:focus { border-color: #22c55e; }
  .hover\\:border-green-500:hover { border-color: #22c55e; }
  .bg-green-500\\/10 { background-color: rgba(34, 197, 94, 0.12); }
  .hover\\:bg-green-500\\/15:hover { background-color: rgba(34, 197, 94, 0.16); }
  .hover\\:border-green-500\\/40:hover { border-color: rgba(34, 197, 94, 0.4); }

  .bg-red-500\\/10 { background-color: rgba(239, 68, 68, 0.12); }
  .bg-red-500\\/15 { background-color: rgba(239, 68, 68, 0.16); }
  .hover\\:bg-red-500\\/10:hover { background-color: rgba(239, 68, 68, 0.12); }
  .bg-blue-500\\/15 { background-color: rgba(59, 130, 246, 0.16); }
  .hover\\:bg-blue-500\\/15:hover { background-color: rgba(59, 130, 246, 0.16); }
  .text-blue-400 { color: #60a5fa; }

  .bg-white\\/15 { background-color: rgba(255, 255, 255, 0.15); }
  .text-white\\/85 { color: rgba(255, 255, 255, 0.85); }
  .bg-black\\/20 { background-color: rgba(0, 0, 0, 0.2); }
  .hover\\:bg-black\\/30:hover { background-color: rgba(0, 0, 0, 0.3); }
  .hover\\:bg-black\\/35:hover { background-color: rgba(0, 0, 0, 0.35); }
  .bg-black\\/75 { background-color: rgba(0, 0, 0, 0.75); }
  .bg-black\\/80 { background-color: rgba(0, 0, 0, 0.8); }
  .dark .dark\\:bg-gray-950 { background-color: #030712; }
  .dark .dark\\:bg-gray-900 { background-color: #111827; }
  .dark .dark\\:bg-gray-800 { background-color: #1f2937; }
  .dark .dark\\:hover\\:bg-gray-800:hover { background-color: #1f2937; }
  .dark .dark\\:hover\\:bg-gray-700:hover { background-color: #374151; }
  .dark .dark\\:border-gray-800 { border-color: #1f2937; }
  .dark .dark\\:border-gray-700 { border-color: #374151; }
  .dark .dark\\:hover\\:border-gray-700:hover { border-color: #374151; }
  .dark .dark\\:text-white { color: #ffffff; }
  .dark .dark\\:text-gray-100 { color: #f3f4f6; }
  .dark .dark\\:text-gray-200 { color: #e5e7eb; }
  .dark .dark\\:text-gray-300 { color: #d1d5db; }
  .dark .dark\\:text-gray-400 { color: #9ca3af; }
  .dark .dark\\:text-gray-500 { color: #6b7280; }
  .dark .dark\\:hover\\:text-white:hover { color: #ffffff; }
  .dark .dark\\:hover\\:text-gray-200:hover { color: #e5e7eb; }

  @media (min-width: 640px) {
    .sm\\:flex-row { flex-direction: row; }
    .sm\\:items-center { align-items: center; }
    .sm\\:self-auto { align-self: auto; }
    .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .sm\\:text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .sm\\:text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
  }

  @media (min-width: 768px) {
    .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .md\\:p-5 { padding: 1.25rem; }
    .md\\:p-6 { padding: 1.5rem; }
    .md\\:p-9 { padding: 2.25rem; }
    .md\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
    .md\\:text-5xl { font-size: 3rem; line-height: 1; }
  }

  /* Modo Vertical / Móvil / Tablet Portrait por defecto */
  .hestia-sidebar {
    display: none !important;
  }
  .hestia-mobile-header {
    display: flex !important;
    width: 100%;
  }
  .hestia-mobile-nav {
    display: flex !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
  }
  .hestia-main-shell {
    padding-left: 0 !important;
  }

  /* Barra lateral y 2 columnas solo en pantallas anchas (>= 1024px) y horizontales */
  @media (min-width: 1024px) and (orientation: landscape) {
    .hestia-sidebar {
      display: flex !important;
      width: 16rem;
      flex-direction: column;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
    }
    .hestia-mobile-header {
      display: none !important;
    }
    .hestia-mobile-nav {
      display: none !important;
    }
    .hestia-main-shell {
      padding-left: 16rem !important;
    }
    .lg\\:flex { display: flex !important; }
    .lg\\:hidden { display: none !important; }
    .lg\\:w-64 { width: 16rem; }
    .lg\\:flex-col { flex-direction: column; }
    .lg\\:fixed { position: fixed; }
    .lg\\:inset-y-0 { top: 0; bottom: 0; }
    .lg\\:left-0 { left: 0; }
    .lg\\:pl-64 { padding-left: 16rem; }
    .lg\\:pb-10 { padding-bottom: 2.5rem; }
    .lg\\:p-8 { padding: 2rem; }
    .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lg\\:bottom-6 { bottom: 1.5rem; }
    .lg\\:right-6 { right: 1.5rem; }
  }
`;

// ============================================================================
// COMPONENTE PRINCIPAL: APP
// ============================================================================
function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Preferencias de UI persistentes (modo oscuro activado por defecto)
  const [darkMode, setDarkMode] = useLocalDB('hestia_dark_mode', true);
  const [decimals, setDecimals] = useLocalDB('hestia_decimals', 0);
  const [appScale, setAppScale] = useLocalDB('hestia_scale', 16);

  // Navegación principal
  const [activeTab, setActiveTab] = useState('inicio');
  const [showAbout, setShowAbout] = useState(false);
  const [logoHeaderError, setLogoHeaderError] = useState(false);
  const [logoInfoError, setLogoInfoError] = useState(false);

  // Datos principales con migración automática de esquema
  const [expenses, setExpenses] = useLocalDB('hestia_expenses', [], (arr) =>
    Array.isArray(arr) ? arr.map((item) => migrateTransactionRecord(item, 'expense')) : []
  );
  const [incomes, setIncomes] = useLocalDB('hestia_incomes', [], (arr) =>
    Array.isArray(arr) ? arr.map((item) => migrateTransactionRecord(item, 'income')) : []
  );
  const [funds, setFunds] = useLocalDB('hestia_funds', []);
  const [categories, setCategories] = useLocalDB('hestia_categories', DEFAULT_CATEGORIES);
  const [methods, setMethods] = useLocalDB('hestia_methods', DEFAULT_METHODS);
  const [responsibles, setResponsibles] = useLocalDB('hestia_responsibles', DEFAULT_RESPONSIBLES);
  const [incomeSources, setIncomeSources] = useLocalDB(
    'hestia_income_sources',
    () => buildDefaultIncomeSources(DEFAULT_METHODS),
    (raw) => migrateIncomeSources(raw, methods)
  );

  // Modales de transacciones (Gastos e Ingresos)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState(null);

  // Sistema global de confirmación y notificaciones (reemplaza alert/confirm nativos)
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ id: Date.now(), message: message, type: type || 'success' });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const requestConfirm = (opts) => {
    setConfirmDialog({
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel || 'Confirmar',
      danger: opts.danger !== undefined ? opts.danger : true,
      onConfirm: opts.onConfirm
    });
  };

  // Pantalla de carga breve inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  // Sincronización de clase dark en documento
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Formateador monetario global
  const formatMoney = (val) => {
    const num = Number(val) || 0;
    return `$${num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  };

  // Cálculo unificado de saldo por cuenta (fondos/ajustes + ingresos - gastos)
  const calculateAccountBalance = (accountName) => {
    const totalFunds = funds
      .filter((f) => f.method === accountName)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalIncomes = incomes
      .filter((i) => i.method === accountName)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalExpenses = expenses
      .filter((e) => e.method === accountName)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return totalFunds + totalIncomes - totalExpenses;
  };

  // --- Handlers CRUD Gastos ---
  const openExpenseModal = (expense) => {
    setExpenseToEdit(expense || null);
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(false);
  };

  const handleSaveExpense = (expenseData) => {
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    if (expenseToEdit) {
      setExpenses((prev) =>
        prev.map((ex) =>
          ex.id === expenseData.id
            ? Object.assign({}, expenseData, {
                createdAt: ex.createdAt || nowIso,
                updatedAt: nowIso,
                timestamp: ex.timestamp || nowMs,
                lastModified: nowMs
              })
            : ex
        )
      );
      showToast('Gasto actualizado correctamente', 'success');
    } else {
      setExpenses((prev) => [
        Object.assign({}, expenseData, {
          createdAt: nowIso,
          updatedAt: nowIso,
          timestamp: nowMs,
          lastModified: nowMs
        }),
        ...prev
      ]);
      showToast('Gasto registrado correctamente', 'success');
    }
    closeExpenseModal();
  };

  const handleDeleteExpense = (id) => {
    requestConfirm({
      title: 'Eliminar Gasto',
      message:
        '¿Desea eliminar este registro de gasto permanentemente? El saldo de la cuenta asociada se recalculará.',
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: () => {
        setExpenses((prev) => prev.filter((ex) => ex.id !== id));
        showToast('Gasto eliminado', 'success');
      }
    });
  };

  // --- Handlers CRUD Ingresos ---
  const openIncomeModal = (income) => {
    setIncomeToEdit(income || null);
    setIsIncomeModalOpen(true);
  };

  const closeIncomeModal = () => {
    setIncomeToEdit(null);
    setIsIncomeModalOpen(false);
  };

  const handleSaveIncome = (incomeData) => {
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    if (incomeToEdit) {
      setIncomes((prev) =>
        prev.map((inc) =>
          inc.id === incomeData.id
            ? Object.assign({}, incomeData, {
                createdAt: inc.createdAt || nowIso,
                updatedAt: nowIso,
                timestamp: inc.timestamp || nowMs,
                lastModified: nowMs
              })
            : inc
        )
      );
      showToast(`Ingreso actualizado en cuenta ${incomeData.method}`, 'success');
    } else {
      setIncomes((prev) => [
        Object.assign({}, incomeData, {
          createdAt: nowIso,
          updatedAt: nowIso,
          timestamp: nowMs,
          lastModified: nowMs
        }),
        ...prev
      ]);
      showToast(`Ingreso sumado a ${incomeData.method}`, 'success');
    }
    closeIncomeModal();
  };

  const handleDeleteIncome = (id) => {
    requestConfirm({
      title: 'Eliminar Ingreso',
      message:
        '¿Desea eliminar este registro de ingreso permanentemente? El saldo de la cuenta asociada se ajustará.',
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: () => {
        setIncomes((prev) => prev.filter((inc) => inc.id !== id));
        showToast('Ingreso eliminado', 'success');
      }
    });
  };

  // --- Importación segura de perfil JSON ---
  const handleImportProfileData = (importedData) => {
    const migratedMethods =
      Array.isArray(importedData.methods) && importedData.methods.length > 0
        ? importedData.methods
        : DEFAULT_METHODS;

    const migratedCategories =
      Array.isArray(importedData.categories) && importedData.categories.length > 0
        ? importedData.categories
        : DEFAULT_CATEGORIES;

    const migratedResponsibles =
      Array.isArray(importedData.responsibles) && importedData.responsibles.length > 0
        ? importedData.responsibles
        : DEFAULT_RESPONSIBLES;

    const migratedSources = migrateIncomeSources(importedData.incomeSources, migratedMethods);

    const migratedIncomes = Array.isArray(importedData.incomes)
      ? importedData.incomes.map((item) => migrateTransactionRecord(item, 'income'))
      : [];

    const migratedExpenses = Array.isArray(importedData.expenses)
      ? importedData.expenses.map((item) => migrateTransactionRecord(item, 'expense'))
      : [];

    const migratedFunds = Array.isArray(importedData.funds) ? importedData.funds : [];

    setMethods(migratedMethods);
    setCategories(migratedCategories);
    setResponsibles(migratedResponsibles);
    setIncomeSources(migratedSources);
    setIncomes(migratedIncomes);
    setExpenses(migratedExpenses);
    setFunds(migratedFunds);

    if (importedData.preferences) {
      if (typeof importedData.preferences.darkMode === 'boolean') {
        setDarkMode(importedData.preferences.darkMode);
      }
      if (typeof importedData.preferences.decimals === 'number') {
        setDecimals(importedData.preferences.decimals);
      }
      if (typeof importedData.preferences.appScale === 'number') {
        setAppScale(importedData.preferences.appScale);
      }
    }

    showToast('Perfil restaurado con éxito', 'success');
  };

  // --- Borrado completo y restablecimiento de perfil ---
  const handleResetProfile = () => {
    try {
      const keysToClear = [
        'hestia_expenses',
        'hestia_incomes',
        'hestia_funds',
        'hestia_categories',
        'hestia_methods',
        'hestia_responsibles',
        'hestia_income_sources',
        'hestia_dark_mode',
        'hestia_decimals',
        'hestia_scale'
      ];
      keysToClear.forEach((k) => window.localStorage.removeItem(k));
    } catch (e) {
      console.error('Error limpiando localStorage:', e);
    }

    setMethods(DEFAULT_METHODS);
    setCategories(DEFAULT_CATEGORIES);
    setResponsibles(DEFAULT_RESPONSIBLES);
    setIncomeSources(buildDefaultIncomeSources(DEFAULT_METHODS));
    setIncomes([]);
    setExpenses([]);
    setFunds([]);
    setDarkMode(true);
    setDecimals(0);
    setAppScale(16);
    setActiveTab('inicio');
    showToast('Perfil borrado y restablecido de fábrica', 'success');
  };

  if (isLoading) return React.createElement(LoadingScreen, null);

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: React.createElement(Home, { size: 20 }) },
    { id: 'historial', label: 'Historial', icon: React.createElement(PieChart, { size: 20 }) },
    { id: 'capital', label: 'Capital', icon: React.createElement(Wallet, { size: 20 }) },
    {
      id: 'configuracion',
      label: 'Configuración',
      shortLabel: 'Config',
      icon: React.createElement(Settings, { size: 20 })
    }
  ];

  const globalTotalCapital = methods.reduce((acc, m) => acc + calculateAccountBalance(m), 0);

  return React.createElement(
    'div',
    {
      className: `${
        darkMode ? 'dark' : ''
      } min-h-screen w-full bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100 font-sans transition-colors duration-300`
    },
    React.createElement(
      'style',
      null,
      `:root { font-size: ${appScale}px; } ${OFFLINE_EXTRA_CSS}`
    ),

    // ========================================================================
    // BARRA LATERAL FIJA (SOLO PANTALLAS ANCHAS: lg:w-64)
    // ========================================================================
    React.createElement(
      'aside',
      {
        className:
          'hestia-sidebar hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 select-none'
      },
      // Marca / Cabecera Sidebar
      React.createElement(
        'div',
        {
          className: 'flex items-center justify-center px-6 py-5 bg-[#E32636] text-white shadow-md'
        },
        !logoHeaderError
          ? React.createElement('img', {
              src: 'LogoCabezaPag.png',
              alt: 'HESTIA Logo',
              onError: () => setLogoHeaderError(true),
              className: 'h-8 object-contain'
            })
          : React.createElement(
              'div',
              { className: 'flex items-center gap-3 w-full' },
              React.createElement(
                'div',
                {
                  className:
                    'w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-black text-xl tracking-tighter shadow-inner'
                },
                'H'
              ),
              React.createElement(
                'h1',
                { className: 'text-lg font-black tracking-widest leading-none' },
                'HESTIA'
              )
            )
      ),

      // Navegación Vertical
      React.createElement(
        'nav',
        { className: 'flex-1 px-3 py-6 space-y-1.5 overflow-y-auto' },
        navItems.map((item) => {
          const isActive = activeTab === item.id;
          return React.createElement(
            'button',
            {
              key: item.id,
              onClick: () => setActiveTab(item.id),
              className: `w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[#E32636] text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`
            },
            React.createElement(
              'span',
              { className: isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500' },
              item.icon
            ),
            React.createElement('span', null, item.label)
          );
        })
      ),

      // Resumen rápido en Sidebar
      React.createElement(
        'div',
        {
          className:
            'p-4 m-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        },
        React.createElement(
          'p',
          { className: 'text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1' },
          'Capital Total'
        ),
        React.createElement(
          'p',
          {
            className: `text-lg font-black truncate ${
              globalTotalCapital >= 0 ? 'text-green-500' : 'text-[#E32636]'
            }`
          },
          formatMoney(globalTotalCapital)
        ),
        React.createElement(
          'div',
          {
            className:
              'mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-[10px] text-gray-400 font-bold'
          },
          React.createElement('span', null, `v${APP_VERSION}`)
        )
      )
    ),

    // ========================================================================
    // CONTENEDOR PRINCIPAL DERECHO (CON DESPLAZAMIENTO INDEPENDIENTE)
    // ========================================================================
    React.createElement(
      'div',
      { className: 'hestia-main-shell flex-1 flex flex-col min-h-screen lg:pl-64' },

      // Cabecera superior con Logo para pantallas no anchas (< lg)
      React.createElement(
        'header',
        {
          className:
            'hestia-mobile-header lg:hidden flex justify-between items-center p-4 bg-[#E32636] text-white shadow-md sticky top-0 z-20'
        },
        React.createElement('div', { className: 'w-9' }),
        React.createElement(
          'div',
          { className: 'flex-1 flex justify-center items-center' },
          !logoHeaderError
            ? React.createElement('img', {
                src: 'LogoCabezaPag.png',
                alt: 'HESTIA Logo',
                onError: () => setLogoHeaderError(true),
                className: 'h-8 object-contain'
              })
            : React.createElement('h1', { className: 'text-xl font-black tracking-widest' }, 'HESTIA')
        ),
        React.createElement('div', { className: 'w-9' })
      ),

      // Área principal de contenido con desplazamiento independiente
      React.createElement(
        'main',
        { className: 'flex-1 overflow-y-auto pb-24 lg:pb-10 p-4 md:p-6 lg:p-8' },
        React.createElement(
          'div',
          { className: 'max-w-7xl mx-auto w-full' },
          activeTab === 'inicio' &&
            React.createElement(TabInicio, {
              incomes: incomes,
              expenses: expenses,
              formatMoney: formatMoney,
              onEditIncome: openIncomeModal,
              onDeleteIncome: handleDeleteIncome,
              onAddNewIncome: () => openIncomeModal(null),
              onEditExpense: openExpenseModal,
              onDeleteExpense: handleDeleteExpense,
              onAddNewExpense: () => openExpenseModal(null)
            }),

          activeTab === 'historial' &&
            React.createElement(TabHistorial, {
              incomes: incomes,
              expenses: expenses,
              incomeSources: incomeSources,
              categories: categories,
              methods: methods,
              responsibles: responsibles,
              formatMoney: formatMoney,
              onEditIncome: openIncomeModal,
              onDeleteIncome: handleDeleteIncome,
              onEditExpense: openExpenseModal,
              onDeleteExpense: handleDeleteExpense
            }),

          activeTab === 'capital' &&
            React.createElement(TabCapital, {
              methods: methods,
              setMethods: setMethods,
              funds: funds,
              setFunds: setFunds,
              incomes: incomes,
              setIncomes: setIncomes,
              expenses: expenses,
              setExpenses: setExpenses,
              incomeSources: incomeSources,
              setIncomeSources: setIncomeSources,
              calculateAccountBalance: calculateAccountBalance,
              formatMoney: formatMoney,
              requestConfirm: requestConfirm,
              showToast: showToast
            }),

          activeTab === 'configuracion' &&
            React.createElement(TabConfiguracion, {
              darkMode: darkMode,
              setDarkMode: setDarkMode,
              decimals: decimals,
              setDecimals: setDecimals,
              appScale: appScale,
              setAppScale: setAppScale,
              setShowAbout: setShowAbout,
              appState: {
                methods: methods,
                incomeSources: incomeSources,
                categories: categories,
                responsibles: responsibles,
                incomes: incomes,
                expenses: expenses,
                funds: funds,
                preferences: { darkMode: darkMode, decimals: decimals, appScale: appScale }
              },
              onImportProfile: handleImportProfileData,
              onResetProfile: handleResetProfile,
              requestConfirm: requestConfirm,
              showToast: showToast
            })
        )
      ),

      // Navegación Inferior para pantallas no anchas (< lg)
      React.createElement(
        'nav',
        {
          className:
            'hestia-mobile-nav lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center p-2 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] pb-safe'
        },
        navItems.map((item) =>
          React.createElement(NavItem, {
            key: item.id,
            icon: item.icon,
            label: item.shortLabel || item.label,
            isActive: activeTab === item.id,
            onClick: () => setActiveTab(item.id)
          })
        )
      )
    ),

    // ========================================================================
    // MODALES GLOBALES
    // ========================================================================
    showAbout &&
      React.createElement(
        Modal,
        { title: 'Información', onClose: () => setShowAbout(false) },
        React.createElement(
          'div',
          { className: 'flex flex-col items-center text-center space-y-4' },
          !logoInfoError
            ? React.createElement('img', {
                src: 'logoinfo.png',
                alt: 'Hestia Logo',
                onError: () => setLogoInfoError(true),
                className: 'w-20 h-20 object-contain drop-shadow-lg'
              })
            : React.createElement(
                'div',
                {
                  className:
                    'w-16 h-16 rounded-2xl bg-[#E32636] text-white flex items-center justify-center font-black text-3xl shadow-lg'
                },
                'H'
              ),
          React.createElement(
            'div',
            null,
            React.createElement(
              'h2',
              { className: 'text-2xl font-black text-gray-800 dark:text-white' },
              'Hestia'
            ),
            React.createElement(
              'p',
              { className: 'text-sm text-gray-500 dark:text-gray-400' },
              'Gestión Económica Personal'
            )
          ),
          React.createElement(
            'div',
            {
              className:
                'w-full border-t border-gray-100 dark:border-gray-800 py-4 mt-2 text-sm'
            },
            React.createElement(
              'p',
              { className: 'text-gray-700 dark:text-gray-300' },
              React.createElement('strong', null, 'Versión: '),
              APP_VERSION
            ),
            React.createElement(
              'p',
              { className: 'mt-2 text-gray-700 dark:text-gray-300' },
              React.createElement('strong', null, 'Desarrolladores:'),
              React.createElement('br', null),
              DEVELOPERS
            )
          )
        )
      ),

    isExpenseModalOpen &&
      React.createElement(ExpenseFormModal, {
        expense: expenseToEdit,
        onSave: handleSaveExpense,
        onClose: closeExpenseModal,
        categories: categories,
        methods: methods,
        responsibles: responsibles,
        setCategories: setCategories,
        setMethods: setMethods,
        setResponsibles: setResponsibles,
        requestConfirm: requestConfirm
      }),

    isIncomeModalOpen &&
      React.createElement(IncomeFormModal, {
        income: incomeToEdit,
        onSave: handleSaveIncome,
        onClose: closeIncomeModal,
        incomeSources: incomeSources,
        setIncomeSources: setIncomeSources,
        methods: methods,
        setMethods: setMethods,
        responsibles: responsibles,
        setResponsibles: setResponsibles,
        requestConfirm: requestConfirm
      }),

    confirmDialog &&
      React.createElement(ConfirmModal, {
        title: confirmDialog.title,
        message: confirmDialog.message,
        confirmLabel: confirmDialog.confirmLabel,
        danger: confirmDialog.danger,
        onCancel: () => setConfirmDialog(null),
        onConfirm: () => {
          const fn = confirmDialog.onConfirm;
          setConfirmDialog(null);
          if (fn) fn();
        }
      }),

    // Notificación Toast flotante
    toast &&
      React.createElement(
        'div',
        { className: 'fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[80]' },
        React.createElement(
          'div',
          {
            className: `flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white ${
              toast.type === 'error'
                ? 'bg-red-600'
                : 'bg-gray-900 dark:bg-gray-800 border border-gray-700'
            }`
          },
          toast.type === 'error'
            ? React.createElement(AlertTriangle, { size: 18, className: 'text-white' })
            : React.createElement(Check, { size: 18, className: 'text-green-400' }),
          React.createElement('span', null, toast.message)
        )
      )
  );
}

// ============================================================================
// PANTALLA DE CARGA INICIAL
// ============================================================================
function LoadingScreen() {
  const [logoError, setLogoError] = useState(false);
  return React.createElement(
    'div',
    {
      className:
        'min-h-screen bg-[#E32636] flex flex-col items-center justify-center text-white w-full'
    },
    React.createElement(
      'div',
      {
        style: { width: '3.5rem', height: '3.5rem' },
        className:
          'w-14 h-14 mb-4 bg-white rounded-2xl flex items-center justify-center shadow-xl animate-pulse overflow-hidden p-1.5'
      },
      !logoError
        ? React.createElement('img', {
            src: 'logocarga.png',
            alt: 'Logo Carga',
            onError: () => setLogoError(true),
            className: 'w-full h-full object-contain'
          })
        : React.createElement('span', { className: 'text-[#E32636] text-3xl font-black' }, 'H')
    ),
    React.createElement('h1', { className: 'text-2xl font-black tracking-widest mb-6' }, 'HESTIA'),
    React.createElement(
      'div',
      { className: 'w-40 h-1.5 bg-red-400/50 rounded-full overflow-hidden' },
      React.createElement('div', { className: 'h-full bg-white animate-loading' })
    ),
    React.createElement(
      'style',
      null,
      '@keyframes loading { 0% { width: 0%; } 100% { width: 100%; } } .animate-loading { animation: loading 0.9s ease-in-out forwards; }'
    )
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return React.createElement(
    'button',
    {
      onClick: onClick,
      className: `flex flex-col items-center p-2 transition-all duration-200 ${
        isActive ? 'text-[#E32636] scale-105' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'
      }`
    },
    icon,
    React.createElement('span', { className: 'text-[10px] mt-1 font-bold' }, label)
  );
}

// ============================================================================
// MÓDULO 2: VISTA INICIO (DASHBOARD DUAL CON FILTRADO JERÁRQUICO)
// ============================================================================
function filterAndSortDashboardList(items, filterMode) {
  let list = [...items];
  if (filterMode === '7days') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    list = list
      .filter((item) => parseLocalDate(item.date) >= sevenDaysAgo)
      .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));
  } else if (filterMode === 'added') {
    list.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : a.timestamp || 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : b.timestamp || 0;
      return tB - tA;
    });
  } else if (filterMode === 'edited') {
    list.sort((a, b) => {
      const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : a.lastModified || a.timestamp || 0;
      const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : b.lastModified || b.timestamp || 0;
      return tB - tA;
    });
  }
  return list.slice(0, 15);
}

function TabInicio({
  incomes,
  expenses,
  formatMoney,
  onEditIncome,
  onDeleteIncome,
  onAddNewIncome,
  onEditExpense,
  onDeleteExpense,
  onAddNewExpense
}) {
  // Filtro Global (Superior) e Individuales (por columna), iniciados en '7days'
  const [globalFilter, setGlobalFilter] = useState('7days');
  const [incomeFilter, setIncomeFilter] = useState('7days');
  const [expenseFilter, setExpenseFilter] = useState('7days');

  const handleGlobalFilterChange = (val) => {
    setGlobalFilter(val);
    setIncomeFilter(val);
    setExpenseFilter(val);
  };

  const handleIncomeFilterChange = (val) => {
    setIncomeFilter(val);
    setGlobalFilter(val === expenseFilter ? val : 'custom');
  };

  const handleExpenseFilterChange = (val) => {
    setExpenseFilter(val);
    setGlobalFilter(val === incomeFilter ? val : 'custom');
  };

  const displayedIncomes = useMemo(
    () => filterAndSortDashboardList(incomes, incomeFilter),
    [incomes, incomeFilter]
  );

  const displayedExpenses = useMemo(
    () => filterAndSortDashboardList(expenses, expenseFilter),
    [expenses, expenseFilter]
  );

  const totalDisplayedIncomes = displayedIncomes.reduce((acc, i) => acc + i.amount, 0);
  const totalDisplayedExpenses = displayedExpenses.reduce((acc, e) => acc + e.amount, 0);

  return React.createElement(
    'div',
    { className: 'space-y-6 animate-in fade-in duration-300' },

    // Cabecera de Vista con Filtro Global Sincronizado
    React.createElement(
      'div',
      {
        className:
          'flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 md:p-5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm'
      },
      React.createElement(
        'div',
        null,
        React.createElement(
          'h2',
          { className: 'text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight' },
          'Panel Principal'
        ),
        React.createElement(
          'p',
          { className: 'text-xs text-gray-500 dark:text-gray-400 mt-0.5' },
          'Resumen sincronizado de entradas y salidas'
        )
      ),

      // Selector Global
      React.createElement(
        'div',
        {
          className:
            'flex items-center gap-2.5 bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700'
        },
        React.createElement(Filter, { size: 16, className: 'text-[#E32636]' }),
        React.createElement(
          'span',
          { className: 'text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap' },
          'Filtro Global:'
        ),
        React.createElement(
          'div',
          { className: 'relative' },
          React.createElement(
            'select',
            {
              value: globalFilter,
              onChange: (e) => handleGlobalFilterChange(e.target.value),
              className:
                'appearance-none bg-transparent font-black text-xs sm:text-sm text-gray-800 dark:text-white pr-6 outline-none cursor-pointer'
            },
            React.createElement('option', { value: '7days', className: 'text-gray-900' }, 'Recientes (7 días)'),
            React.createElement('option', { value: 'added', className: 'text-gray-900' }, 'Últimos agregados'),
            React.createElement('option', { value: 'edited', className: 'text-gray-900' }, 'Últimos editados'),
            globalFilter === 'custom' &&
              React.createElement(
                'option',
                { value: 'custom', disabled: true, className: 'text-gray-500' },
                'Personalizado (por columna)'
              )
          ),
          React.createElement(ChevronDown, {
            size: 14,
            className: 'absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
          })
        )
      )
    ),

    // Distribución Dual en Dos Columnas Paralelas (grid-cols-1 lg:grid-cols-2)
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start' },

      // ======================================================================
      // COLUMNA IZQUIERDA: INGRESOS
      // ======================================================================
      React.createElement(
        'section',
        {
          className:
            'bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col min-h-[420px]'
        },
        // Encabezado de columna Ingresos
        React.createElement(
          'div',
          {
            className:
              'flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-800'
          },
          React.createElement(
            'div',
            { className: 'flex items-center gap-2.5' },
            React.createElement(
              'div',
              {
                className:
                  'w-9 h-9 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center'
              },
              React.createElement(ArrowDownLeft, { size: 20 })
            ),
            React.createElement(
              'div',
              null,
              React.createElement(
                'h3',
                { className: 'font-black text-base text-gray-900 dark:text-white leading-tight' },
                'Ingresos'
              ),
              React.createElement(
                'span',
                { className: 'text-xs font-extrabold text-green-500' },
                `+${formatMoney(totalDisplayedIncomes)}`
              )
            )
          ),

          React.createElement(
            'div',
            { className: 'flex items-center gap-2 ml-auto' },
            // Filtro Individual Ingresos
            React.createElement(
              'div',
              {
                className:
                  'relative bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5'
              },
              React.createElement(
                'select',
                {
                  value: incomeFilter,
                  onChange: (e) => handleIncomeFilterChange(e.target.value),
                  'aria-label': 'Filtrar ingresos',
                  className:
                    'appearance-none bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 pr-5 outline-none cursor-pointer'
                },
                React.createElement('option', { value: '7days', className: 'text-gray-900' }, 'Recientes (7 días)'),
                React.createElement('option', { value: 'added', className: 'text-gray-900' }, 'Últimos agregados'),
                React.createElement('option', { value: 'edited', className: 'text-gray-900' }, 'Últimos editados')
              ),
              React.createElement(ChevronDown, {
                size: 13,
                className: 'absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
              })
            ),

            // Botón Primario + Agregar Ingreso
            React.createElement(
              'button',
              {
                onClick: onAddNewIncome,
                className:
                  'bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all'
              },
              React.createElement(Plus, { size: 15 }),
              React.createElement('span', null, 'Agregar Ingreso')
            )
          )
        ),

        // Listado de Ingresos
        displayedIncomes.length === 0
          ? React.createElement(
              'div',
              {
                className:
                  'flex-1 flex flex-col items-center justify-center text-gray-400 py-12 opacity-60'
              },
              React.createElement(Check, { size: 42, className: 'mb-2 text-green-500' }),
              React.createElement('p', { className: 'text-sm font-medium' }, 'Sin ingresos para este filtro.')
            )
          : React.createElement(
              'div',
              { className: 'space-y-2.5' },
              displayedIncomes.map((inc) =>
                React.createElement(
                  'div',
                  {
                    key: inc.id,
                    className:
                      'flex justify-between items-center p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all'
                  },
                  React.createElement(
                    'div',
                    { className: 'flex-1 overflow-hidden pr-3' },
                    React.createElement(
                      'p',
                      { className: 'font-bold text-sm text-gray-800 dark:text-gray-100 truncate' },
                      inc.description
                    ),
                    React.createElement(
                      'p',
                      { className: 'text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium' },
                      `${inc.date} • `,
                      React.createElement(
                        'span',
                        { className: 'text-green-500 font-bold' },
                        `Fuente: ${inc.source}`
                      ),
                      ` • ${inc.method}`
                    )
                  ),

                  React.createElement(
                    'div',
                    { className: 'flex items-center gap-3 shrink-0' },
                    React.createElement(
                      'span',
                      { className: 'font-black text-green-500 whitespace-nowrap' },
                      `+${formatMoney(inc.amount)}`
                    ),
                    React.createElement(
                      'div',
                      { className: 'flex gap-1' },
                      React.createElement(
                        'button',
                        {
                          onClick: () => onEditIncome(inc),
                          title: 'Editar ingreso',
                          className:
                            'p-1.5 text-gray-400 hover:text-blue-500 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors'
                        },
                        React.createElement(Edit2, { size: 14 })
                      ),
                      React.createElement(
                        'button',
                        {
                          onClick: () => onDeleteIncome(inc.id),
                          title: 'Eliminar ingreso',
                          className:
                            'p-1.5 text-gray-400 hover:text-[#E32636] bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors'
                        },
                        React.createElement(Trash2, { size: 14 })
                      )
                    )
                  )
                )
              )
            )
      ),

      // ======================================================================
      // COLUMNA DERECHA: GASTOS
      // ======================================================================
      React.createElement(
        'section',
        {
          className:
            'bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col min-h-[420px]'
        },
        // Encabezado de columna Gastos
        React.createElement(
          'div',
          {
            className:
              'flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100 dark:border-gray-800'
          },
          React.createElement(
            'div',
            { className: 'flex items-center gap-2.5' },
            React.createElement(
              'div',
              {
                className:
                  'w-9 h-9 rounded-2xl bg-red-500/10 text-[#E32636] flex items-center justify-center'
              },
              React.createElement(ArrowUpRight, { size: 20 })
            ),
            React.createElement(
              'div',
              null,
              React.createElement(
                'h3',
                { className: 'font-black text-base text-gray-900 dark:text-white leading-tight' },
                'Gastos'
              ),
              React.createElement(
                'span',
                { className: 'text-xs font-extrabold text-[#E32636]' },
                `-${formatMoney(totalDisplayedExpenses)}`
              )
            )
          ),

          React.createElement(
            'div',
            { className: 'flex items-center gap-2 ml-auto' },
            // Filtro Individual Gastos
            React.createElement(
              'div',
              {
                className:
                  'relative bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5'
              },
              React.createElement(
                'select',
                {
                  value: expenseFilter,
                  onChange: (e) => handleExpenseFilterChange(e.target.value),
                  'aria-label': 'Filtrar gastos',
                  className:
                    'appearance-none bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 pr-5 outline-none cursor-pointer'
                },
                React.createElement('option', { value: '7days', className: 'text-gray-900' }, 'Recientes (7 días)'),
                React.createElement('option', { value: 'added', className: 'text-gray-900' }, 'Últimos agregados'),
                React.createElement('option', { value: 'edited', className: 'text-gray-900' }, 'Últimos editados')
              ),
              React.createElement(ChevronDown, {
                size: 13,
                className: 'absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none'
              })
            ),

            // Botón Primario + Agregar Gasto
            React.createElement(
              'button',
              {
                onClick: onAddNewExpense,
                className:
                  'bg-[#E32636] hover:bg-red-700 text-white px-3.5 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all'
              },
              React.createElement(Plus, { size: 15 }),
              React.createElement('span', null, 'Agregar Gasto')
            )
          )
        ),

        // Listado de Gastos
        displayedExpenses.length === 0
          ? React.createElement(
              'div',
              {
                className:
                  'flex-1 flex flex-col items-center justify-center text-gray-400 py-12 opacity-60'
              },
              React.createElement(Check, { size: 42, className: 'mb-2 text-[#E32636]' }),
              React.createElement('p', { className: 'text-sm font-medium' }, 'Sin gastos para este filtro.')
            )
          : React.createElement(
              'div',
              { className: 'space-y-2.5' },
              displayedExpenses.map((ex) =>
                React.createElement(
                  'div',
                  {
                    key: ex.id,
                    className:
                      'flex justify-between items-center p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all'
                  },
                  React.createElement(
                    'div',
                    { className: 'flex-1 overflow-hidden pr-3' },
                    React.createElement(
                      'p',
                      { className: 'font-bold text-sm text-gray-800 dark:text-gray-100 truncate' },
                      ex.description
                    ),
                    React.createElement(
                      'p',
                      { className: 'text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium' },
                      `${ex.date} • `,
                      React.createElement(
                        'span',
                        { className: 'text-[#E32636] font-bold' },
                        `Uso: ${ex.category}`
                      ),
                      ` • ${ex.method}`
                    )
                  ),

                  React.createElement(
                    'div',
                    { className: 'flex items-center gap-3 shrink-0' },
                    React.createElement(
                      'span',
                      { className: 'font-black text-[#E32636] whitespace-nowrap' },
                      `-${formatMoney(ex.amount)}`
                    ),
                    React.createElement(
                      'div',
                      { className: 'flex gap-1' },
                      React.createElement(
                        'button',
                        {
                          onClick: () => onEditExpense(ex),
                          title: 'Editar gasto',
                          className:
                            'p-1.5 text-gray-400 hover:text-blue-500 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors'
                        },
                        React.createElement(Edit2, { size: 14 })
                      ),
                      React.createElement(
                        'button',
                        {
                          onClick: () => onDeleteExpense(ex.id),
                          title: 'Eliminar gasto',
                          className:
                            'p-1.5 text-gray-400 hover:text-[#E32636] bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors'
                        },
                        React.createElement(Trash2, { size: 14 })
                      )
                    )
                  )
                )
              )
            )
      )
    )
  );
}

// ============================================================================
// MÓDULO 3: VISTA HISTORIAL Y ANALÍTICA (VISTA DIVIDIDA + MODO EXPANDIR)
// ============================================================================
function TabHistorial({
  incomes,
  expenses,
  incomeSources,
  categories,
  methods,
  responsibles,
  formatMoney,
  onEditIncome,
  onDeleteIncome,
  onEditExpense,
  onDeleteExpense
}) {
  // Controla si un panel está expandido al 100%: null | 'incomes' | 'expenses'
  const [expandedPanel, setExpandedPanel] = useState(null);

  const toggleExpand = (panelKey) => {
    setExpandedPanel((prev) => (prev === panelKey ? null : panelKey));
  };

  const sourceNames = useMemo(() => incomeSources.map((s) => s.name), [incomeSources]);

  return React.createElement(
    'div',
    { className: 'space-y-5 animate-in fade-in duration-300 pb-8' },
    React.createElement(
      'div',
      { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2' },
      React.createElement(
        'div',
        null,
        React.createElement(
          'h2',
          { className: 'text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight' },
          'Historial y Analítica'
        ),
        React.createElement(
          'p',
          { className: 'text-xs text-gray-500 dark:text-gray-400' },
          'Comparativa detallada de ingresos y gastos con filtros y gráficos independientes'
        )
      ),
      expandedPanel &&
        React.createElement(
          'button',
          {
            onClick: () => setExpandedPanel(null),
            className:
              'self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition'
          },
          React.createElement(Minimize2, { size: 14 }),
          React.createElement('span', null, 'Restaurar vista dividida')
        )
    ),

    React.createElement(
      'div',
      {
        className: `grid gap-6 ${
          expandedPanel ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
        }`
      },
      // PANEL IZQUIERDO: INGRESOS
      expandedPanel !== 'expenses' &&
        React.createElement(AnalyticsColumnPanel, {
          mode: 'income',
          title: 'Total Ingresado',
          items: incomes,
          groupField: 'source',
          groupLabel: 'Fuente',
          groupOptions: sourceNames,
          methods: methods,
          responsibles: responsibles,
          formatMoney: formatMoney,
          onEdit: onEditIncome,
          onDelete: onDeleteIncome,
          isExpanded: expandedPanel === 'incomes',
          onToggleExpand: () => toggleExpand('incomes')
        }),

      // PANEL DERECHO: GASTOS
      expandedPanel !== 'incomes' &&
        React.createElement(AnalyticsColumnPanel, {
          mode: 'expense',
          title: 'Total Gastado',
          items: expenses,
          groupField: 'category',
          groupLabel: 'Uso',
          groupOptions: categories,
          methods: methods,
          responsibles: responsibles,
          formatMoney: formatMoney,
          onEdit: onEditExpense,
          onDelete: onDeleteExpense,
          isExpanded: expandedPanel === 'expenses',
          onToggleExpand: () => toggleExpand('expenses')
        })
    )
  );
}

// Columna analítica autónoma para Ingresos o Gastos
function AnalyticsColumnPanel({
  mode,
  title,
  items,
  groupField,
  groupLabel,
  groupOptions,
  methods,
  responsibles,
  formatMoney,
  onEdit,
  onDelete,
  isExpanded,
  onToggleExpand
}) {
  const isIncome = mode === 'income';
  const [timeFilter, setTimeFilter] = useState('mes');
  const [chartType, setChartType] = useState('torta');
  const [groupFilter, setGroupFilter] = useState('Todos');
  const [methodFilter, setMethodFilter] = useState('Todos');
  const [respFilter, setRespFilter] = useState('Todos');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  const filteredData = useMemo(() => {
    let data = items;
    const now = new Date();

    if (timeFilter !== 'historico') {
      data = data.filter((item) => {
        const d = parseLocalDate(item.date);
        if (timeFilter === 'año') return d.getFullYear() === now.getFullYear();
        if (timeFilter === 'mes')
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (timeFilter === 'semana') {
          const pastWeek = new Date(now);
          pastWeek.setDate(now.getDate() - 7);
          pastWeek.setHours(0, 0, 0, 0);
          return d >= pastWeek;
        }
        if (timeFilter === 'dia') return d.toDateString() === now.toDateString();
        return true;
      });
    }

    if (dateRange.start) {
      const startD = parseLocalDate(dateRange.start);
      startD.setHours(0, 0, 0, 0);
      data = data.filter((item) => parseLocalDate(item.date) >= startD);
    }
    if (dateRange.end) {
      const endD = parseLocalDate(dateRange.end);
      endD.setHours(23, 59, 59, 999);
      data = data.filter((item) => parseLocalDate(item.date) <= endD);
    }

    if (groupFilter !== 'Todos') {
      data = data.filter((item) => item[groupField] === groupFilter);
    }
    if (methodFilter !== 'Todos') {
      data = data.filter((item) => item.method === methodFilter);
    }
    if (respFilter !== 'Todos') {
      data = data.filter((item) => item.responsible === respFilter);
    }

    return [...data].sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date));
  }, [items, timeFilter, groupFilter, groupField, methodFilter, respFilter, dateRange]);

  const total = filteredData.reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = useMemo(() => {
    const grouped = {};
    filteredData.forEach((item) => {
      const key = item[groupField] || 'General';
      grouped[key] = (grouped[key] || 0) + item.amount;
    });
    return Object.entries(grouped)
      .map(([label, value]) => ({ label: label, value: value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData, groupField]);

  const COLORS = isIncome
    ? ['#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#14B8A6', '#84CC16', '#F59E0B']
    : ['#E32636', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#64748B'];

  const activeFilterCount =
    (groupFilter !== 'Todos' ? 1 : 0) +
    (methodFilter !== 'Todos' ? 1 : 0) +
    (respFilter !== 'Todos' ? 1 : 0) +
    (dateRange.start ? 1 : 0) +
    (dateRange.end ? 1 : 0);

  const clearFilters = () => {
    setGroupFilter('Todos');
    setMethodFilter('Todos');
    setRespFilter('Todos');
    setDateRange({ start: '', end: '' });
  };

  return React.createElement(
    'div',
    {
      className:
        'space-y-4 bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-3xl border border-gray-200 dark:border-gray-800'
    },
    // Tarjeta Principal de Total + Botón Expandir/Contraer
    React.createElement(
      'div',
      {
        className: `${
          isIncome ? 'bg-green-600' : 'bg-[#E32636]'
        } text-white rounded-3xl p-5 shadow-xl relative overflow-hidden`
      },
      React.createElement(
        'div',
        { className: 'relative z-10' },
        React.createElement(
          'div',
          { className: 'flex justify-between items-center gap-2 mb-2' },
          React.createElement(
            'h3',
            { className: 'text-white/85 font-black uppercase text-xs tracking-widest' },
            title
          ),
          React.createElement(
            'div',
            { className: 'flex items-center gap-2' },
            React.createElement(
              'select',
              {
                value: timeFilter,
                onChange: (e) => setTimeFilter(e.target.value),
                className:
                  'bg-black/20 hover:bg-black/30 border-none text-white text-xs font-bold px-2.5 py-1.5 rounded-xl outline-none cursor-pointer transition'
              },
              React.createElement('option', { value: 'dia', className: 'text-black' }, 'Día'),
              React.createElement('option', { value: 'semana', className: 'text-black' }, 'Semana'),
              React.createElement('option', { value: 'mes', className: 'text-black' }, 'Mes'),
              React.createElement('option', { value: 'año', className: 'text-black' }, 'Año'),
              React.createElement('option', { value: 'historico', className: 'text-black' }, 'Total')
            ),
            // Botón Expandir / Contraer en esquina superior derecha
            React.createElement(
              'button',
              {
                onClick: onToggleExpand,
                title: isExpanded ? 'Contraer vista' : 'Expandir al 100%',
                className:
                  'p-2 bg-black/20 hover:bg-black/35 rounded-xl text-white transition active:scale-95'
              },
              isExpanded
                ? React.createElement(Minimize2, { size: 16 })
                : React.createElement(Maximize2, { size: 16 })
            )
          )
        ),
        React.createElement(
          'p',
          { className: 'text-3xl sm:text-4xl font-black tracking-tight' },
          formatMoney(total)
        )
      )
    ),

    // Contenedor de Filtros Independientes
    React.createElement(
      'div',
      {
        className:
          'bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700'
      },
      React.createElement(
        'button',
        {
          onClick: () => setShowFilters(!showFilters),
          className:
            'flex items-center justify-between w-full text-gray-700 dark:text-white font-bold text-sm'
        },
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement(Filter, {
            size: 16,
            className: isIncome ? 'text-green-500' : 'text-[#E32636]'
          }),
          React.createElement('span', null, `Filtros (${isIncome ? 'Ingresos' : 'Gastos'})`),
          activeFilterCount > 0 &&
            React.createElement(
              'span',
              {
                className: `text-[10px] font-black px-2 py-0.5 rounded-full text-white ${
                  isIncome ? 'bg-green-600' : 'bg-[#E32636]'
                }`
              },
              activeFilterCount
            )
        ),
        React.createElement(ChevronDown, {
          size: 18,
          className: `transform transition-transform ${showFilters ? 'rotate-180' : ''}`
        })
      ),

      showFilters &&
        React.createElement(
          'div',
          { className: 'mt-4 space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700' },
          React.createElement(
            'div',
            { className: 'grid grid-cols-2 gap-3' },
            React.createElement(
              'div',
              { className: 'flex flex-col' },
              React.createElement(
                'label',
                { className: 'text-[10px] text-gray-500 uppercase font-bold mb-1 ml-1' },
                'Fecha Desde'
              ),
              React.createElement('input', {
                type: 'date',
                value: dateRange.start,
                onChange: (e) => setDateRange({ start: e.target.value, end: dateRange.end }),
                className:
                  'w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2 text-xs dark:text-white dark:[color-scheme:dark] outline-none'
              })
            ),
            React.createElement(
              'div',
              { className: 'flex flex-col' },
              React.createElement(
                'label',
                { className: 'text-[10px] text-gray-500 uppercase font-bold mb-1 ml-1' },
                'Fecha Hasta'
              ),
              React.createElement('input', {
                type: 'date',
                value: dateRange.end,
                onChange: (e) => setDateRange({ start: dateRange.start, end: e.target.value }),
                className:
                  'w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2 text-xs dark:text-white dark:[color-scheme:dark] outline-none'
              })
            )
          ),

          React.createElement(
            'div',
            { className: `grid gap-2 ${isExpanded ? 'sm:grid-cols-3' : 'grid-cols-1'}` },
            React.createElement(
              'select',
              {
                value: groupFilter,
                onChange: (e) => setGroupFilter(e.target.value),
                className:
                  'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-semibold dark:text-white outline-none'
              },
              React.createElement(
                'option',
                { value: 'Todos' },
                isIncome ? 'Todas las Fuentes' : 'Todos los Usos'
              ),
              groupOptions.map((opt) =>
                React.createElement('option', { key: opt, value: opt }, opt)
              )
            ),

            React.createElement(
              'select',
              {
                value: methodFilter,
                onChange: (e) => setMethodFilter(e.target.value),
                className:
                  'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-semibold dark:text-white outline-none'
              },
              React.createElement('option', { value: 'Todos' }, 'Todas las Cuentas'),
              methods.map((m) => React.createElement('option', { key: m, value: m }, m))
            ),

            React.createElement(
              'select',
              {
                value: respFilter,
                onChange: (e) => setRespFilter(e.target.value),
                className:
                  'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs font-semibold dark:text-white outline-none'
              },
              React.createElement('option', { value: 'Todos' }, 'Todos los Responsables'),
              responsibles.map((r) => React.createElement('option', { key: r, value: r }, r))
            )
          ),

          activeFilterCount > 0 &&
            React.createElement(
              'button',
              {
                onClick: clearFilters,
                className: 'text-xs font-bold text-gray-400 hover:text-gray-200 underline'
              },
              'Limpiar filtros'
            )
        )
    ),

    // Bloque de Estadísticas / Gráficos Independientes
    React.createElement(
      'div',
      {
        className:
          'bg-gray-50 dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700'
      },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center mb-4' },
        React.createElement(
          'h3',
          { className: 'font-black text-sm text-gray-800 dark:text-white' },
          `Estadísticas por ${groupLabel}`
        ),
        React.createElement(
          'div',
          { className: 'flex bg-gray-200 dark:bg-gray-900 rounded-xl p-1' },
          React.createElement(
            'button',
            {
              onClick: () => setChartType('torta'),
              className: `p-1.5 rounded-lg transition ${
                chartType === 'torta'
                  ? `bg-white dark:bg-gray-700 shadow ${
                      isIncome ? 'text-green-500' : 'text-[#E32636]'
                    }`
                  : 'text-gray-400'
              }`
            },
            React.createElement(PieChart, { size: 16 })
          ),
          React.createElement(
            'button',
            {
              onClick: () => setChartType('barras'),
              className: `p-1.5 rounded-lg transition ${
                chartType === 'barras'
                  ? `bg-white dark:bg-gray-700 shadow ${
                      isIncome ? 'text-green-500' : 'text-[#E32636]'
                    }`
                  : 'text-gray-400'
              }`
            },
            React.createElement(BarChart2, { size: 16 })
          ),
          React.createElement(
            'button',
            {
              onClick: () => setChartType('linea'),
              className: `p-1.5 rounded-lg transition ${
                chartType === 'linea'
                  ? `bg-white dark:bg-gray-700 shadow ${
                      isIncome ? 'text-green-500' : 'text-[#E32636]'
                    }`
                  : 'text-gray-400'
              }`
            },
            React.createElement(TrendingUp, { size: 16 })
          )
        )
      ),

      total === 0
        ? React.createElement(
            'div',
            { className: 'h-40 flex items-center justify-center text-gray-400 text-xs' },
            'Sin datos para visualizar en este período'
          )
        : React.createElement(
            'div',
            { className: 'h-48 flex justify-center items-end relative w-full' },
            chartType === 'torta' &&
              React.createElement(CustomPieChart, { data: chartData, colors: COLORS, total: total }),
            chartType === 'barras' &&
              React.createElement(CustomBarChart, {
                data: chartData,
                colors: COLORS,
                max: Math.max(...chartData.map((d) => d.value)),
                formatMoney: formatMoney
              }),
            chartType === 'linea' &&
              React.createElement(CustomLineChart, {
                data: filteredData,
                accentColor: isIncome ? '#10B981' : '#E32636',
                gradientId: `areaGrad-${mode}`
              })
          )
    ),

    // Listado Filtrado
    React.createElement(
      'div',
      {
        className:
          'bg-gray-50 dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700'
      },
      React.createElement(
        'h3',
        { className: 'font-black text-sm text-gray-800 dark:text-white mb-4' },
        `Listado (${filteredData.length})`
      ),

      filteredData.length === 0
        ? React.createElement(
            'p',
            { className: 'text-xs text-gray-400 text-center py-6' },
            'No se encontraron registros con los filtros seleccionados.'
          )
        : React.createElement(
            'div',
            { className: `grid gap-2.5 ${isExpanded ? 'md:grid-cols-2' : 'grid-cols-1'}` },
            filteredData.map((item) =>
              React.createElement(
                'div',
                {
                  key: item.id,
                  className:
                    'flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow'
                },
                React.createElement(
                  'div',
                  { className: 'flex-1 overflow-hidden pr-2' },
                  React.createElement(
                    'p',
                    { className: 'font-bold text-sm text-gray-800 dark:text-gray-100 truncate' },
                    item.description
                  ),
                  React.createElement(
                    'p',
                    { className: 'text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium' },
                    `${item.date} • ${item[groupField]} • ${item.method}`
                  )
                ),

                React.createElement(
                  'div',
                  { className: 'flex items-center gap-2.5' },
                  React.createElement(
                    'span',
                    {
                      className: `font-black whitespace-nowrap text-sm ${
                        isIncome ? 'text-green-500' : 'text-[#E32636]'
                      }`
                    },
                    `${isIncome ? '+' : '-'}${formatMoney(item.amount)}`
                  ),
                  React.createElement(
                    'div',
                    { className: 'flex gap-1' },
                    React.createElement(
                      'button',
                      {
                        onClick: () => onEdit(item),
                        className:
                          'p-1.5 text-gray-400 hover:text-blue-500 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700'
                      },
                      React.createElement(Edit2, { size: 13 })
                    ),
                    React.createElement(
                      'button',
                      {
                        onClick: () => onDelete(item.id),
                        className:
                          'p-1.5 text-gray-400 hover:text-[#E32636] bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700'
                      },
                      React.createElement(Trash2, { size: 13 })
                    )
                  )
                )
              )
            )
          )
    )
  );
}

// ============================================================================
// MÓDULO 4: VISTA CAPITAL Y FUENTES DE INGRESO
// ============================================================================
function TabCapital({
  methods,
  setMethods,
  funds,
  setFunds,
  incomes,
  setIncomes,
  expenses,
  setExpenses,
  incomeSources,
  setIncomeSources,
  calculateAccountBalance,
  formatMoney,
  requestConfirm,
  showToast
}) {
  // Estados para Cuentas
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountInitialBalance, setNewAccountInitialBalance] = useState('');

  const [editingAccount, setEditingAccount] = useState(null);

  // Estados para Fuentes de Ingreso
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [sourceNameInput, setSourceNameInput] = useState('');
  const [sourceAccountInput, setSourceAccountInput] = useState(methods[0] || '');

  const globalBalance = methods.reduce((acc, method) => acc + calculateAccountBalance(method), 0);

  // Crear nueva cuenta
  const handleAddAccount = (e) => {
    e.preventDefault();
    const val = newAccountName.trim();
    if (!val) return;
    if (methods.includes(val)) {
      showToast('Ya existe una cuenta con ese nombre', 'error');
      return;
    }

    setMethods([...methods, val]);
    const initBal = parseFloat(newAccountInitialBalance);
    if (!isNaN(initBal) && initBal !== 0) {
      setFunds([
        ...funds,
        {
          id: Date.now().toString(),
          method: val,
          amount: initBal,
          date: new Date().toISOString(),
          note: 'Saldo inicial'
        }
      ]);
    }
    setNewAccountName('');
    setNewAccountInitialBalance('');
    setShowAddAccount(false);
    showToast(`Cuenta "${val}" creada`, 'success');
  };

  // Abrir modal de edición de cuenta
  const openEditAccount = (accountName) => {
    const currentBal = calculateAccountBalance(accountName);
    setEditingAccount({
      originalName: accountName,
      name: accountName,
      balance: currentBal.toString()
    });
  };

  // Guardar edición de cuenta (nombre y/o saldo)
  const handleSaveEditAccount = (e) => {
    e.preventDefault();
    if (!editingAccount) return;
    const trimmedName = editingAccount.name.trim();
    if (!trimmedName) return;

    const originalName = editingAccount.originalName;
    if (trimmedName !== originalName && methods.includes(trimmedName)) {
      showToast('Ya existe otra cuenta con ese nombre', 'error');
      return;
    }

    if (trimmedName !== originalName) {
      setMethods((prev) => prev.map((m) => (m === originalName ? trimmedName : m)));
      setFunds((prev) =>
        prev.map((f) =>
          f.method === originalName ? Object.assign({}, f, { method: trimmedName }) : f
        )
      );
      setIncomes((prev) =>
        prev.map((i) =>
          i.method === originalName ? Object.assign({}, i, { method: trimmedName }) : i
        )
      );
      setExpenses((prev) =>
        prev.map((ex) =>
          ex.method === originalName ? Object.assign({}, ex, { method: trimmedName }) : ex
        )
      );
      setIncomeSources((prev) =>
        prev.map((src) =>
          src.defaultAccount === originalName
            ? Object.assign({}, src, { defaultAccount: trimmedName })
            : src
        )
      );
    }

    const currentBalanceBeforeRename = calculateAccountBalance(originalName);
    const targetBalance = parseFloat(editingAccount.balance);
    if (!isNaN(targetBalance)) {
      const diff = Number((targetBalance - currentBalanceBeforeRename).toFixed(4));
      if (Math.abs(diff) > 0.0001) {
        setFunds((prev) => [
          ...prev,
          {
            id: `adj-${Date.now()}`,
            method: trimmedName,
            amount: diff,
            date: new Date().toISOString(),
            note: 'Ajuste manual de saldo'
          }
        ]);
      }
    }

    setEditingAccount(null);
    showToast(`Cuenta "${trimmedName}" actualizada`, 'success');
  };

  const handleDeleteAccount = (methodName) => {
    requestConfirm({
      title: 'Eliminar Cuenta',
      message: `¿Seguro que deseas eliminar la cuenta "${methodName}"? Se mantendrán los registros históricos pero no podrás seleccionarla para nuevas transacciones.`,
      confirmLabel: 'Eliminar Cuenta',
      danger: true,
      onConfirm: () => {
        setMethods(methods.filter((m) => m !== methodName));
        showToast(`Cuenta "${methodName}" eliminada`, 'success');
      }
    });
  };

  // --- Handlers Fuentes de Ingreso ---
  const openCreateSourceModal = () => {
    setEditingSource(null);
    setSourceNameInput('');
    setSourceAccountInput(methods[0] || 'Efectivo');
    setShowSourceModal(true);
  };

  const openEditSourceModal = (sourceObj) => {
    setEditingSource(sourceObj);
    setSourceNameInput(sourceObj.name);
    setSourceAccountInput(
      methods.includes(sourceObj.defaultAccount) ? sourceObj.defaultAccount : methods[0] || ''
    );
    setShowSourceModal(true);
  };

  const handleSaveSource = (e) => {
    e.preventDefault();
    const cleanName = sourceNameInput.trim();
    if (!cleanName) return;

    if (editingSource) {
      const oldName = editingSource.name;
      setIncomeSources((prev) =>
        prev.map((s) =>
          s.id === editingSource.id
            ? Object.assign({}, s, { name: cleanName, defaultAccount: sourceAccountInput })
            : s
        )
      );
      if (oldName !== cleanName) {
        setIncomes((prev) =>
          prev.map((inc) =>
            inc.source === oldName ? Object.assign({}, inc, { source: cleanName }) : inc
          )
        );
      }
      showToast(`Fuente "${cleanName}" actualizada`, 'success');
    } else {
      if (incomeSources.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) {
        showToast('Esa fuente de ingreso ya existe', 'error');
        return;
      }
      setIncomeSources((prev) => [
        ...prev,
        {
          id: `src-${Date.now()}`,
          name: cleanName,
          defaultAccount: sourceAccountInput || methods[0] || 'Efectivo'
        }
      ]);
      showToast(`Fuente "${cleanName}" agregada`, 'success');
    }

    setShowSourceModal(false);
    setEditingSource(null);
  };

  const handleDeleteSource = (sourceObj) => {
    requestConfirm({
      title: 'Eliminar Fuente de Ingreso',
      message: `¿Deseas eliminar la fuente "${sourceObj.name}"? Los ingresos históricos conservarán su etiqueta.`,
      confirmLabel: 'Eliminar',
      danger: true,
      onConfirm: () => {
        setIncomeSources((prev) => prev.filter((s) => s.id !== sourceObj.id));
        showToast(`Fuente "${sourceObj.name}" eliminada`, 'success');
      }
    });
  };

  return React.createElement(
    'div',
    { className: 'space-y-8 animate-in fade-in duration-300' },

    // Tarjeta Global de Capital Disponible
    React.createElement(
      'div',
      {
        className:
          'text-center p-7 md:p-9 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800'
      },
      React.createElement(
        'p',
        { className: 'text-gray-400 text-[11px] font-black uppercase tracking-widest mb-1.5' },
        'Capital Disponible Total'
      ),
      React.createElement(
        'h2',
        {
          className: `text-4xl md:text-5xl font-black tracking-tight ${
            globalBalance >= 0 ? 'text-green-500' : 'text-[#E32636]'
          }`
        },
        formatMoney(globalBalance)
      )
    ),

    // ========================================================================
    // SECCIÓN SUPERIOR: GESTIÓN DE CUENTAS (CON BOTÓN EDITAR)
    // ========================================================================
    React.createElement(
      'section',
      { className: 'space-y-4' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center px-1' },
        React.createElement(
          'div',
          null,
          React.createElement(
            'h3',
            { className: 'font-black text-lg text-gray-900 dark:text-white' },
            'Cuentas de Capital'
          ),
          React.createElement(
            'p',
            { className: 'text-xs text-gray-500 dark:text-gray-400' },
            'Administra tus cuentas y ajusta sus saldos disponibles'
          )
        ),
        React.createElement(
          'button',
          {
            onClick: () => setShowAddAccount(true),
            className:
              'bg-[#E32636] hover:bg-red-700 text-white px-4 py-2 flex items-center gap-1.5 rounded-xl font-black text-xs shadow-md active:scale-95 transition'
          },
          React.createElement(Plus, { size: 15 }),
          React.createElement('span', null, 'Nueva Cuenta')
        )
      ),

      React.createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-3.5' },
        methods.map((method) => {
          const balance = calculateAccountBalance(method);
          return React.createElement(
            'div',
            {
              key: method,
              className:
                'flex justify-between items-center p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition'
            },
            React.createElement(
              'div',
              { className: 'flex items-center gap-3 min-w-0' },
              React.createElement(
                'div',
                {
                  className:
                    'w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0'
                },
                React.createElement(Wallet, { size: 18, className: 'text-[#E32636]' })
              ),
              React.createElement(
                'div',
                { className: 'truncate' },
                React.createElement(
                  'span',
                  { className: 'font-bold text-gray-800 dark:text-gray-100 block truncate' },
                  method
                ),
                React.createElement(
                  'span',
                  {
                    className: `text-base font-black ${
                      balance >= 0 ? 'text-green-500' : 'text-[#E32636]'
                    }`
                  },
                  formatMoney(balance)
                )
              )
            ),

            React.createElement(
              'div',
              { className: 'flex items-center gap-2 shrink-0' },
              // Botón Editar Cuenta
              React.createElement(
                'button',
                {
                  onClick: () => openEditAccount(method),
                  className:
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-blue-500/15 text-gray-700 dark:text-gray-200 hover:text-blue-500 font-bold text-xs transition'
                },
                React.createElement(Edit2, { size: 13 }),
                React.createElement('span', null, 'Editar')
              ),
              React.createElement(
                'button',
                {
                  onClick: () => handleDeleteAccount(method),
                  title: 'Eliminar cuenta',
                  className:
                    'text-gray-400 hover:text-[#E32636] transition-colors p-2 rounded-xl hover:bg-red-500/10'
                },
                React.createElement(Trash2, { size: 15 })
              )
            )
          );
        })
      )
    ),

    // ========================================================================
    // SECCIÓN INFERIOR: MÓDULO FUENTES DE INGRESO
    // ========================================================================
    React.createElement(
      'section',
      { className: 'space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800' },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center px-1' },
        React.createElement(
          'div',
          null,
          React.createElement(
            'h3',
            { className: 'font-black text-lg text-gray-900 dark:text-white flex items-center gap-2' },
            React.createElement(Layers, { size: 18, className: 'text-green-500' }),
            React.createElement('span', null, 'Fuentes de Ingreso')
          ),
          React.createElement(
            'p',
            { className: 'text-xs text-gray-500 dark:text-gray-400' },
            'Configura el origen de tus ingresos y su cuenta de destino predeterminada'
          )
        ),
        React.createElement(
          'button',
          {
            onClick: openCreateSourceModal,
            className:
              'bg-green-600 hover:bg-green-700 text-white px-4 py-2 flex items-center gap-1.5 rounded-xl font-black text-xs shadow-md active:scale-95 transition'
          },
          React.createElement(Plus, { size: 15 }),
          React.createElement('span', null, 'Nueva Fuente')
        )
      ),

      React.createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-2 gap-3.5' },
        incomeSources.map((src) =>
          React.createElement(
            'div',
            {
              key: src.id,
              className:
                'flex justify-between items-center p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-green-500/40 transition'
            },
            React.createElement(
              'div',
              { className: 'flex items-center gap-3 min-w-0' },
              React.createElement(
                'div',
                {
                  className:
                    'w-10 h-10 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0'
                },
                React.createElement(ArrowDownLeft, { size: 18, className: 'text-green-500' })
              ),
              React.createElement(
                'div',
                { className: 'truncate' },
                React.createElement(
                  'span',
                  { className: 'font-bold text-gray-800 dark:text-gray-100 block truncate' },
                  src.name
                ),
                React.createElement(
                  'span',
                  {
                    className:
                      'inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5'
                  },
                  React.createElement(CreditCard, { size: 12, className: 'text-green-500' }),
                  'Cuenta destino: ',
                  React.createElement(
                    'strong',
                    { className: 'text-gray-700 dark:text-gray-200' },
                    src.defaultAccount
                  )
                )
              )
            ),

            React.createElement(
              'div',
              { className: 'flex items-center gap-2 shrink-0' },
              React.createElement(
                'button',
                {
                  onClick: () => openEditSourceModal(src),
                  className:
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-green-500/15 text-gray-700 dark:text-gray-200 hover:text-green-500 font-bold text-xs transition'
                },
                React.createElement(Edit2, { size: 13 }),
                React.createElement('span', null, 'Editar')
              ),
              React.createElement(
                'button',
                {
                  onClick: () => handleDeleteSource(src),
                  title: 'Eliminar fuente',
                  className:
                    'text-gray-400 hover:text-[#E32636] transition-colors p-2 rounded-xl hover:bg-red-500/10'
                },
                React.createElement(Trash2, { size: 15 })
              )
            )
          )
        )
      )
    ),

    // Modal: Crear Nueva Cuenta
    showAddAccount &&
      React.createElement(
        Modal,
        { title: 'Nueva Cuenta', onClose: () => setShowAddAccount(false) },
        React.createElement(
          'form',
          { onSubmit: handleAddAccount, className: 'space-y-4' },
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'text-[11px] font-bold uppercase text-gray-400 block mb-1' },
              'Nombre de la cuenta'
            ),
            React.createElement('input', {
              type: 'text',
              value: newAccountName,
              onChange: (e) => setNewAccountName(e.target.value),
              placeholder: 'Ej. Nequi, Bancolombia, Caja',
              className:
                'w-full p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold dark:text-white border-2 border-transparent focus:border-[#E32636]',
              required: true,
              autoFocus: true
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'text-[11px] font-bold uppercase text-gray-400 block mb-1' },
              'Saldo Inicial (Opcional)'
            ),
            React.createElement('input', {
              type: 'number',
              step: '0.01',
              value: newAccountInitialBalance,
              onChange: (e) => setNewAccountInitialBalance(e.target.value),
              placeholder: '0.00',
              className:
                'w-full p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-black text-lg dark:text-white border-2 border-transparent focus:border-[#E32636]'
            })
          ),
          React.createElement(
            'button',
            {
              type: 'submit',
              className:
                'w-full bg-[#E32636] hover:bg-red-700 text-white font-black py-3.5 rounded-2xl transition'
            },
            'CREAR CUENTA'
          )
        )
      ),

    // Modal: Editar Cuenta Existente
    editingAccount &&
      React.createElement(
        Modal,
        { title: 'Editar Cuenta', onClose: () => setEditingAccount(null) },
        React.createElement(
          'form',
          { onSubmit: handleSaveEditAccount, className: 'space-y-4' },
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'text-[11px] font-bold uppercase text-gray-400 block mb-1' },
              'Nombre de la Cuenta'
            ),
            React.createElement('input', {
              type: 'text',
              value: editingAccount.name,
              onChange: (e) =>
                setEditingAccount(
                  Object.assign({}, editingAccount, { name: e.target.value })
                ),
              className:
                'w-full p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold dark:text-white border-2 border-transparent focus:border-[#E32636]',
              required: true
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'text-[11px] font-bold uppercase text-gray-400 block mb-1' },
              'Saldo Actual de la Cuenta'
            ),
            React.createElement(
              'div',
              { className: 'relative' },
              React.createElement(
                'span',
                {
                  style: { left: '0.95rem' },
                  className: 'absolute top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none'
                },
                '$'
              ),
              React.createElement('input', {
                type: 'number',
                step: '0.01',
                value: editingAccount.balance,
                onChange: (e) =>
                  setEditingAccount(
                    Object.assign({}, editingAccount, { balance: e.target.value })
                  ),
                style: { paddingLeft: '2.25rem' },
                className:
                  'w-full p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-black text-xl dark:text-white border-2 border-transparent focus:border-[#E32636]',
                required: true
              })
            ),
            React.createElement(
              'p',
              { className: 'text-[11px] text-gray-400 mt-1.5' },
              'Se registrará un ajuste automático para sincronizar el saldo exacto.'
            )
          ),
          React.createElement(
            'button',
            {
              type: 'submit',
              className:
                'w-full bg-[#E32636] hover:bg-red-700 text-white font-black py-3.5 rounded-2xl transition'
            },
            'GUARDAR CAMBIOS'
          )
        )
      ),

    // Modal: Crear / Editar Fuente de Ingreso
    showSourceModal &&
      React.createElement(
        Modal,
        {
          title: editingSource ? 'Editar Fuente' : 'Nueva Fuente de Ingreso',
          onClose: () => setShowSourceModal(false)
        },
        React.createElement(
          'form',
          { onSubmit: handleSaveSource, className: 'space-y-4' },
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'text-[11px] font-bold uppercase text-gray-400 block mb-1' },
              'Nombre de la Fuente'
            ),
            React.createElement('input', {
              type: 'text',
              value: sourceNameInput,
              onChange: (e) => setSourceNameInput(e.target.value),
              placeholder: 'Ej. Salario, Pago, Freelance',
              className:
                'w-full p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold dark:text-white border-2 border-transparent focus:border-green-500',
              required: true,
              autoFocus: true
            })
          ),
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'text-[11px] font-bold uppercase text-gray-400 block mb-1' },
              'Cuenta de Capital Destino (Por defecto)'
            ),
            React.createElement(
              'select',
              {
                value: sourceAccountInput,
                onChange: (e) => setSourceAccountInput(e.target.value),
                className:
                  'w-full p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold dark:text-white border-2 border-transparent focus:border-green-500'
              },
              methods.map((m) => React.createElement('option', { key: m, value: m }, m))
            )
          ),
          React.createElement(
            'button',
            {
              type: 'submit',
              className:
                'w-full bg-green-600 hover:bg-green-700 text-white font-black py-3.5 rounded-2xl transition'
            },
            editingSource ? 'ACTUALIZAR FUENTE' : 'GUARDAR FUENTE'
          )
        )
      )
  );
}

// ============================================================================
// MÓDULO 5: VISTA CONFIGURACIÓN (PREFERENCIAS + BACKUP Y PORTABILIDAD .JSON)
// ============================================================================
function TabConfiguracion({
  darkMode,
  setDarkMode,
  decimals,
  setDecimals,
  appScale,
  setAppScale,
  setShowAbout,
  appState,
  onImportProfile,
  onResetProfile,
  requestConfirm,
  showToast
}) {
  const fileInputRef = useRef(null);
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const scalePercent = Math.round(((appScale - 12) / (22 - 12)) * 100);
  const isDeletePhraseValid = deleteConfirmText.trim().toLowerCase() === 'borrar perfil';

  const handleConfirmDeleteProfile = (e) => {
    e.preventDefault();
    if (!isDeletePhraseValid) return;
    setShowDeleteProfileModal(false);
    setDeleteConfirmText('');
    if (onResetProfile) {
      onResetProfile();
    }
  };

  // Exportar perfil completo en formato hestia-backup-YYYY-MM-DD.json
  const handleExportProfile = () => {
    try {
      const payload = {
        app: 'Hestia',
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        data: appState
      };

      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const fileName = `hestia-backup-${getTodayLocalISO()}.json`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Respaldo descargado: ${fileName}`, 'success');
    } catch (error) {
      showToast('Error al generar el archivo de respaldo', 'error');
    }
  };

  // Validación e importación de perfil .json
  const handleFileSelected = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('El archivo no contiene un objeto JSON válido.');
        }

        const candidate = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

        const hasValidStructure =
          Array.isArray(candidate.expenses) ||
          Array.isArray(candidate.incomes) ||
          Array.isArray(candidate.methods);

        if (!hasValidStructure) {
          throw new Error(
            'Esquema inválido: el archivo no corresponde a un respaldo de Hestia.'
          );
        }

        const expCount = Array.isArray(candidate.expenses) ? candidate.expenses.length : 0;
        const incCount = Array.isArray(candidate.incomes) ? candidate.incomes.length : 0;
        const accCount = Array.isArray(candidate.methods) ? candidate.methods.length : 0;

        requestConfirm({
          title: 'Restaurar Perfil (.json)',
          message: `Se detectaron ${accCount} cuentas, ${incCount} ingresos y ${expCount} gastos. Al continuar, se sobrescribirán tus datos locales actuales. ¿Deseas continuar?`,
          confirmLabel: 'Sobrescribir y Restaurar',
          danger: true,
          onConfirm: () => {
            onImportProfile(candidate);
          }
        });
      } catch (err) {
        showToast(err.message || 'Archivo JSON inválido o corrupto', 'error');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      showToast('No se pudo leer el archivo seleccionado', 'error');
    };

    reader.readAsText(file);
  };

  return React.createElement(
    'div',
    { className: 'max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300' },
    React.createElement(
      'h2',
      { className: 'text-2xl font-black text-gray-900 dark:text-white' },
      'Configuración'
    ),

    // Preferencias Visuales
    React.createElement(
      'div',
      {
        className:
          'bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 space-y-6'
      },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center' },
        React.createElement(
          'div',
          { className: 'flex items-center' },
          darkMode
            ? React.createElement(Moon, { size: 20, className: 'mr-3 text-indigo-400' })
            : React.createElement(Sun, { size: 20, className: 'mr-3 text-yellow-500' }),
          React.createElement('span', { className: 'font-bold' }, 'Modo Oscuro')
        ),
        React.createElement(
          'button',
          {
            onClick: () => setDarkMode(!darkMode),
            className: `w-12 h-6 rounded-full relative transition-colors ${
              darkMode ? 'bg-[#E32636]' : 'bg-gray-300'
            }`
          },
          React.createElement('div', {
            className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
              darkMode ? 'right-1' : 'left-1'
            }`
          })
        )
      ),

      React.createElement(
        'div',
        { className: 'space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800' },
        React.createElement(
          'div',
          { className: 'flex items-center' },
          React.createElement(DollarSign, { size: 20, className: 'mr-3 text-green-500' }),
          React.createElement('span', { className: 'font-bold' }, 'Decimales')
        ),
        React.createElement(
          'div',
          { className: 'flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1' },
          [0, 1, 2].map((n) =>
            React.createElement(
              'button',
              {
                key: n,
                onClick: () => setDecimals(n),
                className: `flex-1 py-2 rounded-lg font-black transition-all ${
                  decimals === n
                    ? 'bg-white dark:bg-gray-700 text-[#E32636] shadow-sm'
                    : 'text-gray-400'
                }`
              },
              n
            )
          )
        )
      ),

      React.createElement(
        'div',
        { className: 'space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800' },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between gap-2' },
          React.createElement(
            'div',
            { className: 'flex items-center' },
            React.createElement(Settings, { size: 20, className: 'mr-3 text-blue-500' }),
            React.createElement('span', { className: 'font-bold' }, 'Tamaño de Interfaz')
          ),
          React.createElement(
            'div',
            { className: 'flex items-center gap-1.5' },
            React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => setAppScale(Math.max(12, appScale - 1)),
                title: 'Reducir tamaño',
                className:
                  'w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-black text-sm flex items-center justify-center text-gray-700 dark:text-gray-200 transition'
              },
              '-'
            ),
            React.createElement(
              'span',
              {
                className:
                  'text-xs font-black text-[#E32636] bg-red-500/10 px-2.5 py-1 rounded-lg min-w-[3.2rem] text-center'
              },
              `${appScale}px`
            ),
            React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => setAppScale(Math.min(22, appScale + 1)),
                title: 'Aumentar tamaño',
                className:
                  'w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-black text-sm flex items-center justify-center text-gray-700 dark:text-gray-200 transition'
              },
              '+'
            ),
            appScale !== 16 &&
              React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => setAppScale(16),
                  className:
                    'text-[10px] font-bold text-gray-400 hover:text-gray-200 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 transition'
                },
                '16px'
              )
          )
        ),
        React.createElement(
          'div',
          { className: 'py-1' },
          React.createElement('input', {
            type: 'range',
            min: '12',
            max: '22',
            step: '1',
            value: appScale,
            onChange: (e) => setAppScale(Number(e.target.value)),
            style: {
              background: `linear-gradient(to right, #E32636 0%, #E32636 ${scalePercent}%, ${
                darkMode ? '#374151' : '#e5e7eb'
              } ${scalePercent}%, ${darkMode ? '#374151' : '#e5e7eb'} 100%)`
            },
            className: 'hestia-slider'
          })
        ),
        React.createElement(
          'div',
          { className: 'flex justify-between text-[10px] text-gray-400 font-bold uppercase' },
          React.createElement('span', null, '12px (Min)'),
          React.createElement('span', null, '16px (Normal)'),
          React.createElement('span', null, '22px (Max)')
        )
      )
    ),

    // Módulo: Backup y Portabilidad (.json)
    React.createElement(
      'div',
      {
        className:
          'bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 space-y-4'
      },
      React.createElement(
        'div',
        null,
        React.createElement(
          'h3',
          { className: 'font-black text-base text-gray-900 dark:text-white' },
          'Backup y Portabilidad'
        ),
        React.createElement(
          'p',
          { className: 'text-xs text-gray-500 dark:text-gray-400 mt-0.5' },
          'Exporta o restaura tus cuentas, fuentes, historial y preferencias en formato JSON'
        )
      ),

      React.createElement(
        'div',
        { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1' },
        React.createElement(
          'button',
          {
            onClick: handleExportProfile,
            className:
              'flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white font-black text-xs py-3.5 px-4 rounded-2xl border border-gray-700 transition active:scale-95'
          },
          React.createElement(Download, { size: 16, className: 'text-green-400' }),
          React.createElement('span', null, 'Exportar Perfil (.json)')
        ),
        React.createElement(
          'button',
          {
            onClick: () => fileInputRef.current && fileInputRef.current.click(),
            className:
              'flex items-center justify-center gap-2 bg-[#E32636] hover:bg-red-700 text-white font-black text-xs py-3.5 px-4 rounded-2xl shadow-md transition active:scale-95'
          },
          React.createElement(Upload, { size: 16 }),
          React.createElement('span', null, 'Importar Perfil (.json)')
        ),
        React.createElement('input', {
          ref: fileInputRef,
          type: 'file',
          accept: '.json,application/json',
          onChange: handleFileSelected,
          className: 'hidden'
        })
      )
    ),

    // Acerca de la App
    React.createElement(
      'div',
      {
        className:
          'bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-200 dark:border-gray-800'
      },
      React.createElement(
        'div',
        {
          className: 'flex justify-between items-center cursor-pointer',
          onClick: () => setShowAbout(true)
        },
        React.createElement(
          'div',
          { className: 'flex items-center text-gray-800 dark:text-white' },
          React.createElement(Info, { size: 20, className: 'mr-3 text-blue-500' }),
          React.createElement('span', { className: 'font-bold' }, 'Acerca de la App')
        ),
        React.createElement(ChevronDown, { size: 18, className: 'text-gray-400 -rotate-90' })
      )
    ),

    // Zona de Peligro: Borrar Perfil
    React.createElement(
      'div',
      {
        className:
          'bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-red-500/30 space-y-3'
      },
      React.createElement(
        'div',
        null,
        React.createElement(
          'h3',
          { className: 'font-black text-base text-[#E32636]' },
          'Zona de Peligro'
        ),
        React.createElement(
          'p',
          { className: 'text-xs text-gray-500 dark:text-gray-400 mt-0.5' },
          'Elimina permanentemente todas tus cuentas, fuentes, ingresos, gastos y configuraciones locales.'
        )
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            setDeleteConfirmText('');
            setShowDeleteProfileModal(true);
          },
          className:
            'w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-[#E32636] text-[#E32636] hover:text-white font-black text-xs py-3.5 px-4 rounded-2xl border border-red-500/30 transition active:scale-95'
        },
        React.createElement(Trash2, { size: 16 }),
        React.createElement('span', null, 'Borrar Perfil')
      )
    ),

    // Modal de confirmación con escritura exacta de "borrar perfil"
    showDeleteProfileModal &&
      React.createElement(
        Modal,
        {
          title: 'Borrar Perfil',
          onClose: () => {
            setShowDeleteProfileModal(false);
            setDeleteConfirmText('');
          }
        },
        React.createElement(
          'form',
          { onSubmit: handleConfirmDeleteProfile, className: 'space-y-4' },
          React.createElement(
            'div',
            { className: 'flex items-start gap-3 p-3 rounded-2xl bg-red-500/10 text-[#E32636]' },
            React.createElement(AlertTriangle, { size: 20, className: 'shrink-0 mt-0.5' }),
            React.createElement(
              'p',
              { className: 'text-xs font-semibold leading-relaxed' },
              'Esta acción es irreversible. Se eliminarán todos los registros y se restaurará la aplicación a sus valores iniciales.'
            )
          ),
          React.createElement(
            'div',
            null,
            React.createElement(
              'label',
              { className: 'text-xs text-gray-500 dark:text-gray-300 block mb-1.5' },
              'Para confirmar, escribe exactamente ',
              React.createElement(
                'strong',
                { className: 'text-[#E32636] font-black select-all' },
                'borrar perfil'
              ),
              ':'
            ),
            React.createElement('input', {
              type: 'text',
              value: deleteConfirmText,
              onChange: (e) => setDeleteConfirmText(e.target.value),
              placeholder: 'borrar perfil',
              autoFocus: true,
              className:
                'w-full p-3.5 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold text-sm dark:text-white border-2 border-transparent focus:border-[#E32636]'
            })
          ),
          React.createElement(
            'div',
            { className: 'flex gap-2.5 pt-1' },
            React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => {
                  setShowDeleteProfileModal(false);
                  setDeleteConfirmText('');
                },
                className:
                  'flex-1 py-3 rounded-2xl font-bold text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition'
              },
              'Cancelar'
            ),
            React.createElement(
              'button',
              {
                type: 'submit',
                disabled: !isDeletePhraseValid,
                className: `flex-1 py-3 rounded-2xl font-black text-xs text-white transition ${
                  isDeletePhraseValid
                    ? 'bg-[#E32636] hover:bg-red-700 shadow-lg active:scale-95'
                    : 'bg-[#E32636] opacity-40 cursor-not-allowed'
                }`
              },
              'Eliminar Todo'
            )
          )
        )
      ),

    React.createElement(
      'div',
      { className: 'p-2 text-center' },
      React.createElement(
        'p',
        { className: 'text-[10px] text-gray-400 font-bold uppercase tracking-widest' },
        `Hestia Económica v${APP_VERSION}`
      )
    )
  );
}

// ============================================================================
// FORMULARIO MODAL: NUEVO / EDITAR GASTO
// ============================================================================
function ExpenseFormModal({
  expense,
  onSave,
  onClose,
  categories,
  methods,
  responsibles,
  setCategories,
  setMethods,
  setResponsibles,
  requestConfirm
}) {
  const [amount, setAmount] = useState(expense ? expense.amount.toString() : '');
  const [description, setDescription] = useState(expense ? expense.description : '');
  const [date, setDate] = useState(expense ? expense.date : getTodayLocalISO());
  const [category, setCategory] = useState(expense ? expense.category : categories[0] || '');
  const [method, setMethod] = useState(expense ? expense.method : methods[0] || '');
  const [responsible, setResponsible] = useState(
    expense ? expense.responsible : responsibles[0] || ''
  );
  const [showCalc, setShowCalc] = useState(false);

  useEffect(() => {
    if (!category && categories.length > 0) setCategory(categories[0]);
    if (!method && methods.length > 0) setMethod(methods[0]);
    if (!responsible && responsibles.length > 0) setResponsible(responsibles[0]);
  }, [categories, methods, responsibles, category, method, responsible]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!amount || !description) return;
    onSave({
      id: expense ? expense.id : Date.now().toString(),
      amount: parseFloat(amount),
      description: description.trim(),
      date: date || getTodayLocalISO(),
      category: category || 'General',
      method: method || 'Efectivo',
      responsible: responsible || 'Yo'
    });
  };

  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 bg-black/75 z-[60] flex items-center justify-center backdrop-blur-sm p-4'
    },
    React.createElement(
      'div',
      {
        className:
          'bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto'
      },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center mb-6' },
        React.createElement(
          'h2',
          { className: 'text-xl font-black dark:text-white flex items-center gap-2' },
          expense
            ? React.createElement(Edit2, { className: 'text-[#E32636]', size: 20 })
            : React.createElement(Plus, { className: 'text-[#E32636]', size: 20 }),
          React.createElement('span', null, expense ? 'Editar Gasto' : 'Nuevo Gasto')
        ),
        React.createElement(
          'button',
          {
            onClick: onClose,
            className: 'p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-300'
          },
          React.createElement(X, { size: 20 })
        )
      ),

      React.createElement(
        'form',
        { onSubmit: handleSubmit, className: 'space-y-4' },
        React.createElement(
          'div',
          { className: 'flex space-x-2' },
          React.createElement(
            'div',
            { className: 'flex-1 relative' },
            React.createElement(
              'span',
              {
                style: { left: '0.95rem' },
                className: 'absolute top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none'
              },
              '$'
            ),
            React.createElement('input', {
              type: 'number',
              step: '0.01',
              inputMode: 'decimal',
              value: amount,
              onChange: (e) => setAmount(e.target.value),
              required: true,
              placeholder: '0.00',
              style: { paddingLeft: '2.25rem' },
              className:
                'w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#E32636] rounded-2xl py-4 pr-4 text-xl font-black outline-none dark:text-white transition-all'
            })
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => setShowCalc(true),
              className:
                'bg-gray-100 dark:bg-gray-800 px-4 rounded-2xl text-[#E32636] border-2 border-transparent hover:border-[#E32636] transition-colors'
            },
            React.createElement(Calculator, { size: 24 })
          )
        ),

        React.createElement('input', {
          type: 'text',
          value: description,
          onChange: (e) => setDescription(e.target.value),
          required: true,
          placeholder: 'Descripción del gasto',
          className:
            'w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#E32636] rounded-2xl p-4 outline-none dark:text-white transition-colors'
        }),

        React.createElement(
          'div',
          { className: 'relative' },
          React.createElement(Calendar, {
            className: 'absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none',
            size: 18
          }),
          React.createElement('input', {
            type: 'date',
            value: date,
            onChange: (e) => setDate(e.target.value),
            className:
              'w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#E32636] rounded-2xl p-4 pl-12 outline-none dark:text-white dark:[color-scheme:dark] transition-colors'
          })
        ),

        React.createElement(
          'div',
          { className: 'grid grid-cols-3 gap-2 pt-2 w-full' },
          React.createElement(FancyDropdown, {
            label: 'Uso',
            icon: Tag,
            value: category,
            onChange: setCategory,
            options: categories,
            setOptions: setCategories,
            isCompact: true,
            accentColor: '#E32636',
            requestConfirm: requestConfirm
          }),
          React.createElement(FancyDropdown, {
            label: 'Cuenta',
            icon: CreditCard,
            value: method,
            onChange: setMethod,
            options: methods,
            setOptions: setMethods,
            isCompact: true,
            accentColor: '#E32636',
            requestConfirm: requestConfirm
          }),
          React.createElement(FancyDropdown, {
            label: 'Resp.',
            icon: User,
            value: responsible,
            onChange: setResponsible,
            options: responsibles,
            setOptions: setResponsibles,
            isCompact: true,
            accentColor: '#E32636',
            requestConfirm: requestConfirm
          })
        ),

        React.createElement(
          'button',
          {
            type: 'submit',
            className:
              'w-full bg-[#E32636] text-white font-black text-base py-4 rounded-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all mt-4'
          },
          expense ? 'ACTUALIZAR GASTO' : 'REGISTRAR GASTO'
        )
      )
    ),

    showCalc &&
      React.createElement(CalculatorModal, {
        onResult: (val) => {
          setAmount(val.toString());
          setShowCalc(false);
        },
        onClose: () => setShowCalc(false)
      })
  );
}

// ============================================================================
// FORMULARIO MODAL: NUEVO / EDITAR INGRESO (VINCULADO A FUENTES Y CUENTAS)
// ============================================================================
function IncomeFormModal({
  income,
  onSave,
  onClose,
  incomeSources,
  setIncomeSources,
  methods,
  setMethods,
  responsibles,
  setResponsibles,
  requestConfirm
}) {
  const initialSourceObj = income
    ? incomeSources.find((s) => s.name === income.source) || incomeSources[0]
    : incomeSources[0];

  const [amount, setAmount] = useState(income ? income.amount.toString() : '');
  const [description, setDescription] = useState(income ? income.description : '');
  const [date, setDate] = useState(income ? income.date : getTodayLocalISO());
  const [source, setSource] = useState(
    income ? income.source : initialSourceObj ? initialSourceObj.name : 'Salario'
  );
  const [method, setMethod] = useState(
    income
      ? income.method
      : initialSourceObj && methods.includes(initialSourceObj.defaultAccount)
      ? initialSourceObj.defaultAccount
      : methods[0] || ''
  );
  const [responsible, setResponsible] = useState(
    income ? income.responsible : responsibles[0] || ''
  );
  const [showCalc, setShowCalc] = useState(false);

  // Al cambiar la Fuente de ingreso, sugiere automáticamente su cuenta destino vinculada
  const handleSourceChange = (selectedSourceName) => {
    setSource(selectedSourceName);
    const matched = incomeSources.find((s) => s.name === selectedSourceName);
    if (matched && matched.defaultAccount && methods.includes(matched.defaultAccount)) {
      setMethod(matched.defaultAccount);
    }
  };

  // Permite añadir una fuente nueva directamente desde el selector
  const handleAddSourceOption = (newName) => {
    const newObj = {
      id: `src-${Date.now()}`,
      name: newName,
      defaultAccount: method || methods[0] || 'Efectivo'
    };
    setIncomeSources((prev) => [...prev, newObj]);
    setSource(newName);
  };

  const handleRemoveSourceOption = (optName) => {
    const filtered = incomeSources.filter((s) => s.name !== optName);
    setIncomeSources(filtered);
    if (source === optName) {
      setSource(filtered[0] ? filtered[0].name : '');
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!amount || !description) return;
    onSave({
      id: income ? income.id : Date.now().toString(),
      amount: parseFloat(amount),
      description: description.trim(),
      date: date || getTodayLocalISO(),
      source: source || 'Salario',
      method: method || methods[0] || 'Efectivo',
      responsible: responsible || 'Yo'
    });
  };

  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 bg-black/75 z-[60] flex items-center justify-center backdrop-blur-sm p-4'
    },
    React.createElement(
      'div',
      {
        className:
          'bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto'
      },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center mb-6' },
        React.createElement(
          'h2',
          { className: 'text-xl font-black dark:text-white flex items-center gap-2' },
          income
            ? React.createElement(Edit2, { className: 'text-green-500', size: 20 })
            : React.createElement(Plus, { className: 'text-green-500', size: 20 }),
          React.createElement('span', null, income ? 'Editar Ingreso' : 'Nuevo Ingreso')
        ),
        React.createElement(
          'button',
          {
            onClick: onClose,
            className: 'p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-300'
          },
          React.createElement(X, { size: 20 })
        )
      ),

      React.createElement(
        'form',
        { onSubmit: handleSubmit, className: 'space-y-4' },
        React.createElement(
          'div',
          { className: 'flex space-x-2' },
          React.createElement(
            'div',
            { className: 'flex-1 relative' },
            React.createElement(
              'span',
              {
                style: { left: '0.95rem' },
                className: 'absolute top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none'
              },
              '$'
            ),
            React.createElement('input', {
              type: 'number',
              step: '0.01',
              inputMode: 'decimal',
              value: amount,
              onChange: (e) => setAmount(e.target.value),
              required: true,
              placeholder: '0.00',
              style: { paddingLeft: '2.25rem' },
              className:
                'w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-green-500 rounded-2xl py-4 pr-4 text-xl font-black outline-none dark:text-white transition-all'
            })
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => setShowCalc(true),
              className:
                'bg-gray-100 dark:bg-gray-800 px-4 rounded-2xl text-green-500 border-2 border-transparent hover:border-green-500 transition-colors'
            },
            React.createElement(Calculator, { size: 24 })
          )
        ),

        React.createElement('input', {
          type: 'text',
          value: description,
          onChange: (e) => setDescription(e.target.value),
          required: true,
          placeholder: 'Descripción del ingreso',
          className:
            'w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-green-500 rounded-2xl p-4 outline-none dark:text-white transition-colors'
        }),

        React.createElement(
          'div',
          { className: 'relative' },
          React.createElement(Calendar, {
            className: 'absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none',
            size: 18
          }),
          React.createElement('input', {
            type: 'date',
            value: date,
            onChange: (e) => setDate(e.target.value),
            className:
              'w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-green-500 rounded-2xl p-4 pl-12 outline-none dark:text-white dark:[color-scheme:dark] transition-colors'
          })
        ),

        React.createElement(
          'div',
          { className: 'grid grid-cols-3 gap-2 pt-2 w-full' },
          React.createElement(FancyDropdown, {
            label: 'Fuente',
            icon: Layers,
            value: source,
            onChange: handleSourceChange,
            options: incomeSources.map((s) => s.name),
            onCustomAdd: handleAddSourceOption,
            onCustomRemove: handleRemoveSourceOption,
            isCompact: true,
            accentColor: '#16a34a',
            requestConfirm: requestConfirm
          }),
          React.createElement(FancyDropdown, {
            label: 'Cuenta',
            icon: CreditCard,
            value: method,
            onChange: setMethod,
            options: methods,
            setOptions: setMethods,
            isCompact: true,
            accentColor: '#16a34a',
            requestConfirm: requestConfirm
          }),
          React.createElement(FancyDropdown, {
            label: 'Resp.',
            icon: User,
            value: responsible,
            onChange: setResponsible,
            options: responsibles,
            setOptions: setResponsibles,
            isCompact: true,
            accentColor: '#16a34a',
            requestConfirm: requestConfirm
          })
        ),

        React.createElement(
          'p',
          { className: 'text-[11px] text-gray-400 text-center' },
          'El monto se sumará automáticamente al saldo de ',
          React.createElement('strong', { className: 'text-green-500' }, method),
          '.'
        ),

        React.createElement(
          'button',
          {
            type: 'submit',
            className:
              'w-full bg-green-600 text-white font-black text-base py-4 rounded-2xl shadow-xl hover:bg-green-700 active:scale-95 transition-all mt-2'
          },
          income ? 'ACTUALIZAR INGRESO' : 'REGISTRAR INGRESO'
        )
      )
    ),

    showCalc &&
      React.createElement(CalculatorModal, {
        onResult: (val) => {
          setAmount(val.toString());
          setShowCalc(false);
        },
        onClose: () => setShowCalc(false)
      })
  );
}

// ============================================================================
// SELECTOR DESPLEGABLE CON CREACIÓN RÁPIDA (FANCY DROPDOWN)
// ============================================================================
function FancyDropdown({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  setOptions,
  onCustomAdd,
  onCustomRemove,
  isCompact,
  accentColor,
  requestConfirm
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newVal, setNewVal] = useState('');
  const activeColor = accentColor || '#E32636';

  const handleAdd = () => {
    const val = newVal.trim();
    if (val && !options.includes(val)) {
      if (onCustomAdd) {
        onCustomAdd(val);
      } else if (setOptions) {
        setOptions([...options, val]);
        onChange(val);
      }
    }
    setNewVal('');
    setIsOpen(false);
  };

  const handleRemove = (e, opt) => {
    e.stopPropagation();
    const doRemove = () => {
      if (onCustomRemove) {
        onCustomRemove(opt);
      } else if (setOptions) {
        const filtered = options.filter((o) => o !== opt);
        setOptions(filtered);
        if (value === opt) onChange(filtered[0] || '');
      }
    };

    if (requestConfirm) {
      requestConfirm({
        title: `Quitar "${opt}"`,
        message: `¿Deseas quitar la opción "${opt}" de la lista de ${label}?`,
        confirmLabel: 'Quitar',
        danger: true,
        onConfirm: doRemove
      });
    } else {
      doRemove();
    }
  };

  return React.createElement(
    'div',
    { className: 'relative w-full' },
    React.createElement(
      'div',
      {
        onClick: () => setIsOpen(!isOpen),
        style: { borderColor: isOpen ? activeColor : 'transparent' },
        className: `w-full flex ${
          isCompact ? 'flex-col justify-center p-3' : 'items-center justify-between p-4'
        } bg-gray-50 dark:bg-gray-800 border-2 rounded-2xl cursor-pointer transition-all`
      },
      React.createElement(
        'div',
        {
          className: `flex ${
            isCompact ? 'flex-col items-center text-center' : 'items-center'
          } text-gray-700 dark:text-gray-200 w-full`
        },
        Icon &&
          React.createElement(Icon, {
            size: isCompact ? 16 : 18,
            style: { color: isOpen ? activeColor : undefined },
            className: `${isCompact ? 'mb-1.5' : 'mr-3'} text-gray-400`
          }),
        React.createElement(
          'div',
          { className: `${isCompact ? 'w-full' : 'text-left'}` },
          React.createElement(
            'span',
            { className: 'text-[10px] text-gray-400 font-bold block leading-none mb-1' },
            label
          ),
          React.createElement(
            'span',
            {
              className: `font-black leading-none block truncate ${isCompact ? 'text-xs' : ''}`
            },
            value || 'Seleccionar'
          )
        )
      )
    ),

    isOpen &&
      React.createElement(
        'div',
        {
          className:
            'fixed inset-0 bg-black/70 z-[70] flex items-center justify-center backdrop-blur-sm p-4',
          onClick: () => setIsOpen(false)
        },
        React.createElement(
          'div',
          {
            className:
              'bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[85vh] flex flex-col',
            onClick: (e) => e.stopPropagation()
          },
          React.createElement(
            'div',
            {
              className:
                'flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800'
            },
            React.createElement(
              'h3',
              { className: 'font-black text-lg dark:text-white flex items-center gap-2' },
              Icon && React.createElement(Icon, { size: 20, style: { color: activeColor } }),
              React.createElement('span', null, label)
            ),
            React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => setIsOpen(false),
                className: 'p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500'
              },
              React.createElement(X, { size: 18 })
            )
          ),

          React.createElement(
            'div',
            { className: 'flex-1 overflow-y-auto p-3 space-y-1' },
            options.map((opt) =>
              React.createElement(
                'div',
                {
                  key: opt,
                  onClick: () => {
                    onChange(opt);
                    setIsOpen(false);
                  },
                  style:
                    value === opt
                      ? { backgroundColor: `${activeColor}18`, color: activeColor }
                      : undefined,
                  className: `flex justify-between items-center p-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                    value === opt ? 'font-black' : 'text-gray-600 dark:text-gray-300 font-bold'
                  }`
                },
                React.createElement('span', { className: 'truncate pr-2' }, opt),
                React.createElement(
                  'button',
                  {
                    type: 'button',
                    onClick: (e) => handleRemove(e, opt),
                    className: 'text-gray-400 hover:text-red-500 shrink-0 p-1'
                  },
                  React.createElement(Trash2, { size: 15 })
                )
              )
            )
          ),

          React.createElement(
            'div',
            {
              className:
                'p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex'
            },
            React.createElement('input', {
              type: 'text',
              value: newVal,
              onChange: (e) => setNewVal(e.target.value),
              onKeyDown: (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              },
              placeholder: 'Agregar nueva opción...',
              className:
                'flex-1 bg-white dark:bg-gray-800 rounded-l-xl px-4 py-3 text-sm outline-none dark:text-white min-w-0 border-2 border-transparent focus:border-gray-500'
            }),
            React.createElement(
              'button',
              {
                type: 'button',
                onClick: handleAdd,
                style: { backgroundColor: activeColor },
                className: 'text-white px-5 rounded-r-xl font-black text-xl'
              },
              '+'
            )
          )
        )
      )
  );
}

// ============================================================================
// MODALES GENÉRICOS Y DE CONFIRMACIÓN (SIN ALERT/CONFIRM NATIVOS)
// ============================================================================
function Modal({ title, onClose, children }) {
  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 backdrop-blur-sm',
      onClick: onClose
    },
    React.createElement(
      'div',
      {
        className:
          'bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 dark:border-gray-800',
        onClick: (e) => e.stopPropagation()
      },
      React.createElement(
        'div',
        { className: 'flex justify-between items-center mb-5' },
        React.createElement(
          'h2',
          { className: 'text-base font-black dark:text-white uppercase tracking-wider' },
          title
        ),
        React.createElement(
          'button',
          { onClick: onClose, className: 'text-gray-400 hover:text-red-500 p-1' },
          React.createElement(X, { size: 20 })
        )
      ),
      children
    )
  );
}

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 bg-black/80 z-[75] flex items-center justify-center p-4 backdrop-blur-sm',
      onClick: onCancel
    },
    React.createElement(
      'div',
      {
        className:
          'bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4',
        onClick: (e) => e.stopPropagation()
      },
      React.createElement(
        'div',
        { className: 'flex items-center gap-3' },
        React.createElement(
          'div',
          {
            className: `w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              danger ? 'bg-red-500/15 text-[#E32636]' : 'bg-blue-500/15 text-blue-400'
            }`
          },
          React.createElement(AlertTriangle, { size: 20 })
        ),
        React.createElement(
          'h3',
          { className: 'text-base font-black text-gray-900 dark:text-white' },
          title
        )
      ),
      React.createElement(
        'p',
        { className: 'text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed' },
        message
      ),
      React.createElement(
        'div',
        { className: 'flex gap-3 pt-2' },
        React.createElement(
          'button',
          {
            onClick: onCancel,
            className:
              'flex-1 py-3 rounded-2xl font-bold text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition'
          },
          'Cancelar'
        ),
        React.createElement(
          'button',
          {
            onClick: onConfirm,
            className: `flex-1 py-3 rounded-2xl font-black text-xs text-white transition ${
              danger ? 'bg-[#E32636] hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`
          },
          confirmLabel
        )
      )
    )
  );
}

// ============================================================================
// CALCULADORA INTEGRADA (SIMPLE Y FINANCIERA)
// ============================================================================
function CalculatorModal({ onResult, onClose }) {
  const [mode, setMode] = useState('simple');
  const [calc, setCalc] = useState('0');
  const [memory, setMemory] = useState(0);
  const [gt, setGt] = useState(0);

  const evaluateStr = (expr) => {
    try {
      const parsed = expr.replace(/x/g, '*').replace(/÷/g, '/');
      if (!/^[0-9+*/.() -]+$/.test(parsed)) return 0;
      const res = new Function('return ' + parsed)();
      return Number.isFinite(res) ? Math.round(res * 10000) / 10000 : 0;
    } catch (e) {
      return 0;
    }
  };

  const handle = (v) => {
    if (v === 'AC') {
      setCalc('0');
      setGt(0);
      setMemory(0);
      return;
    }
    if (v === '⌫') {
      setCalc(calc.length > 1 ? calc.slice(0, -1) : '0');
      return;
    }
    if (v === '=') {
      const res = evaluateStr(calc);
      setGt(gt + res);
      setCalc(res.toString());
      return;
    }
    if (v === 'M+') {
      setMemory(memory + evaluateStr(calc));
      return;
    }
    if (v === 'M-') {
      setMemory(memory - evaluateStr(calc));
      return;
    }
    if (v === 'MRC') {
      setCalc(calc === '0' ? memory.toString() : calc + memory.toString());
      return;
    }
    if (v === 'GT') {
      setCalc(calc === '0' ? gt.toString() : calc + gt.toString());
      return;
    }
    if (v === '√') {
      const res = evaluateStr(calc);
      setCalc((res >= 0 ? Math.sqrt(res) : 0).toString());
      return;
    }
    if (v === '%') {
      const res = evaluateStr(calc);
      setCalc((res / 100).toString());
      return;
    }
    if (calc === '0' && !['.', '00', '000', '+', '-', 'x', '÷'].includes(v)) {
      setCalc(v);
    } else {
      setCalc(calc + v);
    }
  };

  const simpleKeys = [
    { id: 'AC', class: 'text-[#E32636] bg-red-500/15' },
    { id: '⌫', class: 'text-[#E32636] bg-red-500/15' },
    { id: '%', class: 'text-[#E32636] bg-red-500/15' },
    { id: '÷', class: 'text-white bg-[#E32636] shadow-md' },
    { id: '7', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '8', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '9', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'x', class: 'text-white bg-[#E32636] shadow-md' },
    { id: '4', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '5', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '6', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '-', class: 'text-white bg-[#E32636] shadow-md' },
    { id: '1', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '2', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '3', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '+', class: 'text-white bg-[#E32636] shadow-md' },
    { id: '0', class: 'bg-gray-100 dark:bg-gray-800 col-span-2' },
    { id: '.', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '=', class: 'text-white bg-[#E32636] shadow-md' }
  ];

  const financeKeys = [
    { id: 'GT', class: 'text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800' },
    { id: 'M+', class: 'text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800' },
    { id: 'M-', class: 'text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800' },
    { id: 'MRC', class: 'text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800' },
    { id: 'AC', class: 'text-[#E32636] bg-red-500/15' },
    { id: '⌫', class: 'text-[#E32636] bg-red-500/15' },
    { id: '√', class: 'text-[#E32636] bg-red-500/15' },
    { id: '÷', class: 'text-white bg-[#E32636] shadow-md' },
    { id: '7', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '8', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '9', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'x', class: 'text-white bg-[#E32636] shadow-md' },
    { id: '4', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '5', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '6', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '-', class: 'text-white bg-[#E32636] shadow-md' },
    { id: '1', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '2', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '3', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '+', class: 'text-white bg-[#E32636] shadow-md row-span-2' },
    { id: '0', class: 'bg-gray-100 dark:bg-gray-800' },
    { id: '00', class: 'bg-gray-100 dark:bg-gray-800 text-sm' },
    { id: '.', class: 'bg-gray-100 dark:bg-gray-800' }
  ];

  const activeKeys = mode === 'simple' ? simpleKeys : financeKeys;

  return React.createElement(
    'div',
    {
      className:
        'fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm'
    },
    React.createElement(
      'div',
      {
        className:
          'bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col'
      },
      React.createElement(
        'div',
        { className: 'flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-4 shadow-inner' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => setMode('simple'),
            className: `flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              mode === 'simple'
                ? 'bg-white dark:bg-gray-700 text-[#E32636] shadow'
                : 'text-gray-500'
            }`
          },
          'Simple'
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => setMode('finance'),
            className: `flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              mode === 'finance'
                ? 'bg-white dark:bg-gray-700 text-[#E32636] shadow'
                : 'text-gray-500'
            }`
          },
          'Finanzas'
        )
      ),

      React.createElement(
        'div',
        {
          className:
            'bg-gray-50 dark:bg-gray-950 p-4 rounded-3xl mb-4 flex flex-col justify-between h-28 overflow-hidden border border-gray-200 dark:border-gray-800'
        },
        React.createElement(
          'div',
          { className: 'flex justify-between items-center h-4' },
          React.createElement(
            'div',
            { className: 'flex space-x-2 text-[10px] font-black text-gray-400' },
            memory !== 0 &&
              React.createElement(
                'span',
                { className: 'bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded-md' },
                'M'
              ),
            gt !== 0 &&
              React.createElement(
                'span',
                { className: 'bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded-md' },
                'GT'
              )
          ),
          mode === 'finance' &&
            React.createElement(
              'div',
              { className: 'text-[9px] font-black text-gray-400 tracking-widest uppercase' },
              'Financiera'
            )
        ),
        React.createElement(
          'div',
          {
            className:
              'text-gray-900 dark:text-white text-right overflow-y-auto break-all font-black tracking-tighter w-full scrollbar-hide',
            style: {
              fontSize: calc.length > 20 ? '1.3rem' : calc.length > 12 ? '1.7rem' : '2.2rem',
              lineHeight: '1.2'
            }
          },
          calc
        )
      ),

      React.createElement(
        'div',
        { className: 'grid grid-cols-4 gap-2 mb-4' },
        activeKeys.map((k, i) =>
          React.createElement(
            'button',
            {
              type: 'button',
              key: i,
              onClick: () => handle(k.id),
              className: `rounded-2xl shadow-sm flex items-center justify-center font-black text-lg active:scale-90 transition-all py-3 dark:text-white ${k.class}`
            },
            k.id
          )
        ),
        mode === 'finance' &&
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => handle('='),
              className:
                'col-span-4 rounded-2xl shadow-md flex items-center justify-center font-black text-lg active:scale-90 transition-all py-3 text-white bg-[#E32636] hover:bg-red-700'
            },
            '='
          )
      ),

      React.createElement(
        'div',
        { className: 'flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: onClose,
            className:
              'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-3.5 rounded-2xl font-bold flex-1'
          },
          'Cancelar'
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => onResult(evaluateStr(calc)),
            className:
              'bg-[#E32636] text-white px-4 py-3.5 rounded-2xl font-black flex-1 shadow-lg hover:bg-red-700'
          },
          'Usar Valor'
        )
      )
    )
  );
}

// ============================================================================
// GRÁFICOS SVG Y CSS PUROS (TORTA, BARRAS, LÍNEA DE TENDENCIA)
// ============================================================================
function CustomPieChart({ data, colors, total }) {
  let acc = 0;
  const stops = data
    .map((d, i) => {
      const p = (d.value / total) * 100;
      const s = acc;
      acc += p;
      return `${colors[i % colors.length]} ${s}% ${acc}%`;
    })
    .join(', ');

  return React.createElement(
    'div',
    { className: 'flex w-full h-full items-center justify-between' },
    React.createElement(
      'div',
      {
        className:
          'relative w-32 h-32 rounded-full shadow-inner border-4 border-white dark:border-gray-800 shrink-0',
        style: { background: `conic-gradient(${stops})` }
      },
      React.createElement(
        'div',
        {
          className:
            'absolute inset-5 bg-white dark:bg-gray-900 rounded-full flex flex-col items-center justify-center text-center shadow-lg'
        },
        React.createElement(
          'span',
          { className: 'text-[8px] font-black text-gray-400 uppercase tracking-tighter' },
          'TOTAL'
        ),
        React.createElement(
          'span',
          { className: 'font-black text-xs dark:text-white leading-none mt-0.5' },
          total > 9999 ? (total / 1000).toFixed(1) + 'k' : total.toFixed(0)
        )
      )
    ),

    React.createElement(
      'div',
      {
        className:
          'flex flex-col justify-center space-y-2 ml-4 flex-1 h-32 overflow-y-auto scrollbar-hide pr-1'
      },
      data.map((d, i) =>
        React.createElement(
          'div',
          { key: d.label, className: 'flex items-center text-xs w-full' },
          React.createElement('span', {
            className: 'w-3 h-3 rounded-full mr-2 shrink-0',
            style: { backgroundColor: colors[i % colors.length] }
          }),
          React.createElement(
            'div',
            { className: 'flex-1 truncate dark:text-gray-300 mr-1', title: d.label },
            d.label
          ),
          React.createElement(
            'span',
            { className: 'font-bold dark:text-white' },
            `${((d.value / total) * 100).toFixed(0)}%`
          )
        )
      )
    )
  );
}

function CustomBarChart({ data, colors, max, formatMoney }) {
  return React.createElement(
    'div',
    { className: 'w-full h-full relative pt-4 pb-6 pl-4 pr-2' },
    React.createElement('div', {
      className:
        'absolute left-4 right-2 bottom-6 top-4 border-l-2 border-b-2 border-gray-300 dark:border-gray-700 pointer-events-none'
    }),
    React.createElement(
      'div',
      { className: 'w-full h-full flex items-end justify-around gap-2 px-2 relative z-10' },
      data.map((d, i) => {
        const h = max === 0 ? 0 : (d.value / max) * 100;
        return React.createElement(
          'div',
          {
            key: d.label,
            className: 'flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer'
          },
          React.createElement(
            'div',
            {
              className:
                'absolute -top-7 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none shadow-md'
            },
            formatMoney(d.value)
          ),
          React.createElement('div', {
            className: 'w-full max-w-[26px] rounded-t-md transition-all duration-700 shadow-sm',
            style: {
              height: `${h}%`,
              backgroundColor: colors[i % colors.length]
            }
          }),
          React.createElement(
            'div',
            { className: 'absolute -bottom-6 w-16 text-center' },
            React.createElement(
              'span',
              { className: 'text-[9px] text-gray-500 font-bold truncate block' },
              d.label
            )
          )
        );
      })
    )
  );
}

function CustomLineChart({ data, accentColor, gradientId }) {
  const strokeColor = accentColor || '#E32636';
  const gradId = gradientId || 'areaGradient';

  const grouped = useMemo(() => {
    const d = {};
    data.forEach((item) => {
      const dt = item.date;
      d[dt] = (d[dt] || 0) + item.amount;
    });
    return Object.keys(d)
      .sort((a, b) => parseLocalDate(a) - parseLocalDate(b))
      .map((k) => ({ k: k, v: d[k] }));
  }, [data]);

  if (grouped.length < 2) {
    return React.createElement(
      'div',
      { className: 'text-gray-400 text-xs flex items-center h-full pb-4' },
      'Datos insuficientes (mín. 2 fechas) para graficar la tendencia.'
    );
  }

  const max = Math.max(...grouped.map((g) => g.v));
  const paddedMax = max * 1.1;
  const w = 250;
  const h = 100;

  const pts = grouped
    .map((g, i) => {
      const x = (i / (grouped.length - 1)) * w;
      const y = h - (g.v / (paddedMax || 1)) * h;
      return `${x},${y}`;
    })
    .join(' ');

  const polyPts = `0,${h} ${pts} ${w},${h}`;
  const showLabelEvery = Math.ceil(grouped.length / 5);

  return React.createElement(
    'div',
    { className: 'w-full h-full pt-4 pl-2 pr-2' },
    React.createElement(
      'svg',
      { viewBox: `-10 -10 ${w + 20} ${h + 30}`, className: 'w-full h-full overflow-visible' },
      React.createElement(
        'defs',
        null,
        React.createElement(
          'linearGradient',
          { id: gradId, x1: '0', y1: '0', x2: '0', y2: '1' },
          React.createElement('stop', { offset: '0%', stopColor: strokeColor, stopOpacity: '0.4' }),
          React.createElement('stop', { offset: '100%', stopColor: strokeColor, stopOpacity: '0.0' })
        )
      ),
      React.createElement('line', {
        x1: '0',
        y1: '0',
        x2: '0',
        y2: h,
        stroke: 'currentColor',
        strokeWidth: '2',
        className: 'text-gray-300 dark:text-gray-700'
      }),
      React.createElement('line', {
        x1: '0',
        y1: h,
        x2: w,
        y2: h,
        stroke: 'currentColor',
        strokeWidth: '2',
        className: 'text-gray-300 dark:text-gray-700'
      }),
      React.createElement('polygon', { points: polyPts, fill: `url(#${gradId})` }),
      React.createElement('polyline', {
        fill: 'none',
        stroke: strokeColor,
        strokeWidth: '3.5',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        points: pts
      }),
      grouped.map((g, i) => {
        const x = (i / (grouped.length - 1)) * w;
        const y = h - (g.v / (paddedMax || 1)) * h;
        return React.createElement(
          'g',
          { key: i },
          React.createElement('circle', {
            cx: x,
            cy: y,
            r: '4',
            fill: strokeColor,
            stroke: 'white',
            strokeWidth: '2'
          }),
          i % showLabelEvery === 0 &&
            React.createElement(
              'text',
              {
                x: x,
                y: h + 18,
                fontSize: '9',
                fill: 'gray',
                textAnchor: 'middle',
                fontWeight: 'bold'
              },
              g.k.substring(5).replace('-', '/')
            )
        );
      })
    )
  );
}

// ============================================================================
// MONTAJE EN EL DOM (COMPATIBLE CON INDEX.HTML OFFLINE)
// ============================================================================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App, null));