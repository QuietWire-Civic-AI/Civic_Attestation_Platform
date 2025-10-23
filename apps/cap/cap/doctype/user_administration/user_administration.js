/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: user_administration.js
*/

frappe.ui.form.on('User Administration', {
	refresh: function(frm) {
		// Initialize the dashboard on refresh
		if (!frm.is_new()) {
			initializeUserAdminDashboard(frm);
		}
	},
	
	onload: function(frm) {
		// Setup on initial load
		if (!frm.is_new()) {
			setupDashboardContainer(frm);
		}
	}
});


function setupDashboardContainer(frm) {
	
	// Clear existing content
	frm.fields_dict.html && frm.fields_dict.html.$wrapper.empty();
	
	// Create main container
	const $container = $('<div class="user-admin-dashboard"></div>');
	
	// Add to form
	if (!frm.dashboard_container) {
		frm.page.main.prepend($container);
		frm.dashboard_container = $container;
	}
}


function initializeUserAdminDashboard(frm) {
	
	
	// Add custom CSS
	addDashboardStyles();
	
	// Build the UI
	buildDashboardHeader(frm);
	buildDashboardTabs(frm);
	
	// Load default tab (Overview)
	loadOverviewTab(frm);
	
	// Setup auto-refresh if enabled
	if (frm.doc.auto_refresh) {
		setupAutoRefresh(frm);
	}
}


function buildDashboardHeader(frm) {
	
	const $header = $(`
		<div class="dashboard-header" style="padding: 15px; background: #f8f9fa; border-bottom: 2px solid #e9ecef; margin-bottom: 20px;">
			<div class="row">
				<div class="col-md-6">
					<h3 style="margin: 0; color: #2c3e50;">
						<i class="fa fa-users" style="margin-right: 10px;"></i>
						User Administration Dashboard
					</h3>
					<p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 13px;">
						Manage users, roles, permissions, and monitor activity
					</p>
				</div>
				<div class="col-md-6 text-right">
					<div class="btn-group" role="group">
						<button class="btn btn-sm btn-default" id="filter-tenant-btn">
							<i class="fa fa-filter"></i> Filter by Tenant
						</button>
						<button class="btn btn-sm btn-default" id="refresh-dashboard-btn">
							<i class="fa fa-refresh"></i> Refresh
						</button>
						<button class="btn btn-sm btn-primary" id="export-data-btn">
							<i class="fa fa-download"></i> Export
						</button>
					</div>
				</div>
			</div>
		</div>
	`);
	
	frm.dashboard_container.append($header);
	
	// Bind header events
	$header.find('#refresh-dashboard-btn').on('click', () => refreshDashboard(frm));
	$header.find('#export-data-btn').on('click', () => exportUsersData(frm));
	$header.find('#filter-tenant-btn').on('click', () => showTenantFilter(frm));
}


function buildDashboardTabs(frm) {
	
	const $tabs = $(`
		<div class="dashboard-tabs" style="margin-bottom: 20px;">
			<ul class="nav nav-tabs" role="tablist">
				<li class="nav-item active">
					<a class="nav-link" data-tab="overview" href="#">
						<i class="fa fa-dashboard"></i> Overview
					</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" data-tab="users" href="#">
						<i class="fa fa-users"></i> Users
					</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" data-tab="roles" href="#">
						<i class="fa fa-shield"></i> Roles & Permissions
					</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" data-tab="activity" href="#">
						<i class="fa fa-history"></i> Activity Monitor
					</a>
				</li>
			</ul>
			<div class="tab-content" id="dashboard-tab-content" style="padding: 20px; background: white; border: 1px solid #ddd; border-top: none;">
				<!-- Tab content will be loaded here -->
			</div>
		</div>
	`);
	
	frm.dashboard_container.append($tabs);
	
	// Bind tab click events
	$tabs.find('.nav-link').on('click', function(e) {
		e.preventDefault();
		const tab = $(this).data('tab');
		
		// Update active state
		$tabs.find('.nav-item').removeClass('active');
		$(this).parent().addClass('active');
		
		// Load tab content
		loadTabContent(frm, tab);
	});
	
	frm.tabs_container = $tabs;
}


