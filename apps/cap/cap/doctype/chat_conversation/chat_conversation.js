/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: chat_conversation.js
*/

frappe.ui.form.on('Chat Conversation', {
	// ========================================
	// Form Setup
	// ========================================
	refresh: function(frm) {
		setup_dashboard(frm);
		setup_action_buttons(frm);
		setup_realtime_listeners(frm);
		setup_custom_layout(frm);
		update_form_indicators(frm);
	},

	onload: function(frm) {
		// Hide standard fields for better UX
		frm.set_df_property('messages', 'hidden', 0);
		frm.set_df_property('statistics', 'hidden', 1);
		frm.set_df_property('metadata', 'hidden', 1);
	},

	// ========================================
	// Field Events
	// ========================================
	status: function(frm) {
		update_form_indicators(frm);
	},

	conversation_type: function(frm) {
		update_ai_context(frm);
	},
});

// ========================================
// Dashboard Setup
// ========================================
function setup_dashboard(frm) {
	if (!frm.doc.__islocal) {
		// Clear existing dashboard
		frm.dashboard.clear_headline();
		
		// Add statistics
		let stats_html = `
			<div class="chat-stats" style="display: flex; gap: 20px; padding: 10px; background: #f8f9fa; border-radius: 8px; margin-bottom: 15px;">
				<div class="stat-item" style="flex: 1; text-align: center;">
					<div style="font-size: 24px; font-weight: bold; color: #2490ef;">${frm.doc.total_messages || 0}</div>
					<div style="font-size: 12px; color: #6c757d;">إجمالي الرسائل</div>
				</div>
				<div class="stat-item" style="flex: 1; text-align: center;">
					<div style="font-size: 24px; font-weight: bold; color: #10b981;">${frm.doc.user_messages || 0}</div>
					<div style="font-size: 12px; color: #6c757d;">رسائل المستخدم</div>
				</div>
				<div class="stat-item" style="flex: 1; text-align: center;">
					<div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${frm.doc.ai_messages || 0}</div>
					<div style="font-size: 12px; color: #6c757d;">رسائل AI</div>
				</div>
				<div class="stat-item" style="flex: 1; text-align: center;">
					<div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${frm.doc.status || 'N/A'}</div>
					<div style="font-size: 12px; color: #6c757d;">الحالة</div>
				</div>
			</div>
		`;
		
		frm.dashboard.add_section(stats_html);
		
		// Add indicators
		if (frm.doc.is_pinned) {
			frm.dashboard.add_indicator(__('Pinned Conversation'), 'blue');
		}
		
		if (frm.doc.is_archived) {
			frm.dashboard.add_indicator(__('Archived'), 'gray');
		}
	}
}

// ========================================
// Action Buttons
// ========================================
function setup_action_buttons(frm) {
	if (!frm.doc.__islocal) {
		// Send Message Button
		frm.add_custom_button(__('💬 Send Message'), function() {
			show_send_message_dialog(frm);
		}, __('Actions'));
		
		// Refresh Messages
		frm.add_custom_button(__('🔄 Refresh'), function() {
			frm.reload_doc();
			frappe.show_alert({
				message: __('Messages refreshed'),
				indicator: 'green'
			});
		}, __('Actions'));
		
		// Pin/Unpin
		if (frm.doc.is_pinned) {
			frm.add_custom_button(__('📌 Unpin'), function() {
				frm.set_value('is_pinned', 0);
				frm.save();
			}, __('Actions'));
		} else {
			frm.add_custom_button(__('📌 Pin'), function() {
				frm.set_value('is_pinned', 1);
				frm.save();
			}, __('Actions'));
		}
		
		// Archive/Unarchive
		if (frm.doc.is_archived) {
			frm.add_custom_button(__('📂 Unarchive'), function() {
				frm.set_value('is_archived', 0);
				frm.set_value('status', 'Active');
				frm.save();
			}, __('Actions'));
		} else {
			frm.add_custom_button(__('🗄️ Archive'), function() {
				frm.set_value('is_archived', 1);
				frm.set_value('status', 'Closed');
				frm.save();
			}, __('Actions'));
		}
		
		// Export Conversation
		frm.add_custom_button(__('📥 Export'), function() {
			export_conversation(frm);
		}, __('Actions'));
		
		// View Statistics
		frm.add_custom_button(__('📊 Statistics'), function() {
			show_statistics_dialog(frm);
		}, __('Reports'));
	}
}

// ========================================
// Send Message Dialog
// ========================================
function show_send_message_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Send Message'),
		fields: [
			{
				fieldtype: 'Small Text',
				fieldname: 'message_content',
				label: __('Message'),
				reqd: 1,
				description: __('Type your message here')
			},
			{
				fieldtype: 'Select',
				fieldname: 'message_type',
				label: __('Message Type'),
				options: ['Text', 'Markdown', 'Code'],
				default: 'Text'
			},
			{
				fieldtype: 'Attach',
				fieldname: 'attachments',
				label: __('Attachments (Optional)')
			}
		],
		primary_action_label: __('Send'),
		primary_action: function(values) {
			// Show loading
			frappe.show_alert({
				message: __('Sending message...'),
				indicator: 'blue'
			});
			
			// Call API
			frappe.call({
				method: 'cap.doctype.chat_conversation.chat_conversation.send_message',
				args: {
					conversation_name: frm.doc.name,
					message_content: values.message_content,
					message_type: values.message_type,
					attachments: values.attachments
				},
				callback: function(r) {
					if (r.message && r.message.success) {
						frappe.show_alert({
							message: __('Message sent successfully! AI is responding...'),
							indicator: 'green'
						});
						
						// Reload to show new messages
						setTimeout(function() {
							frm.reload_doc();
						}, 1000);
						
						d.hide();
					} else {
						frappe.msgprint({
							title: __('Error'),
							indicator: 'red',
							message: r.message.message || __('Failed to send message')
						});
					}
				}
			});
		}
	});
	
	d.show();
}

