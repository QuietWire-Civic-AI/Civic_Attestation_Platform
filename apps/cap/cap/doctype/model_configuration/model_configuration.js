/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: model_configuration.js
*/

frappe.ui.form.on('Model Configuration', {
	
	refresh(frm) {
		// Setup performance indicators
		setup_performance_indicators(frm);
		
		// Add custom action buttons
		add_action_buttons(frm);
		
		// Setup real-time updates
		if (!frm.is_new()) {
			setup_realtime_updates(frm);
		}
		
		// Apply conditional formatting
		apply_conditional_formatting(frm);
		
		// Setup field dependencies
		setup_field_dependencies(frm);
	},
	
	
	provider(frm) {
		update_provider_fields(frm);
		set_provider_defaults(frm);
	},
	
	
	model_type(frm) {
		update_type_specific_fields(frm);
	},
	
	
	input_cost_per_1k_tokens(frm) {
		calculate_derived_costs(frm);
		validate_against_budget(frm);
	},
	
	
	output_cost_per_1k_tokens(frm) {
		calculate_derived_costs(frm);
		validate_against_budget(frm);
	},
	
	
	inherit_from_system(frm) {
		if (frm.doc.inherit_from_system) {
			load_system_settings(frm);
		}
	},
	
	
	monthly_budget_limit(frm) {
		update_budget_indicators(frm);
	},
	
	
	enabled(frm) {
		if (!frm.doc.enabled) {
			frappe.show_alert({
				message: __('Model has been disabled'),
				indicator: 'orange'
			});
		}
	},
	
	
	is_default(frm) {
		if (frm.doc.is_default) {
			frappe.show_alert({
				message: __('This model will be set as default for {0} type', [frm.doc.model_type]),
				indicator: 'blue'
			});
		}
	}
});


function setup_performance_indicators(frm) {
	if (frm.is_new()) return;
	
	// Clear existing indicators
	frm.dashboard.clear_headline();
	
	// Success Rate Indicator
	let success_rate = frm.doc.success_rate || 0;
	let success_color = success_rate >= 95 ? 'green' : success_rate >= 80 ? 'orange' : 'red';
	
	frm.dashboard.add_indicator(
		__('Success Rate: {0}%', [success_rate.toFixed(2)]),
		success_color
	);
	
	// Total Requests Indicator
	frm.dashboard.add_indicator(
		__('Total Requests: {0}', [format_number(frm.doc.total_requests || 0)]),
		'blue'
	);
	
	// Monthly Cost Indicator
	if (frm.doc.cost_tracking_enabled) {
		let cost_color = 'blue';
		
		// Calculate budget percentage
		if (frm.doc.monthly_budget_limit && frm.doc.monthly_cost_current) {
			let budget_pct = (frm.doc.monthly_cost_current / frm.doc.monthly_budget_limit) * 100;
			cost_color = budget_pct >= 100 ? 'red' : budget_pct >= 80 ? 'orange' : 'green';
		}
		
		frm.dashboard.add_indicator(
			__('Monthly Cost: {0}', [format_currency(frm.doc.monthly_cost_current || 0)]),
			cost_color
		);
	}
	
	// Health Status Indicator
	let health_colors = {
		'Healthy': 'green',
		'Degraded': 'orange',
		'Down': 'red',
		'Unknown': 'gray'
	};
	
	frm.dashboard.add_indicator(
		__('Health: {0}', [frm.doc.health_status || 'Unknown']),
		health_colors[frm.doc.health_status] || 'gray'
	);
	
	// Average Response Time
	if (frm.doc.average_response_time) {
		let response_color = frm.doc.average_response_time < 2 ? 'green' : 
							 frm.doc.average_response_time < 5 ? 'orange' : 'red';
		
		frm.dashboard.add_indicator(
			__('Avg Response: {0}s', [frm.doc.average_response_time.toFixed(2)]),
			response_color
		);
	}
	
	// Progress bar for budget if applicable
	if (frm.doc.monthly_budget_limit && frm.doc.cost_tracking_enabled) {
		let budget_pct = (frm.doc.monthly_cost_current / frm.doc.monthly_budget_limit) * 100;
		let budget_color = budget_pct >= 100 ? 'red' : budget_pct >= 80 ? 'orange' : 'blue';
		
		frm.dashboard.add_progress(
			__('Budget Usage'),
			budget_pct.toFixed(1) + '%',
			budget_pct,
			budget_color
		);
	}
}


