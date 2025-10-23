"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

DocType module: message.py
"""
import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, get_datetime
import json
import re
from typing import Dict, Any, List, Optional
from cap.observability import get_logger, MetricsCollector
from cap.compliance.engine import check_message_compliance
        import uuid