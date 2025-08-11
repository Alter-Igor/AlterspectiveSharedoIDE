/**
 * AdviceStatusChecker - Workflow Action
 * 
 * Lightweight workflow action that checks work item advice status and provides
 * detailed status information for workflow branching decisions.
 * 
 * This action is read-only and does not modify advice status.
 */
(function() {
    'use strict';

    // Ensure namespace exists
    if (typeof Alt === 'undefined') Alt = {};
    if (typeof Alt.AdviceManagement === 'undefined') Alt.AdviceManagement = {};

    /**
     * Main workflow action execution function
     * @param {Object} config - Configuration from workflow designer
     * @param {Function} callback - Callback function for workflow completion
     */
    Alt.AdviceManagement.AdviceStatusChecker = function(config, callback) {
        var startTime = Date.now();
        
        // Initialize logging
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceStatusChecker - STARTING status check");
            log.Information("  Work Item ID: " + (config.workItemId || 'Not specified'));
            log.Information("  Enable Caching: " + (config.enableCaching !== false));
            log.Information("  Timeout: " + (config.timeout || 30000) + "ms");
        }

        // Validate required inputs
        if (!config.workItemId) {
            var errorMessage = "Work Item ID is required for advice status checking";
            if (typeof log !== 'undefined' && log.Error) {
                log.Error("AdviceStatusChecker - ERROR: " + errorMessage);
            }
            
            return callback({
                success: false,
                errorMessage: errorMessage,
                branch: 'error'
            });
        }

        // Default configuration
        var settings = {
            workItemId: config.workItemId,
            enableCaching: config.enableCaching !== false,
            enableLogging: config.enableLogging !== false,
            timeout: config.timeout || 30000
        };

        // Output container for results
        var results = {
            adviceStatus: 'none',
            isEnabled: false,
            hasAdvice: false,
            pausedDate: null,
            pausedBy: null,
            pauseReason: null,
            resumedDate: null,
            resumedBy: null,
            resumeReason: null,
            nextAdviceDate: null,
            lastActionDate: null,
            success: false,
            errorMessage: null,
            branch: 'none'
        };

        try {
            // Get advice status using the service
            if (typeof Alt.AdviceManagement.AdviceStatusService !== 'undefined') {
                // Use the dedicated service
                Alt.AdviceManagement.AdviceStatusService.checkAdviceStatus({
                    workItemId: settings.workItemId,
                    enableCaching: settings.enableCaching,
                    timeout: settings.timeout
                }, function(serviceResult) {
                    processServiceResult(serviceResult, results, settings, startTime, callback);
                });
            } else {
                // Fallback to direct API calls
                checkAdviceStatusDirect(settings, results, startTime, callback);
            }
        } catch (error) {
            var errorMessage = "Exception in AdviceStatusChecker: " + (error.message || error);
            
            if (typeof log !== 'undefined' && log.Error) {
                log.Error("AdviceStatusChecker - EXCEPTION: " + errorMessage);
            }
            
            results.success = false;
            results.errorMessage = errorMessage;
            results.branch = 'error';
            
            var duration = Date.now() - startTime;
            if (typeof log !== 'undefined' && log.Information) {
                log.Information("AdviceStatusChecker - COMPLETED with exception in " + duration + "ms");
            }
            
            callback(results);
        }
    };

    /**
     * Process results from the advice status service
     */
    function processServiceResult(serviceResult, results, settings, startTime, callback) {
        if (serviceResult.success) {
            // Map service results to workflow outputs
            results.adviceStatus = serviceResult.status || 'none';
            results.isEnabled = serviceResult.isEnabled || false;
            results.hasAdvice = serviceResult.hasAdvice || false;
            results.pausedDate = serviceResult.pausedDate || null;
            results.pausedBy = serviceResult.pausedBy || null;
            results.pauseReason = serviceResult.pauseReason || null;
            results.resumedDate = serviceResult.resumedDate || null;
            results.resumedBy = serviceResult.resumedBy || null;
            results.resumeReason = serviceResult.resumeReason || null;
            results.nextAdviceDate = serviceResult.nextAdviceDate || null;
            results.lastActionDate = serviceResult.lastActionDate || null;
            results.success = true;
            results.errorMessage = null;

            // Determine branch based on status
            if (results.adviceStatus === 'active') {
                results.branch = 'active';
            } else if (results.adviceStatus === 'paused') {
                results.branch = 'paused';
            } else {
                results.branch = 'none';
            }

            var duration = Date.now() - startTime;
            if (typeof log !== 'undefined' && log.Information) {
                log.Information("AdviceStatusChecker - SUCCESS: Status is '" + results.adviceStatus + "'");
                log.Information("  Has Advice: " + results.hasAdvice);
                log.Information("  Is Enabled: " + results.isEnabled);
                log.Information("  Duration: " + duration + "ms");
                log.Information("  Branch: " + results.branch);
            }
        } else {
            results.success = false;
            results.errorMessage = serviceResult.errorMessage || "Service returned failure";
            results.branch = 'error';

            var duration = Date.now() - startTime;
            if (typeof log !== 'undefined' && log.Error) {
                log.Error("AdviceStatusChecker - SERVICE ERROR: " + results.errorMessage);
                log.Error("  Duration: " + duration + "ms");
            }
        }

        callback(results);
    }

    /**
     * Direct API call fallback when service is not available
     */
    function checkAdviceStatusDirect(settings, results, startTime, callback) {
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceStatusChecker - Using direct API approach (service not available)");
        }

        // Use ShareDo AJAX API to get work item attributes
        if (typeof $ajax !== 'undefined' && $ajax.api) {
            var apiUrl = '/api/v1/public/workItem/' + settings.workItemId + '/attributes';
            
            $ajax.api.get(apiUrl)
                .then(function(attributes) {
                    // Process attributes directly
                    processAttributesDirect(attributes, results, settings, startTime, callback);
                })
                .catch(function(error) {
                    var errorMessage = "API error getting work item attributes: " + (error.message || error);
                    
                    if (typeof log !== 'undefined' && log.Error) {
                        log.Error("AdviceStatusChecker - API ERROR: " + errorMessage);
                    }
                    
                    results.success = false;
                    results.errorMessage = errorMessage;
                    results.branch = 'error';
                    
                    var duration = Date.now() - startTime;
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdviceStatusChecker - COMPLETED with error in " + duration + "ms");
                    }
                    
                    callback(results);
                });
        } else {
            var errorMessage = "ShareDo AJAX API not available";
            
            if (typeof log !== 'undefined' && log.Error) {
                log.Error("AdviceStatusChecker - ERROR: " + errorMessage);
            }
            
            results.success = false;
            results.errorMessage = errorMessage;
            results.branch = 'error';
            
            callback(results);
        }
    }

    /**
     * Process work item attributes directly
     */
    function processAttributesDirect(attributes, results, settings, startTime, callback) {
        try {
            // Extract advice status from attributes
            var adviceEnabled = attributes['alt_ongoing_advice_enabled'] === 'true';
            var pausedDate = attributes['alt_ongoing_advice_paused_date'] || null;
            var pausedBy = attributes['alt_ongoing_advice_paused_by'] || null;
            var pauseReason = attributes['alt_ongoing_advice_pause_reason'] || null;
            var resumedDate = attributes['alt_ongoing_advice_resumed_date'] || null;
            var resumedBy = attributes['alt_ongoing_advice_resumed_by'] || null;
            var resumeReason = attributes['alt_ongoing_advice_resume_reason'] || null;
            var nextAdviceDate = attributes['alt_ongoing_advice_next_date'] || null;

            // Determine status
            var status = 'none';
            var hasAdvice = false;
            
            if (adviceEnabled) {
                status = 'active';
                hasAdvice = true;
            } else if (pausedDate) {
                status = 'paused';
                hasAdvice = true;
            }

            // Determine last action date
            var lastActionDate = null;
            if (resumedDate && pausedDate) {
                lastActionDate = resumedDate > pausedDate ? resumedDate : pausedDate;
            } else if (resumedDate) {
                lastActionDate = resumedDate;
            } else if (pausedDate) {
                lastActionDate = pausedDate;
            }

            // Update results
            results.adviceStatus = status;
            results.isEnabled = adviceEnabled;
            results.hasAdvice = hasAdvice;
            results.pausedDate = pausedDate;
            results.pausedBy = pausedBy;
            results.pauseReason = pauseReason;
            results.resumedDate = resumedDate;
            results.resumedBy = resumedBy;
            results.resumeReason = resumeReason;
            results.nextAdviceDate = nextAdviceDate;
            results.lastActionDate = lastActionDate;
            results.success = true;
            results.errorMessage = null;

            // Set branch
            if (status === 'active') {
                results.branch = 'active';
            } else if (status === 'paused') {
                results.branch = 'paused';
            } else {
                results.branch = 'none';
            }

            var duration = Date.now() - startTime;
            if (typeof log !== 'undefined' && log.Information) {
                log.Information("AdviceStatusChecker - SUCCESS (direct): Status is '" + status + "'");
                log.Information("  Has Advice: " + hasAdvice);
                log.Information("  Is Enabled: " + adviceEnabled);
                log.Information("  Duration: " + duration + "ms");
                log.Information("  Branch: " + results.branch);
            }

            callback(results);
        } catch (error) {
            var errorMessage = "Error processing attributes: " + (error.message || error);
            
            if (typeof log !== 'undefined' && log.Error) {
                log.Error("AdviceStatusChecker - PROCESSING ERROR: " + errorMessage);
            }
            
            results.success = false;
            results.errorMessage = errorMessage;
            results.branch = 'error';
            
            callback(results);
        }
    }

})();