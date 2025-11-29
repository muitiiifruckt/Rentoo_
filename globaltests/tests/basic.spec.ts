import { test, expect } from '@playwright/test';

/**
 * Базовые тесты для проверки работоспособности системы
 */
test.describe('Basic System Tests', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Проверяем, что страница загрузилась - проверяем наличие body или любого контента
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
    
    // Проверяем наличие основных элементов
    const header = page.locator('header, [role="banner"]').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should have working API health check', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('should have working API root endpoint', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.message).toContain('Rentoo');
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Проверяем навигацию на страницу логина
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    
    // Проверяем навигацию обратно на главную
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('should display header with logo', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ищем логотип или название приложения - используем правильный синтаксис Playwright
    const logo = page.locator('a:has-text("Rentoo"), [href="/"]:has-text("Rentoo")').first();
    await expect(logo).toBeVisible({ timeout: 10000 });
  });
});

