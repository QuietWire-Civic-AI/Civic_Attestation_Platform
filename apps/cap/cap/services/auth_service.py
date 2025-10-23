"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

Service module: auth_service.py
"""
import frappe
from frappe import _
from typing import Dict, Optional, List
from cap.services.base_service import BaseService
from datetime import datetime, timedelta
        import secrets
"""Authentication and Authorization Service

Handles all authentication and authorization logic.
"""



class AuthService(BaseService):
    """Authentication and Authorization Service.
    
    Responsibilities:
    - User authentication
    - Session management
    - Permission validation
    - Role management
    - Multi-factor authentication
    """
    
    def authenticate(self, username: str, password: str, mfa_code: Optional[str] = None) -> Dict:
        """Authenticate user.
        
        Args:
            username: Username or email
            password: User password
            mfa_code: Optional MFA code
            
        Returns:
            Authentication result with session token
            
        Raises:
            frappe.AuthenticationError: If authentication fails
        """
        def _authenticate():
            # Check cache for rate limiting
            attempt_key = f"auth:attempts:{username}"
            attempts = self.get_cached(attempt_key) or 0
            
            if attempts >= 5:
                raise frappe.AuthenticationError(_("Too many failed attempts. Please try again later."))
            
            # Authenticate with Frappe
            try:
                frappe.local.login_manager.authenticate(username, password)
                
                # Check if MFA is required
                if self._is_mfa_required(username):
                    if not mfa_code:
                        return {
                            "success": False,
                            "requires_mfa": True,
                            "message": "MFA code required"
                        }
                    
                    if not self._verify_mfa(username, mfa_code):
                        raise frappe.AuthenticationError(_("Invalid MFA code"))
                
                # Clear failed attempts
                self.invalidate_cache(attempt_key)
                
                # Create session
                session_data = self._create_session(username)
                
                self.log_operation(
                    "user_authenticated",
                    username=username,
                    timestamp=datetime.now().isoformat()
                )
                
                return {
                    "success": True,
                    "session": session_data,
                    "user": self._get_user_info(username)
                }
                
            except frappe.AuthenticationError:
                # Increment failed attempts
                self.set_cached(attempt_key, attempts + 1, ttl=900)  # 15 minutes
                raise
        
        return self.execute_with_metrics("auth.authenticate", _authenticate)
    
    def validate_session(self, session_token: str) -> bool:
        """Validate session token.
        
        Args:
            session_token: Session token to validate
            
        Returns:
            True if valid
        """
        cache_key = f"session:{session_token}"
        session_data = self.get_cached(cache_key)
        
        if not session_data:
            return False
        
        # Check expiration
        if datetime.fromisoformat(session_data.get("expires_at")) < datetime.now():
            self.invalidate_cache(cache_key)
            return False
        
        return True
    
    def check_permission(self, user: str, doctype: str, operation: str, doc_name: Optional[str] = None) -> bool:
        """Check if user has permission.
        
        Args:
            user: Username
            doctype: DocType name
            operation: Operation (read, write, create, delete, etc.)
            doc_name: Optional document name
            
        Returns:
            True if user has permission
        """
        cache_key = f"permission:{user}:{doctype}:{operation}:{doc_name or 'all'}"
        
        # Try cache first
        cached_result = self.get_cached(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Check permission
        has_permission = frappe.has_permission(
            doctype,
            ptype=operation,
            user=user,
            doc=doc_name
        )
        
        # Cache result for 5 minutes
        self.set_cached(cache_key, has_permission, ttl=300)
        
        return has_permission
    
    def get_user_roles(self, user: str) -> List[str]:
        """Get user roles.
        
        Args:
            user: Username
            
        Returns:
            List of role names
        """
        cache_key = f"user:roles:{user}"
        
        cached_roles = self.get_cached(cache_key)
        if cached_roles:
            return cached_roles
        
        roles = frappe.get_roles(user)
        self.set_cached(cache_key, roles, ttl=600)  # 10 minutes
        
        return roles
    
    def logout(self, session_token: str) -> bool:
        """Logout user.
        
        Args:
            session_token: Session token
            
        Returns:
            True if successful
        """
        cache_key = f"session:{session_token}"
        self.invalidate_cache(cache_key)
        
        self.log_operation(
            "user_logged_out",
            session_token=session_token[:10] + "...",  # Log partial token
            timestamp=datetime.now().isoformat()
        )
        
        return True
    
    # Private helper methods
    
    def _is_mfa_required(self, username: str) -> bool:
        """Check if MFA is required for user."""
        # Implementation depends on your MFA settings
        return False  # Placeholder
    
    def _verify_mfa(self, username: str, code: str) -> bool:
        """Verify MFA code."""
        # Implementation depends on your MFA provider
        return True  # Placeholder
    
    def _create_session(self, username: str) -> Dict:
        """Create session data."""
        
        session_token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=24)
        
        session_data = {
            "token": session_token,
            "username": username,
            "created_at": datetime.now().isoformat(),
            "expires_at": expires_at.isoformat()
        }
        
        cache_key = f"session:{session_token}"
        self.set_cached(cache_key, session_data, ttl=86400)  # 24 hours
        
        return session_data
    
    def _get_user_info(self, username: str) -> Dict:
        """Get user information."""
        user = frappe.get_doc("User", username)
        
        return {
            "username": user.name,
            "email": user.email,
            "full_name": user.full_name,
            "roles": self.get_user_roles(username)
        }
