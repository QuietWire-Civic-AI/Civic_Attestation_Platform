"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

DocType module: audit_log.py
"""
from __future__ import unicode_literals
import frappe
import json
import uuid
from frappe import _
from frappe.model.document import Document
from frappe.utils import now, get_datetime, add_days, cint, flt, nowdate
from datetime import datetime, timedelta
import hashlib
import re