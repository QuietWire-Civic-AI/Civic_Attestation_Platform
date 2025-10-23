/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: compliance_event.js
*/

frappe.ui.form.on('Compliance Event', {
    refresh: function(frm) {
        // Set up page styling
        setup_page_style(frm);
        
        // Add custom buttons
        add_custom_buttons(frm);
        
        // Set up field dependencies
        setup_field_dependencies(frm);
        
        // Show status indicators
        show_status_indicators(frm);
        
        // Set up auto-refresh
        setup_auto_refresh(frm);
    },
    
    onload: function(frm) {
        // Set default values for new events
        if (frm.is_new()) {
            set_default_values(frm);
        }
        
        // Load related data
        load_related_data(frm);
    },
    
    event_type: function(frm) {
        // Load event type specific templates
        load_event_templates(frm);
        
        // Set default fields based on event type
        set_event_type_defaults(frm);
    },
    
    status: function(frm) {
        // Handle status change
        handle_status_change(frm);
    },
    
    priority: function(frm) {
        // Update severity based on priority
        if (frm.doc.priority && !frm.doc.severity) {
            frm.set_value('severity', frm.doc.priority);
        }
    },
    
    event_date: function(frm) {
        // Calculate end date if duration is set
        calculate_end_date(frm);
    },
    
    event_end_date: function(frm) {
        // Calculate duration
        calculate_duration(frm);
    },
    
    duration_minutes: function(frm) {
        // Calculate end date from duration
        if (frm.doc.event_date && frm.doc.duration_minutes) {
            let start = frappe.datetime.str_to_obj(frm.doc.event_date);
            let end = new Date(start.getTime() + (frm.doc.duration_minutes * 60000));
            frm.set_value('event_end_date', frappe.datetime.obj_to_str(end));
        }
    },
    
    issues_identified: function(frm) {
        // Calculate compliance rate
        calculate_compliance_rate(frm);
    },
    
    issues_resolved: function(frm) {
        // Calculate compliance rate
        calculate_compliance_rate(frm);
    },
    
    follow_up_required: function(frm) {
        // Show/hide follow-up date field
        frm.toggle_reqd('follow_up_date', frm.doc.follow_up_required);
    }
});

function setup_page_style(frm) {
    // Add priority color coding
    if (frm.doc.priority) {
        const priority_colors = {
            'Critical': 'red',
            'High': 'orange',
            'Medium': 'yellow',
            'Low': 'blue'
        };
        
        let color = priority_colors[frm.doc.priority] || 'gray';
        frm.page.set_indicator(frm.doc.priority, color);
    }
    
    // Add status indicator
    if (frm.doc.status) {
        const status_colors = {
            'Scheduled': 'blue',
            'In Progress': 'orange',
            'Completed': 'green',
            'Cancelled': 'red',
            'Postponed': 'gray',
            'Under Review': 'yellow',
            'Closed': 'gray'
        };
        
        let color = status_colors[frm.doc.status] || 'gray';
        frm.page.add_indicator(frm.doc.status, color);
    }
}

function add_custom_buttons(frm) {
    if (!frm.is_new()) {
        // Mark as Completed button
        if (frm.doc.status !== 'Completed' && frm.doc.status !== 'Closed') {
            frm.add_custom_button(__('Mark as Completed'), function() {
                frappe.call({
                    method: 'mark_as_completed',
                    doc: frm.doc,
                    callback: function(r) {
                        if (r.message && r.message.success) {
                            frm.reload_doc();
                            frappe.show_alert({
                                message: __('Event Completed'),
                                indicator: 'green'
                            });
                        }
                    }
                });
            }, __('Actions'));
        }
        
        // Schedule Follow-up button
        frm.add_custom_button(__('Schedule Follow-up'), function() {
            show_follow_up_dialog(frm);
        }, __('Actions'));
        
        // Add Finding button
        frm.add_custom_button(__('Add Finding'), function() {
            show_add_finding_dialog(frm);
        }, __('Actions'));
        
        // Generate Report button
        frm.add_custom_button(__('Generate Report'), function() {
            generate_event_report(frm);
        }, __('Reports'));
        
        // View Timeline button
        frm.add_custom_button(__('View Timeline'), function() {
            show_event_timeline(frm);
        }, __('View'));
        
        // Send Reminder button
        if (frm.doc.status === 'Scheduled') {
            frm.add_custom_button(__('Send Reminder'), function() {
                send_event_reminder(frm);
            }, __('Actions'));
        }
    }
}

