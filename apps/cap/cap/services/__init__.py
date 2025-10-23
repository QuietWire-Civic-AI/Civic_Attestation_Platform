"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

Service module: __init__.py
"""
    from cap.services.auth_service import AuthService
from cap.services.base_service import BaseService
"""Service Layer - Business Logic

This layer contains all business logic separated from API controllers.
Services are responsible for:
- Complex business operations
- Data validation
- Orchestrating multiple operations
- Enforcing business rules

Usage:
    
    auth_service = AuthService()
    result = auth_service.authenticate(username, password)
"""


__all__ = ['BaseService']
