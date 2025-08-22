/**
 * Namespace helper for Phase Management module
 * Creates nested namespaces safely
 */
(function(window) {
    'use strict';
    
    // Only define if not already present
    if (typeof window.namespace !== 'function') {
        /**
         * Creates a namespace hierarchy
         * @param {string} namespaceString - Dot-separated namespace path
         * @returns {object} The deepest namespace object
         */
        window.namespace = function(namespaceString) {
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
    }
    
    // Initialize Phase Management namespaces
    window.namespace('Alt.PhaseManagement');
    window.namespace('Alt.PhaseManagement.Workflows');
    window.namespace('Alt.PhaseManagement.Foundation');
    window.namespace('Alt.PhaseManagement.Foundation.Services');
    window.namespace('Alt.PhaseManagement.Foundation.Helpers');
    
})(window);