function loadTabContent(frm, tab) {
	
	const $content = frm.tabs_container.find('#dashboard-tab-content');
	$content.html('<div class="text-center"><i class="fa fa-spinner fa-spin fa-2x"></i><p>Loading...</p></div>');
	
	switch(tab) {
		case 'overview':
			loadOverviewTab(frm);
			break;
		case 'users':
			loadUsersTab(frm);
			break;
		case 'roles':
			loadRolesTab(frm);
			break;
		case 'activity':
			loadActivityTab(frm);
			break;
	}
}


// ============================================================================
// OVERVIEW TAB
// ============================================================================

function loadOverviewTab(frm) {
	
	const $content = frm.tabs_container.find('#dashboard-tab-content');
	
	// Get current filters
	const filters = frm.current_filters || {};
	
	// Call API
	frappe.call({
		method: 'cap.doctype.user_administration.user_administration.get_dashboard_overview',
		args: { filters: filters },
		callback: function(r) {
			if (r.message) {
				renderOverviewDashboard($content, r.message, frm);
			} else {
				$content.html('<div class="alert alert-danger">Failed to load dashboard data</div>');
			}
		}
	});
}


function renderOverviewDashboard($container, data, frm) {
	
	$container.empty();
	
	// KPI Cards Section
	const $kpiSection = $('<div class="kpi-section" style="margin-bottom: 30px;"></div>');
	$kpiSection.append('<h4 style="margin-bottom: 15px; color: #34495e;"><i class="fa fa-bar-chart"></i> Key Metrics</h4>');
	
	const $kpiGrid = $('<div class="row"></div>');
	
	// Render KPI cards
	const kpis = data.kpis || {};
	
	$kpiGrid.append(createKPICard('Total Users', kpis.total_users || 0, 'users', 'primary'));
	$kpiGrid.append(createKPICard('Active Today', kpis.active_today || 0, 'check-circle', 'success'));
	$kpiGrid.append(createKPICard('New This Month', kpis.new_this_month || 0, 'user-plus', 'info'));
	$kpiGrid.append(createKPICard('Suspended', kpis.suspended || 0, 'ban', 'danger'));
	$kpiGrid.append(createKPICard('Unique Tenants', kpis.users_by_tenant || 0, 'building', 'purple'));
	$kpiGrid.append(createKPICard('Total Roles', kpis.total_roles || 0, 'shield', 'orange'));
	$kpiGrid.append(createKPICard('Avg Session (hrs)', (kpis.avg_session_time || 0).toFixed(2), 'clock-o', 'teal'));
	$kpiGrid.append(createKPICard('Failed Logins (24h)', kpis.failed_logins_24h || 0, 'exclamation-triangle', 'red'));
	
	$kpiSection.append($kpiGrid);
	$container.append($kpiSection);
	
	// Charts Section
	const $chartsSection = $('<div class="charts-section"></div>');
	$chartsSection.append('<h4 style="margin: 30px 0 15px 0; color: #34495e;"><i class="fa fa-line-chart"></i> Analytics</h4>');
	
	const $chartsGrid = $('<div class="row"></div>');
	
	// User Growth Trend Chart
	const $growthChart = $('<div class="col-md-6"><div id="user-growth-chart"></div></div>');
	$chartsGrid.append($growthChart);
	
	// Users by Role Chart
	const $roleChart = $('<div class="col-md-6"><div id="users-by-role-chart"></div></div>');
	$chartsGrid.append($roleChart);
	
	$chartsSection.append($chartsGrid);
	$container.append($chartsSection);
	
	// Render charts after DOM is ready
	setTimeout(() => {
		renderUserGrowthChart(data.user_growth_trend, frm);
		renderUsersByRoleChart(data.users_by_role, frm);
	}, 100);
}


