# API Documentation

## Overview

CAP provides a comprehensive REST API built on Frappe Framework.

## Base URL

```
http://your-site.local/api
```

## Authentication

All API requests require authentication using one of the following methods:

### 1. Token Authentication

```bash
curl -H "Authorization: token YOUR_API_KEY:YOUR_API_SECRET" \
     https://your-site.local/api/resource/User
```

### 2. Session Authentication

```bash
curl -H "Cookie: sid=YOUR_SESSION_ID" \
     https://your-site.local/api/resource/User
```

## API Endpoints

### Authentication

#### Login

```http
POST /api/method/cap.services.auth_service.login
```

**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "password123",
  "mfa_code": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "session": {
    "token": "session_token_here",
    "expires_at": "2025-10-23T05:27:37Z"
  },
  "user": {
    "username": "user@example.com",
    "full_name": "John Doe",
    "roles": ["Tenant Admin"]
  }
}
```

### Tenant Management

#### Create Tenant

```http
POST /api/method/cap.services.tenant_service.create_tenant
```

**Request Body**:
```json
{
  "name": "tenant_alpha",
  "display_name": "Alpha Corporation",
  "domain": "alpha.example.com",
  "admin_email": "admin@alpha.com",
  "plan": "enterprise"
}
```

#### Get Tenant

```http
GET /api/method/cap.services.tenant_service.get_tenant?tenant_name=tenant_alpha
```

#### List Tenants

```http
GET /api/resource/Tenant
```

### Evidence Management

#### Upload Evidence

```http
POST /api/method/cap.services.evidence_service.upload_evidence
```

#### Get Evidence

```http
GET /api/resource/Evidence/{evidence_id}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid credentials",
    "details": {
      "field": "password"
    }
  }
}
```

### HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Header**: `X-RateLimit-Remaining`
- **Reset**: `X-RateLimit-Reset`

## Pagination

```http
GET /api/resource/Tenant?limit=20&offset=0
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

## Filtering

```http
GET /api/resource/Tenant?filters=[["status","=","Active"]]
```

## Sorting

```http
GET /api/resource/Tenant?order_by=creation desc
```

## Field Selection

```http
GET /api/resource/Tenant?fields=["name","tenant_name","status"]
```
