/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: review_queue_list.js
*/

frappe.listview_settings['Review Queue'] = {
	get_indicator: function(doc) {
		// Status indicators
		const status_colors = {
			'Pending': 'orange',
			'In Review': 'blue',
			'Approved': 'green',
			'Rejected': 'red',
			'Escalated': 'purple',
			'On Hold': 'gray',
			'Cancelled': 'darkgray'
		};
		
		// SLA Status indicators
		if (doc.sla_status === 'Breached') {
			return [__(doc.status), 'red', 'status,=,' + doc.status];
		} else if (doc.sla_status === 'Warning') {
			return [__(doc.status), 'orange', 'status,=,' + doc.status];
		}
		
		return [__(doc.status), status_colors[doc.status] || 'gray', 'status,=,' + doc.status];
	},
	
	onload: function(listview) {
		// Add custom buttons to list view
		listview.page.add_inner_button(__('My Reviews'), function() {
			frappe.set_route('List', 'Review Queue', {
				'assigned_to': frappe.session.user
			});
		});
		
		listview.page.add_inner_button(__('Overdue Reviews'), function() {
			frappe.set_route('List', 'Review Queue', {
				'sla_status': 'Breached'
			});
		});
		
		listview.page.add_inner_button(__('High Priority'), function() {
			frappe.set_route('List', 'Review Queue', {
				'priority': 'Critical'
			});
		});
	}
};