function createKPICard(label, value, icon, color) {
	
	const colorMap = {
		'primary': '#3498db',
		'success': '#2ecc71',
		'info': '#1abc9c',
		'danger': '#e74c3c',
		'warning': '#f39c12',
		'purple': '#9b59b6',
		'orange': '#e67e22',
		'teal': '#16a085',
		'red': '#c0392b'
	};
	
	const bgColor = colorMap[color] || '#95a5a6';
	
	return $(`
		<div class="col-md-3" style="margin-bottom: 15px;">
			<div class="kpi-card" style="
				background: linear-gradient(135deg, ${bgColor} 0%, ${bgColor}dd 100%);
				color: white;
				padding: 20px;
				border-radius: 8px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.1);
				transition: transform 0.2s;
				cursor: pointer;
			">
				<div class="row">
					<div class="col-xs-8">
						<div style="font-size: 13px; opacity: 0.9; margin-bottom: 5px;">${label}</div>
						<div style="font-size: 28px; font-weight: bold;">${value}</div>
					</div>
					<div class="col-xs-4 text-right">
						<i class="fa fa-${icon}" style="font-size: 40px; opacity: 0.3;"></i>
					</div>
				</div>
			</div>
		</div>
	`);
}


function renderUserGrowthChart(data, frm) {
	
	if (!data || !data.labels || data.labels.length === 0) {
		$('#user-growth-chart').html('<p class="text-muted">No data available</p>');
		return;
	}
	
	const chartType = frm.doc.growth_chart_type || 'line';
	const height = frm.doc.chart_height || 300;
	
	new frappe.Chart('#user-growth-chart', {
		title: 'User Growth Trend',
		data: data,
		type: chartType,
		height: height,
		colors: ['#3498db'],
		axisOptions: {
			xAxisMode: 'tick',
			yAxisMode: 'tick'
		}
	});
}


function renderUsersByRoleChart(data, frm) {
	
	if (!data || !data.labels || data.labels.length === 0) {
		$('#users-by-role-chart').html('<p class="text-muted">No data available</p>');
		return;
	}
	
	const chartType = frm.doc.role_chart_type || 'pie';
	const height = frm.doc.chart_height || 300;
	
	new frappe.Chart('#users-by-role-chart', {
		title: 'Users by Role',
		data: data,
		type: chartType,
		height: height,
		colors: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e', '#e67e22']
	});
}


// ============================================================================
// USERS TAB
// ============================================================================

function loadUsersTab(frm) {
	
	const $content = frm.tabs_container.find('#dashboard-tab-content');
	$content.empty();
	
	// Build search and filter bar
	const $toolbar = $(`
		<div class="users-toolbar" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
			<div class="row">
				<div class="col-md-4">
					<input type="text" class="form-control" id="user-search" placeholder="Search by name or email...">
				</div>
				<div class="col-md-2">
					<select class="form-control" id="filter-status">
						<option value="">All Status</option>
						<option value="Active">Active</option>
						<option value="Suspended">Suspended</option>
					</select>
				</div>
				<div class="col-md-2">
					<select class="form-control" id="filter-role">
						<option value="">All Roles</option>
					</select>
				</div>
				<div class="col-md-4 text-right">
					<div class="btn-group">
						<button class="btn btn-sm btn-default" id="bulk-activate">
							<i class="fa fa-check"></i> Activate
						</button>
						<button class="btn btn-sm btn-default" id="bulk-suspend">
							<i class="fa fa-ban"></i> Suspend
						</button>
						<button class="btn btn-sm btn-danger" id="bulk-delete">
							<i class="fa fa-trash"></i> Delete
						</button>
					</div>
				</div>
			</div>
		</div>
	`);
	
	$content.append($toolbar);
	
	// Users table container
	const $tableContainer = $('<div id="users-table-container"></div>');
	$content.append($tableContainer);
	
	// Load available roles for filter
	loadAvailableRoles($toolbar.find('#filter-role'));
	
	// Load users
	loadUsersList(frm, 1);
	
	// Bind events
	let searchTimeout;
	$toolbar.find('#user-search').on('input', function() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			loadUsersList(frm, 1);
		}, 500);
	});
	
	$toolbar.find('#filter-status, #filter-role').on('change', () => loadUsersList(frm, 1));
	
	$toolbar.find('#bulk-activate').on('click', () => performBulkAction(frm, 'activate'));
	$toolbar.find('#bulk-suspend').on('click', () => performBulkAction(frm, 'suspend'));
	$toolbar.find('#bulk-delete').on('click', () => performBulkAction(frm, 'delete'));
}


