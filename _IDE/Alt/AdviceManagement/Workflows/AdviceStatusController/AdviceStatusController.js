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
 * AdviceStatusController - Workflow action for conditional advice status management
 * @param {Object} context - Workflow execution context
 * @param {Object} configuration - Action configuration
 * @param {Function} callback - Completion callback
 */
Alt.AdviceManagement.AdviceStatusController = function(context, configuration, callback) {
    var self = this;
    
    // Default configuration
    var defaults = {
        defaultAction: 'checkOnly',
        conditions: [],
        pauseReason: 'Workflow automated pause',
        requireConfirmation: false,
        enableLogging: true,
        retryOnFailure: true,
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000
    };
    
    // Merge configuration
    self.config = $.extend(true, {}, defaults, configuration);
    self.context = context;
    self.callback = callback;
    
    // Initialize service
    self.adviceService = new Alt.AdviceManagement.AdviceService();
    
    // State tracking
    self.state = {
        workItemId: null,
        previousStatus: null,
        currentStatus: null,
        actionTaken: 'none',
        attempts: 0,
        startTime: new Date(),
        logs: []
    };
    
    // Error tracking
    self.errors = [];
    
    /**
     * Log message with level
     */
    self.log = function(level, message, data) {
        if (self.config.enableLogging) {
            var logEntry = {
                timestamp: new Date().toISOString(),
                level: level,
                message: message,
                data: data || {}
            };
            self.state.logs.push(logEntry);
            
            // Console output for debugging
            console.log('[AdviceStatusController]', level.toUpperCase(), message, data || '');
        }
    };
    
    /**
     * Execute the workflow action
     */
    self.execute = function() {
        self.log('info', 'Starting advice status controller', {
            config: self.config,
            context: self.context
        });
        
        // Log initial input mappings using Log.Information
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceStatusController - Starting execution with inputs:");
            log.Information("  Context: " + JSON.stringify(self.context));
            log.Information("  Configuration: " + JSON.stringify(self.config));
            if (self.context.workItemId) {
                log.Information("  Work Item ID: " + self.context.workItemId);
            }
            if (self.context.inputs) {
                log.Information("  Input Variables: " + JSON.stringify(self.context.inputs));
            }
        }
        
        // Validate inputs
        if (!self.validateInputs()) {
            return self.complete(false, 'Invalid input parameters');
        }
        
        // Set timeout
        var timeoutId = setTimeout(function() {
            self.log('error', 'Action timeout exceeded', { timeout: self.config.timeout });
            self.complete(false, 'Operation timed out');
        }, self.config.timeout);
        
        // Execute with retry logic
        self.executeWithRetry(function(success, message) {
            clearTimeout(timeoutId);
            self.complete(success, message);
        });
    };
    
    /**
     * Validate input parameters
     */
    self.validateInputs = function() {
        // Get work item ID from context
        self.state.workItemId = self.context.workItemId || self.context.inputs?.workItemId;
        
        if (!self.state.workItemId) {
            self.log('error', 'No work item ID provided');
            self.errors.push('Work item ID is required');
            return false;
        }
        
        // Validate configuration
        if (!Array.isArray(self.config.conditions)) {
            self.log('error', 'Invalid conditions configuration');
            self.errors.push('Conditions must be an array');
            return false;
        }
        
        return true;
    };
    
    /**
     * Execute with retry logic
     */
    self.executeWithRetry = function(callback) {
        self.state.attempts++;
        
        self.log('info', 'Attempt ' + self.state.attempts + ' of ' + self.config.maxRetries);
        
        // Log retry attempt using Log.Information
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceStatusController - Retry attempt " + self.state.attempts + " of " + self.config.maxRetries + " for Work Item " + self.state.workItemId);
        }
        
        // Check current status
        self.checkAdviceStatus(function(success, status) {
            if (!success) {
                // Handle retry
                if (self.config.retryOnFailure && self.state.attempts < self.config.maxRetries) {
                    self.log('warn', 'Retrying after failure', { 
                        attempt: self.state.attempts,
                        delay: self.config.retryDelay 
                    });
                    
                    setTimeout(function() {
                        self.executeWithRetry(callback);
                    }, self.config.retryDelay * self.state.attempts); // Exponential backoff
                } else {
                    callback(false, 'Failed to check advice status after ' + self.state.attempts + ' attempts');
                }
                return;
            }
            
            // Store previous status
            self.state.previousStatus = status;
            
            // Determine action based on conditions
            var action = self.determineAction(status);
            
            self.log('info', 'Determined action', { 
                status: status, 
                action: action 
            });
            
            // Log action determination using Log.Information
            if (typeof log !== 'undefined' && log.Information) {
                log.Information("AdviceStatusController - Action determined for Work Item " + self.state.workItemId + ":");
                log.Information("  Current Status: " + status);
                log.Information("  Action to Execute: " + action);
                log.Information("  Based on Conditions: " + JSON.stringify(self.config.conditions));
            }
            
            // Execute action
            self.executeAction(action, callback);
        });
    };
    
    /**
     * Check current advice status
     */
    self.checkAdviceStatus = function(callback) {
        self.log('info', 'Checking advice status', { workItemId: self.state.workItemId });
        
        self.adviceService.getAdviceStatus(self.state.workItemId, function(success, data) {
            if (!success) {
                self.log('error', 'Failed to get advice status', { error: data });
                callback(false, null);
                return;
            }
            
            var status = data.status || 'none';
            
            // Store date information from the service response
            self.state.pausedDate = data.pausedDate;
            self.state.resumedDate = data.resumedDate;
            self.state.lastActionDate = data.lastActionDate;
            
            // Log received data including date fields using Log.Information
            if (typeof log !== 'undefined' && log.Information) {
                log.Information("AdviceStatusController - Received status data for Work Item {WorkItemId}:", self.state.workItemId);
                log.Information("  status: {Status}", data.status);
                if (data.pausedDate) {
                    log.Information("  pausedDate: {PausedDate} (type: {PausedDateType})", 
                        data.pausedDate, typeof data.pausedDate);
                }
                if (data.resumedDate) {
                    log.Information("  resumedDate: {ResumedDate} (type: {ResumedDateType})", 
                        data.resumedDate, typeof data.resumedDate);
                }
                if (data.lastActionDate) {
                    log.Information("  lastActionDate: {LastActionDate} (type: {LastActionDateType})", 
                        data.lastActionDate, typeof data.lastActionDate);
                }
                log.Information("  Full data object: {Data}", JSON.stringify(data));
            }
            
            self.log('info', 'Current advice status', { status: status, fullData: data });
            callback(true, status);
        });
    };
    
    /**
     * Determine action based on conditions
     */
    self.determineAction = function(currentStatus) {
        // Log condition evaluation using Log.Information
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceStatusController - Evaluating conditions for status '" + currentStatus + "' on Work Item " + self.state.workItemId);
            log.Information("  Available conditions: " + JSON.stringify(self.config.conditions));
        }
        
        // Check conditions
        for (var i = 0; i < self.config.conditions.length; i++) {
            var condition = self.config.conditions[i];
            
            if (condition.when === currentStatus || condition.when === '*') {
                self.log('info', 'Condition matched', condition);
                
                // Log matched condition using Log.Information
                if (typeof log !== 'undefined' && log.Information) {
                    log.Information("  ✓ Condition matched: when='" + condition.when + "' then='" + condition.then + "'");
                }
                
                return condition.then;
            }
        }
        
        // Use default action if no condition matches
        self.log('info', 'No condition matched, using default action', { 
            defaultAction: self.config.defaultAction 
        });
        
        // Log default action usage using Log.Information
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("  No conditions matched, using default action: " + self.config.defaultAction);
        }
        
        return self.config.defaultAction;
    };
    
    /**
     * Execute the determined action
     */
    self.executeAction = function(action, callback) {
        self.log('info', 'Executing action', { action: action });
        
        // Log action execution using Log.Information
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceStatusController - Executing action '" + action + "' for Work Item " + self.state.workItemId);
            log.Information("  Previous Status: " + self.state.previousStatus);
        }
        
        switch(action) {
            case 'pause':
                self.pauseAdvice(callback);
                break;
                
            case 'resume':
                self.resumeAdvice(callback);
                break;
                
            case 'toggle':
                self.toggleAdvice(callback);
                break;
                
            case 'checkOnly':
            case 'doNothing':
            default:
                self.state.actionTaken = 'none';
                self.state.currentStatus = self.state.previousStatus;
                callback(true, 'No action taken');
                break;
        }
    };
    
    /**
     * Pause advice
     */
    self.pauseAdvice = function(callback) {
        // Check if already paused
        if (self.state.previousStatus === 'paused') {
            self.log('info', 'Advice already paused');
            self.state.actionTaken = 'none';
            self.state.currentStatus = 'paused';
            callback(true, 'Advice was already paused');
            return;
        }
        
        // Confirm if required
        if (self.config.requireConfirmation && !self.confirmAction('pause')) {
            self.state.actionTaken = 'none';
            self.state.currentStatus = self.state.previousStatus;
            callback(true, 'Pause action cancelled by user');
            return;
        }
        
        self.log('info', 'Pausing advice', { 
            workItemId: self.state.workItemId,
            reason: self.config.pauseReason 
        });
        
        self.adviceService.pauseAdvice(
            self.state.workItemId, 
            self.config.pauseReason,
            function(success, data) {
                if (success) {
                    self.state.actionTaken = 'paused';
                    self.state.currentStatus = 'paused';
                    self.log('info', 'Advice paused successfully');
                    
                    // Log successful pause using Log.Information
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdviceStatusController - Successfully paused advice for Work Item " + self.state.workItemId);
                        log.Information("  Pause Reason: " + self.config.pauseReason);
                        log.Information("  Response Data: " + JSON.stringify(data));
                    }
                    
                    callback(true, 'Advice paused successfully');
                } else {
                    self.log('error', 'Failed to pause advice', { error: data });
                    self.errors.push('Failed to pause: ' + data);
                    
                    // Log pause failure using Log.Information
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdviceStatusController - Failed to pause advice for Work Item {WorkItemId}: {Error}", 
                            self.state.workItemId, data);
                    }
                    
                    callback(false, 'Failed to pause advice');
                }
            }
        );
    };
    
    /**
     * Resume advice
     */
    self.resumeAdvice = function(callback) {
        // Check if already active
        if (self.state.previousStatus === 'active') {
            self.log('info', 'Advice already active');
            self.state.actionTaken = 'none';
            self.state.currentStatus = 'active';
            callback(true, 'Advice was already active');
            return;
        }
        
        // Confirm if required
        if (self.config.requireConfirmation && !self.confirmAction('resume')) {
            self.state.actionTaken = 'none';
            self.state.currentStatus = self.state.previousStatus;
            callback(true, 'Resume action cancelled by user');
            return;
        }
        
        self.log('info', 'Resuming advice', { workItemId: self.state.workItemId });
        
        self.adviceService.resumeAdvice(
            self.state.workItemId,
            function(success, data) {
                if (success) {
                    self.state.actionTaken = 'resumed';
                    self.state.currentStatus = 'active';
                    self.log('info', 'Advice resumed successfully');
                    
                    // Log successful resume using Log.Information
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdviceStatusController - Successfully resumed advice for Work Item " + self.state.workItemId);
                        log.Information("  Response Data: " + JSON.stringify(data));
                    }
                    
                    callback(true, 'Advice resumed successfully');
                } else {
                    self.log('error', 'Failed to resume advice', { error: data });
                    self.errors.push('Failed to resume: ' + data);
                    
                    // Log resume failure using Log.Information
                    if (typeof log !== 'undefined' && log.Information) {
                        log.Information("AdviceStatusController - Failed to resume advice for Work Item {WorkItemId}: {Error}", 
                            self.state.workItemId, data);
                    }
                    
                    callback(false, 'Failed to resume advice');
                }
            }
        );
    };
    
    /**
     * Toggle advice status
     */
    self.toggleAdvice = function(callback) {
        if (self.state.previousStatus === 'paused') {
            self.resumeAdvice(callback);
        } else if (self.state.previousStatus === 'active') {
            self.pauseAdvice(callback);
        } else {
            // If no status, default to pause
            self.pauseAdvice(callback);
        }
    };
    
    /**
     * Confirm action with user
     */
    self.confirmAction = function(action) {
        // In workflow context, confirmation might be handled differently
        // For now, return true if no UI available
        if (typeof window !== 'undefined' && window.confirm) {
            return window.confirm('Are you sure you want to ' + action + ' the advice?');
        }
        return true;
    };
    
    /**
     * Complete the action
     */
    self.complete = function(success, message) {
        var duration = new Date() - self.state.startTime;
        
        self.log('info', 'Action completed', {
            success: success,
            message: message,
            duration: duration + 'ms',
            actionTaken: self.state.actionTaken
        });
        
        // Prepare output with proper ShareDo data types
        var output = {
            success: success,
            actionTaken: self.state.actionTaken,
            previousStatus: self.state.previousStatus,
            currentStatus: self.state.currentStatus,
            message: message,
            errors: self.errors,
            logs: self.state.logs,
            duration: duration,
            // Add date fields with proper DateTime objects
            pausedDate: self.state.pausedDate || null,
            resumedDate: self.state.resumedDate || null,
            lastActionDate: new Date() // Current action date as DateTime
        };
        
        // Log field mappings using Log.Information BEFORE determining branch
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceStatusController - COMPLETE: Field Mappings for Work Item {WorkItemId}:", self.state.workItemId);
            log.Information("  === OUTPUT VARIABLES ===");
            log.Information("    success: {Success} (type: {SuccessType})", output.success, typeof output.success);
            log.Information("    actionTaken: '{ActionTaken}' (type: {ActionTakenType})", output.actionTaken, typeof output.actionTaken);
            log.Information("    previousStatus: '{PreviousStatus}' (type: {PreviousStatusType})", output.previousStatus, typeof output.previousStatus);
            log.Information("    currentStatus: '{CurrentStatus}' (type: {CurrentStatusType})", output.currentStatus, typeof output.currentStatus);
            log.Information("    message: '{Message}' (type: {MessageType})", output.message, typeof output.message);
            log.Information("    errors count: {ErrorCount}", output.errors.length);
            log.Information("    duration: {Duration}ms", duration);
            
            // Log date fields with type information
            if (output.pausedDate) {
                log.Information("    pausedDate: {PausedDate} (type: {PausedDateType})", output.pausedDate, typeof output.pausedDate);
            } else {
                log.Information("    pausedDate: null");
            }
            if (output.resumedDate) {
                log.Information("    resumedDate: {ResumedDate} (type: {ResumedDateType})", output.resumedDate, typeof output.resumedDate);
            } else {
                log.Information("    resumedDate: null");
            }
            log.Information("    lastActionDate: {LastActionDate} (type: {LastActionDateType})", output.lastActionDate, typeof output.lastActionDate);
            
            log.Information("  === EXECUTION SUMMARY ===");
            log.Information("    Total attempts: {Attempts}", self.state.attempts);
            log.Information("    Execution time: {Duration}ms", duration);
            log.Information("    Configuration used:");
            log.Information("      defaultAction: {DefaultAction}", self.config.defaultAction);
            log.Information("      conditions: {Conditions}", JSON.stringify(self.config.conditions));
            log.Information("      pauseReason: {PauseReason}", self.config.pauseReason);
            log.Information("      requireConfirmation: {RequireConfirmation}", self.config.requireConfirmation);
        }
        
        // Determine branch
        var branch = 'noAction';
        if (!success) {
            branch = 'error';
        } else if (self.state.actionTaken === 'paused') {
            branch = 'paused';
        } else if (self.state.actionTaken === 'resumed') {
            branch = 'resumed';
        } else if (success) {
            branch = 'success';
        }
        
        // Log which branch is being taken with detailed reasoning
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("  === BRANCH DECISION ===");
            log.Information("  Branch Selection Logic:");
            log.Information("    success: {Success}", success);
            log.Information("    actionTaken: '{ActionTaken}'", self.state.actionTaken);
            log.Information("  → Selected Branch: '{Branch}'", branch);
            log.Information("  Workflow will continue via '{Branch}' outlet for Work Item {WorkItemId}", branch, self.state.workItemId);
            log.Information("AdviceStatusController - EXECUTION COMPLETED for Work Item {WorkItemId} - Branch: {Branch}", self.state.workItemId, branch);
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

/**
 * Static method for workflow designer
 */
Alt.AdviceManagement.AdviceStatusController.getMetadata = function() {
    return {
        name: 'Advice Status Controller',
        description: 'Controls advice status based on conditions',
        icon: 'fa-code-fork',
        color: '#17a2b8'
    };
};