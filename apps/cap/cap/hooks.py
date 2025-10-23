"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)
"""

from frappe import _

app_name = "cap"
app_title = "Civic AI Canon Platform"
app_publisher = "QuietWire"
app_description = "منصة الكانون للذكاء الاصطناعي المدني"
app_version = "1.0.0"
app_color = "#2563eb"
app_icon = "fa fa-shield"
required_apps = ["frappe"]
app_email = "cap@quietwire.ai"
app_license = "Apache-2.0"

# تجميد الواجهة للموقع
website_route_rules = [
    {"from_route": "/cap/<path:app_path>", "to_route": "cap"},
]

# تخصيص الصفحة الرئيسية
website_context = {
    "favicon": "/assets/cap/images/favicon.ico",
    "splash_image": "/assets/cap/images/splash.png",
    "show_language_picker": True,
    "languages": [
        {"code": "en", "name": "English", "flag": "🇬🇧"},
        {"code": "ar", "name": "العربية", "flag": "🇸🇦"},
        {"code": "fr", "name": "Français", "flag": "🇫🇷"},
        {"code": "es", "name": "Español", "flag": "🇪🇸"},
    ]
}

# ==========================================
# أحداث السجلات (Doc Events)
# ==========================================

doc_events = {
    # جميع DocTypes - إضافة tenant_id تلقائياً
    "*": {
        "before_save": "cap.utils.tenant.auto_set_tenant",
        "before_insert": "cap.utils.tenant.validate_tenant_access",
    },
    
    # دفتر الأستاذ - تسجيل كل تغيير مهم
    "Policy": {
        "after_insert": "cap.ledger.events.log_policy_created",
        "on_update": "cap.ledger.events.log_policy_updated",
        "on_submit": "cap.ledger.events.log_policy_published",
    },
    
    "Evidence": {
        "after_insert": "cap.ledger.events.log_evidence_added",
        "on_update": "cap.custody.chain.log_custody_change",
    },
    
    "Message": {
        "before_insert": "cap.compliance.check.pre_message_check",
        "after_insert": "cap.chat.realtime.broadcast_message",
    },
    
    "Violation": {
        "after_insert": "cap.alerts.send_violation_alert",
        "on_update": "cap.compliance.workflow.handle_violation_update",
    },
    
    "Audit Log": {
        "after_insert": "cap.doctype.audit_log.audit_log.evaluate_alert_rules",
    }
}

# ==========================================
# المهام المجدولة (Scheduled Jobs)
# ==========================================

scheduler_events = {
    # كل دقيقة - التحديثات الفورية
    "cron": {
        "* * * * *": [
            "cap.realtime.heartbeat.send_heartbeat",
            "cap.chat.sessions.cleanup_idle_sessions",
            "cap.doctype.alert_rule.alert_rule.check_all_alert_rules",
        ]
    },
    
    # كل 5 دقائق - فحوص سريعة
    "cron": {
        "*/5 * * * *": [
            "cap.compliance.engine.run_quick_checks",
            "cap.monitoring.health.check_system_health",
        ]
    },
    
    # كل ساعة - معالجة دفعية
    "hourly": [
        "cap.ledger.anchor.batch_anchor_to_blockchain",
        "cap.analytics.metrics.calculate_hourly_metrics",
        "cap.compliance.engine.run_scheduled_scans",
    ],
    
    # يومياً - تقارير وتنظيف
    "daily": [
        "cap.reports.daily.generate_daily_reports",
        "cap.cleanup.sessions.archive_old_sessions",
        "cap.backup.evidence.backup_evidence_files",
    ],
    
    # أسبوعياً - تحليلات عميقة
    "weekly": [
        "cap.analytics.reports.generate_weekly_compliance_report",
        "cap.maintenance.cleanup.cleanup_expired_data",
    ],
}

# ==========================================
# استعلامات الصلاحيات (Permission Queries)
# ==========================================

permission_query_conditions = {
    # فلترة حسب المستأجر لجميع DocTypes
    "Tenant": "cap.permissions.tenant.get_tenant_condition",
    "Policy": "cap.permissions.tenant.get_tenant_condition", 
    "Evidence": "cap.permissions.tenant.get_tenant_condition",
    "Ledger Event": "cap.permissions.tenant.get_tenant_condition",
    "Message": "cap.permissions.tenant.get_tenant_condition",
    "Chat Session": "cap.permissions.tenant.get_tenant_condition",
    "Canon Project": "cap.permissions.tenant.get_tenant_condition",
    "Violation": "cap.permissions.tenant.get_tenant_condition",
}

# ==========================================
# مساحات العمل (Workspaces)
# ==========================================

fixtures = [
    {"dt": "Workspace", "filters": [["module", "in", ["CAP Core", "CAP AI", "CAP Compliance"]]]},
    {"dt": "Role", "filters": [["name", "like", "CAP%"]]},
    {"dt": "Custom Field", "filters": [["dt", "like", "%CAP%"]]},
    {"dt": "Workflow", "filters": [["name", "like", "CAP%"]]},
    {"dt": "Workflow State", "filters": [["name", "like", "CAP%"]]},
]

# ==========================================
# تخصيص رسائل البريد الإلكتروني
# ==========================================

standard_email_footer = """
<div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
    <p>هذه رسالة تلقائية من منصة الكانون للذكاء الاصطناعي المدني</p>
    <p>© 2025 جميع الحقوق محفوظة</p>
