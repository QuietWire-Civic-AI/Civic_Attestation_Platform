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
        // Set page indicator based on status
        set_status_indicator(frm);
        
        if (!frm.is_new()) {
            // Add custom buttons
            add_custom_buttons(frm);
            
            // Display usage statistics
            display_usage_stats(frm);
            
            // Check subscription expiry
            check_subscription_expiry(frm);
        }
        
        // Set field properties
        set_field_properties(frm);
    },
    
    onload: function(frm) {
        // Set queries for link fields
        set_link_queries(frm);
    },
    
    tenant_name: function(frm) {
        // Auto-generate slug from tenant name
        if (!frm.doc.tenant_slug && frm.doc.tenant_name) {
            let slug = frm.doc.tenant_name.toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[-\s]+/g, '-');
            frm.set_value('tenant_slug', slug);
        }
    },
    
    status: function(frm) {
        // Update indicator when status changes
        set_status_indicator(frm);
        
        // Show confirmation for status change
        if (frm.doc.status === 'Suspended') {
            frappe.confirm(
                __('Are you sure you want to suspend this tenant? All users will be disabled.'),
                function() {
                    frm.save();
                },
                function() {
                    frm.reload_doc();
                }
            );
        }
    },
    
    plan_type: function(frm) {
        // Auto-set limits based on plan type
        set_plan_limits(frm);
    },
    
    domain: function(frm) {
        // Validate domain format
        if (frm.doc.domain && !is_valid_domain(frm.doc.domain)) {
            frappe.msgprint({
                title: __('Invalid Domain'),
                message: __('Please enter a valid domain name'),
                indicator: 'orange'
            });
        }
    },
    
    contact_email: function(frm) {
        validate_email_field(frm, 'contact_email');
    },
    
    billing_email: function(frm) {
        validate_email_field(frm, 'billing_email');
    }
});

// Helper function to set status indicator
function set_status_indicator(frm) {
    if (!frm.doc.status) return;
    
    let indicator_map = {
        'Active': 'green',
        'Trial': 'blue',
        'Inactive': 'gray',
        'Suspended': 'red'
    };
    
    let color = indicator_map[frm.doc.status] || 'gray';
    frm.page.set_indicator(__(frm.doc.status), color);
}

// Helper function to add custom buttons
function add_custom_buttons(frm) {
    // Usage Statistics button
    frm.add_custom_button(__('Usage Statistics'), function() {
        frm.call({
            method: 'get_usage_stats',
            doc: frm.doc,
            callback: function(r) {
                if (r.message) {
                    show_usage_dialog(frm, r.message);
                }
            }
        });
    }, __('Actions'));
    
    // Regenerate API Key button
    frm.add_custom_button(__('Regenerate API Key'), function() {
        frappe.confirm(
            __('Are you sure you want to regenerate the API key? The old key will no longer work.'),
            function() {
                frm.call({
                    method: 'regenerate_api_key',
                    doc: frm.doc,
                    callback: function(r) {
                        if (r.message) {
                            frappe.show_alert({
                                message: __(r.message.message),
                                indicator: 'green'
                            });
                            frm.reload_doc();
                        }
                    }
                });
            }
        );
    }, __('Security'));
    
    // View Users button
    frm.add_custom_button(__('View Users'), function() {
        frappe.set_route('List', 'User', {'tenant': frm.doc.name});
    }, __('Navigation'));
    
    // View Policies button
    frm.add_custom_button(__('View Policies'), function() {
        frappe.set_route('List', 'Policy', {'tenant': frm.doc.name});
    }, __('Navigation'));
    
    // View Chat Sessions button
    frm.add_custom_button(__('View Chat Sessions'), function() {
        frappe.set_route('List', 'Chat Session', {'tenant': frm.doc.name});
    }, __('Navigation'));
    
    // Compliance Dashboard button
    if (frm.doc.status === 'Active') {
        frm.add_custom_button(__('Compliance Dashboard'), function() {
            open_compliance_dashboard(frm);
        }, __('Reports'));
    }
}

// Helper function to display usage statistics
function display_usage_stats(frm) {
    frm.call({
        method: 'get_usage_stats',
        doc: frm.doc,
        freeze: false,
        callback: function(r) {
            if (r.message) {
                let stats = r.message;
                
                // Update dashboard with statistics
                frm.dashboard.add_indicator(
                    __('Users: {0}/{1}', [stats.users_count, frm.doc.max_users || '∞']),
                    stats.users_count >= (frm.doc.max_users || Infinity) ? 'red' : 'blue'
                );
                
                frm.dashboard.add_indicator(
                    __('Storage: {0}/{1} GB', [stats.storage_used, frm.doc.storage_limit_gb]),
                    stats.storage_used >= frm.doc.storage_limit_gb ? 'red' : 'green'
                );
                
                if (stats.last_activity) {
                    frm.dashboard.add_indicator(
                        __('Last Activity: {0}', [frappe.datetime.prettyDate(stats.last_activity)]),
                        'gray'
                    );
                }
            }
        }
    });
}

