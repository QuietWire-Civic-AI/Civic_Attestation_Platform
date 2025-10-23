/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

CAP Common JavaScript Functions
Shared functions across the CAP platform
*/

// Global CAP namespace
window.cap = window.cap || {};

// ====================
// Multi-tenant utilities
// ====================

cap.tenant = {
    // Get current tenant from boot info
    getCurrentTenant: function() {
        return frappe.boot.tenant_id || null;
    },
    
    // Check if user is tenant admin
    isTenantAdmin: function() {
        if (!frappe.user.has_role('System Manager')) {
            const tenant = this.getCurrentTenant();
            return tenant && frappe.user.has_role(`CAP Admin - ${tenant}`);
        }
        return true;
    },
    
    // Apply tenant filter to form
    applyTenantFilter: function(frm) {
        const tenant_id = this.getCurrentTenant();
        if (tenant_id && frm.doctype !== 'Tenant') {
            // Add filter for linked tenant fields
            frm.set_query('tenant', function() {
                return {
                    filters: [['Tenant', 'name', '=', tenant_id]]
                };
            });
        }
    }
};

// ====================
// Realtime event handlers
// ====================

cap.realtime = {
    init: function() {
        // Listen for ledger events
        frappe.realtime.on('ledger_event', function(data) {
            cap.realtime.handleLedgerEvent(data);
        });
        
        // Listen for new messages
        frappe.realtime.on('new_message', function(data) {
            cap.realtime.handleNewMessage(data);
        });
        
        // Listen for violation alerts
        frappe.realtime.on('violation_alert', function(data) {
            cap.realtime.handleViolationAlert(data);
        });
    },
    
    handleLedgerEvent: function(data) {
        // Show notification for important events
        const importantEvents = [
            'policy_published', 'evidence_added', 
            'violation_detected', 'system_backup'
        ];
        
        if (importantEvents.includes(data.event_type)) {
            frappe.show_alert({
                message: __('New audit event: {0}', [__(data.event_type)]),
                indicator: 'blue'
            });
        }
        
        // Update any open audit dashboards
        this.refreshAuditViews();
    },
    
    handleNewMessage: function(data) {
        // Update chat interface if open
        if (cur_frm && cur_frm.doctype === 'Chat Session' && 
            cur_frm.doc.session_id === data.session_id) {
            cap.chat.appendMessage(data);
        }
        
        // Play notification sound
        cap.audio.playNotification('new-message');
    },
    
    handleViolationAlert: function(data) {
        // High priority alert
        frappe.show_alert({
            message: __('Compliance violation detected: {0}', [data.violation_type]),
            indicator: 'red'
        });
        
        // Play alert sound
        cap.audio.playNotification('violation-alert');
        
        // Show desktop notification if supported
        if (Notification.permission === 'granted') {
            new Notification('CAP Compliance Alert', {
                body: data.violation_type,
                icon: '/assets/cap/images/alert-icon.png'
            });
        }
    },
    
    refreshAuditViews: function() {
        // Refresh any open audit-related views
        const auditViews = [
            'Ledger Event', 'Violation', 'Compliance Dashboard'
        ];
        
        auditViews.forEach(function(view) {
            if (cur_list && cur_list.doctype === view) {
                cur_list.refresh();
            }
        });
    }
};

// ====================
// Audio notifications
// ====================

cap.audio = {
    sounds: {
        'new-message': '/assets/cap/audio/new_message.mp3',
        'violation-alert': '/assets/cap/audio/alert.mp3'
    },
    
    playNotification: function(soundName) {
        try {
            const soundUrl = this.sounds[soundName];
            if (soundUrl) {
                const audio = new Audio(soundUrl);
                audio.volume = 0.5;
                audio.play().catch(function(error) {
                    console.log('Audio play failed:', error);
                });
            }
        } catch (error) {
            console.log('Audio notification error:', error);
        }
    }
};

// ====================
// Chat utilities
// ====================

cap.chat = {
    appendMessage: function(messageData) {
        const chatArea = $('.chat-messages');
        if (chatArea.length) {
            const messageHtml = this.renderMessage(messageData);
            chatArea.append(messageHtml);
            this.scrollToBottom(chatArea);
        }
    },
    
    renderMessage: function(data) {
        const isUser = data.role === 'user';
        const timestamp = moment(data.timestamp).format('HH:mm');
        
        return `
            <div class="message ${data.role}" data-message-id="${data.message_id}">
                <div class="message-content">
                    ${frappe.utils.escape_html(data.content)}
                </div>
                <div class="message-meta">
                    <span class="message-time">${timestamp}</span>
                    ${data.compliance_check ? this.renderComplianceStatus(data.compliance_check) : ''}
                </div>
            </div>
        `;
    },
    
    renderComplianceStatus: function(complianceCheck) {
        if (!complianceCheck.allowed) {
            return `<span class="compliance-status violation" title="${complianceCheck.reason}">
                        <i class="fa fa-exclamation-triangle"></i>
                    </span>`;
        }
        return `<span class="compliance-status ok">
                    <i class="fa fa-check"></i>
                </span>`;
    },
    
    scrollToBottom: function(chatArea) {
        chatArea.scrollTop(chatArea[0].scrollHeight);
    }
};

