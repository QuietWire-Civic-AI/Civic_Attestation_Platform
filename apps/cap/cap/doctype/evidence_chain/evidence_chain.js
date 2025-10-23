/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: evidence_chain.js
*/

frappe.ui.form.on('Evidence Chain', {
    // ============================================================
    // FORM REFRESH
    // ============================================================
    refresh: function(frm) {
        setup_dashboard_indicators(frm);
        setup_action_buttons(frm);
        setup_field_dependencies(frm);
        setup_realtime_listeners(frm);
        setup_field_formatting(frm);
    },

    // ============================================================
    // FIELD CHANGE HANDLERS
    // ============================================================
    blockchain_enabled: function(frm) {
        frm.trigger('toggle_blockchain_fields');
    },

    legal_hold: function(frm) {
        if (frm.doc.legal_hold && !frm.doc.legal_hold_reason) {
            frappe.msgprint({
                title: __('Legal Hold'),
                message: __('Please provide a reason for legal hold'),
                indicator: 'orange'
            });
        }
    },

    is_evidence_sealed: function(frm) {
        if (frm.doc.is_evidence_sealed) {
            frappe.msgprint({
                title: __('Chain Sealed'),
                message: __('This chain is now immutable. No modifications allowed.'),
                indicator: 'red'
            });
        }
    },

    chain_status: function(frm) {
        frm.trigger('update_status_indicator');
    },

    integrity_status: function(frm) {
        if (frm.doc.integrity_status === 'Compromised') {
            frappe.show_alert({
                message: __('Warning: Chain integrity compromised!'),
                indicator: 'red'
            }, 10);
        }
    },

    // ============================================================
    // HELPER METHODS
    // ============================================================
    toggle_blockchain_fields: function(frm) {
        frm.toggle_display(['blockchain_network', 'blockchain_address', 'blockchain_tx_hash', 'blockchain_timestamp'],
            frm.doc.blockchain_enabled);
    },

    update_status_indicator: function(frm) {
        // Update dashboard based on status
        frm.trigger('refresh');
    }
});

// ============================================================
// DASHBOARD INDICATORS
// ============================================================
function setup_dashboard_indicators(frm) {
    if (!frm.doc.__islocal) {
        // Clear existing indicators
        frm.dashboard.clear_headline();

        // Chain Status Indicator
        let status_color = get_status_color(frm.doc.chain_status);
        frm.dashboard.add_indicator(__('Chain Status: {0}', [frm.doc.chain_status || 'Unknown']), status_color);

        // Integrity Status Indicator
        let integrity_color = frm.doc.integrity_status === 'Intact' ? 'green' : 
                             frm.doc.integrity_status === 'Compromised' ? 'red' : 'orange';
        frm.dashboard.add_indicator(__('Integrity: {0} ({1}%)', 
            [frm.doc.integrity_status || 'Unknown', frm.doc.integrity_score || 0]), integrity_color);

        // Evidence Count Indicator
        frm.dashboard.add_indicator(__('Evidence: {0} items', [frm.doc.total_evidence_count || 0]), 'blue');

        // Verification Success Rate
        let success_rate = frm.doc.verification_success_rate || 0;
        let rate_color = success_rate >= 95 ? 'green' : success_rate >= 80 ? 'orange' : 'red';
        frm.dashboard.add_indicator(__('Verification Rate: {0}%', [success_rate.toFixed(1)]), rate_color);

        // Blockchain Status
        if (frm.doc.blockchain_enabled && frm.doc.blockchain_tx_hash) {
            frm.dashboard.add_indicator(__('Blockchain: Recorded'), 'cyan');
        }

        // Legal Hold Badge
        if (frm.doc.legal_hold) {
            frm.dashboard.add_indicator(__('Legal Hold Active'), 'red');
        }

        // Sealed Badge
        if (frm.doc.is_evidence_sealed) {
            frm.dashboard.add_indicator(__('Chain Sealed (Immutable)'), 'purple');
        }

        // Critical Chain Badge
        if (frm.doc.is_critical) {
            frm.dashboard.add_indicator(__('Critical Chain'), 'red');
        }
    }
}

