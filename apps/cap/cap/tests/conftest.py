"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

Test module: conftest.py
"""
import pytest
import frappe
from unittest.mock import Mock, MagicMock
    from cap.cache import CacheManager
"""Pytest Configuration and Fixtures

Shared test fixtures and configuration.
"""



@pytest.fixture(scope="session")
def frappe_site():
    """Setup Frappe site for testing."""
    # This would typically initialize a test site
    # For now, it's a placeholder
    yield "test_site"


@pytest.fixture
def test_user():
    """Create a test user."""
    user_data = {
        "email": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "username": "testuser"
    }
    yield user_data


@pytest.fixture
def test_tenant():
    """Create a test tenant."""
    tenant_data = {
        "name": "test_tenant",
        "display_name": "Test Tenant",
        "domain": "test.example.com",
        "admin_email": "admin@test.example.com",
        "plan": "basic"
    }
    yield tenant_data


@pytest.fixture
def mock_frappe():
    """Mock Frappe framework."""
    mock = MagicMock()
    mock.db = MagicMock()
    mock.cache = MagicMock()
    mock.session = MagicMock()
    mock.local = MagicMock()
    yield mock


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    mock = MagicMock()
    mock.get = MagicMock(return_value=None)
    mock.set = MagicMock(return_value=True)
    mock.delete = MagicMock(return_value=1)
    yield mock


@pytest.fixture(autouse=True)
def reset_cache():
    """Reset cache between tests."""
    cache = CacheManager()
    yield
    # Cleanup after test
    try:
        cache.flush()
    except:
        pass
