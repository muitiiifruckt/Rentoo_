"""Pytest configuration and fixtures."""
import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from app.database import Database, get_database
from app.config import settings
from fastapi.testclient import TestClient
from app.main import app
import os


@pytest.fixture(scope="function")
async def test_db():
    """Create test database connection."""
    # Use test database
    test_db_name = f"{settings.mongodb_db_name}_test"
    test_client = AsyncIOMotorClient(settings.mongodb_url)
    test_database = test_client[test_db_name]
    
    yield test_database
    
    # Cleanup: drop test database after tests
    await test_client.drop_database(test_db_name)
    test_client.close()


@pytest.fixture(scope="function")
def client(test_db):
    """Create test client with database override."""
    from app.database import db
    from app.main import app
    
    # Override database
    original_db = db.database
    db.database = test_db
    
    # Override get_database dependency
    def override_get_database():
        return test_db
    
    app.dependency_overrides[get_database] = override_get_database
    
    # Create test client
    test_client = TestClient(app)
    
    yield test_client
    
    # Restore original database and clear overrides
    db.database = original_db
    app.dependency_overrides.clear()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User"
    }


@pytest.fixture
def sample_item_data():
    """Sample item data for testing."""
    return {
        "title": "Test Item",
        "description": "Test description",
        "category": "electronics",
        "price_per_day": 100.0,
        "price_per_week": 600.0,
        "price_per_month": 2000.0,
        "location": {
            "address": "Test Street 1",
            "lat": 55.7558,
            "lng": 37.6173
        },
        "parameters": {
            "weight": "5kg",
            "size": "medium"
        },
        "images": [],
        "status": "active"
    }


@pytest.fixture
def sample_rental_data():
    """Sample rental data for testing."""
    from datetime import date, timedelta
    return {
        "start_date": date.today() + timedelta(days=1),
        "end_date": date.today() + timedelta(days=3),
    }


@pytest.fixture
def sample_category_data():
    """Sample category data for testing."""
    return {
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices"
    }

