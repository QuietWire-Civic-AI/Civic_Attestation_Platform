/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: user_profile.js
*/

frappe.ui.form.on('User Profile', {
	onload: function(frm) {
		// Add custom buttons for quick actions
		if (!frm.is_new()) {
			add_custom_buttons(frm);
			setup_dashboard_indicators(frm);
		}
		
		// Setup field dependencies
		setup_field_dependencies(frm);
	},
	
	refresh: function(frm) {
		// Refresh dashboard indicators
		if (!frm.is_new()) {
			setup_dashboard_indicators(frm);
		}
		
		// Show theme preview
		if (frm.doc.theme) {
			show_theme_badge(frm);
		}
		
		// Show language badge
		if (frm.doc.language) {
			show_language_badge(frm);
		}
	},
	
	user: function(frm) {
		// Auto-populate full name from User
		if (frm.doc.user && !frm.doc.full_name) {
			frappe.db.get_value('User', frm.doc.user, ['full_name', 'first_name'], (r) => {
				if (r) {
					frm.set_value('full_name', r.full_name || frm.doc.user);
					if (!frm.doc.display_name) {
						frm.set_value('display_name', r.first_name || r.full_name || frm.doc.user);
					}
				}
			});
		}
	},
	
	theme: function(frm) {
		// Show immediate feedback on theme change
		if (frm.doc.theme) {
			show_theme_badge(frm);
			frappe.show_alert({
				message: __('Theme changed to {0}. Changes will apply on next page load.', [frm.doc.theme]),
				indicator: 'blue'
			}, 5);
		}
	},
	
	language: function(frm) {
		// Show immediate feedback on language change
		if (frm.doc.language) {
			show_language_badge(frm);
			frappe.show_alert({
				message: __('Language preference updated to {0}', [frm.doc.language === 'ar' ? 'العربية' : 'English']),
				indicator: 'blue'
			}, 5);
		}
	},
	
	tenant: function(frm) {
		// Validate tenant and show info
		if (frm.doc.tenant) {
			frappe.db.get_value('Tenant', frm.doc.tenant, ['tenant_name', 'status', 'plan_type'], (r) => {
				if (r) {
					if (r.status !== 'Active') {
						frappe.msgprint({
							title: __('Warning'),
							message: __('Tenant {0} is {1}. This may affect user access.', [r.tenant_name, r.status]),
							indicator: 'orange'
						});
					}
					
					// Set joined date if not set
					if (!frm.doc.joined_tenant_on) {
						frm.set_value('joined_tenant_on', frappe.datetime.get_today());
					}
				}
			});
		}
	},
	
	enable_email_alerts: function(frm) {
		// Auto-adjust email frequency
		if (!frm.doc.enable_email_alerts) {
			frm.set_value('email_frequency', 'Disabled');
		} else if (frm.doc.email_frequency === 'Disabled') {
			frm.set_value('email_frequency', 'Daily');
		}
	},
	
	enable_slack_alerts: function(frm) {
		if (!frm.doc.enable_slack_alerts) {
			frm.set_value('slack_notification_level', 'Disabled');
		} else if (frm.doc.slack_notification_level === 'Disabled') {
			frm.set_value('slack_notification_level', 'Critical');
		}
	},
	
	enable_teams_alerts: function(frm) {
		if (!frm.doc.enable_teams_alerts) {
			frm.set_value('teams_notification_level', 'Disabled');
		} else if (frm.doc.teams_notification_level === 'Disabled') {
			frm.set_value('teams_notification_level', 'Critical');
		}
	},
	
	items_per_page: function(frm) {
		// Validate items per page
		if (frm.doc.items_per_page) {
			if (frm.doc.items_per_page < 5) {
				frappe.msgprint(__('Items per page should be at least 5'));
				frm.set_value('items_per_page', 20);
			}
			if (frm.doc.items_per_page > 100) {
				frappe.show_alert({
					message: __('Large page sizes may affect performance'),
					indicator: 'orange'
				});
			}
		}
	},
	
	ai_context_length: function(frm) {
		// Validate AI context length
		if (frm.doc.ai_context_length) {
			if (frm.doc.ai_context_length < 1) {
				frappe.msgprint(__('Context length must be at least 1'));
				frm.set_value('ai_context_length', 10);
			}
			if (frm.doc.ai_context_length > 50) {
				frappe.show_alert({
					message: __('Large context length may slow down responses'),
					indicator: 'orange'
				});
			}
		}
	}
});


