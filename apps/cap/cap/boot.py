"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

Boot session information for CAP platform
Provides context and settings for the current user session
"""

import frappe
from cap.utils.tenant import get_current_tenant, get_user_tenants, is_system_manager

def get_boot_info():
    """
    Get boot information for CAP platform
    This function is called when a user session starts
    """
    boot_info = {}
    
    try:
        # Get current user
        user = frappe.session.user
        
        if user and user != 'Guest':
            # Get tenant context
            boot_info.update(get_tenant_context(user))
            
            # Get user permissions
            boot_info.update(get_user_permissions(user))
            
            # Get platform settings
            boot_info.update(get_platform_settings())
            
            # Get compliance settings
            boot_info.update(get_compliance_settings())
            
    except Exception as e:
        frappe.log_error(f"Error in get_boot_info: {str(e)}")
        # Return minimal boot info on error
        boot_info = {
            'tenant_id': None,
            'is_tenant_admin': False,
            'is_system_manager': False,
            'error': 'Failed to load boot information'
        }
    
    return boot_info

def get_tenant_context(user):
    """Get tenant-related context for the user"""
    context = {
        'tenant_id': None,
        'tenant_name': None,
        'tenant_slug': None,
        'tenant_plan': None,
        'tenant_status': None,
        'user_tenants': [],
        'is_tenant_admin': False,
        'tenant_limits': {}
    }
    
    try:
        # Get current tenant
        current_tenant = get_current_tenant()
        
        if current_tenant:
            # Get tenant details
            tenant_doc = frappe.get_doc('Tenant', current_tenant)
            context.update({
                'tenant_id': tenant_doc.name,
                'tenant_name': tenant_doc.tenant_name,
                'tenant_slug': tenant_doc.tenant_slug,
                'tenant_plan': tenant_doc.plan_type,
                'tenant_status': tenant_doc.status,
                'tenant_limits': {
                    'max_users': tenant_doc.max_users,
                    'storage_limit_gb': tenant_doc.storage_limit_gb,
                    'api_rate_limit': get_api_rate_limit(tenant_doc.plan_type)
                }
            })
            
            # Check if user is tenant admin
            context['is_tenant_admin'] = frappe.db.exists('User Role', {
                'parent': user,
                'role': f'CAP Admin - {tenant_doc.tenant_slug}'
            }) or is_system_manager(user)
        
        # Get all accessible tenants
        context['user_tenants'] = get_user_tenants(user)
        
    except Exception as e:
        frappe.log_error(f"Error getting tenant context for user {user}: {str(e)}")
    
    return context

def get_user_permissions(user):
    """Get user permissions and capabilities"""
    permissions = {
        'is_system_manager': is_system_manager(user),
        'can_create_tenants': False,
        'can_view_audit_logs': False,
        'can_export_data': False,
        'can_manage_compliance': False,
        'can_access_ai': False,
        'enabled_features': []
    }
    
    try:
        user_roles = frappe.get_all('User Role', 
            filters={'parent': user}, 
            pluck='role'
        )
        
        # Check specific permissions based on roles
        if 'System Manager' in user_roles:
            permissions.update({
                'can_create_tenants': True,
                'can_view_audit_logs': True,
                'can_export_data': True,
                'can_manage_compliance': True,
                'can_access_ai': True
            })
        
        # Check CAP specific roles
        cap_admin_roles = [role for role in user_roles if role.startswith('CAP Admin')]
        if cap_admin_roles:
            permissions.update({
                'can_view_audit_logs': True,
                'can_export_data': True,
                'can_manage_compliance': True,
                'can_access_ai': True
            })
        
        cap_user_roles = [role for role in user_roles if role.startswith('CAP User')]
        if cap_user_roles:
            permissions.update({
                'can_access_ai': True
            })
        
        # Get enabled features based on tenant plan
        current_tenant = get_current_tenant()
        if current_tenant:
            tenant_plan = frappe.db.get_value('Tenant', current_tenant, 'plan_type')
            permissions['enabled_features'] = get_enabled_features(tenant_plan)
        
    except Exception as e:
        frappe.log_error(f"Error getting user permissions for {user}: {str(e)}")
    
    return permissions

def get_platform_settings():
    """Get platform-wide settings"""
    settings = {
        'platform_name': 'Civic AI Canon Platform',
        'platform_version': '1.0.0',
        'api_version': 'v1',
        'max_file_size_mb': 100,
        'supported_file_types': [
            'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 
            'png', 'gif', 'mp4', 'mp3', 'wav'
        ],
        'realtime_enabled': True,
        'blockchain_enabled': True,
        'ai_providers': [],
        'default_language': 'en',
        'supported_languages': ['en', 'ar', 'fr', 'es'],
        'rtl_enabled': True
    }
    
    try:
        # Get user's preferred language
        user = frappe.session.user
        if user and user != 'Guest':
            user_lang = get_user_language(user)
            settings['user_language'] = user_lang
            settings['is_rtl'] = user_lang == 'ar'
        
        # Get AI providers configuration
        ai_providers = frappe.get_all('AI Provider', 
            filters={'enabled': 1},
            fields=['name', 'provider_name', 'provider_type']
        )
        settings['ai_providers'] = ai_providers
        
        # Get system settings
        system_settings = frappe.get_single('System Settings')
        if system_settings:
            settings.update({
                'default_language': system_settings.language or 'en',
                'timezone': system_settings.time_zone or 'Asia/Riyadh'
            })
        
    except Exception as e:
        frappe.log_error(f"Error getting platform settings: {str(e)}")
    
    return settings

def get_compliance_settings():
    """Get compliance and security settings"""
    compliance = {
        'compliance_enabled': True,
        'audit_logging': True,
        'data_retention_days': 2555,  # 7 years
        'encryption_enabled': True,
        'blockchain_anchoring': True,
        'violation_alerts': True,
        'auto_compliance_checks': True,
        'security_headers': True
    }
    
    try:
        # Get tenant-specific compliance settings
        current_tenant = get_current_tenant()
        if current_tenant:
            tenant_settings = frappe.db.get_value('Tenant', current_tenant, 'settings')
            if tenant_settings:
                import json
                tenant_compliance = json.loads(tenant_settings).get('compliance', {})
                compliance.update(tenant_compliance)
        
        # Get global compliance policies
        active_policies = frappe.get_all('Compliance Policy',
            filters={'enabled': 1},
            fields=['name', 'policy_type', 'severity']
        )
        compliance['active_policies'] = active_policies
        
    except Exception as e:
        frappe.log_error(f"Error getting compliance settings: {str(e)}")
    
    return compliance

def get_api_rate_limit(plan_type):
    """Get API rate limits based on plan type"""
    rate_limits = {
        'Trial': {'requests_per_minute': 60, 'requests_per_hour': 1000},
        'Basic': {'requests_per_minute': 120, 'requests_per_hour': 5000},
        'Professional': {'requests_per_minute': 300, 'requests_per_hour': 15000},
        'Enterprise': {'requests_per_minute': 1000, 'requests_per_hour': 50000}
    }
    
    return rate_limits.get(plan_type, rate_limits['Trial'])

def get_enabled_features(plan_type):
    """Get enabled features based on plan type"""
    all_features = [
        'basic_ai_chat', 'policy_management', 'evidence_storage',
        'audit_logging', 'compliance_checks', 'file_management',
        'advanced_ai_models', 'custom_workflows', 'api_access',
        'blockchain_anchoring', 'advanced_analytics', 'white_label',
        'priority_support', 'sso_integration', 'advanced_security'
    ]
    
    plan_features = {
        'Trial': [
            'basic_ai_chat', 'policy_management', 'evidence_storage',
            'audit_logging', 'file_management'
        ],
        'Basic': [
            'basic_ai_chat', 'policy_management', 'evidence_storage',
            'audit_logging', 'compliance_checks', 'file_management',
            'api_access'
        ],
        'Professional': [
            'basic_ai_chat', 'policy_management', 'evidence_storage',
            'audit_logging', 'compliance_checks', 'file_management',
            'advanced_ai_models', 'custom_workflows', 'api_access',
            'blockchain_anchoring', 'advanced_analytics'
        ],
        'Enterprise': all_features
    }
    
    return plan_features.get(plan_type, plan_features['Trial'])

def update_user_context(user_context):
    """Update user context in session"""
    try:
        frappe.local.user_context = user_context
        
        # Store tenant context in session for quick access
        if user_context.get('tenant_id'):
            frappe.local.tenant_id = user_context['tenant_id']
        
    except Exception as e:
        frappe.log_error(f"Error updating user context: {str(e)}")

def clear_user_context():
    """Clear user context on logout"""
    try:
        if hasattr(frappe.local, 'user_context'):
            del frappe.local.user_context
        
        if hasattr(frappe.local, 'tenant_id'):
            del frappe.local.tenant_id
            
    except Exception as e:
        frappe.log_error(f"Error clearing user context: {str(e)}")

@frappe.whitelist()
def switch_tenant(tenant_id):
    """Switch to a different tenant"""
    try:
        user = frappe.session.user
        
        # Check if user has access to this tenant
        user_tenants = get_user_tenants(user)
        
        if tenant_id not in user_tenants and not is_system_manager(user):
            frappe.throw("Access denied to this tenant")
        
        # Update session context
        frappe.local.tenant_id = tenant_id
        
        # Return updated boot info
        return get_boot_info()
        
    except Exception as e:
        frappe.log_error(f"Error switching tenant: {str(e)}")
        frappe.throw("Failed to switch tenant")

@frappe.whitelist()
def get_tenant_switch_options():
    """Get list of tenants user can switch to"""
    try:
        user = frappe.session.user
        user_tenants = get_user_tenants(user)
        
        tenant_options = []
        for tenant_id in user_tenants:
            tenant_info = frappe.db.get_value('Tenant', tenant_id, 
                ['tenant_name', 'tenant_slug', 'status'], as_dict=True)
            
            if tenant_info:
                tenant_options.append({
                    'value': tenant_id,
                    'label': tenant_info.tenant_name,
                    'slug': tenant_info.tenant_slug,
                    'status': tenant_info.status,
                    'current': tenant_id == get_current_tenant()
                })
        
        return tenant_options
        
    except Exception as e:
        frappe.log_error(f"Error getting tenant switch options: {str(e)}")
        return []

def get_user_language(user=None):
    """Get user's preferred language"""
    try:
        if not user:
            user = frappe.session.user
        
        if user == 'Guest':
            return 'en'
        
        # Try to get from User Profile
        if frappe.db.exists('User Profile', user):
            user_profile = frappe.get_doc('User Profile', user)
            if user_profile.language:
                return user_profile.language
        
        # Fallback to User doctype
        user_lang = frappe.db.get_value('User', user, 'language')
        if user_lang:
            return user_lang
        
        # Default to English
        return 'en'
        
    except Exception as e:
        frappe.log_error(f"Error getting user language: {str(e)}")
        return 'en'

@frappe.whitelist()
def set_user_language(language):
    """Set user's preferred language"""
    try:
        user = frappe.session.user
        
        if language not in ['en', 'ar', 'fr', 'es']:
            frappe.throw("Invalid language code")
        
        # Update User Profile if exists
        if frappe.db.exists('User Profile', user):
            user_profile = frappe.get_doc('User Profile', user)
            user_profile.language = language
            user_profile.save(ignore_permissions=True)
        
        # Update session language
        frappe.local.lang = language
        frappe.cache().hset('user_language', user, language)
        
        return {'success': True, 'language': language}
        
    except Exception as e:
        frappe.log_error(f"Error setting user language: {str(e)}")
        frappe.throw("Failed to set language")