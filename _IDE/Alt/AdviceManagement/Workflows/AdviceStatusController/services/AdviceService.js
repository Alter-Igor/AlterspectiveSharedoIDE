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
                var status = self.extractAdviceStatus(response);
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
     */
    self.pauseAdvice = function(workItemId, reason, callback) {
        if (!workItemId) {
            callback(false, 'Work item ID is required');
            return;
        }
        
        var attributes = {
            'AdviceStatus': 'paused',
            'AdvicePausedDate': new Date().toISOString(),
            'AdvicePausedReason': reason || 'Paused by workflow',
            'AdvicePausedBy': self.getCurrentUser(),
            'AdviceLastActionDate': new Date().toISOString(),
            'AdviceLastActionType': 'Paused'
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
    };
    
    /**
     * Resume advice for a work item
     */
    self.resumeAdvice = function(workItemId, callback) {
        if (!workItemId) {
            callback(false, 'Work item ID is required');
            return;
        }
        
        var attributes = {
            'AdviceStatus': 'active',
            'AdviceResumedDate': new Date().toISOString(),
            'AdviceResumedBy': self.getCurrentUser(),
            'AdviceLastActionDate': new Date().toISOString(),
            'AdviceLastActionType': 'Resumed',
            'AdvicePausedReason': null,
            'AdvicePausedDate': null,
            'AdvicePausedBy': null
        };
        
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
     * Convert string to DateTime object
     */
    self.convertToDateTime = function(value) {
        if (!value) return null;
        
        try {
            // If it's already a Date object, return as-is
            if (value instanceof Date) {
                return value;
            }
            
            // Try to parse as ISO string or standard date string
            var date = new Date(value);
            
            // Check if the date is valid
            if (!isNaN(date.getTime())) {
                return date;
            }
            
            // If parsing failed, log warning and return original value
            console.warn('AdviceService: Could not convert "' + value + '" to DateTime, using original value');
            return value;
        } catch (ex) {
            console.warn('AdviceService: DateTime conversion error for "' + value + '": ' + ex.message);
            return value;
        }
    };
    
    /**
     * Extract advice status from response
     */
    self.extractAdviceStatus = function(response) {
        var attributes = response.attributes || {};
        var status = attributes['AdviceStatus'] || 'none';
        
        var result = {
            status: status.toLowerCase(),
            pausedDate: self.convertToDateTime(attributes['AdvicePausedDate']),
            pausedReason: attributes['AdvicePausedReason'],
            pausedBy: attributes['AdvicePausedBy'],
            resumedDate: self.convertToDateTime(attributes['AdviceResumedDate']),
            resumedBy: attributes['AdviceResumedBy'],
            lastAction: attributes['AdviceLastActionType'],
            lastActionDate: self.convertToDateTime(attributes['AdviceLastActionDate'])
        };
        
        // Log date conversions using Log.Information if available
        if (typeof log !== 'undefined' && log.Information) {
            log.Information("AdviceService - Date field conversions:");
            if (result.pausedDate) {
                log.Information("  pausedDate: {PausedDate} (type: {PausedDateType})", 
                    result.pausedDate, typeof result.pausedDate);
            }
            if (result.resumedDate) {
                log.Information("  resumedDate: {ResumedDate} (type: {ResumedDateType})", 
                    result.resumedDate, typeof result.resumedDate);
            }
            if (result.lastActionDate) {
                log.Information("  lastActionDate: {LastActionDate} (type: {LastActionDateType})", 
                    result.lastActionDate, typeof result.lastActionDate);
            }
        }
        
        return result;
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