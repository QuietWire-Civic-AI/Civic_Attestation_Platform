# Architecture Documentation

## Overview

The Civic AI Canon Platform (CAP) follows a layered architecture pattern with clear separation of concerns.

## Architecture Layers

### 1. API Layer

**Location**: `cap/api/`

**Responsibilities**:
- HTTP request/response handling
- Input validation
- Authentication/authorization
- Rate limiting
- API versioning

**Technologies**:
- Frappe REST API
- GraphQL (optional)
- WebSocket for real-time features

### 2. Service Layer

**Location**: `cap/services/`

**Responsibilities**:
- Business logic implementation
- Workflow orchestration
- Data validation
- Business rule enforcement

**Key Services**:
- `AuthService`: Authentication and authorization
- `TenantService`: Tenant management
- `EvidenceService`: Evidence handling
- `ComplianceService`: Compliance checking

### 3. Repository Layer

**Location**: `cap/repositories/`

**Responsibilities**:
- Data access abstraction
- Database operations
- Query optimization
- Data transformation

### 4. Cache Layer

**Location**: `cap/cache/`

**Responsibilities**:
- Performance optimization
- Reduce database load
- Session storage
- Temporary data storage

**Implementation**:
- Primary: Frappe cache
- Optional: Redis for production
- Multi-level caching strategy

### 5. Observability Layer

**Location**: `cap/observability/`

**Responsibilities**:
- Structured logging
- Metrics collection
- Distributed tracing
- Performance monitoring

**Components**:
- **Logger**: JSON/human-readable logging
- **Metrics**: Application metrics
- **Tracer**: Request tracing

## Architecture Patterns

### Dependency Injection

Services and repositories use dependency injection for loose coupling:

```python
class AuthService(BaseService):
    def __init__(self):
        super().__init__()
        # Dependencies injected through base class
```

### Repository Pattern

Data access is abstracted through repositories:

```python
repo = TenantRepository()
tenant = repo.find_by_name("tenant_name")
```

### Service Layer Pattern

Business logic is centralized in services:

```python
auth_service = AuthService()
result = auth_service.authenticate(username, password)
```

### Cache-Aside Pattern

Caching strategy follows cache-aside pattern:

```python
# Try cache first
cached = cache.get(key)
if cached:
    return cached

# Fetch from database
data = db.get(key)

# Store in cache
cache.set(key, data, ttl=300)
```

## Multi-Tenancy Architecture

### Tenant Isolation

- **Row-Level Security (RLS)**: Each record tagged with tenant ID
- **Data Filtering**: All queries filtered by tenant
- **Permission Checks**: Tenant isolation enforced at service layer

### Tenant Data Flow

```
Request → Auth → Tenant Detection → Permission Check → Data Access → Response
```

## Security Architecture

### Authentication Flow

1. User submits credentials
2. AuthService validates credentials
3. MFA check (if enabled)
4. Session token generated
5. Token stored in cache
6. Token returned to client

### Authorization Flow

1. Request with token
2. Token validated from cache
3. User roles retrieved
4. Permission checked against RBAC
5. Tenant isolation enforced
6. Access granted/denied

## Scalability Considerations

### Horizontal Scaling

- Stateless services
- Shared cache (Redis)
- Database connection pooling
- Load balancer ready

### Async Processing

- Long-running tasks use Frappe queues
- Background job processing
- Email notifications async
- Report generation async

### Caching Strategy

- **L1 Cache**: In-memory (per process)
- **L2 Cache**: Frappe cache (shared)
- **L3 Cache**: Redis (distributed)

## Performance Optimization

### Database Optimization

- Proper indexing on DocTypes
- Query optimization
- Connection pooling
- Read replicas support

### Caching Strategy

- Frequently accessed data cached
- TTL-based expiration
- Cache warming on startup
- Intelligent cache invalidation

### Async Processing

- Heavy operations queued
- Non-blocking I/O
- Parallel processing where applicable

## Monitoring & Observability

### Logging

- Structured JSON logs in production
- Human-readable logs in development
- Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Contextual logging with request IDs

### Metrics

- Request counts and durations
- Cache hit/miss rates
- Database query performance
- Error rates

### Tracing

- Distributed tracing across services
- Request flow visualization
- Performance bottleneck identification

## Technology Stack

### Backend

- **Framework**: Frappe 14+
- **Language**: Python 3.9+
- **Database**: MariaDB 10.6+
- **Cache**: Redis 6+ (optional)
- **Queue**: Frappe Queue (Redis-based)

### Testing

- **Framework**: pytest
- **Coverage**: pytest-cov
- **Mocking**: unittest.mock

### CI/CD

- **CI**: GitHub Actions
- **Testing**: Automated test suite
- **Linting**: flake8, black, isort
- **Security**: bandit, safety

## Future Enhancements

- **Microservices**: Split into smaller services if needed
- **Event Sourcing**: For audit trail and history
- **CQRS**: Separate read/write models
- **GraphQL**: Alternative to REST API
- **gRPC**: For inter-service communication