function loadUsersList(frm, page) {
	
	const $container = $('#users-table-container');
	$container.html('<div class="text-center"><i class="fa fa-spinner fa-spin"></i> Loading...</div>');
	
	// Get filters
	const filters = {};
	const status = $('#filter-status').val();
	const role = $('#filter-role').val();
	const search = $('#user-search').val();
	
	if (status) filters.status = status;
	if (role) filters.role = role;
	if (frm.current_filters && frm.current_filters.tenant) {
		filters.tenant = frm.current_filters.tenant;
	}
	
	frappe.call({
		method: 'cap.doctype.user_administration.user_administration.get_all_users',
		args: {
			filters: filters,
			page: page,
			page_length: frm.doc.items_per_page || 20,
			search_query: search
		},
		callback: function(r) {
			if (r.message) {
				renderUsersTable($container, r.message, frm);
			}
		}
	});
}


function renderUsersTable($container, data, frm) {
	
	$container.empty();
	
	const users = data.users || [];
	
	if (users.length === 0) {
		$container.html('<div class="alert alert-info">No users found</div>');
		return;
	}
	
	// Build table
	const $table = $(`
		<table class="table table-bordered table-hover">
			<thead style="background: #f8f9fa;">
				<tr>
					<th width="40"><input type="checkbox" id="select-all-users"></th>
					<th>User</th>
					<th>Email</th>
					<th>Tenant</th>
					<th>Roles</th>
					<th>Status</th>
					<th>Last Login</th>
					<th width="100">Actions</th>
				</tr>
			</thead>
			<tbody>
			</tbody>
		</table>
	`);
	
	const $tbody = $table.find('tbody');
	
	users.forEach(user => {
		const statusBadge = user.enabled ? 
			'<span class="label label-success">Active</span>' : 
			'<span class="label label-danger">Suspended</span>';
		
		const lastLogin = user.last_login ? 
			frappe.datetime.str_to_user(user.last_login) : 
			'<span class="text-muted">Never</span>';
		
		const $row = $(`
			<tr data-user="${user.email}">
				<td><input type="checkbox" class="user-checkbox" value="${user.email}"></td>
				<td>
					<strong>${user.full_name || user.email}</strong>
					${user.job_title ? '<br><small class="text-muted">' + user.job_title + '</small>' : ''}
				</td>
				<td>${user.email}</td>
				<td>${user.tenant || '<span class="text-muted">-</span>'}</td>
				<td><small>${user.roles || '<span class="text-muted">No roles</span>'}</small></td>
				<td>${statusBadge}</td>
				<td>${lastLogin}</td>
				<td>
					<button class="btn btn-xs btn-default view-profile" data-user="${user.email}">
						<i class="fa fa-eye"></i>
					</button>
				</td>
			</tr>
		`);
		
		$tbody.append($row);
	});
	
	$container.append($table);
	
	// Add pagination
	if (data.total_pages > 1) {
		const $pagination = buildPagination(data, frm);
		$container.append($pagination);
	}
	
	// Bind events
	$table.find('#select-all-users').on('change', function() {
		$table.find('.user-checkbox').prop('checked', $(this).is(':checked'));
	});
	
	$table.find('.view-profile').on('click', function() {
		const user = $(this).data('user');
		showUserProfileDialog(user, frm);
	});
}


