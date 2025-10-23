/*
Project: QuietWire CAP (Civic AI Canon Platform) V 1.0.0
Website: https://quietwire.ai
Authors: Ashraf Saleh Alhajj; Raasid (AI Companion)
SPDX-License-Identifier: Apache-2.0
SPDX-FileCopyrightText: 2025 QuietWire
SPDX-FileContributor: Ashraf Saleh Alhajj
SPDX-FileContributor: Raasid (AI Companion)

Language Switcher Component
CAP Platform - Multi-Language Support
Supports: English, Arabic, French, Spanish
*/

(function() {
    'use strict';

    // Language Configuration
    const LANGUAGES = [
        { code: 'en', name: 'English', native_name: 'English', flag: '🇬🇧', rtl: false },
        { code: 'ar', name: 'Arabic', native_name: 'العربية', flag: '🇸🇦', rtl: true },
        { code: 'fr', name: 'French', native_name: 'Français', flag: '🇫🇷', rtl: false },
        { code: 'es', name: 'Spanish', native_name: 'Español', flag: '🇪🇸', rtl: false }
    ];

    // Current language state
    let currentLanguage = 'en';

    /**
     * Initialize Language Switcher
     */
    function initLanguageSwitcher() {
        // Get user's current language from boot info
        if (frappe.boot && frappe.boot.user_language) {
            currentLanguage = frappe.boot.user_language;
        }

        // Apply language on page load
        applyLanguage(currentLanguage);

        // Add language switcher to toolbar
        addLanguageSwitcherToToolbar();

        // Listen for language change events
        frappe.realtime.on('language_changed', function(data) {
            if (data.user === frappe.session.user) {
                location.reload();
            }
        });
    }

    /**
     * Add language switcher button to toolbar
     */
    function addLanguageSwitcherToToolbar() {
        // Wait for toolbar to be ready
        $(document).ready(function() {
            setTimeout(function() {
                const currentLang = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];
                
                // Add to navbar
                const $languageBtn = $(`
                    <li class="nav-item dropdown">
                        <a class="nav-link" href="#" id="language-dropdown" 
                           role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"
                           title="${__('Change Language')}">
                            <span class="flag">${currentLang.flag}</span>
                            <span class="lang-code d-none d-md-inline">${currentLang.code.toUpperCase()}</span>
                        </a>
                        <div class="dropdown-menu dropdown-menu-right" aria-labelledby="language-dropdown">
                            ${LANGUAGES.map(lang => `
                                <a class="dropdown-item language-option ${lang.code === currentLanguage ? 'active' : ''}" 
                                   href="#" data-lang="${lang.code}">
                                    <span class="flag">${lang.flag}</span>
                                    <span class="name">${lang.native_name}</span>
                                    ${lang.code === currentLanguage ? '<i class="fa fa-check ml-2"></i>' : ''}
                                </a>
                            `).join('')}
                        </div>
                    </li>
                `);

                // Insert before help menu
                $('.navbar-nav.navbar-right').prepend($languageBtn);

                // Handle language selection
                $languageBtn.find('.language-option').on('click', function(e) {
                    e.preventDefault();
                    const langCode = $(this).data('lang');
                    if (langCode !== currentLanguage) {
                        changeLanguage(langCode);
                    }
                });
            }, 500);
        });
    }

    /**
     * Show language selector dialog
     */
    function showLanguageDialog() {
        const d = new frappe.ui.Dialog({
            title: __('Select Language'),
            fields: [
                {
                    fieldtype: 'HTML',
                    fieldname: 'language_grid',
                    options: generateLanguageGrid()
                }
            ],
            primary_action_label: __('Close'),
            primary_action: function() {
                d.hide();
            }
        });

        d.show();

        // Handle language selection
        d.$wrapper.find('.lang-option').on('click', function() {
            const langCode = $(this).data('lang');
            if (langCode !== currentLanguage) {
                d.hide();
                changeLanguage(langCode);
            }
        });
    }

    /**
     * Generate language grid HTML
     */
    function generateLanguageGrid() {
        return `
            <div class="language-grid">
                ${LANGUAGES.map(lang => `
                    <div class="lang-option ${lang.code === currentLanguage ? 'active' : ''}" 
                         data-lang="${lang.code}">
                        <span class="flag">${lang.flag}</span>
                        <div class="lang-info">
                            <div class="name">${lang.native_name}</div>
                            <div class="text-muted small">${lang.name}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Change language
     */
    function changeLanguage(langCode) {
        // Validate language code
        if (!LANGUAGES.find(l => l.code === langCode)) {
            frappe.msgprint(__('Invalid language code'));
            return;
        }

        // Show loading indicator
        frappe.show_alert({
            message: __('Changing language...'),
            indicator: 'blue'
        }, 2);

        // Call server to update user preference
        frappe.call({
            method: 'cap.boot.set_user_language',
            args: { language: langCode },
            callback: function(r) {
                if (r.message && r.message.success) {
                    currentLanguage = langCode;
                    
                    // Show success message
                    frappe.show_alert({
                        message: __('Language changed successfully. Refreshing...'),
                        indicator: 'green'
                    }, 3);

                    // Apply language immediately
                    applyLanguage(langCode);

                    // Reload page to apply translations
                    setTimeout(function() {
                        location.reload();
                    }, 1000);
                } else {
                    frappe.msgprint(__('Failed to change language'));
                }
            },
            error: function() {
                frappe.msgprint(__('Error changing language'));
            }
        });
    }

    /**
     * Apply language to HTML
     */
    function applyLanguage(langCode) {
        const lang = LANGUAGES.find(l => l.code === langCode);
        
        if (lang) {
            // Set HTML lang attribute
            document.documentElement.setAttribute('lang', langCode);
            
            // Set direction (RTL/LTR)
            if (lang.rtl) {
                document.documentElement.setAttribute('dir', 'rtl');
                document.body.classList.add('rtl');
            } else {
                document.documentElement.setAttribute('dir', 'ltr');
                document.body.classList.remove('rtl');
            }
            
            // Update frappe language
            frappe.boot.lang = langCode;
            frappe._messages = frappe._messages || {};
        }
    }

    /**
     * Get current language
     */
    function getCurrentLanguage() {
        return currentLanguage;
    }

    /**
     * Get language info
     */
    function getLanguageInfo(langCode) {
        return LANGUAGES.find(l => l.code === langCode);
    }

    /**
     * Check if current language is RTL
     */
    function isRTL() {
        const lang = LANGUAGES.find(l => l.code === currentLanguage);
        return lang ? lang.rtl : false;
    }

    // Initialize on frappe ready
    $(document).on('frappe.ready', function() {
        initLanguageSwitcher();
    });

    // Expose API
    window.CAP = window.CAP || {};
    window.CAP.LanguageSwitcher = {
        change: changeLanguage,
        getCurrent: getCurrentLanguage,
        getInfo: getLanguageInfo,
        isRTL: isRTL,
        showDialog: showLanguageDialog,
        languages: LANGUAGES
    };

})();