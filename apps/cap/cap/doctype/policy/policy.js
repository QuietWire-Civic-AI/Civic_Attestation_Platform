/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

JavaScript file: policy.js
*/

frappe.ui.form.on("Policy", {
    refresh: function(frm) {
        // Set status indicator
        set_status_indicator(frm);
        
        // Add custom buttons based on status
        add_custom_buttons(frm);
        
        // Setup field dependencies
        setup_field_dependencies(frm);
        
        // Show statistics
        show_statistics(frm);
        
        // Setup auto-refresh for active policies
        if (frm.doc.status === "Active") {
            setup_auto_refresh(frm);
        }
    },
    
    onload: function(frm) {
        // Set default values for new documents
        if (frm.is_new()) {
            frm.set_value("status", "Draft");
            frm.set_value("version", "1.0");
            frm.set_value("enforcement_level", "Mandatory");
            frm.set_value("violation_action", "Review Required");
            frm.set_value("severity", "Medium");
        }
        
        // Setup queries for links
        setup_link_queries(frm);
    },
    
    status: function(frm) {
        set_status_indicator(frm);
        
        // Refresh buttons when status changes
        frm.trigger("refresh");
    },
    
    policy_type: function(frm) {
        // Set suggested defaults based on policy type
        if (frm.doc.policy_type === "Content Moderation") {
            frm.set_value("enforcement_level", "Mandatory");
            frm.set_value("violation_action", "Block Action");
            frm.set_value("severity", "High");
        } else if (frm.doc.policy_type === "Data Privacy") {
            frm.set_value("enforcement_level", "Critical");
            frm.set_value("violation_action", "Block Action");
            frm.set_value("severity", "Critical");
        }
    },
    
    is_active: function(frm) {
        // Sync is_active with status
        if (frm.doc.is_active && frm.doc.status === "Approved") {
            frm.set_value("status", "Active");
        } else if (!frm.doc.is_active && frm.doc.status === "Active") {
            frm.set_value("status", "Inactive");
        }
    },
    
    effective_from: function(frm) {
        // Auto-set effective_until if not set (default 1 year)
        if (frm.doc.effective_from && !frm.doc.effective_until) {
            let from_date = frappe.datetime.str_to_obj(frm.doc.effective_from);
            let until_date = frappe.datetime.add_months(from_date, 12);
            frm.set_value("effective_until", frappe.datetime.obj_to_str(until_date));
        }
    },
    
    supersedes_policy: function(frm) {
        // Load version from superseded policy
        if (frm.doc.supersedes_policy) {
            frappe.db.get_value("Policy", frm.doc.supersedes_policy, "version", (r) => {
                if (r && r.version) {
                    let current_version = parseFloat(r.version) || 1.0;
                    frm.set_value("version", (current_version + 0.1).toFixed(1));
                }
            });
        }
    }
});

// Helper Functions

function set_status_indicator(frm) {
    const status_colors = {
        "Draft": "gray",
        "Under Review": "orange",
        "Approved": "blue",
        "Active": "green",
        "Inactive": "red",
        "Archived": "darkgray",
        "Deprecated": "purple"
    };
    
    const color = status_colors[frm.doc.status] || "gray";
    frm.dashboard.set_headline_alert(
        `<div class="indicator ${color}">Status: ${frm.doc.status}</div>`
    );
    
    // Show active indicator
    if (frm.doc.is_active) {
        frm.dashboard.add_indicator(
            __("Currently Active"), 
            "green"
        );
    }
}

