namespace("Alt.Utilities");

/**
 * BladeBouncer - A utility blade for dynamically redirecting to other blades with configuration token replacement
 * 
 * Example configuration:
 * {
 *   "targetBlade": "Sharedo.Core.Case.Panels.Ods.AddEditPerson",
 *   "inputConfiguration": [
 *     {"roleSystemName": "client"}
 *   ],
 *   "configForTargetBlade": [
 *     {"id": "[workItem.roles.{roleSystemName}.ods.id]"},
 *     {"sharedoId": "$[$ui.pageContext.sharedoId()]"},
 *     {"userId": "$[$ui.pageContext.user.userid()]"},
 *     {"userName": "$[$ui.pageContext.user.username()]"},
 *     {"fullName": "$[concat($ui.pageContext.user.firstname(), ' ', $ui.pageContext.user.lastname())]"},
 *     {"customField": "[workItem.customFields.fieldName]"}
 *   ],
 *   "tokenSources": ["workItem", "matter", "participant"],
 *   "debugMode": false,
 *   "autoRedirect": true,
 *   "redirectDelay": 500
 * }
 * 
 * @param {HTMLElement} element - The HTML DOM Element to which this blade model is bound
 * @param {Object} configuration - The configuration passed in from the open blade command
 * @param {Object} stackModel - The base blade stack model (contains unique id etc)
 */
Alt.Utilities.BladeBouncer = function(element, configuration, stackModel) {
    var self = this;
    
    // Default configuration
    var defaults = {
        targetBlade: null,
        inputConfiguration: [],
        configForTargetBlade: [],
        conditionalRules: [],
        defaultTargetBlade: null,
        tokenSources: ["workItem"],
        debugMode: false,
        autoRedirect: true,
        redirectDelay: 500,
        closeAfterRedirect: true
    };
    
    // Merge configuration with defaults
    var options = $.extend(true, {}, defaults, configuration);
    
    // Initialize model
    self.model = {
        targetBlade: ko.observable(options.targetBlade),
        inputConfiguration: ko.observableArray(options.inputConfiguration || []),
        configForTargetBlade: ko.observableArray(options.configForTargetBlade || []),
        conditionalRules: ko.observableArray(options.conditionalRules || []),
        defaultTargetBlade: ko.observable(options.defaultTargetBlade),
        tokenSources: ko.observableArray(options.tokenSources || ["workItem"]),
        debugMode: ko.observable(options.debugMode || false),
        autoRedirect: ko.observable(options.autoRedirect !== false),
        redirectDelay: ko.observable(options.redirectDelay || 500),
        closeAfterRedirect: ko.observable(options.closeAfterRedirect !== false)
    };
    
    // UI state
    self.processing = ko.observable(false);
    self.processingMessage = ko.observable("Initializing blade bouncer...");
    self.errorMessage = ko.observable("");
    self.showConfigPreview = ko.observable(options.debugMode || false);
    
    // Debug information
    self.debugInfo = ko.observableArray([]);
    
    // Store references
    self.element = element;
    self.stackModel = stackModel;
    self.configService = null;
    
    // Validation
    self.validation = {
        hasTargetBlade: ko.computed(function() {
            return !!self.model.targetBlade();
        }),
        hasConditionalRules: ko.computed(function() {
            return self.model.conditionalRules() && self.model.conditionalRules().length > 0;
        }),
        isValid: ko.computed(function() {
            // Valid if we have either a target blade OR conditional rules
            return !!self.model.targetBlade() || 
                   (self.model.conditionalRules() && self.model.conditionalRules().length > 0);
        })
    };
};

/**
 * Initialize the configuration service
 */
Alt.Utilities.BladeBouncer.prototype.initializeServices = function() {
    var self = this;
    
    // Initialize configuration service using the common Alt service
    if (!self.configService) {
        self.configService = new Alt.Common.Services.ConfigurationService({
            debugMode: self.model.debugMode()
        });
    }
};

/**
 * Evaluate a conditional rule against enriched data
 * @param {Object} rule - The rule containing condition and target blade
 * @param {Object} data - The enriched data to evaluate against
 * @returns {boolean} - True if the condition matches
 */
