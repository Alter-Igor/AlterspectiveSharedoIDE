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
 * AdviceResumeManager - Workflow action for comprehensive advice resume management
 * @param {Object} context - Workflow execution context
 * @param {Object} configuration - Action configuration
 * @param {Function} callback - Completion callback
 */
Alt.AdviceManagement.AdviceResumeManager = function(context, configuration, callback) {
    var self = this;
    
    // Default configuration
    var defaults = {
        abstractAdviceTypeSystemName: 'AbstractAdvice',
        defaultAdviceTypeSystemName: 'StandardAdvice',
        activePhase: 'Active',
        pausedPhase: 'Removed',
        newAdviceDueDate: null, // If null, will use saved date or default offset
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
        defaultAdviceTypeSystemName: self.config.defaultAdviceTypeSystemName,
        phases: {
            active: self.config.activePhase,
            paused: 'Paused',
            removed: self.config.pausedPhase
        }
    });
    
    self.lifecycleService = new Alt.AdviceManagement.Services.AdviceLifecycleService(lifecycleConfig);
    
    // State tracking
    self.state = {
        workItemId: null,
        savedAdviceState: null,
        restoredAdviceItems: [],
        createdAdviceItems: [],
        resumeApproach: null, // 'restore' or 'create'
        errors: [],
        startTime: new Date()
    };
    
    /**
     * Execute the workflow action
     */
    self.execute = function() {
        // Log initial execution using log.Information
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceResumeManager - Starting advice resume process");
            log.Information("  Context: " + JSON.stringify(self.context));
            log.Information("  Configuration: " + JSON.stringify(self.config));
        }
        
        // Validate inputs
        if (!self.validateInputs()) {
            return self.complete(false, 'Invalid input parameters');
        }
        
        // Set timeout
        var timeoutId = setTimeout(function() {
            self.complete(false, 'Advice resume operation timed out');
        }, self.config.timeout);
        
        // Execute resume process
        self.resumeAdvice(function(success, message) {
            clearTimeout(timeoutId);
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
        
        if (!self.config.defaultAdviceTypeSystemName) {
            self.state.errors.push('Default advice type system name is required');
            return false;
        }
        
        return true;
    };
    
    /**
     * Execute the advice resume process
     */
    self.resumeAdvice = function(callback) {
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceResumeManager - Checking for saved advice state for Work Item " + self.state.workItemId);
        }
        
        // Step 1: Check for saved advice state
        self.lifecycleService.getSavedAdviceState(self.state.workItemId, function(success, savedState) {
            if (!success) {
                self.state.errors.push('Failed to check saved advice state: ' + savedState);
                callback(false, 'Failed to check saved advice state');
                return;
            }
            
            self.state.savedAdviceState = savedState;
            
            if (savedState && savedState.items && savedState.items.length > 0) {
                // Restore from saved state
                self.state.resumeApproach = 'restore';
                
                if (typeof log !== 'undefined' && log.Information) {
                    log.Information("AdviceResumeManager - Found saved advice state with " + savedState.items.length + " items, restoring advice");
                }
                
                self.restoreAdviceFromState(callback);
            } else {
                // Create default advice
                self.state.resumeApproach = 'create';
                
                if (typeof log !== 'undefined' && log.Information) {
                    log.Information("AdviceResumeManager - No saved advice state found, creating default advice");
                }
                
                self.createDefaultAdvice(callback);
            }
        });
    };
    
    /**
     * Restore advice items from saved state
     */
    self.restoreAdviceFromState = function(callback) {
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceResumeManager - Restoring " + self.state.savedAdviceState.items.length + " advice items from saved state");
        }
        
        var completedCount = 0;
        var totalCount = self.state.savedAdviceState.items.length;
        var hasErrors = false;
        
        self.state.savedAdviceState.items.forEach(function(savedItem) {
            // Prepare advice data with updated due date
            var adviceData = {
                title: savedItem.title,
                description: savedItem.description,
                dueDate: self.getResumeDueDate(savedItem.dueDate),
                priority: savedItem.priority,
                assignedTo: savedItem.assignedTo
            };
            
            // Add custom attributes if they exist
            if (savedItem.customAttributes) {
                adviceData.attributes = savedItem.customAttributes;
                
                // Update due date attribute if configured
                if (self.lifecycleService.config.config.dateHandling.dueDateAttribute) {
                    adviceData.attributes[self.lifecycleService.config.config.dateHandling.dueDateAttribute] = adviceData.dueDate;
                }
            }
            
            if (typeof log !== 'undefined' && log.Information) {
                log.Information("AdviceResumeManager - Restoring advice: " + savedItem.title + " (Type: " + savedItem.workTypeSystemName + ")");
                log.Information("  Original Due Date: " + savedItem.dueDate);
                log.Information("  New Due Date: " + adviceData.dueDate);
            }
            
            self.lifecycleService.createAdvice(self.state.workItemId, savedItem.workTypeSystemName, adviceData, function(success, result) {
                completedCount++;
                
                if (success) {
                    self.state.restoredAdviceItems.push({
                        id: result.id,
                        title: result.title,
                        workTypeSystemName: savedItem.workTypeSystemName,
                        originalId: savedItem.workItemId,
                        dueDate: adviceData.dueDate
                    });
                    
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdviceResumeManager - Successfully restored advice: " + result.id);
                    }
                } else {
                    hasErrors = true;
                    self.state.errors.push('Failed to restore advice "' + savedItem.title + '": ' + result);
                    
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdviceResumeManager - Failed to restore advice: " + savedItem.title + " - " + result);
                    }
                }
                
                // Check if all completed
                if (completedCount === totalCount) {
                    if (self.state.restoredAdviceItems.length > 0) {
                        // Clear saved state after successful restoration
                        self.clearSavedState(function() {
                            var message = 'Successfully restored ' + self.state.restoredAdviceItems.length + ' advice items';
                            callback(!hasErrors, message);
                        });
                    } else {
                        callback(false, 'Failed to restore any advice items');
                    }
                }
            });
        });
    };
    
    /**
     * Create default advice when no saved state exists
     */
    self.createDefaultAdvice = function(callback) {
        var adviceData = {
            title: "Ongoing Advice",
            description: "Default ongoing advice created on resume",
            dueDate: self.getResumeDueDate()
        };
        
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceResumeManager - Creating default advice of type: " + self.config.defaultAdviceTypeSystemName);
            log.Information("  Due Date: " + adviceData.dueDate);
        }
        
        self.lifecycleService.createAdvice(self.state.workItemId, self.config.defaultAdviceTypeSystemName, adviceData, function(success, result) {
            if (success) {
                self.state.createdAdviceItems.push({
                    id: result.id,
                    title: result.title,
                    workTypeSystemName: self.config.defaultAdviceTypeSystemName,
                    dueDate: adviceData.dueDate
                });
                
                if (typeof log !== 'undefined' && log.Information) {
                    log.Information("AdviceResumeManager - Successfully created default advice: " + result.id);
                }
                
                callback(true, 'Successfully created default advice');
            } else {
                self.state.errors.push('Failed to create default advice: ' + result);
                
                if (typeof log !== 'undefined' && log.Information) {
                    log.Information("AdviceResumeManager - Failed to create default advice: " + result);
                }
                
                callback(false, 'Failed to create default advice');
            }
        });
    };
    
    /**
     * Get the due date for resumed advice
     */
    self.getResumeDueDate = function(originalDueDate) {
        // Use configured new due date if provided
        if (self.config.newAdviceDueDate) {
            return self.config.newAdviceDueDate;
        }
        
        // Use original due date if configured to preserve dates
        if (originalDueDate && self.lifecycleService.config.config.dateHandling.preserveOriginalDates) {
            return originalDueDate;
        }
        
        // Use default offset from current date
        return self.lifecycleService.config.getDefaultAdviceDueDate();
    };
    
    /**
     * Clear saved advice state
     */
    self.clearSavedState = function(callback) {
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceResumeManager - Clearing saved advice state");
        }
        
        self.lifecycleService.clearSavedAdviceState(self.state.workItemId, function(success, result) {
            if (!success) {
                if (typeof log !== 'undefined' && log.Information) {
                    log.Information("AdviceResumeManager - Warning: Failed to clear saved state: " + result);
                }
            }
            // Continue regardless of clear state success
            callback();
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
            resumeApproach: self.state.resumeApproach,
            restoredAdviceCount: self.state.restoredAdviceItems.length,
            createdAdviceCount: self.state.createdAdviceItems.length,
            totalAdviceCount: self.state.restoredAdviceItems.length + self.state.createdAdviceItems.length,
            hadSavedState: self.state.savedAdviceState !== null,
            errors: self.state.errors,
            duration: duration,
            restoredAdviceItems: self.state.restoredAdviceItems,
            createdAdviceItems: self.state.createdAdviceItems
        };
        
        // Log completion using log.Information
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceResumeManager - EXECUTION COMPLETED for Work Item " + self.state.workItemId);
            log.Information("  Success: " + success);
            log.Information("  Message: " + message);
            log.Information("  Resume Approach: " + output.resumeApproach);
            log.Information("  Restored Advice Count: " + output.restoredAdviceCount);
            log.Information("  Created Advice Count: " + output.createdAdviceCount);
            log.Information("  Total Advice Count: " + output.totalAdviceCount);
            log.Information("  Had Saved State: " + output.hadSavedState);
            log.Information("  Errors: " + output.errors.length);
            log.Information("  Duration: " + duration + "ms");
        }
        
        // Determine branch
        var branch = success ? 'success' : 'error';
        if (success && output.resumeApproach === 'restore') {
            branch = 'restored';
        } else if (success && output.resumeApproach === 'create') {
            branch = 'created';
        }
        
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceResumeManager - Taking '" + branch + "' branch");
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