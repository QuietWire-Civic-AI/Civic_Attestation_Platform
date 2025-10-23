# Civic AI Canon Platform (CAP) - Developer Guide

**Version:** 1.0.0  
**Last Updated:** October 23, 2025  
**Platform:** Civic AI Canon Platform (CAP)  
**Framework:** Frappe 15.x / ERPNext  
**Author:** Ashraf Al-hajj & Raasid

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Development Environment Setup](#2-development-environment-setup)
3. [Project Structure](#3-project-structure)
4. [Core Concepts](#4-core-concepts)
5. [DocType Development](#5-doctype-development)
6. [Business Logic Layer](#6-business-logic-layer)
7. [API Development](#7-api-development)
8. [Frontend Development](#8-frontend-development)
9. [Testing](#9-testing)
10. [Deployment](#10-deployment)
11. [Best Practices](#11-best-practices)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  (Web Browser - React/Vue Components + Frappe Desk)        │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
┌──────────────────────▼──────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Frappe     │  │   Services   │  │  Controllers │      │
│  │  Framework  │  │    Layer     │  │   (DocType)  │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Observability│  │    Cache     │  │ Repositories │      │
│  │   (Logs)    │  │   Manager    │  │    Layer     │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    DATA LAYER                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MariaDB   │  │    Redis     │  │  File Store  │      │
│  │  (Primary)  │  │   (Cache)    │  │  (S3/Local)  │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   OpenAI    │  │   Anthropic  │  │    Azure     │      │
│  │     API     │  │     API      │  │   OpenAI     │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    SMTP     │  │     Slack    │  │   MS Teams   │      │
│  │   (Email)   │  │   Webhooks   │  │   Webhooks   │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Layered Architecture

**CAP follows a clean layered architecture:**

1. **Presentation Layer (Client)**
   - Frappe Desk (built-in admin interface)
   - Custom web pages (HTML/JS/CSS)
   - REST API consumers

2. **API Layer**
   - Whitelisted methods (`@frappe.whitelist()`)
   - RESTful endpoints
   - Authentication & authorization

3. **Business Logic Layer**
   - **Services** - Business logic, orchestration
   - **Controllers** - DocType lifecycle hooks
   - **Utilities** - Helper functions

4. **Data Access Layer**
   - **Repositories** - Database abstraction
   - **ORM** - Frappe ORM for database queries
   - **Cache** - Redis/Frappe cache

5. **Infrastructure Layer**
   - **Observability** - Logging, metrics, tracing
   - **Cache Manager** - Caching strategy
   - **Queue** - Background jobs (RQ)

### 1.3 Technology Stack

| Component | Technology | Version |
|-----------|-----------|----------|
| **Backend** | Python | 3.9+ |
| **Framework** | Frappe | 15.x |
| **Database** | MariaDB | 10.6+ |
| **Cache** | Redis | 6.x+ |
| **Queue** | RQ (Redis Queue) | 1.x |
| **Web Server** | Nginx | 1.18+ |
| **App Server** | Gunicorn | 20.x |
| **Frontend** | JavaScript (ES6+) | - |
| **UI Framework** | Frappe UI | Built-in |
| **Testing** | pytest | 7.x+ |
| **Package Manager** | pip / uv | - |

### 1.4 Multi-Tenant Architecture

**Tenant Isolation Strategy:**

```python
# Every DocType has a tenant field
# Automatic filtering via hooks

doc_events = {
    "*": {
        "before_save": "cap.utils.tenant.auto_set_tenant",
        "before_insert": "cap.utils.tenant.validate_tenant_access"
    }
}

permission_query_conditions = {
    "Policy": "cap.permissions.tenant.get_tenant_condition"
}
```

**Key Points:**
- All data is tagged with `tenant_id`
- Automatic tenant filtering on queries
- Cross-tenant access requires System Manager role
- Tenant switching is not allowed
- Complete data isolation

---

## 2. Development Environment Setup

### 2.1 Prerequisites

**Required Software:**

```bash
# System packages
sudo apt-get update
sudo apt-get install -y \
    python3.9 python3.9-dev python3.9-venv \
    python3-pip \
    mariadb-server mariadb-client \
    redis-server \
    nodejs npm \
    git \
    wkhtmltopdf \
    libmysqlclient-dev \
    build-essential

# Node.js 16+ (if not available)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.2 Install Frappe Bench

```bash
# Install frappe-bench
pip3 install frappe-bench

# Initialize bench
bench init frappe-bench --frappe-branch version-15
cd frappe-bench

# Create new site
bench new-site cap.local \
  --admin-password admin \
  --mariadb-root-password root

# Set site as current
bench use cap.local
```

### 2.3 Clone & Install CAP

```bash
# Clone repository
cd frappe-bench/apps
git clone https://github.com/yourorg/cap.git

# Install app on site
cd ..
bench --site cap.local install-app cap

# Start development server
bench start
```

**Access the platform:**
- URL: `http://cap.local:8000`
- Username: `Administrator`
- Password: `admin` (or your chosen password)

### 2.4 Development Tools Setup

#### Install Python Development Tools

```bash
# Using uv (recommended)
curl -LsSf https://astral.sh/uv/install.sh | sh
uv pip install pytest pytest-cov black isort flake8 bandit

# Or using pip
pip install pytest pytest-cov black isort flake8 bandit
```

#### Configure VS Code

**Install Extensions:**
- Python (Microsoft)
- Pylance
- Frappe/ERPNext Snippets
- ESLint
- Prettier

**VS Code Settings (.vscode/settings.json):**

```json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "python.testing.pytestEnabled": true,
  "python.testing.pytestArgs": [
    "apps/cap/cap/tests"
  ],
  "editor.formatOnSave": true,
  "[python]": {
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  }
}
```

### 2.5 Database Configuration

```bash
# Create dedicated database user for development
sudo mysql -u root -p

CREATE USER 'cap_dev'@'localhost' IDENTIFIED BY 'cap_password';
GRANT ALL PRIVILEGES ON `cap_local`.* TO 'cap_dev'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.6 Redis Configuration

```bash
# Edit redis.conf
sudo nano /etc/redis/redis.conf

# Increase max memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Restart redis
sudo systemctl restart redis
```

---

## 3. Project Structure

### 3.1 Directory Layout

```
cap_development/apps/cap/
├── cap/                          # Main application directory
│   ├── __init__.py
│   ├── hooks.py                  # App configuration & hooks
│   ├── boot.py                   # Boot session configuration
│   ├── modules.txt               # Module definitions
│   │
│   ├── services/                 # 🆕 Business Logic Layer
│   │   ├── __init__.py
│   │   ├── base_service.py       # Base service class
│   │   ├── auth_service.py       # Authentication service
│   │   └── tenant_service.py     # Tenant management service
│   │
│   ├── repositories/             # 🆕 Data Access Layer
│   │   ├── __init__.py
│   │   └── base_repository.py    # Base repository pattern
│   │
│   ├── cache/                    # 🆕 Caching Strategy
│   │   ├── __init__.py
│   │   ├── cache_manager.py      # Unified cache manager
│   │   └── cache_decorators.py   # @cached, @invalidate_cache
│   │
│   ├── observability/            # 🆕 Monitoring & Logging
│   │   ├── __init__.py
│   │   ├── logger.py             # Structured logging
│   │   ├── metrics.py            # Metrics collection
│   │   └── tracer.py             # Distributed tracing
│   │
│   ├── doctype/                  # DocType definitions
│   │   ├── chat_session/
│   │   │   ├── __init__.py
│   │   │   ├── chat_session.json # Schema definition
│   │   │   ├── chat_session.py   # Server-side controller
│   │   │   └── chat_session.js   # Client-side controller
│   │   ├── evidence/
│   │   ├── policy/
│   │   ├── violation/
│   │   └── ... (40+ DocTypes)
│   │
│   ├── analytics/                # Analytics module
│   │   ├── __init__.py
│   │   ├── metrics.py
│   │   └── reports.py
│   │
│   ├── compliance/               # Compliance engine
│   │   ├── __init__.py
│   │   ├── check.py
│   │   ├── engine.py
│   │   └── workflow.py
│   │
│   ├── custody/                  # Chain of custody
│   │   ├── __init__.py
│   │   └── chain.py
│   │
│   ├── ledger/                   # Ledger & blockchain
│   │   ├── __init__.py
│   │   ├── anchor.py
│   │   └── events.py
│   │
│   ├── chat/                     # Real-time chat
│   │   ├── __init__.py
│   │   ├── realtime.py
│   │   └── sessions.py
│   │
│   ├── alerts/                   # Alert system
│   │   └── __init__.py
│   │
│   ├── backup/                   # Backup utilities
│   │   ├── __init__.py
│   │   └── evidence.py
│   │
│   ├── cleanup/                  # Cleanup jobs
│   │   ├── __init__.py
│   │   └── sessions.py
│   │
│   ├── monitoring/               # Health monitoring
│   │   ├── __init__.py
│   │   └── health.py
│   │
│   ├── permissions/              # Permission handlers
│   │   ├── __init__.py
│   │   └── tenant.py
│   │
│   ├── reports/                  # Custom reports
│   │   ├── __init__.py
│   │   └── daily.py
│   │
│   ├── utils/                    # Utility functions
│   │   ├── __init__.py
│   │   └── tenant.py
│   │
│   ├── public/                   # Static assets
│   │   ├── css/
│   │   │   ├── cap_custom.css
│   │   │   ├── arabic_rtl.css
│   │   │   └── multilang.css
│   │   ├── js/
│   │   │   ├── cap_common.js
│   │   │   ├── realtime_handler.js
│   │   │   ├── tenant_filter.js
│   │   │   └── language_switcher.js
│   │   ├── images/
│   │   └── audio/
│   │
│   └── tests/                    # 🆕 Test suite
│       ├── __init__.py
│       ├── conftest.py           # Pytest configuration
│       ├── unit/                 # Unit tests
│       │   ├── test_cache_manager.py
│       │   └── test_base_service.py
│       ├── integration/          # Integration tests
│       ├── api/                  # API tests
│       └── fixtures/             # Test data
│           └── sample_data.py
│
├── docs/                         # 🆕 Documentation
│   ├── architecture/
│   │   └── README.md
│   ├── api/
│   │   └── README.md
│   ├── deployment/
│   │   └── README.md
│   └── guides/
│       ├── development.md
│       └── testing.md
│
├── translations/                 # 🆕 Multi-language support
│   ├── en.csv                    # English (master)
│   ├── ar.csv                    # Arabic
│   ├── fr.csv                    # French
│   ├── es.csv                    # Spanish
│   ├── glossary.csv             # Terminology
│   └── README.md
│
├── .github/                      # 🆕 CI/CD
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── tests.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│
├── pytest.ini                    # 🆕 Pytest configuration
├── requirements.txt              # Python dependencies
├── README.md                     # 🆕 Project README
├── CONTRIBUTING.md               # 🆕 Contribution guidelines
├── HANDOFF.md                    # Project handoff document
└── .gitignore                    # 🆕 Git ignore rules
```

### 3.2 Key Files Explanation

#### hooks.py

**Purpose:** Central configuration for the app

**Key Sections:**
- App metadata (name, version, description)
- DocType event hooks (`doc_events`)
- Scheduled jobs (`scheduler_events`)
- Permission queries (`permission_query_conditions`)
- Web routes (`website_route_rules`)
- Static assets (`app_include_css`, `app_include_js`)

**Example:**

```python
doc_events = {
    "*": {
        "before_save": "cap.utils.tenant.auto_set_tenant"
    },
    "Policy": {
        "after_insert": "cap.ledger.events.log_policy_created"
    }
}

scheduler_events = {
    "hourly": [
        "cap.analytics.metrics.calculate_hourly_metrics"
    ]
}
```

#### boot.py

**Purpose:** Configure data loaded on user login

**Key Functions:**
- `get_boot_info()` - Add custom data to boot session
- `get_user_language()` - Detect user language
- `set_user_language()` - API to change language

---

## 4. Core Concepts

### 4.1 DocTypes

**What is a DocType?**
A DocType is the fundamental building block in Frappe - it represents a database table, its schema, business logic, and UI.

**DocType Components:**
1. **JSON Schema** (`{doctype}.json`) - Field definitions, relationships
2. **Python Controller** (`{doctype}.py`) - Server-side business logic
3. **JavaScript Client** (`{doctype}.js`) - Client-side UI logic
4. **Permissions** - Role-based access control

**DocType Lifecycle:**

```python
class MyDocType(Document):
    # Lifecycle hooks (in order)
    def before_insert(self):      # Before first save
        pass
    
    def validate(self):            # Before every save
        pass
    
    def before_save(self):         # Before every save (after validate)
        pass
    
    def after_insert(self):        # After first save
        pass
    
    def on_update(self):           # After every save
        pass
    
    def on_submit(self):           # When document is submitted
        pass
    
    def on_cancel(self):           # When document is cancelled
        pass
    
    def on_trash(self):            # Before deletion
        pass
```

### 4.2 Services Layer

**Purpose:** Separate business logic from DocType controllers

**BaseService Pattern:**

```python
from cap.services.base_service import BaseService

class MyService(BaseService):
    def __init__(self):
        super().__init__()
        self.service_name = "MyService"
    
    def perform_business_logic(self, data):
        # Logging automatically included
        self.logger.info("Processing data", extra={"data": data})
        
        # Metrics automatically included
        self.metrics.counter("my_service.calls", 1)
        
        # Caching available
        cached_result = self.cache.get("my_key")
        if not cached_result:
            result = self.expensive_operation()
            self.cache.set("my_key", result, ttl=300)
        
        return result
```

**When to Use Services:**
- Complex business logic spanning multiple DocTypes
- Operations requiring external API calls
- Batch processing or data transformations
- Logic that needs to be unit-tested independently

### 4.3 Repository Pattern

**Purpose:** Abstract database queries for testability and reusability

```python
from cap.repositories.base_repository import BaseRepository

class PolicyRepository(BaseRepository):
    def __init__(self):
        super().__init__("Policy")
    
    def get_active_policies(self, tenant):
        return self.find_all({
            "tenant": tenant,
            "status": "Active",
            "is_active": 1
        })
    
    def get_policies_by_framework(self, framework):
        return frappe.db.sql("""
            SELECT name, policy_name, severity
            FROM `tabPolicy`
            WHERE framework LIKE %s
              AND status = 'Active'
        """, (f"%{framework}%",), as_dict=True)

# Usage
repo = PolicyRepository()
policies = repo.get_active_policies("tenant_alpha")
```

### 4.4 Caching Strategy

**Cache Manager:**

```python
from cap.cache import CacheManager, cached

cache = CacheManager()

# Basic usage
cache.set("key", "value", ttl=300)  # 5 minutes
value = cache.get("key")
cache.delete("key")
cache.delete_pattern("user:*")  # Delete all keys matching pattern

# Decorator usage
@cached(ttl=600, key_prefix="policy")
def get_policy_config(policy_name):
    # Expensive database query
    return frappe.get_doc("Policy", policy_name).as_dict()

# Cache invalidation
from cap.cache import invalidate_cache

@invalidate_cache(key_prefix="policy", pattern="{tenant}:*")
def update_policy(policy_name, data):
    policy = frappe.get_doc("Policy", policy_name)
    policy.update(data)
    policy.save()
```

### 4.5 Observability

#### Structured Logging:

```python
from cap.observability import get_logger

logger = get_logger(__name__)

# Basic logging
logger.info("User logged in", extra={
    "user": frappe.session.user,
    "tenant": "tenant_alpha"
})

# Different levels
logger.debug("Debug information")
logger.warning("This is a warning")
logger.error("An error occurred", exc_info=True)
```

#### Metrics Collection:

```python
from cap.observability import MetricsCollector

metrics = MetricsCollector()

# Counter
metrics.counter("api.requests", 1, endpoint="/api/users")

# Gauge
metrics.gauge("active_sessions", 42, tenant="tenant_alpha")

# Histogram
metrics.histogram("response_time", 150.5, endpoint="/api/data")

# Timer (context manager)
with metrics.timer("database_query", table="Policy"):
    results = frappe.db.sql("SELECT ...")
```

#### Distributed Tracing:

```python
from cap.observability import Tracer

tracer = Tracer()

with tracer.span("process_violation", violation_id="V123"):
    # Your code
    with tracer.span("database_lookup"):
        data = frappe.get_doc("Violation", "V123")
    
    with tracer.span("send_notification"):
        send_email(data)
```

---

## 5. DocType Development

### 5.1 Creating a New DocType

#### Via UI (Recommended for beginners):

1. Go to **DocType List** in Desk
2. Click **+ New**
3. Fill in:
   - **Name**: MyDocType
   - **Module**: CAP Core
   - **Is Submittable**: Check if workflow needed
   - **Track Changes**: Check to enable version control
4. Add fields in **Fields** table
5. Set permissions in **Permissions** section
6. Click **Save**

#### Via Code (Recommended for developers):

**File: `cap/doctype/my_doctype/my_doctype.json`**

```json
{
  "name": "My DocType",
  "module": "CAP Core",
  "doctype": "DocType",
  "engine": "InnoDB",
  "is_submittable": 1,
  "track_changes": 1,
  "fields": [
    {
      "fieldname": "title",
      "label": "Title",
      "fieldtype": "Data",
      "reqd": 1,
      "in_list_view": 1
    },
    {
      "fieldname": "tenant",
      "label": "Tenant",
      "fieldtype": "Link",
      "options": "Tenant",
      "reqd": 1,
      "in_standard_filter": 1
    },
    {
      "fieldname": "status",
      "label": "Status",
      "fieldtype": "Select",
      "options": "Draft\nActive\nInactive",
      "default": "Draft"
    }
  ],
  "permissions": [
    {
      "role": "System Manager",
      "read": 1,
      "write": 1,
      "create": 1,
      "delete": 1
    }
  ]
}
```

### 5.2 Python Controller

**File: `cap/doctype/my_doctype/my_doctype.py`**

```python
import frappe
from frappe.model.document import Document
from frappe import _
from cap.observability import get_logger, MetricsCollector

logger = get_logger(__name__)
metrics = MetricsCollector()

class MyDocType(Document):
    """My DocType Controller"""
    
    def before_insert(self):
        """Called before first save"""
        # Set default values
        if not self.tenant:
            self.tenant = frappe.db.get_value(
                "User", frappe.session.user, "tenant"
            )
        
        # Generate unique ID
        if not self.unique_id:
            self.unique_id = frappe.generate_hash(length=10)
        
        logger.info(
            "Creating new MyDocType",
            extra={"tenant": self.tenant, "title": self.title}
        )
    
    def validate(self):
        """Validation before every save"""
        # Validate tenant access
        self.validate_tenant()
        
        # Validate required fields
        if not self.title:
            frappe.throw(_("Title is required"))
        
        # Business logic validation
        if self.status == "Active" and not self.approved_by:
            frappe.throw(_("Approval required before activation"))
    
    def before_save(self):
        """Called before every save"""
        # Auto-update fields
        self.modified_by = frappe.session.user
        self.modified_at = frappe.utils.now_datetime()
        
        # Calculate derived fields
        self.calculate_metrics()
    
    def on_update(self):
        """Called after every save"""
        # Record metrics
        metrics.counter("my_doctype.updated", 1, status=self.status)
        
        # Trigger notifications
        if self.has_value_changed("status"):
            self.send_status_notification()
    
    def on_trash(self):
        """Called before deletion"""
        # Check dependencies
        if self.status == "Active":
            frappe.throw(_("Cannot delete active documents"))
        
        # Cleanup related data
        self.cleanup_related_documents()
    
    # Business Logic Methods
    
    def validate_tenant(self):
        """Validate tenant access"""
        if not frappe.has_permission("Tenant", "read", self.tenant):
            frappe.throw(_("Access denied to tenant"))
    
    def calculate_metrics(self):
        """Calculate derived metrics"""
        # Example: Calculate a score
        self.score = self.calculate_score()
    
    def send_status_notification(self):
        """Send notification on status change"""
        frappe.sendmail(
            recipients=["admin@example.com"],
            subject=f"Status Changed: {self.title}",
            message=f"Status changed to {self.status}",
            reference_doctype=self.doctype,
            reference_name=self.name
        )
    
    # API Methods (whitelisted)
    
    @frappe.whitelist()
    def activate(self):
        """Activate the document"""
        if self.status != "Draft":
            frappe.throw(_("Only draft documents can be activated"))
        
        self.status = "Active"
        self.save()
        
        return {"success": True, "message": "Document activated"}

# Module-level whitelisted functions

@frappe.whitelist()
def create_my_doctype(title, tenant, **kwargs):
    """API to create new document"""
    doc = frappe.get_doc({
        "doctype": "My DocType",
        "title": title,
        "tenant": tenant,
        **kwargs
    })
    doc.insert()
    return doc.as_dict()

@frappe.whitelist()
def get_statistics(tenant=None):
    """Get statistics"""
    filters = {}
    if tenant:
        filters["tenant"] = tenant
    
    return {
        "total": frappe.db.count("My DocType", filters),
        "active": frappe.db.count("My DocType", {**filters, "status": "Active"})
    }
```

### 5.3 JavaScript Client Controller

**File: `cap/doctype/my_doctype/my_doctype.js`**

```javascript
frappe.ui.form.on('My DocType', {
    // Form load event
    refresh: function(frm) {
        // Add custom buttons
        if (frm.doc.status === "Draft" && !frm.is_new()) {
            frm.add_custom_button(__('Activate'), function() {
                frm.call('activate').then(r => {
                    frappe.show_alert(__('Document activated'));
                    frm.reload_doc();
                });
            });
        }
        
        // Add dashboard indicators
        if (frm.doc.status === "Active") {
            frm.dashboard.add_indicator(__('Active'), 'green');
        }
        
        // Set field properties
        frm.set_df_property('title', 'read_only', frm.doc.status === 'Active');
    },
    
    // Field change events
    status: function(frm) {
        if (frm.doc.status === 'Active') {
            frappe.msgprint(__('Document is now active'));
        }
    },
    
    // Custom methods
    onload: function(frm) {
        // Load statistics
        if (!frm.is_new()) {
            load_statistics(frm);
        }
    }
});

// Helper functions
function load_statistics(frm) {
    frappe.call({
        method: 'cap.doctype.my_doctype.my_doctype.get_statistics',
        args: {
            tenant: frm.doc.tenant
        },
        callback: function(r) {
            if (r.message) {
                frm.dashboard.set_headline(
                    __('Total: {0} | Active: {1}', [r.message.total, r.message.active])
                );
            }
        }
    });
}
```

### 5.4 Common Field Types

| Fieldtype | Description | Example |
|-----------|-------------|----------|
| **Data** | Single-line text | Name, Email |
| **Text** | Multi-line text | Description, Notes |
| **Text Editor** | Rich text | HTML content |
| **Int** | Integer number | Count, Quantity |
| **Float** | Decimal number | Price, Score |
| **Currency** | Money amount | Cost, Budget |
| **Date** | Date field | Birthdate, Due Date |
| **Datetime** | Date and time | Created At, Modified At |
| **Select** | Dropdown list | Status, Priority |
| **Link** | Foreign key | User, Tenant |
| **Dynamic Link** | Flexible FK | Reference DocType |
| **Check** | Boolean | Is Active, Enabled |
| **Table** | Child table | Items, Actions |
| **Attach** | File upload | Document, Image |
| **Password** | Encrypted text | API Key, Secret |
| **JSON** | JSON data | Config, Metadata |

---

## 6. Business Logic Layer

### 6.1 Service Architecture

**Base Service Pattern:**

```python
from cap.services.base_service import BaseService
from cap.repositories.base_repository import BaseRepository

class ViolationService(BaseService):
    def __init__(self):
        super().__init__()
        self.service_name = "ViolationService"
        self.violation_repo = BaseRepository("Violation")
        self.policy_repo = BaseRepository("Policy")
    
    def detect_violations(self, message_content, tenant, session_id):
        """
        Detect policy violations in message content
        
        Args:
            message_content (str): Message text to check
            tenant (str): Tenant name
            session_id (str): Chat session ID
        
        Returns:
            list: List of violations detected
        """
        self.logger.info(
            "Starting violation detection",
            extra={"tenant": tenant, "session": session_id}
        )
        
        # Get active policies for tenant
        policies = self.policy_repo.find_all({
            "tenant": tenant,
            "status": "Active",
            "is_active": 1
        })
        
        violations = []
        
        for policy in policies:
            # Check each policy
            violation = self._check_policy(message_content, policy)
            if violation:
                violations.append(violation)
        
        # Record metrics
        self.metrics.counter(
            "violations.detected",
            len(violations),
            tenant=tenant
        )
        
        return violations
    
    def _check_policy(self, content, policy):
        """Check content against a single policy"""
        # Implementation of policy checking logic
        pass
    
    def create_violation(self, data):
        """
        Create a new violation record
        
        Args:
            data (dict): Violation data
        
        Returns:
            Document: Created violation
        """
        import frappe
        
        violation = frappe.get_doc({
            "doctype": "Violation",
            **data
        })
        
        violation.insert()
        
        self.logger.info(
            "Violation created",
            extra={"violation_id": violation.name}
        )
        
        return violation
```

### 6.2 Tenant Service Example

```python
from cap.services.tenant_service import TenantService

service = TenantService()

# Create tenant
tenant = service.create_tenant(
    name="Acme Corp",
    plan="Enterprise",
    features=["multi_language", "analytics"]
)

# Check access
has_access = service.check_user_tenant_access(
    user="john@acme.com",
    tenant="tenant_acme"
)

# Get statistics
stats = service.get_tenant_statistics("tenant_acme")
```

### 6.3 Auth Service Example

```python
from cap.services.auth_service import AuthService

auth = AuthService()

# Authenticate
result = auth.authenticate(
    "john@acme.com",
    "password123"
)

if result["success"]:
    # Login successful
    session_data = result["session"]
else:
    # Login failed
    error = result["error"]

# Check permission
has_permission = auth.check_document_permission(
    user="john@acme.com",
    doctype="Policy",
    docname="POL-001",
    permission_type="write"
)
```

---

## 7. API Development

### 7.1 Creating REST APIs

**Whitelist Methods:**

```python
import frappe
from frappe import _

@frappe.whitelist()
def my_api_method(param1, param2):
    """
    API endpoint description
    
    Args:
        param1 (str): Description of param1
        param2 (int): Description of param2
    
    Returns:
        dict: Response data
    """
    # Validate inputs
    if not param1:
        frappe.throw(_("param1 is required"))
    
    # Business logic
    result = process_data(param1, param2)
    
    # Return response
    return {
        "success": True,
        "data": result
    }

@frappe.whitelist(allow_guest=True)
def public_api():
    """Public API that doesn't require login"""
    return {"status": "ok"}

@frappe.whitelist(methods=["POST"])
def post_only_api():
    """API that only accepts POST requests"""
    data = frappe.local.form_dict
    return {"received": data}
```

### 7.2 API Access from Client

**JavaScript:**

```javascript
// From DocType form
frappe.call({
    method: 'cap.api.my_module.my_api_method',
    args: {
        param1: 'value1',
        param2: 42
    },
    callback: function(r) {
        if (r.message && r.message.success) {
            console.log(r.message.data);
        }
    }
});

// Async/await style
async function callAPI() {
    const response = await frappe.call({
        method: 'cap.api.my_module.my_api_method',
        args: {param1: 'value1', param2: 42}
    });
    
    return response.message;
}
```

**Python (from another method):**

```python
import frappe

result = frappe.call(
    'cap.api.my_module.my_api_method',
    param1='value1',
    param2=42
)
```

**cURL (external access):**

```bash
curl -X POST 'https://cap.yoursite.com/api/method/cap.api.my_module.my_api_method' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: token YOUR_API_KEY:YOUR_API_SECRET' \
  -d '{
    "param1": "value1",
    "param2": 42
  }'
```

### 7.3 Error Handling

```python
import frappe
from frappe import _

@frappe.whitelist()
def my_api():
    try:
        # Risky operation
        result = perform_operation()
        
        return {
            "success": True,
            "data": result
        }
    
    except frappe.DoesNotExistError:
        frappe.throw(_("Record not found"), frappe.DoesNotExistError)
    
    except frappe.ValidationError as e:
        frappe.throw(_("Validation failed: {0}").format(str(e)))
    
    except Exception as e:
        frappe.log_error(f"API error: {str(e)}")
        frappe.throw(_("An error occurred. Please try again."))
```

### 7.4 Rate Limiting

```python
from frappe.rate_limiter import rate_limit

@frappe.whitelist()
@rate_limit(limit=100, seconds=3600)  # 100 calls per hour
def rate_limited_api():
    return {"status": "ok"}
```

---

## 8. Frontend Development

### 8.1 Custom Pages

**Create a Web Page:**

```python
# File: cap/www/my_page.py
import frappe

def get_context(context):
    context.title = "My Custom Page"
    context.data = frappe.get_all(
        "My DocType",
        fields=["name", "title", "status"],
        limit=10
    )
    return context
```

```html
<!-- File: cap/www/my_page.html -->
{% extends "templates/web.html" %}

{% block title %}{{ title }}{% endblock %}

{% block page_content %}
<div class="container">
    <h1>{{ title }}</h1>
    
    <table class="table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Title</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            {% for item in data %}
            <tr>
                <td>{{ item.name }}</td>
                <td>{{ item.title }}</td>
                <td>{{ item.status }}</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
</div>
{% endblock %}
```

### 8.2 Custom Styles

```css
/* File: cap/public/css/custom.css */

/* Override default styles */
.btn-primary {
    background-color: #2563eb;
    border-color: #2563eb;
}

/* Custom classes */
.cap-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.cap-badge-critical {
    background-color: #dc2626;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
}
```

### 8.3 Custom Scripts

```javascript
// File: cap/public/js/custom.js

// Global utilities
window.cap = window.cap || {};

cap.utils = {
    formatDate: function(date) {
        return moment(date).format('YYYY-MM-DD HH:mm');
    },
    
    showNotification: function(message, type='success') {
        frappe.show_alert({
            message: message,
            indicator: type
        });
    }
};

// Real-time handlers
frappe.realtime.on('violation_detected', function(data) {
    cap.utils.showNotification(
        `New violation detected: ${data.title}`,
        'red'
    );
});
```

---

## 9. Testing

### 9.1 Unit Testing with pytest

**File: `cap/tests/unit/test_violation_service.py`**

```python
import pytest
import frappe
from cap.services.violation_service import ViolationService

class TestViolationService:
    @pytest.fixture
    def service(self):
        return ViolationService()
    
    @pytest.fixture
    def sample_policy(self):
        policy = frappe.get_doc({
            "doctype": "Policy",
            "policy_name": "Test Policy",
            "policy_type": "Security",
            "tenant": "_Test Tenant",
            "status": "Active",
            "is_active": 1
        })
        policy.insert()
        yield policy
        policy.delete()
    
    def test_detect_violations(self, service, sample_policy):
        """Test violation detection"""
        violations = service.detect_violations(
            message_content="This is a test message",
            tenant="_Test Tenant",
            session_id="TEST-001"
        )
        
        assert isinstance(violations, list)
    
    def test_create_violation(self, service):
        """Test violation creation"""
        violation = service.create_violation({
            "title": "Test Violation",
            "violation_type": "Policy Breach",
            "severity": "High",
            "tenant": "_Test Tenant"
        })
        
        assert violation.name is not None
        assert violation.title == "Test Violation"
        
        # Cleanup
        violation.delete()
```

### 9.2 Integration Testing

**File: `cap/tests/integration/test_chat_workflow.py`**

```python
import pytest
import frappe

class TestChatWorkflow:
    @pytest.fixture
    def chat_session(self):
        session = frappe.get_doc({
            "doctype": "Chat Session",
            "tenant": "_Test Tenant",
            "user": frappe.session.user,
            "status": "Active"
        })
        session.insert()
        yield session
        session.delete()
    
    def test_send_message_workflow(self, chat_session):
        """Test complete message sending workflow"""
        # Create message
        message = frappe.get_doc({
            "doctype": "Message",
            "chat_session": chat_session.name,
            "content": "Hello, world!",
            "sender": frappe.session.user
        })
        message.insert()
        
        # Verify message created
        assert message.name is not None
        
        # Verify compliance check triggered
        # (This would be mocked in real test)
        
        # Verify session updated
        chat_session.reload()
        assert chat_session.total_messages > 0
        
        # Cleanup
        message.delete()
```

### 9.3 Running Tests

```bash
# Run all tests
cd frappe-bench/apps/cap
pytest

# Run specific test file
pytest cap/tests/unit/test_violation_service.py

# Run with coverage
pytest --cov=cap --cov-report=html

# Run in verbose mode
pytest -v

# Run only marked tests
pytest -m "slow"
```

### 9.4 Test Fixtures

**File: `cap/tests/conftest.py`**

```python
import pytest
import frappe

@pytest.fixture(scope="session")
def test_tenant():
    """Create test tenant"""
    tenant = frappe.get_doc({
        "doctype": "Tenant",
        "tenant_name": "Test Tenant",
        "status": "Active"
    })
    tenant.insert()
    yield tenant
    tenant.delete()

@pytest.fixture
def test_user():
    """Create test user"""
    user = frappe.get_doc({
        "doctype": "User",
        "email": "test@example.com",
        "first_name": "Test",
        "enabled": 1
    })
    user.insert()
    yield user
    user.delete()
```

---

## 10. Deployment

### 10.1 Production Deployment Checklist

```bash
# 1. Enable production mode
bench --site cap.production set-config developer_mode 0

# 2. Set maintenance mode during deployment
bench --site cap.production set-maintenance-mode on

# 3. Pull latest code
cd frappe-bench/apps/cap
git pull origin main

# 4. Install dependencies
cd frappe-bench
bench setup requirements

# 5. Run database migrations
bench --site cap.production migrate

# 6. Build assets
bench build --app cap

# 7. Clear cache
bench --site cap.production clear-cache
bench --site cap.production clear-website-cache

# 8. Restart services
sudo supervisorctl restart all

# 9. Disable maintenance mode
bench --site cap.production set-maintenance-mode off

# 10. Verify deployment
curl https://cap.production/api/method/ping
```

### 10.2 Environment Configuration

**File: `sites/cap.production/site_config.json`**

```json
{
  "db_name": "cap_production",
  "db_password": "****",
  "developer_mode": 0,
  "maintenance_mode": 0,
  "redis_cache": "redis://localhost:6379",
  "redis_queue": "redis://localhost:6379",
  "redis_socketio": "redis://localhost:6379",
  "socketio_port": 9000,
  "encryption_key": "****",
  "limits": {
    "max_file_size": 10485760
  },
  "logging": {
    "level": "INFO",
    "format": "json"
  }
}
```

### 10.3 Nginx Configuration

```nginx
upstream cap_socketio {
    server 127.0.0.1:9000 fail_timeout=0;
}

upstream cap_web {
    server 127.0.0.1:8000 fail_timeout=0;
}

server {
    listen 443 ssl http2;
    server_name cap.production.com;
    
    ssl_certificate /etc/letsencrypt/live/cap.production.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cap.production.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # Socket.io
    location /socket.io {
        proxy_pass http://cap_socketio;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    
    # Main app
    location / {
        proxy_pass http://cap_web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /assets {
        alias /home/frappe/frappe-bench/sites/assets;
        expires 30d;
    }
}
```

### 10.4 Supervisor Configuration

```ini
[program:cap-web]
command=/home/frappe/frappe-bench/env/bin/gunicorn -b 127.0.0.1:8000 -w 4 --timeout 120 frappe.app:application --preload
directory=/home/frappe/frappe-bench/sites
user=frappe
autostart=true
autorestart=true
stdout_logfile=/var/log/cap/web.log
stderr_logfile=/var/log/cap/web.error.log

[program:cap-worker-default]
command=/home/frappe/frappe-bench/env/bin/bench worker --queue default
directory=/home/frappe/frappe-bench
user=frappe
autostart=true
autorestart=true

[program:cap-worker-long]
command=/home/frappe/frappe-bench/env/bin/bench worker --queue long
directory=/home/frappe/frappe-bench
user=frappe
autostart=true
autorestart=true

[program:cap-schedule]
command=/home/frappe/frappe-bench/env/bin/bench schedule
directory=/home/frappe/frappe-bench
user=frappe
autostart=true
autorestart=true

[group:cap]
programs=cap-web,cap-worker-default,cap-worker-long,cap-schedule
```

---

## 11. Best Practices

### 11.1 Code Organization

✅ **DO:**
- Keep business logic in Services layer
- Use Repositories for database queries
- Follow single responsibility principle
- Write docstrings for all functions/classes
- Use type hints where possible

❌ **DON'T:**
- Put business logic in controllers
- Make direct database queries in controllers
- Create circular dependencies
- Hardcode configuration values

### 11.2 Performance

**Caching:**

```python
# Use caching for expensive operations
from cap.cache import cached

@cached(ttl=3600)
def get_expensive_data(param):
    # Expensive operation
    return result
```

**Batch Operations:**

```python
# Use bulk operations instead of loops
frappe.db.bulk_insert("DocType", items, ignore_duplicates=True)

# Instead of:
for item in items:
    doc = frappe.get_doc({"doctype": "DocType", **item})
    doc.insert()
```

**Database Indexing:**

```python
# Add indexes for frequently queried fields
{
    "fieldname": "tenant",
    "fieldtype": "Link",
    "options": "Tenant",
    "search_index": 1  # Creates database index
}
```

### 11.3 Security

**Input Validation:**

```python
import frappe
from frappe import _

@frappe.whitelist()
def my_api(user_input):
    # Sanitize input
    user_input = frappe.utils.cstr(user_input)
    
    # Validate
    if not user_input or len(user_input) > 100:
        frappe.throw(_("Invalid input"))
    
    # Use parameterized queries
    results = frappe.db.sql("""
        SELECT name FROM `tabDocType`
        WHERE field = %s
    """, (user_input,), as_dict=True)
    
    return results
```

**Permission Checks:**

```python
@frappe.whitelist()
def sensitive_operation(docname):
    # Check permission
    if not frappe.has_permission("DocType", "write", docname):
        frappe.throw(_("Access denied"))
    
    # Proceed with operation
    doc = frappe.get_doc("DocType", docname)
    doc.sensitive_field = "new_value"
    doc.save()
```

### 11.4 Error Handling

```python
import frappe
from cap.observability import get_logger

logger = get_logger(__name__)

def risky_operation():
    try:
        # Operation that might fail
        result = perform_operation()
        return result
    
    except frappe.DoesNotExistError:
        logger.warning("Record not found")
        return None
    
    except Exception as e:
        logger.error(
            "Operation failed",
            exc_info=True,
            extra={"operation": "risky_operation"}
        )
        raise
```

### 11.5 Documentation

**Docstring Format:**

```python
def complex_function(param1, param2, param3=None):
    """
    Brief description of what the function does.
    
    More detailed explanation if needed. This can span
    multiple lines and explain the algorithm, edge cases,
    or important considerations.
    
    Args:
        param1 (str): Description of param1
        param2 (int): Description of param2
        param3 (dict, optional): Description of param3.
            Defaults to None.
    
    Returns:
        dict: Description of return value with structure:
            {
                "key1": "description",
                "key2": "description"
            }
    
    Raises:
        frappe.ValidationError: When validation fails
        ValueError: When param2 is negative
    
    Examples:
        >>> result = complex_function("test", 42)
        >>> print(result)
        {'key1': 'value1', 'key2': 'value2'}
    """
    pass
```

---

## 12. Troubleshooting

### 12.1 Common Issues

**Issue: Import Error**

```bash
ModuleNotFoundError: No module named 'cap'
```

**Solution:**
```bash
# Ensure app is installed
bench --site cap.local install-app cap

# Restart bench
bench restart
```

**Issue: Permission Denied**

```
frappe.exceptions.PermissionError: Insufficient Permission
```

**Solution:**
1. Check user roles
2. Verify DocType permissions
3. Check permission query conditions

**Issue: Database Migration Failed**

```bash
# Retry migration
bench --site cap.local migrate

# Force reload schema
bench --site cap.local reload-doctype "DocType Name"
```

### 12.2 Debugging

**Enable Debug Mode:**

```python
# In site_config.json
{
    "developer_mode": 1,
    "debug": true
}
```

**Python Debugger:**

```python
import pdb; pdb.set_trace()  # Breakpoint

# Or use ipdb for better experience
import ipdb; ipdb.set_trace()
```

**View Logs:**

```bash
# Bench logs
bench --site cap.local console

# Error logs
tail -f sites/cap.local/logs/error.log

# Web logs
tail -f sites/cap.local/logs/web.log
```

### 12.3 Performance Profiling

```python
import time
from functools import wraps

def profile(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.2f}s")
        return result
    return wrapper

@profile
def slow_function():
    # Your code
    pass
```

---

## Appendix A: Useful Commands

```bash
# Development
bench start                          # Start development server
bench restart                        # Restart services
bench migrate                        # Run migrations
bench clear-cache                    # Clear cache
bench clear-website-cache           # Clear website cache

# Building
bench build --app cap               # Build assets
bench build --app cap --force       # Force rebuild

# Database
bench --site cap.local mariadb      # Access MariaDB console
bench --site cap.local console      # Python console with frappe context

# Backup
bench --site cap.local backup       # Create backup
bench --site cap.local restore      # Restore backup

# Testing
bench run-tests --app cap           # Run all tests
bench run-tests --doctype "Policy"  # Test specific DocType

# Logs
bench --site cap.local watch        # Watch logs in real-time
```

---

## Appendix B: Resources

- **Frappe Documentation**: https://frappeframework.com/docs
- **ERPNext Documentation**: https://docs.erpnext.com
- **CAP GitHub**: https://github.com/yourorg/cap
- **Community Forum**: https://discuss.frappe.io

---

**End of Developer Guide**