function add_action_buttons(frm) {
	if (frm.is_new()) return;
	
	// Test Model Button
	frm.add_custom_button(__('Test Model'), () => {
		test_model(frm);
	}, __('Actions'));
	
	// Reset Statistics Button
	frm.add_custom_button(__('Reset Statistics'), () => {
		frappe.confirm(
			__('Are you sure you want to reset all statistics? This action cannot be undone.'),
			() => {
				reset_statistics(frm);
			}
		);
	}, __('Actions'));
	
	// Health Check Button
	frm.add_custom_button(__('Health Check'), () => {
		perform_health_check(frm);
	}, __('Actions'));
	
	// Reset Monthly Cost Button
	frm.add_custom_button(__('Reset Monthly Cost'), () => {
		frappe.confirm(
			__('Reset the monthly cost counter?'),
			() => {
				reset_monthly_cost(frm);
			}
		);
	}, __('Actions'));
	
	// Usage History Button
	frm.add_custom_button(__('Usage History'), () => {
		show_usage_history(frm);
	}, __('View'));
	
	// Cost Analysis Button
	frm.add_custom_button(__('Cost Analysis'), () => {
		show_cost_analysis(frm);
	}, __('View'));
	
	// Performance Metrics Button
	frm.add_custom_button(__('Performance Metrics'), () => {
		show_performance_metrics(frm);
	}, __('View'));
}


function test_model(frm) {
	frappe.show_alert({
		message: __('Testing model configuration...'),
		indicator: 'blue'
	});
	
	frappe.call({
		method: 'test_model',
		doc: frm.doc,
		callback: (r) => {
			if (r.message.success) {
				frappe.show_alert({
					message: __('✅ Model test successful!'),
					indicator: 'green'
				});
				
				// Show detailed results in dialog
				let d = new frappe.ui.Dialog({
					title: __('Model Test Results'),
					fields: [
						{
							fieldtype: 'HTML',
							fieldname: 'test_results',
							options: `
								<div style="padding: 15px;">
									<h4 style="color: green;">✅ Test Successful</h4>
									<p><strong>Model ID:</strong> ${r.message.model_id}</p>
									<p><strong>Provider:</strong> ${r.message.provider}</p>
									<p><strong>Message:</strong> ${r.message.message}</p>
								</div>
							`
						}
					]
				});
				d.show();
			} else {
				frappe.show_alert({
					message: __('❌ Model test failed: {0}', [r.message.message]),
					indicator: 'red'
				});
			}
		}
	});
}


function reset_statistics(frm) {
	frappe.call({
		method: 'reset_statistics',
		doc: frm.doc,
		callback: () => {
			frm.reload_doc();
		}
	});
}


function reset_monthly_cost(frm) {
	frappe.call({
		method: 'reset_monthly_cost',
		doc: frm.doc,
		callback: () => {
			frm.reload_doc();
		}
	});
}


function perform_health_check(frm) {
	frappe.show_alert({
		message: __('Performing health check...'),
		indicator: 'blue'
	});
	
	frappe.call({
		method: 'perform_health_check',
		doc: frm.doc,
		callback: (r) => {
			if (r.message) {
				let status_colors = {
					'Healthy': 'green',
					'Degraded': 'orange',
					'Down': 'red',
					'Unknown': 'gray'
				};
				
				frappe.show_alert({
					message: __('Health Status: {0}', [r.message.health_status]),
					indicator: status_colors[r.message.health_status]
				});
				
				frm.reload_doc();
			}
		}
	});
}


function show_usage_history(frm) {
	frappe.call({
		method: 'get_usage_statistics',
		doc: frm.doc,
		args: { period: 'month' },
		callback: (r) => {
			if (r.message) {
				let stats = r.message;
				
				let d = new frappe.ui.Dialog({
					title: __('Usage Statistics - {0}', [frm.doc.model_id]),
					size: 'large',
					fields: [
						{
							fieldtype: 'HTML',
							fieldname: 'usage_stats',
							options: generate_usage_stats_html(stats)
						}
					]
				});
				d.show();
			}
		}
	});
}


