# Development Guide

## Getting Started

### Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- MariaDB 10.6 or higher
- Redis 6 or higher (optional for development)
- Git

### Development Environment Setup

#### 1. Install Frappe Bench

```bash
# Install bench
pip install frappe-bench

# Initialize bench
bench init frappe-bench --frappe-branch version-14
cd frappe-bench
```

#### 2. Setup Development Site

```bash
# Create development site
bench new-site cap.local

# Set as current site
bench use cap.local
```

#### 3. Get CAP App

```bash
# Clone CAP repository
bench get-app /path/to/cap

# Or from GitHub
bench get-app https://github.com/YOUR_ORG/cap.git

# Install app
bench --site cap.local install-app cap
```

#### 4. Enable Developer Mode

```bash
# Enable developer mode
bench --site cap.local set-config developer_mode 1

# Clear cache
bench --site cap.local clear-cache
```

#### 5. Start Development Server

```bash
# Start all services
bench start
```

Access the application at `http://cap.local:8000`

## Project Structure

```
cap/
├── cap/                    # Main application directory
│   ├── services/          # Service Layer
│   │   ├── base_service.py
│   │   ├── auth_service.py
│   │   └── tenant_service.py
│   ├── repositories/      # Repository Layer
│   │   └── base_repository.py
│   ├── cache/             # Cache Layer
│   │   ├── cache_manager.py
│   │   └── cache_decorators.py
│   ├── observability/     # Observability Layer
│   │   ├── logger.py
│   │   ├── metrics.py
│   │   └── tracer.py
│   ├── tests/             # Test Suite
│   │   ├── unit/
│   │   ├── integration/
│   │   └── api/
│   ├── doctype/           # Frappe DocTypes
│   └── hooks.py           # Frappe hooks
└── docs/                  # Documentation
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-new-feature
```

### 2. Make Changes

Follow the coding standards and architectural patterns.

### 3. Write Tests

```bash
# Create test file
touch cap/tests/unit/test_my_feature.py
```

Write comprehensive tests:

```python
import pytest
from cap.services.my_service import MyService

class TestMyFeature:
    """Test suite for MyFeature."""
    
    def test_basic_functionality(self):
        """Test basic functionality."""
        service = MyService()
        result = service.do_something()
        assert result is not None
```

### 4. Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=cap --cov-report=html
```

### 5. Format Code

```bash
# Format with Black
black cap/

# Sort imports
isort cap/

# Check with flake8
flake8 cap/ --max-line-length=100
```

### 6. Update Documentation

- Update relevant documentation in `docs/`
- Update HANDOFF.md with your changes
- Add docstrings to new code

### 7. Commit Changes

```bash
git add .
git commit -m "feat(feature): add new feature"
```

### 8. Push and Create PR

```bash
git push origin feature/my-new-feature
```

Then create a Pull Request on GitHub.

## Coding Standards

### Python Style Guide

- Follow PEP 8
- Use type hints
- Write docstrings for all public functions/classes
- Maximum line length: 100 characters
- Use meaningful variable names

### Example Service

```python
from typing import Dict, Optional
from cap.services.base_service import BaseService

class MyService(BaseService):
    """My service description.
    
    Responsibilities:
    - Responsibility 1
    - Responsibility 2
    """
    
    def do_something(self, param: str) -> Dict:
        """Do something with param.
        
        Args:
            param: Parameter description
            
        Returns:
            Result dictionary
            
        Raises:
            ValueError: If param is invalid
        """
        # Implementation
        pass
```

## Using Services

### Authentication Service

```python
from cap.services.auth_service import AuthService

auth_service = AuthService()
result = auth_service.authenticate(
    username="user@example.com",
    password="password123"
)
```

### Tenant Service

```python
from cap.services.tenant_service import TenantService

tenant_service = TenantService()
tenant = tenant_service.get_tenant("tenant_name")
```

## Using Cache

### Basic Caching

```python
from cap.cache import CacheManager

cache = CacheManager()

# Set value
cache.set("my_key", {"data": "value"}, ttl=300)

# Get value
value = cache.get("my_key")
```

### Using Decorators

```python
from cap.cache import cached, invalidate_cache

@cached(ttl=600, key_prefix="user")
def get_user_data(user_id: str):
    # Expensive operation
    return expensive_db_query(user_id)

@invalidate_cache("user:*")
def update_user(user_id: str, data: dict):
    # Update user
    pass
```

## Logging

### Structured Logging

```python
from cap.observability import get_logger

logger = get_logger(__name__)

logger.info(
    "User logged in",
    extra={
        "user_id": "user123",
        "ip": "192.168.1.1"
    }
)
```

### With Context

```python
logger = get_logger(__name__)
logger = logger.with_context(request_id="req-123")

logger.info("Processing request")  # Includes request_id
```

## Metrics

### Collecting Metrics

```python
from cap.observability import MetricsCollector

metrics = MetricsCollector()

# Counter
metrics.counter("api.requests", 1, endpoint="/users")

# Gauge
metrics.gauge("active_users", 42)

# Timer
with metrics.timing_context("database.query", table="User"):
    # Query execution
    pass
```

## Tracing

### Distributed Tracing

```python
from cap.observability import Tracer

tracer = Tracer()

with tracer.span("process_payment", user_id="user123"):
    # Payment processing
    
    with tracer.span("validate_card"):
        # Card validation
        pass
    
    with tracer.span("charge_card"):
        # Charge card
        pass
```

## Debugging

### Using iPython

```bash
# Start iPython with Frappe context
bench --site cap.local console
```

```python
# In console
from cap.services.auth_service import AuthService
auth = AuthService()
# Experiment with code
```

### Using Debugger

Add breakpoint in code:

```python
import pdb; pdb.set_trace()
```

Or use VSCode debugger with launch configuration.

## Common Tasks

### Create New DocType

```bash
bench --site cap.local new-doctype "My DocType"
```

### Migrate Database

```bash
bench --site cap.local migrate
```

### Clear Cache

```bash
bench --site cap.local clear-cache
```

### Build Assets

```bash
bench build
```

### Run Console

```bash
bench --site cap.local console
```

## Tips & Tricks

### Fast Reload

Enable auto-reload for faster development:

```bash
bench --site cap.local set-config developer_mode 1
```

### SQL Debugging

Enable SQL query logging:

```python
import frappe
frappe.db.sql_log = True
```

### Performance Profiling

Use cProfile:

```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Your code here

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(20)
```