function buildPagination(data, frm) {
	
	const $pagination = $('<div class="text-center" style="margin-top: 20px;"></div>');
	
	const $nav = $('<nav><ul class="pagination"></ul></nav>');
	const $ul = $nav.find('ul');
	
	// Previous button
	if (data.has_prev) {
		$ul.append(`<li><a href="#" data-page="${data.page - 1}">&laquo; Previous</a></li>`);
	}
	
	// Page numbers
	for (let i = 1; i <= data.total_pages; i++) {
		if (i === data.page) {
			$ul.append(`<li class="active"><a href="#">${i}</a></li>`);
		} else if (i === 1 || i === data.total_pages || Math.abs(i - data.page) <= 2) {
			$ul.append(`<li><a href="#" data-page="${i}">${i}</a></li>`);
		} else if (Math.abs(i - data.page) === 3) {
			$ul.append('<li class="disabled"><a href="#">...</a></li>');
		}
	}
	
	// Next button
	if (data.has_next) {
		$ul.append(`<li><a href="#" data-page="${data.page + 1}">Next &raquo;</a></li>`);
	}
	
	$pagination.append($nav);
	
	// Bind pagination clicks
	$ul.find('a[data-page]').on('click', function(e) {
		e.preventDefault();
		const page = $(this).data('page');
		loadUsersList(frm, page);
	});
	
	return $pagination;
}


function performBulkAction(frm, action) {
	
	const selectedUsers = [];
	$('.user-checkbox:checked').each(function() {
		selectedUsers.push($(this).val());
	});
	
	if (selectedUsers.length === 0) {
		frappe.msgprint('Please select at least one user');
		return;
	}
	
	const actionLabels = {
		'activate': 'activate',
		'suspend': 'suspend',
		'delete': 'delete'
	};
	
	frappe.confirm(
		`Are you sure you want to ${actionLabels[action]} ${selectedUsers.length} user(s)?`,
		() => {
			frappe.call({
				method: 'cap.doctype.user_administration.user_administration.bulk_action_users',
				args: {
					action: action,
					users: selectedUsers
				},
				callback: function(r) {
					if (r.message && r.message.success) {
						frappe.show_alert({
							message: r.message.message,
							indicator: 'green'
						});
						loadUsersList(frm, 1);
					} else {
						frappe.msgprint(r.message.message || 'Operation failed');
					}
				}
			});
		}
	);
}


function showUserProfileDialog(user_email, frm) {
	
	frappe.call({
		method: 'cap.doctype.user_administration.user_administration.get_user_profile',
		args: { user_email: user_email },
		callback: function(r) {
			if (r.message && !r.message.error) {
				const profile = r.message;
				
				const d = new frappe.ui.Dialog({
					title: `User Profile: ${profile.user.full_name}`,
					fields: [
						{
							fieldtype: 'HTML',
							fieldname: 'profile_html'
						}
					],
					primary_action_label: 'Edit Profile',
					primary_action: () => {
						frappe.set_route('Form', 'User', user_email);
						d.hide();
					}
				});
				
				// Build profile HTML
				const html = buildUserProfileHTML(profile);
				d.fields_dict.profile_html.$wrapper.html(html);
				
				d.show();
				d.$wrapper.find('.modal-dialog').css('width', '900px');
			}
		}
	});
}


