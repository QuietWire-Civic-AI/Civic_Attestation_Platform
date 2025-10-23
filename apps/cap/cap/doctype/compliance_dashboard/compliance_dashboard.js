/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: compliance_dashboard.js
*/

frappe.ui.form.on('Compliance Dashboard', {
	refresh: function(frm) {
		// Hide standard form fields since this is a dashboard
		frm.disable_save();
		
		// Initialize dashboard
		if (!frm.dashboard_initialized) {
			initialize_dashboard(frm);
			frm.dashboard_initialized = true;
		}
		
		// Add custom buttons
		add_custom_buttons(frm);
		
		// Load dashboard data
		load_dashboard_data(frm);
		
		// Setup auto-refresh
		if (frm.doc.auto_refresh) {
			setup_auto_refresh(frm);
		}
	},
	
	auto_refresh: function(frm) {
		if (frm.doc.auto_refresh) {
			setup_auto_refresh(frm);
		} else {
			clear_auto_refresh(frm);
		}
	},
	
	default_period: function(frm) {
		load_dashboard_data(frm);
	},
	
	default_tenant: function(frm) {
		load_dashboard_data(frm);
	}
});


// ═══════════════════════════════════════════════════════════════
// DASHBOARD INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function initialize_dashboard(frm) {
	// Create dashboard container
	frm.dashboard_container = $('<div class="compliance-dashboard-container"></div>');
	frm.fields_dict.dashboard_settings_section.$wrapper.before(frm.dashboard_container);
	
	// Add custom CSS
	add_custom_styles();
	
	// Create dashboard layout
	create_dashboard_layout(frm);
}


