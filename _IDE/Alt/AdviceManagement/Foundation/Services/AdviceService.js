namespace("Alt.AdviceManagement");

/**
 * AdviceService - Service layer for advice management API calls
 */
Alt.AdviceManagement.AdviceService = function() {
    var self = this;
    
    // Use common constants
    var Constants = Alt.AdviceManagement.Common.Constants;
    var Cache = Alt.AdviceManagement.Common.CacheManager;
    var EventBus = Alt.AdviceManagement.Common.EventBus;
    
    // Configuration from constants
    self.config = {
        baseUrl: Constants.API.BASE_URL,
        timeout: Constants.API.TIMEOUT,
        retryAttempts: Constants.API.RETRY_ATTEMPTS,
        retryDelay: Constants.API.RETRY_DELAY
    };
    
    /**
     * Get advice status for a work item
     */
    self.getAdviceStatus = function(workItemId, callback) {
        if (!workItemId) {
            callback(false, 'Work item ID is required');
            return;
        }
        
        // Check cache
        var cached = self.getCachedStatus(workItemId);
        if (cached) {
            callback(true, cached);
            return;
        }
        
        // Make API call
        self.makeRequest({
            url: self.config.baseUrl + '/workItem/' + workItemId + '/attributes',
            method: 'GET',
            success: function(response) {
                // Log the raw response structure for debugging
                if ($ui && $ui.log && $ui.log.debug) {
                    $ui.log.debug("AdviceService - Raw API response for Work Item " + workItemId + ":");
                    $ui.log.debug("  Response structure: " + JSON.stringify({
                        hasStatus: !!response.status,
                        hasSuccess: !!response.success,
                        hasBody: !!response.body,
                        hasAttributes: !!response.attributes,
                        bodyType: typeof response.body,
                        topLevelKeys: Object.keys(response)
                    }));
                    $ui.log.debug("  Full response (first 500 chars): " + JSON.stringify(response).substring(0, 500));
                }
                
                var status = self.extractAdviceStatus(response);
                
                // Log the extracted status for debugging
                if ($ui && $ui.log && $ui.log.debug) {
                    $ui.log.debug("AdviceService - Extracted status for Work Item " + workItemId + ":");
                    $ui.log.debug("  Status: " + status.status);
                    $ui.log.debug("  Paused Date: " + status.pausedDate);
                    $ui.log.debug("  Paused By: " + status.pausedBy);
                    $ui.log.debug("  Paused Reason: " + status.pausedReason);
                    $ui.log.debug("  Resumed Date: " + status.resumedDate);
                    $ui.log.debug("  Next Advice Date: " + status.nextAdviceDate);
                }
                
                self.cacheStatus(workItemId, status);
                callback(true, status);
            },
            error: function(error) {
                console.error('Failed to get advice status:', error);
                callback(false, error.message || 'Failed to retrieve advice status');
            }
        });
    };
    
    /**
     * Pause advice for a work item
     * Enhanced to support workflow-based advice lifecycle management
     */
    self.pauseAdvice = function(workItemId, reason, configuration, callback) {
        // Handle optional configuration parameter
        if (typeof configuration === 'function') {
            callback = configuration;
            configuration = {};
        }
        
        if (!workItemId) {
            callback(false, 'Work item ID is required');
            return;
        }
        
        // Default configuration
        var config = $.extend(true, {
            useWorkflowApproach: true,
            pauseWorkflowId: 'AdvicePauseWorkflow',
            abstractAdviceTypeSystemName: 'AbstractAdvice',
            pausedPhase: 'Removed'
        }, configuration);
        
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceService - Pausing advice for Work Item " + workItemId);
            $ui.log.debug("  Use Workflow: " + config.useWorkflowApproach);
            $ui.log.debug("  Reason: " + reason);
        }
        
        if (config.useWorkflowApproach && typeof Alt !== 'undefined' && Alt.AdviceManagement && Alt.AdviceManagement.AdvicePauseManager) {
            // Use workflow approach for comprehensive advice management
            var pauseManager = new Alt.AdviceManagement.AdvicePauseManager({
                workItemId: workItemId,
                inputs: { workItemId: workItemId }
            }, {
                abstractAdviceTypeSystemName: config.abstractAdviceTypeSystemName,
                pausedPhase: config.pausedPhase,
                pauseReason: reason || 'Paused by workflow'
            }, function(result) {
                if (result.outputs.success) {
                    // Update advice status attributes
                    var attributes = {
                        'alt_ongoing_advice_enabled': 'false',
                        'alt_ongoing_advice_paused_date': new Date().toISOString(),
                        'alt_ongoing_advice_pause_reason': reason || 'Paused by workflow',
                        'alt_ongoing_advice_paused_by': self.getCurrentUser()
                    };
                    
                    self.updateAdviceAttributes(workItemId, attributes, function(success, data) {
                        if (success) {
                            self.clearCache(workItemId);
                            self.logAction('pause', workItemId, reason);
                            EventBus.publish(Constants.EVENTS.ADVICE_PAUSED, {
                                workItemId: workItemId,
                                reason: reason,
                                adviceCount: result.outputs.pausedAdviceCount
                            });
                        }
                        
                        var message = result.outputs.message + 
                                    (result.outputs.pausedAdviceCount > 0 ? 
                                     ' (' + result.outputs.pausedAdviceCount + ' advice items paused)' : '');
                        callback(success, success ? message : data);
                    });
                } else {
                    callback(false, result.outputs.message);
                }
            });
        } else {
            // Fallback to simple attribute-based approach
            var attributes = {
                'alt_ongoing_advice_enabled': 'false',
                'alt_ongoing_advice_paused_date': new Date().toISOString(),
                'alt_ongoing_advice_pause_reason': reason || 'Paused by workflow',
                'alt_ongoing_advice_paused_by': self.getCurrentUser()
            };
            
            self.updateAdviceAttributes(workItemId, attributes, function(success, data) {
                if (success) {
                    self.clearCache(workItemId);
                    self.logAction('pause', workItemId, reason);
                    EventBus.publish(Constants.EVENTS.ADVICE_PAUSED, {
                        workItemId: workItemId,
                        reason: reason
                    });
                }
                callback(success, data);
            });
        }
    };
    
    /**
     * Resume advice for a work item
     * Enhanced to support workflow-based advice lifecycle management
     */
    self.resumeAdvice = function(workItemId, newAdviceDueDate, configuration, callback) {
        // Handle optional parameters
        if (typeof newAdviceDueDate === 'function') {
            callback = newAdviceDueDate;
            newAdviceDueDate = null;
            configuration = {};
        } else if (typeof configuration === 'function') {
            callback = configuration;
            configuration = {};
        }
        
        if (!workItemId) {
            callback(false, 'Work item ID is required');
            return;
        }
        
        // Default configuration
        var config = $.extend(true, {
            useWorkflowApproach: true,
            resumeWorkflowId: 'AdviceResumeWorkflow',
            abstractAdviceTypeSystemName: 'AbstractAdvice',
            defaultAdviceTypeSystemName: 'StandardAdvice',
            activePhase: 'Active'
        }, configuration);
        
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceService - Resuming advice for Work Item " + workItemId);
            $ui.log.debug("  Use Workflow: " + config.useWorkflowApproach);
            $ui.log.debug("  New Due Date: " + newAdviceDueDate);
        }
        
        if (config.useWorkflowApproach && typeof Alt !== 'undefined' && Alt.AdviceManagement && Alt.AdviceManagement.AdviceResumeManager) {
            // Use workflow approach for comprehensive advice management
            var resumeManager = new Alt.AdviceManagement.AdviceResumeManager({
                workItemId: workItemId,
                inputs: { workItemId: workItemId }
            }, {
                abstractAdviceTypeSystemName: config.abstractAdviceTypeSystemName,
                defaultAdviceTypeSystemName: config.defaultAdviceTypeSystemName,
                activePhase: config.activePhase,
                newAdviceDueDate: newAdviceDueDate
            }, function(result) {
                if (result.outputs.success) {
                    // Update advice status attributes
                    var attributes = {
                        'alt_ongoing_advice_enabled': 'true',
                        'alt_ongoing_advice_resumed_date': new Date().toISOString(),
                        'alt_ongoing_advice_resumed_by': self.getCurrentUser(),
                        'alt_ongoing_advice_resume_reason': 'Resumed by workflow',
                        // Clear pause-related fields
                        'alt_ongoing_advice_pause_reason': '',
                        'alt_ongoing_advice_paused_date': '',
                        'alt_ongoing_advice_paused_by': ''
                    };
                    
                    // Set next advice date if provided
                    if (newAdviceDueDate) {
                        attributes['alt_ongoing_advice_next_date'] = newAdviceDueDate;
                    }
                    
                    self.updateAdviceAttributes(workItemId, attributes, function(success, data) {
                        if (success) {
                            self.clearCache(workItemId);
                            self.logAction('resume', workItemId, null);
                            EventBus.publish(Constants.EVENTS.ADVICE_RESUMED, {
                                workItemId: workItemId,
                                resumeApproach: result.outputs.resumeApproach,
                                adviceCount: result.outputs.totalAdviceCount
                            });
                        }
                        
                        var message = result.outputs.message + 
                                    (result.outputs.totalAdviceCount > 0 ? 
                                     ' (' + result.outputs.totalAdviceCount + ' advice items active)' : '');
                        callback(success, success ? message : data);
                    });
                } else {
                    callback(false, result.outputs.message);
                }
            });
        } else {
            // Fallback to simple attribute-based approach
            var attributes = {
                'alt_ongoing_advice_enabled': 'true',
                'alt_ongoing_advice_resumed_date': new Date().toISOString(),
                'alt_ongoing_advice_resumed_by': self.getCurrentUser(),
                'alt_ongoing_advice_resume_reason': 'Resumed by workflow',
                // Clear pause-related fields
                'alt_ongoing_advice_pause_reason': '',
                'alt_ongoing_advice_paused_date': '',
                'alt_ongoing_advice_paused_by': ''
            };
            
            // Set next advice date if provided
            if (newAdviceDueDate) {
                attributes['alt_ongoing_advice_next_date'] = newAdviceDueDate;
            }
            
            self.updateAdviceAttributes(workItemId, attributes, function(success, data) {
                if (success) {
                    self.clearCache(workItemId);
                    self.logAction('resume', workItemId, null);
                    EventBus.publish(Constants.EVENTS.ADVICE_RESUMED, {
                        workItemId: workItemId
                    });
                }
                callback(success, data);
            });
        }
    };
    
    /**
     * Update advice attributes
     */
    self.updateAdviceAttributes = function(workItemId, attributes, callback) {
        self.makeRequest({
            url: self.config.baseUrl + '/workItem/' + workItemId + '/attributes',
            method: 'PUT',
            data: JSON.stringify({ attributes: attributes }),
            contentType: 'application/json',
            success: function(response) {
                callback(true, response);
            },
            error: function(error) {
                console.error('Failed to update advice attributes:', error);
                callback(false, error.message || 'Failed to update advice status');
            }
        });
    };
    
    /**
     * Get advice history for a work item
     */
    self.getAdviceHistory = function(workItemId, callback) {
        self.makeRequest({
            url: self.config.baseUrl + '/workItem/' + workItemId + '/history',
            method: 'GET',
            data: { filter: 'advice' },
            success: function(response) {
                var history = self.parseAdviceHistory(response);
                callback(true, history);
            },
            error: function(error) {
                console.error('Failed to get advice history:', error);
                callback(false, []);
            }
        });
    };
    
    /**
     * Make AJAX request with retry logic
     */
    self.makeRequest = function(options, attempt) {
        attempt = attempt || 1;
        
        // Convert URL to proper API path
        var apiPath = options.url.replace(self.config.baseUrl, '/api/v1/public');
        
        // Determine method to use
        var method = (options.method || 'GET').toLowerCase();
        var apiCall;
        
        // Prepare request based on method
        if (method === 'get') {
            apiCall = $ajax.api.get(apiPath, { displayErrors: false });
        } else if (method === 'post') {
            apiCall = $ajax.api.post(apiPath, options.data, { displayErrors: false });
        } else if (method === 'put') {
            apiCall = $ajax.api.put(apiPath, options.data, { displayErrors: false });
        } else if (method === 'delete') {
            apiCall = $ajax.api.delete(apiPath, options.data, { displayErrors: false });
        }
        
        // Handle promise
        apiCall
            .then(function(response) {
                if (options.success) {
                    options.success(response);
                }
            })
            .catch(function(error) {
                // Retry logic
                var status = error.status || 0;
                if (attempt < self.config.retryAttempts && self.shouldRetry(status)) {
                    setTimeout(function() {
                        self.makeRequest(options, attempt + 1);
                    }, self.config.retryDelay * attempt);
                } else {
                    if (options.error) {
                        options.error({
                            status: status,
                            message: error.message || error.statusText || 'Request failed',
                            response: error.responseText
                        });
                    }
                }
            });
    };
    
    /**
     * Determine if request should be retried
     */
    self.shouldRetry = function(statusCode) {
        // Retry on network errors or server errors
        return statusCode === 0 || statusCode >= 500;
    };
    
    /**
     * Extract advice status from response
     */
    self.extractAdviceStatus = function(response) {
        // Handle ShareDo HTTP API response structure: {status, success, body}
        var attributes;
        if (response.body) {
            // ShareDo HTTP API format
            attributes = response.body;
        } else if (response.attributes) {
            // Legacy format
            attributes = response.attributes;
        } else {
            // Direct attributes object
            attributes = response;
        }
        
        // Use the registered attribute names with alt_ongoing_advice_ prefix
        var enabled = attributes['alt_ongoing_advice_enabled'] || 'false';
        var status = (enabled === 'true') ? 'active' : 'paused';
        
        // If we have a paused date but no pause reason, it might be disabled rather than paused
        var pausedDate = attributes['alt_ongoing_advice_paused_date'];
        if (!pausedDate && enabled === 'false') {
            status = 'none'; // Not enabled at all
        }
        
        return {
            status: status.toLowerCase(),
            pausedDate: pausedDate,
            pausedReason: attributes['alt_ongoing_advice_pause_reason'],
            pausedBy: attributes['alt_ongoing_advice_paused_by'],
            resumedDate: attributes['alt_ongoing_advice_resumed_date'],
            resumedBy: attributes['alt_ongoing_advice_resumed_by'],
            resumeReason: attributes['alt_ongoing_advice_resume_reason'],
            nextAdviceDate: attributes['alt_ongoing_advice_next_date'],
            lastActionDate: pausedDate || attributes['alt_ongoing_advice_resumed_date'] // Use most recent action date
        };
    };
    
    /**
     * Parse advice history from response
     */
    self.parseAdviceHistory = function(response) {
        var history = response.history || [];
        return history.filter(function(event) {
            return event.action && event.action.indexOf('advice') !== -1;
        }).map(function(event) {
            return {
                action: event.action,
                date: event.date,
                user: event.user,
                details: event.details
            };
        });
    };
    
    /**
     * Get cached status
     */
    self.getCachedStatus = function(workItemId) {
        return Cache.get('workItemStatus', workItemId);
    };
    
    /**
     * Cache status
     */
    self.cacheStatus = function(workItemId, status) {
        Cache.set('workItemStatus', workItemId, status);
    };
    
    /**
     * Clear cache for work item
     */
    self.clearCache = function(workItemId) {
        Cache.remove('workItemStatus', workItemId);
    };
    
    /**
     * Get current user
     */
    self.getCurrentUser = function() {
        // Try to get from ShareDo context
        if (window.ShareDo && window.ShareDo.currentUser) {
            return window.ShareDo.currentUser.name || window.ShareDo.currentUser.email;
        }
        
        // Try to get from workflow context
        if (window.workflowContext && window.workflowContext.user) {
            return window.workflowContext.user;
        }
        
        return 'System';
    };
    
    /**
     * Get auth token
     */
    self.getAuthToken = function() {
        // Try to get from ShareDo
        if (window.ShareDo && window.ShareDo.authToken) {
            return window.ShareDo.authToken;
        }
        
        // Try to get from local storage
        if (window.localStorage) {
            return localStorage.getItem('authToken');
        }
        
        return null;
    };
    
    /**
     * Log action for audit trail
     */
    self.logAction = function(action, workItemId, details) {
        try {
            var logEntry = {
                timestamp: new Date().toISOString(),
                action: 'advice_' + action,
                workItemId: workItemId,
                user: self.getCurrentUser(),
                details: details
            };
            
            // Send to audit service if available
            if (window.AuditService) {
                window.AuditService.log(logEntry);
            }
            
            // Console log for debugging
            console.log('[AdviceService] Action logged:', logEntry);
        } catch (e) {
            console.error('Failed to log action:', e);
        }
    };
    
    /**
     * Validate work item exists
     */
    self.validateWorkItem = function(workItemId, callback) {
        self.makeRequest({
            url: self.config.baseUrl + '/workItem/' + workItemId,
            method: 'GET',
            success: function(response) {
                callback(true, response);
            },
            error: function(error) {
                callback(false, null);
            }
        });
    };
    
    /**
     * Batch update multiple work items
     */
    self.batchUpdateAdvice = function(workItemIds, action, reason, callback) {
        var completed = 0;
        var errors = [];
        var results = [];
        
        workItemIds.forEach(function(workItemId) {
            var processItem = function() {
                if (action === 'pause') {
                    self.pauseAdvice(workItemId, reason, handleResult);
                } else if (action === 'resume') {
                    self.resumeAdvice(workItemId, handleResult);
                }
            };
            
            var handleResult = function(success, data) {
                completed++;
                
                if (success) {
                    results.push({ workItemId: workItemId, success: true });
                } else {
                    errors.push({ workItemId: workItemId, error: data });
                }
                
                if (completed === workItemIds.length) {
                    callback(errors.length === 0, {
                        results: results,
                        errors: errors
                    });
                }
            };
            
            // Stagger requests to avoid overwhelming the server
            setTimeout(processItem, completed * 100);
        });
    };
};