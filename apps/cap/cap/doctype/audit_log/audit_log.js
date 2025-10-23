/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: audit_log.js
*/

frappe.ui.form.on('Audit Log', {
	// ============================================
	// LIFECYCLE HOOKS
	// ============================================
	
	refresh: function(frm) {
		if (frm.doc.__islocal) {
			// Hide most fields for new log (auto-populated)
			return;
		}
		
		// Setup dashboard indicators
		setup_dashboard_indicators(frm);
		
		// Setup action buttons
		setup_action_buttons(frm);
		
		// Apply conditional formatting
		apply_conditional_formatting(frm);
		
		// Setup field visibility
		setup_field_visibility(frm);
		
		// Setup real-time listeners
		setup_realtime_listeners(frm);
		
		// Make log immutable (read-only)
		frm.disable_save();
	},
	
	onload: function(frm) {
		// Setup field watchers
		setup_field_watchers(frm);
	},
	
	// ============================================
	// FIELD CHANGE HANDLERS
	// ============================================
	
	log_type: function(frm) {
		update_severity_options(frm);
		setup_field_visibility(frm);
	},
	
	event_category: function(frm) {
		setup_field_visibility(frm);
	},
	
	is_anomaly: function(frm) {
		if (frm.doc.is_anomaly) {
			frm.set_intro(__('⚠️ This log has been flagged as anomalous by the detection system.'), 'red');
		}
	},
	
	severity: function(frm) {
		apply_conditional_formatting(frm);
	}
});

// ============================================
// DASHBOARD INDICATORS
// ============================================

function setup_dashboard_indicators(frm) {
	if (!frm.doc.name) return;
	
	frm.dashboard.clear_headline();
	
	// 1. Log Type Indicator
	let log_type_color = get_log_type_color(frm.doc.log_type);
	frm.dashboard.add_indicator(
		__('{0}', [frm.doc.log_type]),
		log_type_color
	);
	
	// 2. Status Indicator
	let status_color = frm.doc.status === 'Success' ? 'green' : 'red';
	frm.dashboard.add_indicator(
		__('{0}', [frm.doc.status]),
		status_color
	);
	
	// 3. Severity Indicator
	let severity_color = get_severity_color(frm.doc.severity);
	frm.dashboard.add_indicator(
		__('Severity: {0}', [frm.doc.severity]),
		severity_color
	);
	
	// 4. Tenant Indicator (if applicable)
	if (frm.doc.tenant_name) {
		frm.dashboard.add_indicator(
			__('Tenant: {0}', [frm.doc.tenant_name]),
			'blue'
		);
	}
	
	// 5. User Indicator
	if (frm.doc.user_name) {
		frm.dashboard.add_indicator(
			__('User: {0}', [frm.doc.user_name]),
			'purple'
		);
	}
	
	// 6. Duration Indicator
	if (frm.doc.duration_ms) {
		let duration_color = 'green';
		if (frm.doc.duration_ms > 500) duration_color = 'orange';
		if (frm.doc.duration_ms > 2000) duration_color = 'red';
		
		frm.dashboard.add_indicator(
			__('Duration: {0}ms', [frm.doc.duration_ms]),
			duration_color
		);
	}
	
	// 7. Anomaly Score (if flagged)
	if (frm.doc.is_anomaly && frm.doc.anomaly_score) {
		let anomaly_color = frm.doc.anomaly_score > 70 ? 'red' : 'orange';
		frm.dashboard.add_indicator(
			__('⚠️ Anomaly: {0}%', [frm.doc.anomaly_score.toFixed(1)]),
			anomaly_color
		);
	}
	
	// 8. Child Logs Indicator
	if (frm.doc.has_children && frm.doc.child_logs_count > 0) {
		frm.dashboard.add_indicator(
			__('Child Logs: {0}', [frm.doc.child_logs_count]),
			'cyan'
		);
	}
	
	// 9. Compliance Framework
	if (frm.doc.compliance_framework) {
		frm.dashboard.add_indicator(
			__('Compliance: {0}', [frm.doc.compliance_framework]),
			'yellow'
		);
	}
}

