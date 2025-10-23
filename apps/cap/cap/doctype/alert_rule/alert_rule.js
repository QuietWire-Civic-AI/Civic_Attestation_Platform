/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: alert_rule.js
*/

frappe.ui.form.on('Alert Rule', {
	// ============================================
	// LIFECYCLE HOOKS
	// ============================================
	
	refresh: function(frm) {
		setup_dashboard_indicators(frm);
		setup_action_buttons(frm);
		setup_field_dependencies(frm);
		setup_conditional_visibility(frm);
		apply_conditional_formatting(frm);
	},
	
	onload: function(frm) {
		setup_field_watchers(frm);
		load_default_templates(frm);
	},
	
	// ============================================
	// FIELD CHANGE HANDLERS
	// ============================================
	
	trigger_type: function(frm) {
		setup_conditional_visibility(frm);
		update_help_text(frm);
	},
	
	log_type: function(frm) {
		update_event_category_options(frm);
	},
	
	event_category: function(frm) {
		update_event_action_suggestions(frm);
	},
	
	severity: function(frm) {
		apply_conditional_formatting(frm);
	},
	
	is_enabled: function(frm) {
		if (frm.doc.is_enabled) {
			frm.set_intro(__('✅ This alert rule is active and monitoring logs'), 'green');
		} else {
			frm.set_intro(__('⏸️ This alert rule is disabled'), 'orange');
		}
	},
	
	email_enabled: function(frm) {
		if (frm.doc.email_enabled && !frm.doc.email_recipients) {
			frm.set_value('email_recipients', frappe.session.user);
		}
	},
	
	notification_channels: function(frm) {
		auto_enable_channels(frm);
	},
	
	active_hours_only: function(frm) {
		if (frm.doc.active_hours_only && !frm.doc.active_start_time) {
			frm.set_value('active_start_time', '09:00:00');
			frm.set_value('active_end_time', '17:00:00');
		}
	}
});

// ============================================
// DASHBOARD INDICATORS
// ============================================

function setup_dashboard_indicators(frm) {
	if (!frm.doc.__islocal) {
		frm.dashboard.clear_headline();
		
		// 1. Status Indicator
		let status_color = frm.doc.is_enabled ? 'green' : 'gray';
		let status_text = frm.doc.is_enabled ? 'Active' : 'Disabled';
		frm.dashboard.add_indicator(__('Status: {0}', [status_text]), status_color);
		
		// 2. Severity Indicator
		let severity_color = get_severity_color(frm.doc.severity);
		frm.dashboard.add_indicator(__('Severity: {0}', [frm.doc.severity]), severity_color);
		
		// 3. Trigger Type
		frm.dashboard.add_indicator(__('Type: {0}', [frm.doc.trigger_type]), 'blue');
		
		// 4. Total Triggers
		if (frm.doc.total_triggers > 0) {
			frm.dashboard.add_indicator(
				__('Triggers: {0}', [frm.doc.total_triggers]),
				'purple'
			);
		}
		
		// 5. Success Rate
		if (frm.doc.total_alerts_sent > 0) {
			let success_rate = Math.round(
				(frm.doc.success_count / frm.doc.total_alerts_sent) * 100
			);
			let rate_color = success_rate > 90 ? 'green' : success_rate > 70 ? 'orange' : 'red';
			frm.dashboard.add_indicator(
				__('Success Rate: {0}%', [success_rate]),
				rate_color
			);
		}
		
		// 6. Last Triggered
		if (frm.doc.last_triggered_at) {
			let time_ago = moment(frm.doc.last_triggered_at).fromNow();
			frm.dashboard.add_indicator(
				__('Last Trigger: {0}', [time_ago]),
				'gray'
			);
		}
	}
}

// ============================================
// ACTION BUTTONS
// ============================================

