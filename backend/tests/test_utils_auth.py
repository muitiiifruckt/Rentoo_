"""Tests for authentication utilities."""
import pytest
from app.utils.auth import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token
)
from datetime import timedelta


def test_get_password_hash():
    """Test password hashing."""
    password = "testpassword123"
    hash1 = get_password_hash(password)
    hash2 = get_password_hash(password)
    
    # Hashes should be different (different salt)
    assert hash1 != hash2
    assert len(hash1) > 0
    assert hash1.startswith("$2b$")  # bcrypt format


def test_verify_password():
    """Test password verification."""
    password = "testpassword123"
    password_hash = get_password_hash(password)
    
    # Correct password
    assert verify_password(password, password_hash) is True
    
    # Incorrect password
    assert verify_password("wrongpassword", password_hash) is False


def test_create_access_token():
    """Test access token creation."""
    data = {"sub": "user123"}
    token = create_access_token(data)
    
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_access_token_with_expires_delta():
    """Test access token creation with custom expiration."""
    data = {"sub": "user123"}
    expires_delta = timedelta(minutes=60)
    token = create_access_token(data, expires_delta)
    
    assert token is not None
    
    # Decode and check expiration
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user123"
    assert "exp" in payload


def test_create_refresh_token():
    """Test refresh token creation."""
    data = {"sub": "user123"}
    token = create_refresh_token(data)
    
    assert token is not None
    assert isinstance(token, str)
    
    # Decode and check
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user123"
    assert payload.get("type") == "refresh"
    assert "exp" in payload


def test_decode_token():
    """Test token decoding."""
    data = {"sub": "user123", "role": "user"}
    token = create_access_token(data)
    
    payload = decode_token(token)
    
    assert payload is not None
    assert payload["sub"] == "user123"
    assert payload["role"] == "user"
    assert "exp" in payload


def test_decode_token_invalid():
    """Test decoding invalid token."""
    invalid_token = "invalid.token.here"
    payload = decode_token(invalid_token)
    
    assert payload is None


def test_decode_token_expired():
    """Test decoding expired token."""
    from datetime import datetime, timedelta
    from jose import jwt  # Using jose library (python-jose)
    from app.config import settings
    
    # Create expired token manually
    data = {"sub": "user123", "exp": datetime.utcnow() - timedelta(hours=1)}
    expired_token = jwt.encode(data, settings.secret_key, algorithm=settings.algorithm)
    
    payload = decode_token(expired_token)
    
    # Should return None for expired token
    assert payload is None