function create_dashboard_layout(frm) {
	const container = frm.dashboard_container;
	
	container.html(`
		<div class="compliance-dashboard">
			<!-- Header -->
			<div class="dashboard-header">
				<h2>
					<svg class="icon icon-md" style="margin-right: 8px;">
						<use href="#icon-chart"></use>
					</svg>
					Compliance Dashboard
				</h2>
				<div class="dashboard-controls">
					<select class="form-control input-sm" id="dashboard-tenant-filter" style="width: 150px; display: inline-block; margin-right: 10px;">
						<option value="">All Tenants</option>
					</select>
					<select class="form-control input-sm" id="dashboard-period-filter" style="width: 120px; display: inline-block;">
						<option value="7">Last 7 Days</option>
						<option value="30" selected>Last 30 Days</option>
						<option value="90">Last 90 Days</option>
						<option value="180">Last 6 Months</option>
						<option value="365">Last Year</option>
					</select>
					<button class="btn btn-sm btn-default" id="dashboard-refresh" style="margin-left: 10px;">
						<svg class="icon icon-sm">
							<use href="#icon-refresh"></use>
						</svg>
						Refresh
					</button>
					<button class="btn btn-sm btn-default" id="dashboard-export">
						<svg class="icon icon-sm">
							<use href="#icon-download"></use>
						</svg>
						Export
					</button>
				</div>
			</div>
			
			<!-- Loading Indicator -->
			<div class="dashboard-loading" style="display: none;">
				<div class="text-center" style="padding: 50px;">
					<i class="fa fa-spinner fa-spin fa-3x text-muted"></i>
					<p class="text-muted" style="margin-top: 20px;">Loading dashboard data...</p>
				</div>
			</div>
			
			<!-- KPI Cards Section -->
			<div class="kpi-section" style="display: none;">
				<div class="row">
					<div class="col-sm-3">
						<div class="kpi-card kpi-primary">
							<div class="kpi-icon">📊</div>
							<div class="kpi-content">
								<div class="kpi-label">Compliance Score</div>
								<div class="kpi-value" id="kpi-compliance-score">--</div>
								<div class="kpi-trend" id="kpi-compliance-trend"></div>
							</div>
						</div>
					</div>
					<div class="col-sm-3">
						<div class="kpi-card kpi-warning">
							<div class="kpi-icon">⚠️</div>
							<div class="kpi-content">
								<div class="kpi-label">Active Violations</div>
								<div class="kpi-value" id="kpi-violations">--</div>
								<div class="kpi-subtitle" id="kpi-critical-violations"></div>
							</div>
						</div>
					</div>
					<div class="col-sm-3">
						<div class="kpi-card kpi-success">
							<div class="kpi-icon">✅</div>
							<div class="kpi-content">
								<div class="kpi-label">Resolved Issues</div>
								<div class="kpi-value" id="kpi-resolved">--</div>
								<div class="kpi-subtitle">Last 30 days</div>
							</div>
						</div>
					</div>
					<div class="col-sm-3">
						<div class="kpi-card kpi-info">
							<div class="kpi-icon">📋</div>
							<div class="kpi-content">
								<div class="kpi-label">Active Policies</div>
								<div class="kpi-value" id="kpi-policies">--</div>
								<div class="kpi-subtitle" id="kpi-pending-reviews"></div>
							</div>
						</div>
					</div>
				</div>
				
				<!-- Second Row of KPIs -->
				<div class="row" style="margin-top: 20px;">
					<div class="col-sm-3">
						<div class="kpi-card kpi-secondary">
							<div class="kpi-icon">⏱️</div>
							<div class="kpi-content">
								<div class="kpi-label">Avg Response Time</div>
								<div class="kpi-value" id="kpi-response-time">--</div>
								<div class="kpi-subtitle">hours</div>
							</div>
						</div>
					</div>
					<div class="col-sm-3">
						<div class="kpi-card kpi-danger">
							<div class="kpi-icon">🎭</div>
							<div class="kpi-content">
								<div class="kpi-label">Risk Score</div>
								<div class="kpi-value" id="kpi-risk-score">--</div>
								<div class="kpi-subtitle">out of 100</div>
							</div>
						</div>
					</div>
					<div class="col-sm-6">
						<div class="kpi-card" style="height: 100%;">
							<div class="kpi-content" style="padding: 15px;">
								<div class="kpi-label">Compliance Rate Trend</div>
								<div style="display: flex; align-items: center; margin-top: 10px;">
									<div class="kpi-value" id="kpi-trend-value" style="margin: 0;">--</div>
									<div id="kpi-trend-indicator" style="margin-left: 15px; font-size: 32px;"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Charts Section -->
			<div class="charts-section" style="display: none; margin-top: 30px;">
				<div class="row">
					<!-- Compliance Trend Chart -->
					<div class="col-sm-6">
						<div class="chart-card">
							<div class="chart-header">
								<h4>📈 Compliance Score Trend</h4>
							</div>
							<div class="chart-body">
								<div id="compliance-trend-chart"></div>
							</div>
						</div>
					</div>
					
					<!-- Violations Chart -->
					<div class="col-sm-6">
						<div class="chart-card">
							<div class="chart-header">
								<h4>📊 Violations by Type</h4>
							</div>
							<div class="chart-body">
								<div id="violations-chart"></div>
							</div>
						</div>
					</div>
				</div>
				
				<div class="row" style="margin-top: 20px;">
					<!-- Risk Distribution Chart -->
					<div class="col-sm-6">
						<div class="chart-card">
							<div class="chart-header">
								<h4>🎯 Risk Level Distribution</h4>
							</div>
							<div class="chart-body">
								<div id="risk-distribution-chart"></div>
							</div>
						</div>
					</div>
					
					<!-- Policy Status Chart -->
					<div class="col-sm-6">
						<div class="chart-card">
							<div class="chart-header">
								<h4>📋 Policy Status</h4>
							</div>
							<div class="chart-body">
								<div id="policy-status-chart"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Live Feed Section -->
			<div class="live-feed-section" style="display: none; margin-top: 30px;">
				<div class="row">
					<!-- Live Alerts -->
					<div class="col-sm-6">
						<div class="feed-card">
							<div class="feed-header">
								<h4>🔴 Live Alerts</h4>
								<span class="badge badge-danger" id="alert-count">0</span>
							</div>
							<div class="feed-body" id="live-alerts-feed">
								<p class="text-muted text-center">No recent alerts</p>
							</div>
						</div>
					</div>
					
					<!-- Recent Events -->
					<div class="col-sm-6">
						<div class="feed-card">
							<div class="feed-header">
								<h4>📋 Recent Events</h4>
								<span class="badge badge-info" id="event-count">0</span>
							</div>
							<div class="feed-body" id="recent-events-feed">
								<p class="text-muted text-center">No recent events</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`);
	
	// Attach event listeners
	attach_event_listeners(frm);
}


