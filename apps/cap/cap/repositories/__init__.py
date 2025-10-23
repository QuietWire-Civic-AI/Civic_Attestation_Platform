"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: __init__.py
"""
    from cap.repositories.tenant_repository import TenantRepository
from cap.repositories.base_repository import BaseRepository
"""Repository Layer - Data Access

This layer handles all database operations and data access logic.
Repositories provide a clean abstraction over Frappe's DocType operations.

Usage:
    
    repo = TenantRepository()
    tenant = repo.find_by_name("tenant_name")
"""


__all__ = ['BaseRepository']
