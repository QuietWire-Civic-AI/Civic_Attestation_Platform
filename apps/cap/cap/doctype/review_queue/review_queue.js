/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: review_queue.js
*/

frappe.ui.form.on('Review Queue', {
	// ==================== Form Lifecycle ====================
	
	refresh: function(frm) {
		// Set up custom buttons
		setup_custom_buttons(frm);
		
		// Set up indicators
		setup_status_indicators(frm);
		
		// Set up auto-refresh for SLA
		setup_sla_auto_refresh(frm);
		
		// Set up field dependencies
		setup_field_dependencies(frm);
		
		// Set up real-time updates
		setup_realtime_updates(frm);
	},
	
	onload: function(frm) {
		// Set default values for new documents
		if (frm.is_new()) {
			frm.set_value('status', 'Pending');
			frm.set_value('priority', 'Medium');
			frm.set_value('sla_status', 'On Track');
			frm.set_value('send_email_notifications', 1);
			frm.set_value('send_sla_warnings', 1);
			frm.set_value('warning_threshold_hours', 24);
		}
	},
	
	// ==================== Field Change Handlers ====================
	
	priority: function(frm) {
		// Recalculate due date when priority changes
		if (frm.is_new() && !frm.doc.due_date) {
			calculate_due_date_by_priority(frm);
		}
	},
	
	review_type: function(frm) {
		// Load default checklist based on review type
		load_default_checklist(frm);
	},
	
	status: function(frm) {
		// Handle status change
		handle_status_change(frm);
	},
	
	decision: function(frm) {
		// Show/hide rejection reasons section
		frm.toggle_display('section_break_rejection', frm.doc.decision === 'Rejected');
	},
	
	assigned_to: function(frm) {
		// Update current reviewer
		if (frm.doc.assigned_to) {
			frm.set_value('current_reviewer', frm.doc.assigned_to);
		}
	}
});

// ==================== Child Table Handlers ====================

frappe.ui.form.on('Review Queue Checklist', {
	completed: function(frm, cdt, cdn) {
		// Update progress when checklist item is completed
		update_progress_summary(frm);
	},
	
	checklist_items_remove: function(frm) {
		update_progress_summary(frm);
	},
	
	checklist_items_add: function(frm) {
		update_progress_summary(frm);
	}
});

// ==================== Custom Button Functions ====================

function setup_custom_buttons(frm) {
	if (frm.is_new()) return;
	
	// Clear existing custom buttons
	frm.clear_custom_buttons();
	
	// Action buttons based on status
	if (frm.doc.status === 'Pending' || frm.doc.status === 'In Review') {
		// Start Review button
		if (frm.doc.status === 'Pending') {
			frm.add_custom_button(__('Start Review'), function() {
				start_review(frm);
			}, __('Actions'));
		}
		
		// Approve button
		frm.add_custom_button(__('Approve'), function() {
			approve_review(frm);
		}, __('Actions')).addClass('btn-success');
		
		// Reject button
		frm.add_custom_button(__('Reject'), function() {
			reject_review(frm);
		}, __('Actions')).addClass('btn-danger');
		
		// Escalate button
		frm.add_custom_button(__('Escalate'), function() {
			show_escalation_dialog(frm);
		}, __('Actions')).addClass('btn-warning');
		
		// Put On Hold button
		frm.add_custom_button(__('Put On Hold'), function() {
			frm.set_value('status', 'On Hold');
			frm.save();
		}, __('Actions'));
	}
	
	// SLA Management buttons
	frm.add_custom_button(__('Extend SLA'), function() {
		show_extend_sla_dialog(frm);
	}, __('SLA'));
	
	frm.add_custom_button(__('Refresh SLA'), function() {
		frm.reload_doc();
	}, __('SLA'));
	
	// Assignment buttons
	if (!frm.doc.assigned_to) {
		frm.add_custom_button(__('Assign to Me'), function() {
			frm.set_value('assigned_to', frappe.session.user);
			frm.save();
		}, __('Assignment'));
	}
	
	frm.add_custom_button(__('Reassign'), function() {
		show_reassign_dialog(frm);
	}, __('Assignment'));
	
	// Communication buttons
	frm.add_custom_button(__('Add Comment'), function() {
		show_add_comment_dialog(frm);
	}, __('Communication'));
	
	frm.add_custom_button(__('Add Watcher'), function() {
		show_add_watcher_dialog(frm);
	}, __('Communication'));
	
	// Reports
	frm.add_custom_button(__('View History'), function() {
		show_review_history(frm);
	}, __('Reports'));
}

// ==================== Status Management ====================

