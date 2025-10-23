/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: chat_session.js
*/

frappe.ui.form.on('Chat Session', {
    // Form initialization
    refresh: function(frm) {
        // Add custom buttons based on status
        add_custom_buttons(frm);
        
        // Set field properties
        setup_field_properties(frm);
        
        // Add indicators
        add_status_indicators(frm);
        
        // Auto-refresh for active sessions
        if (frm.doc.status === 'Active') {
            setup_auto_refresh(frm);
        }
    },
    
    // When form is loaded
    onload: function(frm) {
        // Set filters for link fields
        set_link_filters(frm);
    },
    
    // When tenant changes
    tenant: function(frm) {
        // Clear dependent fields
        frm.set_value('user', '');
        frm.set_value('model_configuration', '');
        
        // Refresh link filters
        set_link_filters(frm);
    },
    
    // When status changes
    status: function(frm) {
        handle_status_change(frm);
    },
    
    // Before save validation
    before_save: function(frm) {
        // Validate session data
        validate_session_data(frm);
    }
});


// ==================== Helper Functions ====================

function add_custom_buttons(frm) {
    // Remove existing custom buttons
    frm.clear_custom_buttons();
    
    if (frm.doc.__islocal) {
        return; // Don't add buttons for new docs
    }
    
    // Complete Session button
    if (frm.doc.status === 'Active') {
        frm.add_custom_button(__('Complete Session'), function() {
            complete_session(frm);
        }, __('Actions'));
    }
    
    // Archive Session button
    if (frm.doc.status === 'Completed') {
        frm.add_custom_button(__('Archive Session'), function() {
            archive_session(frm);
        }, __('Actions'));
    }
    
    // View Messages button
    frm.add_custom_button(__('View Messages'), function() {
        view_messages(frm);
    }, __('View'));
    
    // View Compliance Events button
    if (frm.doc.violations_found > 0) {
        frm.add_custom_button(__('View Violations'), function() {
            view_violations(frm);
        }, __('View'));
    }
    
    // Refresh Statistics button
    frm.add_custom_button(__('Refresh Statistics'), function() {
        refresh_statistics(frm);
    });
}


function setup_field_properties(frm) {
    // Make fields read-only based on status
    if (frm.doc.status === 'Completed' || frm.doc.status === 'Archived') {
        frm.set_df_property('tenant', 'read_only', 1);
        frm.set_df_property('user', 'read_only', 1);
        frm.set_df_property('model_configuration', 'read_only', 1);
        frm.set_df_property('start_time', 'read_only', 1);
    }
    
    // Hide compliance section if not checked
    if (!frm.doc.compliance_checked_at) {
        frm.toggle_display('compliance_section', false);
    }
}


function add_status_indicators(frm) {
    // Add color indicators based on status
    const status_colors = {
        'Draft': 'gray',
        'Active': 'blue',
        'Completed': 'green',
        'Archived': 'darkgray',
        'Suspended': 'red'
    };
    
    const color = status_colors[frm.doc.status] || 'gray';
    frm.page.set_indicator(__(frm.doc.status), color);
    
    // Add compliance indicator
    if (frm.doc.compliance_checked_at) {
        const compliance_color = frm.doc.is_compliant ? 'green' : 'red';
        const compliance_text = frm.doc.is_compliant ? 'Compliant' : 'Non-Compliant';
        frm.dashboard.add_indicator(
            __(compliance_text + ' (' + frm.doc.compliance_score + '%'),
            compliance_color
        );
    }
}


function setup_auto_refresh(frm) {
    // Auto-refresh every 30 seconds for active sessions
    if (frm.auto_refresh_interval) {
        clearInterval(frm.auto_refresh_interval);
    }
    
    frm.auto_refresh_interval = setInterval(function() {
        if (frm.doc.status === 'Active' && !frm.is_dirty()) {
            frm.reload_doc();
        }
    }, 30000); // 30 seconds
}


