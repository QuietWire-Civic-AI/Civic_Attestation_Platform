/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: system_settings.js
*/

frappe.ui.form.on('System Settings', {
    onload: function(frm) {
        // Setup tabbed navigation
        setup_tabbed_navigation(frm);
    },
    
    refresh: function(frm) {
        // Clear existing dashboard
        frm.dashboard.clear_headline();
        
        // Add custom buttons for connection testing
        add_connection_test_buttons(frm);
        
        // Show comprehensive dashboard
        setup_comprehensive_dashboard(frm);
        
        // Show maintenance mode warning if enabled
        if (frm.doc.maintenance_mode) {
            frm.dashboard.add_comment(
                __('⚠️ Warning: Maintenance Mode is ENABLED. Users cannot access the system.'),
                'red',
                true
            );
        }
        
        // Show environment badge
        show_environment_badge(frm);
        
        // Add quick actions
        add_quick_actions(frm);
        
        // Add configuration templates
        add_template_loader(frm);
        
        // Add visual progress indicators
        show_configuration_progress(frm);
    },
    
    default_ai_provider: function(frm) {
        // Clear API keys when provider changes
        frappe.msgprint({
            title: __('Provider Changed'),
            indicator: 'blue',
            message: __('Please configure API credentials for the selected provider')
        });
    },
    
    maintenance_mode: function(frm) {
        if (frm.doc.maintenance_mode) {
            frappe.confirm(
                __('Are you sure you want to enable Maintenance Mode? This will prevent all users from accessing the system.'),
                function() {
                    // User confirmed
                    frappe.msgprint({
                        title: __('Maintenance Mode Enabled'),
                        indicator: 'orange',
                        message: __('Users will see the maintenance message when trying to access the system')
                    });
                },
                function() {
                    // User cancelled
                    frm.set_value('maintenance_mode', 0);
                }
            );
        }
    },
    
    primary_storage_provider: function(frm) {
        frappe.msgprint({
            title: __('Storage Provider Changed'),
            indicator: 'blue',
            message: __('Please configure credentials for the selected storage provider')
        });
    }
});

function add_connection_test_buttons(frm) {
    // Test AI Connection
    frm.add_custom_button(__('Test AI Connection'), function() {
        frappe.call({
            method: 'test_ai_connection',
            doc: frm.doc,
            callback: function(r) {
                if (r.message) {
                    frappe.msgprint({
                        title: __('AI Connection Test'),
                        indicator: r.message.success ? 'green' : 'red',
                        message: r.message.message
                    });
                }
            }
        });
    }, __('Connection Tests'));
    
    // Test SMTP Connection
    if (frm.doc.enable_email_notifications) {
        frm.add_custom_button(__('Test SMTP Connection'), function() {
            frappe.call({
                method: 'test_smtp_connection',
                doc: frm.doc,
                callback: function(r) {
                    if (r.message) {
                        frappe.msgprint({
                            title: __('SMTP Connection Test'),
                            indicator: r.message.success ? 'green' : 'red',
                            message: r.message.message
                        });
                    }
                }
            });
        }, __('Connection Tests'));
    }
    
    // Test Storage Connection
    if (frm.doc.primary_storage_provider !== 'Local') {
        frm.add_custom_button(__('Test Storage Connection'), function() {
            frappe.call({
                method: 'test_storage_connection',
                doc: frm.doc,
                callback: function(r) {
                    if (r.message) {
                        frappe.msgprint({
                            title: __('Storage Connection Test'),
                            indicator: r.message.success ? 'green' : 'red',
                            message: r.message.message
                        });
                    }
                }
            });
        }, __('Connection Tests'));
    }
}

function show_environment_badge(frm) {
    let color = 'blue';
    if (frm.doc.environment === 'Production') {
        color = 'red';
    } else if (frm.doc.environment === 'Staging') {
        color = 'orange';
    }
    
    frm.dashboard.add_comment(
        __('Environment: {0}', [frm.doc.environment]),
        color,
        true
    );
}