function get_status_color(status) {
    const color_map = {
        'Active': 'blue',
        'Under Review': 'orange',
        'Verified': 'green',
        'Closed': 'gray',
        'Disputed': 'red',
        'Invalid': 'red',
        'Archived': 'gray'
    };
    return color_map[status] || 'gray';
}

// ============================================================
// ACTION BUTTONS
// ============================================================
function setup_action_buttons(frm) {
    if (frm.doc.__islocal) return;

    // Clear existing custom buttons
    frm.clear_custom_buttons();

    // === Evidence Management Group ===
    frm.add_custom_button(__('Add Evidence'), function() {
        show_add_evidence_dialog(frm);
    }, __('Evidence'));

    frm.add_custom_button(__('Verify All Evidence'), function() {
        verify_all_evidence(frm);
    }, __('Evidence'));

    // === Verification Group ===
    frm.add_custom_button(__('Verify Chain Integrity'), function() {
        verify_chain_integrity(frm);
    }, __('Verification'));

    frm.add_custom_button(__('Integrity Check Report'), function() {
        show_integrity_report(frm);
    }, __('Verification'));

    // === Blockchain Group ===
    if (frm.doc.blockchain_enabled) {
        frm.add_custom_button(__('Record on Blockchain'), function() {
            record_on_blockchain(frm);
        }, __('Blockchain'));

        if (frm.doc.blockchain_tx_hash) {
            frm.add_custom_button(__('Verify Blockchain Record'), function() {
                verify_blockchain_record(frm);
            }, __('Blockchain'));

            frm.add_custom_button(__('View Blockchain Proof'), function() {
                show_blockchain_proof(frm);
            }, __('Blockchain'));
        }
    }

    // === Chain Operations Group ===
    if (!frm.doc.is_evidence_sealed) {
        frm.add_custom_button(__('Seal Chain'), function() {
            seal_chain(frm);
        }, __('Chain Operations'));
    } else {
        frm.add_custom_button(__('Unseal Chain'), function() {
            unseal_chain(frm);
        }, __('Chain Operations'));
    }

    frm.add_custom_button(__('Transfer Custody'), function() {
        show_transfer_custody_dialog(frm);
    }, __('Chain Operations'));

    // === Reporting Group ===
    frm.add_custom_button(__('Chain Report'), function() {
        show_chain_report(frm);
    }, __('Reports'));

    frm.add_custom_button(__('Export Chain'), function() {
        export_chain(frm);
    }, __('Reports'));

    frm.add_custom_button(__('Custody Timeline'), function() {
        show_custody_timeline(frm);
    }, __('Reports'));

    frm.add_custom_button(__('Evidence Graph'), function() {
        show_evidence_graph(frm);
    }, __('Reports'));

    // === Review Operations ===
    if (frm.doc.requires_review) {
        if (frm.doc.review_status === 'Pending' || frm.doc.review_status === 'In Progress') {
            frm.add_custom_button(__('Submit Review'), function() {
                show_review_dialog(frm);
            }, __('Review'));

            frm.add_custom_button(__('Approve Chain'), function() {
                approve_chain(frm);
            }, __('Review'));

            frm.add_custom_button(__('Reject Chain'), function() {
                reject_chain(frm);
            }, __('Review'));
        }
    }
}