function setup_field_dependencies(frm) {
    // Show/hide follow-up date based on checkbox
    frm.toggle_display('follow_up_date', frm.doc.follow_up_required);
    frm.toggle_reqd('follow_up_date', frm.doc.follow_up_required);
    
    // Show/hide reference name based on reference doctype
    frm.toggle_display('reference_name', frm.doc.reference_doctype);
    
    // Show/hide outcome fields based on status
    const show_outcomes = ['Completed', 'Closed'].includes(frm.doc.status);
    frm.toggle_display(['outcome_summary', 'recommendations', 'lessons_learned'], show_outcomes);
}

function show_status_indicators(frm) {
    // Add compliance score indicator
    if (frm.doc.compliance_score) {
        let color = 'green';
        if (frm.doc.compliance_score < 50) color = 'red';
        else if (frm.doc.compliance_score < 75) color = 'orange';
        
        frm.dashboard.add_indicator(
            __('Compliance Score: {0}%', [frm.doc.compliance_score.toFixed(2)]),
            color
        );
    }
    
    // Add metrics indicators
    if (frm.doc.issues_identified || frm.doc.issues_resolved) {
        frm.dashboard.add_indicator(
            __('Issues: {0} Identified, {1} Resolved', 
                [frm.doc.issues_identified || 0, frm.doc.issues_resolved || 0]),
            'blue'
        );
    }
    
    // Add attendee count
    if (frm.doc.attendee_count) {
        frm.dashboard.add_indicator(
            __('Attendees: {0}', [frm.doc.attendee_count]),
            'blue'
        );
    }
    
    // Show upcoming event warning
    if (frm.doc.status === 'Scheduled' && frm.doc.event_date) {
        let event_date = frappe.datetime.str_to_obj(frm.doc.event_date);
        let now = frappe.datetime.now_date(true);
        let days_until = Math.floor((event_date - now) / (1000 * 60 * 60 * 24));
        
        if (days_until <= 7 && days_until >= 0) {
            frm.dashboard.add_indicator(
                __('Upcoming in {0} days', [days_until]),
                'orange'
            );
        }
    }
}

function setup_auto_refresh(frm) {
    // Auto-refresh for active events every 5 minutes
    if (!frm.is_new() && frm.doc.status === 'In Progress') {
        setTimeout(function() {
            frm.reload_doc();
        }, 300000); // 5 minutes
    }
}

function set_default_values(frm) {
    // Set event date to now
    if (!frm.doc.event_date) {
        frm.set_value('event_date', frappe.datetime.now_datetime());
    }
    
    // Set default tenant if available
    if (frappe.boot.user_tenant) {
        frm.set_value('tenant', frappe.boot.user_tenant);
    }
    
    // Set default organizer
    if (!frm.doc.organizer) {
        frm.set_value('organizer', frappe.session.user);
    }
}

function load_related_data(frm) {
    if (!frm.is_new()) {
        // Load related statistics
        frappe.call({
            method: 'generate_report',
            doc: frm.doc,
            callback: function(r) {
                if (r.message) {
                    // Could display in dashboard
                }
            }
        });
    }
}