function add_quick_actions(frm) {
    // Quick action to view all AI Models
    frm.add_custom_button(__('🤖 View AI Models'), function() {
        frappe.set_route('List', 'AI Model');
    }, __('Quick Access'));
    
    // Quick action to view Tenants
    frm.add_custom_button(__('👥 View Tenants'), function() {
        frappe.set_route('List', 'Tenant');
    }, __('Quick Access'));
    
    // Quick action to view Compliance Policies
    frm.add_custom_button(__('📋 View Policies'), function() {
        frappe.set_route('List', 'Policy');
    }, __('Quick Access'));
    
    // Quick action to view User Profiles
    frm.add_custom_button(__('👤 View User Profiles'), function() {
        frappe.set_route('List', 'User Profile');
    }, __('Quick Access'));
    
    // Export settings
    frm.add_custom_button(__('📥 Export Settings'), function() {
        export_settings(frm);
    }, __('Actions'));
    
    // Import settings
    frm.add_custom_button(__('📤 Import Settings'), function() {
        import_settings_dialog(frm);
    }, __('Actions'));
    
    // Preview changes
    if (frm.is_dirty()) {
        frm.add_custom_button(__('👁️ Preview Changes'), function() {
            preview_changes(frm);
        }, __('Actions'));
    }
    
    // Reset to defaults
    frm.add_custom_button(__('🔄 Reset Section'), function() {
        reset_section_dialog(frm);
    }, __('Actions'));
}

function setup_tabbed_navigation(frm) {
    // Add custom CSS for better tab styling
    if (!$('style#system-settings-tabs').length) {
        $('head').append(`
            <style id="system-settings-tabs">
                .settings-tab-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin: 15px 0;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 8px;
                }
                .settings-tab-btn {
                    padding: 8px 16px;
                    border: 2px solid #ddd;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-weight: 500;
                }
                .settings-tab-btn:hover {
                    background: #e8f4fd;
                    border-color: #2490ef;
                }
                .settings-tab-btn.active {
                    background: #2490ef;
                    color: white;
                    border-color: #2490ef;
                }
                .section-indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 6px;
                }
                .section-indicator.complete { background: #28a745; }
                .section-indicator.partial { background: #ffc107; }
                .section-indicator.empty { background: #dc3545; }
            </style>
        `);
    }
    
    // Create tab navigation
    let tabs_html = `
        <div class="settings-tab-buttons">
            <button class="settings-tab-btn" data-section="platform_section">
                🏢 Platform
            </button>
            <button class="settings-tab-btn" data-section="ai_model_section">
                🤖 AI & Models
            </button>
            <button class="settings-tab-btn" data-section="security_section">
                🔒 Security
            </button>
            <button class="settings-tab-btn" data-section="notifications_section">
                📧 Notifications
            </button>
            <button class="settings-tab-btn" data-section="storage_section">
                💾 Storage
            </button>
            <button class="settings-tab-btn" data-section="compliance_section">
                📋 Compliance
            </button>
            <button class="settings-tab-btn" data-section="tenant_management_section">
                👥 Tenants
            </button>
            <button class="settings-tab-btn" data-section="audit_section">
                📊 Audit & Logs
            </button>
        </div>
    `;
    
    // Insert tabs before form
    if (!$('.settings-tab-buttons').length) {
        $(frm.fields_dict.platform_section.wrapper).before(tabs_html);
    }
    
    // Tab click handlers
    $('.settings-tab-btn').off('click').on('click', function() {
        let section = $(this).data('section');
        
        // Update active state
        $('.settings-tab-btn').removeClass('active');
        $(this).addClass('active');
        
        // Collapse all sections
        frm.fields.forEach(field => {
            if (field.df.fieldtype === 'Section Break' && field.df.collapsible) {
                field.collapse();
            }
        });
        
        // Expand target section
        if (frm.fields_dict[section]) {
            frm.scroll_to_field(section);
            frm.fields_dict[section].expand();
        }
    });
}

function setup_comprehensive_dashboard(frm) {
    // Configuration completeness indicators
    let ai_complete = frm.doc.default_ai_provider && 
                      (frm.doc.openai_api_key || frm.doc.azure_openai_api_key);
    let storage_complete = frm.doc.primary_storage_provider === 'Local' ||
                          (frm.doc.s3_bucket_name && frm.doc.s3_access_key_id);
    let notification_complete = frm.doc.enable_email_notifications && frm.doc.smtp_server;
    
    // Overall progress
    let progress = 0;
    let total_sections = 8;
    if (ai_complete) progress++;
    if (storage_complete) progress++;
    if (notification_complete) progress++;
    if (frm.doc.encryption_algorithm) progress++;
    if (frm.doc.active_compliance_frameworks) progress++;
    if (frm.doc.enable_multi_tenancy !== undefined) progress++;
    if (frm.doc.enable_audit_logging !== undefined) progress++;
    progress++; // Platform info always set
    
    let percentage = Math.round((progress / total_sections) * 100);
    
    frm.dashboard.add_progress(__('Configuration Completeness'), percentage, 
        __(`${progress}/${total_sections} sections configured`));
    
    // Status indicators
    if (ai_complete) {
        frm.dashboard.add_indicator(__('✅ AI Provider Configured'), 'green');
    } else {
        frm.dashboard.add_indicator(__('⚠️ AI Provider Not Configured'), 'orange');
    }
    
    if (storage_complete) {
        frm.dashboard.add_indicator(__('✅ Storage Configured'), 'green');
    }
    
    if (frm.doc.require_mfa) {
        frm.dashboard.add_indicator(__('🔐 MFA Enabled'), 'blue');
    }
}

