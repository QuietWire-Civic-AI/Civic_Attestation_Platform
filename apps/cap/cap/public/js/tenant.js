/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: tenant.js
*/

frappe.ui.form.on('Tenant', {
    refresh: function(frm) {
        // Add custom buttons
        if (!frm.is_new()) {
            frm.add_custom_button(__('View Statistics'), function() {
                showTenantStats(frm);
            }, __('Actions'));
            
            frm.add_custom_button(__('Regenerate API Key'), function() {
                regenerateApiKey(frm);
            }, __('Actions'));
            
            frm.add_custom_button(__('Export Audit Log'), function() {
                exportAuditLog(frm);
            }, __('Actions'));
            
            // Status change buttons
            if (frm.doc.status !== 'Active') {
                frm.add_custom_button(__('Activate'), function() {
                    changeStatus(frm, 'Active');
                }, __('Status'));
            }
            
            if (frm.doc.status !== 'Suspended') {
                frm.add_custom_button(__('Suspend'), function() {
                    changeStatus(frm, 'Suspended');
                }, __('Status'));
            }
        }
        
        // Set indicator based on status
        setStatusIndicator(frm);
        
        // Load usage statistics
        if (!frm.is_new()) {
            loadUsageStats(frm);
        }
    },
    
    tenant_name: function(frm) {
        // Auto-generate slug from tenant name
        if (frm.doc.tenant_name && !frm.doc.tenant_slug) {
            let slug = frm.doc.tenant_name.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[-\s]+/g, '-')
                .trim();
            frm.set_value('tenant_slug', slug);
        }
    },
    
    plan_type: function(frm) {
        // Set default limits based on plan type
        const planLimits = {
            'Trial': { max_users: 5, storage_limit_gb: 1.0 },
            'Basic': { max_users: 20, storage_limit_gb: 10.0 },
            'Professional': { max_users: 100, storage_limit_gb: 50.0 },
            'Enterprise': { max_users: 1000, storage_limit_gb: 500.0 }
        };
        
        const limits = planLimits[frm.doc.plan_type];
        if (limits) {
            frm.set_value('max_users', limits.max_users);
            frm.set_value('storage_limit_gb', limits.storage_limit_gb);
        }
    },
    
    validate: function(frm) {
        // Validate email addresses
        if (frm.doc.contact_email && !isValidEmail(frm.doc.contact_email)) {
            frappe.throw(__('Invalid contact email address'));
        }
        
        if (frm.doc.billing_email && !isValidEmail(frm.doc.billing_email)) {
            frappe.throw(__('Invalid billing email address'));
        }
        
        // Validate domain
        if (frm.doc.domain && !isValidDomain(frm.doc.domain)) {
            frappe.throw(__('Invalid domain format'));
        }
        
        // Validate limits
        if (frm.doc.max_users && frm.doc.max_users <= 0) {
            frappe.throw(__('Maximum users must be greater than 0'));
        }
        
        if (frm.doc.storage_limit_gb && frm.doc.storage_limit_gb <= 0) {
            frappe.throw(__('Storage limit must be greater than 0'));
        }
    }
});

// ====================
// Helper Functions
// ====================

function setStatusIndicator(frm) {
    const statusColors = {
        'Active': 'green',
        'Trial': 'blue', 
        'Suspended': 'red',
        'Inactive': 'grey'
    };
    
    const color = statusColors[frm.doc.status] || 'grey';
    frm.dashboard.set_headline_alert(
        `<div class="indicator ${color}">
            ${__('Status')}: ${__(frm.doc.status)}
        </div>`
    );
}

function showTenantStats(frm) {
    frappe.call({
        method: 'get_usage_stats',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                const stats = r.message;
                
                const dialog = new frappe.ui.Dialog({
                    title: __('Tenant Statistics'),
                    size: 'large',
                    fields: [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'stats_html',
                            options: renderStatsHTML(stats)
                        }
                    ]
                });
                
                dialog.show();
            }
        }
    });
}

function renderStatsHTML(stats) {
    return `
        <div class="tenant-stats">
            <div class="row">
                <div class="col-md-6">
                    <div class="stat-item">
                        <h4>${stats.users_count || 0}</h4>
                        <p>${__('Users')}</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="stat-item">
                        <h4>${stats.policies_count || 0}</h4>
                        <p>${__('Policies')}</p>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="stat-item">
                        <h4>${stats.chat_sessions_count || 0}</h4>
                        <p>${__('Chat Sessions')}</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="stat-item">
                        <h4>${stats.evidence_count || 0}</h4>
                        <p>${__('Evidence Items')}</p>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="stat-item">
                        <h4>${stats.storage_used_gb || 0} GB</h4>
                        <p>${__('Storage Used')}</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="stat-item">
                        <h4>${stats.last_activity ? moment(stats.last_activity).fromNow() : 'Never'}</h4>
                        <p>${__('Last Activity')}</p>
                    </div>
                </div>
            </div>
        </div>
        <style>
            .tenant-stats .stat-item {
                text-align: center;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
                margin: 10px 0;
                background: #f9f9f9;
            }
            .tenant-stats .stat-item h4 {
                font-size: 2em;
                margin: 0;
                color: #2563eb;
            }
            .tenant-stats .stat-item p {
                margin: 5px 0 0 0;
                color: #666;
            }
        </style>
    `;
}

function regenerateApiKey(frm) {
    frappe.confirm(
        __('Are you sure you want to regenerate the API key? This will invalidate the current key.'),
        function() {
            frappe.call({
                method: 'regenerate_api_key',
                doc: frm.doc,
                callback: function(r) {
                    if (r.message) {
                        frappe.show_alert({
                            message: r.message.message,
                            indicator: 'green'
                        });
                        frm.reload_doc();
                    }
                }
            });
        }
    );
}

function exportAuditLog(frm) {
    frappe.call({
        method: 'cap.api.export_tenant_audit_log',
        args: {
            tenant_id: frm.doc.name,
            format: 'json'
        },
        callback: function(r) {
            if (r.message) {
                // Create download link
                const blob = new Blob([JSON.stringify(r.message, null, 2)], 
                    { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tenant_${frm.doc.tenant_slug}_audit_log.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                frappe.show_alert({
                    message: __('Audit log exported successfully'),
                    indicator: 'green'
                });
            }
        }
    });
}

function changeStatus(frm, newStatus) {
    const confirmMessage = newStatus === 'Suspended' ? 
        __('Are you sure you want to suspend this tenant? All users will be disabled.') :
        __('Are you sure you want to change the status to {0}?', [newStatus]);
    
    frappe.confirm(confirmMessage, function() {
        frm.set_value('status', newStatus);
        frm.save();
    });
}

function loadUsageStats(frm) {
    // Load quick stats in the form
    frappe.call({
        method: 'get_usage_stats',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                const stats = r.message;
                
                // Display quick stats in dashboard
                const statsHtml = `
                    <div class="quick-stats">
                        <span class="stat-badge">
                            <i class="fa fa-users"></i> ${stats.users_count || 0} ${__('Users')}
                        </span>
                        <span class="stat-badge">
                            <i class="fa fa-file-text"></i> ${stats.policies_count || 0} ${__('Policies')}
                        </span>
                        <span class="stat-badge">
                            <i class="fa fa-database"></i> ${stats.storage_used_gb || 0} GB ${__('Used')}
                        </span>
                    </div>
                `;
                
                frm.dashboard.add_section(statsHtml, __('Quick Statistics'));
            }
        }
    });
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidDomain(domain) {
    const re = /^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9]$/;
    return re.test(domain);
}