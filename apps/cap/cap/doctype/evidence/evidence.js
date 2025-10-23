/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: evidence.js
*/

frappe.ui.form.on('Evidence', {
	// ==================== Form Load ====================
	
	refresh: function(frm) {
		// Set read-only fields based on status
		if (frm.doc.status === 'Archived' || frm.doc.status === 'Expired') {
			frm.set_df_property('content', 'read_only', 1);
		}
		
		// Add custom buttons
		add_custom_buttons(frm);
		
		// Set field properties based on verification status
		set_verification_fields(frm);
		
		// Display statistics
		if (!frm.is_new()) {
			display_statistics(frm);
		}
		
		// Add indicators
		add_status_indicators(frm);
	},
	
	onload: function(frm) {
		// Set default values for new documents
		if (frm.is_new()) {
			frm.set_value('created_at', frappe.datetime.now_datetime());
			frm.set_value('created_by_user', frappe.session.user);
		}
	},
	
	// ==================== Field Events ====================
	
	content: function(frm) {
		// Auto-calculate content size when content changes
		if (frm.doc.content) {
			let size = new Blob([frm.doc.content]).size;
			frm.set_value('content_size', size);
		}
	},
	
	evidence_type: function(frm) {
		// Set suggested content type based on evidence type
		const type_mapping = {
			'Document': 'application/pdf',
			'Screenshot': 'image/png',
			'Recording': 'audio/mp3',
			'Transcript': 'text/plain',
			'Log File': 'text/plain',
			'Email': 'message/rfc822',
			'Chat Message': 'text/plain',
			'API Response': 'application/json'
		};
		
		if (frm.doc.evidence_type && type_mapping[frm.doc.evidence_type]) {
			if (!frm.doc.content_type) {
				frm.set_value('content_type', type_mapping[frm.doc.evidence_type]);
			}
		}
	},
	
	status: function(frm) {
		// Handle status transitions
		if (frm.doc.status === 'Verified') {
			if (!frm.doc.verification_status || frm.doc.verification_status === 'Not Verified') {
				frm.set_value('verification_status', 'Verified');
			}
		}
	},
	
	verification_status: function(frm) {
		// Update verification fields visibility
		set_verification_fields(frm);
	},
	
	confidence_score: function(frm) {
		// Validate confidence score range
		if (frm.doc.confidence_score !== null && frm.doc.confidence_score !== undefined) {
			if (frm.doc.confidence_score < 0 || frm.doc.confidence_score > 1) {
				frappe.msgprint(__('Confidence Score must be between 0 and 1'));
				frm.set_value('confidence_score', null);
			}
		}
	},
	
	// ==================== Child Table Events ====================
	
	attachments_add: function(frm, cdt, cdn) {
		// Handle new attachment
		const row = locals[cdt][cdn];
		row.uploaded_at = frappe.datetime.now_datetime();
		row.uploaded_by = frappe.session.user;
		frm.refresh_field('attachments');
	}
});

// ==================== Custom Buttons ====================

