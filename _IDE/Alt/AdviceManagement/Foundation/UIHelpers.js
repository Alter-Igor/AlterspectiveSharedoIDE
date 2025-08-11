/**
 * UI Helper Functions for Advice Management
 * Provides common UI utilities for widgets
 */
namespace("Alt.AdviceManagement.Common");

Alt.AdviceManagement.Common.UIHelpers = (function() {
    'use strict';
    
    /**
     * Get current work item context from portal
     * @returns {object} Context object with id, title, reference, workType
     */
    function getWorkItemContext() {
        var context = {
            id: null,
            title: null,
            reference: null,
            workType: null,
            matter: {}
        };
        
        // Try to get from $ui.pageContext (portal context)
        if (window.$ui && window.$ui.pageContext) {
            var pageContext = window.$ui.pageContext;
            
            // Get ShareDo ID
            if (pageContext.sharedoId) {
                context.id = pageContext.sharedoId();
            }
            
            // Get ShareDo name/title
            if (pageContext.sharedoName) {
                context.title = pageContext.sharedoName();
            }
            
            // Get ShareDo type
            if (pageContext.sharedoType) {
                context.type = pageContext.sharedoType();
            }
            
            // Get matter information if available
            if (pageContext.matterSummary) {
                var matterSummary = pageContext.matterSummary;
                
                if (matterSummary.matterReference) {
                    context.reference = matterSummary.matterReference();
                    context.matter.reference = matterSummary.matterReference();
                }
                
                if (matterSummary.workType) {
                    context.workType = matterSummary.workType();
                    context.matter.workType = matterSummary.workType();
                }
                
                if (matterSummary.matterTitle) {
                    context.matter.title = matterSummary.matterTitle();
                }
                
                if (matterSummary.matterClientName) {
                    context.matter.clientName = matterSummary.matterClientName();
                }
                
                if (matterSummary.matterId) {
                    context.matter.id = matterSummary.matterId();
                }
            }
            
            // Get user information
            if (pageContext.user) {
                context.user = {
                    id: pageContext.user.userid ? pageContext.user.userid() : null,
                    username: pageContext.user.username ? pageContext.user.username() : null,
                    firstname: pageContext.user.firstname ? pageContext.user.firstname() : null,
                    lastname: pageContext.user.lastname ? pageContext.user.lastname() : null
                };
            }
        }
        
        return context;
    }
    
    /**
     * Subscribe to context changes
     * @param {function} callback - Function to call when context changes
     * @returns {object} Subscription object with unsubscribe method
     */
    function subscribeToContextChanges(callback) {
        var subscriptions = [];
        
        if (window.$ui && window.$ui.pageContext) {
            var pageContext = window.$ui.pageContext;
            
            // Subscribe to ShareDo ID changes
            if (pageContext.sharedoId && pageContext.sharedoId.subscribe) {
                subscriptions.push(
                    pageContext.sharedoId.subscribe(function() {
                        callback(getWorkItemContext());
                    })
                );
            }
            
            // Subscribe to ShareDo name changes
            if (pageContext.sharedoName && pageContext.sharedoName.subscribe) {
                subscriptions.push(
                    pageContext.sharedoName.subscribe(function() {
                        callback(getWorkItemContext());
                    })
                );
            }
        }
        
        return {
            unsubscribe: function() {
                subscriptions.forEach(function(sub) {
                    if (sub && sub.dispose) {
                        sub.dispose();
                    }
                });
            }
        };
    }
    
    /**
     * Open a panel using the appropriate method
     * @param {object} options - Panel options
     */
    function openPanel(options) {
        // Add context data if not provided
        if (!options.data) {
            options.data = {};
        }
        
        // Add current context to panel data
        var context = getWorkItemContext();
        if (context.id && !options.data.workItemId) {
            options.data.workItemId = context.id;
        }
        if (context.title && !options.data.workItemTitle) {
            options.data.workItemTitle = context.title;
        }
        
        // Try multiple methods to open panel
        if (window.$ui && window.$ui.openPanel) {
            // New portal UI method
            window.$ui.openPanel(options);
            return true;
        } else if (window.ShareDo && window.ShareDo.UI && window.ShareDo.UI.openPanel) {
            // Standard ShareDo method
            window.ShareDo.UI.openPanel(options);
            return true;
        } else if (window.parent && window.parent.ShareDo && window.parent.ShareDo.UI && window.parent.ShareDo.UI.openPanel) {
            // Parent frame ShareDo method
            window.parent.ShareDo.UI.openPanel(options);
            return true;
        } else if (window.top && window.top.ShareDo && window.top.ShareDo.UI && window.top.ShareDo.UI.openPanel) {
            // Top frame ShareDo method
            window.top.ShareDo.UI.openPanel(options);
            return true;
        } else {
            console.error("Unable to open panel - No panel opening mechanism available");
            return false;
        }
    }
    
    /**
     * Show a notification message
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds (0 for permanent)
     */
    function showNotification(message, type, duration) {
        type = type || 'info';
        duration = duration !== undefined ? duration : 5000;
        
        // Try multiple notification methods
        if (window.$ui && window.$ui.notify) {
            window.$ui.notify({
                message: message,
                type: type,
                duration: duration
            });
        } else if (window.ShareDo && window.ShareDo.UI && window.ShareDo.UI.showNotification) {
            window.ShareDo.UI.showNotification(message, type, duration);
        } else if (window.toastr) {
            // Fallback to toastr if available
            window.toastr[type](message);
        } else {
            // Final fallback to console
            console.log('[' + type.toUpperCase() + '] ' + message);
        }
    }
    
    /**
     * Show a confirmation dialog
     * @param {string} message - Confirmation message
     * @param {function} onConfirm - Callback for confirmation
     * @param {function} onCancel - Callback for cancellation
     */
    function showConfirmation(message, onConfirm, onCancel) {
        // Try ShareDo confirmation first
        if (window.$ui && window.$ui.confirm) {
            window.$ui.confirm({
                message: message,
                onConfirm: onConfirm,
                onCancel: onCancel
            });
        } else if (window.ShareDo && window.ShareDo.UI && window.ShareDo.UI.confirm) {
            window.ShareDo.UI.confirm(message, onConfirm, onCancel);
        } else {
            // Fallback to native confirm
            if (confirm(message)) {
                if (onConfirm) onConfirm();
            } else {
                if (onCancel) onCancel();
            }
        }
    }
    
    /**
     * Get current user information
     * @returns {object} User information
     */
    function getCurrentUser() {
        var user = {
            id: null,
            username: 'Unknown',
            fullName: 'Unknown User'
        };
        
        // Try $ui.pageContext
        if (window.$ui && window.$ui.pageContext && window.$ui.pageContext.user) {
            var contextUser = window.$ui.pageContext.user;
            
            if (contextUser.userid) {
                user.id = contextUser.userid();
            }
            if (contextUser.username) {
                user.username = contextUser.username();
            }
            if (contextUser.firstname && contextUser.lastname) {
                user.fullName = contextUser.firstname() + ' ' + contextUser.lastname();
            }
        }
        // Try ShareDo context
        else if (window.ShareDo && window.ShareDo.currentUser) {
            user.id = window.ShareDo.currentUser.id;
            user.username = window.ShareDo.currentUser.username || window.ShareDo.currentUser.email;
            user.fullName = window.ShareDo.currentUser.name || user.username;
        }
        
        return user;
    }
    
    /**
     * Check if user has permission
     * @param {string} permission - Permission to check
     * @returns {boolean} True if user has permission
     */
    function hasPermission(permission) {
        // Check object permissions
        if (window.$ui && window.$ui.pageContext && window.$ui.pageContext.objectPermissions) {
            var permissions = window.$ui.pageContext.objectPermissions();
            if (permissions && permissions[permission]) {
                return true;
            }
        }
        
        // Check system permissions
        if (window.$ui && window.$ui.pageContext && window.$ui.pageContext.systemPermissions) {
            var sysPermissions = window.$ui.pageContext.systemPermissions();
            if (sysPermissions && sysPermissions[permission]) {
                return true;
            }
        }
        
        // Check ShareDo permissions
        if (window.$ui && window.$ui.pageContext && window.$ui.pageContext.sharedoPermissions) {
            var sharedoPerms = window.$ui.pageContext.sharedoPermissions();
            if (sharedoPerms && sharedoPerms[permission]) {
                return true;
            }
        }
        
        return false;
    }
    
    // Public API
    return {
        getWorkItemContext: getWorkItemContext,
        subscribeToContextChanges: subscribeToContextChanges,
        openPanel: openPanel,
        showNotification: showNotification,
        showConfirmation: showConfirmation,
        getCurrentUser: getCurrentUser,
        hasPermission: hasPermission
    };
})();

// Create global shortcut
window.AdviceUI = Alt.AdviceManagement.Common.UIHelpers;