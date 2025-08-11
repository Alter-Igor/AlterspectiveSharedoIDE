namespace("Alt.AdviceManagement.Utils");

/**
 * DebugLogger - Enhanced logging utility for advice management components
 * Supports URL parameter control and consistent log formatting
 */
Alt.AdviceManagement.Utils.DebugLogger = function() {
    var self = this;
    
    // Check URL parameters for debug settings
    self.urlParams = new URLSearchParams(window.location.search);
    self.debugAdvice = self.urlParams.get('debug-advice') === 'true' || self.urlParams.get('debug-advice') === '1';
    self.debugWorkflow = self.urlParams.get('debug-workflow') === 'true' || self.urlParams.get('debug-workflow') === '1';
    self.debugAll = self.urlParams.get('debug-all') === 'true' || self.urlParams.get('debug-all') === '1';
    self.verboseLogging = self.urlParams.get('verbose-logging') === 'true' || self.urlParams.get('verbose-logging') === '1';
    
    // Override UI log level if debug parameters are present
    if ((self.debugAdvice || self.debugWorkflow || self.debugAll) && $ui && $ui.setLogLevel) {
        $ui.setLogLevel(1); // Set to debug level
        console.log("DebugLogger - Enhanced logging enabled via URL parameters");
    }
    
    /**
     * Enhanced debug logging for advice components
     */
    self.debug = function(component, message, data) {
        if (self.shouldLog('debug', component)) {
            var timestamp = new Date().toISOString();
            var logMessage = "[" + timestamp + "] [" + component + "] " + message;
            
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug(logMessage);
                if (data && self.verboseLogging) {
                    $ui.log.debug("  Data: " + JSON.stringify(data, null, 2));
                }
            }
            
            // Also log to console for development
            if (self.debugAll || self.debugAdvice || self.debugWorkflow) {
                console.log(logMessage, data || '');
            }
        }
    };
    
    /**
     * Enhanced info logging
     */
    self.info = function(component, message, data) {
        if (self.shouldLog('info', component)) {
            var timestamp = new Date().toISOString();
            var logMessage = "[" + timestamp + "] [" + component + "] INFO: " + message;
            
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug(logMessage);
            }
            
            // Use log.Information for server-side workflow logging
            if (typeof log !== 'undefined' && log.Information && component.indexOf('Workflow') !== -1) {
                log.Information(component + " - " + message);
                if (data && self.verboseLogging) {
                    log.Information(component + " - Data: " + JSON.stringify(data));
                }
            }
        }
    };
    
    /**
     * Enhanced warning logging
     */
    self.warning = function(component, message, data) {
        var timestamp = new Date().toISOString();
        var logMessage = "[" + timestamp + "] [" + component + "] WARNING: " + message;
        
        if ($ui && $ui.log && $ui.log.warning) {
            $ui.log.warning(logMessage);
        }
        
        if (typeof log !== 'undefined' && log.Warning && component.indexOf('Workflow') !== -1) {
            log.Warning(component + " - " + message);
        }
        
        console.warn(logMessage, data || '');
    };
    
    /**
     * Enhanced error logging
     */
    self.error = function(component, message, error, data) {
        var timestamp = new Date().toISOString();
        var logMessage = "[" + timestamp + "] [" + component + "] ERROR: " + message;
        
        if ($ui && $ui.log && $ui.log.error) {
            $ui.log.error(logMessage);
            if (error) {
                $ui.log.error("  Error details: " + (error.message || error));
                if (error.stack) {
                    $ui.log.error("  Stack trace: " + error.stack);
                }
            }
        }
        
        if (typeof log !== 'undefined' && log.Error && component.indexOf('Workflow') !== -1) {
            log.Error(component + " - " + message);
        }
        
        console.error(logMessage, error || '', data || '');
    };
    
    /**
     * Performance timing utility
     */
    self.time = function(component, label) {
        var startTime = new Date();
        return {
            end: function(message) {
                var duration = new Date() - startTime;
                self.debug(component, (message || label) + " completed in " + duration + "ms", {
                    duration: duration,
                    startTime: startTime,
                    endTime: new Date()
                });
                return duration;
            }
        };
    };
    
    /**
     * Check if logging should occur for component and level
     */
    self.shouldLog = function(level, component) {
        if (self.debugAll) return true;
        if (self.debugAdvice && component.indexOf('Advice') !== -1) return true;
        if (self.debugWorkflow && component.indexOf('Workflow') !== -1) return true;
        
        // Default behavior - respect UI log level
        if ($ui && $ui.log) {
            return !!$ui.log[level];
        }
        
        return level !== 'debug'; // Always allow non-debug logs
    };
    
    /**
     * Get current debug configuration
     */
    self.getDebugConfig = function() {
        return {
            debugAdvice: self.debugAdvice,
            debugWorkflow: self.debugWorkflow,
            debugAll: self.debugAll,
            verboseLogging: self.verboseLogging,
            urlParams: Object.fromEntries(self.urlParams.entries())
        };
    };
    
    // Log initialization
    if (self.debugAdvice || self.debugWorkflow || self.debugAll) {
        console.log("DebugLogger initialized with config:", self.getDebugConfig());
    }
};

// Create global instance
if (typeof Alt !== 'undefined' && Alt.AdviceManagement) {
    Alt.AdviceManagement.DebugLogger = new Alt.AdviceManagement.Utils.DebugLogger();
}