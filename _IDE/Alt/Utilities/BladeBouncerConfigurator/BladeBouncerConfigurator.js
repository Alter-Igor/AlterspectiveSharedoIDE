// Ensure namespace exists
if (typeof namespace !== 'function') {
    window.namespace = function(ns) {
        var parts = ns.split('.');
        var parent = window;
        for (var i = 0; i < parts.length; i++) {
            if (typeof parent[parts[i]] === 'undefined') {
                parent[parts[i]] = {};
            }
            parent = parent[parts[i]];
        }
        return parent;
    };
}

namespace("Alt.Utilities");

/**
 * BladeBouncerConfigurator - Portal widget for generating BladeBouncer configurations
 * Provides an intuitive interface for creating simple and complex blade routing configurations
 * 
 * @param {HTMLElement} element - The HTML DOM Element to which this widget is bound
 * @param {Object} configuration - Initial configuration for the widget
 */
Alt.Utilities.BladeBouncerConfigurator = function(element, configuration) {
    var self = this;
    
    // Configuration passed in
    self.configuration = configuration || {};
    
    // Initialize model
    self.model = {
        // Current mode: simple, advanced, or rules
        mode: ko.observable('simple'),
        
        // Configuration name
        configName: ko.observable(''),
        
        // Testing context - for portal pages without workItem
        testWorkItemId: ko.observable(''),
        hasWorkItemContext: ko.observable(false),
        
        // Simple mode settings
        targetBlade: ko.observable(''),
        autoRedirect: ko.observable(true),
        closeAfterRedirect: ko.observable(true),
        debugMode: ko.observable(false),
        redirectDelay: ko.observable(500),
        
        // Advanced mode settings
        inputVariables: ko.observableArray([]),
        targetConfigs: ko.observableArray([]),
        tokenSources: ko.observableArray(['workItem']),
        
        // Conditional rules mode
        conditionalRules: ko.observableArray([]),
        defaultTargetBlade: ko.observable(''),
        
        // UI helpers
        bladeSuggestions: ko.observableArray([]),
        savedConfigurations: ko.observableArray([]),
        selectedSavedConfig: ko.observable(''),
        statusMessage: ko.observable(''),
        statusClass: ko.observable(''),
        isLoading: ko.observable(false),
        
        // Computed configuration JSON
        configurationJson: ko.computed(function() {
            try {
                return self.generateConfiguration();
            } catch (e) {
                return '// Error generating configuration: ' + e.message;
            }
        }, self)
    };
    
    // Common blade suggestions (populated dynamically if possible)
    self.commonBlades = [
        // ODS/Participant Management
        'Sharedo.Core.Case.Panels.Ods.AddEditPerson',
        'Sharedo.Core.Case.Panels.Ods.AddEditOrganisation',
        'Sharedo.Core.Case.Panels.Ods.ViewEntity',
        'Sharedo.Core.Case.Panels.Ods.PrimaryContactView',
        'Sharedo.Core.Case.Panels.ParticipantsList',
        
        // Case/Matter Management
        'Sharedo.Core.Case.Dashboard',
        'Sharedo.Core.Case.ActiveMatterWorkflow',
        'Sharedo.Core.Case.PendingMatterDashboard',
        'Sharedo.Core.Case.ClosedMatterSummary',
        
        // Document Management
        'Sharedo.Core.Documents.CreateDocument',
        'Sharedo.Core.Documents.CreateLitigationDocument',
        'Sharedo.Core.Documents.CreateConveyancingDocument',
        'Sharedo.Core.Documents.CreateFamilyDocument',
        
        // Task Management
        'Sharedo.Core.Tasks.CreateTask',
        'Sharedo.Core.Tasks.CreateUrgentTask',
        'Sharedo.Core.Tasks.TaskList',
        
        // Time Recording
        'Sharedo.Core.TimeRecording.CreateTimeEntry',
        
        // Correspondence
        'Sharedo.Core.Correspondence.ComposeToOpponent',
        
        // Claims Management
        'Sharedo.Core.HighValue.ClaimManager',
        'Sharedo.Core.Standard.ClaimManager',
        
        // Alt Custom Blades
        'Alt.AdviceManagement.AdvicePauseResumeBlade',
        'Alt.AdviceManagement.WorkflowActionHelpBlade',
        'Alt.Utilities.BladeBouncer',
        
        // Prototype/Custom
        'Prototype.CustomFindAndEditParticipant'
    ];
    
    // Store element reference
    self.element = element;
    
    // Initialize blade suggestions immediately
    self.model.bladeSuggestions(self.commonBlades);
    
    // Bind methods to the model for use in the view
    self.model.searchBlades = function() { return self.searchBlades(); };
    self.model.setSimpleMode = function() { return self.setSimpleMode(); };
    self.model.setAdvancedMode = function() { return self.setAdvancedMode(); };
    self.model.setRulesMode = function() { return self.setRulesMode(); };
    self.model.addInputVariable = function() { return self.addInputVariable(); };
    self.model.removeInputVariable = function(item) { return self.removeInputVariable(item); };
    self.model.addTargetConfig = function() { return self.addTargetConfig(); };
    self.model.removeTargetConfig = function(item) { return self.removeTargetConfig(item); };
    self.model.addRule = function() { return self.addRule(); };
    self.model.removeRule = function(item) { return self.removeRule(item); };
    self.model.searchBladesForRule = function(index) { return self.searchBladesForRule(index); };
    self.model.getPlaceholder = function(type) { return self.getPlaceholder(type); };
    self.model.loadEditClientTemplate = function() { return self.loadEditClientTemplate(); };
    self.model.loadCreateTaskTemplate = function() { return self.loadCreateTaskTemplate(); };
    self.model.loadConditionalOdsTemplate = function() { return self.loadConditionalOdsTemplate(); };
    self.model.loadDocumentTemplate = function() { return self.loadDocumentTemplate(); };
    self.model.loadConfiguration = function(name) { return self.loadConfiguration(name); };
    self.model.deleteConfiguration = function(name) { return self.deleteConfiguration(name); };
    self.model.saveConfiguration = function() { return self.saveConfiguration(); };
    self.model.exportConfiguration = function() { return self.exportConfiguration(); };
    self.model.clearConfiguration = function() { return self.clearConfiguration(); };
    self.model.formatJson = function() { return self.formatJson(); };
    self.model.copyToClipboard = function() { return self.copyToClipboard(); };
    self.model.testConfiguration = function() { return self.testConfiguration(); };
    self.model.showStatus = function(msg, type) { return self.showStatus(msg, type); };
    self.model.loadTestWorkItem = function() { return self.loadTestWorkItem(); };
    
    // Check context type after model is ready
    self.checkContext();
};