function buildUserProfileHTML(profile) {
	
	const user = profile.user;
	const stats = profile.statistics;
	
	return `
		<div class="user-profile-view">
			<div class="row">
				<div class="col-md-4">
					<h5>Basic Information</h5>
					<table class="table table-bordered table-sm">
						<tr><td><strong>Email:</strong></td><td>${user.email}</td></tr>
						<tr><td><strong>Full Name:</strong></td><td>${user.full_name}</td></tr>
						<tr><td><strong>Username:</strong></td><td>${user.username || '-'}</td></tr>
						<tr><td><strong>Phone:</strong></td><td>${user.phone || '-'}</td></tr>
						<tr><td><strong>Status:</strong></td><td>
							${user.enabled ? '<span class="label label-success">Active</span>' : '<span class="label label-danger">Suspended</span>'}
						</td></tr>
						<tr><td><strong>Created:</strong></td><td>${frappe.datetime.str_to_user(user.creation)}</td></tr>
						<tr><td><strong>Last Login:</strong></td><td>${user.last_login ? frappe.datetime.str_to_user(user.last_login) : 'Never'}</td></tr>
					</table>
				</div>
				<div class="col-md-4">
					<h5>Roles (${profile.roles.length})</h5>
					<div style="max-height: 300px; overflow-y: auto;">
						${profile.roles.map(role => `<span class="label label-primary" style="margin: 2px; display: inline-block;">${role}</span>`).join('')}
						${profile.roles.length === 0 ? '<p class="text-muted">No roles assigned</p>' : ''}
					</div>
					
					<h5 style="margin-top: 20px;">Permissions (${profile.permissions.length})</h5>
					<div style="max-height: 150px; overflow-y: auto;">
						${profile.permissions.length > 0 ? 
							'<table class="table table-sm table-bordered">' +
							profile.permissions.map(p => `<tr><td>${p.allow}</td><td>${p.for_value}</td></tr>`).join('') +
							'</table>' :
							'<p class="text-muted">No specific permissions</p>'
						}
					</div>
				</div>
				<div class="col-md-4">
					<h5>Statistics</h5>
					<table class="table table-bordered table-sm">
						<tr><td><strong>Total Logins:</strong></td><td>${stats.total_login_count || 0}</td></tr>
						<tr><td><strong>Chat Sessions:</strong></td><td>${stats.total_chat_sessions || 0}</td></tr>
						<tr><td><strong>Messages:</strong></td><td>${stats.total_messages_sent || 0}</td></tr>
						<tr><td><strong>Evidence:</strong></td><td>${stats.total_evidence_uploaded || 0}</td></tr>
						<tr><td><strong>Violations:</strong></td><td>${stats.total_violations_reported || 0}</td></tr>
						<tr><td><strong>Hours Active:</strong></td><td>${(stats.total_hours_active || 0).toFixed(2)}h</td></tr>
					</table>
				</div>
			</div>
			
			<div class="row" style="margin-top: 20px;">
				<div class="col-md-12">
					<h5>Recent Activity (Last 20)</h5>
					<div style="max-height: 200px; overflow-y: auto;">
						${profile.recent_activity.length > 0 ? 
							'<table class="table table-sm table-striped">' +
							'<thead><tr><th>Action</th><th>Description</th><th>Result</th><th>Time</th></tr></thead>' +
							'<tbody>' +
							profile.recent_activity.map(a => 
								`<tr>
									<td><code>${a.event_action}</code></td>
									<td>${a.event_description || '-'}</td>
									<td>${a.event_result}</td>
									<td><small>${frappe.datetime.str_to_user(a.timestamp)}</small></td>
								</tr>`
							).join('') +
							'</tbody></table>' :
							'<p class="text-muted">No recent activity</p>'
						}
					</div>
				</div>
			</div>
		</div>
	`;
}


// ============================================================================
// ROLES TAB
// ============================================================================

function loadRolesTab(frm) {
	
	const $content = frm.tabs_container.find('#dashboard-tab-content');
	$content.html(`
		<div class="alert alert-info">
			<i class="fa fa-info-circle"></i>
			Select a user from the Users tab to manage their roles and permissions.
		</div>
		<p class="text-muted text-center">
			Role management is available in the user profile view.
		</p>
	`);
}


// ============================================================================
// ACTIVITY TAB
// ============================================================================

function loadActivityTab(frm) {
	
	const $content = frm.tabs_container.find('#dashboard-tab-content');
	$content.empty();
	
	// Period selector
	const $toolbar = $(`
		<div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
			<div class="row">
				<div class="col-md-3">
					<label>Period:</label>
					<select class="form-control" id="activity-period">
						<option value="1">Last 24 Hours</option>
						<option value="7" selected>Last 7 Days</option>
						<option value="30">Last 30 Days</option>
						<option value="90">Last 90 Days</option>
					</select>
				</div>
				<div class="col-md-9 text-right">
					<button class="btn btn-sm btn-primary" id="refresh-activity">
						<i class="fa fa-refresh"></i> Refresh
					</button>
				</div>
			</div>
		</div>
	`);
	
	$content.append($toolbar);
	
	// Activity feed container
	const $activityContainer = $('<div id="activity-feed-container"></div>');
	$content.append($activityContainer);
	
	// Load activity
	loadActivityFeed(frm);
	
	// Bind events
	$toolbar.find('#activity-period').on('change', () => loadActivityFeed(frm));
	$toolbar.find('#refresh-activity').on('click', () => loadActivityFeed(frm));
}


