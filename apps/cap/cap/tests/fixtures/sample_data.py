"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

Test module: sample_data.py
"""
from typing import Dict, List
"""Sample Test Data

Provides sample data for testing.
"""



# Sample Users
SAMPLE_USERS = [
    {
        "email": "admin@test.com",
        "first_name": "Admin",
        "last_name": "User",
        "user_type": "System User",
        "roles": ["System Manager", "Tenant Admin"]
    },
    {
        "email": "user1@test.com",
        "first_name": "Test",
        "last_name": "User 1",
        "user_type": "System User",
        "roles": ["Tenant User"]
    },
    {
        "email": "user2@test.com",
        "first_name": "Test",
        "last_name": "User 2",
        "user_type": "System User",
        "roles": ["Tenant User"]
    }
]

# Sample Tenants
SAMPLE_TENANTS = [
    {
        "name": "tenant_alpha",
        "display_name": "Tenant Alpha",
        "domain": "alpha.example.com",
        "admin_email": "admin@alpha.com",
        "plan": "enterprise"
    },
    {
        "name": "tenant_beta",
        "display_name": "Tenant Beta",
        "domain": "beta.example.com",
        "admin_email": "admin@beta.com",
        "plan": "professional"
    },
    {
        "name": "tenant_gamma",
        "display_name": "Tenant Gamma",
        "domain": "gamma.example.com",
        "admin_email": "admin@gamma.com",
        "plan": "basic"
    }
]


def get_sample_user(index: int = 0) -> Dict:
    """Get sample user by index.
    
    Args:
        index: User index (0-2)
        
    Returns:
        User data dictionary
    """
    return SAMPLE_USERS[index].copy()


def get_sample_tenant(index: int = 0) -> Dict:
    """Get sample tenant by index.
    
    Args:
        index: Tenant index (0-2)
        
    Returns:
        Tenant data dictionary
    """
    return SAMPLE_TENANTS[index].copy()


def get_all_sample_users() -> List[Dict]:
    """Get all sample users.
    
    Returns:
        List of user data dictionaries
    """
    return [user.copy() for user in SAMPLE_USERS]


def get_all_sample_tenants() -> List[Dict]:
    """Get all sample tenants.
    
    Returns:
        List of tenant data dictionaries
    """
    return [tenant.copy() for tenant in SAMPLE_TENANTS]
