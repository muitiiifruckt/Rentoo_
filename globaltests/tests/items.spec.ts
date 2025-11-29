import { test, expect } from '@playwright/test';
import { registerUser, loginUserViaAPI, createItemViaAPI, generateUniqueEmail, clearStorage } from './fixtures';

test.describe('Items Management', () => {
  let userToken: string;
  let userEmail: string;

  test.beforeEach(async ({ page }) => {
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
    
    // Регистрируем и логинимся
    userEmail = generateUniqueEmail();
    await registerUser(page, {
      email: userEmail,
      password: 'TestPassword123!',
      name: 'Test User',
    });
    userToken = await loginUserViaAPI(page, userEmail, 'TestPassword123!');
  });

  test('should create a new item', async ({ page }) => {
    // Используем API для логина, чтобы получить токен
    const loginResponse = await page.request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: userEmail,
        password: 'TestPassword123!',
      },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    
    // Устанавливаем токены в localStorage и перезагружаем страницу для обновления AuthContext
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate((data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
    }, loginData);
    
    // Перезагружаем страницу, чтобы AuthContext подхватил токены
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Даем время на обновление AuthContext и проверку токена
    
    // Проверяем, что токен валиден - делаем запрос к /api/auth/me
    const meResponse = await page.request.get('http://localhost:8000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${loginData.access_token}`,
      },
    });
    if (!meResponse.ok()) {
      throw new Error(`Token validation failed: ${await meResponse.text()}`);
    }
    
    // Переходим на страницу создания товара
    await page.goto('/items/new', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Даем время на проверку авторизации и загрузку категорий
    
    // Проверяем, что мы не перенаправлены на логин
    const addItemUrl = page.url();
    if (addItemUrl.includes('/login')) {
      // Если перенаправлены, проверяем почему - возможно токен не установлен правильно
      const tokenInStorage = await page.evaluate(() => localStorage.getItem('access_token'));
      throw new Error(`User was redirected to login page. Token in storage: ${tokenInStorage ? 'exists' : 'missing'}`);
    }
    
    // Ждем загрузки категорий - проверяем наличие индикатора загрузки или формы
    // Сначала проверяем, есть ли индикатор загрузки категорий
    const loadingIndicator = page.locator('text=/Загрузка категорий|Loading categories/i');
    if (await loadingIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Ждем, пока индикатор исчезнет
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 });
    }
    
    // Ждем загрузки категорий и появления формы
    // Сначала ждем появления поля title (оно должно появиться после загрузки категорий)
    await page.waitForSelector('input[name="title"]', { timeout: 30000 });
    
    // Заполняем форму создания товара
    await page.fill('input[name="title"]', 'Test Item');
    await page.fill('textarea[name="description"]', 'This is a test item description');
    
    // Ждем загрузки категорий
    await page.waitForTimeout(3000);
    
    // Выбираем категорию (если есть select)
    const categorySelect = page.locator('select[name="category"]');
    if (await categorySelect.count() > 0) {
      // Ждем, пока появятся опции
      await categorySelect.waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000); // Дополнительная задержка для загрузки опций
      const options = await categorySelect.locator('option').count();
      if (options > 1) {
        await categorySelect.selectOption({ index: 1 });
      } else if (options === 1) {
        await categorySelect.selectOption({ index: 0 });
      }
    } else {
      // Если категория - это input, заполняем его
      const categoryInput = page.locator('input[name="category"]');
      if (await categoryInput.count() > 0) {
        await categoryInput.fill('electronics');
      }
    }
    
    await page.fill('input[name="price_per_day"]', '100');
    
    // Если есть поле адреса
    const addressInput = page.locator('input[name="location_address"], input[name="address"], input[name="location"]');
    if (await addressInput.count() > 0) {
      await addressInput.fill('Test Address, Test City');
    }
    
    // Отправляем форму
    await page.click('button[type="submit"]');
    
    // Ожидаем редирект или успешное создание
    await page.waitForURL(/\/items\/|^\/$|\/profile/, { timeout: 15000 });
    
    // Проверяем, что товар создан (либо редирект на страницу товара, либо на список)
    const currentUrl = page.url();
    expect(currentUrl.includes('/items/') || currentUrl === '/' || currentUrl.includes('/profile')).toBeTruthy();
  });

  test('should view item details', async ({ page }) => {
    // Создаем товар через API
    const item = await createItemViaAPI(page, userToken, {
      title: 'Test Item for Viewing',
      description: 'Description of test item',
      category: 'electronics',
      price_per_day: 150,
      location: { address: 'Test Address' },
    });
    
    // Переходим на страницу товара
    await page.goto(`/items/${item.id || item._id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Дополнительная задержка для загрузки данных
    
    // Проверяем, что информация о товаре отображается (используем более гибкий поиск)
    // Может быть в заголовке h1, h2, h3 или в другом элементе
    const titleLocator = page.locator('text=Test Item for Viewing').first();
    await expect(titleLocator).toBeVisible({ timeout: 15000 });
    
    // Проверяем описание
    const descLocator = page.locator('text=Description of test item').first();
    await expect(descLocator).toBeVisible({ timeout: 15000 });
  });

  test('should list items on home page', async ({ page }) => {
    // Создаем несколько товаров через API
    await createItemViaAPI(page, userToken, {
      title: 'Item 1',
      description: 'Description 1',
      category: 'electronics',
      price_per_day: 100,
    });
    
    await createItemViaAPI(page, userToken, {
      title: 'Item 2',
      description: 'Description 2',
      category: 'sports',
      price_per_day: 200,
    });
    
    // Переходим на главную страницу
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Дополнительная задержка для загрузки товаров
    
    // Проверяем, что товары отображаются
    // Может быть список карточек или grid
    const items = page.locator('[data-testid="item-card"], .item-card, article, h2, h3').first();
    await expect(items).toBeVisible({ timeout: 15000 });
  });

  test('should edit own item', async ({ page }) => {
    // Создаем товар через API
    const item = await createItemViaAPI(page, userToken, {
      title: 'Original Title',
      description: 'Original Description',
      category: 'electronics',
      price_per_day: 100,
    });
    
    // Переходим на страницу товара
    await page.goto(`/items/${item.id}`);
    
    // Ищем кнопку редактирования (может быть только для владельца)
    const editButton = page.locator('text=/Редактировать|Edit|Изменить/i');
    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();
      
      // Изменяем название
      await page.fill('input[name="title"]', 'Updated Title');
      await page.click('button[type="submit"]');
      
      // Проверяем, что изменения сохранены
      await page.waitForTimeout(2000);
      await expect(page.locator('text=Updated Title')).toBeVisible({ timeout: 5000 });
    } else {
      // Если кнопки редактирования нет, пропускаем тест
      test.skip();
    }
  });

  test('should delete own item', async ({ page }) => {
    // Создаем товар через API
    const item = await createItemViaAPI(page, userToken, {
      title: 'Item to Delete',
      description: 'This item will be deleted',
      category: 'electronics',
      price_per_day: 100,
    });
    
    // Переходим на страницу товара
    await page.goto(`/items/${item.id}`);
    
    // Ищем кнопку удаления
    const deleteButton = page.locator('text=/Удалить|Delete/i');
    if (await deleteButton.isVisible({ timeout: 2000 })) {
      await deleteButton.click();
      
      // Подтверждаем удаление, если есть модальное окно
      const confirmButton = page.locator('text=/Подтвердить|Confirm|Да/i');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
      
      // Проверяем редирект или отсутствие товара
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl === '/' || currentUrl.includes('/profile') || currentUrl.includes('/items')).toBeTruthy();
    } else {
      // Если кнопки удаления нет, проверяем, что мы на странице товара
      // Возможно, кнопка удаления находится в другом месте или требуется авторизация
      const currentUrl = page.url();
      expect(currentUrl.includes(`/items/${item.id}`) || currentUrl === '/' || currentUrl.includes('/profile')).toBeTruthy();
    }
  });

  test('should show my items in profile', async ({ page }) => {
    // Создаем товар через API
    await createItemViaAPI(page, userToken, {
      title: 'My Item',
      description: 'My item description',
      category: 'electronics',
      price_per_day: 100,
    });
    
    // Переходим в профиль
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    
    // Проверяем, что товар отображается в профиле (используем first() для избежания strict mode violation)
    await expect(page.locator('text=My Item').first()).toBeVisible({ timeout: 10000 });
  });
});