function add_custom_buttons(frm) {
	if (frm.is_new()) return;
	
	// Verification Actions
	if (frm.doc.status === 'Draft' || frm.doc.status === 'Pending Verification') {
		frm.add_custom_button(__('Submit for Verification'), function() {
			submit_for_verification(frm);
		}, __('Actions'));
	}
	
	if (frm.doc.status === 'Pending Verification' && 
		(frappe.user.has_role('CAP Admin') || frappe.user.has_role('CAP Compliance Officer'))) {
		
		frm.add_custom_button(__('Verify Evidence'), function() {
			verify_evidence_dialog(frm);
		}, __('Verification'));
		
		frm.add_custom_button(__('Reject Verification'), function() {
			reject_verification_dialog(frm);
		}, __('Verification'));
		
		frm.add_custom_button(__('Auto Verify'), function() {
			auto_verify(frm);
		}, __('Verification'));
	}
	
	// Content Actions
	frm.add_custom_button(__('Verify Integrity'), function() {
		verify_integrity(frm);
	}, __('Content'));
	
	frm.add_custom_button(__('View Content Hash'), function() {
		show_content_hash(frm);
	}, __('Content'));
	
	// Version Control
	frm.add_custom_button(__('Create New Version'), function() {
		create_version_dialog(frm);
	}, __('Versions'));
	
	frm.add_custom_button(__('View History'), function() {
		view_version_history(frm);
	}, __('Versions'));
	
	// Relationships
	frm.add_custom_button(__('Link to Message'), function() {
		link_to_message_dialog(frm);
	}, __('Relationships'));
	
	frm.add_custom_button(__('Link to Policy'), function() {
		link_to_policy_dialog(frm);
	}, __('Relationships'));
	
	// Archive
	if (frm.doc.status !== 'Archived' && frm.doc.status !== 'Expired') {
		frm.add_custom_button(__('Archive'), function() {
			archive_evidence_dialog(frm);
		}, __('Actions'));
	}
	
	// Chain of Custody
	frm.add_custom_button(__('View Chain of Custody'), function() {
		view_custody_chain(frm);
	}, __('Audit'));
}

// ==================== Verification Functions ====================

function submit_for_verification(frm) {
	frappe.call({
		method: 'submit_for_verification',
		doc: frm.doc,
		callback: function(r) {
			frm.reload_doc();
		}
	});
}

function verify_evidence_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Verify Evidence'),
		fields: [
			{
				label: __('Verification Method'),
				fieldname: 'verification_method',
				fieldtype: 'Select',
				options: [
					'Manual Review',
					'Automated Check',
					'Cryptographic',
					'Third Party',
					'Cross Reference',
					'Other'
				],
				reqd: 1
			},
			{
				label: __('Verification Notes'),
				fieldname: 'notes',
				fieldtype: 'Small Text'
			},
			{
				label: __('Confidence Score (0-1)'),
				fieldname: 'confidence_score',
				fieldtype: 'Float',
				precision: 4
			}
		],
		primary_action_label: __('Verify'),
		primary_action: function() {
			let values = d.get_values();
			
			frappe.call({
				method: 'verify_evidence',
				doc: frm.doc,
				args: {
					verification_method: values.verification_method,
					notes: values.notes
				},
				callback: function(r) {
					if (values.confidence_score) {
						frm.set_value('confidence_score', values.confidence_score);
					}
					frm.reload_doc();
					d.hide();
				}
			});
		}
	});
	
	d.show();
}

function reject_verification_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Reject Verification'),
		fields: [
			{
				label: __('Rejection Reason'),
				fieldname: 'reason',
				fieldtype: 'Small Text',
				reqd: 1
			}
		],
		primary_action_label: __('Reject'),
		primary_action: function() {
			let values = d.get_values();
			
			frappe.call({
				method: 'reject_verification',
				doc: frm.doc,
				args: {
					reason: values.reason
				},
				callback: function(r) {
					frm.reload_doc();
					d.hide();
				}
			});
		}
	});
	
	d.show();
}

function auto_verify(frm) {
	frappe.confirm(
		__('Are you sure you want to auto-verify this evidence?'),
		function() {
			frappe.call({
				method: 'cap.doctype.evidence.evidence.auto_verify',
				args: {
					docname: frm.doc.name
				},
				callback: function(r) {
					frm.reload_doc();
				}
			});
		}
	);
}

// ==================== Content Functions ====================

function verify_integrity(frm) {
	frappe.call({
		method: 'verify_content_integrity',
		doc: frm.doc,
		callback: function(r) {
			if (r.message) {
				frappe.msgprint(__('Content integrity verified successfully'));
			} else {
				frappe.msgprint({
					title: __('Integrity Check Failed'),
					message: __('Content has been modified or hash is missing'),
					indicator: 'red'
				});
			}
		}
	});
}

