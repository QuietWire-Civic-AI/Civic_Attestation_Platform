/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: tenant_administration.js
*/

frappe.ui.form.on('Tenant Administration', {
    refresh: function(frm) {
        // Initialize dashboard
        initialize_tenant_admin_dashboard(frm);
        
        // Add custom buttons
        add_action_buttons(frm);
        
        // Setup auto-refresh
        if (frm.doc.auto_refresh_enabled) {
            setup_auto_refresh(frm);
        }
    },
    
    auto_refresh_enabled: function(frm) {
        if (frm.doc.auto_refresh_enabled) {
            setup_auto_refresh(frm);
        } else {
            clear_auto_refresh(frm);
        }
    },
    
    status_filter: function(frm) {
        refresh_tenant_list(frm);
    },
    
    plan_filter: function(frm) {
        refresh_tenant_list(frm);
    }
});

// Global variables
let current_view = 'overview';
let auto_refresh_interval = null;
let current_page = 1;
let items_per_page = 20;
let search_timeout = null;

// Initialize dashboard
function initialize_tenant_admin_dashboard(frm) {
    // Clear existing content
    frm.fields_dict.$wrapper.find('.frappe-control').hide();
    
    // Create main dashboard container
    if (!frm.$dashboard_container) {
        frm.$dashboard_container = $('<div class="tenant-admin-dashboard"></div>');
        frm.fields_dict.$wrapper.append(frm.$dashboard_container);
    }
    
    // Render dashboard layout
    render_dashboard_layout(frm);
    
    // Load initial data
    load_overview_data(frm);
}

// Render dashboard layout
function render_dashboard_layout(frm) {
    const html = `
        <style>
            .tenant-admin-dashboard {
                padding: 20px;
                background: #f8f9fa;
            }
            
            .dashboard-header {
                margin-bottom: 25px;
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .dashboard-title {
                font-size: 24px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 10px;
            }
            
            .dashboard-tabs {
                display: flex;
                gap: 10px;
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 10px;
            }
            
            .dashboard-tab {
                padding: 10px 20px;
                cursor: pointer;
                border-radius: 6px 6px 0 0;
                font-weight: 500;
                transition: all 0.3s;
                background: transparent;
                color: #6c757d;
            }
            
            .dashboard-tab:hover {
                background: #e9ecef;
                color: #495057;
            }
            
            .dashboard-tab.active {
                background: #4CAF50;
                color: white;
            }
            
            .dashboard-content {
                margin-top: 20px;
            }
            
            .kpi-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .kpi-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.3s;
            }
            
            .kpi-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            
            .kpi-label {
                font-size: 13px;
                color: #6c757d;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .kpi-value {
                font-size: 32px;
                font-weight: 700;
                color: #2c3e50;
                margin-bottom: 5px;
            }
            
            .kpi-trend {
                font-size: 12px;
                color: #28a745;
            }
            
            .kpi-trend.down {
                color: #dc3545;
            }
            
            .chart-container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
            
            .chart-title {
                font-size: 16px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 15px;
            }
            
            .tenant-table {
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .table-header {
                padding: 15px 20px;
                background: #f8f9fa;
                border-bottom: 2px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .search-box {
                padding: 8px 15px;
                border: 1px solid #ced4da;
                border-radius: 6px;
                width: 300px;
                font-size: 14px;
            }
            
            .search-box:focus {
                outline: none;
                border-color: #4CAF50;
                box-shadow: 0 0 0 3px rgba(76,175,80,0.1);
            }
            
            .action-buttons {
                display: flex;
                gap: 10px;
            }
            
            .btn-custom {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s;
            }
            
            .btn-primary {
                background: #4CAF50;
                color: white;
            }
            
            .btn-primary:hover {
                background: #45a049;
            }
            
            .btn-secondary {
                background: #6c757d;
                color: white;
            }
            
            .btn-secondary:hover {
                background: #5a6268;
            }
            
            .btn-danger {
                background: #dc3545;
                color: white;
            }
            
            .btn-danger:hover {
                background: #c82333;
            }
            
            .tenant-table table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .tenant-table th,
            .tenant-table td {
                padding: 12px 15px;
                text-align: left;
                border-bottom: 1px solid #e9ecef;
            }
            
            .tenant-table th {
                background: #f8f9fa;
                font-weight: 600;
                color: #495057;
                font-size: 13px;
                text-transform: uppercase;
            }
            
            .tenant-table tbody tr:hover {
                background: #f8f9fa;
            }
            
            .status-badge {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status-active {
                background: #d4edda;
                color: #155724;
            }
            
            .status-trial {
                background: #cce5ff;
                color: #004085;
            }
            
            .status-suspended {
                background: #f8d7da;
                color: #721c24;
            }
            
            .status-inactive {
                background: #e2e3e5;
                color: #383d41;
            }
            
            .pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
                padding: 20px;
                background: white;
                border-radius: 0 0 8px 8px;
            }
            
            .page-btn {
                padding: 6px 12px;
                border: 1px solid #dee2e6;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .page-btn:hover {
                background: #e9ecef;
            }
            
            .page-btn.active {
                background: #4CAF50;
                color: white;
                border-color: #4CAF50;
            }
            
            .charts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .loading-spinner {
                text-align: center;
                padding: 40px;
                font-size: 18px;
                color: #6c757d;
            }
            
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: #6c757d;
            }
            
            .empty-state-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
        </style>
        
        <div class="dashboard-header">
            <div class="dashboard-title">
                🏢 Tenant Administration Dashboard
            </div>
            <div class="dashboard-tabs">
                <div class="dashboard-tab active" data-tab="overview">
                    📊 Overview
                </div>
                <div class="dashboard-tab" data-tab="tenants">
                    🏢 Tenant Management
                </div>
                <div class="dashboard-tab" data-tab="usage">
                    📈 Usage Monitoring
                </div>
                <div class="dashboard-tab" data-tab="plans">
                    💎 Resource Allocation
                </div>
            </div>
        </div>
        
        <div class="dashboard-content">
            <div id="overview-view" class="view-container"></div>
            <div id="tenants-view" class="view-container" style="display:none;"></div>
            <div id="usage-view" class="view-container" style="display:none;"></div>
            <div id="plans-view" class="view-container" style="display:none;"></div>
        </div>
    `;
    
    frm.$dashboard_container.html(html);
    
    // Setup tab switching
    setup_tab_switching(frm);
}

