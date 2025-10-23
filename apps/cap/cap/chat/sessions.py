"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: sessions.py
"""
import frappe
from frappe.utils import add_days, now_datetime
# CAP Chat Sessions Module


def cleanup_idle_sessions():
    """Clean up idle chat sessions"""
    try:
        # Find sessions idle for more than 24 hours
        cutoff_time = add_days(now_datetime(), -1)
        
        idle_sessions = frappe.get_all(
            'Chat Session',
            filters={
                'modified': ['<', cutoff_time],
                'status': 'Active'
            },
            fields=['name']
        )
        
        for session in idle_sessions:
            frappe.db.set_value('Chat Session', session.name, 'status', 'Idle')
            
        if idle_sessions:
            frappe.db.commit()
            
    except Exception as e:
        frappe.log_error(f"Error cleaning up sessions: {str(e)}", "CAP Chat")
