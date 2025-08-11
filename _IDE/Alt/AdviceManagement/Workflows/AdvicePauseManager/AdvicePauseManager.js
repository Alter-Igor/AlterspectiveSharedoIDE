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
 * AdvicePauseManager - Workflow action for comprehensive advice pause management
 * @param {Object} context - Workflow execution context
 * @param {Object} configuration - Action configuration
 * @param {Function} callback - Completion callback
 */
Alt.AdviceManagement.AdvicePauseManager = function(context, configuration, callback) {
    var self = this;
    
    // Default configuration
    var defaults = {
        abstractAdviceTypeSystemName: 'AbstractAdvice',
        pausedPhase: 'Removed',
        pauseReason: 'Advice paused by workflow',
        saveAdviceState: true,
        enableLogging: true,
        timeout: 60000
    };
    
    // Merge configuration
    self.config = $.extend(true, {}, defaults, configuration);
    self.context = context;
    self.callback = callback;
    
    // Initialize lifecycle service
    var lifecycleConfig = new Alt.AdviceManagement.Configuration.AdviceLifecycleConfig({
        abstractAdviceTypeSystemName: self.config.abstractAdviceTypeSystemName,
        phases: {
            active: 'Active',
            paused: 'Paused',
            removed: self.config.pausedPhase
        }
    });
    
    self.lifecycleService = new Alt.AdviceManagement.Services.AdviceLifecycleService(lifecycleConfig);
    
    // State tracking
    self.state = {
        workItemId: null,
        foundAdviceItems: [],
        pausedAdviceItems: [],
        savedStateSuccess: false,
        errors: [],
        startTime: new Date()
    };
    
    /**
     * Execute the workflow action
     */
    self.execute = function() {
        var startTime = new Date();
        
        // Enhanced logging with performance tracking
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdvicePauseManager - STARTING advice pause process");
            log.Information("  Execution ID: " + self.state.startTime.getTime());
            log.Information("  Context Keys: " + Object.keys(self.context).join(", "));
            log.Information("  Configuration Summary:");
            log.Information("    Abstract Advice Type: " + self.config.abstractAdviceTypeSystemName);
            log.Information("    Paused Phase: " + self.config.pausedPhase);
            log.Information("    Save State: " + self.config.saveAdviceState);
            log.Information("    Timeout: " + self.config.timeout + "ms");
        }
        
        // Enhanced validation with detailed error reporting
        var validationResult = self.validateInputs();
        if (!validationResult) {
            if (typeof log !== 'undefined' && log.Information) {
                log.Information("AdvicePauseManager - VALIDATION FAILED");
                log.Information("  Errors: " + self.state.errors.join("; "));
                log.Information("  Duration: " + (new Date() - startTime) + "ms");
            }
            return self.complete(false, 'Invalid input parameters: ' + self.state.errors.join("; "));
        }
        
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdvicePauseManager - Validation passed, setting timeout of " + self.config.timeout + "ms");
        }
        
        // Set timeout with enhanced logging
        var timeoutId = setTimeout(function() {
            if (typeof log !== 'undefined' && log.Information) {
                log.Information("AdvicePauseManager - TIMEOUT EXCEEDED after " + self.config.timeout + "ms");
                log.Information("  State at timeout:");
                log.Information("    Found advice: " + self.state.foundAdviceItems.length);
                log.Information("    Paused advice: " + self.state.pausedAdviceItems.length);
                log.Information("    Errors: " + self.state.errors.length);
            }
            self.complete(false, 'Advice pause operation timed out after ' + self.config.timeout + 'ms');
        }, self.config.timeout);
        
        // Execute pause process with timeout cleanup
        self.pauseAdvice(function(success, message) {
            clearTimeout(timeoutId);
            
            if (typeof log !== 'undefined' && log.Information) {
                log.Information("AdvicePauseManager - Pause process completed");
                log.Information("  Success: " + success);
                log.Information("  Message: " + message);
                log.Information("  Total Duration: " + (new Date() - startTime) + "ms");
            }
            
            self.complete(success, message);
        });
    };
    
    /**
     * Validate input parameters
     */
    self.validateInputs = function() {
        // Get work item ID from context
        self.state.workItemId = self.context.workItemId || 
                              (self.context.inputs ? self.context.inputs.workItemId : null);
        
        if (!self.state.workItemId) {
            self.state.errors.push('Work item ID is required');
            return false;
        }
        
        if (!self.config.abstractAdviceTypeSystemName) {
            self.state.errors.push('Abstract advice type system name is required');
            return false;
        }
        
        return true;
    };
    
    /**
     * Execute the advice pause process
     */
    self.pauseAdvice = function(callback) {
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdvicePauseManager - Starting advice discovery for Work Item " + self.state.workItemId);
        }
        
        // Step 1: Find active advice items
        self.lifecycleService.findActiveAdvice(self.state.workItemId, function(success, adviceItems) {
            if (!success) {
                self.state.errors.push('Failed to find active advice: ' + adviceItems);
                callback(false, 'Failed to find active advice');
                return;
            }
            
            self.state.foundAdviceItems = adviceItems || [];
            
            if (typeof log !== 'undefined' && log.Information) {
                log.Information("AdvicePauseManager - Found " + self.state.foundAdviceItems.length + " active advice items");
            }
            
            if (self.state.foundAdviceItems.length === 0) {
                // No advice to pause
                if (typeof log !== 'undefined' && log.Information) {
                    log.Information("AdvicePauseManager - No active advice found to pause");
                }
                callback(true, 'No active advice found to pause');
                return;
            }
            
            // Step 2: Get detailed information for each advice item
            self.getAdviceDetails(function(detailsSuccess) {
                if (!detailsSuccess) {
                    callback(false, 'Failed to get advice details');
                    return;
                }
                
                // Step 3: Save advice state if configured
                if (self.config.saveAdviceState) {
                    self.saveAdviceState(function(saveSuccess) {
                        if (!saveSuccess) {
                            callback(false, 'Failed to save advice state');
                            return;
                        }
                        
                        // Step 4: Move advice items to paused phase
                        self.moveAdviceItemsToPhase(callback);
                    });
                } else {
                    // Skip saving state, go directly to moving advice
                    self.moveAdviceItemsToPhase(callback);
                }
            });
        });
    };
    
    /**
     * Get detailed information for all advice items
     */
    self.getAdviceDetails = function(callback) {
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdvicePauseManager - Getting detailed information for " + self.state.foundAdviceItems.length + " advice items");
        }
        
        var completedCount = 0;
        var totalCount = self.state.foundAdviceItems.length;
        var hasErrors = false;
        
        self.state.foundAdviceItems.forEach(function(adviceItem, index) {
            self.lifecycleService.getAdviceDetails(adviceItem.id, function(success, detailedAdvice) {
                completedCount++;
                
                if (success) {
                    // Replace the basic item with detailed information
                    self.state.foundAdviceItems[index] = detailedAdvice;
                    
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdvicePauseManager - Got details for advice: " + detailedAdvice.title + " (ID: " + detailedAdvice.id + ")");
                    }
                } else {
                    hasErrors = true;
                    self.state.errors.push('Failed to get details for advice ' + adviceItem.id + ': ' + detailedAdvice);
                    
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdvicePauseManager - Failed to get details for advice " + adviceItem.id + ": " + detailedAdvice);
                    }
                }
                
                // Check if all completed
                if (completedCount === totalCount) {
                    callback(!hasErrors);
                }
            });
        });
    };
    
    /**
     * Save advice state to work item attributes
     */
    self.saveAdviceState = function(callback) {
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdvicePauseManager - Saving advice state for " + self.state.foundAdviceItems.length + " items");
        }
        
        self.lifecycleService.saveAdviceState(self.state.workItemId, self.state.foundAdviceItems, function(success, result) {
            if (success) {
                self.state.savedStateSuccess = true;
                
                if (typeof log !== 'undefined' && log.Information) {
                    log.Information("AdvicePauseManager - Successfully saved advice state");
                }
            } else {
                self.state.errors.push('Failed to save advice state: ' + result);
                
                if (typeof log !== 'undefined' && log.Information) {
                    log.Information("AdvicePauseManager - Failed to save advice state: " + result);
                }
            }
            
            callback(success);
        });
    };
    
    /**
     * Move advice items to paused phase
     */
    self.moveAdviceItemsToPhase = function(callback) {
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdvicePauseManager - Moving " + self.state.foundAdviceItems.length + " advice items to phase: " + self.config.pausedPhase);
        }
        
        var completedCount = 0;
        var totalCount = self.state.foundAdviceItems.length;
        var hasErrors = false;
        
        self.state.foundAdviceItems.forEach(function(adviceItem) {
            self.lifecycleService.moveAdviceToPhase(adviceItem.id, self.config.pausedPhase, function(success, result) {
                completedCount++;
                
                if (success) {
                    self.state.pausedAdviceItems.push({
                        id: adviceItem.id,
                        title: adviceItem.title,
                        originalPhase: adviceItem.phase,
                        newPhase: self.config.pausedPhase
                    });
                    
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdvicePauseManager - Successfully moved advice " + adviceItem.id + " to " + self.config.pausedPhase + " phase");
                    }
                } else {
                    hasErrors = true;
                    self.state.errors.push('Failed to move advice ' + adviceItem.id + ' to phase: ' + result);
                    
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdvicePauseManager - Failed to move advice " + adviceItem.id + " to phase: " + result);
                    }
                }
                
                // Check if all completed
                if (completedCount === totalCount) {
                    var overallSuccess = !hasErrors && self.state.pausedAdviceItems.length > 0;
                    var message = overallSuccess ? 
                        'Successfully paused ' + self.state.pausedAdviceItems.length + ' advice items' :
                        'Failed to pause some or all advice items';
                    
                    callback(overallSuccess, message);
                }
            });
        });
    };
    
    /**
     * Complete the action
     */
    self.complete = function(success, message) {
        var duration = new Date() - self.state.startTime;
        
        // Prepare output
        var output = {
            success: success,
            message: message,
            workItemId: self.state.workItemId,
            foundAdviceCount: self.state.foundAdviceItems.length,
            pausedAdviceCount: self.state.pausedAdviceItems.length,
            savedState: self.state.savedStateSuccess,
            errors: self.state.errors,
            duration: duration,
            pausedAdviceItems: self.state.pausedAdviceItems
        };
        
        // Log completion using log.Information
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdvicePauseManager - EXECUTION COMPLETED for Work Item " + self.state.workItemId);
            log.Information("  Success: " + success);
            log.Information("  Message: " + message);
            log.Information("  Found Advice Count: " + output.foundAdviceCount);
            log.Information("  Paused Advice Count: " + output.pausedAdviceCount);
            log.Information("  Saved State: " + output.savedState);
            log.Information("  Errors: " + output.errors.length);
            log.Information("  Duration: " + duration + "ms");
        }
        
        // Determine branch
        var branch = success ? 'success' : 'error';
        if (success && output.pausedAdviceCount === 0) {
            branch = 'noAdvice';
        }
        
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdvicePauseManager - Taking '" + branch + "' branch");
        }
        
        // Call workflow callback
        if (self.callback) {
            self.callback({
                branch: branch,
                outputs: output
            });
        }
    };
    
    // Auto-execute on instantiation
    self.execute();
};