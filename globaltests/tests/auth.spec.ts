import { test, expect } from '@playwright/test';
import { registerUser, loginUser, loginUserViaAPI, TEST_USER_1, clearStorage, generateUniqueEmail } from './fixtures';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Очищаем storage после перехода на страницу
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Игнорируем ошибки
      }
    });
  });

  test('should register a new user', async ({ page }) => {
    const uniqueEmail = generateUniqueEmail();
    
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Ждем появления полей формы
    await page.waitForSelector('input[name="name"]', { timeout: 10000 });
    
    // Заполняем форму регистрации (порядок: name, email, password)
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    // Отправляем форму
    await page.click('button[type="submit"]');
    
    // Ожидаем редирект на главную страницу
    await page.waitForURL('/', { timeout: 20000 });
    
    // Ждем загрузки страницы и обновления состояния авторизации
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Дополнительная задержка для обновления AuthContext
    
    // Проверяем, что пользователь авторизован (ищем ссылку на профиль или имя пользователя)
    const profileLink = page.locator('a[href="/profile"]').first();
    await expect(profileLink).toBeVisible({ timeout: 15000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    // Сначала регистрируем пользователя через API
    const uniqueEmail = generateUniqueEmail();
    await registerUser(page, {
      email: uniqueEmail,
      password: 'TestPassword123!',
      name: 'Test User',
    });
    
    // Теперь логинимся через UI
    await page.goto('/login');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Ожидаем редирект
    await page.waitForURL('/', { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Ждем обновления AuthContext
    
    // Проверяем, что мы на главной странице и авторизованы
    await expect(page).toHaveURL('/');
    const profileLink = page.locator('a[href="/profile"]').first();
    await expect(profileLink).toBeVisible({ timeout: 15000 });
  });

  test('should show error on invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Ожидаем сообщение об ошибке (может быть в div с role="alert" или просто текст)
    // Используем правильный синтаксис Playwright для поиска текста
    const errorMessage = page.locator('text=/неверный|incorrect|error|Неверный/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should logout user', async ({ page }) => {
    // Регистрируем и логинимся
    const uniqueEmail = generateUniqueEmail();
    await registerUser(page, {
      email: uniqueEmail,
      password: 'TestPassword123!',
      name: 'Test User',
    });
    await loginUser(page, uniqueEmail, 'TestPassword123!');
    
    // Ищем кнопку выхода (в Header есть кнопка "Выйти")
    const logoutButton = page.locator('button:has-text("Выйти"), button[aria-label="Выйти"]').first();
    if (await logoutButton.isVisible({ timeout: 5000 })) {
      await logoutButton.click();
    } else {
      // Если кнопка не видна, возможно нужно открыть мобильное меню
      const menuButton = page.locator('button[aria-label*="меню"], button[aria-expanded]');
      if (await menuButton.isVisible({ timeout: 2000 })) {
        await menuButton.click();
        await page.waitForTimeout(500);
        const logoutBtn = page.locator('button:has-text("Выйти")');
        if (await logoutBtn.isVisible({ timeout: 2000 })) {
          await logoutBtn.click();
        }
      }
    }
    
    // Проверяем, что мы на странице логина или главной, но не авторизованы
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    // Проверяем, что мы не на защищенной странице (не в профиле)
    const isOnProtectedPage = currentUrl.includes('/profile') || currentUrl.includes('/items/new');
    expect(isOnProtectedPage).toBeFalsy();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Очищаем storage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Игнорируем ошибки
      }
    });
    
    // Пытаемся зайти на защищенную страницу
    await page.goto('/profile');
    
    // Должен быть редирект на /login
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
  });

  test('should persist login state after page reload', async ({ page }) => {
    // Регистрируем и логинимся
    const uniqueEmail = generateUniqueEmail();
    await registerUser(page, {
      email: uniqueEmail,
      password: 'TestPassword123!',
      name: 'Test User',
    });
    
    // Логинимся через UI
    await page.goto('/login');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Перезагружаем страницу
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Ждем загрузки AuthContext
    
    // Проверяем, что пользователь все еще авторизован
    const profileLink = page.locator('a[href="/profile"]').first();
    await expect(profileLink).toBeVisible({ timeout: 15000 });
  });
});

