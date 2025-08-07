/**
 * Initialization script for Advice Management Common Components
 * Loads foundation modules in correct order
 */

(function() {
    'use strict';
    
    console.log('[AdviceManagement] Initializing Foundation Bundle...');
    
    // Check dependencies
    if (!window.jQuery) {
        console.error('[AdviceManagement] jQuery is required');
        return;
    }
    
    if (!window.ko) {
        console.error('[AdviceManagement] KnockoutJS is required');
        return;
    }
    
    // Initialize modules
    try {
        // Constants are already frozen and ready
        if (Alt.AdviceManagement.Common.Constants) {
            console.log('[AdviceManagement] ✓ Constants loaded');
        }
        
        // EventBus is ready
        if (Alt.AdviceManagement.Common.EventBus) {
            console.log('[AdviceManagement] ✓ EventBus loaded');
            
            // Enable debug mode if in development
            if (window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1') {
                Alt.AdviceManagement.Common.EventBus.setDebugMode(true);
            }
        }
        
        // CacheManager is ready
        if (Alt.AdviceManagement.Common.CacheManager) {
            console.log('[AdviceManagement] ✓ CacheManager loaded');
            
            // Configure cache with defaults from Constants
            Alt.AdviceManagement.Common.CacheManager.configure({
                defaultTTL: Alt.AdviceManagement.Common.Constants.API.CACHE_TTL
            });
        }
        
        // UIHelpers are ready
        if (Alt.AdviceManagement.Common.UIHelpers) {
            console.log('[AdviceManagement] ✓ UIHelpers loaded');
        }
        
        // Set up global error handler for advice events
        window.addEventListener('error', function(event) {
            if (event.error && event.error.stack && 
                event.error.stack.indexOf('AdviceManagement') !== -1) {
                Alt.AdviceManagement.Common.EventBus.publish(
                    Alt.AdviceManagement.Common.Constants.EVENTS.ADVICE_ERROR,
                    {
                        message: event.error.message,
                        stack: event.error.stack,
                        timestamp: new Date().toISOString()
                    }
                );
            }
        });
        
        // Broadcast that foundation is ready
        Alt.AdviceManagement.Common.EventBus.publish('foundation:ready', {
            modules: ['Constants', 'EventBus', 'CacheManager', 'UIHelpers'],
            timestamp: new Date().toISOString()
        });
        
        console.log('[AdviceManagement] Foundation Bundle initialized successfully');
        
    } catch (error) {
        console.error('[AdviceManagement] Failed to initialize Foundation Bundle', error);
    }
})();

// Export for module loaders if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Constants: Alt.AdviceManagement.Common.Constants,
        EventBus: Alt.AdviceManagement.Common.EventBus,
        CacheManager: Alt.AdviceManagement.Common.CacheManager,
        UIHelpers: Alt.AdviceManagement.Common.UIHelpers
    };
}