function show_content_hash(frm) {
	if (!frm.doc.content_hash) {
		frappe.msgprint(__('No content hash available'));
		return;
	}
	
	let d = new frappe.ui.Dialog({
		title: __('Content Hash (SHA-256)'),
		fields: [
			{
				fieldtype: 'HTML',
				options: `
					<div style="font-family: monospace; word-break: break-all; padding: 10px; background: #f5f5f5; border-radius: 4px;">
						${frm.doc.content_hash}
					</div>
					<br>
					<button class="btn btn-sm btn-default" onclick="navigator.clipboard.writeText('${frm.doc.content_hash}')">
						<i class="fa fa-copy"></i> Copy to Clipboard
					</button>
				`
			}
		]
	});
	
	d.show();
}

// ==================== Version Control ====================

function create_version_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Create New Version'),
		fields: [
			{
				label: __('Change Summary'),
				fieldname: 'change_summary',
				fieldtype: 'Small Text',
				reqd: 1
			}
		],
		primary_action_label: __('Create Version'),
		primary_action: function() {
			let values = d.get_values();
			
			frappe.call({
				method: 'create_new_version',
				doc: frm.doc,
				args: {
					change_summary: values.change_summary
				},
				callback: function(r) {
					if (r.message) {
						frappe.set_route('Form', 'Evidence', r.message);
					}
					d.hide();
				}
			});
		}
	});
	
	d.show();
}

function view_version_history(frm) {
	frappe.call({
		method: 'get_version_history',
		doc: frm.doc,
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				let html = '<table class="table table-bordered"><thead><tr><th>Version</th><th>Actions</th></tr></thead><tbody>';
				
				r.message.forEach(function(version, idx) {
					html += `<tr>
						<td>Version ${idx + 1}: ${version}</td>
						<td><a href="/app/evidence/${version}">View</a></td>
					</tr>`;
				});
				
				html += '</tbody></table>';
				
				let d = new frappe.ui.Dialog({
					title: __('Version History'),
					fields: [{
						fieldtype: 'HTML',
						options: html
					}]
				});
				
				d.show();
			}
		}
	});
}

// ==================== Relationship Functions ====================

function link_to_message_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Link to Message'),
		fields: [
			{
				label: __('Message'),
				fieldname: 'message',
				fieldtype: 'Link',
				options: 'Message',
				reqd: 1
			},
			{
				label: __('Relationship Type'),
				fieldname: 'relationship_type',
				fieldtype: 'Data',
				default: 'Supporting Evidence'
			}
		],
		primary_action_label: __('Link'),
		primary_action: function() {
			let values = d.get_values();
			
			frm.add_child('related_messages', {
				message: values.message,
				relationship_type: values.relationship_type
			});
			
			frm.refresh_field('related_messages');
			frm.save();
			d.hide();
		}
	});
	
	d.show();
}

function link_to_policy_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Link to Policy'),
		fields: [
			{
				label: __('Policy'),
				fieldname: 'policy',
				fieldtype: 'Link',
				options: 'Policy',
				reqd: 1
			},
			{
				label: __('Relationship Type'),
				fieldname: 'relationship_type',
				fieldtype: 'Data',
				default: 'Policy Compliance'
			}
		],
		primary_action_label: __('Link'),
		primary_action: function() {
			let values = d.get_values();
			
			frm.add_child('related_policies', {
				policy: values.policy,
				relationship_type: values.relationship_type
			});
			
			frm.refresh_field('related_policies');
			frm.save();
			d.hide();
		}
	});
	
	d.show();
}

// ==================== Archive Function ====================

function archive_evidence_dialog(frm) {
	let d = new frappe.ui.Dialog({
		title: __('Archive Evidence'),
		fields: [
			{
				label: __('Archive Reason'),
				fieldname: 'reason',
				fieldtype: 'Small Text'
			}
		],
		primary_action_label: __('Archive'),
		primary_action: function() {
			let values = d.get_values();
			
			frappe.call({
				method: 'archive_evidence',
				doc: frm.doc,
				args: {
					reason: values.reason
				},
				callback: function(r) {
					frm.reload_doc();
					d.hide();
				}
			});
		}
	});
	
	d.show();
}