Alt.Utilities.BladeBouncer.prototype.evaluateCondition = function(rule, data) {
    var self = this;
    
    if (!rule || !rule.condition) {
        return false;
    }
    
    var condition = rule.condition;
    var path = condition.path;
    var operator = condition.operator || 'equals';
    var expectedValue = condition.value;
    
    // Get the actual value from the data using the path
    var actualValue = self.getValueByPath(data, path);
    
    if (self.model.debugMode()) {
        console.log("Evaluating condition:", {
            path: path,
            operator: operator,
            expectedValue: expectedValue,
            actualValue: actualValue
        });
    }
    
    // Evaluate based on operator
    switch (operator.toLowerCase()) {
        case 'equals':
        case '==':
        case '===':
            return actualValue === expectedValue;
            
        case 'notequals':
        case '!=':
        case '!==':
            return actualValue !== expectedValue;
            
        case 'contains':
            return actualValue && typeof actualValue === 'string' && 
                   actualValue.indexOf(expectedValue) !== -1;
                   
        case 'startswith':
            return actualValue && typeof actualValue === 'string' && 
                   actualValue.indexOf(expectedValue) === 0;
                   
        case 'endswith':
            return actualValue && typeof actualValue === 'string' && 
                   actualValue.lastIndexOf(expectedValue) === actualValue.length - expectedValue.length;
                   
        case 'in':
            return Array.isArray(expectedValue) && expectedValue.indexOf(actualValue) !== -1;
            
        case 'notin':
            return Array.isArray(expectedValue) && expectedValue.indexOf(actualValue) === -1;
            
        case 'exists':
            return actualValue !== undefined && actualValue !== null;
            
        case 'notexists':
            return actualValue === undefined || actualValue === null;
            
        case 'greaterthan':
        case '>':
            return actualValue > expectedValue;
            
        case 'lessthan':
        case '<':
            return actualValue < expectedValue;
            
        case 'greaterorequal':
        case '>=':
            return actualValue >= expectedValue;
            
        case 'lessorequal':
        case '<=':
            return actualValue <= expectedValue;
            
        default:
            console.warn("Unknown operator: " + operator);
            return false;
    }
};

/**
 * Get value from nested object using dot notation path
 * @param {Object} obj - The object to search
 * @param {string} path - The dot notation path
 * @returns {any} - The value at the path, or undefined if not found
 */
Alt.Utilities.BladeBouncer.prototype.getValueByPath = function(obj, path) {
    if (!obj || !path) {
        return undefined;
    }
    
    var parts = path.split('.');
    var current = obj;
    
    for (var i = 0; i < parts.length; i++) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[parts[i]];
    }
    
    return current;
};

/**
 * Determine the target blade based on conditional rules
 * @param {Object} enrichedData - The enriched data from API calls
 * @returns {Object} - Object containing targetBlade and configForTargetBlade
 */
Alt.Utilities.BladeBouncer.prototype.determineTargetBlade = function(enrichedData) {
    var self = this;
    
    var rules = self.model.conditionalRules();
    
    // If no conditional rules, use the standard targetBlade
    if (!rules || rules.length === 0) {
        return {
            targetBlade: self.model.targetBlade(),
            configForTargetBlade: self.model.configForTargetBlade()
        };
    }
    
    // Evaluate each rule in order
    for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        
        if (self.evaluateCondition(rule, enrichedData)) {
            if (self.model.debugMode()) {
                console.log("Rule matched:", rule);
                self.debugInfo.push({
                    timestamp: new Date().toISOString(),
                    type: 'Rule Matched',
                    data: JSON.stringify(rule, null, 2)
                });
            }
            
            return {
                targetBlade: rule.targetBlade,
                configForTargetBlade: rule.configForTargetBlade || self.model.configForTargetBlade()
            };
        }
    }
    
    // No rules matched, use default or fallback
    var defaultBlade = self.model.defaultTargetBlade() || self.model.targetBlade();
    
    if (self.model.debugMode()) {
        console.log("No rules matched, using default blade:", defaultBlade);
        self.debugInfo.push({
            timestamp: new Date().toISOString(),
            type: 'Default Blade',
            data: 'No conditional rules matched, using default: ' + defaultBlade
        });
    }
    
    return {
        targetBlade: defaultBlade,
        configForTargetBlade: self.model.configForTargetBlade()
    };
};