function generate_usage_stats_html(stats) {
	return `
		<div style="padding: 20px; font-family: Arial, sans-serif;">
			<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
				<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
					<h4 style="margin: 0 0 10px 0; color: #495057;">📊 Request Statistics</h4>
					<p style="margin: 5px 0;"><strong>Total Requests:</strong> ${format_number(stats.total_requests)}</p>
					<p style="margin: 5px 0;"><strong>Successful:</strong> <span style="color: green;">${format_number(stats.successful_requests)}</span></p>
					<p style="margin: 5px 0;"><strong>Failed:</strong> <span style="color: red;">${format_number(stats.failed_requests)}</span></p>
					<p style="margin: 5px 0;"><strong>Success Rate:</strong> <span style="color: ${stats.success_rate >= 95 ? 'green' : 'orange'};">${stats.success_rate.toFixed(2)}%</span></p>
				</div>
				
				<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
					<h4 style="margin: 0 0 10px 0; color: #495057;">💰 Cost Statistics</h4>
					<p style="margin: 5px 0;"><strong>Total Cost:</strong> ${format_currency(stats.total_cost)}</p>
					<p style="margin: 5px 0;"><strong>Monthly Cost:</strong> ${format_currency(stats.monthly_cost)}</p>
					<p style="margin: 5px 0;"><strong>Avg Cost/Request:</strong> ${format_currency(stats.average_cost_per_request)}</p>
				</div>
				
				<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
					<h4 style="margin: 0 0 10px 0; color: #495057;">🔢 Token Statistics</h4>
					<p style="margin: 5px 0;"><strong>Total Tokens:</strong> ${format_number(stats.total_tokens)}</p>
				</div>
				
				<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
					<h4 style="margin: 0 0 10px 0; color: #495057;">❤️ Health Status</h4>
					<p style="margin: 5px 0; font-size: 18px;">
						<strong>Status:</strong> 
						<span style="color: ${{ 'Healthy': 'green', 'Degraded': 'orange', 'Down': 'red', 'Unknown': 'gray' }[stats.health_status]};">
							${stats.health_status}
						</span>
					</p>
				</div>
			</div>
		</div>
	`;
}


function show_cost_analysis(frm) {
	let html = `
		<div style="padding: 20px;">
			<h3>💰 Cost Analysis</h3>
			<table class="table table-bordered">
				<tr>
					<th>Metric</th>
					<th>Value</th>
				</tr>
				<tr>
					<td>Input Cost (per 1K tokens)</td>
					<td>${format_currency(frm.doc.input_cost_per_1k_tokens || 0)}</td>
				</tr>
				<tr>
					<td>Output Cost (per 1K tokens)</td>
					<td>${format_currency(frm.doc.output_cost_per_1k_tokens || 0)}</td>
				</tr>
				<tr>
					<td>Total Cost to Date</td>
					<td><strong>${format_currency(frm.doc.total_cost_to_date || 0)}</strong></td>
				</tr>
				<tr>
					<td>Current Month Cost</td>
					<td><strong>${format_currency(frm.doc.monthly_cost_current || 0)}</strong></td>
				</tr>
				<tr>
					<td>Monthly Budget Limit</td>
					<td>${format_currency(frm.doc.monthly_budget_limit || 0)}</td>
				</tr>
			</table>
		</div>
	`;
	
	let d = new frappe.ui.Dialog({
		title: __('Cost Analysis'),
		fields: [
			{
				fieldtype: 'HTML',
				options: html
			}
		]
	});
	d.show();
}


function show_performance_metrics(frm) {
	let html = `
		<div style="padding: 20px;">
			<h3>📊 Performance Metrics</h3>
			<div style="margin-bottom: 20px;">
				<h4>Response Time</h4>
				<p>Average: <strong>${(frm.doc.average_response_time || 0).toFixed(3)}s</strong></p>
			</div>
			
			<div style="margin-bottom: 20px;">
				<h4>Token Efficiency</h4>
				<p>Average Tokens per Request: <strong>${format_number(frm.doc.average_tokens_per_request || 0)}</strong></p>
			</div>
			
			<div style="margin-bottom: 20px;">
				<h4>Reliability</h4>
				<p>Success Rate: <strong style="color: ${frm.doc.success_rate >= 95 ? 'green' : 'orange'};">${(frm.doc.success_rate || 0).toFixed(2)}%</strong></p>
				<p>Failed Requests: <strong>${format_number(frm.doc.failed_requests || 0)}</strong></p>
			</div>
		</div>
	`;
	
	let d = new frappe.ui.Dialog({
		title: __('Performance Metrics'),
		fields: [
			{
				fieldtype: 'HTML',
				options: html
			}
		]
	});
	d.show();
}


function update_provider_fields(frm) {
	// Update field visibility based on provider
	if (frm.doc.provider === 'Azure OpenAI') {
		frm.set_df_property('api_endpoint', 'reqd', 1);
	} else {
		frm.set_df_property('api_endpoint', 'reqd', 0);
	}
}


function set_provider_defaults(frm) {
	if (frm.is_new()) {
		// Set default rate limits based on provider
		let defaults = {
			'OpenAI': { rpm: 3500, tpm: 90000 },
			'Anthropic': { rpm: 4000, tpm: 100000 },
			'Azure OpenAI': { rpm: 3000, tpm: 80000 },
			'Google': { rpm: 1500, tpm: 60000 },
			'Custom': { rpm: 1000, tpm: 50000 }
		};
		
		let provider_defaults = defaults[frm.doc.provider];
		if (provider_defaults) {
			if (!frm.doc.requests_per_minute) {
				frm.set_value('requests_per_minute', provider_defaults.rpm);
			}
			if (!frm.doc.tokens_per_minute) {
				frm.set_value('tokens_per_minute', provider_defaults.tpm);
			}
		}
	}
}


