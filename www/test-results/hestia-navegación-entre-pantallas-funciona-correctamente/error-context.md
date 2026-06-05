# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hestia.spec.js >> navegación entre pantallas funciona correctamente
- Location: tests\e2e\hestia.spec.js:21:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Estadísticas')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - img "HESTIA Logo" [ref=e7]
  - main [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e12]:
          - generic [ref=e13]: 
          - generic [ref=e14]:
            - combobox [ref=e15] [cursor=pointer]:
              - option "Recientes (7 días)" [selected]
              - option "Últimos Agregados"
              - option "Últimos Editados"
            - generic: 
        - generic [ref=e16]:
          - generic [ref=e17]: 
          - paragraph [ref=e18]: Sin gastos registrados.
      - button "+" [ref=e20] [cursor=pointer]:
        - generic [ref=e21]: +
  - navigation [ref=e22]:
    - button " Inicio" [ref=e23] [cursor=pointer]:
      - generic [ref=e24]: 
      - generic [ref=e25]: Inicio
    - button " Historial" [ref=e26] [cursor=pointer]:
      - generic [ref=e27]: 
      - generic [ref=e28]: Historial
    - button " Capital" [ref=e29] [cursor=pointer]:
      - generic [ref=e30]: 
      - generic [ref=e31]: Capital
    - button " Config" [ref=e32] [cursor=pointer]:
      - generic [ref=e33]: 
      - generic [ref=e34]: Config
```

# Test source

```ts
  1  | // tests/e2e/hestia.spec.js
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | // E2E 1: La app carga y muestra el título
  5  | test('la app carga y muestra el encabezado principal', async ({ page }) => {
  6  |   await page.goto('/');
  7  |   await expect(page.locator('h1')).toContainText('Hestia');
  8  | });
  9  | 
  10 | // E2E 2: Flujo completo de agregar gasto
  11 | test('usuario puede agregar un gasto y verlo reflejado', async ({ page }) => {
  12 |   await page.goto('/');
  13 |   await page.fill('[placeholder*="descripción" i]', 'Mercado');
  14 |   await page.fill('[placeholder*="monto" i]', '80000');
  15 |   await page.click('button:has-text("Agregar")');
  16 |   await expect(page.locator('text=Mercado')).toBeVisible();
  17 |   await expect(page.locator('text=80.000')).toBeVisible();
  18 | });
  19 | 
  20 | // E2E 3: Navegación entre secciones
  21 | test('navegación entre pantallas funciona correctamente', async ({ page }) => {
  22 |   await page.goto('/');
> 23 |   await page.click('text=Estadísticas');  // ajusta al texto real del nav
     |              ^ Error: page.click: Test timeout of 30000ms exceeded.
  24 |   await expect(page).toHaveURL(/.*estadisticas.*/);
  25 |   // O si es SPA sin cambio de URL:
  26 |   await expect(page.locator('[data-section="estadisticas"]')).toBeVisible();
  27 | });
  28 | 
```