function set_link_filters(frm) {
    // Filter users by tenant
    if (frm.doc.tenant) {
        frm.set_query('user', function() {
            return {
                filters: {
                    'tenant': frm.doc.tenant
                }
            };
        });
        
        frm.set_query('model_configuration', function() {
            return {
                filters: {
                    'tenant': frm.doc.tenant,
                    'is_active': 1
                }
            };
        });
    }
}


function handle_status_change(frm) {
    // Handle status change events
    if (frm.doc.status === 'Completed' && !frm.doc.end_time) {
        frm.set_value('end_time', frappe.datetime.now_datetime());
    }
    
    // Refresh buttons
    add_custom_buttons(frm);
}


function validate_session_data(frm) {
    // Client-side validation
    if (frm.doc.end_time && frm.doc.start_time) {
        const start = frappe.datetime.str_to_obj(frm.doc.start_time);
        const end = frappe.datetime.str_to_obj(frm.doc.end_time);
        
        if (end < start) {
            frappe.throw(__('End time cannot be before start time'));
        }
    }
}


// ==================== Action Functions ====================

function complete_session(frm) {
    frappe.confirm(
        __('Are you sure you want to complete this session?'),
        function() {
            frappe.call({
                method: 'complete_session',
                doc: frm.doc,
                callback: function(r) {
                    if (r.message) {
                        frappe.msgprint(__(r.message.message));
                        frm.reload_doc();
                    }
                }
            });
        }
    );
}


function archive_session(frm) {
    frappe.confirm(
        __('Are you sure you want to archive this session?'),
        function() {
            frm.set_value('status', 'Archived');
            frm.save();
        }
    );
}


function view_messages(frm) {
    frappe.set_route('List', 'Message', {
        'chat_session': frm.doc.name
    });
}


function view_violations(frm) {
    frappe.set_route('List', 'Compliance Event', {
        'chat_session': frm.doc.name,
        'event_type': 'Violation'
    });
}


function refresh_statistics(frm) {
    frappe.call({
        method: 'get_session_statistics',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                const stats = r.message;
                
                // Show statistics dialog
                let dialog = new frappe.ui.Dialog({
                    title: __('Session Statistics'),
                    fields: [
                        {
                            fieldtype: 'HTML',
                            options: format_statistics_html(stats)
                        }
                    ],
                    primary_action_label: __('Close'),
                    primary_action: function() {
                        dialog.hide();
                    }
                });
                
                dialog.show();
            }
        }
    });
}


function format_statistics_html(stats) {
    return `
        <div style="padding: 15px;">
            <h4>Session Statistics</h4>
            <table class="table table-bordered">
                <tr>
                    <td><strong>Session ID:</strong></td>
                    <td>${stats.session_id}</td>
                </tr>
                <tr>
                    <td><strong>Status:</strong></td>
                    <td><span class="indicator ${get_status_color(stats.status)}">${stats.status}</span></td>
                </tr>
                <tr>
                    <td><strong>Total Messages:</strong></td>
                    <td>${stats.total_messages || 0}</td>
                </tr>
                <tr>
                    <td><strong>Total Tokens:</strong></td>
                    <td>${stats.total_tokens || 0}</td>
                </tr>
                <tr>
                    <td><strong>Compliance Score:</strong></td>
                    <td>${stats.compliance_score || 'N/A'}%</td>
                </tr>
                <tr>
                    <td><strong>Violations Found:</strong></td>
                    <td>${stats.violations_found || 0}</td>
                </tr>
                <tr>
                    <td><strong>Duration:</strong></td>
                    <td>${stats.duration ? format_duration(stats.duration) : 'In Progress'}</td>
                </tr>
            </table>
        </div>
    `;
}


function get_status_color(status) {
    const colors = {
        'Draft': 'gray',
        'Active': 'blue',
        'Completed': 'green',
        'Archived': 'darkgray',
        'Suspended': 'red'
    };
    return colors[status] || 'gray';
}


function format_duration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours}h ${minutes}m ${secs}s`;
}