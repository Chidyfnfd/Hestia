Hestia-Gestor Economico

Enlace del prototipo desplegado: 
https://hestia-embm-jdqz.netlify.app

<a href="./Hestia.apk?raw=true">
   <img src="https://img.shields.io/badge/Descargar-Hestia.apk-success?style=for-the-badge&logo=android" alt="Descargar APK">
</a>

🏠 Hestia - Gestión Económica Personal

Hestia es una aplicación web y móvil (APK) diseñada para el control exhaustivo de finanzas personales. Permite gestionar ingresos, gastos, ahorros y deudas con una interfaz moderna, oscura y minimalista, optimizada tanto para escritorio como para dispositivos móviles.


🚀 Tecnologías Utilizadas

El proyecto destaca por su arquitectura "Single-File Web App", donde toda la lógica y el diseño residen en un único punto de entrada para facilitar su portabilidad.

- Frontend Core: React 18 (vía CDN).

- Estilos y UI: Tailwind CSS para un diseño responsivo y modo oscuro nativo.

- Iconografía: FontAwesome 6 para elementos visuales intuitivos.

- Gestión de Estado: Hooks de React (useState, useEffect, useMemo).

- Persistencia de Datos: localStorage del navegador (permitiendo uso offline).

- Visualización de Datos: Gráficos SVG personalizados generados dinámicamente.

- Compilación Móvil: Capacitor de Ionic para la generación del APK de Android.
  

🏗️ Arquitectura del Proyecto

A pesar de residir en un solo archivo, el código sigue una estructura modular basada en componentes de React:

1. Sistema de Rutas (State-Based Routing)

No utiliza un router externo; el cambio entre secciones (Inicio, Transacciones, Ahorros, Gráficos) se gestiona mediante un estado currentView, lo que garantiza transiciones instantáneas.

2. Componentes Principales

App: El cerebro de la aplicación. Maneja el estado global de las finanzas y la lógica de guardado automático.

Dashboard: Resumen visual con tarjetas de balance (Ingresos, Gastos, Saldo Actual).

TransactionForm: Sistema de entrada de datos con validación y categorías.

History: Lista filtrable de movimientos con opción de eliminación.

Charts: Renderizado de gráficos de tendencias mediante cálculos matemáticos sobre el historial.

Savings & Debts: Módulos específicos para metas de ahorro y control de préstamos.


🛠️ Funcionamiento Paso a Paso

Flujo de Datos

Entrada: El usuario registra una transacción.

Procesamiento: La función addTransaction calcula el impacto en el balance general y actualiza el estado de React.

Persistencia: Un useEffect detecta cambios en el estado y sincroniza los datos con el almacenamiento local del dispositivo.

Visualización: Los componentes de UI reaccionan al nuevo estado, actualizando gráficos y saldos sin necesidad de recargar la página.

Conversión a Móvil (Android)

El proyecto utiliza Capacitor para inyectar el código web en un WebView nativo de Android.

Bridge: Capacitor permite que el index.html se comporte como una App instalable.

Android Studio: Se utiliza para compilar el código Java/Kotlin necesario para generar el archivo .apk.
