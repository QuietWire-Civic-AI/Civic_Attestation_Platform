/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: violation.js
*/

frappe.ui.form.on('Violation', {
    refresh: function(frm) {
        // Set up page styling
        setup_page_style(frm);
        
        // Add custom buttons
        add_custom_buttons(frm);
        
        // Set up field dependencies
        setup_field_dependencies(frm);
        
        // Show status indicator
        show_status_indicator(frm);
        
        // Set up auto-refresh for active violations
        setup_auto_refresh(frm);
    },
    
    onload: function(frm) {
        // Set default values for new violations
        if (frm.is_new()) {
            set_default_values(frm);
        }
        
        // Load related data
        load_related_data(frm);
    },
    
    severity: function(frm) {
        // Update risk score when severity changes
        update_risk_score(frm);
        
        // Update recommended deadline
        update_remediation_deadline(frm);
        
        // Show severity warning
        show_severity_warning(frm);
    },
    
    status: function(frm) {
        // Handle status change
        handle_status_change(frm);
        
        // Update required fields based on status
        update_required_fields(frm);
    },
    
    violation_type: function(frm) {
        // Load type-specific templates
        load_violation_templates(frm);
    },
    
    false_positive: function(frm) {
        if (frm.doc.false_positive) {
            frappe.confirm(
                'Mark this violation as a false positive? This will change the status to "False Positive".',
                () => {
                    frm.set_value('status', 'False Positive');
                    frm.save();
                },
                () => {
                    frm.set_value('false_positive', 0);
                }
            );
        }
    },
    
    assigned_to: function(frm) {
        if (frm.doc.assigned_to && frm.doc.status === 'New') {
            frm.set_value('status', 'Under Investigation');
        }
    }
});

function setup_page_style(frm) {
    // Add severity color coding
    if (frm.doc.severity) {
        const severity_colors = {
            'Critical': 'red',
            'High': 'orange',
            'Medium': 'yellow',
            'Low': 'blue',
            'Info': 'gray'
        };
        
        let color = severity_colors[frm.doc.severity] || 'gray';
        frm.page.set_indicator(frm.doc.severity, color);
    }
    
    // Add escalation indicator
    if (frm.doc.escalated) {
        frm.page.add_indicator('ESCALATED', 'red');
    }
}

function add_custom_buttons(frm) {
    if (!frm.is_new()) {
        // Mark as False Positive button
        if (frm.doc.status !== 'False Positive' && !frm.doc.false_positive) {
            frm.add_custom_button(__('Mark as False Positive'), function() {
                frappe.call({
                    method: 'mark_as_false_positive',
                    doc: frm.doc,
                    callback: function(r) {
                        if (r.message && r.message.success) {
                            frm.reload_doc();
                            frappe.show_alert({
                                message: __('Marked as False Positive'),
                                indicator: 'green'
                            });
                        }
                    }
                });
            }, __('Actions'));
        }
        
        // Resolve Violation button
        if (frm.doc.status !== 'Resolved' && frm.doc.status !== 'Closed') {
            frm.add_custom_button(__('Resolve Violation'), function() {
                show_resolve_dialog(frm);
            }, __('Actions'));
        }
        
        // Assign to User button
        frm.add_custom_button(__('Assign to User'), function() {
            show_assign_dialog(frm);
        }, __('Actions'));
        
        // View Related Violations button
        frm.add_custom_button(__('Related Violations'), function() {
            show_related_violations(frm);
        }, __('View'));
        
        // View Timeline button
        frm.add_custom_button(__('Timeline'), function() {
            show_violation_timeline(frm);
        }, __('View'));
        
        // Generate Report button
        frm.add_custom_button(__('Generate Report'), function() {
            generate_violation_report(frm);
        }, __('Reports'));
    }
}

function setup_field_dependencies(frm) {
    // Show/hide resolution fields based on status
    frm.toggle_display(['resolution_date', 'resolution_summary', 'resolved_by', 
                        'resolution_approved_by', 'resolution_approved_date'],
                       frm.doc.status === 'Resolved' || frm.doc.status === 'Closed');
    
    // Show/hide escalation fields
    frm.toggle_display(['escalation_level', 'escalation_date', 'escalation_reason'],
                       frm.doc.escalated);
    
    // Show/hide remediation fields
    frm.toggle_display(['remediation_actions', 'remediation_notes'],
                       frm.doc.remediation_status !== 'Not Required');
}

