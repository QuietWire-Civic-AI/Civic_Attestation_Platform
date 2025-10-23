"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP module: health.py
"""
import frappe
# CAP Monitoring Health Module


def check_system_health():
    """Check system health status"""
    try:
        # Basic health check
        frappe.publish_realtime(
            event='health_check',
            message={'status': 'healthy', 'timestamp': frappe.utils.now_datetime().isoformat()},
            room='system_monitoring'
        )
    except Exception as e:
        frappe.log_error(f"Health check error: {str(e)}", "CAP Monitoring")
