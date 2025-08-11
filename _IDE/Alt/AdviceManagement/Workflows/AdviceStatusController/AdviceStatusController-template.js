/*
AdviceStatusController - Workflow Template
Generates the runtime code for the advice status controller workflow action
*/

(function() {
    // This template generates the actual workflow step code
    var generateCode = function(step) {
        var config = step.config || {};
        
        // Build variable mappings
        var mappings = {
            workItemId: config.workItemIdVariable ? config.workItemIdVariable() : null,
            pauseReason: config.pauseReasonVariable ? config.pauseReasonVariable() : null,
            actionTaken: config.actionTakenVariable ? config.actionTakenVariable() : null,
            previousStatus: config.previousStatusVariable ? config.previousStatusVariable() : null,
            currentStatus: config.currentStatusVariable ? config.currentStatusVariable() : null,
            success: config.successVariable ? config.successVariable() : null,
            errorMessage: config.errorMessageVariable ? config.errorMessageVariable() : null,
            pausedDate: config.pausedDateVariable ? config.pausedDateVariable() : null,
            resumedDate: config.resumedDateVariable ? config.resumedDateVariable() : null,
            lastActionDate: config.lastActionDateVariable ? config.lastActionDateVariable() : null
        };

        // Generate the workflow step code
        return [
            "// AdviceStatusController workflow step",
            "try {",
            "    // Log workflow step initialization",
            "    if (typeof log !== 'undefined' && log.Information) {",
            "        log.Information('AdviceStatusController - Starting workflow step for Work Item: ' + " + (mappings.workItemId ? "ctx.getValue('" + mappings.workItemId + "')" : "ctx.workItemId") + ");",
            "        log.Information('  Step Configuration:');",
            "        log.Information('    defaultAction: " + JSON.stringify(config.defaultAction ? config.defaultAction() : "checkOnly") + "');",
            "        log.Information('    conditions: " + JSON.stringify(config.conditions ? config.conditions() : []) + "');",
            "        log.Information('    pauseReason: ' + " + (mappings.pauseReason ? "ctx.getValue('" + mappings.pauseReason + "')" : "'Workflow automated pause'") + ");",
            "        log.Information('    requireConfirmation: " + JSON.stringify(config.requireConfirmation ? config.requireConfirmation() : false) + "');",
            "    }",
            "",
            "    var adviceController = new Alt.AdviceManagement.AdviceStatusController(",
            "        ctx, // workflow context",
            "        {",
            "            defaultAction: " + JSON.stringify(config.defaultAction ? config.defaultAction() : "checkOnly") + ",",
            "            conditions: " + JSON.stringify(config.conditions ? config.conditions() : []) + ",",
            "            pauseReason: " + (mappings.pauseReason ? "ctx.getValue('" + mappings.pauseReason + "')" : "'Workflow automated pause'") + ",",
            "            requireConfirmation: " + JSON.stringify(config.requireConfirmation ? config.requireConfirmation() : false) + ",",
            "            enableLogging: true,",
            "            retryOnFailure: true,",
            "            maxRetries: 3,",
            "            retryDelay: 1000,",
            "            timeout: 30000",
            "        },",
            "        function(result) {",
            "            // Log workflow step completion before mapping variables",
            "            if (typeof log !== 'undefined' && log.Information) {",
            "                log.Information('AdviceStatusController - Workflow step completed, mapping outputs to variables for Work Item: ' + " + (mappings.workItemId ? "ctx.getValue('" + mappings.workItemId + "')" : "ctx.workItemId") + ");",
            "                log.Information('  Result branch: ' + result.branch);",
            "                log.Information('  Result outputs: ' + JSON.stringify(result.outputs));",
            "            }",
            "",
            "            // Map outputs to workflow variables",
            mappings.actionTaken ? "            if (result.outputs.actionTaken) { ctx.setValue('" + mappings.actionTaken + "', result.outputs.actionTaken); if (typeof log !== 'undefined' && log.Information) log.Information('  \u2192 Mapped actionTaken: ' + result.outputs.actionTaken + ' to variable: " + mappings.actionTaken + "'); }" : "",
            mappings.previousStatus ? "            if (result.outputs.previousStatus) { ctx.setValue('" + mappings.previousStatus + "', result.outputs.previousStatus); if (typeof log !== 'undefined' && log.Information) log.Information('  \u2192 Mapped previousStatus: ' + result.outputs.previousStatus + ' to variable: " + mappings.previousStatus + "'); }" : "",
            mappings.currentStatus ? "            if (result.outputs.currentStatus) { ctx.setValue('" + mappings.currentStatus + "', result.outputs.currentStatus); if (typeof log !== 'undefined' && log.Information) log.Information('  \u2192 Mapped currentStatus: ' + result.outputs.currentStatus + ' to variable: " + mappings.currentStatus + "'); }" : "",
            mappings.success ? "            ctx.setValue('" + mappings.success + "', result.outputs.success); if (typeof log !== 'undefined' && log.Information) log.Information('  \u2192 Mapped success: ' + result.outputs.success + ' to variable: " + mappings.success + "');" : "",
            mappings.errorMessage ? "            if (result.outputs.message) { ctx.setValue('" + mappings.errorMessage + "', result.outputs.message); if (typeof log !== 'undefined' && log.Information) log.Information('  \u2192 Mapped errorMessage: ' + result.outputs.message + ' to variable: " + mappings.errorMessage + "'); }" : "",
            mappings.pausedDate ? "            if (result.outputs.pausedDate) { ctx.setValue('" + mappings.pausedDate + "', result.outputs.pausedDate); if (typeof log !== 'undefined' && log.Information) log.Information('  \u2192 Mapped pausedDate: ' + result.outputs.pausedDate + ' to variable: " + mappings.pausedDate + " (DateTime)'); }" : "",
            mappings.resumedDate ? "            if (result.outputs.resumedDate) { ctx.setValue('" + mappings.resumedDate + "', result.outputs.resumedDate); if (typeof log !== 'undefined' && log.Information) log.Information('  \u2192 Mapped resumedDate: ' + result.outputs.resumedDate + ' to variable: " + mappings.resumedDate + " (DateTime)'); }" : "",
            mappings.lastActionDate ? "            if (result.outputs.lastActionDate) { ctx.setValue('" + mappings.lastActionDate + "', result.outputs.lastActionDate); if (typeof log !== 'undefined' && log.Information) log.Information('  \u2192 Mapped lastActionDate: ' + result.outputs.lastActionDate + ' to variable: " + mappings.lastActionDate + " (DateTime)'); }" : "",
            "            ",
            "            // Log final step before branching",
            "            if (typeof log !== 'undefined' && log.Information) {",
            "                log.Information('AdviceStatusController - Variable mapping completed, taking branch: ' + result.branch);",
            "            }",
            "            ",
            "            // Take the appropriate branch based on result",
            "            ctx.gotoOutlet('" + step.stepId + "', result.branch);",
            "        }",
            "    );",
            "} catch (ex) {",
            "    log.Error('AdviceStatusController workflow step failed: {Error}', ex.message);",
            mappings.success ? "    ctx.setValue('" + mappings.success + "', false);" : "",
            mappings.errorMessage ? "    ctx.setValue('" + mappings.errorMessage + "', ex.message);" : "",
            "    ctx.gotoOutlet('" + step.stepId + "', 'error');",
            "}"
        ].filter(line => line.trim() !== "").join("\n");
    };

    // Export the template function
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = generateCode;
    } else if (typeof window !== 'undefined') {
        window.AdviceStatusControllerTemplate = generateCode;
    }

    return generateCode;
})();