function show_status_indicator(frm) {
    const status_colors = {
        'New': 'blue',
        'Under Investigation': 'orange',
        'Confirmed': 'red',
        'False Positive': 'gray',
        'Remediation In Progress': 'yellow',
        'Resolved': 'green',
        'Closed': 'gray',
        'Escalated': 'red'
    };
    
    let color = status_colors[frm.doc.status] || 'gray';
    
    // Add status message
    if (frm.doc.status === 'Escalated') {
        frm.dashboard.add_indicator(__('Status: {0} (Level {1})', 
            [frm.doc.status, frm.doc.escalation_level || 1]), 'red');
    } else {
        frm.dashboard.add_indicator(__('Status: {0}', [frm.doc.status]), color);
    }
    
    // Add risk score indicator
    if (frm.doc.risk_score) {
        let risk_color = 'green';
        if (frm.doc.risk_score >= 80) risk_color = 'red';
        else if (frm.doc.risk_score >= 60) risk_color = 'orange';
        else if (frm.doc.risk_score >= 40) risk_color = 'yellow';
        
        frm.dashboard.add_indicator(__('Risk Score: {0}', [frm.doc.risk_score.toFixed(2)]), risk_color);
    }
    
    // Show overdue warning
    if (frm.doc.remediation_deadline && frm.doc.status !== 'Resolved') {
        let deadline = frappe.datetime.str_to_obj(frm.doc.remediation_deadline);
        let today = frappe.datetime.now_date(true);
        
        if (deadline < today) {
            frm.dashboard.add_indicator(__('OVERDUE'), 'red');
        }
    }
}

function setup_auto_refresh(frm) {
    // Auto-refresh for active violations every 5 minutes
    if (!frm.is_new() && frm.doc.status !== 'Resolved' && frm.doc.status !== 'Closed') {
        setTimeout(function() {
            frm.reload_doc();
        }, 300000); // 5 minutes
    }
}

function set_default_values(frm) {
    // Set detection date to now
    if (!frm.doc.detection_date) {
        frm.set_value('detection_date', frappe.datetime.now_datetime());
    }
    
    // Set default tenant if available
    if (frappe.boot.user_tenant) {
        frm.set_value('tenant', frappe.boot.user_tenant);
    }
}

function load_related_data(frm) {
    if (!frm.is_new()) {
        // Load violation statistics
        frappe.call({
            method: 'get_related_violations',
            doc: frm.doc,
            callback: function(r) {
                if (r.message && r.message.length > 0) {
                    frm.dashboard.add_comment(
                        __('Found {0} related violations', [r.message.length]),
                        'blue',
                        true
                    );
                }
            }
        });
    }
}

function update_risk_score(frm) {
    const severity_scores = {
        'Critical': 90,
        'High': 70,
        'Medium': 50,
        'Low': 30,
        'Info': 10
    };
    
    let base_score = severity_scores[frm.doc.severity] || 50;
    
    // Adjust for recurrence
    if (frm.doc.recurrence_count) {
        base_score += Math.min(frm.doc.recurrence_count * 5, 20);
    }
    
    // Adjust for escalation
    if (frm.doc.escalated) {
        base_score += 10;
    }
    
    // Cap at 100
    base_score = Math.min(base_score, 100);
    
    frm.set_value('risk_score', base_score);
}

function update_remediation_deadline(frm) {
    if (!frm.doc.remediation_deadline && frm.doc.severity) {
        const days_map = {
            'Critical': 7,
            'High': 14,
            'Medium': 30,
            'Low': 60,
            'Info': 90
        };
        
        let days = days_map[frm.doc.severity] || 30;
        let deadline = frappe.datetime.add_days(frappe.datetime.now_date(), days);
        
        frm.set_value('remediation_deadline', deadline);
    }
}

function show_severity_warning(frm) {
    if (frm.doc.severity === 'Critical') {
        frappe.msgprint({
            title: __('Critical Severity'),
            message: __('This is a critical severity violation that requires immediate attention and will be automatically escalated if not assigned.'),
            indicator: 'red'
        });
    }
}

function handle_status_change(frm) {
    // Auto-fill resolution date when resolved
    if ((frm.doc.status === 'Resolved' || frm.doc.status === 'Closed') && !frm.doc.resolution_date) {
        frm.set_value('resolution_date', frappe.datetime.now_datetime());
    }
    
    // Require resolution summary for resolved violations
    if (frm.doc.status === 'Resolved' || frm.doc.status === 'Closed') {
        frm.set_df_property('resolution_summary', 'reqd', 1);
    } else {
        frm.set_df_property('resolution_summary', 'reqd', 0);
    }
}

function update_required_fields(frm) {
    // Update field requirements based on status
    const resolved_statuses = ['Resolved', 'Closed'];
    const is_resolved = resolved_statuses.includes(frm.doc.status);
    
    frm.set_df_property('resolution_date', 'reqd', is_resolved);
    frm.set_df_property('resolution_summary', 'reqd', is_resolved);
    frm.set_df_property('resolved_by', 'reqd', is_resolved);
}