function add_custom_buttons(frm) {
    // Clear existing buttons
    frm.clear_custom_buttons();
    
    if (!frm.is_new()) {
        // Approve button (for Draft/Under Review)
        if (["Draft", "Under Review"].includes(frm.doc.status)) {
            frm.add_custom_button(__("Approve"), () => {
                frappe.call({
                    method: "cap.doctype.policy.policy.approve_policy",
                    args: {policy_name: frm.doc.name},
                    callback: (r) => {
                        if (r.message) {
                            frappe.msgprint(__("Policy approved successfully"));
                            frm.reload_doc();
                        }
                    }
                });
            }, __("Actions")).addClass("btn-primary");
        }
        
        // Activate button (for Approved/Inactive)
        if (["Approved", "Inactive"].includes(frm.doc.status)) {
            frm.add_custom_button(__("Activate"), () => {
                frappe.call({
                    method: "cap.doctype.policy.policy.activate_policy",
                    args: {policy_name: frm.doc.name},
                    callback: (r) => {
                        if (r.message) {
                            frappe.msgprint(__("Policy activated successfully"));
                            frm.reload_doc();
                        }
                    }
                });
            }, __("Actions")).addClass("btn-success");
        }
        
        // Deactivate button (for Active)
        if (frm.doc.status === "Active") {
            frm.add_custom_button(__("Deactivate"), () => {
                frappe.prompt(
                    {
                        fieldname: "reason",
                        fieldtype: "Small Text",
                        label: __("Reason for Deactivation"),
                        reqd: 0
                    },
                    (values) => {
                        frappe.call({
                            method: "cap.doctype.policy.policy.deactivate_policy",
                            args: {
                                policy_name: frm.doc.name,
                                reason: values.reason
                            },
                            callback: (r) => {
                                if (r.message) {
                                    frappe.msgprint(__("Policy deactivated successfully"));
                                    frm.reload_doc();
                                }
                            }
                        });
                    },
                    __("Deactivate Policy"),
                    __("Confirm")
                );
            }, __("Actions")).addClass("btn-warning");
        }
        
        // Archive button (for Inactive)
        if (frm.doc.status === "Inactive") {
            frm.add_custom_button(__("Archive"), () => {
                frappe.confirm(
                    __("Are you sure you want to archive this policy?"),
                    () => {
                        frm.set_value("status", "Archived");
                        frm.save();
                    }
                );
            }, __("Actions"));
        }
        
        // View Statistics button
        frm.add_custom_button(__("View Statistics"), () => {
            show_statistics_dialog(frm);
        }, __("Reports"));
        
        // View Violations button
        frm.add_custom_button(__("View Violations"), () => {
            frappe.set_route("List", "Message Violation", {policy: frm.doc.name});
        }, __("Reports"));
        
        // View Applications button
        frm.add_custom_button(__("View Applications"), () => {
            frappe.set_route("List", "Chat Session Policy", {policy_id: frm.doc.name});
        }, __("Reports"));
        
        // Clone Policy button
        frm.add_custom_button(__("Clone Policy"), () => {
            clone_policy(frm);
        }, __("Tools"));
        
        // Test Policy button (for Active policies)
        if (frm.doc.status === "Active") {
            frm.add_custom_button(__("Test Policy"), () => {
                test_policy_dialog(frm);
            }, __("Tools"));
        }
        
        // Export Configuration
        frm.add_custom_button(__("Export Config"), () => {
            export_policy_config(frm);
        }, __("Tools"));
    }
}

function setup_field_dependencies(frm) {
    // Show/hide fields based on other field values
    
    // Auto-activate/expire fields
    frm.toggle_display("auto_activate", frm.doc.effective_from);
    frm.toggle_display("auto_expire", frm.doc.effective_until);
    
    // Approval fields
    frm.toggle_display(["approved_by", "approval_date"], 
        frm.doc.status in ["Approved", "Active"]);
    
    // Related policy fields
    frm.toggle_display("superseded_by", frm.doc.superseded_by);
}

function show_statistics(frm) {
    if (!frm.is_new() && frm.doc.total_applications > 0) {
        const stats_html = `
            <div class="row">
                <div class="col-sm-4">
                    <div class="stat-card">
                        <h4>${frm.doc.total_applications || 0}</h4>
                        <p>Total Applications</p>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="stat-card">
                        <h4>${frm.doc.total_violations || 0}</h4>
                        <p>Total Violations</p>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="stat-card">
                        <h4>${(frm.doc.success_rate || 0).toFixed(1)}%</h4>
                        <p>Success Rate</p>
                    </div>
                </div>
            </div>
        `;
        
        frm.dashboard.add_section(stats_html, __("Policy Statistics"));
    }
}

function setup_auto_refresh(frm) {
    // Refresh statistics every 30 seconds for active policies
    if (frm.auto_refresh_interval) {
        clearInterval(frm.auto_refresh_interval);
    }
    
    frm.auto_refresh_interval = setInterval(() => {
        if (frm.doc.status === "Active" && !frm.is_dirty()) {
            frm.reload_doc();
        }
    }, 30000);
}