</div>
"""

# ==========================================
# تخصيص الواجهة
# ==========================================

app_include_css = [
    "/assets/cap/css/cap_custom.css",
    "/assets/cap/css/arabic_rtl.css",
    "/assets/cap/css/multilang.css",
]

app_include_js = [
    "/assets/cap/js/cap_common.js", 
    "/assets/cap/js/realtime_handler.js",
    "/assets/cap/js/tenant_filter.js",
    "/assets/cap/js/language_switcher.js",
]

# تخصيص أيقونات DocTypes
doctype_js = {
    "Policy": "public/js/policy.js",
    "Chat Session": "public/js/chat_session.js",
    "Evidence": "public/js/evidence.js",
    "Tenant": "public/js/tenant.js",
}

# تخصيص قوائم DocTypes
doctype_list_js = {
    "Policy": "public/js/policy_list.js",
    "Message": "public/js/message_list.js",
}

# ==========================================
# API للتطبيقات الخارجية
# ==========================================

# لا تحتاج مصادقة
allow_guest_to_upload_files = False

# مسارات لا تحتاج مصادقة للموقع العام
guest_allowed = [
    "cap.api.public.get_platform_info",
    "cap.api.public.health_check",
]

# ==========================================
# Integration Settings
# ==========================================

sounds = [
    {"name": "new-message", "src": "/assets/cap/audio/new_message.mp3", "volume": 0.5},
    {"name": "violation-alert", "src": "/assets/cap/audio/alert.mp3", "volume": 0.8},
]

# ==========================================
# Override Standard Frappe Methods
# ==========================================

override_whitelisted_methods = {
    "frappe.desk.search.search_link": "cap.search.override.search_link",
    "frappe.desk.reportview.get": "cap.search.override.get_list",
}

# ==========================================
# Jinja Environment
# ==========================================

jenv = {
    "methods": [
        "cap.utils.jinja.get_tenant_context",
        "cap.utils.jinja.format_arabic_date",
        "cap.utils.jinja.get_policy_status_color",
    ]
}

# ==========================================
# After Install
# ==========================================

after_install = "cap.setup.install.after_install"

# ==========================================
# تخصيص القوائم
# ==========================================

has_website_permission = {
    "Policy": "cap.permissions.website.has_website_permission",
    "Canon Project": "cap.permissions.website.has_website_permission",
}

# ==========================================
# Boot Session
# ==========================================

boot_session = "cap.boot.get_boot_info"