function update_type_specific_fields(frm) {
	// Show/hide fields based on model type
	if (frm.doc.model_type === 'Vision' || frm.doc.model_type === 'Multimodal') {
		frm.set_value('supports_vision', 1);
	}
}


function calculate_derived_costs(frm) {
	if (frm.doc.input_cost_per_1k_tokens) {
		frm.set_value('input_cost_per_1m_tokens', frm.doc.input_cost_per_1k_tokens * 1000);
	}
	
	if (frm.doc.output_cost_per_1k_tokens) {
		frm.set_value('output_cost_per_1m_tokens', frm.doc.output_cost_per_1k_tokens * 1000);
	}
}


function validate_against_budget(frm) {
	if (frm.doc.monthly_budget_limit && frm.doc.monthly_cost_current) {
		if (frm.doc.monthly_cost_current >= frm.doc.monthly_budget_limit) {
			frappe.show_alert({
				message: __('⚠️ Monthly budget limit reached!'),
				indicator: 'red'
			});
		}
	}
}


function load_system_settings(frm) {
	frappe.call({
		method: 'frappe.client.get',
		args: {
			doctype: 'System Settings',
			name: 'System Settings'
		},
		callback: (r) => {
			if (r.message) {
				let settings = r.message;
				
				// Inherit API key based on provider
				if (frm.doc.provider === 'OpenAI' && settings.openai_api_key) {
					frappe.show_alert({
						message: __('API key inherited from System Settings'),
						indicator: 'blue'
					});
				}
				
				// Inherit rate limits
				if (settings.global_rate_limit_per_minute && !frm.doc.requests_per_minute) {
					frm.set_value('requests_per_minute', settings.global_rate_limit_per_minute);
				}
			}
		}
	});
}


function setup_realtime_updates(frm) {
	// Listen for budget alerts
	frappe.realtime.on('budget_alert', (data) => {
		if (data.model_id === frm.doc.model_id) {
			frappe.show_alert({
				message: __('⚠️ Budget Alert: {0}% of budget used', [data.budget_percentage.toFixed(2)]),
				indicator: 'orange'
			}, 10);
			frm.reload_doc();
		}
	});
	
	// Listen for health alerts
	frappe.realtime.on('health_alert', (data) => {
		if (data.model_id === frm.doc.model_id) {
			frappe.show_alert({
				message: __('⚠️ Health Alert: Status changed to {0}', [data.status]),
				indicator: 'red'
			}, 10);
			frm.reload_doc();
		}
	});
}


function apply_conditional_formatting(frm) {
	// Highlight disabled models
	if (!frm.doc.enabled) {
		frm.set_indicator_formatter('enabled', (doc) => {
			return doc.enabled ? 'green' : 'red';
		});
	}
	
	// Highlight default models
	if (frm.doc.is_default) {
		frm.set_intro(__('⭐ This is the default model for {0} type', [frm.doc.model_type]), 'blue');
	}
	
	// Warning for deprecated models
	if (frm.doc.status === 'Deprecated') {
		frm.set_intro(__('⚠️ This model is deprecated. Consider switching to: {0}', [frm.doc.replacement_model || 'a newer model']), 'orange');
	}
}


function setup_field_dependencies(frm) {
	// Enable/disable fields based on other fields
	if (!frm.doc.cost_tracking_enabled) {
		frm.set_df_property('monthly_budget_limit', 'read_only', 1);
		frm.set_df_property('cost_alert_threshold', 'read_only', 1);
	} else {
		frm.set_df_property('monthly_budget_limit', 'read_only', 0);
		frm.set_df_property('cost_alert_threshold', 'read_only', 0);
	}
}


function update_budget_indicators(frm) {
	if (frm.doc.monthly_budget_limit && frm.doc.monthly_cost_current) {
		let percentage = (frm.doc.monthly_cost_current / frm.doc.monthly_budget_limit) * 100;
		
		if (percentage >= 100) {
			frappe.show_alert({
				message: __('🚨 Budget limit exceeded!'),
				indicator: 'red'
			});
		} else if (percentage >= frm.doc.cost_alert_threshold) {
			frappe.show_alert({
				message: __('⚠️ Approaching budget limit ({0}%)', [percentage.toFixed(2)]),
				indicator: 'orange'
			});
		}
	}
}


function format_number(num) {
	return Number(num || 0).toLocaleString();
}