// ═══════════════════════════════════════════════════════════════
// DATA LOADING
// ═══════════════════════════════════════════════════════════════

function load_dashboard_data(frm) {
	const tenant = $('#dashboard-tenant-filter').val() || frm.doc.default_tenant || null;
	const period = $('#dashboard-period-filter').val() || frm.doc.default_period || 30;
	
	// Show loading
	$('.dashboard-loading').show();
	$('.kpi-section, .charts-section, .live-feed-section').hide();
	
	// Fetch data from server
	frappe.call({
		method: 'cap.doctype.compliance_dashboard.compliance_dashboard.get_dashboard_data',
		args: {
			tenant: tenant,
			period: period
		},
		callback: function(r) {
			if (r.message) {
				render_dashboard(frm, r.message);
			}
		},
		error: function(r) {
			frappe.msgprint({
				title: __('Error'),
				indicator: 'red',
				message: __('Failed to load dashboard data')
			});
			$('.dashboard-loading').hide();
		}
	});
}


function render_dashboard(frm, data) {
	// Hide loading
	$('.dashboard-loading').hide();
	
	// Show sections
	if (frm.doc.show_kpi_cards) {
		$('.kpi-section').show();
		render_kpis(data.kpis);
	}
	
	if (frm.doc.show_compliance_chart || frm.doc.show_violations_chart || 
		frm.doc.show_risk_chart || frm.doc.show_policy_chart) {
		$('.charts-section').show();
		render_charts(frm, data);
	}
	
	if (frm.doc.show_live_alerts) {
		$('.live-feed-section').show();
		render_live_feed(data);
	}
}


// ═══════════════════════════════════════════════════════════════
// KPI RENDERING
// ═══════════════════════════════════════════════════════════════

function render_kpis(kpis) {
	// Compliance Score
	$('#kpi-compliance-score').text(kpis.compliance_score + '%');
	
	const trend_icon = kpis.trend_direction === 'up' ? '↑' : 
	                  (kpis.trend_direction === 'down' ? '↓' : '→');
	const trend_class = kpis.trend_direction === 'up' ? 'text-success' : 
	                   (kpis.trend_direction === 'down' ? 'text-danger' : 'text-muted');
	
	$('#kpi-compliance-trend').html(
		`<span class="${trend_class}">${trend_icon} ${Math.abs(kpis.compliance_trend)}%</span>`
	);
	
	// Violations
	$('#kpi-violations').text(kpis.active_violations);
	$('#kpi-critical-violations').html(
		`<span class="text-danger">${kpis.critical_violations} Critical</span>`
	);
	
	// Resolved Issues
	$('#kpi-resolved').text(kpis.resolved_issues);
	
	// Active Policies
	$('#kpi-policies').text(kpis.active_policies);
	$('#kpi-pending-reviews').html(
		`<span class="text-warning">${kpis.pending_reviews} Pending Reviews</span>`
	);
	
	// Response Time
	$('#kpi-response-time').text(kpis.avg_response_time.toFixed(1));
	
	// Risk Score
	$('#kpi-risk-score').text(Math.round(kpis.risk_score));
	
	// Trend
	$('#kpi-trend-value').text(kpis.compliance_trend + '%');
	$('#kpi-trend-indicator').html(
		kpis.trend_direction === 'up' ? '📈' : 
		(kpis.trend_direction === 'down' ? '📉' : '➡️')
	);
}


