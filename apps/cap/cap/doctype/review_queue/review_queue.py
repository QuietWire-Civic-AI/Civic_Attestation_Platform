"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

DocType module: review_queue.py
"""
import frappe
from frappe.model.document import Document
from frappe.utils import now, now_datetime, add_days, get_datetime, time_diff_in_hours, add_to_date
from datetime import datetime, timedelta
import json