function add_custom_buttons(frm) {
	// View User Statistics
	frm.add_custom_button(__('View Statistics'), () => {
		frm.call('get_user_statistics').then(r => {
			if (r.message) {
				show_statistics_dialog(r.message);
			}
		});
	}, __('Actions'));
	
	// Get Dashboard Config
	frm.add_custom_button(__('Preview Dashboard Config'), () => {
		frm.call('get_dashboard_config').then(r => {
			if (r.message) {
				show_config_dialog('Dashboard Configuration', r.message);
			}
		});
	}, __('Actions'));
	
	// Get AI Preferences
	frm.add_custom_button(__('Preview AI Preferences'), () => {
		frm.call('get_ai_preferences').then(r => {
			if (r.message) {
				show_config_dialog('AI Preferences', r.message);
			}
		});
	}, __('Actions'));
	
	// View Notification Channels
	frm.add_custom_button(__('Active Notification Channels'), () => {
		frm.call('get_notification_channels').then(r => {
			if (r.message) {
				show_notification_channels_dialog(r.message);
			}
		});
	}, __('Actions'));
}


function setup_dashboard_indicators(frm) {
	// Clear existing indicators
	frm.dashboard.clear_headline();
	
	// Tenant status indicator
	if (frm.doc.tenant && frm.doc.tenant_status) {
		let color = 'blue';
		if (frm.doc.tenant_status === 'Active') color = 'green';
		if (frm.doc.tenant_status === 'Suspended') color = 'red';
		if (frm.doc.tenant_status === 'Pending') color = 'orange';
		
		frm.dashboard.add_indicator(__('Tenant: {0} ({1})', [frm.doc.tenant, frm.doc.tenant_status]), color);
	}
	
	// Activity indicator
	if (frm.doc.last_activity) {
		let time_diff = frappe.datetime.get_diff(frappe.datetime.now_datetime(), frm.doc.last_activity);
		let days_ago = Math.floor(time_diff);
		
		if (days_ago === 0) {
			frm.dashboard.add_indicator(__('Active Today'), 'green');
		} else if (days_ago < 7) {
			frm.dashboard.add_indicator(__('Active {0} days ago', [days_ago]), 'blue');
		} else if (days_ago < 30) {
			frm.dashboard.add_indicator(__('Active {0} days ago', [days_ago]), 'orange');
		} else {
			frm.dashboard.add_indicator(__('Inactive for {0} days', [days_ago]), 'red');
		}
	}
	
	// Statistics summary
	if (frm.doc.total_chat_sessions || frm.doc.total_evidence_uploaded) {
		let summary = [];
		if (frm.doc.total_chat_sessions) summary.push(__('💬 {0} Sessions', [frm.doc.total_chat_sessions]));
		if (frm.doc.total_evidence_uploaded) summary.push(__('📎 {0} Evidence', [frm.doc.total_evidence_uploaded]));
		if (frm.doc.total_violations_reported) summary.push(__('⚠️ {0} Violations', [frm.doc.total_violations_reported]));
		
		if (summary.length > 0) {
			frm.dashboard.set_headline_alert(summary.join(' | '));
		}
	}
}


function setup_field_dependencies(frm) {
	// Setup conditional field visibility and behavior
	// This is handled by depends_on in JSON, but we can add extra logic here
}


