namespace("Alt.Common.Services");

/**
 * Configuration Service - Common utility for configuration processing
 * Handles token extraction, replacement, and configuration processing for Alt solutions
 * 
 * Features:
 * - Token extraction from configuration arrays
 * - Variable substitution with {variable} syntax
 * - Bracketed token replacement [source.path]
 * - JavaScript expression execution with $[...] syntax
 * - Safe sandboxed JavaScript evaluation
 * - Configuration validation and merging
 */
Alt.Common.Services.ConfigurationService = function(options) {
    var self = this;
    
    self.options = options || {};
    self.debugMode = options.debugMode || false;
    
    // Token patterns for different sources
    self.tokenPatterns = {
        // [workItem.field] or [workItem.roles.{variable}.field]
        bracketed: /\[([^\]]+)\]/g,
        // {variable} for input configuration replacement
        curlyBraced: /\{([^}]+)\}/g,
        // $ui.pageContext.method() for direct evaluation (deprecated - use $[...] instead)
        jsExpression: /\$ui\.[\w\.]+\(\)/g,
        // $[javascript expression] for safe JavaScript execution (recommended)
        jsExecutable: /\$\[([^\]]+)\]/g
    };
};

/**
 * Extract all tokens from configuration arrays
 * @param {Array} inputConfig - Input configuration array
 * @param {Array} targetConfig - Target configuration array
 * @returns {Array} Array of token objects with source and path information
 */
Alt.Common.Services.ConfigurationService.prototype.extractTokens = function(inputConfig, targetConfig) {
    var self = this;
    var tokens = [];
    var processedTokens = {};
    
    // Helper to extract tokens from a single configuration array
    function extractFromConfig(configArray) {
        if (!Array.isArray(configArray)) return;
        
        configArray.forEach(function(cfg) {
            Object.entries(cfg).forEach(function(entry) {
                var key = entry[0];
                var value = entry[1];
                
                if (typeof value !== "string") return;
                
                // Extract bracketed tokens [workItem.field]
                var matches = value.match(self.tokenPatterns.bracketed);
                if (matches) {
                    matches.forEach(function(match) {
                        var tokenContent = match.slice(1, -1); // Remove brackets
                        
                        // Check if it contains curly braces for variable substitution
                        var hasVariables = tokenContent.match(self.tokenPatterns.curlyBraced);
                        
                        // Determine the source (workItem, matter, participant, etc.) - case insensitive
                        var source = tokenContent.split('.')[0].toLowerCase();
                        
                        var tokenKey = match;
                        if (!processedTokens[tokenKey]) {
                            processedTokens[tokenKey] = true;
                            tokens.push({
                                original: match,
                                content: tokenContent,
                                source: source,
                                fullPath: tokenContent,
                                hasVariables: !!hasVariables,
                                configKey: key
                            });
                        }
                    });
                }
            });
        });
    }
    
    extractFromConfig(inputConfig);
    extractFromConfig(targetConfig);
    
    if (self.debugMode) {
        console.log("Extracted tokens:", tokens);
    }
    
    return tokens;
};

/**
 * Process configuration with token replacement
 * @param {Array} configArray - Configuration array to process
 * @param {Object} enrichedData - Data retrieved from API calls
 * @param {Array} inputConfig - Input configuration for variable substitution
 * @returns {Object} Processed configuration object
 */
