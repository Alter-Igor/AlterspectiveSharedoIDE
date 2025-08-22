namespace("Alt.Utilities.BladeBouncer");

/**
 * Configuration Service for BladeBouncer (Legacy Compatibility)
 * 
 * This file is maintained for backward compatibility.
 * The actual implementation has been moved to Alt.Common.Services.ConfigurationService
 * 
 * @deprecated Use Alt.Common.Services.ConfigurationService directly
 */
Alt.Utilities.BladeBouncer.ConfigurationService = function(options) {
    // Delegate to the common service
    return new Alt.Common.Services.ConfigurationService(options);
};

// Ensure prototype methods are available for backward compatibility
Alt.Utilities.BladeBouncer.ConfigurationService.prototype = Alt.Common.Services.ConfigurationService.prototype;