function show_theme_badge(frm) {
	let theme_colors = {
		'Light': 'blue',
		'Dark': 'purple',
		'Auto': 'orange'
	};
	
	let color = theme_colors[frm.doc.theme] || 'gray';
	frm.set_df_property('theme', 'description', 
		`<span class="indicator ${color}">${frm.doc.theme} Theme Selected</span>`);
}


function show_language_badge(frm) {
	let lang_name = frm.doc.language === 'ar' ? 'العربية' : 'English';
	frm.set_df_property('language', 'description',
		`<span class="indicator blue">${lang_name}</span>`);
}


function show_statistics_dialog(stats) {
	let html = `
		<div class="row">
			<div class="col-md-6">
				<h5>📊 Activity Statistics</h5>
				<table class="table table-bordered">
					<tr><td><strong>Chat Sessions:</strong></td><td>${stats.total_chat_sessions || 0}</td></tr>
					<tr><td><strong>Messages Sent:</strong></td><td>${stats.total_messages_sent || 0}</td></tr>
					<tr><td><strong>Evidence Uploaded:</strong></td><td>${stats.total_evidence_uploaded || 0}</td></tr>
					<tr><td><strong>Violations Reported:</strong></td><td>${stats.total_violations_reported || 0}</td></tr>
				</table>
			</div>
			<div class="col-md-6">
				<h5>⏰ Account Information</h5>
				<table class="table table-bordered">
					<tr><td><strong>Total Logins:</strong></td><td>${stats.total_login_count || 0}</td></tr>
					<tr><td><strong>Last Login:</strong></td><td>${stats.last_login ? frappe.datetime.str_to_user(stats.last_login) : 'Never'}</td></tr>
					<tr><td><strong>Account Created:</strong></td><td>${stats.account_created_on ? frappe.datetime.str_to_user(stats.account_created_on) : '-'}</td></tr>
					<tr><td><strong>Hours Active:</strong></td><td>${(stats.total_hours_active || 0).toFixed(2)}h</td></tr>
				</table>
			</div>
		</div>
	`;
	
	frappe.msgprint({
		title: __('User Statistics'),
		message: html,
		wide: true
	});
}


function show_config_dialog(title, config) {
	let html = '<table class="table table-bordered">';
	
	for (let key in config) {
		let value = config[key];
		if (typeof value === 'boolean') {
			value = value ? '✅ Enabled' : '❌ Disabled';
		} else if (value === null || value === undefined) {
			value = '-';
		}
		
		let label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
		html += `<tr><td><strong>${label}:</strong></td><td>${value}</td></tr>`;
	}
	
	html += '</table>';
	
	frappe.msgprint({
		title: __(title),
		message: html,
		wide: true
	});
}


function show_notification_channels_dialog(channels) {
	if (!channels || channels.length === 0) {
		frappe.msgprint({
			title: __('No Active Channels'),
			message: __('All notification channels are currently disabled.'),
			indicator: 'orange'
		});
		return;
	}
	
	let html = '<table class="table table-bordered"><thead><tr><th>Channel</th><th>Settings</th></tr></thead><tbody>';
	
	channels.forEach(ch => {
		let settings = '';
		if (ch.frequency) settings += `Frequency: ${ch.frequency}`;
		if (ch.level) settings += `Level: ${ch.level}`;
		if (!settings) settings = 'Enabled';
		
		let icon = '';
		if (ch.channel === 'email') icon = '📧';
		if (ch.channel === 'slack') icon = '💬';
		if (ch.channel === 'teams') icon = '👥';
		if (ch.channel === 'browser') icon = '🔔';
		
		html += `<tr><td>${icon} <strong>${ch.channel.toUpperCase()}</strong></td><td>${settings}</td></tr>`;
	});
	
	html += '</tbody></table>';
	
	frappe.msgprint({
		title: __('Active Notification Channels'),
		message: html,
		wide: true
	});
}
