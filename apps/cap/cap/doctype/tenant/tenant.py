"""
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)
"""

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime, add_days, cstr
import secrets
import hashlib
import uuid

class Tenant(Document):
    def before_insert(self):
        """تعيين القيم الافتراضية قبل الإدراج"""
        # Get system settings for defaults
        try:
            from cap.doctype.system_settings.system_settings import get_system_settings
            settings = get_system_settings()
            
            # Apply default tenant plan from system settings
            if not self.plan_type and settings.enable_multi_tenancy:
                self.plan_type = settings.default_tenant_plan
            
            # Apply default data retention
            if not self.data_retention_days and settings.data_retention_days:
                self.data_retention_days = settings.data_retention_days
            
            # Apply compliance framework from system settings
            if not self.compliance_framework and settings.active_compliance_frameworks:
                self.compliance_framework = settings.active_compliance_frameworks
            
            # Apply tenant data isolation level
            if settings.enable_multi_tenancy and settings.tenant_data_isolation:
                self.data_isolation = settings.tenant_data_isolation
                
        except Exception as e:
            frappe.log_error(f"Failed to apply system settings to tenant: {str(e)}")
        
        # إنشاء API Key فريد
        if not self.api_key:
            self.api_key = secrets.token_urlsafe(32)
            
        # إنشاء مفتاح التشفير
        if not self.encryption_key:
            self.encryption_key = secrets.token_urlsafe(32)
            
        # إنشاء tenant_id فريد
        if not self.tenant_id:
            self.tenant_id = str(uuid.uuid4())
            
        # تعيين slug إذا لم يكن موجود
        if not self.tenant_slug:
            self.tenant_slug = self.generate_slug()
            
        # تعيين الحالة الافتراضية
        if not self.status:
            self.status = "Trial"
            
        # تعيين تاريخ بداية التجربة
        if not self.subscription_start:
            self.subscription_start = frappe.utils.today()
            
        # تعيين تاريخ انتهاء التجربة (30 يوم)
        if not self.subscription_end and self.plan_type == "Trial":
            self.subscription_end = add_days(self.subscription_start, 30)
            
        # تعيين المنشئ
        self.created_by = frappe.session.user
    
    def before_save(self):
        """التحقق من صحة البيانات قبل الحفظ"""
        # التحقق من صحة النطاق
        if self.domain and not self.is_valid_domain():
            frappe.throw("نطاق غير صحيح")
            
        # التحقق من صحة البريد الإلكتروني
        if self.contact_email:
            self.validate_email(self.contact_email)
            
        if self.billing_email:
            self.validate_email(self.billing_email)
            
        # التحقق من حدود التخزين
        if self.storage_limit_gb and self.storage_limit_gb <= 0:
            frappe.throw("حد التخزين يجب أن يكون أكبر من صفر")
            
        # التحقق من عدد المستخدمين
        if self.max_users and self.max_users <= 0:
            frappe.throw("الحد الأقصى للمستخدمين يجب أن يكون أكبر من صفر")
            
        # تحديث معدل البيانات
        self.modified_by = frappe.session.user
    
    def after_insert(self):
        """الإجراءات بعد إنشاء المستأجر"""
        # إنشاء Workspace خاص بالمستأجر
        self.create_tenant_workspace()
        
        # إنشاء الأدوار الافتراضية
        self.create_default_roles()
        
        # إنشاء المجلدات الافتراضية
        self.create_default_folders()
        
        # تسجيل في دفتر الأستاذ
        self.log_creation_event()
        
        # إرسال بريد ترحيب
        self.send_welcome_email()
    
    def on_update(self):
        """الإجراءات عند التحديث"""
        # تسجيل التغييرات في دفتر الأستاذ
        if self.has_value_changed("status"):
            self.log_status_change()
            
        # تحديث صلاحيات المستخدمين عند تغيير الحالة
        if self.status == "Suspended":
            self.suspend_tenant_users()
        elif self.status == "Active":
            self.activate_tenant_users()
    
    def generate_slug(self):
        """إنشاء slug فريد للمستأجر"""
        import re
        # تنظيف الاسم لإنشاء slug
        slug = re.sub(r'[^\w\s-]', '', self.tenant_name.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        
        # التحقق من التفرد
        counter = 1
        original_slug = slug
        while frappe.db.exists("Tenant", {"tenant_slug": slug}):
            slug = f"{original_slug}-{counter}"
            counter += 1
            
        return slug
    
    def is_valid_domain(self):
        """التحقق من صحة النطاق"""
        import re
        pattern = r'^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9]$'
        return re.match(pattern, self.domain) is not None
    
    def validate_email(self, email):
        """التحقق من صحة البريد الإلكتروني"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            frappe.throw(f"بريد إلكتروني غير صحيح: {email}")
    
    def create_tenant_workspace(self):
        """إنشاء Workspace مخصص للمستأجر"""
        try:
            workspace = frappe.get_doc({
                "doctype": "Workspace",
                "title": f"{self.tenant_name} - مساحة العمل",
                "name": f"cap-{self.tenant_slug}",
                "module": "CAP Core",
                "is_standard": 0,
                "public": 0,
                "parent_page": "CAP Dashboard",
                "content": self.get_workspace_content(),
            })
            workspace.insert(ignore_permissions=True)
        except Exception as e:
            frappe.log_error(f"خطأ في إنشاء workspace للمستأجر {self.name}: {str(e)}")
    
    def get_workspace_content(self):
        """محتوى مساحة العمل للمستأجر"""
        return f"""
        [
            {{
                "type": "shortcut",
                "data": {{
                    "type": "DocType",
                    "name": "Policy",
                    "label": "السياسات",
                    "icon": "file-text"
                }}
            }},
            {{
                "type": "shortcut", 
                "data": {{
                    "type": "DocType",
                    "name": "Chat Session",
                    "label": "المحادثات",
                    "icon": "message-circle"
                }}
            }},
            {{
                "type": "shortcut",
                "data": {{
                    "type": "DocType", 
                    "name": "Evidence",
                    "label": "الأدلة",
                    "icon": "shield"
                }}
            }}
        ]
        """
    
    def create_default_roles(self):
        """إنشاء الأدوار الافتراضية للمستأجر"""
        default_roles = [
            {
                "name": f"CAP Admin - {self.tenant_slug}",
                "description": f"مدير منصة CAP للمستأجر {self.tenant_name}",
                "permissions": ["create", "read", "write", "delete", "export"]
            },
            {
                "name": f"CAP User - {self.tenant_slug}",
                "description": f"مستخدم منصة CAP للمستأجر {self.tenant_name}",
                "permissions": ["create", "read", "write", "export"]
            },
            {
                "name": f"CAP Auditor - {self.tenant_slug}",
                "description": f"مراجع منصة CAP للمستأجر {self.tenant_name}",
                "permissions": ["read", "export"]
            }
        ]
        
        for role_data in default_roles:
            try:
                if not frappe.db.exists("Role", role_data["name"]):
                    role = frappe.get_doc({
                        "doctype": "Role", 
                        "role_name": role_data["name"],
                        "desk_access": 1,
                        "disabled": 0,
                    })
                    role.insert(ignore_permissions=True)
            except Exception as e:
                frappe.log_error(f"خطأ في إنشاء دور {role_data['name']}: {str(e)}")
    
    def create_default_folders(self):
        """إنشاء المجلدات الافتراضية"""
        try:
            # مجلد أساسي للمستأجر
            folder_name = f"CAP/{self.tenant_slug}"
            if not frappe.db.exists("File", {"is_folder": 1, "file_name": folder_name}):
                frappe.get_doc({
                    "doctype": "File",
                    "file_name": folder_name,
                    "is_folder": 1,
                    "folder": "Home/CAP",
                }).insert(ignore_permissions=True)
        except Exception as e:
            frappe.log_error(f"خطأ في إنشاء المجلدات للمستأجر {self.name}: {str(e)}")
    
    def log_creation_event(self):
        """تسجيل إنشاء المستأجر في دفتر الأستاذ"""
        try:
            frappe.get_doc({
                "doctype": "Ledger Event",
                "tenant": self.name,
                "event_type": "tenant_created",
                "subject_doctype": "Tenant",
                "subject_name": self.name,
                "actor_user": frappe.session.user,
                "event_data": frappe.as_json({
                    "tenant_name": self.tenant_name,
                    "domain": self.domain,
                    "plan_type": self.plan_type,
                    "status": self.status
                }),
                "timestamp": now_datetime()
            }).insert(ignore_permissions=True)
        except Exception as e:
            frappe.log_error(f"خطأ في تسجيل إنشاء المستأجر {self.name}: {str(e)}")
    
    def log_status_change(self):
        """تسجيل تغيير حالة المستأجر"""
        try:
            frappe.get_doc({
                "doctype": "Ledger Event", 
                "tenant": self.name,
                "event_type": "tenant_status_changed",
                "subject_doctype": "Tenant",
                "subject_name": self.name,
                "actor_user": frappe.session.user,
                "event_data": frappe.as_json({
                    "old_status": self.get_doc_before_save().status if self.get_doc_before_save() else None,
                    "new_status": self.status,
                    "reason": "Status changed by admin"
                }),
                "timestamp": now_datetime()
            }).insert(ignore_permissions=True)
        except Exception as e:
            frappe.log_error(f"خطأ في تسجيل تغيير حالة المستأجر {self.name}: {str(e)}")
    
    def suspend_tenant_users(self):
        """تعليق جميع مستخدمي المستأجر"""
        try:
            users = frappe.get_all("User", filters={"tenant": self.name}, pluck="name")
            for user in users:
                frappe.db.set_value("User", user, "enabled", 0)
            frappe.db.commit()
        except Exception as e:
            frappe.log_error(f"خطأ في تعليق مستخدمي المستأجر {self.name}: {str(e)}")
    
    def activate_tenant_users(self):
        """تفعيل جميع مستخدمي المستأجر"""
        try:
            users = frappe.get_all("User", filters={"tenant": self.name}, pluck="name")
            for user in users:
                frappe.db.set_value("User", user, "enabled", 1)
            frappe.db.commit()
        except Exception as e:
            frappe.log_error(f"خطأ في تفعيل مستخدمي المستأجر {self.name}: {str(e)}")
    
    def send_welcome_email(self):
        """إرسال بريد ترحيب للمستأجر الجديد"""
        if not self.contact_email:
            return
            
        try:
            frappe.sendmail(
                recipients=[self.contact_email],
                subject=f"مرحباً بك في منصة الكانون للذكاء الاصطناعي المدني",
                template="tenant_welcome",
                args={
                    "tenant": self,
                    "login_url": frappe.utils.get_url(),
                },
                now=True
            )
        except Exception as e:
            frappe.log_error(f"خطأ في إرسال بريد الترحيب للمستأجر {self.name}: {str(e)}")
    
    @frappe.whitelist()
    def get_usage_stats(self):
        """إحصائيات استخدام المستأجر"""
        try:
            stats = {
                "users_count": frappe.db.count("User", {"tenant": self.name}),
                "policies_count": frappe.db.count("Policy", {"tenant": self.name}),
                "chat_sessions_count": frappe.db.count("Chat Session", {"tenant": self.name}),
                "evidence_count": frappe.db.count("Evidence", {"tenant": self.name}),
                "storage_used": self.calculate_storage_usage(),
                "last_activity": self.get_last_activity(),
            }
            return stats
        except Exception as e:
            frappe.log_error(f"خطأ في جلب إحصائيات المستأجر {self.name}: {str(e)}")
            return {}
    
    def calculate_storage_usage(self):
        """حساب المساحة المستخدمة"""
        try:
            # حساب مساحة الملفات المرتبطة بالمستأجر
            files = frappe.get_all(
                "File",
                filters={"attached_to_doctype": ["in", ["Policy", "Evidence", "Message"]]},
                fields=["file_size"]
            )
            total_size = sum([f.file_size or 0 for f in files])
            return round(total_size / (1024**3), 2)  # تحويل إلى GB
        except Exception as e:
            frappe.log_error(f"خطأ في حساب المساحة المستخدمة للمستأجر {self.name}: {str(e)}")
            return 0
    
    def get_last_activity(self):
        """آخر نشاط للمستأجر"""
        try:
            last_login = frappe.db.sql("""
                SELECT MAX(last_active)
                FROM `tabUser`
                WHERE tenant = %s
            """, (self.name,))
            return last_login[0][0] if last_login and last_login[0][0] else None
        except Exception as e:
            frappe.log_error(f"خطأ في جلب آخر نشاط للمستأجر {self.name}: {str(e)}")
            return None
    
    @frappe.whitelist()
    def regenerate_api_key(self):
        """إعادة إنشاء مفتاح API"""
        self.api_key = secrets.token_urlsafe(32)
        self.save(ignore_permissions=True)
        
        # تسجيل الحدث
        frappe.get_doc({
            "doctype": "Ledger Event",
            "tenant": self.name,
            "event_type": "api_key_regenerated", 
            "subject_doctype": "Tenant",
            "subject_name": self.name,
            "actor_user": frappe.session.user,
            "event_data": frappe.as_json({"action": "API key regenerated"}),
            "timestamp": now_datetime()
        }).insert(ignore_permissions=True)
        
        return {"message": "تم إعادة إنشاء مفتاح API بنجاح"}
    
    @frappe.whitelist()
    def get_compliance_summary(self):
        """الحصول على ملخص الامتثال للمستأجر"""
        try:
            summary = {
                "total_policies": frappe.db.count("Policy", {"tenant": self.name}),
                "total_assessments": frappe.db.count("Compliance Assessment", {"tenant": self.name}),
                "total_violations": frappe.db.count("Violation", {"tenant": self.name}),
                "total_evidence": frappe.db.count("Evidence", {"tenant": self.name}),
                "compliance_framework": self.compliance_framework or "Not Set",
                "audit_enabled": self.audit_enabled,
                "data_retention_days": self.data_retention_days
            }
            
            # حساب معدل الامتثال
            if summary["total_assessments"] > 0:
                passed_assessments = frappe.db.count(
                    "Compliance Assessment",
                    {"tenant": self.name, "status": "Compliant"}
                )
                summary["compliance_rate"] = round(
                    (passed_assessments / summary["total_assessments"]) * 100, 2
                )
            else:
                summary["compliance_rate"] = 0
            
            # أحدث تقييم
            latest_assessment = frappe.get_all(
                "Compliance Assessment",
                filters={"tenant": self.name},
                fields=["name", "assessment_date", "status"],
                order_by="assessment_date DESC",
                limit=1
            )
            summary["latest_assessment"] = latest_assessment[0] if latest_assessment else None
            
            return summary
        except Exception as e:
            frappe.log_error(f"خطأ في الحصول على ملخص الامتثال للمستأجر {self.name}: {str(e)}")
            return {}
    
    @frappe.whitelist()
    def update_monthly_stats(self):
        """تحديث الإحصائيات الشهرية"""
        try:
            import calendar
            from datetime import datetime
            
            current_date = datetime.now()
            current_month = calendar.month_name[current_date.month]
            current_year = current_date.year
            
            # التحقق من وجود إحصائيات للشهر الحالي
            existing_stat = None
            for stat in self.monthly_stats or []:
                if stat.month == current_month and stat.year == current_year:
                    existing_stat = stat
                    break
            
            # حساب الإحصائيات
            stats_data = {
                "month": current_month,
                "year": current_year,
                "active_users": frappe.db.count("User", {"tenant": self.name, "enabled": 1}),
                "total_sessions": frappe.db.count("Chat Session", {"tenant": self.name}),
                "policies_created": frappe.db.count("Policy", {"tenant": self.name}),
                "assessments_completed": frappe.db.count("Compliance Assessment", {"tenant": self.name}),
                "storage_used_gb": self.calculate_storage_usage(),
                "api_calls": self.get_api_calls_count()
            }
            
            if existing_stat:
                # تحديث الإحصائيات الموجودة
                for key, value in stats_data.items():
                    setattr(existing_stat, key, value)
            else:
                # إضافة إحصائيات جديدة
                self.append("monthly_stats", stats_data)
            
            self.save(ignore_permissions=True)
            return {"message": "تم تحديث الإحصائيات الشهرية بنجاح", "stats": stats_data}
        except Exception as e:
            frappe.log_error(f"خطأ في تحديث الإحصائيات الشهرية للمستأجر {self.name}: {str(e)}")
            return {"message": "حدث خطأ في التحديث"}
    
    def get_api_calls_count(self):
        """حساب عدد استدعاءات API للشهر الحالي"""
        try:
            from datetime import datetime
            current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0)
            
            count = frappe.db.count(
                "API Log",
                {
                    "tenant": self.name,
                    "timestamp": [">=", current_month_start]
                }
            )
            return count
        except Exception:
            return 0
    
    @frappe.whitelist()
    def initialize_features(self):
        """تهيئة الميزات بناءً على نوع الخطة"""
        try:
            # تحديد الميزات بناءً على نوع الخطة
            features_map = {
                "Trial": [
                    {"feature_name": "AI Chat", "enabled": 1, "feature_limit": 100},
                    {"feature_name": "Policy Management", "enabled": 1, "feature_limit": 10},
                    {"feature_name": "Compliance Assessment", "enabled": 1, "feature_limit": 5},
                ],
                "Basic": [
                    {"feature_name": "AI Chat", "enabled": 1, "feature_limit": 1000},
                    {"feature_name": "Policy Management", "enabled": 1, "feature_limit": 50},
                    {"feature_name": "Compliance Assessment", "enabled": 1, "feature_limit": 20},
                    {"feature_name": "Violation Tracking", "enabled": 1, "feature_limit": 100},
                    {"feature_name": "Evidence Management", "enabled": 1, "feature_limit": 50},
                ],
                "Professional": [
                    {"feature_name": "AI Chat", "enabled": 1, "feature_limit": 5000},
                    {"feature_name": "Policy Management", "enabled": 1, "feature_limit": 200},
                    {"feature_name": "Compliance Assessment", "enabled": 1, "feature_limit": 100},
                    {"feature_name": "Violation Tracking", "enabled": 1, "feature_limit": 500},
                    {"feature_name": "Evidence Management", "enabled": 1, "feature_limit": 300},
                    {"feature_name": "Audit Logging", "enabled": 1, "feature_limit": 0},
                    {"feature_name": "Custom Reports", "enabled": 1, "feature_limit": 50},
                    {"feature_name": "API Access", "enabled": 1, "feature_limit": 10000},
                ],
                "Enterprise": [
                    {"feature_name": "AI Chat", "enabled": 1, "feature_limit": 0},
                    {"feature_name": "Policy Management", "enabled": 1, "feature_limit": 0},
                    {"feature_name": "Compliance Assessment", "enabled": 1, "feature_limit": 0},
                    {"feature_name": "Violation Tracking", "enabled": 1, "feature_limit": 0},
                    {"feature_name": "Evidence Management", "enabled": 1, "feature_limit": 0},
                    {"feature_name": "Audit Logging", "enabled": 1, "feature_limit": 0},
                    {"feature_name": "Custom Reports", "enabled": 1, "feature_limit": 0},
                    {"feature_name": "API Access", "enabled": 1, "feature_limit": 0},
                    {"feature_name": "Multi-Language Support", "enabled": 1, "feature_limit": 0},
                    {"feature_name": "Advanced Analytics", "enabled": 1, "feature_limit": 0},
                ]
            }
            
            plan_features = features_map.get(self.plan_type, features_map["Trial"])
            
            # مسح الميزات الحالية
            self.features = []
            
            # إضافة الميزات الجديدة
            for feature in plan_features:
                self.append("features", feature)
            
            self.save(ignore_permissions=True)
            return {"message": "تم تهيئة الميزات بنجاح", "features_count": len(plan_features)}
        except Exception as e:
            frappe.log_error(f"خطأ في تهيئة الميزات للمستأجر {self.name}: {str(e)}")
            return {"message": "حدث خطأ في التهيئة"}