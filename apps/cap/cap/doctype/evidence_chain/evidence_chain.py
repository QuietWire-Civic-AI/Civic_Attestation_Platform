"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

DocType module: evidence_chain.py
"""
from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe import _
import hashlib
import json
from datetime import datetime, timedelta
import uuid
        import time
        import requests
            from cap.doctype.audit_log.audit_log import create_audit_log