/**
 * Called by the UI framework after initial creation and binding to load data
 */
Alt.Utilities.BladeBouncer.prototype.loadAndBind = function() {
    var self = this;
    
    self.initializeServices();
    
    // Log configuration in debug mode
    if (self.model.debugMode()) {
        var config = {
            targetBlade: self.model.targetBlade(),
            inputConfiguration: self.model.inputConfiguration(),
            configForTargetBlade: self.model.configForTargetBlade(),
            conditionalRules: self.model.conditionalRules(),
            defaultTargetBlade: self.model.defaultTargetBlade(),
            tokenSources: self.model.tokenSources()
        };
        console.log("BladeBouncer Configuration:", config);
        self.debugInfo.push({
            timestamp: new Date().toISOString(),
            type: 'Configuration',
            data: JSON.stringify(config, null, 2)
        });
    }
    
    // Validate configuration
    if (!self.validation.isValid()) {
        self.errorMessage("Invalid configuration: Either targetBlade or conditionalRules must be specified");
        return;
    }
    
    // Process bounce if auto-redirect is enabled
    if (self.model.autoRedirect()) {
        self._redirectTimeout = setTimeout(function() {
            self.processBounce();
        }, self.model.redirectDelay());
    }
};

/**
 * Process the blade bounce with token replacement
 */
Alt.Utilities.BladeBouncer.prototype.processBounce = function() {
    var self = this;
    
    // Prevent concurrent execution
    if (self.processing()) {
        console.warn("BladeBouncer: Already processing, skipping duplicate call");
        return;
    }
    
    // Validate critical dependencies
    if (!self.configService) {
        self.handleError("Configuration service not initialized", new Error("Service initialization failed"));
        return;
    }
    
    if (!$ui || !$ui.pageContext || !$ui.pageContext.sharedoId) {
        self.handleError("UI context not available", new Error("ShareDo UI context missing or incomplete"));
        return;
    }
    
    self.processing(true);
    self.processingMessage("Processing configuration tokens...");
    
    // Extract all tokens that need enrichment
    var tokens = self.configService.extractTokens(
        self.model.inputConfiguration(),
        self.model.configForTargetBlade()
    );
    
    if (self.model.debugMode()) {
        console.log("Extracted tokens:", tokens);
        self.debugInfo.push({
            timestamp: new Date().toISOString(),
            type: 'Extracted Tokens',
            data: JSON.stringify(tokens, null, 2)
        });
    }
    
    // Check if we need to enrich any workItem tokens (case insensitive)
    var workItemTokens = tokens.filter(function(token) {
        return token.source.toLowerCase() === "workitem";
    });
    
    if (workItemTokens.length > 0) {
        self.processingMessage("Fetching workItem data...");
        self.enrichWorkItemTokens(workItemTokens).then(function(data) {
            self.finalizeAndRedirect(data);
        }).catch(function(error) {
            self.handleError("Failed to enrich workItem tokens", error);
        });
    } else {
        // No tokens to enrich, proceed with direct replacement
        self.finalizeAndRedirect({});
    }
};

/**
 * Enrich workItem tokens with actual data
 */
