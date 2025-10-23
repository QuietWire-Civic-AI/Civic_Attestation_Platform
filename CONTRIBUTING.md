# Contributing to Civic AI Canon Platform (CAP)

Thank you for your interest in contributing to CAP! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Bug Reports

If you find a bug, please create an issue with the following information:

- **Bug Description**: Clear description of the bug
- **Steps to Reproduce**: Step-by-step instructions
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: OS, Python version, Frappe version
- **Screenshots**: If applicable

### Feature Requests

For new features, please:

1. Check if the feature already exists
2. Create an issue with:
   - Feature description
   - Use case and benefits
   - Proposed implementation approach
   - Any relevant mockups or examples

### Code Contributions

#### Development Setup

1. **Fork the repository**
```bash
git clone https://github.com/your-username/cap.git
cd cap
```

2. **Set up development environment**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd apps/cap
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies
```

3. **Set up Frappe environment**
```bash
# Initialize frappe bench
bench init frappe-bench --python python3
cd frappe-bench

# Install the app
bench get-app cap /path/to/cap/apps/cap
bench new-site cap-local
bench --site cap-local install-app cap
```

#### Making Changes

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
   - Follow the coding standards (see below)
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
```bash
# Run all tests
pytest cap/tests/

# Run specific test file
pytest cap/tests/unit/test_chat_service.py

# Check test coverage
pytest --cov=cap --cov-report=html
```

4. **Commit your changes**
```bash
git add .
git commit -m "feat: add chat session management (CAP-123)"
```

#### Coding Standards

**Python Code Style:**
- Follow PEP 8 style guide
- Use type hints
- Maximum line length: 88 characters (Black formatter)
- Use meaningful variable and function names

**Example:**
```python
from typing import List, Optional, Dict, Any

class ChatService:
    """Service for managing chat sessions."""
    
    def create_session(
        self,
        tenant_id: str,
        user_id: str,
        model_config: str,
        title: Optional[str] = None
    ) -> ChatSession:
        """Create a new chat session.
        
        Args:
            tenant_id: Unique identifier for the tenant
            user_id: User creating the session
            model_config: AI model configuration to use
            title: Optional session title
            
        Returns:
            Created ChatSession instance
            
        Raises:
            ValidationError: If parameters are invalid
        """
        # Implementation here
        pass
```

**JavaScript Code Style:**
- Use ES6+ features
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable names
- Add JSDoc comments for functions

**Example:**
```javascript
/**
 * Create a new chat session
 * @param {Object} params - Session parameters
 * @param {string} params.tenantId - Tenant identifier
 * @param {string} params.userId - User identifier
 * @param {string} params.modelConfig - Model configuration
 * @returns {Promise<Object>} Created session
 */
async function createChatSession(params) {
  // Implementation here
}
```

#### DocTypes Standards

When creating or modifying DocTypes:

1. **Follow naming conventions:**
   - DocType names: PascalCase (e.g., `ChatSession`)
   - Field names: snake_case (e.g., `session_title`)
   - Class names: Match DocType name (e.g., `class ChatSession(Document)`)

2. **Required methods:**
   ```python
   class ChatSession(Document):
       def before_insert(self):
           """Validate before creating document."""
           pass
       
       def validate(self):
           """Validate document fields."""
           pass
       
       def on_update(self):
           """Called after document is saved."""
           pass
       
       def on_trash(self):
           """Called before document is deleted."""
           pass
   ```

3. **API Documentation:**
   ```python
   @frappe.whitelist()
   def create_session(self, **kwargs):
       """Create a new chat session.
       
       Args:
           **kwargs: Session parameters
           
       Returns:
           dict: Session details
       """
       # Implementation
   ```

#### Testing Requirements

**Test Coverage Goals:**
- Unit tests: >90% coverage
- Integration tests: All major workflows
- API tests: All endpoints

**Test Structure:**
```python
# cap/tests/unit/test_chat_service.py
import pytest
from unittest.mock import Mock, patch
from cap.services.chat_service import ChatService
from cap.doctype.chat_session.chat_session import ChatSession

class TestChatService:
    
    def setup_method(self):
        """Set up test fixtures."""
        self.service = ChatService()
        self.tenant_id = "test_tenant"
    
    @pytest.mark.unit
    def test_create_session_success(self):
        """Test successful session creation."""
        # Arrange
        user_id = "test_user"
        model_config = "gpt-4"
        
        # Act
        session = self.service.create_session(
            tenant_id=self.tenant_id,
            user_id=user_id,
            model_config=model_config
        )
        
        # Assert
        assert session.tenant == self.tenant_id
        assert session.status == "Active"
    
    @pytest.mark.unit
    def test_create_session_invalid_model(self):
        """Test session creation with invalid model config."""
        with pytest.raises(ValueError):
            self.service.create_session(
                tenant_id=self.tenant_id,
                user_id="test_user",
                model_config="invalid_model"
            )