Alt.Common.Services.ConfigurationService.prototype.processConfiguration = function(configArray, enrichedData, inputConfig) {
    var self = this;
    
    if (!Array.isArray(configArray)) {
        return {};
    }
    
    // Create a map of input configuration values for substitution
    var inputMap = {};
    if (Array.isArray(inputConfig)) {
        inputConfig.forEach(function(cfg) {
            Object.assign(inputMap, cfg);
        });
    }
    
    // Process each configuration item
    var processedConfig = {};
    
    configArray.forEach(function(cfg) {
        Object.entries(cfg).forEach(function(entry) {
            var key = entry[0];
            var value = entry[1];
            
            if (typeof value === "string") {
                // First, replace any {variable} tokens with input configuration values
                var processedValue = value.replace(self.tokenPatterns.curlyBraced, function(match, variable) {
                    return inputMap[variable] !== undefined ? inputMap[variable] : match;
                });
                
                // Then, replace [source.path] tokens with enriched data
                processedValue = processedValue.replace(self.tokenPatterns.bracketed, function(match, path) {
                    // Apply variable substitution to the path first
                    var substitutedPath = path.replace(self.tokenPatterns.curlyBraced, function(m, v) {
                        return inputMap[v] !== undefined ? inputMap[v] : v;
                    });
                    
                    // Look up the value in enriched data
                    var dataKey = substitutedPath;
                    if (enrichedData && enrichedData[dataKey] !== undefined) {
                        return enrichedData[dataKey];
                    }
                    
                    // Try with source prefix if not found
                    var sourcePrefix = substitutedPath.split('.')[0];
                    var fullKey = sourcePrefix + "." + substitutedPath;
                    if (enrichedData && enrichedData[fullKey] !== undefined) {
                        return enrichedData[fullKey];
                    }
                    
                    // Try case-insensitive lookup for workItem tokens
                    if (sourcePrefix.toLowerCase() === 'workitem') {
                        // Try with proper case 'workItem.'
                        var workItemKey = 'workItem.' + substitutedPath.substring(substitutedPath.indexOf('.') + 1);
                        if (enrichedData && enrichedData[workItemKey] !== undefined) {
                            return enrichedData[workItemKey];
                        }
                    }
                    
                    // Return original if no replacement found
                    if (self.debugMode) {
                        console.warn("Token not found in enriched data:", substitutedPath);
                    }
                    return match;
                });
                
                // Evaluate any deprecated JavaScript expressions $ui.pageContext.method()
                // This is kept for backward compatibility but $[...] format is recommended
                if (processedValue.match(self.tokenPatterns.jsExpression)) {
                    try {
                        processedValue = self.evaluateExpression(processedValue);
                    } catch (error) {
                        console.error("Failed to evaluate expression:", processedValue, error);
                    }
                }
                
                // Evaluate any executable JavaScript in $[...] patterns (recommended format)
                if (processedValue.match(self.tokenPatterns.jsExecutable)) {
                    processedValue = processedValue.replace(self.tokenPatterns.jsExecutable, function(match, expression) {
                        try {
                            var result = self.safeExecuteJavaScript(expression, inputMap, enrichedData);
                            if (self.debugMode) {
                                console.log("Executed $[" + expression + "] = " + result);
                            }
                            return result;
                        } catch (error) {
                            console.error("Failed to execute JavaScript:", expression, error);
                            return match; // Return original if execution fails
                        }
                    });
                }
                
                processedConfig[key] = processedValue;
            } else {
                // Non-string values are passed through unchanged
                processedConfig[key] = value;
            }
        });
    });
    
    return processedConfig;
};

/**
 * Safely evaluate JavaScript expressions in configuration values (deprecated - use $[...] format instead)
 * @param {String} expression - Expression to evaluate
 * @returns {*} Evaluated result or original expression if evaluation fails
 */
