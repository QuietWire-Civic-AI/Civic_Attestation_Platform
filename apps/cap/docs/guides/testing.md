# Testing Guide

## Overview

CAP uses a comprehensive testing strategy with unit tests, integration tests, and API tests.

## Testing Framework

- **Framework**: pytest
- **Coverage**: pytest-cov
- **Mocking**: unittest.mock

## Test Structure

```
cap/tests/
├── __init__.py
├── conftest.py          # Shared fixtures
├── unit/                # Unit tests
│   ├── test_cache_manager.py
│   ├── test_base_service.py
│   └── ...
├── integration/         # Integration tests
│   ├── test_auth_flow.py
│   └── ...
└── api/                 # API tests
    ├── test_auth_api.py
    └── ...
```

## Running Tests

### All Tests

```bash
pytest
```

### Specific Test File

```bash
pytest cap/tests/unit/test_cache_manager.py
```

### Specific Test

```bash
pytest cap/tests/unit/test_cache_manager.py::TestCacheManager::test_set_and_get
```

### With Coverage

```bash
pytest --cov=cap --cov-report=html
```

### Parallel Execution

```bash
pytest -n auto
```

### Verbose Output

```bash
pytest -v
```

## Writing Unit Tests

### Test Class Structure

```python
import pytest
from cap.services.my_service import MyService

class TestMyService:
    """Test suite for MyService."""
    
    def test_basic_operation(self):
        """Test basic operation."""
        # Arrange
        service = MyService()
        expected = "result"
        
        # Act
        result = service.do_something()
        
        # Assert
        assert result == expected
```

### Using Fixtures

```python
import pytest

@pytest.fixture
def sample_user():
    """Provide sample user data."""
    return {
        "email": "test@example.com",
        "name": "Test User"
    }

def test_with_fixture(sample_user):
    """Test using fixture."""
    assert sample_user["email"] == "test@example.com"
```

### Mocking

```python
from unittest.mock import Mock, patch, MagicMock

def test_with_mock():
    """Test with mock."""
    service = MyService()
    service.external_api = Mock(return_value="mocked")
    
    result = service.call_external()
    
    assert result == "mocked"
    service.external_api.assert_called_once()
```

### Patching

```python
@patch('cap.services.my_service.external_function')
def test_with_patch(mock_function):
    """Test with patch."""
    mock_function.return_value = "patched"
    
    service = MyService()
    result = service.use_external()
    
    assert result == "patched"
```

## Integration Tests

### Testing Service Integration

```python
class TestAuthIntegration:
    """Integration tests for authentication flow."""
    
    def test_complete_auth_flow(self):
        """Test complete authentication flow."""
        # Create user
        user_service = UserService()
        user = user_service.create_user(...)
        
        # Authenticate
        auth_service = AuthService()
        session = auth_service.authenticate(...)
        
        # Validate session
        assert session["success"] is True
        assert auth_service.validate_session(session["token"])
```

## API Tests

### Testing REST Endpoints

```python
import requests

class TestAuthAPI:
    """API tests for authentication endpoints."""
    
    BASE_URL = "http://cap.local:8000/api"
    
    def test_login_endpoint(self):
        """Test login API endpoint."""
        response = requests.post(
            f"{self.BASE_URL}/method/cap.api.auth.login",
            json={
                "username": "test@example.com",
                "password": "password123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "session" in data
```

## Test Coverage

### Viewing Coverage

```bash
# Generate HTML coverage report
pytest --cov=cap --cov-report=html

# Open report
open htmlcov/index.html
```

### Coverage Goals

- **Minimum**: 70% overall coverage
- **Target**: 80%+ overall coverage
- **Critical paths**: 90%+ coverage

## Best Practices

### 1. AAA Pattern

Arrange - Act - Assert:

```python
def test_example():
    # Arrange
    service = MyService()
    data = {"key": "value"}
    
    # Act
    result = service.process(data)
    
    # Assert
    assert result["status"] == "success"
```

### 2. One Assertion Per Test

Prefer focused tests:

```python
# Good
def test_returns_correct_status():
    assert result["status"] == "success"

def test_returns_correct_data():
    assert result["data"] is not None

# Avoid
def test_everything():
    assert result["status"] == "success"
    assert result["data"] is not None
    assert result["timestamp"] > 0
```

### 3. Test Naming

Use descriptive names:

```python
def test_authentication_fails_with_invalid_password():
    pass

def test_cache_returns_none_for_expired_key():
    pass
```

### 4. Use Fixtures

Reuse setup code:

```python
@pytest.fixture
def authenticated_user():
    user = create_test_user()
    session = authenticate(user)
    yield user, session
    cleanup_user(user)
```

### 5. Test Edge Cases

```python
def test_with_empty_input():
    assert service.process("") is None

def test_with_none_input():
    assert service.process(None) is None

def test_with_large_input():
    large_data = "x" * 1000000
    result = service.process(large_data)
    assert result is not None
```

## Continuous Integration

Tests run automatically on:

- Every push to `main` or `develop`
- Every pull request
- Nightly builds

See `.github/workflows/tests.yml` for configuration.

## Troubleshooting

### Test Failures

```bash
# Run with verbose output
pytest -v

# Show print statements
pytest -s

# Stop on first failure
pytest -x

# Run last failed tests
pytest --lf
```

### Debugging Tests

```python
import pdb

def test_with_debugging():
    pdb.set_trace()  # Breakpoint
    result = service.do_something()
    assert result is not None
```

### Slow Tests

```bash
# Show slowest tests
pytest --durations=10
```
