function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect,
  useMemo
} = React;
const IconWrapper = ({
  icon,
  size = 24,
  className = ''
}) => React.createElement("i", {
  className: `fas fa-${icon} ${className}`,
  style: {
    fontSize: size,
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
const Home = p => React.createElement(IconWrapper, _extends({
  icon: "home"
}, p));
const PieChart = p => React.createElement(IconWrapper, _extends({
  icon: "chart-pie"
}, p));
const Wallet = p => React.createElement(IconWrapper, _extends({
  icon: "wallet"
}, p));
const Info = p => React.createElement(IconWrapper, _extends({
  icon: "info-circle"
}, p));
const Plus = p => React.createElement(IconWrapper, _extends({
  icon: "plus"
}, p));
const Calculator = p => React.createElement(IconWrapper, _extends({
  icon: "calculator"
}, p));
const Moon = p => React.createElement(IconWrapper, _extends({
  icon: "moon"
}, p));
const Sun = p => React.createElement(IconWrapper, _extends({
  icon: "sun"
}, p));
const Edit2 = p => React.createElement(IconWrapper, _extends({
  icon: "pen"
}, p));
const Trash2 = p => React.createElement(IconWrapper, _extends({
  icon: "trash"
}, p));
const X = p => React.createElement(IconWrapper, _extends({
  icon: "times"
}, p));
const Check = p => React.createElement(IconWrapper, _extends({
  icon: "check"
}, p));
const Filter = p => React.createElement(IconWrapper, _extends({
  icon: "filter"
}, p));
const BarChart2 = p => React.createElement(IconWrapper, _extends({
  icon: "chart-bar"
}, p));
const TrendingUp = p => React.createElement(IconWrapper, _extends({
  icon: "arrow-trend-up"
}, p));
const ChevronDown = p => React.createElement(IconWrapper, _extends({
  icon: "chevron-down"
}, p));
const Settings = p => React.createElement(IconWrapper, _extends({
  icon: "cog"
}, p));
const Tag = p => React.createElement(IconWrapper, _extends({
  icon: "tag"
}, p));
const CreditCard = p => React.createElement(IconWrapper, _extends({
  icon: "credit-card"
}, p));
const User = p => React.createElement(IconWrapper, _extends({
  icon: "user"
}, p));
const Calendar = p => React.createElement(IconWrapper, _extends({
  icon: "calendar"
}, p));
const DollarSign = p => React.createElement(IconWrapper, _extends({
  icon: "dollar-sign"
}, p));
const APP_VERSION = '1.4.0';
const DEVELOPERS = 'Erika Milena Bernal Miranda y Juan Diego Quintero Zambrano';
const DEFAULT_CATEGORIES = ['Servicios', 'Transporte', 'Comida', 'Hogar'];
const DEFAULT_METHODS = ['Crédito', 'Efectivo', 'Ahorros', 'Débito', 'Transferencia'];
const DEFAULT_RESPONSIBLES = ['Yo', 'Madre', 'Padre', 'Hijo', 'Abuelo'];
const useLocalDB = (key, initialValue) => {
  const [data, setData] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(data));
  }, [key, data]);
  return [data, setData];
};
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useLocalDB('hestia_dark_mode', false);
  const [decimals, setDecimals] = useLocalDB('hestia_decimals', 0);
  const [appScale, setAppScale] = useLocalDB('hestia_scale', 16);
  const [activeTab, setActiveTab] = useState('inicio');
  const [showAbout, setShowAbout] = useState(false);
  const [logoHeaderError, setLogoHeaderError] = useState(false);
  const [expenses, setExpenses] = useLocalDB('hestia_expenses', []);
  const [funds, setFunds] = useLocalDB('hestia_funds', []);
  const [categories, setCategories] = useLocalDB('hestia_categories', DEFAULT_CATEGORIES);
  const [methods, setMethods] = useLocalDB('hestia_methods', DEFAULT_METHODS);
  const [responsibles, setResponsibles] = useLocalDB('hestia_responsibles', DEFAULT_RESPONSIBLES);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  const formatMoney = val => {
    return `$${Number(val).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  };
  const openExpenseModal = (expense = null) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };
  const closeExpenseModal = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(false);
  };
  const handleSaveExpense = expenseData => {
    if (expenseToEdit) {
      setExpenses(expenses.map(ex => ex.id === expenseData.id ? {
        ...expenseData,
        timestamp: ex.timestamp,
        lastModified: Date.now()
      } : ex));
    } else {
      setExpenses([{
        ...expenseData,
        timestamp: Date.now(),
        lastModified: Date.now()
      }, ...expenses]);
    }
    closeExpenseModal();
  };
  const handleDeleteExpense = id => {
    if (window.confirm('¿Desea eliminar este registro permanentemente?')) {
      setExpenses(expenses.filter(ex => ex.id !== id));
    }
  };
  if (isLoading) return React.createElement(LoadingScreen, null);
  return React.createElement("div", {
    className: `min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 font-sans transition-colors duration-300 w-full flex justify-center`
  }, React.createElement("style", null, `:root { font-size: ${appScale}px; }`), React.createElement("div", {
    className: "w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl relative flex flex-col h-screen overflow-hidden"
  }, React.createElement("header", {
    className: "flex justify-between items-center p-4 bg-[#E32636] text-white shadow-md z-10"
  }, React.createElement("div", {
    className: "w-9"
  }), React.createElement("div", {
    className: "flex-1 flex justify-center items-center"
  }, !logoHeaderError ? React.createElement("img", {
    src: "LogoCabezaPag.png",
    alt: "HESTIA Logo",
    onError: () => setLogoHeaderError(true),
    className: "h-8 object-contain"
  }) : React.createElement("h1", {
    className: "text-xl font-bold tracking-wider"
  }, "HESTIA")), React.createElement("div", {
    className: "w-9"
  })), React.createElement("main", {
    className: "flex-1 overflow-y-auto pb-24 p-4 scrollbar-hide relative"
  }, activeTab === 'inicio' && React.createElement(TabInicio, {
    expenses: expenses,
    formatMoney: formatMoney,
    onEdit: openExpenseModal,
    onDelete: handleDeleteExpense,
    onAddNew: () => openExpenseModal()
  }), activeTab === 'historial' && React.createElement(TabHistorial, {
    expenses: expenses,
    categories: categories,
    methods: methods,
    responsibles: responsibles,
    formatMoney: formatMoney,
    onEdit: openExpenseModal,
    onDelete: handleDeleteExpense
  }), activeTab === 'capital' && React.createElement(TabCapital, {
    methods: methods,
    setMethods: setMethods,
    funds: funds,
    setFunds: setFunds,
    expenses: expenses,
    formatMoney: formatMoney
  }), activeTab === 'configuracion' && React.createElement(TabConfiguracion, {
    darkMode: darkMode,
    setDarkMode: setDarkMode,
    decimals: decimals,
    setDecimals: setDecimals,
    appScale: appScale,
    setAppScale: setAppScale,
    setShowAbout: setShowAbout
  })), React.createElement("nav", {
    className: "absolute bottom-0 w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center p-2 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe"
  }, React.createElement(NavItem, {
    icon: React.createElement(Home, {
      size: 22
    }),
    label: "Inicio",
    isActive: activeTab === 'inicio',
    onClick: () => setActiveTab('inicio')
  }), React.createElement(NavItem, {
    icon: React.createElement(PieChart, {
      size: 22
    }),
    label: "Historial",
    isActive: activeTab === 'historial',
    onClick: () => setActiveTab('historial')
  }), React.createElement(NavItem, {
    icon: React.createElement(Wallet, {
      size: 22
    }),
    label: "Capital",
    isActive: activeTab === 'capital',
    onClick: () => setActiveTab('capital')
  }), React.createElement(NavItem, {
    icon: React.createElement(Settings, {
      size: 22
    }),
    label: "Config",
    isActive: activeTab === 'configuracion',
    onClick: () => setActiveTab('configuracion')
  })), showAbout && React.createElement(Modal, {
    title: "Informaci\xF3n",
    onClose: () => setShowAbout(false)
  }, React.createElement("div", {
    className: "flex flex-col items-center text-center space-y-4"
  }, React.createElement("img", {
    src: "logoinfo.png",
    alt: "Hestia Logo",
    className: "w-20 h-20 object-contain drop-shadow-lg"
  }), React.createElement("div", null, React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800 dark:text-white"
  }, "Hestia"), React.createElement("p", {
    className: "text-sm text-gray-500 dark:text-gray-400"
  }, "Gesti\xF3n Econ\xF3mica")), React.createElement("div", {
    className: "w-full border-t border-gray-100 dark:border-gray-700 py-4 mt-2"
  }, React.createElement("p", {
    className: "text-gray-700 dark:text-gray-300"
  }, React.createElement("strong", null, "Versi\xF3n:"), " ", APP_VERSION), React.createElement("p", {
    className: "mt-1 text-gray-700 dark:text-gray-300"
  }, React.createElement("strong", null, "Desarrolladores:"), React.createElement("br", null), DEVELOPERS)))), isExpenseModalOpen && React.createElement(ExpenseFormModal, {
    expense: expenseToEdit,
    onSave: handleSaveExpense,
    onClose: closeExpenseModal,
    categories: categories,
    methods: methods,
    responsibles: responsibles,
    setCategories: setCategories,
    setMethods: setMethods,
    setResponsibles: setResponsibles
  })));
}
function LoadingScreen() {
  const [logoError, setLogoError] = useState(false);
  return React.createElement("div", {
    className: "min-h-screen bg-[#E32636] flex flex-col items-center justify-center text-white w-full"
  }, React.createElement("div", {
    className: "w-32 h-32 mb-6 bg-white rounded-3xl flex items-center justify-center shadow-2xl animate-pulse overflow-hidden p-2"
  }, !logoError ? React.createElement("img", {
    src: "logocarga.png",
    alt: "Logo Carga",
    onError: () => setLogoError(true),
    className: "w-full h-full object-contain"
  }) : React.createElement("span", {
    className: "text-[#E32636] text-6xl font-black"
  }, "H")), React.createElement("h1", {
    className: "text-4xl font-extrabold tracking-widest mb-10"
  }, "HESTIA"), React.createElement("div", {
    className: "w-48 h-2 bg-red-400/50 rounded-full overflow-hidden"
  }, React.createElement("div", {
    className: "h-full bg-white animate-loading"
  })), React.createElement("style", null, `@keyframes loading { 0% { width: 0%; } 100% { width: 100%; } } .animate-loading { animation: loading 1.5s ease-in-out forwards; }`));
}
function NavItem({
  icon,
  label,
  isActive,
  onClick
}) {
  return React.createElement("button", {
    onClick: onClick,
    className: `flex flex-col items-center p-2 transition-all duration-200 ${isActive ? 'text-[#E32636] scale-110' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`
  }, icon, React.createElement("span", {
    className: "text-[10px] mt-1 font-bold"
  }, label));
}
function ExpenseFormModal({
  expense,
  onSave,
  onClose,
  categories,
  methods,
  responsibles,
  setCategories,
  setMethods,
  setResponsibles
}) {
  const [amount, setAmount] = useState(expense ? expense.amount.toString() : '');
  const [description, setDescription] = useState(expense ? expense.description : '');
  const [date, setDate] = useState(expense ? expense.date : new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(expense ? expense.category : categories[0] || '');
  const [method, setMethod] = useState(expense ? expense.method : methods[0] || '');
  const [responsible, setResponsible] = useState(expense ? expense.responsible : responsibles[0] || '');
  const [showCalc, setShowCalc] = useState(false);
  useEffect(() => {
    if (!category && categories.length > 0) setCategory(categories[0]);
    if (!method && methods.length > 0) setMethod(methods[0]);
    if (!responsible && responsibles.length > 0) setResponsible(responsibles[0]);
  }, [categories, methods, responsibles, category, method, responsible]);
  const handleSubmit = e => {
    if (e) e.preventDefault();
    if (!amount || !description) return;
    onSave({
      id: expense ? expense.id : Date.now().toString(),
      amount: parseFloat(amount),
      description,
      date: date || new Date().toISOString().split('T')[0],
      category: category || 'General',
      method: method || 'Efectivo',
      responsible: responsible || 'Yo'
    });
  };
  return React.createElement("div", {
    className: "fixed inset-0 bg-black/70 z-[60] flex items-center justify-center backdrop-blur-sm p-4"
  }, React.createElement("div", {
    className: "bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-6"
  }, React.createElement("h2", {
    className: "text-xl font-black dark:text-white flex items-center"
  }, expense ? React.createElement(Edit2, {
    className: "mr-2 text-[#E32636]",
    size: 20
  }) : React.createElement(Plus, {
    className: "mr-2 text-[#E32636]",
    size: 20
  }), expense ? 'Editar Gasto' : 'Nuevo Gasto'), React.createElement("button", {
    onClick: onClose,
    className: "p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500"
  }, React.createElement(X, {
    size: 20
  }))), React.createElement("form", {
    onSubmit: handleSubmit,
    className: "space-y-4"
  }, React.createElement("div", {
    className: "flex space-x-2"
  }, React.createElement("div", {
    className: "flex-1 relative"
  }, React.createElement("span", {
    className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold"
  }, "$"), React.createElement("input", {
    type: "number",
    step: "0.01",
    inputMode: "decimal",
    value: amount,
    onChange: e => setAmount(e.target.value),
    required: true,
    placeholder: "0.00",
    className: "w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#E32636] rounded-2xl py-4 pl-8 pr-4 text-xl font-black outline-none dark:text-white transition-all"
  })), React.createElement("button", {
    type: "button",
    onClick: () => setShowCalc(true),
    className: "bg-gray-100 dark:bg-gray-800 px-4 rounded-2xl text-[#E32636] border-2 border-transparent hover:border-[#E32636] transition-colors"
  }, React.createElement(Calculator, {
    size: 24
  }))), React.createElement("input", {
    type: "text",
    value: description,
    onChange: e => setDescription(e.target.value),
    required: true,
    placeholder: "Descripci\xF3n del gasto",
    className: "w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#E32636] rounded-2xl p-4 outline-none dark:text-white transition-colors"
  }), React.createElement("div", {
    className: "relative"
  }, React.createElement(Calendar, {
    className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none",
    size: 18
  }), React.createElement("input", {
    type: "date",
    value: date,
    onChange: e => setDate(e.target.value),
    className: "w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-[#E32636] rounded-2xl p-4 pl-12 outline-none dark:text-white dark:[color-scheme:dark] transition-colors"
  })), React.createElement("div", {
    className: "flex gap-2 pt-2 w-full"
  }, React.createElement("div", {
    className: "flex-1"
  }, React.createElement(FancyDropdown, {
    label: "Uso",
    icon: Tag,
    value: category,
    onChange: setCategory,
    options: categories,
    setOptions: setCategories,
    isCompact: true
  })), React.createElement("div", {
    className: "flex-1"
  }, React.createElement(FancyDropdown, {
    label: "M\xE9todo",
    icon: CreditCard,
    value: method,
    onChange: setMethod,
    options: methods,
    setOptions: setMethods,
    isCompact: true
  })), React.createElement("div", {
    className: "flex-1"
  }, React.createElement(FancyDropdown, {
    label: "Resp.",
    icon: User,
    value: responsible,
    onChange: setResponsible,
    options: responsibles,
    setOptions: setResponsibles,
    isCompact: true
  }))), React.createElement("button", {
    type: "submit",
    className: "w-full bg-[#E32636] text-white font-black text-lg py-5 rounded-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all mt-4"
  }, expense ? 'ACTUALIZAR' : 'REGISTRAR'))), showCalc && React.createElement(CalculatorModal, {
    onResult: val => {
      setAmount(val.toString());
      setShowCalc(false);
    },
    onClose: () => setShowCalc(false)
  }));
}
function TabInicio({
  expenses,
  formatMoney,
  onEdit,
  onDelete,
  onAddNew
}) {
  const [filterType, setFilterType] = useState('7days');
  const listToDisplay = useMemo(() => {
    let list = [...expenses];
    if (filterType === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      list = list.filter(ex => new Date(ex.date) >= sevenDaysAgo).sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (filterType === 'added') {
      list = list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (filterType === 'edited') {
      list = list.sort((a, b) => (b.lastModified || b.timestamp || 0) - (a.lastModified || a.timestamp || 0));
    }
    return list.slice(0, 10);
  }, [expenses, filterType]);
  return React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-500 h-full relative"
  }, React.createElement("div", {
    className: "bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[40vh]"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("div", {
    className: "font-bold text-gray-800 dark:text-white flex items-center text-lg w-full"
  }, React.createElement(Calendar, {
    className: "mr-2 text-[#E32636]",
    size: 20
  }), React.createElement("div", {
    className: "relative flex-1"
  }, React.createElement("select", {
    value: filterType,
    onChange: e => setFilterType(e.target.value),
    className: "w-full appearance-none bg-transparent border-none text-gray-800 dark:text-white outline-none cursor-pointer focus:ring-0 truncate pr-8"
  }, React.createElement("option", {
    value: "7days",
    className: "text-black"
  }, "Recientes (7 d\xEDas)"), React.createElement("option", {
    value: "added",
    className: "text-black"
  }, "\xDAltimos Agregados"), React.createElement("option", {
    value: "edited",
    className: "text-black"
  }, "\xDAltimos Editados")), React.createElement(ChevronDown, {
    size: 14,
    className: "absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
  })))), listToDisplay.length === 0 ? React.createElement("div", {
    className: "flex flex-col items-center justify-center text-gray-400 py-10 opacity-50"
  }, React.createElement(Check, {
    size: 48,
    className: "mb-2"
  }), React.createElement("p", {
    className: "text-sm"
  }, "Sin gastos registrados.")) : React.createElement("div", {
    className: "space-y-3"
  }, listToDisplay.map(ex => React.createElement("div", {
    key: ex.id,
    className: "flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
  }, React.createElement("div", {
    className: "flex-1 overflow-hidden pr-2"
  }, React.createElement("p", {
    className: "font-bold text-sm text-gray-800 dark:text-gray-200 truncate"
  }, ex.description), React.createElement("p", {
    className: "text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium uppercase tracking-wider"
  }, ex.date, " \u2022 ", ex.category)), React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("span", {
    className: "font-extrabold text-[#E32636] whitespace-nowrap"
  }, formatMoney(ex.amount)), React.createElement("div", {
    className: "flex gap-1"
  }, React.createElement("button", {
    onClick: () => onEdit(ex),
    className: "p-1.5 text-gray-400 hover:text-blue-500 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
  }, React.createElement(Edit2, {
    size: 14
  })), React.createElement("button", {
    onClick: () => onDelete(ex.id),
    className: "p-1.5 text-gray-400 hover:text-[#E32636] bg-white dark:bg-gray-800 rounded-lg shadow-sm"
  }, React.createElement(Trash2, {
    size: 14
  })))))))), React.createElement("div", {
    className: "fixed bottom-24 right-6 z-20"
  }, React.createElement("button", {
    onClick: onAddNew,
    className: "bg-[#E32636] text-white p-4 rounded-full shadow-2xl hover:bg-red-700 hover:scale-110 transition-all active:scale-95"
  }, React.createElement(Plus, {
    size: 32
  }))));
}
function TabHistorial({
  expenses,
  categories,
  methods,
  responsibles,
  formatMoney,
  onEdit,
  onDelete
}) {
  const [timeFilter, setTimeFilter] = useState('mes');
  const [chartType, setChartType] = useState('torta');
  const [catFilter, setCatFilter] = useState('Todos');
  const [methodFilter, setMethodFilter] = useState('Todos');
  const [respFilter, setRespFilter] = useState('Todos');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const filteredData = useMemo(() => {
    let data = expenses;
    const now = new Date();
    if (timeFilter !== 'historico') {
      data = data.filter(ex => {
        const d = ex.date ? new Date(ex.date) : new Date();
        if (timeFilter === 'año') return d.getFullYear() === now.getFullYear();
        if (timeFilter === 'mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (timeFilter === 'semana') {
          const pastWeek = new Date(now);
          pastWeek.setDate(now.getDate() - 7);
          return d >= pastWeek;
        }
        if (timeFilter === 'dia') return d.toDateString() === now.toDateString();
        return true;
      });
    }
    if (dateRange.start) data = data.filter(ex => ex.date && new Date(ex.date) >= new Date(dateRange.start));
    if (dateRange.end) data = data.filter(ex => ex.date && new Date(ex.date) <= new Date(dateRange.end));
    if (catFilter !== 'Todos') data = data.filter(ex => ex.category === catFilter);
    if (methodFilter !== 'Todos') data = data.filter(ex => ex.method === methodFilter);
    if (respFilter !== 'Todos') data = data.filter(ex => ex.responsible === respFilter);
    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, timeFilter, catFilter, methodFilter, respFilter, dateRange]);
  const total = filteredData.reduce((acc, curr) => acc + curr.amount, 0);
  const chartData = useMemo(() => {
    const grouped = {};
    filteredData.forEach(ex => {
      grouped[ex.category] = (grouped[ex.category] || 0) + ex.amount;
    });
    return Object.entries(grouped).map(([label, value]) => ({
      label,
      value
    })).sort((a, b) => b.value - a.value);
  }, [filteredData]);
  const COLORS = ['#E32636', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#1F2937'];
  return React.createElement("div", {
    className: "space-y-5 animate-in fade-in duration-500 pb-8"
  }, React.createElement("div", {
    className: "bg-[#E32636] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden"
  }, React.createElement("div", {
    className: "relative z-10"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-2"
  }, React.createElement("h3", {
    className: "text-white/80 font-bold uppercase text-xs tracking-widest"
  }, "Total Gastado"), React.createElement("select", {
    value: timeFilter,
    onChange: e => setTimeFilter(e.target.value),
    className: "bg-white/20 border-none text-white text-xs font-bold px-2 py-1 rounded-lg outline-none"
  }, React.createElement("option", {
    value: "dia",
    className: "text-black"
  }, "D\xEDa"), React.createElement("option", {
    value: "semana",
    className: "text-black"
  }, "Semana"), React.createElement("option", {
    value: "mes",
    className: "text-black"
  }, "Mes"), React.createElement("option", {
    value: "a\xF1o",
    className: "text-black"
  }, "A\xF1o"), React.createElement("option", {
    value: "historico",
    className: "text-black"
  }, "Total"))), React.createElement("p", {
    className: "text-4xl font-black"
  }, formatMoney(total)))), React.createElement("div", {
    className: "bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
  }, React.createElement("button", {
    onClick: () => setShowFilters(!showFilters),
    className: "flex items-center justify-between w-full text-gray-700 dark:text-white font-bold"
  }, React.createElement("div", {
    className: "flex items-center"
  }, React.createElement(Filter, {
    size: 18,
    className: "mr-2 text-[#E32636]"
  }), " Filtros Especiales"), React.createElement(ChevronDown, {
    size: 18,
    className: `transform transition-transform ${showFilters ? 'rotate-180' : ''}`
  })), showFilters && React.createElement("div", {
    className: "mt-4 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700"
  }, React.createElement("div", {
    className: "grid grid-cols-2 gap-3 mb-2"
  }, React.createElement("div", {
    className: "flex flex-col"
  }, React.createElement("label", {
    className: "text-[10px] text-gray-500 uppercase font-bold mb-1 ml-1"
  }, "Fecha Desde"), React.createElement("input", {
    type: "date",
    value: dateRange.start,
    onChange: e => setDateRange({
      ...dateRange,
      start: e.target.value
    }),
    className: "w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white dark:[color-scheme:dark] outline-none focus:border-[#E32636] transition-colors"
  })), React.createElement("div", {
    className: "flex flex-col"
  }, React.createElement("label", {
    className: "text-[10px] text-gray-500 uppercase font-bold mb-1 ml-1"
  }, "Fecha Hasta"), React.createElement("input", {
    type: "date",
    value: dateRange.end,
    onChange: e => setDateRange({
      ...dateRange,
      end: e.target.value
    }),
    className: "w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-sm dark:text-white dark:[color-scheme:dark] outline-none focus:border-[#E32636] transition-colors"
  }))), React.createElement("div", {
    className: "grid grid-cols-1 gap-2"
  }, React.createElement("select", {
    value: catFilter,
    onChange: e => setCatFilter(e.target.value),
    className: "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none"
  }, React.createElement("option", {
    value: "Todos"
  }, "Todas las Categor\xEDas"), categories.map(c => React.createElement("option", {
    key: c,
    value: c
  }, c))), React.createElement("select", {
    value: methodFilter,
    onChange: e => setMethodFilter(e.target.value),
    className: "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none"
  }, React.createElement("option", {
    value: "Todos"
  }, "Todos los M\xE9todos"), methods.map(m => React.createElement("option", {
    key: m,
    value: m
  }, m))), React.createElement("select", {
    value: respFilter,
    onChange: e => setRespFilter(e.target.value),
    className: "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm dark:text-white outline-none"
  }, React.createElement("option", {
    value: "Todos"
  }, "Todos los Responsables"), responsibles.map(r => React.createElement("option", {
    key: r,
    value: r
  }, r)))))), React.createElement("div", {
    className: "bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "font-black text-gray-800 dark:text-white"
  }, "Estad\xEDsticas"), React.createElement("div", {
    className: "flex bg-gray-100 dark:bg-gray-900 rounded-xl p-1"
  }, React.createElement("button", {
    onClick: () => setChartType('torta'),
    className: `p-2 rounded-lg ${chartType === 'torta' ? 'bg-white dark:bg-gray-700 shadow text-[#E32636]' : 'text-gray-400'}`
  }, React.createElement(PieChart, {
    size: 18
  })), React.createElement("button", {
    onClick: () => setChartType('barras'),
    className: `p-2 rounded-lg ${chartType === 'barras' ? 'bg-white dark:bg-gray-700 shadow text-[#E32636]' : 'text-gray-400'}`
  }, React.createElement(BarChart2, {
    size: 18
  })), React.createElement("button", {
    onClick: () => setChartType('linea'),
    className: `p-2 rounded-lg ${chartType === 'linea' ? 'bg-white dark:bg-gray-700 shadow text-[#E32636]' : 'text-gray-400'}`
  }, React.createElement(TrendingUp, {
    size: 18
  })))), total === 0 ? React.createElement("div", {
    className: "h-40 flex items-center justify-center text-gray-400 text-sm"
  }, "Sin datos para visualizar") : React.createElement("div", {
    className: "h-48 flex justify-center items-end relative w-full"
  }, chartType === 'torta' && React.createElement(CustomPieChart, {
    data: chartData,
    colors: COLORS,
    total: total,
    formatMoney: formatMoney
  }), chartType === 'barras' && React.createElement(CustomBarChart, {
    data: chartData,
    colors: COLORS,
    max: Math.max(...chartData.map(d => d.value)),
    formatMoney: formatMoney
  }), chartType === 'linea' && React.createElement(CustomLineChart, {
    data: filteredData,
    formatMoney: formatMoney
  }))), React.createElement("div", {
    className: "bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
  }, React.createElement("h3", {
    className: "font-bold text-gray-800 dark:text-white mb-4"
  }, "Listado (", filteredData.length, ")"), React.createElement("div", {
    className: "space-y-3"
  }, filteredData.map(ex => React.createElement("div", {
    key: ex.id,
    className: "flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
  }, React.createElement("div", {
    className: "flex-1 overflow-hidden pr-2"
  }, React.createElement("p", {
    className: "font-bold text-sm text-gray-800 dark:text-gray-200 truncate"
  }, ex.description), React.createElement("p", {
    className: "text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium uppercase tracking-wider"
  }, ex.date, " \u2022 ", ex.method)), React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("span", {
    className: "font-extrabold text-[#E32636] whitespace-nowrap"
  }, formatMoney(ex.amount)), React.createElement("div", {
    className: "flex gap-1"
  }, React.createElement("button", {
    onClick: () => onEdit(ex),
    className: "p-1.5 text-gray-400 hover:text-blue-500 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
  }, React.createElement(Edit2, {
    size: 14
  })), React.createElement("button", {
    onClick: () => onDelete(ex.id),
    className: "p-1.5 text-gray-400 hover:text-[#E32636] bg-white dark:bg-gray-800 rounded-lg shadow-sm"
  }, React.createElement(Trash2, {
    size: 14
  })))))))));
}
function TabCapital({
  methods,
  setMethods,
  funds,
  setFunds,
  expenses,
  formatMoney
}) {
  const [showAddFund, setShowAddFund] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(methods[0] || '');
  const [fundAmount, setFundAmount] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  useEffect(() => {
    if (!methods.includes(selectedMethod) && methods.length > 0) setSelectedMethod(methods[0]);
  }, [methods, selectedMethod]);
  const calculateBalance = methodName => {
    const totalFunds = funds.filter(f => f.method === methodName).reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = expenses.filter(e => e.method === methodName).reduce((acc, curr) => acc + curr.amount, 0);
    return totalFunds - totalExpenses;
  };
  const globalBalance = methods.reduce((acc, method) => acc + calculateBalance(method), 0);
  const handleAddFund = e => {
    e.preventDefault();
    if (!fundAmount || !selectedMethod) return;
    setFunds([...funds, {
      id: Date.now().toString(),
      method: selectedMethod,
      amount: parseFloat(fundAmount),
      date: new Date().toISOString()
    }]);
    setFundAmount('');
    setShowAddFund(false);
  };
  const handleAddAccount = e => {
    e.preventDefault();
    const val = newAccountName.trim();
    if (val && !methods.includes(val)) {
      setMethods([...methods, val]);
      setSelectedMethod(val);
    }
    setNewAccountName('');
    setShowAddAccount(false);
  };
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-500 relative"
  }, React.createElement("div", {
    className: "text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
  }, React.createElement("p", {
    className: "text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1"
  }, "Capital Disponible"), React.createElement("h2", {
    className: `text-4xl font-black ${globalBalance >= 0 ? 'text-green-500' : 'text-[#E32636]'}`
  }, formatMoney(globalBalance))), React.createElement("div", {
    className: "flex justify-between items-center px-1"
  }, React.createElement("h3", {
    className: "font-black text-gray-800 dark:text-white"
  }, "Cuentas"), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => setShowAddAccount(true),
    className: "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-1.5 flex items-center rounded-xl font-bold text-xs hover:bg-gray-300 transition"
  }, React.createElement(Plus, {
    size: 14,
    className: "mr-1"
  }), " Cuenta"), React.createElement("button", {
    onClick: () => setShowAddFund(true),
    className: "bg-[#E32636] text-white px-3 py-1.5 flex items-center rounded-xl font-bold text-xs hover:bg-red-700 transition shadow-sm"
  }, React.createElement(Plus, {
    size: 14,
    className: "mr-1"
  }), " Fondos"))), React.createElement("div", {
    className: "space-y-3"
  }, methods.map(method => {
    const balance = calculateBalance(method);
    return React.createElement("div", {
      key: method,
      className: "flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
    }, React.createElement("div", {
      className: "flex items-center"
    }, React.createElement("div", {
      className: "w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mr-3"
    }, React.createElement(Wallet, {
      size: 18,
      className: "text-[#E32636]"
    })), React.createElement("span", {
      className: "font-bold text-gray-800 dark:text-gray-200"
    }, method)), React.createElement("span", {
      className: `text-lg font-black ${balance >= 0 ? 'text-green-500' : 'text-[#E32636]'}`
    }, formatMoney(balance)));
  }))), showAddFund && React.createElement(Modal, {
    title: "Agregar Fondos",
    onClose: () => setShowAddFund(false)
  }, React.createElement("form", {
    onSubmit: handleAddFund,
    className: "space-y-4"
  }, React.createElement("select", {
    value: selectedMethod,
    onChange: e => setSelectedMethod(e.target.value),
    className: "w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold dark:text-white"
  }, methods.map(m => React.createElement("option", {
    key: m,
    value: m
  }, m))), React.createElement("input", {
    type: "number",
    step: "0.01",
    value: fundAmount,
    onChange: e => setFundAmount(e.target.value),
    placeholder: "0.00",
    className: "w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-black text-xl dark:text-white"
  }), React.createElement("button", {
    type: "submit",
    className: "w-full bg-[#E32636] text-white font-black py-4 rounded-2xl mt-2"
  }, "GUARDAR INGRESO"))), showAddAccount && React.createElement(Modal, {
    title: "Nueva Cuenta",
    onClose: () => setShowAddAccount(false)
  }, React.createElement("form", {
    onSubmit: handleAddAccount,
    className: "space-y-4"
  }, React.createElement("input", {
    type: "text",
    value: newAccountName,
    onChange: e => setNewAccountName(e.target.value),
    placeholder: "Nombre de la cuenta",
    className: "w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold dark:text-white",
    required: true,
    autoFocus: true
  }), React.createElement("button", {
    type: "submit",
    className: "w-full bg-[#E32636] text-white font-black py-4 rounded-2xl mt-2"
  }, "CREAR CUENTA"))));
}
function TabConfiguracion({
  darkMode,
  setDarkMode,
  decimals,
  setDecimals,
  appScale,
  setAppScale,
  setShowAbout
}) {
  return React.createElement("div", {
    className: "space-y-6 animate-in fade-in duration-500"
  }, React.createElement("h2", {
    className: "text-2xl font-black text-gray-800 dark:text-white mb-6"
  }, "Configuraci\xF3n"), React.createElement("div", {
    className: "bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("div", {
    className: "flex items-center"
  }, darkMode ? React.createElement(Moon, {
    size: 20,
    className: "mr-3 text-indigo-400"
  }) : React.createElement(Sun, {
    size: 20,
    className: "mr-3 text-yellow-500"
  }), React.createElement("span", {
    className: "font-bold"
  }, "Modo Oscuro")), React.createElement("button", {
    onClick: () => setDarkMode(!darkMode),
    className: `w-12 h-6 rounded-full relative ${darkMode ? 'bg-[#E32636]' : 'bg-gray-300'}`
  }, React.createElement("div", {
    className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'right-1' : 'left-1'}`
  }))), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "flex items-center"
  }, React.createElement(DollarSign, {
    size: 20,
    className: "mr-3 text-green-500"
  }), React.createElement("span", {
    className: "font-bold"
  }, "Decimales")), React.createElement("div", {
    className: "flex bg-gray-100 dark:bg-gray-900 rounded-xl p-1"
  }, [0, 1, 2].map(n => React.createElement("button", {
    key: n,
    onClick: () => setDecimals(n),
    className: `flex-1 py-2 rounded-lg font-black transition-all ${decimals === n ? 'bg-white dark:bg-gray-700 text-[#E32636] shadow-sm' : 'text-gray-400'}`
  }, n)))), React.createElement("div", {
    className: "space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center"
  }, React.createElement(Settings, {
    size: 20,
    className: "mr-3 text-blue-500"
  }), React.createElement("span", {
    className: "font-bold"
  }, "Tama\xF1o de Interfaz")), React.createElement("span", {
    className: "text-[10px] font-black text-[#E32636] bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-lg uppercase"
  }, appScale, "px")), React.createElement("input", {
    type: "range",
    min: "12",
    max: "22",
    step: "1",
    value: appScale,
    onChange: e => setAppScale(Number(e.target.value)),
    className: "w-full accent-[#E32636]"
  }), React.createElement("div", {
    className: "flex justify-between text-[10px] text-gray-400 font-bold uppercase"
  }, React.createElement("span", null, "Min"), React.createElement("span", null, "Max")))), React.createElement("div", {
    className: "bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
  }, React.createElement("div", {
    className: "flex justify-between items-center cursor-pointer",
    onClick: () => setShowAbout(true)
  }, React.createElement("div", {
    className: "flex items-center text-gray-800 dark:text-white"
  }, React.createElement(Info, {
    size: 20,
    className: "mr-3 text-blue-500"
  }), React.createElement("span", {
    className: "font-bold"
  }, "Acerca de la App")), React.createElement(ChevronDown, {
    size: 18,
    className: "text-gray-400 -rotate-90"
  }))), React.createElement("div", {
    className: "p-4 text-center"
  }, React.createElement("p", {
    className: "text-[10px] text-gray-400 font-bold uppercase tracking-widest"
  }, "Hestia Econ\xF3mica v", APP_VERSION)));
}
function FancyDropdown({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  setOptions,
  isCompact = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newVal, setNewVal] = useState('');
  const handleAdd = () => {
    const val = newVal.trim();
    if (val && !options.includes(val)) {
      setOptions([...options, val]);
      onChange(val);
    }
    setNewVal('');
    setIsOpen(false);
  };
  const handleRemove = (e, opt) => {
    e.stopPropagation();
    if (window.confirm(`¿Quitar '${opt}'?`)) {
      const filtered = options.filter(o => o !== opt);
      setOptions(filtered);
      if (value === opt) onChange(filtered[0] || '');
    }
  };
  return React.createElement("div", {
    className: "relative w-full"
  }, React.createElement("div", {
    onClick: () => setIsOpen(!isOpen),
    className: `w-full flex ${isCompact ? 'flex-col justify-center p-3' : 'items-center justify-between p-4'} bg-gray-50 dark:bg-gray-800 border-2 rounded-2xl cursor-pointer transition-all ${isOpen ? 'border-[#E32636]' : 'border-transparent'}`
  }, React.createElement("div", {
    className: `flex ${isCompact ? 'flex-col items-center text-center' : 'items-center'} text-gray-700 dark:text-gray-200 w-full`
  }, Icon && React.createElement(Icon, {
    size: isCompact ? 16 : 18,
    className: `${isCompact ? 'mb-1.5' : 'mr-3'} ${isOpen ? 'text-[#E32636]' : 'text-gray-400'}`
  }), React.createElement("div", {
    className: `${isCompact ? 'w-full' : 'text-left'}`
  }, React.createElement("span", {
    className: `text-[10px] text-gray-400 font-bold block leading-none ${isCompact ? 'mb-1' : 'mb-1'}`
  }, label), React.createElement("span", {
    className: `font-black leading-none block truncate ${isCompact ? 'text-xs' : ''}`
  }, value || 'Seleccionar'))), !isCompact && React.createElement(ChevronDown, {
    size: 18,
    className: `text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`
  })), isOpen && React.createElement("div", {
    className: "fixed inset-0 bg-black/70 z-[70] flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200",
    onClick: () => setIsOpen(false)
  }, React.createElement("div", {
    className: "bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700"
  }, React.createElement("h3", {
    className: "font-black text-lg dark:text-white flex items-center"
  }, Icon && React.createElement(Icon, {
    size: 20,
    className: "mr-2 text-[#E32636]"
  }), label), React.createElement("button", {
    type: "button",
    onClick: () => setIsOpen(false),
    className: "p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500"
  }, React.createElement(X, {
    size: 18
  }))), React.createElement("div", {
    className: "flex-1 overflow-y-auto p-3"
  }, options.map(opt => React.createElement("div", {
    key: opt,
    onClick: () => {
      onChange(opt);
      setIsOpen(false);
    },
    className: `flex justify-between items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${value === opt ? 'bg-red-50 dark:bg-red-900/30 text-[#E32636]' : 'text-gray-600 dark:text-gray-300'}`
  }, React.createElement("span", {
    className: "font-bold truncate pr-2"
  }, opt), React.createElement("button", {
    type: "button",
    onClick: e => handleRemove(e, opt),
    className: "text-gray-300 hover:text-red-500 shrink-0"
  }, React.createElement(Trash2, {
    size: 16
  }))))), React.createElement("div", {
    className: "p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex"
  }, React.createElement("input", {
    type: "text",
    value: newVal,
    onChange: e => setNewVal(e.target.value),
    onKeyDown: e => e.key === 'Enter' && (e.preventDefault(), handleAdd()),
    placeholder: "Agregar nueva opci\xF3n...",
    className: "flex-1 bg-white dark:bg-gray-800 rounded-l-xl px-4 py-3 text-sm outline-none dark:text-white min-w-0 border-2 border-transparent focus:border-[#E32636]"
  }), React.createElement("button", {
    type: "button",
    onClick: handleAdd,
    className: "bg-[#E32636] text-white px-5 rounded-r-xl font-black text-xl"
  }, "+")))));
}
function Modal({
  title,
  onClose,
  children
}) {
  return React.createElement("div", {
    className: "fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300"
  }, React.createElement("div", {
    className: "bg-white dark:bg-gray-900 rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-200"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-6"
  }, React.createElement("h2", {
    className: "text-lg font-black dark:text-white uppercase tracking-wider"
  }, title), React.createElement("button", {
    onClick: onClose,
    className: "text-gray-400 hover:text-red-500"
  }, React.createElement(X, {
    size: 20
  }))), children));
}
function CalculatorModal({
  onResult,
  onClose
}) {
  const [mode, setMode] = useState('simple');
  const [calc, setCalc] = useState('0');
  const [memory, setMemory] = useState(0);
  const [gt, setGt] = useState(0);
  const evaluateStr = expr => {
    try {
      const parsed = expr.replace(/x/g, '*').replace(/÷/g, '/');
      const res = new Function('return ' + parsed)();
      return Number.isFinite(res) ? Math.round(res * 10000) / 10000 : 0;
    } catch {
      return 0;
    }
  };
  const handle = v => {
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
    if (calc === '0' && !['.', '00', '000', '+', '-', 'x', '÷'].includes(v)) setCalc(v);else setCalc(calc + v);
  };
  const simpleKeys = [{
    id: 'AC',
    class: 'text-[#E32636] bg-red-50 dark:bg-red-900/20'
  }, {
    id: '⌫',
    class: 'text-[#E32636] bg-red-50 dark:bg-red-900/20'
  }, {
    id: '%',
    class: 'text-[#E32636] bg-red-50 dark:bg-red-900/20'
  }, {
    id: '÷',
    class: 'text-white bg-[#E32636] shadow-md'
  }, {
    id: '7',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '8',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '9',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: 'x',
    class: 'text-white bg-[#E32636] shadow-md'
  }, {
    id: '4',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '5',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '6',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '-',
    class: 'text-white bg-[#E32636] shadow-md'
  }, {
    id: '1',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '2',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '3',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '+',
    class: 'text-white bg-[#E32636] shadow-md'
  }, {
    id: '0',
    class: 'bg-gray-50 dark:bg-gray-800 col-span-2'
  }, {
    id: '.',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '=',
    class: 'text-white bg-[#E32636] shadow-md'
  }];
  const financeKeys = [{
    id: 'GT',
    class: 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800'
  }, {
    id: 'M+',
    class: 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800'
  }, {
    id: 'M-',
    class: 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800'
  }, {
    id: 'MRC',
    class: 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800'
  }, {
    id: 'AC',
    class: 'text-[#E32636] bg-red-50 dark:bg-red-900/20'
  }, {
    id: '⌫',
    class: 'text-[#E32636] bg-red-50 dark:bg-red-900/20'
  }, {
    id: '√',
    class: 'text-[#E32636] bg-red-50 dark:bg-red-900/20'
  }, {
    id: '÷',
    class: 'text-white bg-[#E32636] shadow-md'
  }, {
    id: '7',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '8',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '9',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: 'x',
    class: 'text-white bg-[#E32636] shadow-md'
  }, {
    id: '4',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '5',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '6',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '-',
    class: 'text-white bg-[#E32636] shadow-md'
  }, {
    id: '1',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '2',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '3',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '+',
    class: 'text-white bg-[#E32636] shadow-md row-span-2'
  }, {
    id: '0',
    class: 'bg-gray-50 dark:bg-gray-800'
  }, {
    id: '00',
    class: 'bg-gray-50 dark:bg-gray-800 text-sm'
  }, {
    id: '.',
    class: 'bg-gray-50 dark:bg-gray-800'
  }];
  const activeKeys = mode === 'simple' ? simpleKeys : financeKeys;
  return React.createElement("div", {
    className: "fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300"
  }, React.createElement("div", {
    className: "bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col"
  }, React.createElement("div", {
    className: "flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-4 relative z-10 shadow-inner"
  }, React.createElement("button", {
    onClick: () => setMode('simple'),
    className: `flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${mode === 'simple' ? 'bg-white dark:bg-gray-700 text-[#E32636] shadow-md' : 'text-gray-500'}`
  }, "Simple"), React.createElement("button", {
    onClick: () => setMode('finance'),
    className: `flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${mode === 'finance' ? 'bg-white dark:bg-gray-700 text-[#E32636] shadow-md' : 'text-gray-500'}`
  }, "Finanzas")), React.createElement("div", {
    className: "bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus-within:border-[#E32636] p-4 rounded-3xl mb-4 flex flex-col justify-between shadow-inner relative transition-colors h-32 overflow-hidden"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-1 h-4 flex-shrink-0"
  }, React.createElement("div", {
    className: "flex space-x-2 text-[10px] font-black text-gray-400"
  }, memory !== 0 && React.createElement("span", {
    className: "bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-md"
  }, "M"), gt !== 0 && React.createElement("span", {
    className: "bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded-md"
  }, "GT")), mode === 'finance' && React.createElement("div", {
    className: "text-[9px] font-black text-gray-400 tracking-widest uppercase"
  }, "Financiera")), React.createElement("div", {
    className: "text-gray-900 dark:text-white text-right overflow-y-auto break-all font-black tracking-tighter w-full max-h-full scrollbar-hide flex flex-col justify-end",
    style: {
      fontSize: calc.length > 22 ? '1.3rem' : calc.length > 12 ? '1.7rem' : '2.25rem',
      lineHeight: '1.2'
    }
  }, calc)), React.createElement("div", {
    className: "grid grid-cols-4 gap-2 sm:gap-3 mb-4"
  }, activeKeys.map((k, i) => React.createElement("button", {
    key: i,
    onClick: () => handle(k.id),
    className: `rounded-2xl shadow-sm flex items-center justify-center font-black text-xl active:scale-90 transition-all py-3 sm:py-4 hover:brightness-95 dark:hover:brightness-110 dark:text-white ${k.class}`
  }, k.id)), mode === 'finance' && React.createElement("button", {
    onClick: () => handle('='),
    className: "col-span-4 rounded-2xl shadow-md flex items-center justify-center font-black text-xl active:scale-90 transition-all py-3 sm:py-4 text-white bg-[#E32636] hover:bg-red-700"
  }, "=")), React.createElement("div", {
    className: "flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800"
  }, React.createElement("button", {
    onClick: onClose,
    className: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-4 rounded-2xl font-bold flex-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
  }, "Cancelar"), React.createElement("button", {
    onClick: () => onResult(evaluateStr(calc)),
    className: "bg-[#E32636] text-white px-4 py-4 rounded-2xl font-black flex-1 shadow-lg hover:bg-red-700 transition-colors active:scale-95"
  }, "Usar Valor"))));
}
function CustomPieChart({
  data,
  colors,
  total
}) {
  let acc = 0;
  const stops = data.map((d, i) => {
    const p = d.value / total * 100;
    const s = acc;
    acc += p;
    return `${colors[i % colors.length]} ${s}% ${acc}%`;
  }).join(', ');
  return React.createElement("div", {
    className: "flex w-full h-full items-center justify-between"
  }, React.createElement("div", {
    className: "relative w-32 h-32 rounded-full shadow-inner border-4 border-white dark:border-gray-800 flex-shrink-0",
    style: {
      background: `conic-gradient(${stops})`
    }
  }, React.createElement("div", {
    className: "absolute inset-5 bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center text-center shadow-lg"
  }, React.createElement("span", {
    className: "text-[8px] font-black text-gray-400 uppercase tracking-tighter"
  }, "TOTAL"), React.createElement("span", {
    className: "font-black text-sm dark:text-white leading-none"
  }, total > 9999 ? (total / 1000).toFixed(1) + 'k' : total.toFixed(0)))), React.createElement("div", {
    className: "flex flex-col justify-center space-y-2 ml-4 flex-1 h-32 overflow-y-auto scrollbar-hide pr-1"
  }, data.map((d, i) => React.createElement("div", {
    key: d.label,
    className: "flex items-center text-xs w-full"
  }, React.createElement("span", {
    className: "w-3 h-3 rounded-full mr-2 flex-shrink-0",
    style: {
      backgroundColor: colors[i % colors.length]
    }
  }), React.createElement("div", {
    className: "flex-1 truncate dark:text-gray-300 mr-1",
    title: d.label
  }, d.label), React.createElement("span", {
    className: "font-bold dark:text-white"
  }, (d.value / total * 100).toFixed(0), "%")))));
}
function CustomBarChart({
  data,
  colors,
  max,
  formatMoney
}) {
  return React.createElement("div", {
    className: "w-full h-full relative pt-4 pb-6 pl-4 pr-2"
  }, React.createElement("div", {
    className: "absolute left-4 right-2 bottom-6 top-4 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 pointer-events-none"
  }), React.createElement("div", {
    className: "w-full h-full flex items-end justify-around gap-2 px-2 relative z-10"
  }, data.map((d, i) => {
    const h = max === 0 ? 0 : d.value / max * 100;
    return React.createElement("div", {
      key: d.label,
      className: "flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
    }, React.createElement("div", {
      className: "absolute -top-7 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none shadow-md"
    }, formatMoney(d.value)), React.createElement("div", {
      className: "w-full max-w-[24px] rounded-t-md transition-all duration-1000 shadow-sm",
      style: {
        height: `${h}%`,
        backgroundColor: colors[i % colors.length]
      }
    }), React.createElement("div", {
      className: "absolute -bottom-6 w-16 text-center"
    }, React.createElement("span", {
      className: "text-[8px] text-gray-500 font-bold truncate block"
    }, d.label)));
  })));
}
function CustomLineChart({
  data
}) {
  const grouped = useMemo(() => {
    const d = {};
    data.forEach(ex => {
      const dt = ex.date;
      d[dt] = (d[dt] || 0) + ex.amount;
    });
    return Object.keys(d).sort((a, b) => new Date(a) - new Date(b)).map(k => ({
      k,
      v: d[k]
    }));
  }, [data]);
  if (grouped.length < 2) return React.createElement("div", {
    className: "text-gray-400 text-xs flex items-center h-full pb-4"
  }, "Datos insuficientes (M\xEDn. 2 fechas) para la tendencia.");
  const max = Math.max(...grouped.map(g => g.v));
  const paddedMax = max * 1.1;
  const w = 250,
    h = 100;
  const pts = grouped.map((g, i) => {
    const x = i / (grouped.length - 1) * w;
    const y = h - g.v / (paddedMax || 1) * h;
    return `${x},${y}`;
  }).join(' ');
  const polyPts = `0,${h} ${pts} ${w},${h}`;
  const showLabelEvery = Math.ceil(grouped.length / 5);
  return React.createElement("div", {
    className: "w-full h-full pt-4 pl-2 pr-2"
  }, React.createElement("svg", {
    viewBox: `-10 -10 ${w + 20} ${h + 30}`,
    className: "w-full h-full overflow-visible"
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "areaGradient",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "#E32636",
    stopOpacity: "0.4"
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "#E32636",
    stopOpacity: "0.0"
  }))), React.createElement("line", {
    x1: "0",
    y1: "0",
    x2: "0",
    y2: h,
    stroke: "currentColor",
    strokeWidth: "2",
    className: "text-gray-300 dark:text-gray-600"
  }), React.createElement("line", {
    x1: "0",
    y1: h,
    x2: w,
    y2: h,
    stroke: "currentColor",
    strokeWidth: "2",
    className: "text-gray-300 dark:text-gray-600"
  }), React.createElement("polygon", {
    points: polyPts,
    fill: "url(#areaGradient)"
  }), React.createElement("polyline", {
    fill: "none",
    stroke: "#E32636",
    strokeWidth: "4",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    points: pts
  }), grouped.map((g, i) => {
    const x = i / (grouped.length - 1) * w;
    const y = h - g.v / (paddedMax || 1) * h;
    return React.createElement("g", {
      key: i
    }, React.createElement("circle", {
      cx: x,
      cy: y,
      r: "4",
      fill: "#E32636",
      stroke: "white",
      strokeWidth: "2"
    }), i % showLabelEvery === 0 && React.createElement("text", {
      x: x,
      y: h + 18,
      fontSize: "9",
      fill: "gray",
      textAnchor: "middle",
      fontWeight: "bold"
    }, g.k.substring(5).replace('-', '/')));
  })));
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App, null));