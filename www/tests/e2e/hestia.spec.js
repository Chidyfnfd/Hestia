// tests/e2e/hestia.spec.js
import { test, expect } from '@playwright/test';

// E2E 1: La app carga y muestra el título
test('la app carga y muestra el encabezado principal', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Hestia');
});

// E2E 2: Flujo completo de agregar gasto
test('usuario puede agregar un gasto y verlo reflejado', async ({ page }) => {
  await page.goto('/');
  await page.fill('[placeholder*="descripción" i]', 'Mercado');
  await page.fill('[placeholder*="monto" i]', '80000');
  await page.click('button:has-text("Agregar")');
  await expect(page.locator('text=Mercado')).toBeVisible();
  await expect(page.locator('text=80.000')).toBeVisible();
});

// E2E 3: Navegación entre secciones
test('navegación entre pantallas funciona correctamente', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Estadísticas');  // ajusta al texto real del nav
  await expect(page).toHaveURL(/.*estadisticas.*/);
  // O si es SPA sin cambio de URL:
  await expect(page.locator('[data-section="estadisticas"]')).toBeVisible();
});
