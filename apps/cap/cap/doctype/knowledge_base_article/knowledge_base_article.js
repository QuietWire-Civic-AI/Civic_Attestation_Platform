/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: knowledge_base_article.js
*/

frappe.ui.form.on('Knowledge Base Article', {
	refresh: function(frm) {
		setup_dashboard(frm);
		setup_action_buttons(frm);
		update_form_indicators(frm);
	},

	status: function(frm) {
		if (frm.doc.status === 'Published' && !frm.doc.published_date) {
			frm.set_value('published_date', frappe.datetime.now_date());
		}
	}
});

function setup_dashboard(frm) {
	if (!frm.doc.__islocal) {
		frm.dashboard.clear_headline();
		
		let stats_html = `
			<div class="kb-stats" style="display: flex; gap: 20px; padding: 10px; background: #f8f9fa; border-radius: 8px; margin-bottom: 15px;">
				<div style="flex: 1; text-align: center;">
					<div style="font-size: 24px; font-weight: bold; color: #2490ef;">${frm.doc.views || 0}</div>
					<div style="font-size: 12px; color: #6c757d;">Views</div>
				</div>
				<div style="flex: 1; text-align: center;">
					<div style="font-size: 24px; font-weight: bold; color: #10b981;">${frm.doc.helpful_count || 0}</div>
					<div style="font-size: 12px; color: #6c757d;">Helpful</div>
				</div>
				<div style="flex: 1; text-align: center;">
					<div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${frm.doc.ai_usage_count || 0}</div>
					<div style="font-size: 12px; color: #6c757d;">AI Usage</div>
				</div>
			</div>
		`;
		
		frm.dashboard.add_section(stats_html);
		
		if (frm.doc.is_public) {
			frm.dashboard.add_indicator(__('Public (Shared with AI)'), 'blue');
		}
	}
}

function setup_action_buttons(frm) {
	if (!frm.doc.__islocal) {
		if (frm.doc.status === 'Published') {
			frm.add_custom_button(__('View Article'), function() {
				show_article_preview(frm);
			});
		}
		
		if (frm.doc.is_public) {
			frm.add_custom_button(__('Make Private'), function() {
				frm.set_value('is_public', 0);
				frm.save();
			});
		} else {
			frm.add_custom_button(__('Make Public'), function() {
				frm.set_value('is_public', 1);
				frm.save();
			});
		}
	}
}

function update_form_indicators(frm) {
	if (!frm.doc.__islocal) {
		let indicator_map = {
			'Draft': 'gray',
			'Under Review': 'orange',
			'Published': 'green',
			'Archived': 'red'
		};
		
		frm.set_indicator_formatter('status', function(doc) {
			return indicator_map[doc.status] || 'gray';
		});
	}
}

function show_article_preview(frm) {
	let d = new frappe.ui.Dialog({
		title: frm.doc.title,
		fields: [
			{
				fieldtype: 'HTML',
				fieldname: 'preview',
				options: `
					<div style="padding: 20px;">
						<div style="margin-bottom: 15px;">
							<span class="badge" style="background: #2490ef; color: white;">${frm.doc.category}</span>
						</div>
						<div>${frm.doc.content || ''}</div>
						<div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0; color: #6c757d; font-size: 12px;">
							<strong>Tags:</strong> ${frm.doc.tags || 'N/A'}<br>
							<strong>Published:</strong> ${frm.doc.published_date || 'N/A'}
						</div>
					</div>
				`
			}
		]
	});
	
	d.show();
}
