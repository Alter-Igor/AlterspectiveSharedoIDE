namespace("Alt.AdviceManagement.Services");

/**
 * AdviceLifecycleService - Service for managing advice lifecycle operations
 * Handles pause/resume with advice discovery, state saving, and restoration
 */
Alt.AdviceManagement.Services.AdviceLifecycleService = function(configuration) {
    var self = this;
    
    // Use configuration or create default
    self.config = configuration || new Alt.AdviceManagement.Configuration.AdviceLifecycleConfig();
    
    /**
     * Find active advice items for a work item
     */
    self.findActiveAdvice = function(workItemId, callback) {
        var startTime = new Date();
        var logPrefix = "AdviceLifecycleService.findActiveAdvice";
        
        // Enhanced validation
        if (!workItemId) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error(logPrefix + " - VALIDATION ERROR: Work item ID is required");
            }
            callback(false, "Work item ID is required");
            return;
        }
        
        // Validate configuration
        if (!self.config || !self.config.getActiveAdviceQuery) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error(logPrefix + " - CONFIGURATION ERROR: Invalid lifecycle configuration");
            }
            callback(false, "Invalid lifecycle configuration");
            return;
        }
        
        var query = self.config.getActiveAdviceQuery(workItemId);
        var requestPayload = {
            query: query,
            pageSize: self.config.config.query.pageSize
        };
        var apiUrl = self.config.getApiUrl("findByQuery");
        
        // Enhanced debug logging
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug(logPrefix + " - STARTING search for Work Item " + workItemId);
            $ui.log.debug("  API URL: " + apiUrl);
            $ui.log.debug("  Query: " + query);
            $ui.log.debug("  Page Size: " + self.config.config.query.pageSize);
            $ui.log.debug("  Request Payload: " + JSON.stringify(requestPayload));
        }
        
        $ajax.api.post(apiUrl, requestPayload, { displayErrors: false })
        .then(function(response) {
            var duration = new Date() - startTime;
            
            // Enhanced response validation and logging
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug(logPrefix + " - API RESPONSE received in " + duration + "ms");
                $ui.log.debug("  Response structure: " + JSON.stringify({
                    hasItems: !!response.items,
                    itemsType: typeof response.items,
                    itemsLength: response.items ? response.items.length : 0,
                    responseKeys: Object.keys(response)
                }));
            }
            
            // Validate response structure
            if (!response || typeof response !== 'object') {
                if ($ui && $ui.log && $ui.log.error) {
                    $ui.log.error(logPrefix + " - RESPONSE ERROR: Invalid response structure");
                }
                callback(false, "Invalid API response structure");
                return;
            }
            
            var items = response.items || [];
            
            // Enhanced success logging
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug(logPrefix + " - SUCCESS: Found " + items.length + " active advice items");
                items.forEach(function(item, index) {
                    if (item && item.id) {
                        $ui.log.debug("  " + (index + 1) + ". " + (item.title || "Untitled") + 
                                    " (ID: " + item.id + 
                                    ", Type: " + (item.workType ? item.workType.systemName : "Unknown") + 
                                    ", Phase: " + (item.phase || "Unknown") + ")");
                    } else {
                        $ui.log.debug("  " + (index + 1) + ". INVALID ITEM: " + JSON.stringify(item));
                    }
                });
                $ui.log.debug(logPrefix + " - COMPLETED in " + duration + "ms");
            }
            
            callback(true, items);
        })
        .catch(function(error) {
            var duration = new Date() - startTime;
            var errorMessage = error.message || error.statusText || "Unknown error";
            var statusCode = error.status || error.statusCode || 0;
            
            // Enhanced error logging
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error(logPrefix + " - API ERROR after " + duration + "ms");
                $ui.log.error("  Status Code: " + statusCode);
                $ui.log.error("  Error Message: " + errorMessage);
                $ui.log.error("  API URL: " + apiUrl);
                $ui.log.error("  Query Used: " + query);
                if (error.responseText) {
                    $ui.log.error("  Response Text: " + error.responseText.substring(0, 500));
                }
            }
            
            // Classify error type for potential retry logic
            var isRetryableError = statusCode === 0 || statusCode >= 500 || statusCode === 429;
            var errorType = isRetryableError ? "RETRYABLE" : "PERMANENT";
            
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug(logPrefix + " - Error classified as: " + errorType);
            }
            
            callback(false, errorMessage + " (Status: " + statusCode + ")");
        });
    };
    
    /**
     * Get detailed advice information including attributes
     */
    self.getAdviceDetails = function(adviceId, callback) {
        if (!adviceId) {
            callback(false, "Advice ID is required");
            return;
        }
        
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceLifecycleService - Getting details for advice " + adviceId);
        }
        
        $ajax.api.get(self.config.getApiUrl("workItem") + "/" + adviceId, { displayErrors: false })
        .then(function(adviceItem) {
            // Also get attributes
            return $ajax.api.get(self.config.getApiUrl("workItemAttributes", adviceId), { displayErrors: false })
                .then(function(attributesResponse) {
                    // Handle ShareDo response structure
                    var attributes = attributesResponse.body || attributesResponse;
                    adviceItem.attributes = attributes;
                    
                    if ($ui && $ui.log && $ui.log.debug) {
                        $ui.log.debug("AdviceLifecycleService - Retrieved advice details: " + adviceItem.title);
                        $ui.log.debug("  Due Date: " + (attributes[self.config.config.dateHandling.dueDateAttribute] || "Not set"));
                    }
                    
                    callback(true, adviceItem);
                })
                .catch(function(attrError) {
                    // Still return advice item even if attributes fail
                    if ($ui && $ui.log && $ui.log.warning) {
                        $ui.log.warning("AdviceLifecycleService - Could not get attributes for advice " + adviceId + ": " + attrError.message);
                    }
                    adviceItem.attributes = {};
                    callback(true, adviceItem);
                });
        })
        .catch(function(error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceLifecycleService - Failed to get advice details: " + error.message);
            }
            callback(false, error.message || "Failed to get advice details");
        });
    };
    
    /**
     * Move advice to a different phase
     */
    self.moveAdviceToPhase = function(adviceId, targetPhase, callback) {
        if (!adviceId || !targetPhase) {
            callback(false, "Advice ID and target phase are required");
            return;
        }
        
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceLifecycleService - Moving advice " + adviceId + " to phase " + targetPhase);
        }
        
        $ajax.api.put(self.config.getApiUrl("workItemPhase", adviceId), {
            phase: targetPhase
        }, { displayErrors: false })
        .then(function(response) {
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug("AdviceLifecycleService - Successfully moved advice " + adviceId + " to phase " + targetPhase);
            }
            callback(true, response);
        })
        .catch(function(error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceLifecycleService - Failed to move advice to phase: " + error.message);
            }
            callback(false, error.message || "Failed to move advice to phase");
        });
    };
    
    /**
     * Save advice state to work item attributes
     */
    self.saveAdviceState = function(workItemId, adviceItems, callback) {
        if (!workItemId || !adviceItems) {
            callback(false, "Work item ID and advice items are required");
            return;
        }
        
        try {
            var serializedState = self.config.serializeAdviceState(adviceItems);
            var adviceTypes = adviceItems.map(function(item) {
                return item.workType ? item.workType.systemName : "Unknown";
            }).join(",");
            
            var attributes = {};
            attributes[self.config.config.attributes.savedAdviceStateAttribute] = serializedState;
            attributes[self.config.config.attributes.savedAdviceCountAttribute] = adviceItems.length.toString();
            attributes[self.config.config.attributes.pausedAdviceTypesAttribute] = adviceTypes;
            
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug("AdviceLifecycleService - Saving advice state for Work Item " + workItemId);
                $ui.log.debug("  Advice Count: " + adviceItems.length);
                $ui.log.debug("  Advice Types: " + adviceTypes);
            }
            
            $ajax.api.put(self.config.getApiUrl("workItemAttributes", workItemId), attributes, { displayErrors: false })
            .then(function(response) {
                if ($ui && $ui.log && $ui.log.debug) {
                    $ui.log.debug("AdviceLifecycleService - Successfully saved advice state");
                }
                callback(true, response);
            })
            .catch(function(error) {
                if ($ui && $ui.log && $ui.log.error) {
                    $ui.log.error("AdviceLifecycleService - Failed to save advice state: " + error.message);
                }
                callback(false, error.message || "Failed to save advice state");
            });
            
        } catch (error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceLifecycleService - Error serializing advice state: " + error.message);
            }
            callback(false, "Error preparing advice state for saving");
        }
    };
    
    /**
     * Get saved advice state from work item attributes
     */
    self.getSavedAdviceState = function(workItemId, callback) {
        if (!workItemId) {
            callback(false, "Work item ID is required");
            return;
        }
        
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceLifecycleService - Getting saved advice state for Work Item " + workItemId);
        }
        
        $ajax.api.get(self.config.getApiUrl("workItemAttributes", workItemId), { displayErrors: false })
        .then(function(response) {
            // Handle ShareDo response structure
            var attributes = response.body || response;
            var serializedState = attributes[self.config.config.attributes.savedAdviceStateAttribute];
            
            if (!serializedState) {
                if ($ui && $ui.log && $ui.log.debug) {
                    $ui.log.debug("AdviceLifecycleService - No saved advice state found");
                }
                callback(true, null);
                return;
            }
            
            var adviceState = self.config.deserializeAdviceState(serializedState);
            
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug("AdviceLifecycleService - Found saved advice state with " + (adviceState ? adviceState.count : 0) + " items");
            }
            
            callback(true, adviceState);
        })
        .catch(function(error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceLifecycleService - Failed to get saved advice state: " + error.message);
            }
            callback(false, error.message || "Failed to get saved advice state");
        });
    };
    
    /**
     * Clear saved advice state from work item attributes
     */
    self.clearSavedAdviceState = function(workItemId, callback) {
        if (!workItemId) {
            callback(false, "Work item ID is required");
            return;
        }
        
        var attributes = {};
        attributes[self.config.config.attributes.savedAdviceStateAttribute] = "";
        attributes[self.config.config.attributes.savedAdviceCountAttribute] = "0";
        attributes[self.config.config.attributes.pausedAdviceTypesAttribute] = "";
        
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceLifecycleService - Clearing saved advice state for Work Item " + workItemId);
        }
        
        $ajax.api.put(self.config.getApiUrl("workItemAttributes", workItemId), attributes, { displayErrors: false })
        .then(function(response) {
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug("AdviceLifecycleService - Successfully cleared saved advice state");
            }
            callback(true, response);
        })
        .catch(function(error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceLifecycleService - Failed to clear saved advice state: " + error.message);
            }
            callback(false, error.message || "Failed to clear saved advice state");
        });
    };
    
    /**
     * Create new advice item
     */
    self.createAdvice = function(workItemId, adviceTypeSystemName, adviceData, callback) {
        if (!workItemId || !adviceTypeSystemName) {
            callback(false, "Work item ID and advice type are required");
            return;
        }
        
        var newAdviceData = $.extend(true, {
            parentId: workItemId,
            workTypeSystemName: adviceTypeSystemName,
            title: "Ongoing Advice",
            description: "Ongoing advice created on resume",
            phase: self.config.config.phases.active,
            dueDate: self.config.getDefaultAdviceDueDate()
        }, adviceData);
        
        if ($ui && $ui.log && $ui.log.debug) {
            $ui.log.debug("AdviceLifecycleService - Creating new advice for Work Item " + workItemId);
            $ui.log.debug("  Advice Type: " + adviceTypeSystemName);
            $ui.log.debug("  Due Date: " + newAdviceData.dueDate);
        }
        
        $ajax.api.post(self.config.getApiUrl("workItem"), newAdviceData, { displayErrors: false })
        .then(function(response) {
            if ($ui && $ui.log && $ui.log.debug) {
                $ui.log.debug("AdviceLifecycleService - Successfully created advice: " + response.id);
            }
            callback(true, response);
        })
        .catch(function(error) {
            if ($ui && $ui.log && $ui.log.error) {
                $ui.log.error("AdviceLifecycleService - Failed to create advice: " + error.message);
            }
            callback(false, error.message || "Failed to create advice");
        });
    };
};