// ═══════════════════════════════════════════════════════════════
// CHART RENDERING
// ═══════════════════════════════════════════════════════════════

function render_charts(frm, data) {
	// Get chart settings
	const chart_height = frm.doc.chart_height || 300;
	
	// 1. Compliance Trend Chart
	if (frm.doc.show_compliance_chart && data.compliance_trend) {
		render_compliance_trend_chart(data.compliance_trend, chart_height, frm.doc.compliance_chart_type);
	}
	
	// 2. Violations Chart
	if (frm.doc.show_violations_chart && data.violations_summary) {
		render_violations_chart(data.violations_summary, chart_height, frm.doc.violations_chart_type);
	}
	
	// 3. Risk Distribution Chart
	if (frm.doc.show_risk_chart && data.risk_distribution) {
		render_risk_chart(data.risk_distribution, chart_height);
	}
	
	// 4. Policy Status Chart
	if (frm.doc.show_policy_chart && data.policy_statistics) {
		render_policy_chart(data.policy_statistics, chart_height);
	}
}


function render_compliance_trend_chart(data, height, type) {
	new frappe.Chart('#compliance-trend-chart', {
		data: {
			labels: data.labels,
			datasets: data.datasets
		},
		type: type || 'line',
		height: height,
		colors: ['#4CAF50'],
		lineOptions: {
			regionFill: 1,
			hideDots: 0
		},
		axisOptions: {
			xIsSeries: true
		},
		tooltipOptions: {
			formatTooltipY: d => d.toFixed(2) + '%'
		}
	});
}


function render_violations_chart(data, height, type) {
	new frappe.Chart('#violations-chart', {
		data: {
			labels: data.by_type.labels,
			datasets: [{
				name: 'Violations',
				values: data.by_type.values
			}]
		},
		type: type || 'bar',
		height: height,
		colors: ['#F44336', '#FF9800', '#FFC107', '#2196F3', '#9C27B0']
	});
}


function render_risk_chart(data, height) {
	const risk_colors = {
		'Critical': '#D32F2F',
		'High': '#F57C00',
		'Medium': '#FBC02D',
		'Low': '#388E3C',
		'Minimal': '#1976D2'
	};
	
	const colors = data.labels.map(label => risk_colors[label] || '#757575');
	
	new frappe.Chart('#risk-distribution-chart', {
		data: {
			labels: data.labels,
			datasets: [{
				values: data.values
			}]
		},
		type: 'pie',
		height: height,
		colors: colors
	});
}


function render_policy_chart(data, height) {
	new frappe.Chart('#policy-status-chart', {
		data: {
			labels: data.by_status.labels,
			datasets: [{
				name: 'Policies',
				values: data.by_status.values
			}]
		},
		type: 'bar',
		height: height,
		colors: ['#2196F3']
	});
}


// ═══════════════════════════════════════════════════════════════
// LIVE FEED RENDERING
// ═══════════════════════════════════════════════════════════════

function render_live_feed(data) {
	// Render alerts
	if (data.live_alerts && data.live_alerts.length > 0) {
		let alerts_html = '';
		data.live_alerts.forEach(alert => {
			const severity_class = get_severity_class(alert.severity || alert.priority);
			const icon = alert.alert_type === 'violation' ? '⚠️' : '📋';
			const time = moment(alert.detected_at || alert.event_date).fromNow();
			
			alerts_html += `
				<div class="feed-item ${severity_class}">
					<div class="feed-icon">${icon}</div>
					<div class="feed-content">
						<div class="feed-title">
							${alert.violation_type || alert.title || alert.event_type}
						</div>
						<div class="feed-meta">${time}</div>
					</div>
				</div>
			`;
		});
		
		$('#live-alerts-feed').html(alerts_html);
		$('#alert-count').text(data.live_alerts.length);
	}
	
	// Render recent events
	if (data.recent_events && data.recent_events.length > 0) {
		let events_html = '';
		data.recent_events.forEach(event => {
			const status_class = get_status_class(event.status);
			const time = moment(event.event_date).fromNow();
			
			events_html += `
				<div class="feed-item">
					<div class="feed-icon">📋</div>
					<div class="feed-content">
						<div class="feed-title">${event.title}</div>
						<div class="feed-meta">
							<span class="badge ${status_class}">${event.status}</span>
							<span>${time}</span>
						</div>
					</div>
				</div>
			`;
		});
		
		$('#recent-events-feed').html(events_html);
		$('#event-count').text(data.recent_events.length);
	}
}


// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

function attach_event_listeners(frm) {
	// Refresh button
	$('#dashboard-refresh').on('click', function() {
		load_dashboard_data(frm);
	});
	
	// Export button
	$('#dashboard-export').on('click', function() {
		show_export_dialog(frm);
	});
	
	// Filters
	$('#dashboard-tenant-filter, #dashboard-period-filter').on('change', function() {
		load_dashboard_data(frm);
	});
	
	// Load tenant options
	load_tenant_options();
}


function load_tenant_options() {
	frappe.call({
		method: 'frappe.client.get_list',
		args: {
			doctype: 'Tenant',
			fields: ['name', 'tenant_name'],
			limit_page_length: 100
		},
		callback: function(r) {
			if (r.message) {
				const select = $('#dashboard-tenant-filter');
				r.message.forEach(tenant => {
					select.append(`<option value="${tenant.name}">${tenant.tenant_name}</option>`);
				});
			}
		}
	});
}


function add_custom_buttons(frm) {
	// Clear Cache button
	frm.add_custom_button(__('Clear Cache'), function() {
		frappe.call({
			method: 'cap.doctype.compliance_dashboard.compliance_dashboard.clear_dashboard_cache',
			callback: function() {
				frappe.show_alert({
					message: __('Cache cleared successfully'),
					indicator: 'green'
				});
				load_dashboard_data(frm);
			}
		});
	}, __('Actions'));
	
	// Full Screen button
	frm.add_custom_button(__('Full Screen'), function() {
		toggle_fullscreen(frm);
	}, __('View'));
}


// ═══════════════════════════════════════════════════════════════
// AUTO-REFRESH
// ═══════════════════════════════════════════════════════════════

function setup_auto_refresh(frm) {
	clear_auto_refresh(frm);
	
	const interval = (frm.doc.refresh_interval || 30) * 1000;
	frm.refresh_timer = setInterval(function() {
		load_dashboard_data(frm);
	}, interval);
	
	frappe.show_alert({
		message: __('Auto-refresh enabled'),
		indicator: 'green'
	});
}


function clear_auto_refresh(frm) {
	if (frm.refresh_timer) {
		clearInterval(frm.refresh_timer);
		frm.refresh_timer = null;
	}
}


// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function get_severity_class(severity) {
	const classes = {
		'Critical': 'severity-critical',
		'High': 'severity-high',
		'Medium': 'severity-medium',
		'Low': 'severity-low'
	};
	return classes[severity] || 'severity-medium';
}


function get_status_class(status) {
	const classes = {
		'Completed': 'badge-success',
		'Closed': 'badge-success',
		'In Progress': 'badge-warning',
		'Under Review': 'badge-info',
		'Pending': 'badge-warning',
		'Cancelled': 'badge-danger'
	};
	return classes[status] || 'badge-secondary';
}


function show_export_dialog(frm) {
	const dialog = new frappe.ui.Dialog({
		title: __('Export Dashboard Report'),
		fields: [
			{
				fieldtype: 'Select',
				label: __('Format'),
				fieldname: 'format',
				options: ['PDF', 'Excel', 'JSON', 'CSV'],
				default: frm.doc.default_export_format || 'PDF'
			},
			{
				fieldtype: 'Check',
				label: __('Include Charts'),
				fieldname: 'include_charts',
				default: frm.doc.include_charts_in_export
			}
		],
		primary_action_label: __('Export'),
		primary_action: function(values) {
			const tenant = $('#dashboard-tenant-filter').val();
			const period = $('#dashboard-period-filter').val();
			
			frappe.call({
				method: 'cap.doctype.compliance_dashboard.compliance_dashboard.export_dashboard_report',
				args: {
					tenant: tenant,
					period: period,
					format: values.format
				},
				callback: function(r) {
					if (r.message) {
						frappe.show_alert({
							message: __('Export completed'),
							indicator: 'green'
						});
					}
				}
			});
			
			dialog.hide();
		}
	});
	
	dialog.show();
}


