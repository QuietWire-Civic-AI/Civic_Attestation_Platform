"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

DocType module: violation.py
"""
from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe import _
import json
from datetime import datetime, timedelta
            from frappe.utils import getdate, nowdate, add_days
        from frappe.utils import get_datetime
            from cap.doctype.system_settings.system_settings import get_system_settings
            from cap.doctype.system_settings.system_settings import get_system_settings
            import requests
            import requests