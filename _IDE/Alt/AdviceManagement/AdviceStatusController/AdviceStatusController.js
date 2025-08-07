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
            self.log('info', 'Current advice status', { status: status });
            callback(true, status);
        });
    };
    
    /**
     * Determine action based on conditions
     */
    self.determineAction = function(currentStatus) {
        // Check conditions
        for (var i = 0; i < self.config.conditions.length; i++) {
            var condition = self.config.conditions[i];
            
            if (condition.when === currentStatus || condition.when === '*') {
                self.log('info', 'Condition matched', condition);
                return condition.then;
            }
        }
        
        // Use default action if no condition matches
        self.log('info', 'No condition matched, using default action', { 
            defaultAction: self.config.defaultAction 
        });
        return self.config.defaultAction;
    };
    
    /**
     * Execute the determined action
     */
    self.executeAction = function(action, callback) {
        self.log('info', 'Executing action', { action: action });
        
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
                    callback(true, 'Advice paused successfully');
                } else {
                    self.log('error', 'Failed to pause advice', { error: data });
                    self.errors.push('Failed to pause: ' + data);
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
                    callback(true, 'Advice resumed successfully');
                } else {
                    self.log('error', 'Failed to resume advice', { error: data });
                    self.errors.push('Failed to resume: ' + data);
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
        
        // Prepare output
        var output = {
            success: success,
            actionTaken: self.state.actionTaken,
            previousStatus: self.state.previousStatus,
            currentStatus: self.state.currentStatus,
            message: message,
            errors: self.errors,
            logs: self.state.logs,
            duration: duration
        };
        
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