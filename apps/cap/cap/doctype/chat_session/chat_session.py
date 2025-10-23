"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

DocType module: chat_session.py
"""
import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, get_datetime, time_diff_in_seconds
import json
from typing import Dict, Any, Optional
from cap.observability import get_logger, MetricsCollector
from cap.services.tenant_service import TenantService
        import uuid