// ============================================
// ACTION BUTTONS
// ============================================

function setup_action_buttons(frm) {
	if (!frm.doc.name) return;
	
	// 1. View Related Logs (if correlation_id exists)
	if (frm.doc.correlation_id) {
		frm.add_custom_button(__('🔗 View Related Logs'), function() {
			show_related_logs_dialog(frm);
		}, __('Actions'));
	}
	
	// 2. View Target Record (if doctype_affected exists)
	if (frm.doc.doctype_affected && frm.doc.doctype_name) {
		frm.add_custom_button(__('🎯 View Target Record'), function() {
			frappe.set_route('Form', frm.doc.doctype_affected, frm.doc.doctype_name);
		}, __('Actions'));
	}
	
	// 3. User Activity Report
	if (frm.doc.user) {
		frm.add_custom_button(__('📊 User Activity'), function() {
			show_user_activity_dialog(frm);
		}, __('Reports'));
	}
	
	// 4. Security Timeline (if security event)
	if (frm.doc.log_type === 'Security Event') {
		frm.add_custom_button(__('🔐 Security Timeline'), function() {
			show_security_timeline_dialog(frm);
		}, __('Reports'));
	}
	
	// 5. Export Logs
	frm.add_custom_button(__('📋 Export Logs'), function() {
		export_filtered_logs(frm);
	}, __('Actions'));
	
	// 6. View Change Diff (if data change)
	if (frm.doc.log_type === 'Data Change' && frm.doc.change_diff) {
		frm.add_custom_button(__('👁️ View Change Diff'), function() {
			show_change_diff_dialog(frm);
		}, __('Actions'));
	}
	
	// 7. Mark as Reviewed
	if (frm.doc.requires_review && !frm.doc.reviewed_by) {
		frm.add_custom_button(__('✅ Mark as Reviewed'), function() {
			mark_as_reviewed(frm);
		}, __('Actions'));
	}
	
	// 8. Flag as Suspicious
	if (!frm.doc.is_anomaly) {
		frm.add_custom_button(__('🚨 Flag as Suspicious'), function() {
			flag_as_suspicious(frm);
		}, __('Actions'));
	}
	
	// 9. View Child Logs
	if (frm.doc.has_children) {
		frm.add_custom_button__('🔽 View Child Logs'), function() {
			show_child_logs(frm);
		}, __('Actions'));
	}
	
	// 10. Create Alert Rule
	frm.add_custom_button(__('🔔 Create Alert Rule'), function() {
		create_alert_rule_from_log(frm);
	}, __('Advanced'));
}

// ============================================
// CONDITIONAL FORMATTING
// ============================================

function apply_conditional_formatting(frm) {
	if (!frm.doc.name) return;
	
	// Highlight critical events
	if (frm.doc.severity === 'Critical') {
		frm.set_intro(__('🚨 CRITICAL EVENT - Immediate attention required!'), 'red');
	} else if (frm.doc.severity === 'High') {
		frm.set_intro(__('⚠️ High priority event'), 'orange');
	}
	
	// Highlight failed operations
	if (frm.doc.status === 'Failed' && frm.doc.error_message) {
		frm.fields_dict.error_message.$wrapper.css('background-color', '#fff3cd');
	}
	
	// Highlight anomalies
	if (frm.doc.is_anomaly) {
		frm.fields_dict.anomaly_score.$wrapper.css('background-color', '#f8d7da');
	}
	
	// Highlight sensitive data
	if (frm.doc.is_sensitive) {
		frm.dashboard.set_headline_alert(__('⚠️ Contains sensitive/PII data - Handle with care'), 'orange');
	}
}

// ============================================
// FIELD VISIBILITY LOGIC
// ============================================

