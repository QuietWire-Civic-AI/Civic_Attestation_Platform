/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: message.js
*/

frappe.ui.form.on('Message', {
    // Form initialization
    refresh: function(frm) {
        // Add custom buttons
        add_custom_buttons(frm);
        
        // Set field properties
        setup_field_properties(frm);
        
        // Add indicators
        add_status_indicators(frm);
        
        // Setup realtime updates
        setup_realtime_updates(frm);
    },
    
    // When form is loaded
    onload: function(frm) {
        // Set filters for link fields
        set_link_filters(frm);
        
        // Load message statistics
        load_statistics(frm);
    },
    
    // When message type changes
    message_type: function(frm) {
        handle_message_type_change(frm);
    },
    
    // When sender type changes
    sender_type: function(frm) {
        handle_sender_type_change(frm);
    },
    
    // When content changes
    content: function(frm) {
        // Auto-calculate token count
        if (frm.doc.content && !frm.doc.tokens_used) {
            frm.set_value('tokens_used', estimate_tokens(frm.doc.content));
        }
    }
});


// ==================== Helper Functions ====================

function add_custom_buttons(frm) {
    // Remove existing custom buttons
    frm.clear_custom_buttons();
    
    if (frm.doc.__islocal) {
        return; // Don't add buttons for new docs
    }
    
    // Flag for Review button
    if (!frm.doc.flagged_for_review) {
        frm.add_custom_button(__('Flag for Review'), function() {
            flag_for_review(frm);
        }, __('Actions'));
    }
    
    // Mark Compliant button
    if (frm.doc.compliance_status !== 'Compliant') {
        frm.add_custom_button(__('Mark Compliant'), function() {
            mark_compliant(frm);
        }, __('Actions'));
    }
    
    // View Session button
    frm.add_custom_button(__('View Session'), function() {
        view_session(frm);
    }, __('View'));
    
    // View Violations button
    if (frm.doc.detected_violations && frm.doc.detected_violations.length > 0) {
        frm.add_custom_button(__('View Violations'), function() {
            show_violations(frm);
        }, __('View'));
    }
    
    // View Evidence button
    if (frm.doc.extracted_evidence && frm.doc.extracted_evidence.length > 0) {
        frm.add_custom_button(__('View Evidence'), function() {
            show_evidence(frm);
        }, __('View'));
    }
    
    // Statistics button
    frm.add_custom_button(__('Statistics'), function() {
        show_statistics(frm);
    });
}


function setup_field_properties(frm) {
    // Make certain fields read-only
    frm.set_df_property('message_id', 'read_only', 1);
    frm.set_df_property('session_id', 'read_only', 1);
    frm.set_df_property('created_at', 'read_only', 1);
    frm.set_df_property('updated_at', 'read_only', 1);
    
    // Hide sections based on data
    if (!frm.doc.detected_violations || frm.doc.detected_violations.length === 0) {
        frm.toggle_display('violations_section', false);
    }
    
    if (!frm.doc.extracted_evidence || frm.doc.extracted_evidence.length === 0) {
        frm.toggle_display('evidence_section', false);
    }
    
    if (!frm.doc.citations || frm.doc.citations.length === 0) {
        frm.toggle_display('citations_section', false);
    }
}


function add_status_indicators(frm) {
    // Message type indicator
    const type_colors = {
        'User': 'blue',
        'Assistant': 'green',
        'System': 'gray',
        'Error': 'red',
        'Notification': 'orange'
    };
    
    const type_color = type_colors[frm.doc.message_type] || 'gray';
    frm.page.set_indicator(__(frm.doc.message_type), type_color);
    
    // Compliance status indicator
    if (frm.doc.compliance_status) {
        const compliance_colors = {
            'Not Checked': 'gray',
            'Compliant': 'green',
            'Non-Compliant': 'red',
            'Under Review': 'orange',
            'Exempt': 'blue'
        };
        
        const comp_color = compliance_colors[frm.doc.compliance_status] || 'gray';
        frm.dashboard.add_indicator(
            __(frm.doc.compliance_status),
            comp_color
        );
    }
    
    // Flagged indicator
    if (frm.doc.flagged_for_review) {
        frm.dashboard.add_indicator(
            __('Flagged for Review'),
            'red'
        );
    }
}


function setup_realtime_updates(frm) {
    // Listen for compliance check updates
    frappe.realtime.on('message_compliance_updated', function(data) {
        if (data.message_id === frm.doc.name) {
            frappe.show_alert({
                message: __('Compliance status updated'),
                indicator: 'green'
            });
            frm.reload_doc();
        }
    });
}


function set_link_filters(frm) {
    // Filter sender by active users
    frm.set_query('sender', function() {
        return {
            filters: {
                'enabled': 1
            }
        };
    });
    
    // Filter chat_session
    frm.set_query('chat_session', function() {
        return {
            filters: {
                'status': ['in', ['Draft', 'Active']]
            }
        };
    });
}


function load_statistics(frm) {
    if (frm.doc.__islocal) return;
    
    // Load and display basic statistics
    if (frm.doc.content) {
        const word_count = frm.doc.content.split(/\s+/).length;
        const char_count = frm.doc.content.length;
        
        frm.dashboard.add_comment(
            __('Content: {0} words, {1} characters, {2} tokens', 
               [word_count, char_count, frm.doc.tokens_used || 0]),
            'blue'
        );
    }
}


function handle_message_type_change(frm) {
    // Adjust sender_type based on message_type
    if (frm.doc.message_type === 'User') {
        frm.set_value('sender_type', 'User');
    } else if (frm.doc.message_type === 'Assistant') {
        frm.set_value('sender_type', 'AI Model');
    } else if (frm.doc.message_type === 'System') {
        frm.set_value('sender_type', 'System');
    }
}


