/**
 * AdviceResumeManager Template
 * 
 * Code generation template for AdviceResumeManager workflow action nodes
 * in the visual workflow designer.
 */
(function() {
    'use strict';

    // Ensure namespace exists
    if (typeof Alt === 'undefined') Alt = {};
    if (typeof Alt.AdviceManagement === 'undefined') Alt.AdviceManagement = {};
    if (typeof Alt.AdviceManagement.Workflows === 'undefined') Alt.AdviceManagement.Workflows = {};

    /**
     * Template function for generating AdviceResumeManager workflow code
     * @param {Object} node - The workflow node model
     * @param {Object} workflowModel - The overall workflow model
     * @returns {string} - Generated JavaScript code
     */
    Alt.AdviceManagement.Workflows.AdviceResumeManagerTemplate = function(node, workflowModel) {
        var code = [];
        
        // Add header comment
        code.push("// AdviceResumeManager - " + (node.name || 'Advice Resume Manager'));
        code.push("// Node ID: " + node.id);
        code.push("");
        
        // Initialize logging
        code.push("// Initialize logging");
        if (node.config.enableLogging && node.config.enableLogging()) {
            code.push("if (typeof log !== 'undefined' && log.Information) {");
            code.push("    log.Information('AdviceResumeManager - STARTING resume operation');");
            code.push("    log.Information('  Node ID: " + node.id + "');");
            code.push("    log.Information('  Work Item ID: ' + " + getVariableName(node.ui.workItemIdVariable) + ");");
            code.push("}");
        }
        code.push("");
        
        // Variable declarations
        code.push("// Variable declarations");
        code.push("var workItemId = " + getVariableName(node.ui.workItemIdVariable) + ";");
        
        if (node.ui.newDueDateVariable.value()) {
            code.push("var newDueDate = " + getVariableName(node.ui.newDueDateVariable) + ";");
        }
        
        if (node.ui.resumeReasonVariable.value()) {
            code.push("var resumeReason = " + getVariableName(node.ui.resumeReasonVariable) + ";");
        } else {
            code.push("var resumeReason = 'Advice resumed by workflow';");
        }
        
        code.push("");
        
        // Validation
        code.push("// Input validation");
        code.push("if (!workItemId) {");
        code.push("    var errorMessage = 'Work Item ID is required for resume operation';");
        if (node.config.enableLogging && node.config.enableLogging()) {
            code.push("    if (typeof log !== 'undefined' && log.Error) {");
            code.push("        log.Error('AdviceResumeManager - ERROR: ' + errorMessage);");
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
        code.push("var resumeConfig = {");
        code.push("    workItemId: workItemId,");
        code.push("    resumeReason: resumeReason,");
        
        if (node.ui.newDueDateVariable.value()) {
            code.push("    newDueDate: newDueDate,");
        }
        
        code.push("    useWorkflowApproach: " + (node.config.useWorkflowApproach() ? 'true' : 'false') + ",");
        code.push("    abstractAdviceTypeSystemName: '" + (node.config.abstractAdviceTypeSystemName() || 'AbstractAdvice') + "',");
        code.push("    defaultAdviceTypeSystemName: '" + (node.config.defaultAdviceTypeSystemName() || 'StandardAdvice') + "',");
        code.push("    preserveOriginalDates: " + (node.config.preserveOriginalDates() ? 'true' : 'false') + ",");
        code.push("    defaultAdviceOffsetDays: " + (node.config.defaultAdviceOffsetDays() || 30) + ",");
        code.push("    createDefaultIfNoSavedState: " + (node.config.createDefaultIfNoSavedState() ? 'true' : 'false') + ",");
        code.push("    clearSavedStateAfterRestore: " + (node.config.clearSavedStateAfterRestore() ? 'true' : 'false') + ",");
        code.push("    enableLogging: " + (node.config.enableLogging() ? 'true' : 'false') + ",");
        code.push("    enableRetry: " + (node.config.enableRetry() ? 'true' : 'false') + ",");
        code.push("    maxRetries: " + (node.config.maxRetries() || 3) + ",");
        code.push("    retryDelay: " + (node.config.retryDelay() || 1000) + ",");
        code.push("    timeout: " + (node.config.timeout() || 60000));
        code.push("};");
        code.push("");
        
        // Resume operation
        code.push("// Execute resume operation");
        code.push("try {");
        code.push("    // Check if AdviceResumeManager action is available");
        code.push("    if (typeof Alt !== 'undefined' && Alt.AdviceManagement && Alt.AdviceManagement.AdviceResumeManager) {");
        code.push("        Alt.AdviceManagement.AdviceResumeManager(resumeConfig, function(result) {");
        
        // Handle results
        code.push("            // Process results");
        if (node.config.enableLogging && node.config.enableLogging()) {
            code.push("            if (typeof log !== 'undefined' && log.Information) {");
            code.push("                log.Information('AdviceResumeManager - COMPLETED with result: ' + JSON.stringify(result));");
            code.push("            }");
        }
        
        // Set output variables
        if (node.ui.successVariable.value()) {
            code.push("            " + getVariableName(node.ui.successVariable) + " = result.success || false;");
        }
        if (node.ui.messageVariable.value()) {
            code.push("            " + getVariableName(node.ui.messageVariable) + " = result.message || '';");
        }
        if (node.ui.restoredCountVariable.value()) {
            code.push("            " + getVariableName(node.ui.restoredCountVariable) + " = result.restoredAdviceCount || 0;");
        }
        if (node.ui.createdCountVariable.value()) {
            code.push("            " + getVariableName(node.ui.createdCountVariable) + " = result.createdAdviceCount || 0;");
        }
        if (node.ui.resumedDateVariable.value()) {
            code.push("            " + getVariableName(node.ui.resumedDateVariable) + " = result.resumedDate || null;");
        }
        if (node.ui.errorCountVariable.value()) {
            code.push("            " + getVariableName(node.ui.errorCountVariable) + " = result.errorCount || 0;");
        }
        
        // Branch logic
        code.push("            // Determine workflow branch");
        code.push("            if (result.success) {");
        code.push("                if (result.restoredAdviceCount > 0) {");
        code.push("                    workflow.branch('restored');");
        code.push("                } else if (result.createdAdviceCount > 0) {");
        code.push("                    workflow.branch('created');");
        code.push("                } else if (result.alreadyActive) {");
        code.push("                    workflow.branch('noAction');");
        code.push("                } else {");
        code.push("                    workflow.branch('success');");
        code.push("                }");
        code.push("            } else {");
        code.push("                workflow.branch('error');");
        code.push("            }");
        code.push("        });");
        
        // Service not available fallback
        code.push("    } else {");
        code.push("        var errorMessage = 'AdviceResumeManager service is not available';");
        if (node.config.enableLogging && node.config.enableLogging()) {
            code.push("        if (typeof log !== 'undefined' && log.Error) {");
            code.push("            log.Error('AdviceResumeManager - ERROR: ' + errorMessage);");
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
        code.push("    var errorMessage = 'Exception in AdviceResumeManager: ' + (error.message || error);");
        if (node.config.enableLogging && node.config.enableLogging()) {
            code.push("    if (typeof log !== 'undefined' && log.Error) {");
            code.push("        log.Error('AdviceResumeManager - EXCEPTION: ' + errorMessage);");
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