// Setup tab switching
function setup_tab_switching(frm) {
    frm.$dashboard_container.find('.dashboard-tab').on('click', function() {
        const tab = $(this).data('tab');
        
        // Update active tab
        frm.$dashboard_container.find('.dashboard-tab').removeClass('active');
        $(this).addClass('active');
        
        // Hide all views
        frm.$dashboard_container.find('.view-container').hide();
        
        // Show selected view
        frm.$dashboard_container.find(`#${tab}-view`).show();
        
        // Load view data
        current_view = tab;
        load_view_data(frm, tab);
    });
}

// Load view data
function load_view_data(frm, view) {
    switch(view) {
        case 'overview':
            load_overview_data(frm);
            break;
        case 'tenants':
            load_tenants_view(frm);
            break;
        case 'usage':
            load_usage_view(frm);
            break;
        case 'plans':
            load_plans_view(frm);
            break;
    }
}

// Load overview data
function load_overview_data(frm) {
    const $container = frm.$dashboard_container.find('#overview-view');
    $container.html('<div class="loading-spinner">⏳ Loading dashboard data...</div>');
    
    frappe.call({
        method: 'cap.cap.doctype.tenant_administration.tenant_administration.get_dashboard_overview',
        args: {
            filters: get_current_filters(frm)
        },
        callback: function(r) {
            if (r.message && r.message.success) {
                render_overview_content(frm, r.message.data);
            } else {
                $container.html('<div class="empty-state">❌ Failed to load data</div>');
            }
        }
    });
}