function load_event_templates(frm) {
    if (frm.doc.event_type && frm.is_new()) {
        const templates = {
            'Violation Detected': {
                description: 'A compliance violation has been detected and requires investigation.',
                event_category: 'Detective',
                priority: 'High'
            },
            'Compliance Audit': {
                description: 'Comprehensive audit of compliance processes and controls.',
                event_category: 'Assessment',
                priority: 'High'
            },
            'Policy Review': {
                description: 'Review and update of organizational policies.',
                event_category: 'Preventive',
                priority: 'Medium'
            },
            'Training Session': {
                description: 'Compliance training session for staff.',
                event_category: 'Training',
                priority: 'Medium'
            },
            'Risk Assessment': {
                description: 'Assessment of compliance risks.',
                event_category: 'Assessment',
                priority: 'High'
            },
            'Incident Response': {
                description: 'Response to compliance incident.',
                event_category: 'Corrective',
                priority: 'Critical'
            }
        };
        
        let template = templates[frm.doc.event_type];
        if (template) {
            if (!frm.doc.description) {
                frm.set_value('description', template.description);
            }
            if (!frm.doc.event_category) {
                frm.set_value('event_category', template.event_category);
            }
            if (!frm.doc.priority) {
                frm.set_value('priority', template.priority);
            }
        }
    }
}

function set_event_type_defaults(frm) {
    // Set default duration based on event type
    if (frm.is_new() && !frm.doc.duration_minutes) {
        const durations = {
            'Training Session': 120,
            'Compliance Audit': 240,
            'Policy Review': 60,
            'Risk Assessment': 180
        };
        
        if (durations[frm.doc.event_type]) {
            frm.set_value('duration_minutes', durations[frm.doc.event_type]);
        }
    }
}

function handle_status_change(frm) {
    // Auto-set end date when completed
    if (frm.doc.status === 'Completed' && !frm.doc.event_end_date) {
        frm.set_value('event_end_date', frappe.datetime.now_datetime());
    }
    
    // Show/hide outcome fields
    setup_field_dependencies(frm);
}

function calculate_end_date(frm) {
    if (frm.doc.event_date && frm.doc.duration_minutes && !frm.doc.event_end_date) {
        let start = frappe.datetime.str_to_obj(frm.doc.event_date);
        let end = new Date(start.getTime() + (frm.doc.duration_minutes * 60000));
        frm.set_value('event_end_date', frappe.datetime.obj_to_str(end));
    }
}

function calculate_duration(frm) {
    if (frm.doc.event_date && frm.doc.event_end_date) {
        let start = frappe.datetime.str_to_obj(frm.doc.event_date);
        let end = frappe.datetime.str_to_obj(frm.doc.event_end_date);
        let duration = Math.floor((end - start) / 60000); // minutes
        
        if (duration > 0) {
            frm.set_value('duration_minutes', duration);
        }
    }
}

function calculate_compliance_rate(frm) {
    if (frm.doc.issues_identified && frm.doc.issues_identified > 0) {
        let resolved = frm.doc.issues_resolved || 0;
        let rate = (resolved / frm.doc.issues_identified) * 100;
        frm.set_value('compliance_rate', rate);
    }
}

function show_follow_up_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Schedule Follow-up Event'),
        fields: [
            {
                fieldtype: 'Date',
                fieldname: 'follow_up_date',
                label: __('Follow-up Date'),
                reqd: 1
            },
            {
                fieldtype: 'Text Editor',
                fieldname: 'description',
                label: __('Description')
            }
        ],
        primary_action_label: __('Schedule'),
        primary_action: function(values) {
            frappe.call({
                method: 'schedule_follow_up',
                doc: frm.doc,
                args: {
                    follow_up_date: values.follow_up_date,
                    description: values.description
                },
                callback: function(r) {
                    if (r.message && r.message.success) {
                        dialog.hide();
                        frm.reload_doc();
                        frappe.show_alert({
                            message: __('Follow-up event scheduled'),
                            indicator: 'green'
                        });
                        
                        // Open the new follow-up event
                        if (r.message.follow_up_name) {
                            frappe.set_route('Form', 'Compliance Event', r.message.follow_up_name);
                        }
                    }
                }
            });
        }
    });
    
    dialog.show();
}