function show_configuration_progress(frm) {
    // Calculate completion for each section
    let sections = {
        'AI': check_ai_completion(frm),
        'Security': check_security_completion(frm),
        'Storage': check_storage_completion(frm),
        'Notifications': check_notification_completion(frm)
    };
    
    // Update tab indicators
    $('.settings-tab-btn').each(function() {
        let section_name = $(this).text().trim().split(' ')[1]; // Get section name after emoji
        if (sections[section_name] !== undefined) {
            let indicator_class = sections[section_name] ? 'complete' : 'partial';
            if (!$(this).find('.section-indicator').length) {
                $(this).prepend(`<span class="section-indicator ${indicator_class}"></span>`);
            }
        }
    });
}

function check_ai_completion(frm) {
    return frm.doc.default_ai_provider && 
           (frm.doc.openai_api_key || frm.doc.azure_openai_api_key);
}

function check_security_completion(frm) {
    return frm.doc.encryption_algorithm && 
           frm.doc.password_policy &&
           frm.doc.session_timeout_minutes;
}

function check_storage_completion(frm) {
    if (frm.doc.primary_storage_provider === 'Local') return true;
    if (frm.doc.primary_storage_provider === 'AWS S3') {
        return frm.doc.s3_bucket_name && frm.doc.s3_access_key_id;
    }
    return false;
}

function check_notification_completion(frm) {
    if (!frm.doc.enable_email_notifications) return true;
    return frm.doc.smtp_server && frm.doc.smtp_port;
}

function add_template_loader(frm) {
    frm.add_custom_button(__('📋 Load Template'), function() {
        let d = new frappe.ui.Dialog({
            title: __('Load Configuration Template'),
            fields: [
                {
                    fieldtype: 'Select',
                    fieldname: 'template',
                    label: __('Select Template'),
                    options: [
                        'Development Environment',
                        'Production Basic',
                        'Production Enterprise',
                        'High Security',
                        'Multi-Tenant Setup'
                    ],
                    reqd: 1
                },
                {
                    fieldtype: 'HTML',
                    fieldname: 'template_description',
                    options: '<div class="alert alert-info">Select a template to quickly configure system settings for common scenarios.</div>'
                }
            ],
            primary_action_label: __('Load Template'),
            primary_action: function(values) {
                load_configuration_template(frm, values.template);
                d.hide();
            }
        });
        d.show();
    }, __('Templates'));
}

function load_configuration_template(frm, template_name) {
    let templates = {
        'Development Environment': {
            environment: 'Development',
            log_level: 'DEBUG',
            enable_performance_monitoring: 1,
            session_timeout_minutes: 60,
            require_mfa: 0
        },
        'Production Basic': {
            environment: 'Production',
            log_level: 'WARNING',
            require_mfa: 1,
            session_timeout_minutes: 15,
            enable_audit_logging: 1,
            max_login_attempts: 3
        },
        'Production Enterprise': {
            environment: 'Production',
            enable_multi_tenancy: 1,
            enable_blockchain_verification: 1,
            require_mfa: 1,
            enable_audit_logging: 1,
            log_level: 'INFO',
            active_compliance_frameworks: 'All Frameworks'
        },
        'High Security': {
            encryption_algorithm: 'AES-256',
            require_mfa: 1,
            password_policy: 'Strong',
            session_timeout_minutes: 10,
            max_login_attempts: 3,
            account_lockout_duration: 60,
            password_expiry_days: 30
        },
        'Multi-Tenant Setup': {
            enable_multi_tenancy: 1,
            default_tenant_plan: 'Professional',
            tenant_data_isolation: 'Separate Schema',
            allow_tenant_customization: 1,
            auto_suspend_inactive_tenants: 1
        }
    };
    
    let config = templates[template_name];
    if (config) {
        for (let key in config) {
            frm.set_value(key, config[key]);
        }
        frappe.show_alert({
            message: __('Template "{0}" loaded successfully', [template_name]),
            indicator: 'green'
        }, 5);
    }
}