function setup_field_visibility(frm) {
	if (!frm.doc.name) return;
	
	// Show/hide based on log_type
	let show_api_fields = ['API Call'].includes(frm.doc.log_type);
	frm.toggle_display(['api_endpoint', 'http_method', 'query_params', 'request_body', 
						 'response_status', 'response_size_bytes'], show_api_fields);
	
	let show_data_change_fields = frm.doc.log_type === 'Data Change';
	frm.toggle_display(['doctype_affected', 'doctype_name', 'field_changed', 
						 'old_value', 'new_value', 'change_diff'], show_data_change_fields);
	
	let show_security_fields = frm.doc.log_type === 'Security Event';
	frm.toggle_display(['anomaly_score', 'is_anomaly'], show_security_fields || frm.doc.is_anomaly);
	
	let show_model_fields = frm.doc.event_category === 'Model Usage';
	frm.toggle_display(['model_used', 'tokens_used', 'model_cost'], show_model_fields);
	
	let show_compliance_fields = frm.doc.log_type === 'Compliance Event' || frm.doc.compliance_framework;
	frm.toggle_display(['compliance_framework', 'compliance_requirement'], show_compliance_fields);
	
	// Show review fields only if requires review
	frm.toggle_display(['reviewed_by', 'review_date', 'review_notes'], frm.doc.requires_review);
}

// ============================================
// REAL-TIME LISTENERS
// ============================================

function setup_realtime_listeners(frm) {
	// Listen for security alerts
	frappe.realtime.on('security_alert', function(data) {
		if (data.log_id === frm.doc.log_id) {
			frappe.show_alert({
				message: __('Security Alert: {0}', [data.event_category]),
				indicator: 'red'
			}, 10);
			frm.reload_doc();
		}
	});
	
	// Listen for anomaly detection
	frappe.realtime.on('anomaly_detected', function(data) {
		if (data.log_id === frm.doc.log_id) {
			frappe.show_alert({
				message: __('⚠️ Anomaly Detected: Score {0}%', [data.anomaly_score]),
				indicator: 'orange'
			}, 10);
			frm.reload_doc();
		}
	});
}

// ============================================
// FIELD WATCHERS
// ============================================

function setup_field_watchers(frm) {
	// Watch for changes (shouldn't happen, but for safety)
	frm.fields_dict['event_description']?.df && 
		(frm.fields_dict['event_description'].df.read_only = 1);
}

// ============================================
// DIALOG FUNCTIONS
// ============================================

function show_related_logs_dialog(frm) {
	frappe.call({
		method: 'cap.doctype.audit_log.audit_log.find_related_logs',
		args: {
			correlation_id: frm.doc.correlation_id
		},
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				let html = '<table class="table table-bordered"><thead><tr>' +
					'<th>Timestamp</th><th>Log Type</th><th>Category</th><th>Action</th><th>Status</th><th>Duration</th>' +
					'</tr></thead><tbody>';
				
				r.message.forEach(log => {
					let status_badge = log.status === 'Success' ? 
						'<span class="label label-success">Success</span>' :
						'<span class="label label-danger">Failed</span>';
					
					html += `<tr>
						<td>${log.timestamp}</td>
						<td>${log.log_type}</td>
						<td>${log.event_category}</td>
						<td>${log.event_action}</td>
						<td>${status_badge}</td>
						<td>${log.duration_ms || 0}ms</td>
					</tr>`;
				});
				
				html += '</tbody></table>';
				
				frappe.msgprint({
					title: __('Related Logs (Correlation ID: {0})', [frm.doc.correlation_id]),
					message: html,
					wide: true
				});
			} else {
				frappe.msgprint(__('No related logs found'));
			}
		}
	});
}

