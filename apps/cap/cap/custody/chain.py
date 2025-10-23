"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: chain.py
"""
import frappe
from frappe.utils import now_datetime
                from cap.ledger.events import create_ledger_event
# CAP Custody Chain Module


def log_custody_change(doc, method):
    """Log custody chain changes for evidence"""
    try:
        if hasattr(doc, 'get_doc_before_save'):
            old_doc = doc.get_doc_before_save()
            if old_doc and getattr(old_doc, 'custodian', None) != getattr(doc, 'custodian', None):
                # Custody change detected
                
                create_ledger_event(
                    tenant=getattr(doc, 'tenant', None),
                    event_type='custody_changed',
                    subject_doctype=doc.doctype,
                    subject_name=doc.name,
                    actor_user=frappe.session.user,
                    event_data={
                        'old_custodian': getattr(old_doc, 'custodian', None),
                        'new_custodian': getattr(doc, 'custodian', None),
                        'change_reason': getattr(doc, 'custody_reason', 'Not specified'),
                        'timestamp': now_datetime().isoformat()
                    },
                    impact_level='high'
                )
                
    except Exception as e:
        frappe.log_error(f"Error logging custody change: {str(e)}", "CAP Custody")