// ==================== Chain of Custody ====================

function view_custody_chain(frm) {
	frappe.call({
		method: 'get_custody_history',
		doc: frm.doc,
		callback: function(r) {
			if (r.message && r.message.length > 0) {
				let html = '<table class="table table-bordered table-sm"><thead><tr><th>Action</th><th>Performed By</th><th>Time</th><th>Notes</th></tr></thead><tbody>';
				
				r.message.forEach(function(entry) {
					html += `<tr>
						<td><strong>${entry.action}</strong></td>
						<td>${entry.performed_by}</td>
						<td>${entry.performed_at}</td>
						<td>${entry.notes || '-'}</td>
					</tr>`;
				});
				
				html += '</tbody></table>';
				
				let d = new frappe.ui.Dialog({
					title: __('Chain of Custody'),
					fields: [{
						fieldtype: 'HTML',
						options: html
					}],
					size: 'large'
				});
				
				d.show();
			} else {
				frappe.msgprint(__('No custody history available'));
			}
		}
	});
}

// ==================== UI Helper Functions ====================

function set_verification_fields(frm) {
	if (frm.doc.verification_status === 'Verified') {
		frm.set_df_property('verified_by', 'reqd', 1);
		frm.set_df_property('verification_method', 'reqd', 1);
	} else {
		frm.set_df_property('verified_by', 'reqd', 0);
		frm.set_df_property('verification_method', 'reqd', 0);
	}
}

function display_statistics(frm) {
	frappe.call({
		method: 'get_statistics',
		doc: frm.doc,
		callback: function(r) {
			if (r.message) {
				let stats = r.message;
				
				// Display in sidebar
				let html = `
					<div class="form-stats" style="padding: 15px; background: #f8f9fa; border-radius: 4px; margin: 10px 0;">
						<h6 style="margin-bottom: 10px; color: #555;">Evidence Statistics</h6>
						<table style="width: 100%; font-size: 12px;">
							<tr><td>Attachments:</td><td><strong>${stats.total_attachments}</strong></td></tr>
							<tr><td>Linked Messages:</td><td><strong>${stats.related_messages_count}</strong></td></tr>
							<tr><td>Linked Policies:</td><td><strong>${stats.related_policies_count}</strong></td></tr>
							<tr><td>Violations:</td><td><strong>${stats.related_violations_count}</strong></td></tr>
							<tr><td>Custody Entries:</td><td><strong>${stats.custody_entries_count}</strong></td></tr>
							<tr><td>Age:</td><td><strong>${stats.age_days} days</strong></td></tr>
							<tr><td>Revision:</td><td><strong>v${stats.revision_number}</strong></td></tr>
						</table>
					</div>
				`;
				
				frm.sidebar.append(html);
			}
		}
	});
}

function add_status_indicators(frm) {
	// Add visual indicators based on status
	if (frm.doc.status === 'Verified') {
		frm.dashboard.add_indicator(__('Verified'), 'green');
	} else if (frm.doc.status === 'Pending Verification') {
		frm.dashboard.add_indicator(__('Pending Verification'), 'orange');
	} else if (frm.doc.status === 'Rejected') {
		frm.dashboard.add_indicator(__('Rejected'), 'red');
	} else if (frm.doc.status === 'Expired') {
		frm.dashboard.add_indicator(__('Expired'), 'red');
	} else if (frm.doc.status === 'Archived') {
		frm.dashboard.add_indicator(__('Archived'), 'gray');
	}
	
	// Verification status indicator
	if (frm.doc.verification_status === 'Verified') {
		frm.dashboard.add_indicator(__('Verification: Verified'), 'green');
	} else if (frm.doc.verification_status === 'Failed') {
		frm.dashboard.add_indicator(__('Verification: Failed'), 'red');
	}
}

