"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

DocType module: alert_rule.py
"""
import frappe
from frappe.model.document import Document
from frappe import _
import json
from datetime import datetime, timedelta
import re
import requests
from frappe.utils import now, get_datetime, add_to_date, now_datetime, get_time