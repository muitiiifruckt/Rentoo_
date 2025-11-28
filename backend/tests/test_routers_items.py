"""Tests for items routes."""
import pytest


@pytest.fixture
def auth_token(client, test_db):
    """Get authentication token."""
    # Register and login
    client.post(
        "/api/auth/register",
        json={
            "email": "owner@example.com",
            "password": "password123",
            "name": "Owner"
        }
    )
    
    response = client.post(
        "/api/auth/login",
        json={
            "email": "owner@example.com",
            "password": "password123"
        }
    )
    
    return response.json()["access_token"]


def test_create_item(client, auth_token):
    """Test creating item."""
    response = client.post(
        "/api/items",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "title": "Test Camera",
            "description": "Professional camera",
            "category": "electronics",
            "price_per_day": 500.0,
            "price_per_week": 3000.0,
            "location": {"address": "Moscow"},
            "parameters": {"weight": "2kg"}
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Camera"
    assert data["price_per_day"] == 500.0
    assert "owner_id" in data


def test_create_item_unauthorized(client):
    """Test creating item without authentication."""
    response = client.post(
        "/api/items",
        json={
            "title": "Test Item",
            "description": "Test",
            "category": "test",
            "price_per_day": 100.0
        }
    )
    
    assert response.status_code == 403


def test_get_items(client, auth_token):
    """Test getting items list."""
    # Create item first
    client.post(
        "/api/items",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "title": "Test Item",
            "description": "Test",
            "category": "electronics",
            "price_per_day": 100.0,
            "status": "active"
        }
    )
    
    response = client.get("/api/items?page=1&limit=10")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_item_by_id(client, auth_token):
    """Test getting item by ID."""
    # Create item first
    create_response = client.post(
        "/api/items",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "title": "Test Item",
            "description": "Test",
            "category": "electronics",
            "price_per_day": 100.0
        }
    )
    
    item_id = create_response.json().get("id") or create_response.json().get("_id")
    
    # Get item
    response = client.get(f"/api/items/{item_id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Item"


def test_update_item(client, auth_token):
    """Test updating item."""
    # Create item first
    create_response = client.post(
        "/api/items",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "title": "Original Title",
            "description": "Test",
            "category": "electronics",
            "price_per_day": 100.0
        }
    )
    
    item_id = create_response.json().get("id") or create_response.json().get("_id")
    
    # Update item
    response = client.put(
        f"/api/items/{item_id}",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "title": "Updated Title",
            "status": "active"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["status"] == "active"


def test_delete_item(client, auth_token):
    """Test deleting item."""
    # Create item first
    create_response = client.post(
        "/api/items",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={
            "title": "To Delete",
            "description": "Test",
            "category": "electronics",
            "price_per_day": 100.0
        }
    )
    
    item_id = create_response.json().get("id") or create_response.json().get("_id")
    
    # Delete item
    response = client.delete(
        f"/api/items/{item_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 204
    
    # Verify item is deleted
    get_response = client.get(f"/api/items/{item_id}")
    assert get_response.status_code == 404