// Helper function to check subscription expiry
function check_subscription_expiry(frm) {
    if (!frm.doc.subscription_end) return;
    
    let today = frappe.datetime.get_today();
    let days_left = frappe.datetime.get_day_diff(frm.doc.subscription_end, today);
    
    if (days_left <= 0) {
        frm.dashboard.add_comment(
            __('Subscription has expired on {0}', [frappe.datetime.str_to_user(frm.doc.subscription_end)]),
            'red',
            true
        );
    } else if (days_left <= 7) {
        frm.dashboard.add_comment(
            __('Subscription expires in {0} days', [days_left]),
            'orange',
            true
        );
    } else if (days_left <= 30) {
        frm.dashboard.add_comment(
            __('Subscription expires in {0} days', [days_left]),
            'yellow',
            true
        );
    }
}

// Helper function to set field properties
function set_field_properties(frm) {
    // Make certain fields read-only after creation
    if (!frm.is_new()) {
        frm.set_df_property('tenant_slug', 'read_only', 1);
        frm.set_df_property('tenant_id', 'read_only', 1);
    }
    
    // Show/hide fields based on status
    if (frm.doc.status === 'Trial') {
        frm.set_df_property('subscription_end', 'reqd', 1);
    }
}

// Helper function to set plan limits
function set_plan_limits(frm) {
    let limits = {
        'Trial': {max_users: 5, storage_limit_gb: 5},
        'Basic': {max_users: 20, storage_limit_gb: 50},
        'Professional': {max_users: 100, storage_limit_gb: 200},
        'Enterprise': {max_users: 0, storage_limit_gb: 1000}  // 0 = unlimited
    };
    
    let plan = frm.doc.plan_type;
    if (plan && limits[plan]) {
        if (!frm.doc.max_users) {
            frm.set_value('max_users', limits[plan].max_users);
        }
        if (!frm.doc.storage_limit_gb) {
            frm.set_value('storage_limit_gb', limits[plan].storage_limit_gb);
        }
    }
}

// Helper function to validate domain
function is_valid_domain(domain) {
    let pattern = /^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9]$/;
    return pattern.test(domain);
}

// Helper function to validate email
function validate_email_field(frm, fieldname) {
    let email = frm.doc[fieldname];
    if (email) {
        let pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!pattern.test(email)) {
            frappe.msgprint({
                title: __('Invalid Email'),
                message: __('Please enter a valid email address'),
                indicator: 'orange'
            });
            frm.set_value(fieldname, '');
        }
    }
}

// Helper function to set link queries
function set_link_queries(frm) {
    // Filter created_by and modified_by to show only enabled users
    frm.set_query('created_by', function() {
        return {
            filters: {
                'enabled': 1
            }
        };
    });
    
    frm.set_query('modified_by', function() {
        return {
            filters: {
                'enabled': 1
            }
        };
    });
}

// Helper function to show usage dialog
function show_usage_dialog(frm, stats) {
    let dialog = new frappe.ui.Dialog({
        title: __('Usage Statistics for {0}', [frm.doc.tenant_name]),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'stats_html'
            }
        ],
        size: 'large'
    });
    
    let html = `
        <div class="tenant-stats" style="padding: 15px;">
            <h4>${__('Resource Usage')}</h4>
            <table class="table table-bordered">
                <tr>
                    <td><strong>${__('Users')}</strong></td>
                    <td>${stats.users_count} / ${frm.doc.max_users || '∞'}</td>
                </tr>
                <tr>
                    <td><strong>${__('Policies')}</strong></td>
                    <td>${stats.policies_count}</td>
                </tr>
                <tr>
                    <td><strong>${__('Chat Sessions')}</strong></td>
                    <td>${stats.chat_sessions_count}</td>
                </tr>
                <tr>
                    <td><strong>${__('Evidence Items')}</strong></td>
                    <td>${stats.evidence_count}</td>
                </tr>
                <tr>
                    <td><strong>${__('Storage Used')}</strong></td>
                    <td>${stats.storage_used} GB / ${frm.doc.storage_limit_gb} GB</td>
                </tr>
            </table>
            
            <h4 style="margin-top: 20px;">${__('Activity')}</h4>
            <table class="table table-bordered">
                <tr>
                    <td><strong>${__('Last Activity')}</strong></td>
                    <td>${stats.last_activity ? frappe.datetime.str_to_user(stats.last_activity) : __('No activity')}</td>
                </tr>
                <tr>
                    <td><strong>${__('Subscription Status')}</strong></td>
                    <td>${frm.doc.status}</td>
                </tr>
                <tr>
                    <td><strong>${__('Plan Type')}</strong></td>
                    <td>${frm.doc.plan_type}</td>
                </tr>
            </table>
        </div>
    `;
    
    dialog.fields_dict.stats_html.$wrapper.html(html);
    dialog.show();
}

// Helper function to open compliance dashboard
function open_compliance_dashboard(frm) {
    // This would navigate to a custom compliance dashboard for the tenant
    frappe.set_route('query-report', 'Tenant Compliance Overview', {
        'tenant': frm.doc.name
    });
}