Alt.Common.Services.ConfigurationService.prototype.evaluateExpression = function(expression) {
    var self = this;
    
    try {
        // Map of safe UI context methods to their actual calls
        var contextMethods = {
            // Core methods
            '$ui.pageContext.sharedoId()': function() { return $ui.pageContext.sharedoId ? $ui.pageContext.sharedoId() : null; },
            '$ui.pageContext.sharedoType()': function() { return $ui.pageContext.sharedoType ? $ui.pageContext.sharedoType() : null; },
            
            // User methods (note: these are nested observables)
            '$ui.pageContext.user.userid()': function() { return $ui.pageContext.user && $ui.pageContext.user.userid ? $ui.pageContext.user.userid() : null; },
            '$ui.pageContext.user.username()': function() { return $ui.pageContext.user && $ui.pageContext.user.username ? $ui.pageContext.user.username() : null; },
            '$ui.pageContext.user.firstname()': function() { return $ui.pageContext.user && $ui.pageContext.user.firstname ? $ui.pageContext.user.firstname() : null; },
            '$ui.pageContext.user.lastname()': function() { return $ui.pageContext.user && $ui.pageContext.user.lastname ? $ui.pageContext.user.lastname() : null; },
            '$ui.pageContext.user.organisationId()': function() { return $ui.pageContext.user && $ui.pageContext.user.organisationId ? $ui.pageContext.user.organisationId() : null; },
            
            // Page context
            '$ui.pageContext.pageSystemName()': function() { return $ui.pageContext.pageSystemName ? $ui.pageContext.pageSystemName() : null; },
            '$ui.pageContext.pageTitle()': function() { return $ui.pageContext.pageTitle ? $ui.pageContext.pageTitle() : null; },
            '$ui.pageContext.portalSystemName()': function() { return $ui.pageContext.portalSystemName ? $ui.pageContext.portalSystemName() : null; },
            '$ui.pageContext.portalTitle()': function() { return $ui.pageContext.portalTitle ? $ui.pageContext.portalTitle() : null; },
            
            // Currency
            '$ui.pageContext.contextCurrencyCode()': function() { return $ui.pageContext.contextCurrencyCode ? $ui.pageContext.contextCurrencyCode() : null; },
            '$ui.pageContext.contextCurrencySymbol()': function() { return $ui.pageContext.contextCurrencySymbol ? $ui.pageContext.contextCurrencySymbol() : null; },
            
            // Organization
            '$ui.pageContext.defaultOrg()': function() { return $ui.pageContext.defaultOrg ? $ui.pageContext.defaultOrg() : null; },
            '$ui.pageContext.defaultOrgId()': function() { return $ui.pageContext.defaultOrgId ? $ui.pageContext.defaultOrgId() : null; },
            
            // Other
            '$ui.pageContext.debugMode()': function() { return $ui.pageContext.debugMode ? $ui.pageContext.debugMode() : false; }
        };
        
        // Replace each context method in the expression
        var result = expression;
        for (var method in contextMethods) {
            if (result.indexOf(method) !== -1) {
                try {
                    var value = contextMethods[method]();
                    // Handle null/undefined values
                    if (value === null || value === undefined) {
                        value = '';
                    }
                    result = result.replace(new RegExp(method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), JSON.stringify(value));
                } catch (e) {
                    console.warn("Failed to evaluate " + method, e);
                }
            }
        }
        
        return result !== expression ? result : expression;
        
    } catch (error) {
        if (self.debugMode) {
            console.error("Expression evaluation failed:", expression, error);
        }
    }
    
    return expression;
};

/**
 * Merge multiple configuration objects
 * @param {...Object} configs - Configuration objects to merge
 * @returns {Object} Merged configuration
 */
Alt.Common.Services.ConfigurationService.prototype.mergeConfigurations = function() {
    var self = this;
    var merged = {};
    
    // Iterate through all arguments
    for (var i = 0; i < arguments.length; i++) {
        var config = arguments[i];
        if (config && typeof config === 'object') {
            Object.assign(merged, config);
        }
    }
    
    if (self.debugMode) {
        console.log("Merged configuration:", merged);
    }
    
    return merged;
};

/**
 * Validate configuration structure
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
Alt.Common.Services.ConfigurationService.prototype.validateConfiguration = function(config) {
    var self = this;
    var errors = [];
    
    // Validate based on the context - different components may have different requirements
    // This is a generic validation that can be extended by specific implementations
    
    if (config.targetBlade && typeof config.targetBlade !== 'string') {
        errors.push("Target blade must be a string");
    }
    
    if (config.inputConfiguration && !Array.isArray(config.inputConfiguration)) {
        errors.push("Input configuration must be an array");
    }
    
    if (config.configForTargetBlade && !Array.isArray(config.configForTargetBlade)) {
        errors.push("Target blade configuration must be an array");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

/**
 * Safely execute JavaScript expressions with sandboxed context
 * @param {String} expression - JavaScript expression to execute
 * @param {Object} inputMap - Input configuration variables
 * @param {Object} enrichedData - Enriched data from API calls
 * @returns {*} Execution result
 */
