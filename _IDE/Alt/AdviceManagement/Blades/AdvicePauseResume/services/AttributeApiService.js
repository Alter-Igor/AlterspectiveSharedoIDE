// Namespacing
namespace("Alt.OngoingAdvice.Services");

/**
 * Service for interacting with Sharedo's public attribute APIs
 * Built by Alterspective
 * 
 * API Endpoints Used:
 * - GET /api/v1/public/workItem/{workItemId} - Get work item details
 * - GET /api/v1/public/workItem/{workItemId}/attributes/{attributeName} - Get single attribute
 * - POST /api/v1/public/workItem/{workItemId}/attributes/{attributeName} - Set single attribute
 * - GET /api/v1/public/workItem/{workItemId}/attributesCollection - Get all attributes (bulk)
 */
Alt.OngoingAdvice.Services.AttributeApiService = function() {
    var self = this;
    
    // Configuration - hardcoded to avoid external file dependency
    self.config = {
        attributeNames: {
            enabled: "alt_ongoing_advice_enabled",
            pausedDate: "alt_ongoing_advice_paused_date",
            resumedDate: "alt_ongoing_advice_resumed_date",
            pausedBy: "alt_ongoing_advice_paused_by",  // Now stores name directly
            resumedBy: "alt_ongoing_advice_resumed_by",  // Now stores name directly
            pauseReason: "alt_ongoing_advice_pause_reason",
            resumeReason: "alt_ongoing_advice_resume_reason",
            nextAdviceDate: "alt_ongoing_advice_next_date"
        },
        defaults: {
            enabled: true,
            nextAdviceIntervalDays: 365
        },
        validation: {
            reasonMaxLength: 500,
            requireReasonForPause: false,
            requireReasonForResume: false,
            requireNextDateForResume: false
        },
        ui: {
            dateFormat: 'DD/MM/YYYY',
            timeFormat: 'HH:mm'
        }
    };
    
    // Get configuration (now just returns the hardcoded config)
    self.loadConfig = function() {
        var deferred = $.Deferred();
        deferred.resolve(self.config);
        return deferred.promise();
    };
    
    /**
     * Get work item details
     */
    self.getWorkItem = function(workItemId) {
        // Use ShareDo's $ajax.api for better error handling
        return $ajax.api.get('/api/v1/public/workItem/' + workItemId);
    };
    
    /**
     * Get a specific attribute value
     */
    self.getAttribute = function(workItemId, attributeName) {
        return $ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributes/' + attributeName);
    };
    
    /**
     * Set a specific attribute value
     */
    self.setAttribute = function(workItemId, attributeName, value) {
        // According to Swagger, the API expects an object with a "value" property
        var stringValue = value !== null && value !== undefined ? String(value) : '';
        var payload = {
            value: stringValue
        };
        
        console.log('Setting attribute:', attributeName, '=', stringValue, 'payload:', payload);
        
        return $ajax.api.post(
            '/api/v1/public/workItem/' + workItemId + '/attributes/' + attributeName,
            payload,
            { contentType: 'application/json; charset=utf-8' }
        );
    };
    
    /**
     * Get all attributes for a work item using the bulk endpoint
     */
    self.getAllAttributes = function(workItemId) {
        return $ajax.api.get('/api/v1/public/workItem/' + workItemId + '/attributesCollection');
    };
    
    /**
     * Update multiple attributes using individual calls
     * (Based on screenshots, there doesn't appear to be a bulk update endpoint)
     */
    self.setMultipleAttributes = function(workItemId, attributesMap) {
        var promises = [];
        var results = {};
        
        _.each(attributesMap, function(value, attributeName) {
            var promise = self.setAttribute(workItemId, attributeName, value)
                .done(function(response) {
                    results[attributeName] = response;
                })
                .fail(function(xhr, status, error) {
                    console.error('Failed to set attribute ' + attributeName + ':', error);
                    results[attributeName] = { error: error };
                });
            promises.push(promise);
        });
        
        var deferred = $.Deferred();
        $.when.apply($, promises).always(function() {
            deferred.resolve(results);
        });
        
        return deferred.promise();
    };
    
    /**
     * Get all ongoing advice attributes for a work item
     */
    self.getOngoingAdviceAttributes = function(workItemId) {
        var deferred = $.Deferred();
        var config = self.config;
        
        // Try to use bulk attributes endpoint first
        self.getAllAttributes(workItemId)
            .done(function(allAttributes) {
                var results = {};
                
                // Map the attributes we need from the bulk response
                _.each(config.attributeNames, function(attributeName, key) {
                    var found = _.find(allAttributes, function(attr) {
                        return attr.attribute === attributeName;
                    });
                    var value = found ? found.value : null;
                    
                    // Handle legacy work-types: if alt_ongoing_advice_enabled is null/undefined, default to true
                    if (key === 'enabled' && (value === null || value === undefined)) {
                        value = true;
                    }
                    
                    results[key] = value;
                });
                
                deferred.resolve(results);
            })
            .fail(function() {
                // Fallback to individual attribute calls
                console.log('Bulk attributes failed, falling back to individual calls');
                var promises = [];
                var results = {};
                
                // Get all attribute values individually
                _.each(config.attributeNames, function(attributeName, key) {
                    var promise = self.getAttribute(workItemId, attributeName)
                        .done(function(response) {
                            // Response should have a "value" property according to Swagger
                            var value = response && response.value ? response.value : null;
                            
                            // Handle legacy work-types: if alt_ongoing_advice_enabled is null/undefined, default to true
                            if (key === 'enabled' && (value === null || value === undefined)) {
                                value = true;
                            }
                            
                            results[key] = value;
                        })
                        .fail(function() {
                            // Attribute doesn't exist or no value - use default for enabled, null for others
                            var value = null;
                            
                            // Handle legacy work-types: if alt_ongoing_advice_enabled is null/undefined, default to true
                            if (key === 'enabled') {
                                value = true;
                            }
                            
                            results[key] = value;
                        });
                    promises.push(promise);
                });
                
                // Wait for all promises to complete
                $.when.apply($, promises).always(function() {
                    deferred.resolve(results);
                });
            });
        
        return deferred.promise();
    };
    
    /**
     * Set multiple ongoing advice attributes
     */
    self.setOngoingAdviceAttributes = function(workItemId, attributes) {
        var deferred = $.Deferred();
        var config = self.config;
        var promises = [];
        var results = {};
        
        // Set each attribute that has a value (including empty strings for clearing)
        _.each(attributes, function(value, key) {
            if (config.attributeNames[key]) {
                var attributeName = config.attributeNames[key];
                console.log('Setting attribute via setOngoingAdviceAttributes:', key, '=', value, 'as', attributeName);
                var promise = self.setAttribute(workItemId, attributeName, value)
                    .done(function(response) {
                        console.log('Successfully set', attributeName, 'response:', response);
                        // Response should have a "value" property according to Swagger
                        results[key] = response && response.value ? response.value : value;
                    })
                    .fail(function(xhr, status, error) {
                        console.error('Failed to set attribute ' + attributeName + ':', error, xhr);
                        results[key] = { error: error };
                    });
                promises.push(promise);
            }
        });
        
        // Wait for all promises to complete
        $.when.apply($, promises).always(function() {
            deferred.resolve(results);
        });
        
        return deferred.promise();
    };
    
    /**
     * Toggle ongoing advice status (pause/resume)
     */
    self.toggleOngoingAdvice = function(workItemId, options) {
        var deferred = $.Deferred();
        
        // Get current status first
        self.getOngoingAdviceAttributes(workItemId).then(function(currentAttributes) {
            console.log('Current attributes:', currentAttributes);
            // Handle legacy work-types: if enabled is null/undefined, it defaults to true (active)
            var enabledValue = currentAttributes.enabled;
            if (enabledValue === null || enabledValue === undefined) {
                enabledValue = true;
            }
            var isCurrentlyEnabled = enabledValue === true || enabledValue === 'true';
            var newStatus = !isCurrentlyEnabled;
            var now = new Date().toISOString();
            
            console.log('Current enabled status:', currentAttributes.enabled);
            console.log('Is currently enabled:', isCurrentlyEnabled);
            console.log('New status will be:', newStatus);
            
            var attributesToSet = {
                enabled: newStatus.toString()  // Convert boolean to string for API
            };
            
            if (newStatus) {
                // Resuming
                attributesToSet.resumedDate = now;
                attributesToSet.resumedBy = options.userName || 'Unknown User';  // Store name directly
                if (options.reason) {
                    attributesToSet.resumeReason = options.reason;
                }
                if (options.nextAdviceDate) {
                    attributesToSet.nextAdviceDate = options.nextAdviceDate;
                }
            } else {
                // Pausing
                attributesToSet.pausedDate = now;
                attributesToSet.pausedBy = options.userName || 'Unknown User';  // Store name directly
                if (options.reason) {
                    attributesToSet.pauseReason = options.reason;
                }
                // Clear next advice date when pausing
                attributesToSet.nextAdviceDate = null;
            }
            
            // Set the attributes
            console.log('Attributes to set:', attributesToSet);
            self.setOngoingAdviceAttributes(workItemId, attributesToSet).then(function(results) {
                console.log('Set attributes results:', results);
                
                // Handle task management based on new status
                var taskPromise;
                if (newStatus) {
                    // Resuming advice - create/update advice task if next advice date is provided
                    if (options.nextAdviceDate) {
                        console.log('Creating advice task with due date:', options.nextAdviceDate);
                        taskPromise = self.createOrUpdateAdviceTask(workItemId, options.nextAdviceDate, {
                            title: 'Ongoing Advice Review',
                            description: 'Review ongoing advice for this matter - resumed by ' + (options.userName || 'Unknown User'),
                            assignedToUserId: null // Could be set based on work item owner or current user
                        });
                    } else {
                        // No next advice date provided, just remove any existing tasks
                        console.log('Resuming without next advice date - removing existing advice tasks');
                        taskPromise = self.removeAdviceTasks(workItemId);
                    }
                } else {
                    // Pausing advice - remove any existing advice tasks
                    console.log('Pausing advice - removing all advice tasks');
                    taskPromise = self.removeAdviceTasks(workItemId);
                }
                
                // Wait for task management to complete
                taskPromise.then(function(taskResult) {
                    console.log('Task management completed:', taskResult);
                    deferred.resolve({
                        success: true,
                        newStatus: newStatus,
                        action: newStatus ? 'resumed' : 'paused',
                        attributes: attributesToSet,
                        results: results,
                        taskManagement: taskResult
                    });
                }).fail(function(taskError) {
                    console.warn('Task management failed but attributes were updated:', taskError);
                    // Don't fail the entire operation if task management fails
                    deferred.resolve({
                        success: true,
                        newStatus: newStatus,
                        action: newStatus ? 'resumed' : 'paused',
                        attributes: attributesToSet,
                        results: results,
                        taskManagement: { error: taskError, message: 'Task management failed but advice status was updated successfully' }
                    });
                });
                
            }).fail(function(error) {
                deferred.reject({
                    success: false,
                    error: error,
                    message: 'Failed to update ongoing advice attributes'
                });
            });
            
        }).fail(function(error) {
            deferred.reject({
                success: false,
                error: error,
                message: 'Failed to get current ongoing advice status'
            });
        });
        
        return deferred.promise();
    };
    
    /**
     * Validate attribute values
     */
    self.validateAttributes = function(attributes) {
        var errors = [];
        var validation = self.config.validation || {};
        
        // Validate reason length
        if (attributes.reason && validation.reasonMaxLength) {
            if (attributes.reason.length > validation.reasonMaxLength) {
                errors.push('Reason cannot exceed ' + validation.reasonMaxLength + ' characters');
            }
        }
        
        // Validate required fields
        if (attributes.action === 'pause' && validation.requireReasonForPause && !attributes.reason) {
            errors.push('Reason is required when pausing ongoing advice');
        }
        
        if (attributes.action === 'resume') {
            if (validation.requireReasonForResume && !attributes.reason) {
                errors.push('Reason is required when resuming ongoing advice');
            }
            if (validation.requireNextDateForResume && !attributes.nextAdviceDate) {
                errors.push('Next advice date is required when resuming ongoing advice');
            }
        }
        
        // Validate dates
        if (attributes.nextAdviceDate) {
            var nextDate = new Date(attributes.nextAdviceDate);
            var now = new Date();
            if (nextDate <= now) {
                errors.push('Next advice date must be in the future');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };
    
    /**
     * Get advice-related diary entries (tasks) for a work item
     */
    self.getAdviceTasks = function(workItemId) {
        // Using diary/task API endpoint (assuming standard ShareDo diary functionality)
        return $ajax.api.get('/api/v1/public/workItem/' + workItemId + '/diary')
            .then(function(diaryEntries) {
                // Filter for advice-related tasks
                if (!diaryEntries || !Array.isArray(diaryEntries)) {
                    return [];
                }
                
                return diaryEntries.filter(function(entry) {
                    // Look for advice-related tasks by checking title, description, or type
                    var title = (entry.title || '').toLowerCase();
                    var description = (entry.description || '').toLowerCase();
                    var type = (entry.type || '').toLowerCase();
                    
                    return title.includes('advice') || 
                           title.includes('ongoing advice') ||
                           description.includes('ongoing advice') ||
                           type.includes('advice') ||
                           entry.category === 'advice' ||
                           entry.systemName === 'ongoing_advice_task';
                });
            })
            .fail(function() {
                // If diary API doesn't exist, return empty array
                console.log('Diary API not available, advice task management disabled');
                return [];
            });
    };
    
    /**
     * Create or update an advice task
     */
    self.createOrUpdateAdviceTask = function(workItemId, dueDate, options) {
        options = options || {};
        var taskData = {
            title: options.title || 'Ongoing Advice Review',
            description: options.description || 'Review ongoing advice for this matter',
            dueDate: dueDate,
            type: 'advice',
            category: 'advice',
            systemName: 'ongoing_advice_task',
            priority: options.priority || 'Medium',
            assignedToUserId: options.assignedToUserId || null
        };
        
        // First, remove any existing advice tasks
        return self.removeAdviceTasks(workItemId)
            .then(function() {
                // Create the new task
                return $ajax.api.post('/api/v1/public/workItem/' + workItemId + '/diary', taskData);
            })
            .fail(function(error) {
                console.error('Failed to create advice task:', error);
                // If diary API doesn't exist, just resolve without error
                return $.Deferred().resolve({ message: 'Diary API not available' });
            });
    };
    
    /**
     * Remove all advice-related tasks for a work item
     */
    self.removeAdviceTasks = function(workItemId) {
        return self.getAdviceTasks(workItemId)
            .then(function(adviceTasks) {
                if (!adviceTasks || adviceTasks.length === 0) {
                    return { removed: 0 };
                }
                
                // Remove each advice task
                var removePromises = adviceTasks.map(function(task) {
                    return $ajax.api.delete('/api/v1/public/workItem/' + workItemId + '/diary/' + task.id)
                        .fail(function(error) {
                            console.error('Failed to remove advice task:', task.id, error);
                        });
                });
                
                return $.when.apply($, removePromises).then(function() {
                    return { removed: adviceTasks.length };
                });
            })
            .fail(function() {
                // If diary API doesn't exist, just resolve
                return $.Deferred().resolve({ removed: 0 });
            });
    };
    
    /**
     * Get formatted display values for attributes
     */
    self.formatAttributeDisplay = function(attributes) {
        var ui = self.config.ui || {};
        var dateFormat = ui.dateFormat || 'DD/MM/YYYY';
        var timeFormat = ui.timeFormat || 'HH:mm';
        
        var formatted = {};
        
        _.each(attributes, function(value, key) {
            if (value && (key.includes('Date') || key.includes('date'))) {
                // Format dates
                var date = moment(value);
                if (date.isValid()) {
                    formatted[key] = date.format(dateFormat + ' ' + timeFormat);
                } else {
                    formatted[key] = value;
                }
            } else {
                formatted[key] = value;
            }
        });
        
        return formatted;
    };
};
