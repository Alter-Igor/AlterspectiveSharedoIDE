// Ensure namespace function exists
if (typeof namespace !== 'function') {
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

// Create namespace
namespace("Alt.AdviceManagement");

/**
 * AdviceStatusService - Service for checking advice status in workflows
 * Simplified version focused on status checking only
 */
Alt.AdviceManagement.AdviceStatusService = function() {
    var self = this;
    
    // Attribute names configuration
    self.attributeNames = {
        enabled: "alt_ongoing_advice_enabled",
        pausedDate: "alt_ongoing_advice_paused_date", 
        pausedBy: "alt_ongoing_advice_paused_by",
        pauseReason: "alt_ongoing_advice_pause_reason",
        resumedDate: "alt_ongoing_advice_resumed_date",
        resumedBy: "alt_ongoing_advice_resumed_by", 
        resumeReason: "alt_ongoing_advice_resume_reason",
        nextAdviceDate: "alt_ongoing_advice_next_date"
    };
    
    /**
     * Get detailed advice status information
     * @param {string} workItemId - Work item ID to check
     * @param {Function} callback - Callback function (success, data, errorMessage)
     */
    self.getAdviceStatusDetails = function(workItemId, callback) {
        if (!workItemId) {
            callback(false, null, 'Work item ID is required');
            return;
        }
        
        console.log('[AdviceStatusService] Getting advice status for work item:', workItemId);
        
        // Use ShareDo's AJAX wrapper to get attributes
        $ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes')
            .then(function(attributes) {
                console.log('[AdviceStatusService] Raw attributes received:', attributes);
                
                // Map attributes to our structure
                var adviceData = self.mapAttributesToAdviceData(attributes);
                
                console.log('[AdviceStatusService] Mapped advice data:', adviceData);
                
                callback(true, adviceData, null);
            })
            .catch(function(error) {
                console.error('[AdviceStatusService] Failed to get attributes:', error);
                
                var errorMessage = 'Failed to retrieve work item attributes';
                if (error.responseJSON && error.responseJSON.message) {
                    errorMessage = error.responseJSON.message;
                } else if (error.statusText) {
                    errorMessage = error.statusText;
                }
                
                callback(false, null, errorMessage);
            });
    };
    
    /**
     * Map raw attributes to structured advice data
     * @param {Object} attributes - Raw attributes from API
     * @returns {Object} Structured advice data
     */
    self.mapAttributesToAdviceData = function(attributes) {
        if (!attributes) {
            attributes = {};
        }
        
        var adviceData = {};
        
        // Map each attribute using our configuration
        Object.keys(self.attributeNames).forEach(function(key) {
            var attributeName = self.attributeNames[key];
            var value = attributes[attributeName] || null;
            
            // Special handling for enabled field - handle legacy work-types
            if (key === 'enabled' && (value === null || value === undefined)) {
                value = true; // Default to enabled for legacy work-types
            }
            
            adviceData[key] = value;
        });
        
        return adviceData;
    };
    
    /**
     * Simple status check (just returns enabled/disabled)
     * @param {string} workItemId - Work item ID to check
     * @param {Function} callback - Callback function (success, isEnabled, errorMessage)
     */
    self.isAdviceEnabled = function(workItemId, callback) {
        self.getAdviceStatusDetails(workItemId, function(success, data, errorMessage) {
            if (!success) {
                callback(false, null, errorMessage);
                return;
            }
            
            var isEnabled = self.parseBoolean(data.enabled);
            callback(true, isEnabled, null);
        });
    };
    
    /**
     * Parse boolean values (handles string 'true'/'false' and actual booleans)
     * @param {*} value - Value to parse
     * @returns {boolean} Parsed boolean value
     */
    self.parseBoolean = function(value) {
        if (value === null || value === undefined) {
            // Handle legacy work-types: if enabled is null/undefined, default to true
            return true;
        }
        
        if (typeof value === 'boolean') {
            return value;
        }
        
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true';
        }
        
        return Boolean(value);
    };
};