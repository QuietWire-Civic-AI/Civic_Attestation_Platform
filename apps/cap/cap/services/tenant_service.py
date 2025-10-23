"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

Service module: tenant_service.py
"""
import frappe
from frappe import _
from typing import Dict, List, Optional
from cap.services.base_service import BaseService
from datetime import datetime
        import re
"""Tenant Management Service

Handles all tenant-related business logic.
"""



class TenantService(BaseService):
    """Tenant Management Service.
    
    Responsibilities:
    - Tenant creation and provisioning
    - Tenant configuration
    - Multi-tenancy enforcement
    - Tenant isolation
    - Subscription management
    """
    
    def create_tenant(self, tenant_data: Dict) -> Dict:
        """Create a new tenant.
        
        Args:
            tenant_data: Tenant information
            {
                "name": "tenant_name",
                "display_name": "Display Name",
                "domain": "tenant.example.com",
                "admin_email": "admin@example.com",
                "plan": "basic",  # basic, professional, enterprise
                "settings": {}  # Custom settings
            }
            
        Returns:
            Created tenant information
        """
        def _create():
            # Validate tenant data
            self._validate_tenant_data(tenant_data)
            
            # Check if tenant already exists
            if frappe.db.exists("Tenant", tenant_data.get("name")):
                raise frappe.ValidationError(_("Tenant already exists"))
            
            # Create tenant document
            tenant = frappe.get_doc({
                "doctype": "Tenant",
                "name": tenant_data.get("name"),
                "tenant_name": tenant_data.get("display_name"),
                "domain": tenant_data.get("domain"),
                "admin_email": tenant_data.get("admin_email"),
                "subscription_plan": tenant_data.get("plan", "basic"),
                "status": "Active",
                "created_at": datetime.now()
            })
            
            tenant.insert()
            
            # Provision tenant resources
            self._provision_tenant(tenant.name, tenant_data)
            
            # Create admin user
            admin_user = self._create_tenant_admin(tenant.name, tenant_data.get("admin_email"))
            
            # Set up default roles and permissions
            self._setup_tenant_permissions(tenant.name)
            
            # Cache tenant data
            self.set_cached(f"tenant:{tenant.name}", tenant.as_dict(), ttl=3600)
            
            self.log_operation(
                "tenant_created",
                tenant_name=tenant.name,
                admin_email=tenant_data.get("admin_email"),
                timestamp=datetime.now().isoformat()
            )
            
            return {
                "success": True,
                "tenant": tenant.as_dict(),
                "admin_user": admin_user
            }
        
        return self.execute_with_metrics("tenant.create", _create)
    
    def get_tenant(self, tenant_name: str) -> Optional[Dict]:
        """Get tenant information.
        
        Args:
            tenant_name: Tenant name
            
        Returns:
            Tenant information or None
        """
        # Try cache first
        cache_key = f"tenant:{tenant_name}"
        cached_tenant = self.get_cached(cache_key)
        
        if cached_tenant:
            return cached_tenant
        
        # Get from database
        if not frappe.db.exists("Tenant", tenant_name):
            return None
        
        tenant = frappe.get_doc("Tenant", tenant_name)
        tenant_dict = tenant.as_dict()
        
        # Cache for 1 hour
        self.set_cached(cache_key, tenant_dict, ttl=3600)
        
        return tenant_dict
    
    def update_tenant(self, tenant_name: str, updates: Dict) -> Dict:
        """Update tenant information.
        
        Args:
            tenant_name: Tenant name
            updates: Fields to update
            
        Returns:
            Updated tenant information
        """
        def _update():
            tenant = frappe.get_doc("Tenant", tenant_name)
            
            for key, value in updates.items():
                if hasattr(tenant, key):
                    setattr(tenant, key, value)
            
            tenant.save()
            
            # Invalidate cache
            self.invalidate_cache(f"tenant:{tenant_name}")
            
            self.log_operation(
                "tenant_updated",
                tenant_name=tenant_name,
                updates=list(updates.keys()),
                timestamp=datetime.now().isoformat()
            )
            
            return tenant.as_dict()
        
        return self.execute_with_metrics("tenant.update", _update)
    
    def get_tenant_users(self, tenant_name: str) -> List[Dict]:
        """Get all users for a tenant.
        
        Args:
            tenant_name: Tenant name
            
        Returns:
            List of users
        """
        cache_key = f"tenant:users:{tenant_name}"
        cached_users = self.get_cached(cache_key)
        
        if cached_users:
            return cached_users
        
        users = frappe.get_all(
            "User",
            filters={"tenant": tenant_name, "enabled": 1},
            fields=["name", "email", "full_name", "user_type", "creation"]
        )
        
        # Cache for 10 minutes
        self.set_cached(cache_key, users, ttl=600)
        
        return users
    
    def enforce_tenant_isolation(self, user: str, doctype: str, doc_name: Optional[str] = None) -> bool:
        """Enforce tenant isolation.
        
        Args:
            user: Username
            doctype: DocType name
            doc_name: Optional document name
            
        Returns:
            True if access is allowed
            
        Raises:
            frappe.PermissionError: If tenant isolation is violated
        """
        # Get user's tenant
        user_tenant = frappe.db.get_value("User", user, "tenant")
        
        if not user_tenant:
            return True  # System users
        
        # If accessing a specific document
        if doc_name:
            doc_tenant = frappe.db.get_value(doctype, doc_name, "tenant")
            
            if doc_tenant and doc_tenant != user_tenant:
                self.log_operation(
                    "tenant_isolation_violation",
                    user=user,
                    user_tenant=user_tenant,
                    doc_tenant=doc_tenant,
                    doctype=doctype,
                    doc_name=doc_name,
                    timestamp=datetime.now().isoformat()
                )
                raise frappe.PermissionError(_("Access denied: Tenant isolation"))
        
        return True
    
    def get_tenant_statistics(self, tenant_name: str) -> Dict:
        """Get tenant statistics.
        
        Args:
            tenant_name: Tenant name
            
        Returns:
            Statistics dictionary
        """
        cache_key = f"tenant:stats:{tenant_name}"
        cached_stats = self.get_cached(cache_key)
        
        if cached_stats:
            return cached_stats
        
        stats = {
            "total_users": frappe.db.count("User", {"tenant": tenant_name, "enabled": 1}),
            "total_documents": self._count_tenant_documents(tenant_name),
            "storage_used": self._calculate_storage_used(tenant_name),
            "active_sessions": self._count_active_sessions(tenant_name),
            "last_activity": self._get_last_activity(tenant_name)
        }
        
        # Cache for 5 minutes
        self.set_cached(cache_key, stats, ttl=300)
        
        return stats
    
    # Private helper methods
    
    def _validate_tenant_data(self, tenant_data: Dict):
        """Validate tenant data."""
        required_fields = ["name", "display_name", "admin_email"]
        
        for field in required_fields:
            if not tenant_data.get(field):
                raise frappe.ValidationError(_(f"Missing required field: {field}"))
        
        # Validate email
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, tenant_data.get("admin_email")):
            raise frappe.ValidationError(_("Invalid admin email"))
    
    def _provision_tenant(self, tenant_name: str, tenant_data: Dict):
        """Provision tenant resources."""
        # Create tenant workspace
        # Set up default settings
        # Initialize tenant database schema (if using separate schemas)
        pass
    
    def _create_tenant_admin(self, tenant_name: str, admin_email: str) -> Dict:
        """Create tenant admin user."""
        # Check if user exists
        if frappe.db.exists("User", admin_email):
            user = frappe.get_doc("User", admin_email)
        else:
            user = frappe.get_doc({
                "doctype": "User",
                "email": admin_email,
                "first_name": "Admin",
                "tenant": tenant_name,
                "user_type": "System User",
                "send_welcome_email": 1
            })
            user.insert()
        
        # Add admin role
        user.add_roles("Tenant Admin")
        
        return {
            "email": user.email,
            "name": user.name
        }
    
    def _setup_tenant_permissions(self, tenant_name: str):
        """Set up default permissions for tenant."""
        # Configure role permissions
        # Set up data access rules
        pass
    
    def _count_tenant_documents(self, tenant_name: str) -> int:
        """Count all documents for a tenant."""
        # This is a simplified version
        # In production, you'd count across all relevant DocTypes
        return 0
    
    def _calculate_storage_used(self, tenant_name: str) -> int:
        """Calculate storage used by tenant (in bytes)."""
        # Count file attachments
        # This is a placeholder
        return 0
    
    def _count_active_sessions(self, tenant_name: str) -> int:
        """Count active sessions for tenant."""
        # Count active user sessions
        return 0
    
    def _get_last_activity(self, tenant_name: str) -> Optional[str]:
        """Get last activity timestamp for tenant."""
        # Get most recent activity
        return None
