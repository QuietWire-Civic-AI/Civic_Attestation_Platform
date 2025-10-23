"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: realtime.py
"""
import frappe
# CAP Chat Realtime Module


def broadcast_message(doc, method):
    """Broadcast new message to realtime listeners"""
    try:
        # Publish to specific chat session room
        room = f"chat_session_{getattr(doc, 'session_id', 'unknown')}"
        
        frappe.publish_realtime(
            event='new_message',
            message={
                'message_id': doc.name,
                'session_id': getattr(doc, 'session_id', None),
                'content': getattr(doc, 'content', ''),
                'role': getattr(doc, 'role', 'user'),
                'timestamp': getattr(doc, 'creation', None),
                'tenant': getattr(doc, 'tenant', None)
            },
            room=room
        )
        
        # Also publish to tenant room for notifications
        tenant_room = f"tenant_{getattr(doc, 'tenant', 'all')}"
        frappe.publish_realtime(
            event='tenant_message',
            message={
                'session_id': getattr(doc, 'session_id', None),
                'tenant': getattr(doc, 'tenant', None)
            },
            room=tenant_room
        )
        
    except Exception as e:
        frappe.log_error(f"Error broadcasting message: {str(e)}", "CAP Chat")