function toggle_fullscreen(frm) {
	const container = frm.dashboard_container;
	
	if (!document.fullscreenElement) {
		container[0].requestFullscreen().catch(err => {
			frappe.msgprint(`Error: ${err.message}`);
		});
	} else {
		document.exitFullscreen();
	}
}


// ═══════════════════════════════════════════════════════════════
// CUSTOM STYLES
// ═══════════════════════════════════════════════════════════════

function add_custom_styles() {
	if ($('#compliance-dashboard-styles').length) return;
	
	$('head').append(`
		<style id="compliance-dashboard-styles">
			.compliance-dashboard {
				padding: 20px;
				background: #f5f7fa;
			}
			
			.dashboard-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 30px;
				padding: 20px;
				background: white;
				border-radius: 8px;
				box-shadow: 0 2px 4px rgba(0,0,0,0.05);
			}
			
			.dashboard-header h2 {
				margin: 0;
				display: flex;
				align-items: center;
			}
			
			.dashboard-controls {
				display: flex;
				align-items: center;
			}
			
			.kpi-card {
				background: white;
				border-radius: 8px;
				padding: 20px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.08);
				display: flex;
				align-items: center;
				transition: transform 0.2s;
				height: 120px;
			}
			
			.kpi-card:hover {
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(0,0,0,0.12);
			}
			
			.kpi-icon {
				font-size: 48px;
				margin-right: 20px;
			}
			
			.kpi-content {
				flex: 1;
			}
			
			.kpi-label {
				font-size: 14px;
				color: #6c757d;
				margin-bottom: 8px;
			}
			
			.kpi-value {
				font-size: 32px;
				font-weight: bold;
				color: #2c3e50;
				margin-bottom: 4px;
			}
			
			.kpi-subtitle, .kpi-trend {
				font-size: 12px;
				color: #6c757d;
			}
			
			.kpi-primary { border-left: 4px solid #4CAF50; }
			.kpi-warning { border-left: 4px solid #FF9800; }
			.kpi-success { border-left: 4px solid #2196F3; }
			.kpi-info { border-left: 4px solid #00BCD4; }
			.kpi-danger { border-left: 4px solid #F44336; }
			.kpi-secondary { border-left: 4px solid #9E9E9E; }
			
			.chart-card, .feed-card {
				background: white;
				border-radius: 8px;
				padding: 20px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.08);
			}
			
			.chart-header, .feed-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 20px;
				padding-bottom: 15px;
				border-bottom: 2px solid #f0f0f0;
			}
			
			.chart-header h4, .feed-header h4 {
				margin: 0;
				font-size: 16px;
				font-weight: 600;
			}
			
			.feed-item {
				display: flex;
				align-items: center;
				padding: 12px;
				border-radius: 6px;
				margin-bottom: 10px;
				background: #f8f9fa;
				transition: background 0.2s;
			}
			
			.feed-item:hover {
				background: #e9ecef;
			}
			
			.feed-icon {
				font-size: 24px;
				margin-right: 15px;
			}
			
			.feed-content {
				flex: 1;
			}
			
			.feed-title {
				font-weight: 500;
				margin-bottom: 4px;
			}
			
			.feed-meta {
				font-size: 12px;
				color: #6c757d;
			}
			
			.severity-critical {
				border-left: 3px solid #D32F2F;
			}
			
			.severity-high {
				border-left: 3px solid #F57C00;
			}
			
			.severity-medium {
				border-left: 3px solid #FBC02D;
			}
			
			.severity-low {
				border-left: 3px solid #388E3C;
			}
		</style>
	`);
}