function setup_action_buttons(frm) {
	if (!frm.doc.__islocal) {
		// 1. Test Alert Button
		frm.add_custom_button(__('🧪 Test Alert'), function() {
			test_alert_rule(frm);
		});
		
		// 2. View Statistics Button
		frm.add_custom_button(__('📊 View Statistics'), function() {
			show_statistics_dialog(frm);
		});
		
		// 3. View Matching Logs Button
		frm.add_custom_button(__('📋 View Matching Logs'), function() {
			view_matching_logs(frm);
		});
		
		// 4. Enable/Disable Button
		if (frm.doc.is_enabled) {
			frm.add_custom_button(__('⏸️ Disable Rule'), function() {
				frm.set_value('is_enabled', 0);
				frm.save();
			}, __('Actions'));
		} else {
			frm.add_custom_button(__('▶️ Enable Rule'), function() {
				frm.set_value('is_enabled', 1);
				frm.save();
			}, __('Actions'));
		}
		
		// 5. Duplicate Rule Button
		frm.add_custom_button(__('📋 Duplicate Rule'), function() {
			duplicate_alert_rule(frm);
		}, __('Actions'));
		
		// 6. Reset Statistics Button
		frm.add_custom_button(__('🔄 Reset Statistics'), function() {
			reset_statistics(frm);
		}, __('Actions'));
	}
}

// ============================================
// FIELD DEPENDENCIES
// ============================================

function setup_field_dependencies(frm) {
	// Email fields
	frm.toggle_display(['email_recipients'], frm.doc.email_enabled);
	frm.toggle_reqd(['email_recipients'], frm.doc.email_enabled);
	
	// Slack fields
	frm.toggle_display(['slack_webhook_url'], frm.doc.slack_enabled);
	frm.toggle_reqd(['slack_webhook_url'], frm.doc.slack_enabled);
	
	// Teams fields
	frm.toggle_display(['teams_webhook_url'], frm.doc.teams_enabled);
	frm.toggle_reqd(['teams_webhook_url'], frm.doc.teams_enabled);
	
	// Active hours fields
	frm.toggle_display(['active_start_time', 'active_end_time'], frm.doc.active_hours_only);
}

function setup_conditional_visibility(frm) {
	// Threshold fields
	let show_threshold = frm.doc.trigger_type === 'Threshold';
	frm.toggle_display(['threshold_type', 'threshold_value', 'threshold_period_minutes'], show_threshold);
	
	// Consecutive matches field
	let show_consecutive = frm.doc.trigger_type === 'Consecutive Events';
	frm.toggle_display(['consecutive_matches'], show_consecutive);
	
	// Anomaly score field
	let show_anomaly = frm.doc.trigger_type === 'Anomaly Detection';
	frm.toggle_display(['anomaly_score_threshold'], show_anomaly);
}

// ============================================
// CONDITIONAL FORMATTING
// ============================================

function apply_conditional_formatting(frm) {
	// Severity-based formatting
	if (frm.doc.severity === 'Critical') {
		frm.set_intro(__('🚨 Critical alert rule - highest priority'), 'red');
	} else if (frm.doc.severity === 'High') {
		frm.set_intro(__('⚠️ High severity alert rule'), 'orange');
	} else if (!frm.doc.is_enabled) {
		frm.set_intro(__('⏸️ This alert rule is currently disabled'), 'gray');
	}
	
	// Highlight fields based on status
	if (!frm.doc.email_enabled && !frm.doc.slack_enabled && !frm.doc.teams_enabled) {
		frappe.msgprint({
			title: __('Warning'),
			message: __('No notification channels are enabled!'),
			indicator: 'orange'
		});
	}
}

// ============================================
// FIELD WATCHERS
// ============================================

