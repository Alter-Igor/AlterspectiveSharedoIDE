namespace("Alt.AdviceManagement.Configuration");

/**
 * AdviceLifecycleConfig - Configuration for advice lifecycle management
 * Handles advice types, phases, and workflow configuration
 */
Alt.AdviceManagement.Configuration.AdviceLifecycleConfig = function(options) {
    var self = this;
    
    // Default configuration
    var defaults = {
        // Core advice type configuration
        abstractAdviceTypeSystemName: "AbstractAdvice", // Base advice type that all advice inherits from
        defaultAdviceTypeSystemName: "StandardAdvice",  // Default advice type to create when resuming without saved state
        
        // Phase configuration
        phases: {
            active: "Active",           // Active advice phase
            paused: "Paused",          // Temporarily paused phase
            removed: "Removed",        // Removed/archived phase
            cancelled: "Cancelled"      // Cancelled phase
        },
        
        // Workflow configuration
        workflows: {
            pauseWorkflowId: "AdvicePauseWorkflow",    // Workflow to execute when pausing advice
            resumeWorkflowId: "AdviceResumeWorkflow",  // Workflow to execute when resuming advice
            enableWorkflows: true                       // Whether to use workflows or direct API calls
        },
        
        // Attribute configuration for storing saved advice state
        attributes: {
            savedAdviceStateAttribute: "alt_ongoing_advice_saved_state",     // JSON serialized advice state
            savedAdviceCountAttribute: "alt_ongoing_advice_saved_count",     // Number of saved advice items
            pausedAdviceTypesAttribute: "alt_ongoing_advice_paused_types"    // Comma-separated list of paused advice types
        },
        
        // Query configuration for finding advice
        query: {
            findActiveAdviceTemplate: "parentId={workItemId} AND workType.inheritsFrom={abstractAdviceType} AND phase={activePhase}",
            findPausedAdviceTemplate: "parentId={workItemId} AND workType.inheritsFrom={abstractAdviceType} AND phase={pausedPhase}",
            pageSize: 100  // Maximum number of advice items to retrieve
        },
        
        // Date handling
        dateHandling: {
            defaultAdviceOffsetDays: 30,        // Default days to add to current date for new advice
            preserveOriginalDates: true,        // Whether to restore original dates when resuming
            dueDateAttribute: "dueDate",        // Attribute name for advice due date
            reminderDateAttribute: "reminderDate" // Attribute name for reminder date
        },
        
        // API endpoints
        api: {
            findByQuery: "/api/v1/public/workItem/findByQuery",
            workItem: "/api/v1/public/workItem",
            workItemPhase: "/api/v1/public/workItem/{id}/phase",
            workItemAttributes: "/api/v1/public/workItem/{id}/attributes"
        }
    };
    
    // Merge with provided options
    self.config = $.extend(true, {}, defaults, options);
    
    // Validate configuration on initialization
    var validation = self.validateConfiguration();
    if (!validation.isValid) {
        if ($ui && $ui.log && $ui.log.error) {
            $ui.log.error("AdviceLifecycleConfig - CONFIGURATION ERRORS:");
            validation.errors.forEach(function(error, index) {
                $ui.log.error("  " + (index + 1) + ". " + error);
            });
        }
        console.warn("AdviceLifecycleConfig initialized with errors:", validation.errors);
    } else {
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceLifecycleConfig - Successfully initialized with configuration:");
            $ui.log.debug("  Abstract Advice Type: " + self.config.abstractAdviceTypeSystemName);
            $ui.log.debug("  Default Advice Type: " + self.config.defaultAdviceTypeSystemName);
            $ui.log.debug("  Active Phase: " + self.config.phases.active);
            $ui.log.debug("  Paused Phase: " + self.config.phases.removed);
        }
    }
    
    /**
     * Get the query for finding active advice items
     */
    self.getActiveAdviceQuery = function(workItemId) {
        return self.config.query.findActiveAdviceTemplate
            .replace("{workItemId}", workItemId)
            .replace("{abstractAdviceType}", self.config.abstractAdviceTypeSystemName)
            .replace("{activePhase}", self.config.phases.active);
    };
    
    /**
     * Get the query for finding paused advice items
     */
    self.getPausedAdviceQuery = function(workItemId) {
        return self.config.query.findPausedAdviceTemplate
            .replace("{workItemId}", workItemId)
            .replace("{abstractAdviceType}", self.config.abstractAdviceTypeSystemName)
            .replace("{pausedPhase}", self.config.phases.paused);
    };
    
    /**
     * Generate API URL with work item ID substitution
     */
    self.getApiUrl = function(endpoint, workItemId) {
        var url = self.config.api[endpoint];
        if (url && workItemId) {
            url = url.replace("{id}", workItemId);
        }
        return url;
    };
    
    /**
     * Calculate default due date for new advice
     */
    self.getDefaultAdviceDueDate = function(referenceDate) {
        var baseDate = referenceDate ? new Date(referenceDate) : new Date();
        baseDate.setDate(baseDate.getDate() + self.config.dateHandling.defaultAdviceOffsetDays);
        return baseDate.toISOString();
    };
    
    /**
     * Create advice state object for serialization
     */
    self.createAdviceStateObject = function(adviceItem) {
        return {
            workItemId: adviceItem.id,
            workTypeSystemName: adviceItem.workType ? adviceItem.workType.systemName : null,
            title: adviceItem.title,
            description: adviceItem.description,
            dueDate: adviceItem.attributes ? adviceItem.attributes[self.config.dateHandling.dueDateAttribute] : null,
            reminderDate: adviceItem.attributes ? adviceItem.attributes[self.config.dateHandling.reminderDateAttribute] : null,
            phase: adviceItem.phase,
            priority: adviceItem.priority,
            assignedTo: adviceItem.assignedTo,
            customAttributes: adviceItem.attributes,
            pausedDate: new Date().toISOString(),
            originalPhase: adviceItem.phase
        };
    };
    
    /**
     * Serialize advice state for storage
     */
    self.serializeAdviceState = function(adviceItems) {
        if (!Array.isArray(adviceItems)) {
            adviceItems = [adviceItems];
        }
        
        var states = adviceItems.map(function(item) {
            return self.createAdviceStateObject(item);
        });
        
        return JSON.stringify({
            items: states,
            pausedDate: new Date().toISOString(),
            count: states.length
        });
    };
    
    /**
     * Deserialize advice state from storage
     */
    self.deserializeAdviceState = function(serializedState) {
        var logPrefix = "AdviceLifecycleConfig.deserializeAdviceState";
        
        try {
            if (!serializedState) {
                if ($ui && $ui.log && $ui.log.debug) {
                    $ui.log.debug(logPrefix + " - No serialized state provided, returning null");
                }
                return null;
            }
            
            if (typeof serializedState !== 'string') {
                if ($ui && $ui.log && $ui.log.error) {
                    $ui.log.error(logPrefix + " - Invalid input type: " + typeof serializedState + ", expected string");
                }
                return null;
            }
            
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug(logPrefix + " - Parsing JSON state (" + serializedState.length + " chars)");
                $ui.log.debug("  First 200 chars: " + serializedState.substring(0, 200));
            }
            
            var parsed = JSON.parse(serializedState);
            
            // Validate parsed structure
            if (!parsed || typeof parsed !== 'object') {
                if ($ui && $ui.log && $ui.log.error) {
                    $ui.log.error(logPrefix + " - Parsed data is not an object: " + typeof parsed);
                }
                return null;
            }
            
            var result = {
                items: Array.isArray(parsed.items) ? parsed.items : [],
                pausedDate: parsed.pausedDate,
                count: parseInt(parsed.count) || 0
            };
            
            // Validate items array
            if (result.items.length > 0) {
                var validItemCount = 0;
                result.items.forEach(function(item, index) {
                    if (item && item.workItemId) {
                        validItemCount++;
                    } else {
                        if ($ui && $ui.log && $ui.log.warning) {
                            $ui.log.warning(logPrefix + " - Invalid item at index " + index + ": " + JSON.stringify(item));
                        }
                    }
                });
                
                if ($ui && $ui.log && $ui.log.debug) {
                    $ui.log.debug(logPrefix + " - Successfully parsed " + validItemCount + "/" + result.items.length + " valid items");
                }
            }
            
            return result;
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error(logPrefix + " - JSON parsing failed: " + error.message);
                $ui.log.error("  Input length: " + (serializedState ? serializedState.length : "null"));
                $ui.log.error("  Error details: " + error.stack);
            }
            console.error("Error deserializing advice state:", error, "Input:", serializedState);
            return null;
        }
    };
    
    /**
     * Validate configuration
     */
    self.validateConfiguration = function() {
        var errors = [];
        
        if (!self.config.abstractAdviceTypeSystemName) {
            errors.push("Abstract advice type system name is required");
        }
        
        if (!self.config.defaultAdviceTypeSystemName) {
            errors.push("Default advice type system name is required");
        }
        
        if (!self.config.phases.active || !self.config.phases.removed) {
            errors.push("Active and removed phases must be configured");
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };
    
    /**
     * Get configuration summary for logging
     */
    self.getConfigurationSummary = function() {
        return {
            abstractAdviceType: self.config.abstractAdviceTypeSystemName,
            defaultAdviceType: self.config.defaultAdviceTypeSystemName,
            phases: self.config.phases,
            workflowsEnabled: self.config.workflows.enableWorkflows,
            pauseWorkflow: self.config.workflows.pauseWorkflowId,
            resumeWorkflow: self.config.workflows.resumeWorkflowId
        };
    };
};