function loadActivityFeed(frm) {
	
	const $container = $('#activity-feed-container');
	$container.html('<div class="text-center"><i class="fa fa-spinner fa-spin"></i> Loading activity...</div>');
	
	const period = $('#activity-period').val() || 7;
	
	frappe.call({
		method: 'cap.doctype.user_administration.user_administration.get_user_activity',
		args: {
			period: period,
			limit: 100
		},
		callback: function(r) {
			if (r.message) {
				renderActivityFeed($container, r.message);
			}
		}
	});
	
	// Also load failed logins
	loadFailedLogins(frm);
}


function renderActivityFeed($container, activities) {
	
	$container.empty();
	
	if (!activities || activities.length === 0) {
		$container.html('<div class="alert alert-info">No activity found for this period</div>');
		return;
	}
	
	const $timeline = $('<div class="activity-timeline"></div>');
	
	activities.forEach(activity => {
		const icon = getActivityIcon(activity.event_action);
		const color = getActivityColor(activity.event_result);
		
		const $item = $(`
			<div class="activity-item" style="padding: 10px; border-left: 3px solid ${color}; margin-bottom: 10px; background: #f8f9fa;">
				<div class="row">
					<div class="col-md-1 text-center">
						<i class="fa fa-${icon}" style="font-size: 20px; color: ${color};"></i>
					</div>
					<div class="col-md-11">
						<strong>${activity.user || 'System'}</strong> - 
						<code>${activity.event_action}</code>
						${activity.event_description ? '<br><small>' + activity.event_description + '</small>' : ''}
						<div class="pull-right">
							<small class="text-muted">${frappe.datetime.comment_when(activity.timestamp)}</small>
						</div>
					</div>
				</div>
			</div>
		`);
		
		$timeline.append($item);
	});
	
	$container.append($timeline);
}


function loadFailedLogins(frm) {
	
	frappe.call({
		method: 'cap.doctype.user_administration.user_administration.get_failed_login_attempts',
		args: { hours: 24 },
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				showFailedLoginsAlert(r.message);
			}
		}
	});
}