```

**Test Naming:**
- Test files: `test_[module_name].py`
- Test classes: `Test[ClassName]`
- Test methods: `test_[description]`
- Use descriptive test names that explain what is being tested

#### Documentation Standards

**Documentation Requirements:**
- All public APIs must have docstrings
- Include usage examples
- Update relevant documentation files
- Add docstrings in English

**Docstring Format:**
```python
def create_policy(
    self,
    name: str,
    policy_type: str,
    rules: List[Dict[str, Any]]
) -> Policy:
    """Create a new compliance policy.
    
    Creates a policy with the specified name, type, and rules. The policy
    is created in draft status and must be activated before enforcement.
    
    Args:
        name: Human-readable policy name
        policy_type: Type of policy (Compliance, Privacy, Security, etc.)
        rules: List of policy rules defining enforcement criteria
        
    Returns:
        Policy: Created policy document
        
    Raises:
        ValidationError: If name is not unique or rules are invalid
        PermissionError: If user lacks permission to create policies
        
    Example:
        >>> service = PolicyService()
        >>> policy = service.create_policy(
        ...     name="Data Privacy Policy",
        ...     policy_type="Privacy",
        ...     rules=[
        ...         {"pattern": "ssn", "action": "Block"},
        ...         {"pattern": "email", "action": "Warn"}
        ...     ]
        ... )
        >>> policy.name
        'Data Privacy Policy'
    """
    # Implementation
```

#### Commit Message Standards

Use conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```bash
feat(chat): add session management API (CAP-123)
fix(policy): resolve validation error for empty rules
docs(workflows): update violation detection flow diagram
test(evidence): add unit tests for evidence verification
refactor(cache): improve caching performance
```

#### Pull Request Process

1. **Before submitting:**
   - Ensure all tests pass
   - Update documentation
   - Add/update tests
   - Check code coverage
   - Follow coding standards

2. **Pull Request template:**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] All tests pass locally
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes (or clearly documented)
   
   ## Related Issues
   Fixes #123
   ```

3. **Review Process:**
   - At least one reviewer required
   - All CI checks must pass
   - Address feedback promptly
   - Squash commits if requested

## 🏗️ Project Structure

```
cap/
├── cap/                          # Main application
│   ├── doctype/                  # DocTypes (data models)
│   │   ├── chat_session/         # Chat session management
│   │   ├── policy/              # Policy management
│   │   ├── evidence/            # Evidence management
│   │   └── ...                  # Other DocTypes
│   │
│   ├── services/                # Business logic services
│   │   ├── chat_service.py      # Chat operations
│   │   ├── policy_service.py    # Policy operations
│   │   └── ...                  # Other services
│   │
│   ├── utils/                   # Utility functions
│   ├── public/                  # Static files (JS, CSS)
│   └── tests/                   # Test files
│       ├── unit/                # Unit tests
│       ├── integration/         # Integration tests
│       └── api/                 # API tests
│
├── docs/                        # Documentation
│   ├── USER_GUIDE.md           # User documentation
│   ├── DEVELOPER_GUIDE.md      # Developer documentation
│   └── ...                     # Other docs
│
├── .github/                     # GitHub specific files
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/              # CI/CD workflows
│
└── scripts/                    # Utility scripts
    ├── setup.sh               # Development setup
    └── deploy.sh              # Deployment script
```

## 📝 Development Guidelines

### Code Organization

1. **Services Layer:**
   - Business logic in service classes
   - Keep services focused and single-purpose
   - Inject dependencies, avoid hard coding

2. **Repository Pattern:**
   - Use repositories for data access
   - Keep database queries in repositories
   - Services should not directly access database

3. **Utils and Helpers:**
   - Common functions in utils modules
   - Keep functions pure (no side effects)
   - Reuse existing utilities when possible

### Error Handling

1. **Use Specific Exceptions:**
   ```python
   from frappe.exceptions import ValidationError, PermissionError
   
   if not user.has_permission("create"):
       raise PermissionError("User lacks permission to create chat sessions")
   
   if not session_title.strip():
       raise ValidationError("Session title cannot be empty")
   ```

2. **Log Errors Appropriately:**
   ```python
   import logging
   
   logger = logging.getLogger(__name__)
   
   try:
       result = risky_operation()
   except Exception as e:
       logger.error("Operation failed: %s", str(e), exc_info=True)
       raise
   ```

### Performance Guidelines

1. **Database Optimization:**
   - Use select queries instead of get_doc when possible
   - Index frequently queried fields
   - Batch database operations

2. **Caching:**
   - Cache frequently accessed data
   - Use appropriate cache TTL
   - Invalidate cache on data changes

3. **Async Operations:**
   - Use async/await for I/O operations
   - Avoid blocking operations in request handlers
   - Use Celery for long-running tasks

## 🆘 Getting Help

If you need help:

1. **Check existing documentation**
2. **Search existing issues**
3. **Create a new issue** with questions
4. **Join our Discord community**
5. **Email**: dev@cap-platform.com

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CAP! 🚀