function load_violation_templates(frm) {
    // Load description templates based on violation type
    if (frm.doc.violation_type && frm.is_new()) {
        const templates = {
            'Policy Violation': 'Policy violation detected. Review the violated policies and assess compliance impact.',
            'Ethical Breach': 'Ethical breach identified. Investigate the ethical implications and take corrective action.',
            'Bias Detection': 'Bias detected in AI responses. Review for discriminatory patterns and implement bias mitigation.',
            'Privacy Violation': 'Privacy violation occurred. Assess data exposure and implement privacy protection measures.',
            'Security Breach': 'Security breach detected. Immediate investigation and remediation required.',
            'Regulatory Non-Compliance': 'Regulatory non-compliance identified. Review applicable regulations and ensure compliance.',
            'Misinformation': 'Misinformation detected. Verify accuracy and implement fact-checking procedures.',
            'Harmful Content': 'Harmful content identified. Review content policies and implement content moderation.'
        };
        
        if (templates[frm.doc.violation_type] && !frm.doc.description) {
            frm.set_value('description', templates[frm.doc.violation_type]);
        }
    }
}

function show_resolve_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Resolve Violation'),
        fields: [
            {
                fieldtype: 'Text Editor',
                fieldname: 'resolution_summary',
                label: __('Resolution Summary'),
                reqd: 1
            },
            {
                fieldtype: 'Link',
                fieldname: 'resolved_by',
                label: __('Resolved By'),
                options: 'User',
                default: frappe.session.user
            }
        ],
        primary_action_label: __('Resolve'),
        primary_action: function(values) {
            frappe.call({
                method: 'resolve_violation',
                doc: frm.doc,
                args: {
                    resolution_summary: values.resolution_summary,
                    resolved_by: values.resolved_by
                },
                callback: function(r) {
                    if (r.message && r.message.success) {
                        dialog.hide();
                        frm.reload_doc();
                        frappe.show_alert({
                            message: __('Violation Resolved'),
                            indicator: 'green'
                        });
                    }
                }
            });
        }
    });
    
    dialog.show();
}

function show_assign_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Assign Violation'),
        fields: [
            {
                fieldtype: 'Link',
                fieldname: 'assigned_to',
                label: __('Assign To'),
                options: 'User',
                reqd: 1
            }
        ],
        primary_action_label: __('Assign'),
        primary_action: function(values) {
            frappe.call({
                method: 'assign_to_user',
                doc: frm.doc,
                args: {
                    user: values.assigned_to
                },
                callback: function(r) {
                    if (r.message && r.message.success) {
                        dialog.hide();
                        frm.reload_doc();
                        frappe.show_alert({
                            message: __('Violation Assigned'),
                            indicator: 'blue'
                        });
                    }
                }
            });
        }
    });
    
    dialog.show();
}

function show_related_violations(frm) {
    frappe.call({
        method: 'get_related_violations',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                let dialog = new frappe.ui.Dialog({
                    title: __('Related Violations'),
                    size: 'large'
                });
                
                let html = '<table class="table table-bordered">';
                html += '<thead><tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead>';
                html += '<tbody>';
                
                r.message.forEach(function(violation) {
                    html += `<tr>
                        <td><a href="/app/violation/${violation.name}">${violation.name}</a></td>
                        <td>${violation.title}</td>
                        <td>${violation.severity}</td>
                        <td>${violation.status}</td>
                        <td>${frappe.datetime.str_to_user(violation.detection_date)}</td>
                    </tr>`;
                });
                
                html += '</tbody></table>';
                
                dialog.$body.html(html);
                dialog.show();
            }
        }
    });
}

function show_violation_timeline(frm) {
    frappe.call({
        method: 'get_violation_timeline',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                let dialog = new frappe.ui.Dialog({
                    title: __('Violation Timeline'),
                    size: 'large'
                });
                
                let html = '<div class="timeline">';
                
                r.message.forEach(function(event) {
                    html += `<div class="timeline-item">
                        <div class="timeline-badge"></div>
                        <div class="timeline-content">
                            <h4>${event.event}</h4>
                            <p><strong>Date:</strong> ${frappe.datetime.str_to_user(event.date)}</p>
                            ${event.user ? `<p><strong>User:</strong> ${event.user}</p>` : ''}
                            ${event.details ? `<p>${event.details}</p>` : ''}
                        </div>
                    </div>`;
                });
                
                html += '</div>';
                
                dialog.$body.html(html);
                dialog.show();
            }
        }
    });
}

function generate_violation_report(frm) {
    frappe.msgprint(__('Generating report...'));
    
    // This will be implemented with reporting functionality
    frappe.call({
        method: 'frappe.utils.print_format.download_pdf',
        args: {
            doctype: frm.doc.doctype,
            name: frm.doc.name,
            format: 'Standard',
            no_letterhead: 0
        },
        callback: function(r) {
            if (r.message) {
                window.open(r.message);
            }
        }
    });
}