function start_review(frm) {
	frm.set_value('status', 'In Review');
	if (!frm.doc.assigned_to) {
		frm.set_value('assigned_to', frappe.session.user);
	}
	frm.save();
}

function approve_review(frm) {
	frappe.prompt([
		{
			fieldname: 'decision_notes',
			fieldtype: 'Text',
			label: __('Approval Notes'),
			reqd: 0
		}
	], function(values) {
		frm.set_value('decision', 'Approved');
		frm.set_value('status', 'Approved');
		if (values.decision_notes) {
			frm.set_value('decision_notes', values.decision_notes);
		}
		frm.save();
		frappe.show_alert({message: __('Review Approved'), indicator: 'green'});
	}, __('Approve Review'));
}

function reject_review(frm) {
	frappe.prompt([
		{
			fieldname: 'rejection_reason',
			fieldtype: 'Text',
			label: __('Rejection Reason'),
			reqd: 1
		}
	], function(values) {
		// Add rejection reason to child table
		let row = frm.add_child('rejection_reasons');
		row.reason = values.rejection_reason;
		row.rejected_by = frappe.session.user;
		row.rejection_date = frappe.datetime.now_datetime();
		
		frm.set_value('decision', 'Rejected');
		frm.set_value('status', 'Rejected');
		frm.refresh_field('rejection_reasons');
		frm.save();
		frappe.show_alert({message: __('Review Rejected'), indicator: 'red'});
	}, __('Reject Review'));
}

function handle_status_change(frm) {
	// Add any additional logic for status changes
	if (frm.doc.status === 'In Review' && !frm.doc.assigned_to) {
		frappe.msgprint(__('Please assign the review to a reviewer'));
	}
}

// ==================== Escalation ====================

function show_escalation_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Escalate Review'),
		fields: [
			{
				fieldname: 'reason',
				fieldtype: 'Text',
				label: __('Escalation Reason'),
				reqd: 1
			}
		],
		primary_action_label: __('Escalate'),
		primary_action: function(values) {
			frappe.call({
				method: 'cap.cap.doctype.review_queue.review_queue.escalate',
				args: {
					docname: frm.doc.name,
					reason: values.reason
				},
				callback: function(r) {
					if (r.message && r.message.success) {
						frappe.show_alert({message: __('Review Escalated'), indicator: 'orange'});
						frm.reload_doc();
					}
				}
			});
			d.hide();
		}
	});
	d.show();
}

// ==================== SLA Management ====================

function show_extend_sla_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Extend SLA'),
		fields: [
			{
				fieldname: 'hours',
				fieldtype: 'Int',
				label: __('Extend by (hours)'),
				reqd: 1,
				default: 24
			},
			{
				fieldname: 'reason',
				fieldtype: 'Text',
				label: __('Reason'),
				reqd: 1
			}
		],
		primary_action_label: __('Extend'),
		primary_action: function(values) {
			frappe.call({
				method: 'cap.cap.doctype.review_queue.review_queue.extend_sla',
				args: {
					docname: frm.doc.name,
					hours: values.hours,
					reason: values.reason
				},
				callback: function(r) {
					if (r.message && r.message.success) {
						frappe.show_alert({message: r.message.message, indicator: 'blue'});
						frm.reload_doc();
					}
				}
			});
			d.hide();
		}
	});
	d.show();
}

function setup_sla_auto_refresh(frm) {
	if (frm.is_new()) return;
	
	// Auto-refresh SLA status every minute
	if (frm.doc.status === 'Pending' || frm.doc.status === 'In Review') {
		setInterval(function() {
			frm.reload_doc();
		}, 60000); // 60 seconds
	}
}

// ==================== Assignment ====================

function show_reassign_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Reassign Review'),
		fields: [
			{
				fieldname: 'assigned_to',
				fieldtype: 'Link',
				options: 'User',
				label: __('Assign To'),
				reqd: 1
			}
		],
		primary_action_label: __('Reassign'),
		primary_action: function(values) {
			frm.set_value('assigned_to', values.assigned_to);
			frm.save();
			frappe.show_alert({message: __('Review Reassigned'), indicator: 'blue'});
			d.hide();
		}
	});
	d.show();
}

// ==================== Communication ====================

function show_add_comment_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Add Comment'),
		fields: [
			{
				fieldname: 'comment',
				fieldtype: 'Text',
				label: __('Comment'),
				reqd: 1
			}
		],
		primary_action_label: __('Add'),
		primary_action: function(values) {
			let row = frm.add_child('comments');
			row.comment = values.comment;
			row.commented_by = frappe.session.user;
			row.comment_date = frappe.datetime.now_datetime();
			frm.refresh_field('comments');
			frm.save();
			d.hide();
		}
	});
	d.show();
}

