"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: heartbeat.py
"""
import frappe
from frappe.utils import now_datetime
# CAP Realtime Heartbeat Module


def send_heartbeat():
    """Send system heartbeat for monitoring"""
    try:
        frappe.publish_realtime(
            event='system_heartbeat',
            message={
                'timestamp': now_datetime().isoformat(),
                'status': 'active'
            },
            room='system_monitoring'
        )
    except Exception as e:
        frappe.log_error(f"Error sending heartbeat: {str(e)}", "CAP Realtime")