/**
 * Check context type (portal page vs workItem context)
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.checkContext = function() {
    var self = this;
    
    // Check if we have workItem context
    if (window.$ui && window.$ui.pageContext) {
        // Check for sharedoId (workItem context)
        if (typeof $ui.pageContext.sharedoId === 'function') {
            try {
                var sharedoId = $ui.pageContext.sharedoId();
                if (sharedoId) {
                    self.model.hasWorkItemContext(true);
                    console.log('WorkItem context detected:', sharedoId);
                }
            } catch (e) {
                // No workItem context
            }
        }
        
        // If no workItem context, we're on a portal page
        if (!self.model.hasWorkItemContext()) {
            console.log('Portal page context detected (no workItem)');
            console.log('Available context:', {
                user: $ui.pageContext.user ? {
                    username: $ui.pageContext.user.username(),
                    userid: $ui.pageContext.user.userid(),
                    firstname: $ui.pageContext.user.firstname(),
                    lastname: $ui.pageContext.user.lastname()
                } : null,
                pageSystemName: $ui.pageContext.pageSystemName(),
                portalSystemName: $ui.pageContext.portalSystemName(),
                defaultOrgId: $ui.pageContext.defaultOrgId ? $ui.pageContext.defaultOrgId() : null
            });
        }
    }
};

/**
 * Mode setters
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.setSimpleMode = function() {
    this.model.mode('simple');
};

Alt.Utilities.BladeBouncerConfigurator.prototype.setAdvancedMode = function() {
    this.model.mode('advanced');
};

Alt.Utilities.BladeBouncerConfigurator.prototype.setRulesMode = function() {
    this.model.mode('rules');
};

/**
 * Input variable management
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.addInputVariable = function() {
    this.model.inputVariables.push({
        key: ko.observable(''),
        value: ko.observable('')
    });
};

Alt.Utilities.BladeBouncerConfigurator.prototype.removeInputVariable = function(variable) {
    this.model.inputVariables.remove(variable);
};

/**
 * Target configuration management
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.addTargetConfig = function() {
    this.model.targetConfigs.push({
        key: ko.observable(''),
        type: ko.observable('static'),
        value: ko.observable('')
    });
};

Alt.Utilities.BladeBouncerConfigurator.prototype.removeTargetConfig = function(config) {
    this.model.targetConfigs.remove(config);
};

/**
 * Get placeholder text based on value type
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.getPlaceholder = function(type) {
    switch(type) {
        case 'static':
            return 'Static value';
        case 'token':
            return '[workItem.field.path]';
        case 'variable':
            return '{variableName}';
        case 'expression':
            return '$[$ui.pageContext.sharedoId()]';
        default:
            return 'Enter value';
    }
};

/**
 * Conditional rule management
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.addRule = function() {
    this.model.conditionalRules.push({
        path: ko.observable(''),
        operator: ko.observable('equals'),
        value: ko.observable(''),
        valueType: ko.observable('string'), // string, array, number
        arrayValues: ko.observableArray([]), // For 'in' operator
        targetBlade: ko.observable(''),
        configForTargetBlade: ko.observableArray([])
    });
};

Alt.Utilities.BladeBouncerConfigurator.prototype.removeRule = function(rule) {
    this.model.conditionalRules.remove(rule);
};

/**
 * Search for available blades - Opens BladeFinder
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.searchBlades = function() {
    var self = this;
    
    // Open the BladeFinder blade
    if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
        var events = {
            onClosed: function(args) {
                console.log('BladeFinder closed with args:', args);
                
                // Handle blade selection
                if (args && args.action === 'Selected' && args.bladeId) {
                    // Set the selected blade ID in the appropriate field based on mode
                    var mode = self.model.mode();
                    console.log('Current mode:', mode, 'Setting blade:', args.bladeId);
                    
                    if (mode === 'simple' || mode === 'advanced') {
                        self.model.targetBlade(args.bladeId);
                        console.log('Set targetBlade to:', self.model.targetBlade());
                    } else if (mode === 'rules') {
                        // For rules mode, set to defaultTargetBlade
                        self.model.defaultTargetBlade(args.bladeId);
                        console.log('Set defaultTargetBlade to:', self.model.defaultTargetBlade());
                    }
                    
                    self.showStatus('Selected blade: ' + args.bladeId, 'success');
                }
            }
        };
        
        var config = {
            initialSearch: self.model.targetBlade() || ''
        };
        
        $ui.stacks.openPanel('Alt.Utilities.BladeFinder', config, events);
    } else {
        self.showStatus('Blade finder not available', 'warning');
    }
};

/**
 * Search blades for a specific rule
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.searchBladesForRule = function(ruleIndex) {
    var self = this;
    
    // Open the BladeFinder blade
    if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
        var rule = self.model.conditionalRules()[ruleIndex];
        
        if (!rule) {
            console.error('Rule not found at index:', ruleIndex);
            return;
        }
        
        var events = {
            onClosed: function(args) {
                console.log('BladeFinder closed for rule with args:', args);
                
                // Handle blade selection
                if (args && args.action === 'Selected' && args.bladeId) {
                    // Set the blade ID for the specific rule
                    rule.targetBlade(args.bladeId);
                    console.log('Set rule targetBlade to:', rule.targetBlade());
                    self.showStatus('Selected blade for rule ' + (ruleIndex + 1) + ': ' + args.bladeId, 'success');
                }
            }
        };
        
        var config = {
            initialSearch: rule.targetBlade() || ''
        };
        
        $ui.stacks.openPanel('Alt.Utilities.BladeFinder', config, events);
    } else {
        self.showStatus('Blade finder not available', 'warning');
    }
};

/**
 * Template loaders
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.loadEditClientTemplate = function() {
    var self = this;
    
    self.model.mode('simple');
    self.model.configName('Quick Edit Client');
    self.model.targetBlade('Sharedo.Core.Case.Panels.Ods.AddEditPerson');
    self.model.autoRedirect(true);
    self.model.redirectDelay(200);
    
    // Add input variables
    self.model.inputVariables([]);
    self.addInputVariable();
    var firstVar = self.model.inputVariables()[0];
    firstVar.key('roleSystemName');
    firstVar.value('client');
    
    // Add target configs
    self.model.targetConfigs([]);
    self.addTargetConfig();
    var config1 = self.model.targetConfigs()[0];
    config1.key('id');
    config1.type('token');
    config1.value('[workItem.roles.{roleSystemName}.ods.id]');
    
    self.addTargetConfig();
    var config2 = self.model.targetConfigs()[1];
    config2.key('sharedoId');
    config2.type('expression');
    config2.value('$[$ui.pageContext.sharedoId()]');
    
    self.showStatus('Template loaded: Edit Client', 'success');
};

Alt.Utilities.BladeBouncerConfigurator.prototype.loadCreateTaskTemplate = function() {
    var self = this;
    
    self.model.mode('advanced');
    self.model.configName('Create Urgent Task');
    self.model.targetBlade('Sharedo.Core.Tasks.CreateTask');
    
    // Clear and add configs
    self.model.targetConfigs([]);
    self.addTargetConfig();
    var config1 = self.model.targetConfigs()[0];
    config1.key('priority');
    config1.type('static');
    config1.value('high');
    
    self.addTargetConfig();
    var config2 = self.model.targetConfigs()[1];
    config2.key('assignedTo');
    config2.type('expression');
    config2.value('$[$ui.pageContext.user.userid()]');
    
    self.addTargetConfig();
    var config3 = self.model.targetConfigs()[2];
    config3.key('dueDate');
    config3.type('expression');
    config3.value('$[formatDate(new Date(Date.now() + 3*24*60*60*1000), "YYYY-MM-DD")]');
    
    self.showStatus('Template loaded: Create Task', 'success');
};

Alt.Utilities.BladeBouncerConfigurator.prototype.loadConditionalOdsTemplate = function() {
    var self = this;
    
    self.model.mode('rules');
    self.model.configName('ODS Type Routing');
    
    // Clear and add rules
    self.model.conditionalRules([]);
    
    // Rule for people
    self.addRule();
    var rule1 = self.model.conditionalRules()[0];
    rule1.path('workItem.roles.client.ods.type.name');
    rule1.operator('equals');
    rule1.value('people');
    rule1.targetBlade('Sharedo.Core.Case.Panels.Ods.AddEditPerson');
    
    // Rule for organisation
    self.addRule();
    var rule2 = self.model.conditionalRules()[1];
    rule2.path('workItem.roles.client.ods.type.name');
    rule2.operator('equals');
    rule2.value('organisation');
    rule2.targetBlade('Sharedo.Core.Case.Panels.Ods.AddEditOrganisation');
    
    self.model.defaultTargetBlade('Sharedo.Core.Case.Panels.Ods.ViewEntity');
    
    self.showStatus('Template loaded: ODS Type Routing', 'success');
};

Alt.Utilities.BladeBouncerConfigurator.prototype.loadDocumentTemplate = function() {
    var self = this;
    
    self.model.mode('advanced');
    self.model.configName('Create Letter from Template');
    self.model.targetBlade('Sharedo.Core.Documents.CreateDocument');
    
    // Add input variables
    self.model.inputVariables([]);
    self.addInputVariable();
    var var1 = self.model.inputVariables()[0];
    var1.key('documentType');
    var1.value('letter');
    
    self.addInputVariable();
    var var2 = self.model.inputVariables()[1];
    var2.key('templateId');
    var2.value('client-correspondence');
    
    // Add target configs
    self.model.targetConfigs([]);
    self.addTargetConfig();
    var config1 = self.model.targetConfigs()[0];
    config1.key('matterId');
    config1.type('token');
    config1.value('[workItem.matter.id]');
    
    self.addTargetConfig();
    var config2 = self.model.targetConfigs()[1];
    config2.key('documentType');
    config2.type('variable');
    config2.value('{documentType}');
    
    self.addTargetConfig();
    var config3 = self.model.targetConfigs()[2];
    config3.key('templateId');
    config3.type('variable');
    config3.value('{templateId}');
    
    self.showStatus('Template loaded: Create Document', 'success');
};

/**
 * Load test workItem context for portal pages
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.loadTestWorkItem = function() {
    var self = this;
    var workItemId = self.model.testWorkItemId();
    
    if (!workItemId) {
        self.showStatus('Please enter a workItem ID', 'warning');
        return;
    }
    
    // Store the test workItem ID for use in configuration generation
    self.testContext = {
        workItemId: workItemId,
        isTestMode: true
    };
    
    self.showStatus('Test context loaded for workItem: ' + workItemId, 'success');
    
    // Log for debugging
    console.log('Test workItem context loaded:', self.testContext);
    
    // Update the UI to show we're in test mode
    self.model.hasWorkItemContext(true); // This will hide the warning
    
    // Note: In a real implementation, you might want to:
    // 1. Validate the workItem ID exists
    // 2. Load actual workItem data via API
    // 3. Store more detailed context information
};

/**
 * Validate configuration before generation
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.validateConfiguration = function() {
    var self = this;
    var errors = [];
    var mode = self.model.mode();
    
    if (mode === 'simple' || mode === 'advanced') {
        if (!self.model.targetBlade()) {
            errors.push('Target blade is required');
        }
    } else if (mode === 'rules') {
        var hasValidRules = false;
        self.model.conditionalRules().forEach(function(rule) {
            if (rule.path() && rule.targetBlade()) {
                hasValidRules = true;
            }
        });
        
        if (!hasValidRules && !self.model.defaultTargetBlade()) {
            errors.push('At least one valid rule or a default blade is required');
        }
    }
    
    // Validate redirect delay
    var delay = self.model.redirectDelay();
    if (delay < 0 || delay > 10000) {
        errors.push('Redirect delay must be between 0 and 10000ms');
    }
    
    return errors;
};

/**
 * Generate configuration JSON
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.generateConfiguration = function() {
    var self = this;
    var config = {};
    
    try {
        // Validate first
        var errors = self.validateConfiguration();
        if (errors.length > 0) {
            return '// Configuration errors:\n// - ' + errors.join('\n// - ');
        }
        
        // Add portal context warning if applicable
        if (!self.model.hasWorkItemContext() && !self.testContext) {
            config._warning = 'Running on portal page without workItem context. Token replacements may not work.';
        }
        
        // Add test context if available
        if (self.testContext) {
            config._testContext = {
                workItemId: self.testContext.workItemId,
                note: 'Using test workItem ID for development'
            };
        }
        
        var mode = self.model.mode();
        
        if (mode === 'simple') {
            // Simple mode configuration
            if (self.model.targetBlade()) {
                config.targetBlade = self.model.targetBlade();
            }
            config.autoRedirect = self.model.autoRedirect();
            config.closeAfterRedirect = self.model.closeAfterRedirect();
            config.debugMode = self.model.debugMode();
            config.redirectDelay = self.model.redirectDelay();
            
        } else if (mode === 'advanced') {
            // Advanced mode configuration
            if (self.model.targetBlade()) {
                config.targetBlade = self.model.targetBlade();
            }
            
            // Process input variables
            var inputConfig = [];
            self.model.inputVariables().forEach(function(variable) {
                if (variable.key() && variable.value()) {
                    var obj = {};
                    obj[variable.key()] = variable.value();
                    inputConfig.push(obj);
                }
            });
            if (inputConfig.length > 0) {
                config.inputConfiguration = inputConfig;
            }
            
            // Process target configs
            var targetConfig = [];
            self.model.targetConfigs().forEach(function(cfg) {
                if (cfg.key() && cfg.value()) {
                    var obj = {};
                    var value = cfg.value();
                    
                    // Format value based on type
                    switch(cfg.type()) {
                        case 'token':
                            if (!value.startsWith('[')) value = '[' + value + ']';
                            break;
                        case 'variable':
                            if (!value.startsWith('{')) value = '{' + value + '}';
                            break;
                        case 'expression':
                            if (!value.startsWith('$[')) value = '$[' + value + ']';
                            break;
                    }
                    
                    obj[cfg.key()] = value;
                    targetConfig.push(obj);
                }
            });
            if (targetConfig.length > 0) {
                config.configForTargetBlade = targetConfig;
            }
            
            // Token sources
            if (self.model.tokenSources().length > 0) {
                config.tokenSources = self.model.tokenSources();
            }
            
            config.autoRedirect = self.model.autoRedirect();
            config.closeAfterRedirect = self.model.closeAfterRedirect();
            config.debugMode = self.model.debugMode();
            config.redirectDelay = self.model.redirectDelay();
            
        } else if (mode === 'rules') {
            // Conditional rules mode
            var rules = [];
            self.model.conditionalRules().forEach(function(rule) {
                if (rule.path() && rule.targetBlade()) {
                    var ruleConfig = {
                        condition: {
                            path: rule.path(),
                            operator: rule.operator()
                        },
                        targetBlade: rule.targetBlade()
                    };
                    
                    // Add value based on operator
                    if (rule.operator() !== 'exists' && rule.operator() !== 'notExists') {
                        if (rule.operator() === 'in' || rule.operator() === 'notIn') {
                            // For array operators, use arrayValues
                            var arrayVals = [];
                            if (rule.arrayValues && rule.arrayValues()) {
                                rule.arrayValues().forEach(function(val) {
                                    var value = ko.isObservable(val) ? val() : val;
                                    if (value) arrayVals.push(value);
                                });
                            }
                            ruleConfig.condition.value = arrayVals.length > 0 ? arrayVals : [rule.value()];
                        } else {
                            // For other operators, use single value
                            ruleConfig.condition.value = rule.value();
                        }
                    }
                    
                    // Add configForTargetBlade if exists
                    if (rule.configForTargetBlade && rule.configForTargetBlade().length > 0) {
                        ruleConfig.configForTargetBlade = rule.configForTargetBlade();
                    }
                    
                    rules.push(ruleConfig);
                }
            });
            
            if (rules.length > 0) {
                config.conditionalRules = rules;
            }
            
            if (self.model.defaultTargetBlade()) {
                config.defaultTargetBlade = self.model.defaultTargetBlade();
            }
            
            // Token sources
            if (self.model.tokenSources().length > 0) {
                config.tokenSources = self.model.tokenSources();
            }
            
            config.autoRedirect = self.model.autoRedirect();
            config.debugMode = self.model.debugMode();
            config.redirectDelay = self.model.redirectDelay();
        }
        
        return JSON.stringify(config, null, 2);
    } catch (e) {
        return '// Error generating configuration: ' + e.message;
    }
};

/**
 * Format JSON in preview
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.formatJson = function() {
    var self = this;
    try {
        var json = JSON.parse(self.model.configurationJson());
        self.model.configurationJson(JSON.stringify(json, null, 2));
        self.showStatus('JSON formatted', 'success');
    } catch (e) {
        self.showStatus('Invalid JSON: ' + e.message, 'error');
    }
};

/**
 * Copy configuration to clipboard
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.copyToClipboard = function() {
    var self = this;
    
    try {
        var configJson = self.model.configurationJson();
        
        // Check if configuration has errors
        if (configJson.indexOf('//') === 0) {
            self.showStatus('Cannot copy - configuration has errors', 'error');
            return;
        }
        
        // Parse and clean the configuration
        var config = JSON.parse(configJson);
        delete config._warning;
        delete config._testContext;
        
        // Format nicely for clipboard
        var cleanJson = JSON.stringify(config, null, 2);
        
        var textarea = document.createElement('textarea');
        textarea.value = cleanJson;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        self.showStatus('Configuration copied to clipboard', 'success');
    } catch (e) {
        self.showStatus('Failed to copy: ' + e.message, 'error');
    }
};

/**
 * Test configuration
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.testConfiguration = function() {
    var self = this;
    
    try {
        // Parse the generated configuration
        var configJson = self.model.configurationJson();
        
        // Remove comments if present
        if (configJson.indexOf('//') === 0) {
            self.showStatus('Please fix configuration errors before testing', 'error');
            return;
        }
        
        var config = JSON.parse(configJson);
        
        // Remove metadata fields
        delete config._warning;
        delete config._testContext;
        
        // If we're on a portal page without workItem context, add test context
        if (!self.model.hasWorkItemContext() && self.testContext) {
            config.testWorkItemId = self.testContext.workItemId;
            config.testMode = true;
            console.log('Adding test context to configuration:', self.testContext);
        }
        
        // Open BladeBouncer with the test configuration
        if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
            config.debugMode = true; // Force debug mode for testing
            
            console.log('Testing BladeBouncer with configuration:', config);
            
            $ui.stacks.openPanel('Alt.Utilities.BladeBouncer', config);
            self.showStatus('Opening BladeBouncer in debug mode...', 'success');
        } else {
            self.showStatus('Cannot test - UI framework not available', 'warning');
        }
    } catch (e) {
        self.showStatus('Invalid configuration: ' + e.message, 'error');
        console.error('Configuration test error:', e);
    }
};

/**
 * Load saved configurations list
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.loadSavedConfigurations = function() {
    var self = this;
    
    try {
        var savedConfigs = JSON.parse(localStorage.getItem('bladeBouncerConfigs') || '{}');
        var configList = Object.keys(savedConfigs).map(function(name) {
            return {
                name: name,
                config: savedConfigs[name],
                created: savedConfigs[name]._savedAt || null
            };
        });
        self.model.savedConfigurations(configList);
    } catch (e) {
        console.error('Failed to load saved configurations:', e);
    }
};

/**
 * Load a specific configuration
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.loadConfiguration = function(configName) {
    var self = this;
    
    try {
        var savedConfigs = JSON.parse(localStorage.getItem('bladeBouncerConfigs') || '{}');
        var config = savedConfigs[configName];
        
        if (!config) {
            self.showStatus('Configuration not found: ' + configName, 'error');
            return;
        }
        
        // Reset current configuration
        self.clearConfiguration(true);
        
        // Load basic settings
        self.model.configName(configName);
        self.model.autoRedirect(config.autoRedirect !== undefined ? config.autoRedirect : true);
        self.model.closeAfterRedirect(config.closeAfterRedirect !== undefined ? config.closeAfterRedirect : true);
        self.model.debugMode(config.debugMode || false);
        self.model.redirectDelay(config.redirectDelay || 500);
        
        // Determine mode and load specific settings
        if (config.conditionalRules && config.conditionalRules.length > 0) {
            // Conditional mode
            self.model.mode('rules');
            
            // Load rules
            config.conditionalRules.forEach(function(rule) {
                self.model.conditionalRules.push({
                    path: ko.observable(rule.condition.path || ''),
                    operator: ko.observable(rule.condition.operator || 'equals'),
                    value: ko.observable(rule.condition.value || ''),
                    valueType: ko.observable('string'),
                    arrayValues: ko.observableArray([]),
                    targetBlade: ko.observable(rule.targetBlade || ''),
                    configForTargetBlade: ko.observableArray(rule.configForTargetBlade || [])
                });
            });
            
            self.model.defaultTargetBlade(config.defaultTargetBlade || '');
            
        } else if (config.inputConfiguration || config.configForTargetBlade) {
            // Advanced mode
            self.model.mode('advanced');
            self.model.targetBlade(config.targetBlade || '');
            
            // Load input variables
            if (config.inputConfiguration) {
                config.inputConfiguration.forEach(function(item) {
                    Object.keys(item).forEach(function(key) {
                        self.model.inputVariables.push({
                            key: ko.observable(key),
                            value: ko.observable(item[key])
                        });
                    });
                });
            }
            
            // Load target configs
            if (config.configForTargetBlade) {
                config.configForTargetBlade.forEach(function(item) {
                    Object.keys(item).forEach(function(key) {
                        var value = item[key];
                        var type = 'static';
                        
                        // Determine type
                        if (typeof value === 'string') {
                            if (value.startsWith('[') && value.endsWith(']')) {
                                type = 'token';
                            } else if (value.startsWith('{') && value.endsWith('}')) {
                                type = 'variable';
                            } else if (value.startsWith('$[')) {
                                type = 'expression';
                            }
                        }
                        
                        self.model.targetConfigs.push({
                            key: ko.observable(key),
                            type: ko.observable(type),
                            value: ko.observable(value)
                        });
                    });
                });
            }
            
        } else {
            // Simple mode
            self.model.mode('simple');
            self.model.targetBlade(config.targetBlade || '');
        }
        
        // Load token sources
        if (config.tokenSources) {
            self.model.tokenSources(config.tokenSources);
        }
        
        self.showStatus('Configuration loaded: ' + configName, 'success');
    } catch (e) {
        self.showStatus('Failed to load configuration: ' + e.message, 'error');
    }
};

/**
 * Delete a saved configuration
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.deleteConfiguration = function(configName) {
    var self = this;
    
    if (!confirm('Delete configuration "' + configName + '"?')) {
        return;
    }
    
    try {
        var savedConfigs = JSON.parse(localStorage.getItem('bladeBouncerConfigs') || '{}');
        delete savedConfigs[configName];
        localStorage.setItem('bladeBouncerConfigs', JSON.stringify(savedConfigs));
        
        // Refresh the list
        self.loadSavedConfigurations();
        
        self.showStatus('Configuration deleted: ' + configName, 'info');
    } catch (e) {
        self.showStatus('Failed to delete: ' + e.message, 'error');
    }
};

/**
 * Save configuration
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.saveConfiguration = function() {
    var self = this;
    
    try {
        // Validate first
        var errors = self.validateConfiguration();
        if (errors.length > 0) {
            self.showStatus('Cannot save - ' + errors[0], 'error');
            return;
        }
        
        var configJson = self.model.configurationJson();
        
        // Check for errors in config
        if (configJson.indexOf('//') === 0) {
            self.showStatus('Cannot save - configuration has errors', 'error');
            return;
        }
        
        var config = JSON.parse(configJson);
        var name = self.model.configName() || 'BladeBouncer_Config_' + Date.now();
        
        // Remove warning metadata but keep configuration
        delete config._warning;
        delete config._testContext;
        
        // Add save metadata
        config._savedAt = new Date().toISOString();
        config._savedMode = self.model.mode();
        
        // Save to local storage
        var savedConfigs = JSON.parse(localStorage.getItem('bladeBouncerConfigs') || '{}');
        savedConfigs[name] = config;
        localStorage.setItem('bladeBouncerConfigs', JSON.stringify(savedConfigs));
        
        // Update the saved config name
        self.model.configName(name);
        
        // Refresh the list
        self.loadSavedConfigurations();
        
        self.showStatus('Configuration saved: ' + name, 'success');
    } catch (e) {
        self.showStatus('Failed to save: ' + e.message, 'error');
        console.error('Save error:', e);
    }
};

/**
 * Export configuration as JSON file
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.exportConfiguration = function() {
    var self = this;
    
    try {
        var config = self.model.configurationJson();
        var name = self.model.configName() || 'bladebouncer-config';
        var filename = name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
        
        var blob = new Blob([config], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        self.showStatus('Configuration exported as ' + filename, 'success');
    } catch (e) {
        self.showStatus('Failed to export: ' + e.message, 'error');
    }
};

/**
 * Clear configuration
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.clearConfiguration = function(skipConfirm) {
    var self = this;
    
    if (!skipConfirm && !confirm('Clear all configuration settings?')) {
        return;
    }
    self.model.configName('');
    self.model.targetBlade('');
    self.model.inputVariables([]);
    self.model.targetConfigs([]);
    self.model.conditionalRules([]);
    self.model.defaultTargetBlade('');
    self.model.tokenSources(['workItem']);
    self.model.autoRedirect(true);
    self.model.closeAfterRedirect(true);
    self.model.debugMode(false);
    self.model.redirectDelay(500);
    
    if (!skipConfirm) {
        self.showStatus('Configuration cleared', 'info');
    }
};

/**
 * Show status message
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.showStatus = function(message, type) {
    var self = this;
    
    self.model.statusMessage(message);
    self.model.statusClass('status-' + type);
    
    // Auto-hide after 3 seconds for non-error messages
    var timeout = type === 'error' ? 5000 : 3000;
    
    if (self.statusTimeout) {
        clearTimeout(self.statusTimeout);
    }
    
    self.statusTimeout = setTimeout(function() {
        self.model.statusMessage('');
        self.model.statusClass('');
    }, timeout);
};

/**
 * Initialize on load
 */
Alt.Utilities.BladeBouncerConfigurator.prototype.loadAndBind = function() {
    var self = this;
    
    console.log('BladeBouncer Configurator initializing...');
    
    // Load saved configurations list
    self.loadSavedConfigurations();
    
    // Initialize blade suggestions (already done in constructor)
    // self.model.bladeSuggestions(self.commonBlades);
    
    // Auto-load if configuration is passed
    if (self.configuration && self.configuration.loadConfig) {
        self.loadConfiguration(self.configuration.loadConfig);
    }
    
    // Check if we should start with a specific mode
    if (self.configuration && self.configuration.startMode) {
        self.model.mode(self.configuration.startMode);
    }
    
    // Show welcome message
    var contextMsg = self.model.hasWorkItemContext() ? 
        'BladeBouncer Configurator ready (WorkItem context available)' : 
        'BladeBouncer Configurator ready (Portal page context)';
    
    self.showStatus(contextMsg, 'info');
};