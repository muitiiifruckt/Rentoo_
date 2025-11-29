import { Page, expect } from '@playwright/test';

/**
 * Утилиты для работы с тестами
 */

export const TEST_USER_1 = {
  email: `test_user_1_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User 1',
};

export const TEST_USER_2 = {
  email: `test_user_2_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User 2',
};

/**
 * Регистрация пользователя через API
 */
export async function registerUser(
  page: Page,
  user: { email: string; password: string; name: string }
): Promise<void> {
  const response = await page.request.post('http://localhost:8000/api/auth/register', {
    data: {
      email: user.email,
      password: user.password,
      name: user.name,
    },
  });
  expect(response.ok()).toBeTruthy();
}

/**
 * Вход пользователя через UI
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Очищаем localStorage перед логином
  await page.evaluate(() => {
    localStorage.clear();
  });
  
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  // Ждем, пока React загрузится и отрендерит форму
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Дополнительная задержка для React
  
  // Проверяем, что мы на странице логина (не перенаправлены)
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    // Если мы не на странице логина, переходим туда снова
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  }
  
  // Ждем появления формы логина
  await page.waitForSelector('input[name="email"]', { timeout: 30000 });
  await page.waitForSelector('input[name="password"]', { timeout: 30000 });
  
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 15000 });
}

/**
 * Вход пользователя через API и сохранение токена
 */
export async function loginUserViaAPI(
  page: Page,
  email: string,
  password: string
): Promise<string> {
  const response = await page.request.post('http://localhost:8000/api/auth/login', {
    data: {
      email,
      password,
    },
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  
  // Переходим на страницу перед сохранением в localStorage
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  
  await page.context().addCookies([
    {
      name: 'access_token',
      value: data.access_token,
      domain: 'localhost',
      path: '/',
    },
  ]);
  // Также сохраняем в localStorage через evaluate
  await page.evaluate((token) => {
    try {
      localStorage.setItem('access_token', token);
    } catch (e) {
      // Игнорируем ошибки
    }
  }, data.access_token);
  return data.access_token;
}

/**
 * Создание товара через API
 */
export async function createItemViaAPI(
  page: Page,
  token: string,
  itemData: {
    title: string;
    description: string;
    category: string;
    price_per_day: number;
    location?: { address: string };
  }
): Promise<any> {
  const response = await page.request.post('http://localhost:8000/api/items', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: itemData,
  });
  expect(response.ok()).toBeTruthy();
  const item = await response.json();
  // Убеждаемся, что у товара есть id (может быть _id или id)
  if (!item.id && item._id) {
    item.id = item._id;
  }
  return item;
}

/**
 * Ожидание загрузки страницы
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Дополнительная задержка для React
}

/**
 * Очистка localStorage
 */
export async function clearStorage(page: Page): Promise<void> {
  // Сначала переходим на страницу, чтобы иметь доступ к localStorage
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Игнорируем ошибки, если localStorage недоступен
      }
    });
  } catch (e) {
    // Если не удалось перейти, просто продолжаем
  }
}

/**
 * Генерация уникального email
 */
export function generateUniqueEmail(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
}