function show_user_activity_dialog(frm) {
	let dialog = new frappe.ui.Dialog({
		title: __('User Activity Report'),
		fields: [
			{
				fieldname: 'time_range',
				fieldtype: 'Select',
				label: __('Time Range'),
				options: '7 Days\n30 Days\n90 Days',
				default: '7 Days'
			}
		],
		primary_action_label: __('Generate Report'),
		primary_action: function(values) {
			let days = parseInt(values.time_range);
			let from_date = frappe.datetime.add_days(frappe.datetime.nowdate(), -days);
			
			frappe.call({
				method: 'cap.doctype.audit_log.audit_log.get_user_activity',
				args: {
					user: frm.doc.user,
					from_date: from_date,
					limit: 100
				},
				callback: function(r) {
					if (r.message) {
						display_activity_report(r.message, frm.doc.user);
						dialog.hide();
					}
				}
			});
		}
	});
	
	dialog.show();
}

function show_security_timeline_dialog(frm) {
	frappe.call({
		method: 'cap.doctype.audit_log.audit_log.get_security_events',
		args: {
			severity: 'High',
			days: 30
		},
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				let html = '<div class="timeline">';
				
				r.message.forEach(event => {
					let severity_class = event.severity === 'Critical' ? 'danger' : 'warning';
					let anomaly_badge = event.is_anomaly ? 
						`<span class="label label-danger">Anomaly: ${event.anomaly_score}%</span>` : '';
					
					html += `<div class="timeline-item alert alert-${severity_class}">
						<strong>${event.timestamp}</strong> - ${event.severity}<br>
						<strong>${event.event_category}:</strong> ${event.event_action}<br>
						${event.event_description}<br>
						<small>User: ${event.user || 'Unknown'} | IP: ${event.ip_address || 'Unknown'}</small>
						${anomaly_badge}
					</div>`;
				});
				
				html += '</div>';
				
				frappe.msgprint({
					title: __('Security Event Timeline (Last 30 Days)'),
					message: html,
					wide: true
				});
			} else {
				frappe.msgprint(__('No security events found in the last 30 days'));
			}
		}
	});
}

function show_change_diff_dialog(frm) {
	try {
		let diff = JSON.parse(frm.doc.change_diff);
		let html = '<table class="table table-bordered"><thead><tr>' +
			'<th>Field</th><th>Old Value</th><th>New Value</th>' +
			'</tr></thead><tbody>';
		
		for (let field in diff) {
			html += `<tr>
				<td><strong>${field}</strong></td>
				<td><code>${diff[field].old || 'null'}</code></td>
				<td><code style="background-color: #d4edda;">${diff[field].new || 'null'}</code></td>
			</tr>`;
		}
		
		html += '</tbody></table>';
		
		frappe.msgprint({
			title: __('Change Diff - {0} {1}', [frm.doc.doctype_affected, frm.doc.doctype_name]),
			message: html,
			wide: true
		});
	} catch (e) {
		frappe.msgprint(__('Unable to parse change diff'));
	}
}

function display_activity_report(logs, user) {
	let html = `<h4>Activity Summary for ${user}</h4>`;
	html += `<p><strong>Total Activities:</strong> ${logs.length}</p>`;
	
	// Group by event_category
	let categories = {};
	logs.forEach(log => {
		if (!categories[log.event_category]) {
			categories[log.event_category] = 0;
		}
		categories[log.event_category]++;
	});
	
	html += '<h5>By Category:</h5><ul>';
	for (let cat in categories) {
		html += `<li>${cat}: ${categories[cat]}</li>`;
	}
	html += '</ul>';
	
	// Recent activities table
	html += '<h5>Recent Activities:</h5>';
	html += '<table class="table table-striped"><thead><tr>' +
		'<th>Timestamp</th><th>Category</th><th>Action</th><th>Status</th>' +
		'</tr></thead><tbody>';
	
	logs.slice(0, 20).forEach(log => {
		let status_badge = log.status === 'Success' ? 
			'<span class="label label-success">Success</span>' :
			'<span class="label label-danger">Failed</span>';
		
		html += `<tr>
			<td>${log.timestamp}</td>
			<td>${log.event_category}</td>
			<td>${log.event_action}</td>
			<td>${status_badge}</td>
		</tr>`;
	});
	
	html += '</tbody></table>';
	
	frappe.msgprint({
		title: __('User Activity Report'),
		message: html,
		wide: true
	});
}

