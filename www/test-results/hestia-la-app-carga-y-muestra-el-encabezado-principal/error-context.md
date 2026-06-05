# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hestia.spec.js >> la app carga y muestra el encabezado principal
- Location: tests\e2e\hestia.spec.js:5:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Hestia"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    7 × locator resolved to <h1 class="text-4xl font-extrabold tracking-widest mb-10">HESTIA</h1>
      - unexpected value "HESTIA"

```

```yaml
- banner:
  - img "HESTIA Logo"
- main:
  - text: 
  - combobox:
    - option "Recientes (7 días)" [selected]
    - option "Últimos Agregados"
    - option "Últimos Editados"
  - text:  
  - paragraph: Sin gastos registrados.
  - button "+"
- navigation:
  - button " Inicio"
  - button " Historial"
  - button " Capital"
  - button " Config"
```

# Test source

```ts
  1  | // tests/e2e/hestia.spec.js
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | // E2E 1: La app carga y muestra el título
  5  | test('la app carga y muestra el encabezado principal', async ({ page }) => {
  6  |   await page.goto('/');
> 7  |   await expect(page.locator('h1')).toContainText('Hestia');
     |                                    ^ Error: expect(locator).toContainText(expected) failed
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
  23 |   await page.click('text=Estadísticas');  // ajusta al texto real del nav
  24 |   await expect(page).toHaveURL(/.*estadisticas.*/);
  25 |   // O si es SPA sin cambio de URL:
  26 |   await expect(page.locator('[data-section="estadisticas"]')).toBeVisible();
  27 | });
  28 | 
```