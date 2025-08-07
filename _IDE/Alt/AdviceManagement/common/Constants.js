/**
 * Shared Constants for Advice Management Module
 * Centralizes all configuration and magic values
 */
namespace("Alt.AdviceManagement.Common");

Alt.AdviceManagement.Common.Constants = {
    // API Configuration
    API: {
        BASE_URL: '/api/v1/public',
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        CACHE_TTL: 5000
    },
    
    // Advice Status Values
    STATUS: {
        ACTIVE: 'active',
        PAUSED: 'paused',
        NONE: 'none',
        UNKNOWN: 'unknown'
    },
    
    // UI Configuration
    UI: {
        NOTIFICATION_DURATION: 5000,
        ANIMATION_SPEED: 300,
        DEBOUNCE_DELAY: 500,
        AUTO_REFRESH_INTERVAL: 30000,
        MAX_RETRIES_SHOWN: 3
    },
    
    // Widget Defaults
    WIDGETS: {
        PAUSED_WIDGET: {
            CHECK_INTERVAL: 30000,
            SHOW_REASON: true,
            AUTO_REFRESH: true,
            URGENCY_THRESHOLD_HOURS: 24
        },
        SUMMARY_CARD: {
            REFRESH_INTERVAL: 60000,
            SHOW_PROGRESS_BAR: true,
            SHOW_STATS: true,
            COMPACT_MODE: false
        },
        BULK_MANAGER: {
            PAGE_SIZE: 10,
            AUTO_LOAD: true,
            SHOW_FILTERS: true,
            EXPORT_BATCH_SIZE: 100
        }
    },
    
    // Workflow Configuration
    WORKFLOW: {
        DEFAULT_ACTION: 'checkOnly',
        DEFAULT_PAUSE_REASON: 'Workflow automated pause',
        CONFIRMATION_REQUIRED: false,
        ENABLE_LOGGING: true,
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
        TIMEOUT: 30000
    },
    
    // Event Names
    EVENTS: {
        ADVICE_PAUSED: 'advice:paused',
        ADVICE_RESUMED: 'advice:resumed',
        ADVICE_STATUS_CHANGED: 'advice:statusChanged',
        ADVICE_ERROR: 'advice:error',
        WIDGET_LOADED: 'widget:loaded',
        WIDGET_DESTROYED: 'widget:destroyed',
        WORKFLOW_STARTED: 'workflow:started',
        WORKFLOW_COMPLETED: 'workflow:completed',
        CACHE_CLEARED: 'cache:cleared',
        DEBUG_TOGGLED: 'debug:toggled'
    },
    
    // Storage Keys
    STORAGE: {
        USER_PREFERENCES: 'advice_user_preferences',
        CACHE_PREFIX: 'advice_cache_',
        DEBUG_MODE: 'advice_debug_mode',
        DISMISSED_ITEMS: 'advice_dismissed_items',
        LAST_SYNC: 'advice_last_sync'
    },
    
    // Keyboard Shortcuts
    KEYS: {
        PAUSE: 'p',
        RESUME: 'r',
        TOGGLE: ' ', // Space
        ESCAPE: 'Escape',
        HELP: '?',
        DEBUG: 'd', // With Ctrl+Shift
        REFRESH: 'F5'
    },
    
    // Error Messages
    ERRORS: {
        NETWORK: 'Network error. Please check your connection.',
        TIMEOUT: 'Request timed out. Please try again.',
        PERMISSION: 'You do not have permission to perform this action.',
        INVALID_STATE: 'Invalid advice state detected.',
        NO_WORK_ITEM: 'No work item ID provided.',
        API_ERROR: 'API error occurred. Please contact support.',
        VALIDATION: 'Validation error. Please check your input.'
    },
    
    // Success Messages
    SUCCESS: {
        PAUSED: 'Advice paused successfully',
        RESUMED: 'Advice resumed successfully',
        SAVED: 'Changes saved successfully',
        EXPORTED: 'Data exported successfully',
        REFRESHED: 'Data refreshed successfully'
    },
    
    // CSS Classes
    CLASSES: {
        LOADING: 'advice-loading',
        ERROR: 'advice-error',
        SUCCESS: 'advice-success',
        ACTIVE: 'advice-active',
        PAUSED: 'advice-paused',
        URGENT: 'advice-urgent',
        HIDDEN: 'advice-hidden',
        DISABLED: 'advice-disabled'
    },
    
    // Utility Functions
    Utils: {
        /**
         * Get formatted message with placeholders replaced
         */
        formatMessage: function(template, values) {
            return template.replace(/\{(\w+)\}/g, function(match, key) {
                return values[key] || match;
            });
        },
        
        /**
         * Get constant value by path
         */
        get: function(path) {
            var parts = path.split('.');
            var current = Alt.AdviceManagement.Common.Constants;
            
            for (var i = 0; i < parts.length; i++) {
                if (current[parts[i]] !== undefined) {
                    current = current[parts[i]];
                } else {
                    return undefined;
                }
            }
            
            return current;
        }
    }
};

// Freeze constants to prevent modification
if (Object.freeze) {
    Object.freeze(Alt.AdviceManagement.Common.Constants);
}