// Render overview content
function render_overview_content(frm, data) {
    const $container = frm.$dashboard_container.find('#overview-view');
    
    let html = '<div class="kpi-grid">';
    
    // KPI Cards
    const kpis = [
        {label: 'Total Tenants', value: data.kpis.total_tenants, trend: '+12%', icon: '🏢'},
        {label: 'Active', value: data.kpis.active_tenants, trend: '+8%', icon: '✅'},
        {label: 'Trial', value: data.kpis.trial_tenants, trend: '+15%', icon: '🆓'},
        {label: 'Suspended', value: data.kpis.suspended_tenants, trend: '-3%', icon: '⚠️'},
        {label: 'New (30d)', value: data.kpis.new_tenants_30d, trend: '+20%', icon: '🆕'},
        {label: 'Total Users', value: data.kpis.total_users, trend: '+18%', icon: '👥'},
        {label: 'Storage', value: data.kpis.total_storage_gb + ' GB', trend: '+25%', icon: '💾'},
        {label: 'Satisfaction', value: data.kpis.satisfaction_rate + '%', trend: '+2%', icon: '⭐'}
    ];
    
    kpis.forEach(kpi => {
        html += `
            <div class="kpi-card">
                <div class="kpi-label">${kpi.icon} ${kpi.label}</div>
                <div class="kpi-value">${kpi.value}</div>
                <div class="kpi-trend">${kpi.trend}</div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Charts
    html += '<div class="charts-grid">';
    
    // Status Distribution Chart
    html += `
        <div class="chart-container">
            <div class="chart-title">📊 Tenant Status Distribution</div>
            <div id="status-chart" style="height: 300px;"></div>
        </div>
    `;
    
    // Plan Distribution Chart
    html += `
        <div class="chart-container">
            <div class="chart-title">💎 Plan Type Distribution</div>
            <div id="plan-chart" style="height: 300px;"></div>
        </div>
    `;
    
    html += '</div>';
    
    $container.html(html);
    
    // Render charts
    render_status_chart(data.status_distribution);
    render_plan_chart(data.plan_distribution);
}

// Render status distribution chart
function render_status_chart(data) {
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    new frappe.Chart('#status-chart', {
        data: {
            labels: labels,
            datasets: [{
                values: values
            }]
        },
        type: 'pie',
        height: 280,
        colors: ['#28a745', '#17a2b8', '#dc3545', '#6c757d']
    });
}

// Render plan distribution chart
function render_plan_chart(data) {
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    new frappe.Chart('#plan-chart', {
        data: {
            labels: labels,
            datasets: [{
                values: values
            }]
        },
        type: 'bar',
        height: 280,
        colors: ['#4CAF50']
    });
}

// Load tenants view
function load_tenants_view(frm) {
    const $container = frm.$dashboard_container.find('#tenants-view');
    
    const html = `
        <div class="tenant-table">
            <div class="table-header">
                <input type="text" class="search-box" id="tenant-search" placeholder="🔍 Search tenants...">
                <div class="action-buttons">
                    <button class="btn-custom btn-primary" id="refresh-btn">🔄 Refresh</button>
                    <button class="btn-custom btn-secondary" id="export-btn">📥 Export</button>
                </div>
            </div>
            <div id="tenants-table-content"></div>
        </div>
    `;
    
    $container.html(html);
    
    // Setup search
    setup_tenant_search(frm);
    
    // Setup buttons
    $container.find('#refresh-btn').on('click', () => refresh_tenant_list(frm));
    $container.find('#export-btn').on('click', () => export_tenant_data(frm));
    
    // Load tenant list
    refresh_tenant_list(frm);
}

// Setup tenant search
function setup_tenant_search(frm) {
    frm.$dashboard_container.find('#tenant-search').on('input', function() {
        const search_text = $(this).val();
        
        clearTimeout(search_timeout);
        search_timeout = setTimeout(() => {
            refresh_tenant_list(frm, search_text);
        }, 500);
    });
}

// Refresh tenant list
function refresh_tenant_list(frm, search_text = '') {
    const $content = frm.$dashboard_container.find('#tenants-table-content');
    $content.html('<div class="loading-spinner">⏳ Loading tenants...</div>');
    
    frappe.call({
        method: 'cap.cap.doctype.tenant_administration.tenant_administration.get_all_tenants',
        args: {
            filters: get_current_filters(frm),
            start: (current_page - 1) * items_per_page,
            page_length: items_per_page,
            search_text: search_text
        },
        callback: function(r) {
            if (r.message && r.message.success) {
                render_tenant_table(frm, r.message.data, r.message.total_count);
            } else {
                $content.html('<div class="empty-state">❌ Failed to load tenants</div>');
            }
        }
    });
}

// Render tenant table
function render_tenant_table(frm, tenants, total_count) {
    const $content = frm.$dashboard_container.find('#tenants-table-content');
    
    if (tenants.length === 0) {
        $content.html('<div class="empty-state"><div class="empty-state-icon">📦</div><div>No tenants found</div></div>');
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th><input type="checkbox" id="select-all"></th>
                    <th>Tenant Name</th>
                    <th>Status</th>
                    <th>Plan</th>
                    <th>Users</th>
                    <th>Storage</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    tenants.forEach(tenant => {
        const status_class = `status-${tenant.status.toLowerCase()}`;
        
        html += `
            <tr data-tenant="${tenant.name}">
                <td><input type="checkbox" class="tenant-checkbox" value="${tenant.name}"></td>
                <td><strong>${tenant.tenant_name}</strong><br><small>${tenant.domain || 'N/A'}</small></td>
                <td><span class="status-badge ${status_class}">${tenant.status}</span></td>
                <td>${tenant.plan_type}</td>
                <td>${tenant.users_count} / ${tenant.max_users || '∞'}</td>
                <td>${tenant.storage_used || 0} GB</td>
                <td>${frappe.datetime.str_to_user(tenant.creation)}</td>
                <td>
                    <button class="btn-custom btn-primary btn-sm view-tenant-btn" data-tenant="${tenant.name}">View</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    $content.html(html);
    
    // Add pagination
    render_pagination(frm, total_count);
    
    // Setup event handlers
    setup_tenant_table_events(frm);
}

// Render pagination
function render_pagination(frm, total_count) {
    const total_pages = Math.ceil(total_count / items_per_page);
    const $pagination = $('<div class="pagination"></div>');
    
    // Previous button
    $pagination.append(`
        <button class="page-btn" id="prev-page" ${current_page === 1 ? 'disabled' : ''}>
            ← Previous
        </button>
    `);
    
    // Page numbers
    for (let i = 1; i <= Math.min(5, total_pages); i++) {
        const active = i === current_page ? 'active' : '';
        $pagination.append(`
            <button class="page-btn ${active}" data-page="${i}">
                ${i}
            </button>
        `);
    }
    
    // Next button
    $pagination.append(`
        <button class="page-btn" id="next-page" ${current_page === total_pages ? 'disabled' : ''}>
            Next →
        </button>
    `);
    
    frm.$dashboard_container.find('#tenants-table-content').append($pagination);
    
    // Setup pagination events
    setup_pagination_events(frm);
}

// Setup pagination events
function setup_pagination_events(frm) {
    frm.$dashboard_container.find('.page-btn[data-page]').on('click', function() {
        current_page = parseInt($(this).data('page'));
        refresh_tenant_list(frm);
    });
    
    frm.$dashboard_container.find('#prev-page').on('click', function() {
        if (current_page > 1) {
            current_page--;
            refresh_tenant_list(frm);
        }
    });
    
    frm.$dashboard_container.find('#next-page').on('click', function() {
        current_page++;
        refresh_tenant_list(frm);
    });
}

// Setup tenant table events
function setup_tenant_table_events(frm) {
    // View tenant button
    frm.$dashboard_container.find('.view-tenant-btn').on('click', function() {
        const tenant_name = $(this).data('tenant');
        view_tenant_profile(frm, tenant_name);
    });
    
    // Select all checkbox
    frm.$dashboard_container.find('#select-all').on('change', function() {
        const checked = $(this).is(':checked');
        frm.$dashboard_container.find('.tenant-checkbox').prop('checked', checked);
    });
}

// View tenant profile
function view_tenant_profile(frm, tenant_name) {
    frappe.set_route('Form', 'Tenant', tenant_name);
}

// Load usage view
function load_usage_view(frm) {
    const $container = frm.$dashboard_container.find('#usage-view');
    $container.html('<div class="loading-spinner">⏳ Loading usage analytics...</div>');
    
    frappe.call({
        method: 'cap.cap.doctype.tenant_administration.tenant_administration.get_usage_analytics',
        args: {
            period: 30
        },
        callback: function(r) {
            if (r.message && r.message.success) {
                render_usage_content(frm, r.message.data);
            } else {
                $container.html('<div class="empty-state">❌ Failed to load analytics</div>');
            }
        }
    });
}

// Render usage content
function render_usage_content(frm, data) {
    const $container = frm.$dashboard_container.find('#usage-view');
    
    const html = `
        <div class="charts-grid">
            <div class="chart-container">
                <div class="chart-title">📈 Tenant Growth</div>
                <div id="tenant-growth-chart" style="height: 300px;"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">👥 User Growth</div>
                <div id="user-growth-chart" style="height: 300px;"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">💾 Storage Trend</div>
                <div id="storage-trend-chart" style="height: 300px;"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">📡 API Calls Trend</div>
                <div id="api-calls-chart" style="height: 300px;"></div>
            </div>
        </div>
    `;
    
    $container.html(html);
    
    // Render charts
    render_usage_charts(data);
}

// Render usage charts
function render_usage_charts(data) {
    // Tenant growth chart
    new frappe.Chart('#tenant-growth-chart', {
        data: data.tenant_growth,
        type: 'line',
        height: 280,
        colors: ['#4CAF50']
    });
    
    // User growth chart
    new frappe.Chart('#user-growth-chart', {
        data: data.user_growth,
        type: 'line',
        height: 280,
        colors: ['#2196F3']
    });
    
    // Storage trend chart
    new frappe.Chart('#storage-trend-chart', {
        data: data.storage_trend,
        type: 'line',
        height: 280,
        colors: ['#FF9800']
    });
    
    // API calls chart
    new frappe.Chart('#api-calls-chart', {
        data: data.api_calls_trend,
        type: 'bar',
        height: 280,
        colors: ['#9C27B0']
    });
}

// Load plans view
function load_plans_view(frm) {
    const $container = frm.$dashboard_container.find('#plans-view');
    
    const html = `
        <div style="padding: 20px; background: white; border-radius: 8px;">
            <h3>💎 Resource Allocation & Plans</h3>
            <p>Plan management features will be implemented here.</p>
            <div class="charts-grid" style="margin-top: 30px;">
                <div class="kpi-card">
                    <div class="kpi-label">🆓 Trial Plan</div>
                    <div class="kpi-value">5 Users / 5GB</div>
                    <div class="kpi-trend">Free</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">📦 Basic Plan</div>
                    <div class="kpi-value">20 Users / 50GB</div>
                    <div class="kpi-trend">$49/month</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">⭐ Professional</div>
                    <div class="kpi-value">100 Users / 200GB</div>
                    <div class="kpi-trend">$149/month</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">🚀 Enterprise</div>
                    <div class="kpi-value">Unlimited</div>
                    <div class="kpi-trend">Custom pricing</div>
                </div>
            </div>
        </div>
    `;
    
    $container.html(html);
}

// Add action buttons
function add_action_buttons(frm) {
    // Buttons are now integrated into the dashboard UI
}

// Setup auto-refresh
function setup_auto_refresh(frm) {
    clear_auto_refresh(frm);
    
    const interval = (frm.doc.refresh_interval || 30) * 1000;
    
    auto_refresh_interval = setInterval(() => {
        load_view_data(frm, current_view);
        frm.set_value('last_refresh', frappe.datetime.now_datetime());
    }, interval);
}

// Clear auto-refresh
function clear_auto_refresh(frm) {
    if (auto_refresh_interval) {
        clearInterval(auto_refresh_interval);
        auto_refresh_interval = null;
    }
}

// Get current filters
function get_current_filters(frm) {
    return {
        status: frm.doc.status_filter || 'All',
        plan_type: frm.doc.plan_filter || 'All',
        date_from: frm.doc.date_from,
        date_to: frm.doc.date_to
    };
}

// Export tenant data
function export_tenant_data(frm) {
    frappe.call({
        method: 'cap.cap.doctype.tenant_administration.tenant_administration.export_tenant_data',
        args: {
            format: frm.doc.export_format || 'json',
            filters: get_current_filters(frm)
        },
        callback: function(r) {
            if (r.message && r.message.success) {
                frappe.show_alert({
                    message: 'Data exported successfully',
                    indicator: 'green'
                });
                
                // Download the data
                const data_str = JSON.stringify(r.message.data, null, 2);
                const blob = new Blob([data_str], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tenants_export_${frappe.datetime.now_date()}.json`;
                a.click();
            }
        }
    });
}