// ============================================
// ACTION FUNCTIONS
// ============================================

function mark_as_reviewed(frm) {
	frappe.prompt([
		{
			fieldname: 'review_notes',
			fieldtype: 'Small Text',
			label: __('Review Notes'),
			reqd: 1
		}
	], function(values) {
		frappe.call({
			method: 'frappe.client.set_value',
			args: {
				doctype: 'Audit Log',
				name: frm.doc.name,
				fieldname: {
					'reviewed_by': frappe.session.user,
					'review_date': frappe.datetime.nowdate(),
					'review_notes': values.review_notes,
					'requires_review': 0
				}
			},
			callback: function() {
				frappe.show_alert(__('Marked as reviewed'), 3);
				frm.reload_doc();
			}
		});
	}, __('Mark as Reviewed'));
}

function flag_as_suspicious(frm) {
	frappe.confirm(
		__('Are you sure you want to flag this log as suspicious/anomalous?'),
		function() {
			frappe.call({
				method: 'frappe.client.set_value',
				args: {
					doctype: 'Audit Log',
					name: frm.doc.name,
					fieldname: {
						'is_anomaly': 1,
						'anomaly_score': 100,
						'requires_review': 1
					}
				},
				callback: function() {
					frappe.show_alert({
						message: __('Flagged as suspicious'),
						indicator: 'orange'
					}, 3);
					frm.reload_doc();
				}
			});
		}
	);
}

function show_child_logs(frm) {
	frappe.set_route('List', 'Audit Log', {
		'parent_log': frm.doc.name
	});
}

function export_filtered_logs(frm) {
	frappe.prompt([
		{
			fieldname: 'time_range',
			fieldtype: 'Select',
			label: __('Export Range'),
			options: 'Current Log Only\nLast 7 Days\nLast 30 Days\nAll Logs (Same User)',
			default: 'Current Log Only'
		}
	], function(values) {
		// Export logic would go here
		frappe.msgprint(__('Export functionality will be implemented'));
	}, __('Export Audit Logs'));
}

function create_alert_rule_from_log(frm) {
	frappe.confirm(
		__('Create an alert rule based on this log pattern?'),
		function() {
			frappe.call({
				method: 'cap.doctype.alert_rule.alert_rule.create_alert_rule_from_log',
				args: {
					audit_log_name: frm.doc.name
				},
				callback: function(r) {
					if (r.message) {
						// Open new Alert Rule form with pre-filled data
						let alert_rule = frappe.model.make_new_doc_and_get_name('Alert Rule');
						alert_rule = locals['Alert Rule'][alert_rule];
						
						// Copy values from API response
						Object.assign(alert_rule, r.message);
						
						frappe.set_route('Form', 'Alert Rule', alert_rule.name);
						
						frappe.show_alert({
							message: __('✅ Alert Rule template created! Please review and save.'),
							indicator: 'green'
						}, 5);
					}
				}
			});
		}
	);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function get_log_type_color(log_type) {
	const colors = {
		'System Event': 'blue',
		'User Action': 'green',
		'API Call': 'purple',
		'Data Change': 'orange',
		'Security Event': 'red',
		'Compliance Event': 'yellow',
		'Error': 'red',
		'Warning': 'orange',
		'Info': 'blue',
		'Debug': 'gray'
	};
	return colors[log_type] || 'gray';
}

function get_severity_color(severity) {
	const colors = {
		'Critical': 'red',
		'High': 'orange',
		'Medium': 'yellow',
		'Low': 'green',
		'Info': 'blue'
	};
	return colors[severity] || 'gray';
}

function update_severity_options(frm) {
	// Could dynamically adjust severity options based on log type
	// For now, keep standard options
}