Alt.Utilities.BladeBouncer.prototype.enrichWorkItemTokens = function(tokens) {
    var self = this;
    
    return new Promise(function(resolve, reject) {
        // Create a map of input configuration values for substitution
        var inputMap = {};
        var inputConfig = self.model.inputConfiguration();
        if (Array.isArray(inputConfig)) {
            inputConfig.forEach(function(cfg) {
                Object.assign(inputMap, cfg);
            });
        }
        
        // Build enrich array for API call, replacing variables first
        var enrich = tokens.map(function(token) {
            var path = token.fullPath;
            
            // Replace any {variable} tokens with input configuration values
            if (token.hasVariables) {
                path = path.replace(/\{([^}]+)\}/g, function(match, variable) {
                    return inputMap[variable] !== undefined ? inputMap[variable] : match;
                });
            }
            
            // Remove the 'workItem.' prefix from the path for the API call (case insensitive)
            // API expects paths like 'roles.client.ods.id' not 'workItem.roles.client.ods.id'
            if (path.toLowerCase().indexOf('workitem.') === 0) {
                // Find the actual case used in the original path
                var prefixLength = path.indexOf('.') + 1;
                path = path.substring(prefixLength);
            }
            
            return { path: path };
        });
        
        if (self.model.debugMode()) {
            console.log("Enriching paths:", enrich);
            self.debugInfo.push({
                timestamp: new Date().toISOString(),
                type: 'API Enrich Paths',
                data: JSON.stringify(enrich, null, 2)
            });
        }
        
        var model = {
            search: {
                page: {
                    page: 1,
                    rowsPerPage: 1
                },
                workItemIds: [$ui.pageContext.sharedoId() ? $ui.pageContext.sharedoId() : null]
            },
            enrich: enrich
        };
        
        self._currentRequest = $ajax.post("/api/v1/public/workItem/findByQuery", model);
        
        self._currentRequest.then(function(response) {
            self._currentRequest = null;
            if (response && response.results && response.results.length > 0) {
                var enrichedData = response.results[0].data || {};
                
                // Prepend 'workItem.' to all keys in the enriched data
                // so they match the original token format
                var prefixedData = {};
                for (var key in enrichedData) {
                    if (enrichedData.hasOwnProperty(key)) {
                        prefixedData['workItem.' + key] = enrichedData[key];
                    }
                }
                
                if (self.model.debugMode()) {
                    console.log("Enriched data with workItem prefix:", prefixedData);
                    self.debugInfo.push({
                        timestamp: new Date().toISOString(),
                        type: 'Enriched Data (with prefix)',
                        data: JSON.stringify(prefixedData, null, 2)
                    });
                }
                
                resolve(prefixedData);
            } else {
                resolve({});
            }
        }).catch(function(error) {
            self._currentRequest = null;
            reject(error);
        });
    });
};

/**
 * Finalize configuration and redirect to target blade
 */
Alt.Utilities.BladeBouncer.prototype.finalizeAndRedirect = function(enrichedData) {
    var self = this;
    
    self.processingMessage("Applying configuration...");
    
    try {
        // Determine target blade based on conditional rules if present
        var bladeConfig = self.determineTargetBlade(enrichedData);
        
        if (!bladeConfig.targetBlade) {
            throw new Error("No target blade determined from configuration or rules");
        }
        
        // Process input configuration with token replacement
        var processedInputConfig = self.configService.processConfiguration(
            self.model.inputConfiguration(),
            enrichedData,
            self.model.inputConfiguration()
        );
        
        // Process target blade configuration with token replacement
        var processedTargetConfig = self.configService.processConfiguration(
            bladeConfig.configForTargetBlade,
            enrichedData,
            self.model.inputConfiguration()
        );
        
        // Merge configurations
        var finalConfig = self.configService.mergeConfigurations(
            processedInputConfig,
            processedTargetConfig
        );
        
        if (self.model.debugMode()) {
            console.log("Target blade determined:", bladeConfig.targetBlade);
            console.log("Final configuration:", finalConfig);
            self.debugInfo.push({
                timestamp: new Date().toISOString(),
                type: 'Target Blade',
                data: bladeConfig.targetBlade
            });
            self.debugInfo.push({
                timestamp: new Date().toISOString(),
                type: 'Final Configuration',
                data: JSON.stringify(finalConfig, null, 2)
            });
            self.showConfigPreview(true);
        }
        
        // Perform the redirect
        self.processingMessage("Opening target blade: " + bladeConfig.targetBlade);
        
        setTimeout(function() {
            // Open the target blade
            $ui.stacks.openPanel(bladeConfig.targetBlade, finalConfig);
            
            // In debug mode, never close the blade so we can see the output
            if (self.model.debugMode()) {
                self.processing(false);
                self.processingMessage("Redirect completed - Debug mode: blade remains open");
                self.debugInfo.push({
                    timestamp: new Date().toISOString(),
                    type: 'Redirect Status',
                    data: 'Target blade opened with final configuration. BladeBouncer remains open in debug mode.'
                });
            } 
            // Otherwise, close this blade if configured
            else if (self.model.closeAfterRedirect()) {
                $ui.stacks.close(self, { action: "Redirected" });
            } else {
                self.processing(false);
                self.processingMessage("Redirect completed");
            }
        }, 300);
        
    } catch (error) {
        self.handleError("Failed to process configuration", error);
    }
};

