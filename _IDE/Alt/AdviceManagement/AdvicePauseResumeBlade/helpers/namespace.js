/**
 * Namespace helper function for ShareDo components
 * Creates nested namespaces safely
 */
window.namespace = window.namespace || function(namespaceString) {
    var parts = namespaceString.split('.');
    var parent = window;
    var currentPart = '';
    
    for (var i = 0, length = parts.length; i < length; i++) {
        currentPart = parts[i];
        parent[currentPart] = parent[currentPart] || {};
        parent = parent[currentPart];
    }
    
    return parent;
};

/**
 * Utility functions for ShareDo integration
 * Note: ShareDo's $ajax handles authentication automatically
 */
window.ShareDoUtils = window.ShareDoUtils || {
    /**
     * Get current work item ID from context
     */
    getWorkItemId: function(configuration) {
        // Try from configuration first
        if (configuration && configuration.workItemId) {
            return configuration.workItemId;
        }
        // Try from URL parameters
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('workItemId')) {
            return urlParams.get('workItemId');
        }
        // Try from ShareDo stack model
        if (window.$ui && window.$ui.stacks && window.$ui.stacks.current && 
            window.$ui.stacks.current.workItemId) {
            return window.$ui.stacks.current.workItemId;
        }
        return null;
    }
};