// ========================================
// Real-time Setup
// ========================================
function setup_realtime_listeners(frm) {
	if (!frm.doc.__islocal) {
		// Listen for new messages
		frappe.realtime.on('chat_message', function(data) {
			if (data.conversation === frm.doc.name) {
				// Show notification
				frappe.show_alert({
					message: __('New message received'),
					indicator: 'blue'
				});
				
				// Reload form
				frm.reload_doc();
			}
		});
	}
}

// ========================================
// Custom Layout
// ========================================
function setup_custom_layout(frm) {
	if (!frm.doc.__islocal && frm.doc.messages && frm.doc.messages.length > 0) {
		// Add custom CSS for chat messages
		if (!$('#chat-custom-css').length) {
			$('head').append(`
				<style id="chat-custom-css">
					.chat-message {
						padding: 12px;
						margin: 8px 0;
						border-radius: 8px;
						max-width: 80%;
					}
					.chat-message.user {
						background: #e3f2fd;
						margin-left: auto;
						border: 1px solid #2196f3;
					}
					.chat-message.ai {
						background: #f3e5f5;
						margin-right: auto;
						border: 1px solid #9c27b0;
					}
					.chat-message.system {
						background: #fff3e0;
						margin: 0 auto;
						border: 1px solid #ff9800;
						text-align: center;
					}
					.chat-timestamp {
						font-size: 11px;
						color: #6c757d;
						margin-top: 4px;
					}
					.chat-sender {
						font-weight: bold;
						margin-bottom: 4px;
					}
				</style>
			`);
		}
	}
}

// ========================================
// Update Form Indicators
// ========================================
function update_form_indicators(frm) {
	if (!frm.doc.__islocal) {
		// Status indicator
		let indicator_color = {
			'Active': 'green',
			'Pending': 'orange',
			'Resolved': 'blue',
			'Closed': 'gray'
		}[frm.doc.status] || 'gray';
		
		frm.set_indicator_formatter('status', function(doc) {
			return indicator_color;
		});
	}
}

// ========================================
// AI Context Update
// ========================================
function update_ai_context(frm) {
	if (!frm.doc.__islocal) {
		// Update AI context based on conversation type
		let context_map = {
			'Compliance Query': 'Focus on compliance standards, regulations, and policies.',
			'Evidence Review': 'Assist with evidence validation, chain of custody, and forensic analysis.',
			'Policy Question': 'Provide information about organizational policies and procedures.',
			'Incident Report': 'Help with incident documentation, analysis, and remediation steps.',
		};
		
		if (context_map[frm.doc.conversation_type]) {
			frm.set_value('ai_context', context_map[frm.doc.conversation_type]);
		}
	}
}

// ========================================
// Export Conversation
// ========================================
function export_conversation(frm) {
	let content = `Conversation: ${frm.doc.title}\n`;
	content += `Type: ${frm.doc.conversation_type}\n`;
	content += `Status: ${frm.doc.status}\n`;
	content += `Started: ${frm.doc.started_at}\n`;
	content += `\n${'='.repeat(50)}\n\n`;
	
	if (frm.doc.messages) {
		frm.doc.messages.forEach(function(msg) {
			content += `[${msg.timestamp}] ${msg.sender_type}:\n`;
			content += `${msg.message_content}\n\n`;
		});
	}
	
	// Create downloadable file
	let blob = new Blob([content], { type: 'text/plain' });
	let url = window.URL.createObjectURL(blob);
	let a = document.createElement('a');
	a.href = url;
	a.download = `${frm.doc.name}_conversation.txt`;
	a.click();
	
	frappe.show_alert({
		message: __('Conversation exported'),
		indicator: 'green'
	});
}

// ========================================
// Statistics Dialog
// ========================================
function show_statistics_dialog(frm) {
	let stats_html = `
		<div style="padding: 20px;">
			<h4>📊 Conversation Statistics</h4>
			<table class="table table-bordered" style="margin-top: 15px;">
				<tr>
					<td><strong>Total Messages</strong></td>
					<td>${frm.doc.total_messages || 0}</td>
				</tr>
				<tr>
					<td><strong>User Messages</strong></td>
					<td>${frm.doc.user_messages || 0}</td>
				</tr>
				<tr>
					<td><strong>AI Messages</strong></td>
					<td>${frm.doc.ai_messages || 0}</td>
				</tr>
				<tr>
					<td><strong>Started At</strong></td>
					<td>${frm.doc.started_at || 'N/A'}</td>
				</tr>
				<tr>
					<td><strong>Last Message</strong></td>
					<td>${frm.doc.last_message_at || 'N/A'}</td>
				</tr>
				<tr>
					<td><strong>Duration</strong></td>
					<td>${calculate_duration(frm)}</td>
				</tr>
			</table>
		</div>
	`;
	
	let d = new frappe.ui.Dialog({
		title: __('Conversation Statistics'),
		fields: [
			{
				fieldtype: 'HTML',
				fieldname: 'stats_html',
				options: stats_html
			}
		]
	});
	
	d.show();
}

// ========================================
// Helper Functions
// ========================================
function calculate_duration(frm) {
	if (!frm.doc.started_at || !frm.doc.last_message_at) {
		return 'N/A';
	}
	
	let start = new Date(frm.doc.started_at);
	let end = new Date(frm.doc.last_message_at);
	let diff = Math.abs(end - start);
	
	let hours = Math.floor(diff / (1000 * 60 * 60));
	let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	
	return `${hours}h ${minutes}m`;
}