function handle_sender_type_change(frm) {
    // Show/hide fields based on sender type
    if (frm.doc.sender_type === 'User') {
        frm.set_df_property('sender', 'reqd', 1);
        frm.set_df_property('model_used', 'reqd', 0);
    } else if (frm.doc.sender_type === 'AI Model') {
        frm.set_df_property('sender', 'reqd', 0);
        frm.set_df_property('model_used', 'reqd', 1);
    } else {
        frm.set_df_property('sender', 'reqd', 0);
        frm.set_df_property('model_used', 'reqd', 0);
    }
}


function estimate_tokens(content) {
    // Rough estimation: ~4 characters per token
    if (!content) return 0;
    return Math.ceil(content.length / 4);
}


// ==================== Action Functions ====================

function flag_for_review(frm) {
    frappe.prompt(
        {
            label: __('Reason for Flagging'),
            fieldname: 'reason',
            fieldtype: 'Small Text',
            reqd: 1
        },
        function(values) {
            frappe.call({
                method: 'flag_for_review',
                doc: frm.doc,
                args: {
                    reason: values.reason
                },
                callback: function(r) {
                    if (r.message) {
                        frappe.msgprint(__(r.message.message));
                        frm.reload_doc();
                    }
                }
            });
        },
        __('Flag Message for Review'),
        __('Submit')
    );
}


function mark_compliant(frm) {
    frappe.confirm(
        __('Are you sure you want to mark this message as compliant?'),
        function() {
            frappe.call({
                method: 'mark_compliant',
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


function view_session(frm) {
    frappe.set_route('Form', 'Chat Session', frm.doc.chat_session);
}


function show_violations(frm) {
    if (!frm.doc.detected_violations || frm.doc.detected_violations.length === 0) {
        frappe.msgprint(__('No violations detected'));
        return;
    }
    
    let html = '<table class="table table-bordered"><thead><tr>';
    html += '<th>Type</th><th>Severity</th><th>Description</th>';
    html += '</tr></thead><tbody>';
    
    frm.doc.detected_violations.forEach(function(v) {
        html += `<tr><td>${v.violation_type}</td><td>${v.severity}</td><td>${v.description}</td></tr>`;
    });
    
    html += '</tbody></table>';
    
    frappe.msgprint({
        title: __('Detected Violations'),
        message: html,
        indicator: 'red'
    });
}


function show_evidence(frm) {
    if (!frm.doc.extracted_evidence || frm.doc.extracted_evidence.length === 0) {
        frappe.msgprint(__('No evidence extracted'));
        return;
    }
    
    let html = '<table class="table table-bordered"><thead><tr>';
    html += '<th>Type</th><th>Content</th><th>Confidence</th>';
    html += '</tr></thead><tbody>';
    
    frm.doc.extracted_evidence.forEach(function(e) {
        html += `<tr><td>${e.evidence_type}</td><td>${e.content}</td><td>${e.confidence}%</td></tr>`;
    });
    
    html += '</tbody></table>';
    
    frappe.msgprint({
        title: __('Extracted Evidence'),
        message: html,
        indicator: 'blue'
    });
}


function show_statistics(frm) {
    frappe.call({
        method: 'get_message_statistics',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                const stats = r.message;
                
                let dialog = new frappe.ui.Dialog({
                    title: __('Message Statistics'),
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
            <h4>Message Statistics</h4>
            <table class="table table-bordered">
                <tr>
                    <td><strong>Message ID:</strong></td>
                    <td>${stats.message_id}</td>
                </tr>
                <tr>
                    <td><strong>Type:</strong></td>
                    <td><span class="indicator ${get_type_color(stats.message_type)}">${stats.message_type}</span></td>
                </tr>
                <tr>
                    <td><strong>Word Count:</strong></td>
                    <td>${stats.word_count || 0}</td>
                </tr>
                <tr>
                    <td><strong>Character Count:</strong></td>
                    <td>${stats.character_count || 0}</td>
                </tr>
                <tr>
                    <td><strong>Tokens Used:</strong></td>
                    <td>${stats.tokens_used || 0}</td>
                </tr>
                <tr>
                    <td><strong>Compliance Status:</strong></td>
                    <td><span class="indicator ${get_compliance_color(stats.compliance_status)}">${stats.compliance_status}</span></td>
                </tr>
                <tr>
                    <td><strong>Violations Found:</strong></td>
                    <td>${stats.violations_count || 0}</td>
                </tr>
                <tr>
                    <td><strong>Evidence Extracted:</strong></td>
                    <td>${stats.evidence_count || 0}</td>
                </tr>
                <tr>
                    <td><strong>Citations:</strong></td>
                    <td>${stats.citations_count || 0}</td>
                </tr>
                <tr>
                    <td><strong>Created At:</strong></td>
                    <td>${frappe.datetime.str_to_user(stats.created_at)}</td>
                </tr>
            </table>
        </div>
    `;
}


function get_type_color(type) {
    const colors = {
        'User': 'blue',
        'Assistant': 'green',
        'System': 'gray',
        'Error': 'red',
        'Notification': 'orange'
    };
    return colors[type] || 'gray';
}


function get_compliance_color(status) {
    const colors = {
        'Not Checked': 'gray',
        'Compliant': 'green',
        'Non-Compliant': 'red',
        'Under Review': 'orange',
        'Exempt': 'blue'
    };
    return colors[status] || 'gray';
}