Alt.Common.Services.ConfigurationService.prototype.safeExecuteJavaScript = function(expression, inputMap, enrichedData) {
    var self = this;
    
    // Create a sandboxed context with allowed variables and functions
    var sandbox = {
        // Allowed global objects
        Math: Math,
        Date: Date,
        JSON: JSON,
        parseInt: parseInt,
        parseFloat: parseFloat,
        String: String,
        Number: Number,
        Boolean: Boolean,
        Array: Array,
        Object: Object,
        
        // ShareDo UI context (read-only)
        $ui: {
            pageContext: {
                // Core methods
                sharedoId: function() { return $ui.pageContext.sharedoId ? $ui.pageContext.sharedoId() : null; },
                sharedoType: function() { return $ui.pageContext.sharedoType ? $ui.pageContext.sharedoType() : null; },
                
                // User object with nested observables
                user: {
                    userid: function() { return $ui.pageContext.user && $ui.pageContext.user.userid ? $ui.pageContext.user.userid() : null; },
                    username: function() { return $ui.pageContext.user && $ui.pageContext.user.username ? $ui.pageContext.user.username() : null; },
                    firstname: function() { return $ui.pageContext.user && $ui.pageContext.user.firstname ? $ui.pageContext.user.firstname() : null; },
                    lastname: function() { return $ui.pageContext.user && $ui.pageContext.user.lastname ? $ui.pageContext.user.lastname() : null; },
                    presence: function() { return $ui.pageContext.user && $ui.pageContext.user.presence ? $ui.pageContext.user.presence() : null; },
                    organisationId: function() { return $ui.pageContext.user && $ui.pageContext.user.organisationId ? $ui.pageContext.user.organisationId() : null; },
                    personaSystemName: function() { return $ui.pageContext.user && $ui.pageContext.user.personaSystemName ? $ui.pageContext.user.personaSystemName() : null; }
                },
                
                // Page and portal context
                pageSystemName: function() { return $ui.pageContext.pageSystemName ? $ui.pageContext.pageSystemName() : null; },
                pageTitle: function() { return $ui.pageContext.pageTitle ? $ui.pageContext.pageTitle() : null; },
                portalSystemName: function() { return $ui.pageContext.portalSystemName ? $ui.pageContext.portalSystemName() : null; },
                portalTitle: function() { return $ui.pageContext.portalTitle ? $ui.pageContext.portalTitle() : null; },
                portalBrandLogoUrl: function() { return $ui.pageContext.portalBrandLogoUrl ? $ui.pageContext.portalBrandLogoUrl() : null; },
                
                // Currency and localization
                contextCurrencyCode: function() { return $ui.pageContext.contextCurrencyCode ? $ui.pageContext.contextCurrencyCode() : null; },
                contextCurrencySymbol: function() { return $ui.pageContext.contextCurrencySymbol ? $ui.pageContext.contextCurrencySymbol() : null; },
                
                // Localization nested object
                localisation: {
                    defaultCountrySystemName: function() { 
                        return $ui.pageContext.localisation && $ui.pageContext.localisation.defaultCountrySystemName ? 
                               $ui.pageContext.localisation.defaultCountrySystemName() : null; 
                    },
                    defaultDialingCode: function() { 
                        return $ui.pageContext.localisation && $ui.pageContext.localisation.defaultDialingCode ? 
                               $ui.pageContext.localisation.defaultDialingCode() : null; 
                    },
                    defaultCultureCode: function() { 
                        return $ui.pageContext.localisation && $ui.pageContext.localisation.defaultCultureCode ? 
                               $ui.pageContext.localisation.defaultCultureCode() : null; 
                    },
                    defaultTimeZone: function() { 
                        return $ui.pageContext.localisation && $ui.pageContext.localisation.defaultTimeZone ? 
                               $ui.pageContext.localisation.defaultTimeZone() : null; 
                    }
                },
                
                // Organization
                defaultOrg: function() { return $ui.pageContext.defaultOrg ? $ui.pageContext.defaultOrg() : null; },
                defaultOrgId: function() { return $ui.pageContext.defaultOrgId ? $ui.pageContext.defaultOrgId() : null; },
                
                // Permissions
                objectPermissions: function() { return $ui.pageContext.objectPermissions ? $ui.pageContext.objectPermissions() : null; },
                systemPermissions: function() { return $ui.pageContext.systemPermissions ? $ui.pageContext.systemPermissions() : null; },
                
                // Other
                debugMode: function() { return $ui.pageContext.debugMode ? $ui.pageContext.debugMode() : false; },
                cspNonce: function() { return $ui.pageContext.cspNonce ? $ui.pageContext.cspNonce() : null; },
                terminology: function() { return $ui.pageContext.terminology ? $ui.pageContext.terminology() : null; },
                
                // Request methods
                request: function() { return $ui.pageContext.request ? $ui.pageContext.request() : null; },
                requestParameter: function(key, defaultValue) { 
                    return $ui.pageContext.requestParameter ? $ui.pageContext.requestParameter(key, defaultValue) : defaultValue; 
                },
                map: function(key) { return $ui.pageContext.map ? $ui.pageContext.map(key) : null; }
            }
        },
        
        // Input configuration variables
        inputs: inputMap || {},
        
        // Enriched data
        data: enrichedData || {},
        
        // Utility functions
        getValue: function(path, obj) {
            obj = obj || enrichedData;
            var parts = path.split('.');
            var current = obj;
            for (var i = 0; i < parts.length; i++) {
                if (current[parts[i]] !== undefined) {
                    current = current[parts[i]];
                } else {
                    return null;
                }
            }
            return current;
        },
        
        formatDate: function(date, format) {
            var d = date instanceof Date ? date : new Date(date);
            format = format || 'YYYY-MM-DD';
            
            var year = d.getFullYear();
            var month = String(d.getMonth() + 1).padStart(2, '0');
            var day = String(d.getDate()).padStart(2, '0');
            var hours = String(d.getHours()).padStart(2, '0');
            var minutes = String(d.getMinutes()).padStart(2, '0');
            var seconds = String(d.getSeconds()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        },
        
        concat: function() {
            return Array.prototype.slice.call(arguments).join('');
        },
        
        defaultValue: function(value, defaultVal) {
            return value !== null && value !== undefined ? value : defaultVal;
        },
        
        // String manipulation functions
        toUpperCase: function(str) {
            return String(str).toUpperCase();
        },
        
        toLowerCase: function(str) {
            return String(str).toLowerCase();
        },
        
        trim: function(str) {
            return String(str).trim();
        },
        
        substring: function(str, start, end) {
            return String(str).substring(start, end);
        }
    };
    
    try {
        // Validate expression doesn't contain dangerous patterns
        var dangerousPatterns = [
            /constructor/i,
            /prototype/i,
            /\beval\b/i,
            /\bFunction\b/i,
            /require/i,
            /import/i,
            /process/i,
            /global/i,
            /window/i,
            /document/i,
            /__proto__/i,
            /\bthis\b/
        ];
        
        for (var i = 0; i < dangerousPatterns.length; i++) {
            if (dangerousPatterns[i].test(expression)) {
                throw new Error("Expression contains forbidden pattern: " + dangerousPatterns[i]);
            }
        }
        
        // Create a function with strict mode and limited scope
        var func = new Function('Math', 'Date', 'JSON', 'String', 'Number', 'Boolean', 
                               'parseInt', 'parseFloat', 'inputs', 'data', '$ui',
                               'getValue', 'formatDate', 'concat', 'defaultValue',
                               'toUpperCase', 'toLowerCase', 'trim', 'substring',
            '"use strict"; return (' + expression + ');'
        );
        
        var result = func(
            Math, Date, JSON, String, Number, Boolean,
            parseInt, parseFloat, 
            sandbox.inputs, sandbox.data, sandbox.$ui,
            sandbox.getValue, sandbox.formatDate, sandbox.concat, sandbox.defaultValue,
            sandbox.toUpperCase, sandbox.toLowerCase, sandbox.trim, sandbox.substring
        );
        
        // Convert undefined/null to empty string for cleaner output
        if (result === undefined || result === null) {
            return '';
        }
        
        return result;
        
    } catch (error) {
        if (self.debugMode) {
            console.error("JavaScript execution failed for expression:", expression);
            console.error("Available context:", {
                inputs: inputMap,
                data: Object.keys(enrichedData || {})
            });
            console.error("Error:", error);
        }
        throw error;
    }
};

/**
 * Create a configuration preview for debugging
 * @param {Object} config - Configuration object
 * @returns {String} Formatted configuration preview
 */
Alt.Common.Services.ConfigurationService.prototype.createConfigPreview = function(config) {
    var self = this;
    
    try {
        return JSON.stringify(config, null, 2);
    } catch (error) {
        return "Unable to preview configuration: " + error.message;
    }
};