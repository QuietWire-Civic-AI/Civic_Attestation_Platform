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
import frappe
        from cap.ledger.events import log_violation_detected
# CAP Alerts Module


def send_violation_alert(doc, method):
    """Send alert when violation is detected"""
    try:
        # Create realtime alert
        frappe.publish_realtime(
            event='violation_alert',
            message={
                'violation_id': doc.name,
                'violation_type': getattr(doc, 'violation_type', 'Unknown'),
                'severity': getattr(doc, 'severity', 'medium'),
                'tenant': getattr(doc, 'tenant', None),
                'description': getattr(doc, 'description', '')
            },
            room='compliance_alerts'
        )
        
        # Log to audit trail
        log_violation_detected({
            'tenant': getattr(doc, 'tenant', None),
            'violation_type': getattr(doc, 'violation_type', 'Unknown'),
            'severity': getattr(doc, 'severity', 'medium'),
            'doc_name': doc.name,
            'doctype': doc.doctype,
            'details': {
                'description': getattr(doc, 'description', ''),
                'detected_by': frappe.session.user
            }
        })
        
    except Exception as e:
        frappe.log_error(f"Error sending violation alert: {str(e)}", "CAP Alerts")
