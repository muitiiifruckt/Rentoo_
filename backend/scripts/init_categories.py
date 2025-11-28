"""Script to initialize categories in the database."""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.crud.categories import create_category, get_all_categories


async def init_categories():
    """Initialize default categories."""
    await connect_to_mongo()
    database = get_database()
    
    # Check if categories already exist
    existing = await get_all_categories(database)
    if existing:
        print(f"Found {len(existing)} existing categories:")
        for cat in existing:
            print(f"  - {cat['name']} ({cat['slug']})")
        print("\nCategories already exist. Skipping initialization.")
        await close_mongo_connection()
        return
    
    # Default categories
    default_categories = [
        {
            "name": "Электроника",
            "slug": "electronics",
            "description": "Смартфоны, планшеты, ноутбуки, фотоаппараты и другая электроника"
        },
        {
            "name": "Спорт и отдых",
            "slug": "sports",
            "description": "Велосипеды, спортивный инвентарь, туристическое снаряжение"
        },
        {
            "name": "Инструменты",
            "slug": "tools",
            "description": "Ручной и электроинструмент, строительное оборудование"
        },
        {
            "name": "Бытовая техника",
            "slug": "appliances",
            "description": "Холодильники, стиральные машины, пылесосы и другая техника"
        },
        {
            "name": "Одежда и аксессуары",
            "slug": "clothing",
            "description": "Одежда, обувь, сумки, аксессуары"
        },
        {
            "name": "Мебель",
            "slug": "furniture",
            "description": "Столы, стулья, диваны, шкафы и другая мебель"
        },
        {
            "name": "Транспорт",
            "slug": "transport",
            "description": "Автомобили, мотоциклы, самокаты, велосипеды"
        },
        {
            "name": "Другое",
            "slug": "other",
            "description": "Прочие товары"
        },
    ]
    
    print("Creating default categories...")
    created = []
    for cat_data in default_categories:
        try:
            category = await create_category(
                database,
                cat_data["name"],
                cat_data["slug"],
                cat_data["description"]
            )
            created.append(category)
            print(f"  ✓ Created: {cat_data['name']} ({cat_data['slug']})")
        except Exception as e:
            print(f"  ✗ Failed to create {cat_data['name']}: {e}")
    
    print(f"\nSuccessfully created {len(created)} categories!")
    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(init_categories())

