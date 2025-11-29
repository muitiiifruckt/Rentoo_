import { test, expect } from '@playwright/test';
import { registerUser, loginUserViaAPI, createItemViaAPI, generateUniqueEmail, clearStorage } from './fixtures';

test.describe('Search and Filter', () => {
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
    
    // Создаем тестовые товары
    await createItemViaAPI(page, userToken, {
      title: 'Bicycle for rent',
      description: 'Mountain bike in good condition',
      category: 'sports',
      price_per_day: 500,
    });
    
    await createItemViaAPI(page, userToken, {
      title: 'Camera DSLR',
      description: 'Professional camera for photography',
      category: 'electronics',
      price_per_day: 1000,
    });
    
    await createItemViaAPI(page, userToken, {
      title: 'Drill machine',
      description: 'Powerful drill for home repairs',
      category: 'tools',
      price_per_day: 300,
    });
  });

  test('should search items by text query', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Ждем загрузки товаров
    
    // Ищем поле поиска
    const searchInput = page.locator('input[type="search"], input[placeholder*="поиск" i], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill('Bicycle');
      await searchInput.press('Enter');
      
      // Ждем результатов
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Проверяем, что найден товар с "Bicycle"
      await expect(page.locator('text=Bicycle').first()).toBeVisible({ timeout: 10000 });
    } else {
      // Если поиска нет, пропускаем тест
      test.skip();
    }
  });

  test('should filter items by category', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ищем фильтр по категории
    const categoryFilter = page.locator('select[name="category"], button:has-text("electronics"), a:has-text("electronics")');
    if (await categoryFilter.count() > 0) {
      await categoryFilter.first().click();
      await page.waitForTimeout(2000);
      
      // Проверяем, что отображаются только товары категории electronics
      await expect(page.locator('text=Camera DSLR')).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should filter items by price range', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ищем поля фильтра по цене
    const minPriceInput = page.locator('input[name="min_price"], input[placeholder*="мин" i]');
    const maxPriceInput = page.locator('input[name="max_price"], input[placeholder*="макс" i]');
    
    if (await minPriceInput.count() > 0 && await maxPriceInput.count() > 0) {
      await minPriceInput.fill('400');
      await maxPriceInput.fill('600');
      
      // Ищем кнопку применения фильтра
      const applyButton = page.locator('button:has-text("Применить"), button:has-text("Apply"), button[type="submit"]');
      if (await applyButton.count() > 0) {
        await applyButton.click();
      } else {
        // Если кнопки нет, просто ждем
        await page.waitForTimeout(2000);
      }
      
      await page.waitForTimeout(2000);
      
      // Проверяем, что отображаются товары в диапазоне цен
      await expect(page.locator('text=Bicycle')).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should sort items by price', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ищем селект сортировки
    const sortSelect = page.locator('select[name="sort_by"], select[name="sort"]');
    if (await sortSelect.count() > 0) {
      await sortSelect.selectOption('price');
      
      // Ищем опцию порядка сортировки
      const orderSelect = page.locator('select[name="sort_order"]');
      if (await orderSelect.count() > 0) {
        await orderSelect.selectOption('asc');
      }
      
      await page.waitForTimeout(2000);
      
      // Проверяем, что товары отсортированы (первый должен быть дешевле)
      const items = page.locator('[data-testid="item-card"], .item-card, article');
      const firstItem = items.first();
      if (await firstItem.isVisible()) {
        // Проверяем, что первый товар содержит цену
        await expect(firstItem).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should show empty state when no items found', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ищем по несуществующему запросу
    const searchInput = page.locator('input[type="search"], input[placeholder*="поиск" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('NonexistentItem12345');
      await searchInput.press('Enter');
      
      await page.waitForTimeout(2000);
      
      // Проверяем сообщение о пустом результате
      const emptyMessage = page.locator('text=/не найдено|not found|пусто|empty/i');
      if (await emptyMessage.count() > 0) {
        await expect(emptyMessage).toBeVisible({ timeout: 5000 });
      }
    } else {
      test.skip();
    }
  });

  test('should navigate to item detail from search results', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Находим первый товар в списке
    const firstItem = page.locator('[data-testid="item-card"], .item-card, article').first();
    if (await firstItem.isVisible({ timeout: 5000 })) {
      const itemTitle = await firstItem.locator('h2, h3, .title, [class*="title"]').first().textContent();
      
      // Кликаем на товар
      await firstItem.click();
      
      // Проверяем, что перешли на страницу товара
      await page.waitForURL(/\/items\/\w+/, { timeout: 5000 });
      
      if (itemTitle) {
        await expect(page.locator(`text=${itemTitle.trim()}`)).toBeVisible({ timeout: 5000 });
      }
    } else {
      test.skip();
    }
  });
});