function setup_link_queries(frm) {
    // Filter parent_policy to exclude self and prevent circular references
    frm.set_query("parent_policy", () => {
        return {
            filters: {
                name: ["!=", frm.doc.name],
                tenant: frm.doc.tenant
            }
        };
    });
    
    // Filter supersedes_policy similarly
    frm.set_query("supersedes_policy", () => {
        return {
            filters: {
                name: ["!=", frm.doc.name],
                tenant: frm.doc.tenant,
                status: ["in", ["Active", "Inactive", "Deprecated"]]
            }
        };
    });
}

function show_statistics_dialog(frm) {
    frappe.call({
        method: "cap.doctype.policy.policy.get_policy_statistics",
        args: {policy_name: frm.doc.name},
        callback: (r) => {
            if (r.message) {
                const stats = r.message;
                const dialog = new frappe.ui.Dialog({
                    title: __("Policy Statistics"),
                    fields: [
                        {
                            fieldtype: "HTML",
                            options: `
                                <table class="table table-bordered">
                                    <tr><th>Metric</th><th>Value</th></tr>
                                    <tr><td>Total Applications</td><td>${stats.total_applications}</td></tr>
                                    <tr><td>Total Violations</td><td>${stats.total_violations}</td></tr>
                                    <tr><td>Success Rate</td><td>${stats.success_rate.toFixed(2)}%</td></tr>
                                    <tr><td>Last Triggered</td><td>${stats.last_triggered || "Never"}</td></tr>
                                    <tr><td>Status</td><td><span class="indicator ${stats.is_active ? 'green' : 'red'}">${stats.status}</span></td></tr>
                                </table>
                            `
                        }
                    ]
                });
                dialog.show();
            }
        }
    });
}

function clone_policy(frm) {
    frappe.prompt(
        [
            {
                fieldname: "new_name",
                fieldtype: "Data",
                label: __("New Policy Name"),
                reqd: 1
            },
            {
                fieldname: "copy_rules",
                fieldtype: "Check",
                label: __("Copy Policy Rules"),
                default: 1
            }
        ],
        (values) => {
            frappe.call({
                method: "frappe.client.clone_doc",
                args: {
                    doctype: "Policy",
                    name: frm.doc.name
                },
                callback: (r) => {
                    if (r.message) {
                        let new_doc = r.message;
                        new_doc.policy_name = values.new_name;
                        new_doc.status = "Draft";
                        new_doc.is_active = 0;
                        new_doc.supersedes_policy = frm.doc.name;
                        
                        frappe.set_route("Form", "Policy", new_doc.name);
                    }
                }
            });
        },
        __("Clone Policy"),
        __("Create")
    );
}

function test_policy_dialog(frm) {
    const dialog = new frappe.ui.Dialog({
        title: __("Test Policy"),
        fields: [
            {
                fieldname: "context",
                fieldtype: "JSON",
                label: __("Test Context (JSON)"),
                reqd: 1,
                default: JSON.stringify({
                    "user": frappe.session.user,
                    "tenant": frm.doc.tenant,
                    "session_type": "Interactive"
                }, null, 2)
            }
        ],
        primary_action_label: __("Test"),
        primary_action: (values) => {
            frappe.call({
                method: "cap.doctype.policy.policy.check_policy_applicability",
                args: {
                    policy_name: frm.doc.name,
                    context: values.context
                },
                callback: (r) => {
                    if (r.message) {
                        frappe.msgprint({
                            title: __("Test Result"),
                            message: `<pre>${JSON.stringify(r.message, null, 2)}</pre>`,
                            indicator: r.message.applicable ? "green" : "orange"
                        });
                    }
                }
            });
            dialog.hide();
        }
    });
    dialog.show();
}

function export_policy_config(frm) {
    const config = {
        policy_name: frm.doc.policy_name,
        policy_type: frm.doc.policy_type,
        enforcement_level: frm.doc.enforcement_level,
        violation_action: frm.doc.violation_action,
        severity: frm.doc.severity,
        config_json: frm.doc.config_json,
        threshold_settings: frm.doc.threshold_settings,
        custom_parameters: frm.doc.custom_parameters
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${frm.doc.policy_id}_config.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    frappe.show_alert({message: __("Configuration exported successfully"), indicator: "green"});
}