function showFailedLoginsAlert(failed_logins) {
	
	const $alert = $(`
		<div class="alert alert-warning" style="margin-top: 20px;">
			<h5><i class="fa fa-exclamation-triangle"></i> Failed Login Attempts (Last 24h): ${failed_logins.length}</h5>
			<div style="max-height: 150px; overflow-y: auto;">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>User</th>
							<th>IP Address</th>
							<th>Time</th>
							<th>Error</th>
						</tr>
					</thead>
					<tbody>
						${failed_logins.map(fl => `
							<tr>
								<td>${fl.user || 'Unknown'}</td>
								<td>${fl.ip_address || '-'}</td>
								<td><small>${frappe.datetime.str_to_user(fl.timestamp)}</small></td>
								<td><small>${fl.error_message || fl.event_result}</small></td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			</div>
		</div>
	`);
	
	$('#activity-feed-container').prepend($alert);
}


function getActivityIcon(action) {
	
	const iconMap = {
		'login': 'sign-in',
		'logout': 'sign-out',
		'create': 'plus',
		'update': 'edit',
		'delete': 'trash',
		'approve': 'check',
		'reject': 'times'
	};
	
	return iconMap[action] || 'circle';
}


function getActivityColor(result) {
	
	const colorMap = {
		'Success': '#2ecc71',
		'Failed': '#e74c3c',
		'Error': '#e74c3c',
		'Unauthorized': '#f39c12',
		'Forbidden': '#e67e22'
	};
	
	return colorMap[result] || '#95a5a6';
}


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function refreshDashboard(frm) {
	
	const activeTab = frm.tabs_container.find('.nav-item.active a').data('tab');
	loadTabContent(frm, activeTab);
	frappe.show_alert({ message: 'Dashboard refreshed', indicator: 'green' });
}


function exportUsersData(frm) {
	
	const filters = frm.current_filters || {};
	
	frappe.prompt([
		{
			label: 'Export Format',
			fieldname: 'format',
			fieldtype: 'Select',
			options: 'JSON\nCSV',
			default: 'JSON'
		}
	], (values) => {
		frappe.call({
			method: 'cap.doctype.user_administration.user_administration.export_users_data',
			args: {
				format: values.format.toLowerCase(),
				filters: filters
			},
			callback: function(r) {
				if (r.message && r.message.success) {
					if (r.message.format === 'json') {
						// Download JSON
						const dataStr = JSON.stringify(r.message.data, null, 2);
						const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
						const exportFileDefaultName = 'users_export.json';
						
						const linkElement = document.createElement('a');
						linkElement.setAttribute('href', dataUri);
						linkElement.setAttribute('download', exportFileDefaultName);
						linkElement.click();
					} else if (r.message.format === 'csv') {
						// Download CSV
						const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(r.message.data);
						const exportFileDefaultName = 'users_export.csv';
						
						const linkElement = document.createElement('a');
						linkElement.setAttribute('href', dataUri);
						linkElement.setAttribute('download', exportFileDefaultName);
						linkElement.click();
					}
					
					frappe.show_alert({
						message: `Exported ${r.message.count} users`,
						indicator: 'green'
					});
				}
			}
		});
	}, 'Export Users', 'Export');
}


function showTenantFilter(frm) {
	
	frappe.prompt([
		{
			label: 'Tenant',
			fieldname: 'tenant',
			fieldtype: 'Link',
			options: 'Tenant'
		}
	], (values) => {
		frm.current_filters = frm.current_filters || {};
		if (values.tenant) {
			frm.current_filters.tenant = values.tenant;
		} else {
			delete frm.current_filters.tenant;
		}
		refreshDashboard(frm);
	}, 'Filter by Tenant', 'Apply Filter');
}


function loadAvailableRoles($select) {
	
	frappe.call({
		method: 'cap.doctype.user_administration.user_administration.get_available_roles',
		callback: function(r) {
			if (r.message) {
				r.message.forEach(role => {
					$select.append(`<option value="${role.name}">${role.name}</option>`);
				});
			}
		}
	});
}


function setupAutoRefresh(frm) {
	
	if (frm.auto_refresh_interval) {
		clearInterval(frm.auto_refresh_interval);
	}
	
	if (frm.doc.auto_refresh && frm.doc.refresh_interval) {
		frm.auto_refresh_interval = setInterval(() => {
			refreshDashboard(frm);
		}, frm.doc.refresh_interval * 1000);
	}
}


function addDashboardStyles() {
	
	if ($('#user-admin-dashboard-styles').length > 0) return;
	
	const styles = `
		<style id="user-admin-dashboard-styles">
			.user-admin-dashboard {
				padding: 20px;
			}
			
			.kpi-card:hover {
				transform: translateY(-2px);
				box-shadow: 0 4px 12px rgba(0,0,0,0.15);
			}
			
			.dashboard-tabs .nav-tabs {
				border-bottom: 2px solid #3498db;
			}
			
			.dashboard-tabs .nav-tabs > li.active > a {
				color: #3498db;
				border-bottom: 3px solid #3498db;
				font-weight: bold;
			}
			
			.dashboard-tabs .nav-tabs > li > a:hover {
				color: #2980b9;
				background: #f8f9fa;
			}
			
			.activity-item {
				transition: all 0.2s;
			}
			
			.activity-item:hover {
				background: #e9ecef !important;
				transform: translateX(5px);
			}
			
			.user-checkbox:hover {
				cursor: pointer;
			}
			
			table.table tbody tr:hover {
				background-color: #f8f9fa;
			}
		</style>
	`;
	
	$('head').append(styles);
}
