/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: citation.js
*/

frappe.ui.form.on('Citation', {
    refresh: function(frm) {
        // Add custom buttons
        if (!frm.is_new()) {
            // Verify Source button
            if (frm.doc.source_url) {
                frm.add_custom_button(__('Verify Source'), function() {
                    frm.call({
                        method: 'verify_source',
                        doc: frm.doc,
                        callback: function(r) {
                            frm.reload_doc();
                        }
                    });
                }, __('Actions'));
            }

            // Generate Citation button
            frm.add_custom_button(__('Generate Citation'), function() {
                let d = new frappe.ui.Dialog({
                    title: __('Generate Citation Text'),
                    fields: [
                        {
                            label: __('Citation Format'),
                            fieldname: 'format_style',
                            fieldtype: 'Select',
                            options: ['APA', 'MLA', 'Chicago', 'Basic'],
                            default: 'APA',
                            reqd: 1
                        }
                    ],
                    primary_action_label: __('Generate'),
                    primary_action(values) {
                        frm.call({
                            method: 'generate_citation_text',
                            doc: frm.doc,
                            args: {
                                format_style: values.format_style
                            },
                            callback: function(r) {
                                if (r.message) {
                                    frappe.msgprint({
                                        title: __('Generated Citation'),
                                        message: r.message,
                                        indicator: 'blue'
                                    });
                                    
                                    // Copy to clipboard
                                    frappe.utils.copy_to_clipboard(r.message);
                                    frappe.show_alert({
                                        message: __('Citation copied to clipboard'),
                                        indicator: 'green'
                                    });
                                }
                            }
                        });
                        d.hide();
                    }
                });
                d.show();
            }, __('Actions'));

            // Show citation count for linked documents
            if (frm.doc.source_doctype && frm.doc.source_document) {
                frm.add_custom_button(__('View Source'), function() {
                    frappe.set_route('Form', frm.doc.source_doctype, frm.doc.source_document);
                }, __('Navigation'));
            }
        }

        // Set field indicators
        set_field_indicators(frm);
    },

    source_type: function(frm) {
        // Show relevant fields based on source type
        toggle_fields_by_source_type(frm);
    },

    source_url: function(frm) {
        // Validate URL format
        if (frm.doc.source_url && !frm.doc.source_url.startsWith('http')) {
            frappe.msgprint({
                title: __('Invalid URL'),
                message: __('URL should start with http:// or https://'),
                indicator: 'orange'
            });
        }
    },

    source_doctype: function(frm) {
        // Clear source_document when doctype changes
        if (frm.doc.source_document) {
            frm.set_value('source_document', '');
        }
    },

    onload: function(frm) {
        // Set queries for link fields
        set_link_queries(frm);
    }
});

// Helper function to set field indicators
function set_field_indicators(frm) {
    // Verification status indicator
    if (frm.doc.verification_status) {
        let indicator_color;
        switch (frm.doc.verification_status) {
            case 'Verified':
                indicator_color = 'green';
                break;
            case 'Unverified':
            case 'Needs Review':
                indicator_color = 'orange';
                break;
            case 'Broken Link':
                indicator_color = 'red';
                break;
            default:
                indicator_color = 'gray';
        }
        
        frm.page.set_indicator(
            __(frm.doc.verification_status),
            indicator_color
        );
    }

    // Accessibility indicator
    if (frm.doc.is_accessible) {
        frm.dashboard.add_indicator(
            __('Source is Accessible'),
            'green'
        );
    } else if (frm.doc.source_url) {
        frm.dashboard.add_indicator(
            __('Source Accessibility Unknown'),
            'orange'
        );
    }
}

// Helper function to toggle fields based on source type
function toggle_fields_by_source_type(frm) {
    const source_type = frm.doc.source_type;
    
    // Show/hide fields based on source type
    const show_academic_fields = ['Journal Article', 'Book'].includes(source_type);
    frm.toggle_display('isbn_issn', show_academic_fields);
    frm.toggle_display('doi', source_type === 'Journal Article');
    
    const show_legal_fields = ['Regulation', 'Legal Case'].includes(source_type);
    frm.toggle_display('section_reference', show_legal_fields);
}

// Helper function to set link field queries
function set_link_queries(frm) {
    // Filter verified_by to show only users
    frm.set_query('verified_by', function() {
        return {
            filters: {
                'enabled': 1
            }
        };
    });
}
