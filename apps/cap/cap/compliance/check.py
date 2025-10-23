"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: check.py
"""
import frappe
            from cap.utils.tenant import auto_set_tenant
# CAP Compliance Check Module


def pre_message_check(doc, method):
    """Pre-check message for compliance before saving"""
    try:
        # Basic compliance check - can be expanded
        if hasattr(doc, 'content') and doc.content:
            # Check for prohibited content (basic example)
            prohibited_words = ['spam', 'hack', 'illegal']
            content_lower = doc.content.lower()
            
            for word in prohibited_words:
                if word in content_lower:
                    frappe.throw(f"Message contains prohibited content: {word}")
        
        # Set tenant if not set
        if not getattr(doc, 'tenant', None):
            auto_set_tenant(doc, method)
            
    except Exception as e:
        frappe.log_error(f"Error in pre-message check: {str(e)}", "CAP Compliance")