function show_add_finding_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Add Finding'),
        fields: [
            {
                fieldtype: 'Select',
                fieldname: 'finding_type',
                label: __('Finding Type'),
                options: 'Issue\nObservation\nCompliance Gap\nRisk\nOpportunity',
                reqd: 1
            },
            {
                fieldtype: 'Text Editor',
                fieldname: 'description',
                label: __('Description'),
                reqd: 1
            },
            {
                fieldtype: 'Select',
                fieldname: 'severity',
                label: __('Severity'),
                options: 'Critical\nHigh\nMedium\nLow',
                reqd: 1
            },
            {
                fieldtype: 'Select',
                fieldname: 'status',
                label: __('Status'),
                options: 'Open\nIn Progress\nResolved\nClosed',
                default: 'Open'
            }
        ],
        primary_action_label: __('Add'),
        primary_action: function(values) {
            frappe.call({
                method: 'add_finding',
                doc: frm.doc,
                args: values,
                callback: function(r) {
                    if (r.message && r.message.success) {
                        dialog.hide();
                        frm.reload_doc();
                        frappe.show_alert({
                            message: __('Finding added'),
                            indicator: 'green'
                        });
                    }
                }
            });
        }
    });
    
    dialog.show();
}

function generate_event_report(frm) {
    frappe.call({
        method: 'generate_report',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                let report = r.message;
                
                let dialog = new frappe.ui.Dialog({
                    title: __('Event Report'),
                    size: 'large'
                });
                
                let html = '<div class="event-report">';
                html += '<h3>' + report.title + '</h3>';
                html += '<table class="table table-bordered">';
                html += '<tr><th>Event ID</th><td>' + report.event_id + '</td></tr>';
                html += '<tr><th>Event Type</th><td>' + report.event_type + '</td></tr>';
                html += '<tr><th>Status</th><td>' + report.status + '</td></tr>';
                html += '<tr><th>Event Date</th><td>' + frappe.datetime.str_to_user(report.event_date) + '</td></tr>';
                html += '<tr><th>Compliance Score</th><td>' + (report.compliance_score || 'N/A') + '</td></tr>';
                html += '<tr><th>Findings</th><td>' + report.findings_count + '</td></tr>';
                html += '<tr><th>Actions</th><td>' + report.actions_count + '</td></tr>';
                html += '<tr><th>Participants</th><td>' + report.participants_count + '</td></tr>';
                html += '<tr><th>Issues Identified</th><td>' + report.issues_identified + '</td></tr>';
                html += '<tr><th>Issues Resolved</th><td>' + report.issues_resolved + '</td></tr>';
                html += '</table></div>';
                
                dialog.$body.html(html);
                dialog.show();
            }
        }
    });
}

function show_event_timeline(frm) {
    frappe.call({
        method: 'get_event_timeline',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                let dialog = new frappe.ui.Dialog({
                    title: __('Event Timeline'),
                    size: 'large'
                });
                
                let html = '<div class="timeline">';
                
                r.message.forEach(function(item) {
                    html += '<div class="timeline-item">';
                    html += '<div class="timeline-badge"></div>';
                    html += '<div class="timeline-content">';
                    html += '<h4>' + item.event + '</h4>';
                    html += '<p><strong>Date:</strong> ' + frappe.datetime.str_to_user(item.date) + '</p>';
                    if (item.user) {
                        html += '<p><strong>User:</strong> ' + item.user + '</p>';
                    }
                    if (item.details) {
                        html += '<p>' + item.details + '</p>';
                    }
                    html += '</div></div>';
                });
                
                html += '</div>';
                
                dialog.$body.html(html);
                dialog.show();
            }
        }
    });
}

function send_event_reminder(frm) {
    frappe.confirm(
        __('Send reminder notification to all participants?'),
        function() {
            frappe.call({
                method: 'frappe.client.set_value',
                args: {
                    doctype: 'Compliance Event',
                    name: frm.doc.name,
                    fieldname: 'notification_sent',
                    value: 0
                },
                callback: function() {
                    frm.reload_doc();
                    frappe.show_alert({
                        message: __('Reminder sent'),
                        indicator: 'green'
                    });
                }
            });
        }
    );
}