// ==================== NEW: FILE PREVIEW ====================

function preview_file(frm) {
if (!frm.doc.attachments || frm.doc.attachments.length === 0) {
t(__('No attachments to preview'));
;
}

// Get first attachment
let attachment = frm.doc.attachments[0];
let file_url = attachment.file_path;
let file_type = get_file_type(file_url);

let preview_html = generate_preview_html(file_url, file_type);

let d = new frappe.ui.Dialog({
Preview: ') + attachment.file_name,
pe: 'HTML',
s: preview_html
ction get_file_type(file_url) {
let ext = file_url.split('.').pop().toLowerCase();

if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
 'image';
} else if (ext === 'pdf') {
 'pdf';
} else if (['txt', 'json', 'xml', 'csv', 'log'].includes(ext)) {
 'text';
} else if (['mp4', 'webm', 'ogg'].includes(ext)) {
 'video';
} else if (['mp3', 'wav', 'ogg'].includes(ext)) {
 'audio';
}
return 'unknown';
}

function generate_preview_html(file_url, file_type) {
let html = '';

switch(file_type) {
= `
le="text-align: center; padding: 20px;">
style="max-width: 100%; max-height: 600px; border: 1px solid #ddd; border-radius: 4px;"/>
= `
le="height: 700px;">
style="width: 100%; height: 100%; border: none;"></iframe>
Load text content via AJAX
`
le="padding: 20px; background: #f5f5f5; border-radius: 4px; max-height: 600px; overflow-y: auto;">
tent" style="white-space: pre-wrap; word-wrap: break-word;">Loading...</pre>
(response => response.text())
(text => {
t.getElementById('text-preview-content').textContent = text;
{
t.getElementById('text-preview-content').textContent = 'Error loading file: ' + err;
= `
le="text-align: center; padding: 20px;">
trols style="max-width: 100%; max-height: 600px;">
type="video/mp4">
browser does not support the video tag.
= `
le="text-align: center; padding: 40px;">
trols style="width: 100%;">
type="audio/mpeg">
browser does not support the audio tag.
`
le="text-align: center; padding: 40px;">
le="font-size: 48px; color: #ccc; margin-bottom: 20px;">📄</div>
ot available for this file type</p>
target="_blank" class="btn btn-primary btn-sm">
fa-download"></i> Download File
 html;
}

// ==================== NEW: FILE UPLOAD ====================

function upload_evidence_file(frm) {
new frappe.ui.FileUploader({
frm.doctype,
ame: frm.docname,
'Home/Evidence',
_success: function(file) {
to attachments table
ts', {
ame: file.file_name,
file.file_size,
ow_datetime(),
frappe.session.user
ts');
uploaded successfully'),
dicator: 'green'
NEW: FILE DOWNLOAD ====================

function download_evidence_file(frm) {
if (!frm.doc.attachments || frm.doc.attachments.length === 0) {
t(__('No files to download'));
;
}

// If multiple files, show selection dialog
if (frm.doc.attachments.length > 1) {
= '<div class="file-list">';
ts.forEach(function(att, idx) {
`
style="padding: 10px; border-bottom: 1px solid #eee;">
download="${att.file_name}" class="btn btn-sm btn-default">
fa-download"></i> ${att.file_name}
 style="color: #888; margin-left: 10px;">${format_file_size(att.file_size || 0)}</span>
'</div>';
= new frappe.ui.Dialog({
load Files'),
pe: 'HTML',
s: files_html
{
load single file directly
= frm.doc.attachments[0].file_path;
dow.open(file_url, '_blank');
}
}

function format_file_size(bytes) {
if (bytes === 0) return '0 Bytes';

const k = 1024;
const sizes = ['Bytes', 'KB', 'MB', 'GB'];
const i = Math.floor(Math.log(bytes) / Math.log(k));

return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ==================== NEW: CHAIN VISUALIZATION ====================

function visualize_evidence_chain(frm) {
if (!frm.doc.evidence_chain) {
t(__('This evidence is not part of a chain'));
;
}

// Fetch chain data
frappe.call({
t.get',
pe: 'Evidence Chain',
ame: frm.doc.evidence_chain
ction(r) {
{
_visualization(r.message);
ction show_chain_visualization(chain_doc) {
let evidence_list = chain_doc.evidence_table || [];

// Build visualization HTML
let viz_html = `
-visualization" style="padding: 20px;">
-header" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
le="margin: 0 0 10px 0;">${chain_doc.chain_name}</h4>
le="display: flex; gap: 20px; font-size: 12px; color: #666;">
g>Type:</strong> ${chain_doc.chain_type}</div>
g>Status:</strong> <span class="badge" style="background: ${get_status_color(chain_doc.chain_status)};">${chain_doc.chain_status}</span></div>
g>Evidence Count:</strong> ${evidence_list.length}</div>
g>Integrity:</strong> <span class="badge" style="background: ${get_integrity_color(chain_doc.integrity_status)};">${chain_doc.integrity_status}</span></div>
-timeline" style="position: relative;">
`;

// Add evidence items
evidence_list.forEach(function(item, idx) {
t = item.evidence === frm.doc.name;
`
e-item ${is_current ? 'current-item' : ''}" style="
flex;
-items: center;
: 15px 0;
g: 15px;
d: ${is_current ? '#e3f2fd' : '#fff'};
solid ${is_current ? '#2196f3' : '#e0e0e0'};
: relative;
umber" style="
40px;
d: ${get_verification_color(item.verification_status)};
50%;
flex;
-items: center;
tent: center;
t-weight: bold;
-right: 15px;
uence_number}</div>
tent" style="flex: 1;">
le="font-weight: bold; margin-bottom: 5px;">
ce/${item.evidence}" target="_blank">${item.evidence}</a>
t ? '<span class="badge" style="background: #2196f3; margin-left: 10px;">Current</span>' : ''}
le="font-size: 12px; color: #666;">
><strong>Type:</strong> ${item.evidence_type || 'Unknown'}</span> | 
><strong>Relationship:</strong> ${item.relationship_type || 'N/A'}</span> | 
><strong>Status:</strong> ${item.verification_status}</span>
le="font-size: 11px; color: #999; margin-top: 5px;">
|| 'N/A'} by ${item.added_by || 'N/A'}
tegrity" style="text-align: right;">
tegrity_check ? 
le="color: #4caf50;"><i class="fa fa-check-circle"></i> Verified</div>' : 
le="color: #f44336;"><i class="fa fa-times-circle"></i> Failed</div>'
connector line (except for last item)
< evidence_list.length - 1) {
`
nector" style="
20px;
d: #ccc;
-left: 35px;
`
-footer" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
le="display: flex; gap: 20px; font-size: 12px;">
g>Master Hash:</strong> <code style="font-size: 10px;">${chain_doc.master_hash || 'Not calculated'}</code></div>
_doc.blockchain_enabled ? `
le="margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 4px;">
g>Blockchain:</strong> ${chain_doc.blockchain_network} | 
g>TX:</strong> <code style="font-size: 10px;">${chain_doc.blockchain_tx_hash || 'Pending'}</code>
''}
= new frappe.ui.Dialog({
ce Chain Visualization'),
pe: 'HTML',
s: viz_html
_action_label: __('Open Chain'),
: function() {
ce Chain', chain_doc.name);
ction get_status_color(status) {
const colors = {
'#2196f3',
'#ff9800',
valid': '#f44336'
};
return colors[status] || '#9e9e9e';
}

function get_integrity_color(status) {
const colors = {
tact': '#4caf50',
known': '#ff9800'
};
return colors[status] || '#9e9e9e';
}

function get_verification_color(status) {
const colors = {
ding': '#ff9800',
 colors[status] || '#9e9e9e';
}

// ==================== NEW: BLOCKCHAIN VERIFICATION ====================

function verify_blockchain_record(frm) {
if (!frm.doc.evidence_chain) {
t(__('This evidence is not part of a blockchain-enabled chain'));
;
}

frappe.call({
t.get',
pe: 'Evidence Chain',
ame: frm.doc.evidence_chain
ction(r) {
{
_verification(r.message);
ction show_blockchain_verification(chain_doc) {
if (!chain_doc.blockchain_enabled) {
t(__('Blockchain is not enabled for this chain'));
;
}

let blockchain_html = `
-verification" style="padding: 20px;">
-status" style="text-align: center; margin-bottom: 30px;">
_doc.blockchain_tx_hash ? `
le="font-size: 48px; color: #4caf50; margin-bottom: 15px;">
fa-check-circle"></i>
le="color: #4caf50;">Blockchain Verified</h4>
le="color: #666;">This evidence chain is recorded on the blockchain</p>
`
le="font-size: 48px; color: #ff9800; margin-bottom: 15px;">
fa-clock-o"></i>
le="color: #ff9800;">Pending Blockchain Recording</h4>
le="color: #666;">This chain has not been recorded on the blockchain yet</p>
-details" style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
table-bordered table-sm">
le="width: 40%;"><strong>Blockchain Network</strong></td>
_doc.blockchain_network || 'N/A'}</td>
g>Contract Address</strong></td>
le="font-size: 11px;">${chain_doc.blockchain_address || 'N/A'}</code></td>
g>Transaction Hash</strong></td>
le="font-size: 11px;">${chain_doc.blockchain_tx_hash || 'Not recorded yet'}</code></td>
g>Blockchain Timestamp</strong></td>
_doc.blockchain_timestamp || 'N/A'}</td>
g>Master Hash (Chain)</strong></td>
le="font-size: 11px;">${chain_doc.master_hash || 'N/A'}</code></td>
g>Evidence Hash</strong></td>
le="font-size: 11px;">${frm.doc.content_hash || 'N/A'}</code></td>
_doc.blockchain_tx_hash ? `
-explorer" style="margin-top: 20px; text-align: center;">
 class="btn btn-primary btn-sm" onclick="window.open(get_explorer_url('${chain_doc.blockchain_network}', '${chain_doc.blockchain_tx_hash}'), '_blank')">
fa-external-link"></i> View on Blockchain Explorer
>
`
-record" style="margin-top: 20px; text-align: center;">
le="color: #666;">Record this chain on the blockchain to enable verification</p>
= new frappe.ui.Dialog({
 Verification'),
pe: 'HTML',
s: blockchain_html
ction get_explorer_url(network, tx_hash) {
const explorers = {
.io/tx/${tx_hash}`,
': `https://polygonscan.com/tx/${tx_hash}`,
ance Smart Chain': `https://bscscan.com/tx/${tx_hash}`
};
return explorers[network] || '#';
}

// ==================== UPDATE CUSTOM BUTTONS ====================

// Override the original add_custom_buttons to add new buttons
const original_add_custom_buttons = add_custom_buttons;

add_custom_buttons = function(frm) {
// Call original function
original_add_custom_buttons(frm);

if (frm.is_new()) return;

// File Management Section
frm.add_custom_button(__('📤 Upload File'), function() {
ce_file(frm);
}, __('Files'));

frm.add_custom_button(__('📥 Download Files'), function() {
load_evidence_file(frm);
}, __('Files'));

frm.add_custom_button(__('👁️ Preview File'), function() {
Visualization Section
if (frm.doc.evidence_chain) {
(__('🔗 Visualize Chain'), function() {
ce_chain(frm);
'));
(__('⛓️ Verify Blockchain'), function() {
_record(frm);
'));
}
}

