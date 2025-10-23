"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: workflow.py
"""
import frappe
# CAP Compliance Workflow Module


def handle_violation_update(doc, method):
    """Handle violation status updates"""
    try:
        if hasattr(doc, 'get_doc_before_save'):
            old_doc = doc.get_doc_before_save()
            if old_doc and getattr(old_doc, 'status', None) != getattr(doc, 'status', None):
                # Status changed
                frappe.publish_realtime(
                    event='violation_status_changed',
                    message={
                        'violation_id': doc.name,
                        'old_status': getattr(old_doc, 'status', None),
                        'new_status': getattr(doc, 'status', None),
                        'tenant': getattr(doc, 'tenant', None)
                    },
                    room=f"tenant_{getattr(doc, 'tenant', 'all')}"
                )
                
    except Exception as e:
        frappe.log_error(f"Error handling violation update: {str(e)}", "CAP Compliance")
