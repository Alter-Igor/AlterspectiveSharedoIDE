/**
 * AdvicePauseManager Template
 * 
 * Code generation template for AdvicePauseManager workflow action nodes
 * in the visual workflow designer.
 */
(function() {
    'use strict';

    // Ensure namespace exists
    if (typeof Alt === 'undefined') Alt = {};
    if (typeof Alt.AdviceManagement === 'undefined') Alt.AdviceManagement = {};
    if (typeof Alt.AdviceManagement.Workflows === 'undefined') Alt.AdviceManagement.Workflows = {};

    /**
     * Template function for generating AdvicePauseManager workflow code
     * @param {Object} node - The workflow node model
     * @param {Object} workflowModel - The overall workflow model
     * @returns {string} - Generated JavaScript code
     */
    Alt.AdviceManagement.Workflows.AdvicePauseManagerTemplate = function(node, workflowModel) {
        var code = [];
        
        // Add header comment
        code.push("// AdvicePauseManager - " + (node.name || 'Advice Pause Manager'));
        code.push("// Node ID: " + node.id);
        code.push("");
        
        // Initialize logging
        code.push("// Initialize logging");
        if (node.config.enableLogging && node.config.enableLogging()) {
            code.push("if (typeof log !== 'undefined' && log.Information) {");
            code.push("    log.Information('AdvicePauseManager - STARTING pause operation');");
            code.push("    log.Information('  Node ID: " + node.id + "');");
            code.push("    log.Information('  Work Item ID: ' + " + getVariableName(node.ui.workItemIdVariable) + ");");
            code.push("}");
        }
        code.push("");
        
        // Variable declarations
        code.push("// Variable declarations");
        code.push("var workItemId = " + getVariableName(node.ui.workItemIdVariable) + ";");
        
        if (node.ui.pauseReasonVariable.value()) {
            code.push("var pauseReason = " + getVariableName(node.ui.pauseReasonVariable) + ";");
        } else {
            code.push("var pauseReason = 'Advice paused by workflow';");
        }
        
        code.push("");
        
        // Validation
        code.push("// Input validation");
        code.push("if (!workItemId) {");
        code.push("    var errorMessage = 'Work Item ID is required for pause operation';");
        if (node.config.enableLogging && node.config.enableLogging()) {
            code.push("    if (typeof log !== 'undefined' && log.Error) {");
            code.push("        log.Error('AdvicePauseManager - ERROR: ' + errorMessage);");
            code.push("    }");
        }
        
        // Set error output variables
        if (node.ui.successVariable.value()) {
            code.push("    " + getVariableName(node.ui.successVariable) + " = false;");
        }
        if (node.ui.messageVariable.value()) {
            code.push("    " + getVariableName(node.ui.messageVariable) + " = errorMessage;");
        }
        
        code.push("    workflow.branch('error');");
        code.push("    return;");
        code.push("}");
        code.push("");
        
        // Configuration object
        code.push("// Configuration");
        code.push("var pauseConfig = {");
        code.push("    workItemId: workItemId,");
        code.push("    pauseReason: pauseReason,");
        code.push("    useWorkflowApproach: " + (node.config.useWorkflowApproach() ? 'true' : 'false') + ",");
        code.push("    abstractAdviceTypeSystemName: '" + (node.config.abstractAdviceTypeSystemName() || 'AbstractAdvice') + "',");
        code.push("    pausedPhase: '" + (node.config.pausedPhase() || 'Removed') + "',");
        code.push("    saveAdviceState: " + (node.config.saveAdviceState() ? 'true' : 'false') + ",");
        code.push("    overwriteExistingSavedState: " + (node.config.overwriteExistingSavedState() ? 'true' : 'false') + ",");
        code.push("    pauseAllAdviceTypes: " + (node.config.pauseAllAdviceTypes() ? 'true' : 'false') + ",");
        code.push("    includeInactiveAdvice: " + (node.config.includeInactiveAdvice() ? 'true' : 'false') + ",");
        code.push("    enableLogging: " + (node.config.enableLogging() ? 'true' : 'false') + ",");
        code.push("    enableRetry: " + (node.config.enableRetry() ? 'true' : 'false') + ",");
        code.push("    maxRetries: " + (node.config.maxRetries() || 3) + ",");
        code.push("    retryDelay: " + (node.config.retryDelay() || 1000) + ",");
        code.push("    timeout: " + (node.config.timeout() || 60000));
        code.push("};");
        code.push("");
        
        // Pause operation
        code.push("// Execute pause operation");
        code.push("try {");
        code.push("    // Check if AdvicePauseManager action is available");
        code.push("    if (typeof Alt !== 'undefined' && Alt.AdviceManagement && Alt.AdviceManagement.AdvicePauseManager) {");
        code.push("        Alt.AdviceManagement.AdvicePauseManager(pauseConfig, function(result) {");
        
        // Handle results
        code.push("            // Process results");
        if (node.config.enableLogging && node.config.enableLogging()) {
            code.push("            if (typeof log !== 'undefined' && log.Information) {");
            code.push("                log.Information('AdvicePauseManager - COMPLETED with result: ' + JSON.stringify(result));");
            code.push("            }");
        }
        
        // Set output variables
        if (node.ui.successVariable.value()) {
            code.push("            " + getVariableName(node.ui.successVariable) + " = result.success || false;");
        }
        if (node.ui.messageVariable.value()) {
            code.push("            " + getVariableName(node.ui.messageVariable) + " = result.message || '';");
        }
        if (node.ui.foundAdviceCountVariable.value()) {
            code.push("            " + getVariableName(node.ui.foundAdviceCountVariable) + " = result.foundAdviceCount || 0;");
        }
        if (node.ui.pausedAdviceCountVariable.value()) {
            code.push("            " + getVariableName(node.ui.pausedAdviceCountVariable) + " = result.pausedAdviceCount || 0;");
        }
        if (node.ui.savedStateVariable.value()) {
            code.push("            " + getVariableName(node.ui.savedStateVariable) + " = result.savedState || false;");
        }
        if (node.ui.pausedDateVariable.value()) {
            code.push("            " + getVariableName(node.ui.pausedDateVariable) + " = result.pausedDate || null;");
        }
        if (node.ui.errorCountVariable.value()) {
            code.push("            " + getVariableName(node.ui.errorCountVariable) + " = result.errorCount || 0;");
        }
        
        // Branch logic
        code.push("            // Determine workflow branch");
        code.push("            if (result.success) {");
        code.push("                if (result.pausedAdviceCount > 0) {");
        code.push("                    workflow.branch('paused');");
        code.push("                } else if (result.foundAdviceCount === 0) {");
        code.push("                    workflow.branch('noAdvice');");
        code.push("                } else if (result.alreadyPaused) {");
        code.push("                    workflow.branch('alreadyPaused');");
        code.push("                } else {");
        code.push("                    workflow.branch('success');");
        code.push("                }");
        code.push("            } else {");
        code.push("                workflow.branch('error');");
        code.push("            }");
        code.push("        });");
        
        // Service not available fallback
        code.push("    } else {");
        code.push("        var errorMessage = 'AdvicePauseManager service is not available';");
        if (node.config.enableLogging && node.config.enableLogging()) {
            code.push("        if (typeof log !== 'undefined' && log.Error) {");
            code.push("            log.Error('AdvicePauseManager - ERROR: ' + errorMessage);");
            code.push("        }");
        }
        
        // Set error variables for service unavailable
        if (node.ui.successVariable.value()) {
            code.push("        " + getVariableName(node.ui.successVariable) + " = false;");
        }
        if (node.ui.messageVariable.value()) {
            code.push("        " + getVariableName(node.ui.messageVariable) + " = errorMessage;");
        }
        
        code.push("        workflow.branch('error');");
        code.push("    }");
        
        // Exception handling
        code.push("} catch (error) {");
        code.push("    var errorMessage = 'Exception in AdvicePauseManager: ' + (error.message || error);");
        if (node.config.enableLogging && node.config.enableLogging()) {
            code.push("    if (typeof log !== 'undefined' && log.Error) {");
            code.push("        log.Error('AdvicePauseManager - EXCEPTION: ' + errorMessage);");
            code.push("    }");
        }
        
        // Set exception variables
        if (node.ui.successVariable.value()) {
            code.push("    " + getVariableName(node.ui.successVariable) + " = false;");
        }
        if (node.ui.messageVariable.value()) {
            code.push("    " + getVariableName(node.ui.messageVariable) + " = errorMessage;");
        }
        
        code.push("    workflow.branch('error');");
        code.push("}");
        
        return code.join('\n');
    };
    
    /**
     * Helper function to get variable name from UI component
     * @param {Object} variableComponent - UI component for variable selection
     * @returns {string} - Variable name or default value
     */
    function getVariableName(variableComponent) {
        if (variableComponent && variableComponent.value && variableComponent.value()) {
            var variable = variableComponent.value();
            return variable.name || variable.id || 'null';
        }
        return 'null';
    }

})();