function export_settings(frm) {
    // Get all non-sensitive settings
    let settings_data = {};
    let sensitive_fields = [
        'openai_api_key', 'azure_openai_api_key',
        'smtp_password', 'slack_webhook_url', 'teams_webhook_url',
        's3_access_key_id', 's3_secret_access_key',
        'azure_storage_key'
    ];
    
    frm.fields.forEach(field => {
        if (field.df.fieldname && 
            !sensitive_fields.includes(field.df.fieldname) &&
            field.df.fieldtype !== 'Section Break' &&
            field.df.fieldtype !== 'Column Break') {
            settings_data[field.df.fieldname] = frm.doc[field.df.fieldname];
        }
    });
    
    let blob = new Blob([JSON.stringify(settings_data, null, 2)], {type: 'application/json'});
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `system_settings_${frm.doc.environment}_${frappe.datetime.now_date()}.json`;
    a.click();
    
    frappe.msgprint({
        title: __('Settings Exported'),
        message: __('Settings exported successfully (sensitive data excluded)'),
        indicator: 'green'
    });
}

function import_settings_dialog(frm) {
    let d = new frappe.ui.Dialog({
        title: __('Import Settings'),
        fields: [
            {
                fieldtype: 'Attach',
                fieldname: 'settings_file',
                label: __('Settings File (JSON)'),
                reqd: 1
            },
            {
                fieldtype: 'Check',
                fieldname: 'overwrite_existing',
                label: __('Overwrite Existing Values'),
                default: 0
            },
            {
                fieldtype: 'HTML',
                options: '<div class="alert alert-warning">⚠️ This will update system settings. Please review changes before saving.</div>'
            }
        ],
        primary_action_label: __('Import'),
        primary_action: function(values) {
            // Import logic would go here
            frappe.msgprint(__('Import functionality will be implemented'));
            d.hide();
        }
    });
    d.show();
}

function preview_changes(frm) {
    let changes = frm.get_dirty_values();
    if (Object.keys(changes).length === 0) {
        frappe.msgprint(__('No changes to preview'));
        return;
    }
    
    let html = '<table class="table table-bordered"><thead><tr><th>Field</th><th>New Value</th></tr></thead><tbody>';
    
    for (let field in changes) {
        let field_label = frm.fields_dict[field] ? frm.fields_dict[field].df.label : field;
        let new_value = changes[field];
        if (typeof new_value === 'boolean') {
            new_value = new_value ? '✅ Enabled' : '❌ Disabled';
        }
        html += `<tr><td><strong>${field_label}</strong></td><td class="text-primary">${new_value}</td></tr>`;
    }
    
    html += '</tbody></table>';
    
    frappe.msgprint({
        title: __('Changes Preview'),
        message: html,
        wide: true
    });
}

function reset_section_dialog(frm) {
    let d = new frappe.ui.Dialog({
        title: __('Reset Section to Defaults'),
        fields: [
            {
                fieldtype: 'Select',
                fieldname: 'section',
                label: __('Select Section'),
                options: [
                    'AI & Model Configuration',
                    'Security Settings',
                    'Notification Settings',
                    'Storage Settings',
                    'Compliance & Governance',
                    'Multi-Tenant Management',
                    'Audit & Logging'
                ],
                reqd: 1
            }
        ],
        primary_action_label: __('Reset'),
        primary_action: function(values) {
            frappe.msgprint(__('Reset functionality will restore default values for the selected section'));
            d.hide();
        }
    });
    d.show();
}

// Field level validations
frappe.ui.form.on('System Settings', {
    max_file_size_mb: function(frm) {
        if (frm.doc.max_file_size_mb && frm.doc.max_file_size_mb > 100) {
            frappe.msgprint({
                title: __('Large File Size'),
                indicator: 'orange',
                message: __('File sizes over 100MB may impact performance')
            });
        }
    },
    
    session_timeout_minutes: function(frm) {
        if (frm.doc.session_timeout_minutes && frm.doc.session_timeout_minutes < 15) {
            frappe.msgprint({
                title: __('Short Session Timeout'),
                indicator: 'orange',
                message: __('Very short session timeouts may inconvenience users')
            });
        }
    },
    
    global_rate_limit_per_minute: function(frm) {
        if (frm.doc.global_rate_limit_per_minute && frm.doc.global_rate_limit_per_minute < 10) {
            frappe.msgprint({
                title: __('Low Rate Limit'),
                indicator: 'orange',
                message: __('Very low rate limits may impact system usability')
            });
        }
    }
});