function setup_field_watchers(frm) {
	// Watch for changes in filter fields
	let filter_fields = [
		'log_type', 'event_category', 'event_action',
		'status_filter', 'user_filter', 'ip_address_pattern'
	];
	
	filter_fields.forEach(function(field) {
		frm.fields_dict[field]?.$input?.on('change', function() {
			update_matching_count_preview(frm);
		});
	});
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function get_severity_color(severity) {
	const colors = {
		'Low': 'green',
		'Medium': 'blue',
		'High': 'orange',
		'Critical': 'red'
	};
	return colors[severity] || 'gray';
}

function load_default_templates(frm) {
	if (frm.doc.__islocal) {
		if (!frm.doc.subject_template) {
			frm.set_value('subject_template', '[{severity}] Alert: {rule_name}');
		}
		if (!frm.doc.message_template) {
			let template = `<p><strong>Alert Rule:</strong> {rule_name}</p>
<p><strong>Severity:</strong> {severity}</p>
<p><strong>Description:</strong> {description}</p>
<p><strong>Triggered At:</strong> {timestamp}</p>
<p><strong>Event Count:</strong> {count}</p>`;
			frm.set_value('message_template', template);
		}
	}
}

function auto_enable_channels(frm) {
	if (frm.doc.notification_channels === 'Email') {
		frm.set_value('email_enabled', 1);
	} else if (frm.doc.notification_channels === 'Slack') {
		frm.set_value('slack_enabled', 1);
	} else if (frm.doc.notification_channels === 'Microsoft Teams') {
		frm.set_value('teams_enabled', 1);
	} else if (frm.doc.notification_channels === 'All Channels') {
		frm.set_value('email_enabled', 1);
		frm.set_value('slack_enabled', 1);
		frm.set_value('teams_enabled', 1);
	}
}

function update_help_text(frm) {
	const help_texts = {
		'Pattern Match': 'Alert when a log matches the defined pattern',
		'Threshold': 'Alert when event count exceeds threshold in time period',
		'Anomaly Detection': 'Alert when anomaly score exceeds threshold',
		'Consecutive Events': 'Alert after N consecutive matching events',
		'Time-based': 'Alert based on time schedule'
	};
	
	let help = help_texts[frm.doc.trigger_type];
	if (help) {
		frm.set_df_property('trigger_type', 'description', help);
	}
}

function update_event_category_options(frm) {
	// Different categories available for different log types
	const category_map = {
		'User Action': ['Authentication', 'Authorization', 'Data Access', 'Export'],
		'Data Change': ['Data Modification', 'Deletion', 'Configuration'],
		'Security Event': ['Authentication', 'Authorization', 'Violation'],
		'API Call': ['API'],
		'Model Usage': ['Model', 'Chat']
	};
	
	// This is informational - Frappe Select fields don't support dynamic options easily
}

function update_event_action_suggestions(frm) {
	// Show common actions for the selected category
	const action_suggestions = {
		'Authentication': ['login', 'logout', 'failed_login', 'password_reset'],
		'Data Modification': ['create', 'update', 'delete', 'bulk_update'],
		'Export': ['export_csv', 'export_pdf', 'export_excel']
	};
	
	let suggestions = action_suggestions[frm.doc.event_category];
	if (suggestions) {
		let help = 'Common actions: ' + suggestions.join(', ');
		frm.set_df_property('event_action', 'description', help);
	}
}

function update_matching_count_preview(frm) {
	if (frm.doc.__islocal) return;
	
	// Show count of matching logs in last 24 hours
	frappe.call({
		method: 'frappe.client.get_count',
		args: {
			doctype: 'Audit Log',
			filters: build_filter_dict(frm)
		},
		callback: function(r) {
			if (r.message !== undefined) {
				let msg = __('Matching logs in last 24h: {0}', [r.message]);
				frm.dashboard.set_headline(msg);
			}
		}
	});
}

function build_filter_dict(frm) {
	let filters = {};
	
	if (frm.doc.log_type) filters['log_type'] = frm.doc.log_type;
	if (frm.doc.event_category) filters['event_category'] = frm.doc.event_category;
	if (frm.doc.event_action) filters['event_action'] = frm.doc.event_action;
	if (frm.doc.status_filter) filters['status'] = frm.doc.status_filter;
	if (frm.doc.user_filter) filters['user'] = frm.doc.user_filter;
	if (frm.doc.tenant) filters['tenant'] = frm.doc.tenant;
	
	// Last 24 hours
	let yesterday = frappe.datetime.add_days(frappe.datetime.now_datetime(), -1);
	filters['timestamp'] = ['>=', yesterday];
	
	return filters;
}

// ============================================
// DIALOG FUNCTIONS
// ============================================

function test_alert_rule(frm) {
	if (!frm.doc.email_enabled && !frm.doc.slack_enabled && !frm.doc.teams_enabled) {
		frappe.msgprint({
			title: __('Cannot Test'),
			message: __('Please enable at least one notification channel first'),
			indicator: 'orange'
		});
		return;
	}
	
	frappe.confirm(
		__('Send a test alert using current configuration?'),
		function() {
			frappe.call({
				method: 'cap.doctype.alert_rule.alert_rule.test_alert_rule',
				args: {
					alert_rule_name: frm.doc.name
				},
				callback: function(r) {
					if (r.message && r.message.success) {
						frappe.show_alert({
							message: __('✅ Test alert sent successfully!'),
							indicator: 'green'
						}, 5);
					} else {
						frappe.msgprint({
							title: __('Test Failed'),
							message: r.message?.message || __('Test alert failed'),
							indicator: 'red'
						});
					}
				}
			});
		}
	);
}

function show_statistics_dialog(frm) {
	frappe.call({
		method: 'cap.doctype.alert_rule.alert_rule.get_alert_statistics',
		args: {
			alert_rule_name: frm.doc.name,
			days: 30
		},
		callback: function(r) {
			if (r.message) {
				let stats = r.message;
				
				let html = `
					<div class="alert-statistics">
						<h4>${__('Alert Rule Statistics')}</h4>
						<table class="table table-bordered">
							<tr>
								<th>${__('Total Triggers')}</th>
								<td>${stats.total_triggers}</td>
							</tr>
							<tr>
								<th>${__('Total Alerts Sent')}</th>
								<td>${stats.total_alerts_sent}</td>
							</tr>
							<tr>
								<th>${__('Successful Alerts')}</th>
								<td><span class="text-success">${stats.success_count}</span></td>
							</tr>
							<tr>
								<th>${__('Failed Alerts')}</th>
								<td><span class="text-danger">${stats.failure_count}</span></td>
							</tr>
							<tr>
								<th>${__('Success Rate')}</th>
								<td>${calculate_success_rate(stats)}%</td>
							</tr>
							<tr>
								<th>${__('Last Triggered')}</th>
								<td>${stats.last_triggered_at || 'Never'}</td>
							</tr>
							<tr>
								<th>${__('Last Alert Sent')}</th>
								<td>${stats.last_alert_sent_at || 'Never'}</td>
							</tr>
							<tr>
								<th>${__('Alerts (Last 30 Days)')}</th>
								<td>${stats.alerts_last_30_days}</td>
							</tr>
						</table>
					</div>
				`;
				
				frappe.msgprint({
					title: __('Statistics - {0}', [stats.rule_name]),
					message: html,
					wide: true
				});
			}
		}
	});
}

function view_matching_logs(frm) {
	// Open Audit Log list with filters from this rule
	let filters = build_filter_dict(frm);
	
	frappe.set_route('List', 'Audit Log', filters);
}

function duplicate_alert_rule(frm) {
	frappe.confirm(
		__('Create a copy of this alert rule?'),
		function() {
			let new_doc = frappe.model.copy_doc(frm.doc);
			new_doc.rule_name = frm.doc.rule_name + ' (Copy)';
			new_doc.is_enabled = 0;  // Start disabled
			
			// Reset statistics
			new_doc.total_triggers = 0;
			new_doc.total_alerts_sent = 0;
			new_doc.success_count = 0;
			new_doc.failure_count = 0;
			new_doc.last_triggered_at = null;
			new_doc.last_alert_sent_at = null;
			
			frappe.set_route('Form', 'Alert Rule', new_doc.name);
		}
	);
}

function reset_statistics(frm) {
	frappe.confirm(
		__('Reset all statistics for this alert rule?'),
		function() {
			frm.set_value('total_triggers', 0);
			frm.set_value('total_alerts_sent', 0);
			frm.set_value('success_count', 0);
			frm.set_value('failure_count', 0);
			frm.set_value('last_triggered_at', null);
			frm.set_value('last_alert_sent_at', null);
			frm.save();
			
			frappe.show_alert({
				message: __('✅ Statistics reset successfully'),
				indicator: 'green'
			}, 3);
		}
	);
}

function calculate_success_rate(stats) {
	if (stats.total_alerts_sent === 0) return 0;
	return Math.round((stats.success_count / stats.total_alerts_sent) * 100);
}

// ============================================
// REAL-TIME LISTENERS
// ============================================

frappe.realtime.on('alert_triggered', function(data) {
	if (cur_frm && cur_frm.doctype === 'Alert Rule' && cur_frm.doc.name === data.alert_rule) {
		frappe.show_alert({
			message: __('🔔 Alert triggered! Notification sent.'),
			indicator: 'blue'
		}, 5);
		
		// Refresh form to update statistics
		cur_frm.reload_doc();
	}
});