/**
 * Handle errors during processing
 */
Alt.Utilities.BladeBouncer.prototype.handleError = function(message, error) {
    var self = this;
    
    // Create detailed error object for logging
    var errorDetails = {
        timestamp: new Date().toISOString(),
        message: message,
        error: error ? (error.message || error.toString()) : "Unknown error",
        blade: "Alt.Utilities.BladeBouncer",
        configuration: {
            targetBlade: self.model.targetBlade(),
            inputConfiguration: self.model.inputConfiguration(),
            configForTargetBlade: self.model.configForTargetBlade(),
            tokenSources: self.model.tokenSources(),
            debugMode: self.model.debugMode(),
            autoRedirect: self.model.autoRedirect(),
            redirectDelay: self.model.redirectDelay()
        },
        context: {
            sharedoId: $ui.pageContext ? $ui.pageContext.sharedoId() : null,
            userId: $ui.pageContext ? $ui.pageContext.userId() : null
        }
    };
    
    // Log error with formatted JSON
    console.error("BladeBouncer Error Details:");
    console.error(JSON.stringify(errorDetails, null, 2));
    
    // Additional stack trace in debug mode
    if (self.model.debugMode() && error && error.stack) {
        console.error("Stack trace:", error.stack);
    }
    
    // Provide helpful suggestions based on error type
    var suggestion = self.getErrorSuggestion(message, error);
    if (suggestion) {
        console.error("Suggestion:", suggestion);
    }
    
    self.processing(false);
    self.errorMessage(message + ": " + (error.message || error));
};

/**
 * Get error suggestion based on error type
 */
Alt.Utilities.BladeBouncer.prototype.getErrorSuggestion = function(message, error) {
    var self = this;
    
    var suggestions = {
        "Either targetBlade or conditionalRules must be specified": "Add either 'targetBlade' property or 'conditionalRules' array to your configuration",
        "No target blade determined": "Ensure conditionalRules have valid conditions or provide a defaultTargetBlade",
        "Failed to enrich workItem tokens": "Verify that the workItem exists and tokens reference valid paths. Check the API response for available fields.",
        "Failed to process configuration": "Check that your configuration arrays are properly formatted. Refer to example-config.json for valid structures.",
        "Token not found": "The referenced token path doesn't exist in the fetched data. Use debugMode: true to see available data.",
        "Invalid configuration": "Ensure inputConfiguration and configForTargetBlade are arrays of objects.",
        "Failed to evaluate expression": "Use $[...] format for JavaScript execution: $[$ui.pageContext.sharedoId()], $[$ui.pageContext.user.userid()], $[$ui.pageContext.user.username()]"
    };
    
    // Search for matching suggestion
    for (var key in suggestions) {
        if (message.indexOf(key) !== -1) {
            return suggestions[key];
        }
    }
    
    // Generic suggestion
    return "Enable debugMode: true in your configuration to see detailed information. Check example-config.json for valid configuration examples.";
};

/**
 * Manual trigger for blade bounce (for non-auto mode)
 */
Alt.Utilities.BladeBouncer.prototype.triggerBounce = function() {
    var self = this;
    
    if (!self.processing()) {
        self.processBounce();
    }
};

/**
 * Called by the UI framework when this blade is being unloaded
 */
Alt.Utilities.BladeBouncer.prototype.onDestroy = function() {
    var self = this;
    
    // Clear any pending timeouts
    if (self._redirectTimeout) {
        clearTimeout(self._redirectTimeout);
        self._redirectTimeout = null;
    }
    
    // Cancel any pending AJAX requests
    if (self._currentRequest && typeof self._currentRequest.abort === 'function') {
        self._currentRequest.abort();
        self._currentRequest = null;
    }
    
    // Clean up service reference
    if (self.configService) {
        self.configService = null;
    }
    
    // Clear observables to prevent memory leaks
    if (self.processing) self.processing(false);
    if (self.processingMessage) self.processingMessage("");
    if (self.errorMessage) self.errorMessage("");
    if (self.showConfigPreview) self.showConfigPreview(false);
    
    // Clear model references
    self.model = null;
    self.validation = null;
    self.element = null;
    self.stackModel = null;
};