// ====================
// UI helpers
// ====================

cap.ui = {
    showLoadingDialog: function(message) {
        frappe.show_progress(__(message || 'Processing'), 50);
    },
    
    hideLoadingDialog: function() {
        frappe.hide_progress();
    },
    
    confirmAction: function(message, callback) {
        frappe.confirm(
            __(message),
            function() {
                if (callback) callback();
            }
        );
    },
    
    showSuccess: function(message) {
        frappe.show_alert({
            message: __(message),
            indicator: 'green'
        });
    },
    
    showError: function(message) {
        frappe.show_alert({
            message: __(message),
            indicator: 'red'
        });
    }
};

// ====================
// Compliance helpers
// ====================

cap.compliance = {
    checkBeforeSave: function(frm, callback) {
        if (frm.doctype === 'Policy' || frm.doctype === 'Message') {
            frappe.call({
                method: 'cap.compliance.engine.check_document',
                args: {
                    doctype: frm.doctype,
                    doc: frm.doc
                },
                callback: function(r) {
                    if (r.message && !r.message.compliant) {
                        cap.ui.showError('Compliance check failed: ' + r.message.violations.join(', '));
                        if (callback) callback(false);
                    } else {
                        if (callback) callback(true);
                    }
                }
            });
        } else {
            if (callback) callback(true);
        }
    }
};

// ====================
// Initialization
// ====================

$(document).ready(function() {
    // Initialize realtime handlers
    cap.realtime.init();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Add custom CSS classes for RTL support
    if ($('html').attr('dir') === 'rtl') {
        $('body').addClass('cap-rtl');
    }
    
    // Add copyright footer to all pages
    cap.footer.addFooter();
});

// ====================
// Global form handlers
// ====================

// Apply tenant context to all forms
frappe.ui.form.on('*', {
    onload: function(frm) {
        // Apply tenant filter
        cap.tenant.applyTenantFilter(frm);
        
        // Auto-set tenant if not set
        if (frm.doc && !frm.doc.tenant && cap.tenant.getCurrentTenant()) {
            frm.set_value('tenant', cap.tenant.getCurrentTenant());
        }
    },
    
    before_save: function(frm) {
        // Run compliance checks before saving
        return new Promise(function(resolve) {
            cap.compliance.checkBeforeSave(frm, function(passed) {
                resolve(passed);
            });
        });
    }
});

// ====================
// Footer management
// ====================

cap.footer = {
    // Add footer to all pages
    addFooter: function() {
        // Remove existing footer if present
        $('#cap-footer').remove();
        
        // Create footer element
        const footerHtml = `
            <div id="cap-footer" class="cap-footer">
                <div class="container-fluid">
                    <div class="row">
                        <div class="col-md-12 text-center">
                            <p class="mb-0">
                                <i class="fa fa-copyright"></i> 2025 QuietWire
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Append footer to body (after all content)
        $('body').append(footerHtml);
        
        // Style the footer
        this.applyFooterStyles();
    },
    
    // Apply CSS styles to footer
    applyFooterStyles: function() {
        // Check if footer styles already exist
        if ($('#cap-footer-styles').length === 0) {
            const footerStyles = `
                <style id="cap-footer-styles">
                    #cap-footer {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background-color: #f8f9fa;
                        border-top: 1px solid #e9ecef;
                        padding: 10px 0;
                        z-index: 1000;
                        font-size: 14px;
                        color: #6c757d;
                        text-align: center;
                        box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
                    }
                    
                    #cap-footer p {
                        margin: 0;
                        font-weight: 500;
                    }
                    
                    #cap-footer .fa-copyright {
                        margin-right: 5px;
                    }
                    
                    /* Add bottom padding to body to prevent content overlap */
                    body {
                        padding-bottom: 50px !important;
                    }
                    
                    /* Ensure footer is visible on small screens */
                    @media (max-width: 768px) {
                        #cap-footer {
                            font-size: 12px;
                            padding: 8px 0;
                        }
                        
                        body {
                            padding-bottom: 45px !important;
                        }
                    }
                </style>
            `;
            
            $('head').append(footerStyles);
        }
    },
    
    // Remove footer
    removeFooter: function() {
        $('#cap-footer').remove();
        $('#cap-footer-styles').remove();
        
        // Remove bottom padding from body
        $('body').css('padding-bottom', '');
    },
    
    // Toggle footer visibility
    toggleFooter: function() {
        if ($('#cap-footer').length) {
            this.removeFooter();
        } else {
            this.addFooter();
        }
    }
};

// ====================
// Export for use in other scripts
// ====================

window.cap = cap;