// ============================================================
// EVIDENCE MANAGEMENT
// ============================================================
function show_add_evidence_dialog(frm) {
    let d = new frappe.ui.Dialog({
        title: __('Add Evidence to Chain'),
        fields: [
            {
                fieldtype: 'Link',
                fieldname: 'evidence',
                label: __('Evidence'),
                options: 'Evidence',
                reqd: 1
            },
            {
                fieldtype: 'Select',
                fieldname: 'relationship_type',
                label: __('Relationship Type'),
                options: 'Parent\nChild\nRelated\nSupporting\nContradicting\nReference',
                default: 'Related',
                reqd: 1
            },
            {
                fieldtype: 'Small Text',
                fieldname: 'notes',
                label: __('Notes')
            }
        ],
        primary_action_label: __('Add Evidence'),
        primary_action: function(values) {
            frappe.call({
                method: 'add_evidence',
                doc: frm.doc,
                args: {
                    evidence_id: values.evidence,
                    relationship_type: values.relationship_type,
                    notes: values.notes
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

function verify_all_evidence(frm) {
    frappe.confirm(
        __('Verify all evidence items in this chain?'),
        function() {
            frappe.call({
                method: 'perform_automated_verification',
                doc: frm.doc,
                callback: function(r) {
                    if (r.message) {
                        frappe.msgprint({
                            title: __('Verification Complete'),
                            message: __('Chain integrity: {0}', [r.message ? 'Intact' : 'Compromised']),
                            indicator: r.message ? 'green' : 'red'
                        });
                        frm.reload_doc();
                    }
                }
            });
        }
    );
}

// ============================================================
// VERIFICATION OPERATIONS
// ============================================================
function verify_chain_integrity(frm) {
    frappe.show_alert({message: __('Verifying chain integrity...'), indicator: 'blue'});

    frappe.call({
        method: 'cap.doctype.evidence_chain.evidence_chain.verify_chain',
        args: {
            chain_name: frm.doc.name
        },
        callback: function(r) {
            if (r.message) {
                let result = r.message;
                let d = new frappe.ui.Dialog({
                    title: __('Chain Integrity Verification'),
                    fields: [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'result_html',
                            options: `
                                <div style="padding: 20px;">
                                    <h3 style="color: ${result.intact ? 'green' : 'red'};">
                                        ${result.intact ? '✅ Chain Intact' : '❌ Chain Compromised'}
                                    </h3>
                                    <table class="table table-bordered" style="margin-top: 20px;">
                                        <tr>
                                            <th>Status</th>
                                            <td><strong>${result.status}</strong></td>
                                        </tr>
                                        <tr>
                                            <th>Integrity Score</th>
                                            <td>${result.score}%</td>
                                        </tr>
                                        <tr>
                                            <th>Total Evidence</th>
                                            <td>${frm.doc.total_evidence_count || 0}</td>
                                        </tr>
                                        <tr>
                                            <th>Verified Evidence</th>
                                            <td>${frm.doc.verified_evidence_count || 0}</td>
                                        </tr>
                                        <tr>
                                            <th>Failed Verification</th>
                                            <td>${frm.doc.failed_verification_count || 0}</td>
                                        </tr>
                                    </table>
                                </div>
                            `
                        }
                    ]
                });
                d.show();
                frm.reload_doc();
            }
        }
    });
}

function show_integrity_report(frm) {
    let html = '<div style="padding: 20px;">';
    html += '<h3>Evidence Integrity Report</h3>';
    html += '<table class="table table-bordered" style="margin-top: 15px;">';
    html += '<thead><tr><th>#</th><th>Evidence</th><th>Type</th><th>Verification</th><th>Integrity</th></tr></thead>';
    html += '<tbody>';

    (frm.doc.evidence_table || []).forEach((item, idx) => {
        let status_color = item.verification_status === 'Verified' ? 'green' : 
                          item.verification_status === 'Failed' ? 'red' : 'orange';
        let integrity_icon = item.integrity_check ? '✅' : '❌';

        html += `<tr>
            <td>${idx + 1}</td>
            <td>${item.evidence}</td>
            <td>${item.evidence_type || 'Unknown'}</td>
            <td><span style="color: ${status_color};">${item.verification_status || 'Pending'}</span></td>
            <td>${integrity_icon}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';

    let d = new frappe.ui.Dialog({
        title: __('Integrity Report'),
        fields: [
            {
                fieldtype: 'HTML',
                fieldname: 'report_html',
                options: html
            }
        ],
        size: 'large'
    });
    d.show();
}

// ============================================================
// BLOCKCHAIN OPERATIONS
// ============================================================
function record_on_blockchain(frm) {
    frappe.confirm(
        __('Record this chain on {0} blockchain?', [frm.doc.blockchain_network]),
        function() {
            frappe.call({
                method: 'cap.doctype.evidence_chain.evidence_chain.record_chain_on_blockchain',
                args: {
                    chain_name: frm.doc.name
                },
                callback: function(r) {
                    if (r.message && r.message.success) {
                        frappe.msgprint({
                            title: __('Blockchain Recording Successful'),
                            message: __('Transaction Hash: {0}', [r.message.tx_hash]),
                            indicator: 'green'
                        });
                        frm.reload_doc();
                    }
                }
            });
        }
    );
}

function verify_blockchain_record(frm) {
    frappe.call({
        method: 'verify_blockchain_record',
        doc: frm.doc,
        callback: function(r) {
            frappe.msgprint({
                title: __('Blockchain Verification'),
                message: r.message ? __('Record verified on blockchain') : __('Verification failed'),
                indicator: r.message ? 'green' : 'red'
            });
        }
    });
}

function show_blockchain_proof(frm) {
    frappe.call({
        method: 'get_blockchain_proof',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                let proof = r.message;
                let d = new frappe.ui.Dialog({
                    title: __('Blockchain Proof of Existence'),
                    fields: [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'proof_html',
                            options: `
                                <div style="padding: 20px; font-family: monospace;">
                                    <h4>🔗 Blockchain Proof</h4>
                                    <table class="table table-bordered" style="margin-top: 15px;">
                                        <tr><th>Chain ID</th><td>${proof.chain_id}</td></tr>
                                        <tr><th>Network</th><td>${proof.network}</td></tr>
                                        <tr><th>Transaction Hash</th><td style="word-break: break-all;">${proof.tx_hash}</td></tr>
                                        <tr><th>Contract Address</th><td style="word-break: break-all;">${proof.contract_address}</td></tr>
                                        <tr><th>Timestamp</th><td>${proof.timestamp}</td></tr>
                                        <tr><th>Master Hash</th><td style="word-break: break-all;">${proof.master_hash}</td></tr>
                                    </table>
                                    <p style="margin-top: 15px; color: green;">
                                        ✅ This chain has been cryptographically recorded on the blockchain.
                                    </p>
                                </div>
                            `
                        }
                    ],
                    size: 'large'
                });
                d.show();
            }
        }
    });
}

// ============================================================
// CHAIN OPERATIONS
// ============================================================
function seal_chain(frm) {
    frappe.confirm(
        __('Seal this chain? Once sealed, the chain becomes immutable and cannot be modified.'),
        function() {
            frappe.call({
                method: 'cap.doctype.evidence_chain.evidence_chain.seal_evidence_chain',
                args: {
                    chain_name: frm.doc.name
                },
                callback: function(r) {
                    if (r.message && r.message.success) {
                        frappe.msgprint({
                            title: __('Chain Sealed'),
                            message: __('Chain is now immutable'),
                            indicator: 'green'
                        });
                        frm.reload_doc();
                    }
                }
            });
        }
    );
}

function unseal_chain(frm) {
    let d = new frappe.ui.Dialog({
        title: __('Unseal Evidence Chain'),
        fields: [
            {
                fieldtype: 'Small Text',
                fieldname: 'reason',
                label: __('Reason for Unsealing'),
                reqd: 1
            },
            {
                fieldtype: 'Link',
                fieldname: 'authorized_by',
                label: __('Authorized By'),
                options: 'User'
            }
        ],
        primary_action_label: __('Unseal'),
        primary_action: function(values) {
            frappe.call({
                method: 'unseal_chain',
                doc: frm.doc,
                args: {
                    reason: values.reason,
                    authorized_by: values.authorized_by
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

function show_transfer_custody_dialog(frm) {
    let d = new frappe.ui.Dialog({
        title: __('Transfer Chain Custody'),
        fields: [
            {
                fieldtype: 'Link',
                fieldname: 'new_custodian',
                label: __('New Custodian'),
                options: 'User',
                reqd: 1
            },
            {
                fieldtype: 'Link',
                fieldname: 'witness',
                label: __('Witness'),
                options: 'User'
            },
            {
                fieldtype: 'Small Text',
                fieldname: 'notes',
                label: __('Transfer Notes')
            }
        ],
        primary_action_label: __('Transfer Custody'),
        primary_action: function(values) {
            frappe.call({
                method: 'cap.doctype.evidence_chain.evidence_chain.transfer_chain_custody',
                args: {
                    chain_name: frm.doc.name,
                    new_custodian: values.new_custodian,
                    notes: values.notes,
                    witness: values.witness
                },
                callback: function(r) {
                    if (r.message && r.message.success) {
                        frappe.msgprint({
                            title: __('Custody Transferred'),
                            message: r.message.message,
                            indicator: 'green'
                        });
                        frm.reload_doc();
                        d.hide();
                    }
                }
            });
        }
    });
    d.show();
}

// ============================================================
// REPORTING
// ============================================================
function show_chain_report(frm) {
    frappe.call({
        method: 'cap.doctype.evidence_chain.evidence_chain.get_chain_report',
        args: {
            chain_name: frm.doc.name
        },
        callback: function(r) {
            if (r.message) {
                let report = r.message;
                let html = generate_report_html(report);

                let d = new frappe.ui.Dialog({
                    title: __('Evidence Chain Report'),
                    fields: [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'report_html',
                            options: html
                        }
                    ],
                    size: 'extra-large',
                    primary_action_label: __('Download PDF'),
                    primary_action: function() {
                        // TODO: Implement PDF generation
                        frappe.msgprint(__('PDF generation coming soon'));
                    }
                });
                d.show();
            }
        }
    });
}

function generate_report_html(report) {
    let html = '<div style="padding: 20px;">';

    // Chain Info
    html += '<h2>📋 Chain Information</h2>';
    html += '<table class="table table-bordered">';
    html += `<tr><th>Chain ID</th><td>${report.chain_info.chain_id}</td></tr>`;
    html += `<tr><th>Name</th><td>${report.chain_info.chain_name}</td></tr>`;
    html += `<tr><th>Type</th><td>${report.chain_info.chain_type}</td></tr>`;
    html += `<tr><th>Status</th><td>${report.chain_info.chain_status}</td></tr>`;
    html += `<tr><th>Created</th><td>${report.chain_info.created_at}</td></tr>`;
    html += `<tr><th>Created By</th><td>${report.chain_info.created_by}</td></tr>`;
    html += `<tr><th>Critical</th><td>${report.chain_info.is_critical ? 'Yes' : 'No'}</td></tr>`;
    html += `<tr><th>Sealed</th><td>${report.chain_info.is_sealed ? 'Yes' : 'No'}</td></tr>`;
    html += '</table>';

    // Statistics
    html += '<h2 style="margin-top: 30px;">📊 Statistics</h2>';
    html += '<table class="table table-bordered">';
    html += `<tr><th>Total Evidence</th><td>${report.statistics.total_evidence}</td></tr>`;
    html += `<tr><th>Verified Evidence</th><td>${report.statistics.verified_evidence}</td></tr>`;
    html += `<tr><th>Verification Rate</th><td>${report.statistics.verification_success_rate}%</td></tr>`;
    html += `<tr><th>Integrity Status</th><td>${report.statistics.integrity_status}</td></tr>`;
    html += `<tr><th>Integrity Score</th><td>${report.statistics.integrity_score}%</td></tr>`;
    html += `<tr><th>Access Count</th><td>${report.statistics.access_count}</td></tr>`;
    html += '</table>';

    // Integrity
    html += '<h2 style="margin-top: 30px;">🔒 Integrity & Verification</h2>';
    html += '<table class="table table-bordered">';
    html += `<tr><th>Master Hash</th><td style="font-family: monospace; word-break: break-all;">${report.integrity.master_hash}</td></tr>`;
    html += `<tr><th>Last Check</th><td>${report.integrity.last_check}</td></tr>`;
    html += `<tr><th>Verification Count</th><td>${report.integrity.verification_count}</td></tr>`;
    html += `<tr><th>Blockchain</th><td>${report.integrity.blockchain_enabled ? 'Enabled' : 'Disabled'}</td></tr>`;
    if (report.integrity.blockchain_tx) {
        html += `<tr><th>Blockchain TX</th><td style="font-family: monospace; word-break: break-all;">${report.integrity.blockchain_tx}</td></tr>`;
    }
    html += '</table>';

    // Custody
    html += '<h2 style="margin-top: 30px;">👤 Custody Information</h2>';
    html += '<table class="table table-bordered">';
    html += `<tr><th>Custody Events</th><td>${report.custody.events_count}</td></tr>`;
    html += `<tr><th>Custodian Changes</th><td>${report.custody.custodian_changes}</td></tr>`;
    html += '</table>';

    // Compliance
    html += '<h2 style="margin-top: 30px;">⚖️ Compliance</h2>';
    html += '<table class="table table-bordered">';
    html += `<tr><th>Frameworks</th><td>${report.compliance.frameworks || 'None'}</td></tr>`;
    html += `<tr><th>Legal Hold</th><td>${report.compliance.legal_hold ? 'Yes' : 'No'}</td></tr>`;
    html += `<tr><th>Data Classification</th><td>${report.compliance.data_classification || 'Not Set'}</td></tr>`;
    html += '</table>';

    html += '</div>';
    return html;
}

function export_chain(frm) {
    frappe.call({
        method: 'export_chain_to_json',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                // Download JSON file
                let blob = new Blob([r.message], {type: 'application/json'});
                let url = URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = `evidence_chain_${frm.doc.name}.json`;
                a.click();

                frappe.msgprint(__('Chain exported successfully'));
            }
        }
    });
}

function show_custody_timeline(frm) {
    frappe.call({
        method: 'get_custody_history',
        doc: frm.doc,
        callback: function(r) {
            if (r.message) {
                let timeline = r.message;
                let html = '<div style="padding: 20px;">';
                html += '<h3>📅 Custody Timeline</h3>';
                html += '<div class="timeline" style="margin-top: 20px;">';

                timeline.forEach(event => {
                    let event_icon = get_event_icon(event.event);
                    html += `
                        <div style="padding: 15px; margin-bottom: 15px; border-left: 4px solid #667eea; background: #f8f9fa;">
                            <div style="font-weight: bold;">${event_icon} ${event.event}</div>
                            <div style="color: #6c757d; font-size: 12px; margin-top: 5px;">${event.timestamp}</div>
                            <div style="margin-top: 8px;">
                                <strong>Custodian:</strong> ${event.custodian}<br>
                                ${event.previous ? `<strong>Previous:</strong> ${event.previous}<br>` : ''}
                                <strong>Action:</strong> ${event.action}
                            </div>
                        </div>
                    `;
                });

                html += '</div></div>';

                let d = new frappe.ui.Dialog({
                    title: __('Custody Timeline'),
                    fields: [
                        {
                            fieldtype: 'HTML',
                            fieldname: 'timeline_html',
                            options: html
                        }
                    ],
                    size: 'large'
                });
                d.show();
            }
        }
    });
}

function get_event_icon(event_type) {
    const icons = {
        'Created': '🆕',
        'Modified': '✏️',
        'Accessed': '👁️',
        'Transferred': '🔄',
        'Verified': '✅',
        'Sealed': '🔒',
        'Unsealed': '🔓'
    };
    return icons[event_type] || '📌';
}

function show_evidence_graph(frm) {
    // Placeholder for evidence graph visualization
    frappe.msgprint({
        title: __('Evidence Graph'),
        message: __('Graph visualization feature coming soon. This will show a visual network of evidence relationships.'),
        indicator: 'blue'
    });
}

// ============================================================
// REVIEW OPERATIONS
// ============================================================
function show_review_dialog(frm) {
    let d = new frappe.ui.Dialog({
        title: __('Submit Chain Review'),
        fields: [
            {
                fieldtype: 'Select',
                fieldname: 'status',
                label: __('Review Status'),
                options: 'Pending\nIn Progress\nApproved\nRejected\nNeeds Revision',
                default: 'Approved',
                reqd: 1
            },
            {
                fieldtype: 'Int',
                fieldname: 'score',
                label: __('Review Score (1-10)'),
                default: 7
            },
            {
                fieldtype: 'Text Editor',
                fieldname: 'notes',
                label: __('Review Notes'),
                reqd: 1
            }
        ],
        primary_action_label: __('Submit Review'),
        primary_action: function(values) {
            frappe.call({
                method: 'submit_review',
                doc: frm.doc,
                args: {
                    reviewer: frappe.session.user,
                    status: values.status,
                    notes: values.notes,
                    score: values.score
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

function approve_chain(frm) {
    frappe.confirm(
        __('Approve this evidence chain?'),
        function() {
            frappe.call({
                method: 'approve_chain',
                doc: frm.doc,
                callback: function(r) {
                    frm.reload_doc();
                }
            });
        }
    );
}

function reject_chain(frm) {
    let d = new frappe.ui.Dialog({
        title: __('Reject Evidence Chain'),
        fields: [
            {
                fieldtype: 'Small Text',
                fieldname: 'reason',
                label: __('Rejection Reason'),
                reqd: 1
            }
        ],
        primary_action_label: __('Reject'),
        primary_action: function(values) {
            frappe.call({
                method: 'reject_chain',
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

// ============================================================
// FIELD DEPENDENCIES
// ============================================================
function setup_field_dependencies(frm) {
    // Show/hide fields based on conditions
    frm.toggle_display('blockchain_network', frm.doc.blockchain_enabled);
    frm.toggle_display('blockchain_address', frm.doc.blockchain_enabled && frm.doc.blockchain_address);
    frm.toggle_display('blockchain_tx_hash', frm.doc.blockchain_enabled && frm.doc.blockchain_tx_hash);
    frm.toggle_display('blockchain_timestamp', frm.doc.blockchain_enabled && frm.doc.blockchain_timestamp);

    frm.toggle_display('legal_hold_date', frm.doc.legal_hold);
    frm.toggle_display('legal_hold_reason', frm.doc.legal_hold);

    frm.toggle_display('seal_date', frm.doc.is_evidence_sealed);

    frm.toggle_display('review_status', frm.doc.requires_review);
    frm.toggle_display('assigned_reviewer', frm.doc.requires_review);
    frm.toggle_display('review_deadline', frm.doc.requires_review);
}

// ============================================================
// FIELD FORMATTING
// ============================================================
function setup_field_formatting(frm) {
    // Format master hash field
    if (frm.doc.master_hash) {
        frm.fields_dict.master_hash.$input.css('font-family', 'monospace');
        frm.fields_dict.master_hash.$input.css('font-size', '11px');
    }

    // Format blockchain fields
    if (frm.doc.blockchain_tx_hash) {
        frm.fields_dict.blockchain_tx_hash.$input.css('font-family', 'monospace');
        frm.fields_dict.blockchain_tx_hash.$input.css('font-size', '11px');
    }

    if (frm.doc.blockchain_address) {
        frm.fields_dict.blockchain_address.$input.css('font-family', 'monospace');
        frm.fields_dict.blockchain_address.$input.css('font-size', '11px');
    }

    // Highlight critical chain
    if (frm.doc.is_critical) {
        frm.dashboard.set_headline_alert(__('This is a critical evidence chain'), 'red');
    }

    // Highlight sealed chain
    if (frm.doc.is_evidence_sealed) {
        frm.dashboard.set_headline_alert(__('Chain is sealed - No modifications allowed'), 'purple');
    }

    // Highlight legal hold
    if (frm.doc.legal_hold) {
        frm.dashboard.set_headline_alert(__('Chain is under legal hold - Cannot be deleted'), 'red');
    }
}

// ============================================================
// REALTIME LISTENERS
// ============================================================
function setup_realtime_listeners(frm) {
    // Listen for integrity alerts
    frappe.realtime.on('integrity_alert', function(data) {
        if (data.chain_name === frm.doc.name) {
            frappe.show_alert({
                message: __('Integrity Alert: {0}', [data.message]),
                indicator: 'red'
            }, 15);
            frm.reload_doc();
        }
    });

    // Listen for access alerts
    frappe.realtime.on('chain_access_alert', function(data) {
        if (data.chain_name === frm.doc.name) {
            frappe.show_alert({
                message: __('Chain accessed by: {0}', [data.user]),
                indicator: 'blue'
            }, 5);
        }
    });
}