function show_add_watcher_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Add Watcher'),
		fields: [
			{
				fieldname: 'user',
				fieldtype: 'Link',
				options: 'User',
				label: __('User'),
				reqd: 1
			},
			{
				fieldname: 'notify_on_update',
				fieldtype: 'Check',
				label: __('Notify on Update'),
				default: 1
			},
			{
				fieldname: 'notify_on_sla_breach',
				fieldtype: 'Check',
				label: __('Notify on SLA Breach'),
				default: 1
			}
		],
		primary_action_label: __('Add'),
		primary_action: function(values) {
			let row = frm.add_child('watchers');
			row.user = values.user;
			row.notify_on_update = values.notify_on_update;
			row.notify_on_sla_breach = values.notify_on_sla_breach;
			frm.refresh_field('watchers');
			frm.save();
			d.hide();
		}
	});
	d.show();
}

// ==================== Progress Tracking ====================

function update_progress_summary(frm) {
	if (!frm.doc.checklist_items) {
		frm.set_value('total_checklist_items', 0);
		frm.set_value('completed_checklist_items', 0);
		frm.set_value('completion_percentage', 0);
		return;
	}
	
	let total = frm.doc.checklist_items.length;
	let completed = frm.doc.checklist_items.filter(item => item.completed).length;
	
	frm.set_value('total_checklist_items', total);
	frm.set_value('completed_checklist_items', completed);
	frm.set_value('completion_percentage', total > 0 ? (completed / total * 100) : 0);
}

function load_default_checklist(frm) {
	// Load default checklist items based on review type
	// This can be customized based on your requirements
	if (frm.is_new() && frm.doc.review_type) {
		// Example: Load from a template
		// frappe.call({
		//     method: 'your_method',
		//     args: {review_type: frm.doc.review_type},
		//     callback: function(r) { ... }
		// });
	}
}

// ==================== Visual Indicators ====================

function setup_status_indicators(frm) {
	if (frm.is_new()) return;
	
	// Add SLA status indicator to the form
	let sla_html = get_sla_indicator_html(frm.doc);
	frm.dashboard.add_indicator(sla_html);
	
	// Add priority indicator
	let priority_color = {
		'Low': 'blue',
		'Medium': 'orange',
		'High': 'red',
		'Critical': 'darkred'
	};
	frm.dashboard.set_headline_alert(
		`<div class="row">
			<div class="col-xs-12">
				<span class="indicator ${priority_color[frm.doc.priority]}">
					Priority: ${frm.doc.priority}
				</span>
				<span class="indicator ${get_sla_color(frm.doc.sla_status)}" style="margin-left: 10px;">
					SLA: ${frm.doc.sla_status} ${frm.doc.time_remaining ? '(' + frm.doc.time_remaining + ')' : ''}
				</span>
			</div>
		</div>`
	);
}

function get_sla_indicator_html(doc) {
	let color = get_sla_color(doc.sla_status);
	return `<span class="indicator ${color}">SLA: ${doc.sla_status}</span>`;
}

function get_sla_color(sla_status) {
	const colors = {
		'On Track': 'green',
		'Warning': 'orange',
		'Breached': 'red',
		'Extended': 'blue'
	};
	return colors[sla_status] || 'gray';
}

// ==================== Utility Functions ====================

function calculate_due_date_by_priority(frm) {
	const priority_hours = {
		'Low': 168,    // 7 days
		'Medium': 72,  // 3 days
		'High': 24,    // 1 day
		'Critical': 8  // 8 hours
	};
	
	let hours = priority_hours[frm.doc.priority] || 72;
	let due_date = frappe.datetime.add_to_date(frappe.datetime.now_datetime(), {hours: hours});
	frm.set_value('due_date', due_date);
}

function setup_field_dependencies(frm) {
	// Set up field visibility based on other fields
	frm.toggle_display('section_break_rejection', frm.doc.decision === 'Rejected');
	frm.toggle_display('section_break_escalation', frm.doc.escalated);
}

function setup_realtime_updates(frm) {
	if (frm.is_new()) return;
	
	// Subscribe to real-time updates
	frappe.realtime.on('review_queue_update_' + frm.doc.name, function(data) {
		frappe.show_alert({
			message: __('Review has been updated by another user'),
			indicator: 'orange'
		});
		frm.reload_doc();
	});
}

function show_review_history(frm) {
	// Show version history
	frappe.route_options = {
		"ref_doctype": frm.doctype,
		"docname": frm.doc.name
	};
	frappe.set_route("List", "Version");
}
